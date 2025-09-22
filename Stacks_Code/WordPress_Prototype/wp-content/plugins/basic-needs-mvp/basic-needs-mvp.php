<?php

if (!defined('ABSPATH')) exit;

class BasicNeedsMVP {
  public function __construct() {
    add_action('init', [$this, 'register_roles']);
    add_action('init', [$this, 'register_cpts']);
    add_action('rest_api_init', [$this, 'register_routes']);
  }

  public function register_roles() {
    // Roles: member, beneficiary
    if (!get_role('member')) {
      add_role('member', 'Member', ['read' => true]);
    }
    if (!get_role('beneficiary')) {
      add_role('beneficiary', 'Beneficiary', ['read' => true]);
    }
  }

  public function register_cpts() {
    // Post type: item
    register_post_type('item', [
      'label' => 'Items',
      'public' => true,
      'show_in_rest' => true,
      'supports' => ['title','editor','author','custom-fields'],
      'capability_type' => 'post'
    ]);

    register_post_type('transaction', [
      'label' => 'Transactions',
      'public' => false,
      'show_ui' => true, 
      'show_in_rest' => true,
      'supports' => ['title','author','custom-fields'],
      'capability_type' => 'post'
    ]);
  }

  public function register_routes() {
    register_rest_route('mvp/v1', '/items', [
      [
        'methods'  => 'GET',
        'callback' => [$this, 'get_items'],
        'permission_callback' => '__return_true'
      ],
      [
        'methods'  => 'POST',
        'callback' => [$this, 'create_item'],
        'permission_callback' => function() { return is_user_logged_in(); }
      ],
    ]);

    register_rest_route('mvp/v1', '/transactions', [
      [
        'methods'  => 'POST',
        'callback' => [$this, 'create_transaction'],
        'permission_callback' => function() { return is_user_logged_in(); }
      ]
    ]);

    // check the current user's balance
    register_rest_route('mvp/v1', '/me/balance', [
      [
        'methods'  => 'GET',
        'callback' => function($request) {
          if (!is_user_logged_in()) {
            return new WP_Error('unauthorized', 'Login required', ['status' => 401]);
          }
          $u = wp_get_current_user();
          return rest_ensure_response([
            'user_id' => $u->ID,
            'balance' => $this->get_balance($u->ID),
          ]);
        },
        'permission_callback' => '__return_true'
      ]
    ]);

    // transfer token
    register_rest_route('mvp/v1', '/transfer', [
      [
        'methods'  => 'POST',
        'callback' => function($request) {
          if (!is_user_logged_in()) {
            return new WP_Error('unauthorized', 'Login required', ['status' => 401]);
          }
          $sender = wp_get_current_user();

          $to = $request->get_param('to');
          $amount = intval($request->get_param('amount'));
          $note = sanitize_text_field($request->get_param('note') ?? '');

          if (!$to || $amount <= 0) {
            return new WP_Error('invalid_params', 'to and positive amount are required', ['status' => 400]);
          }

          $receiver = $this->find_user_by_login_or_email($to);
          if (!$receiver) {
            return new WP_Error('no_user', 'Receiver not found', ['status' => 404]);
          }
          if ($receiver->ID === $sender->ID) {
            return new WP_Error('same_user', 'Cannot transfer to yourself', ['status' => 400]);
          }

          // check balance
          $sender_bal = $this->get_balance($sender->ID);
          if ($sender_bal < $amount) {
            return new WP_Error('insufficient', 'Insufficient balance', ['status' => 400, 'balance' => $sender_bal]);
          }

          // update balance
          $this->set_balance($sender->ID, $sender_bal - $amount);
          $receiver_bal = $this->get_balance($receiver->ID);
          $this->set_balance($receiver->ID, $receiver_bal + $amount);

          // save a transaction record
          $title = sprintf('TX %d -> %d : %d', $sender->ID, $receiver->ID, $amount);
          $tx_id = wp_insert_post([
            'post_type'   => 'transaction',
            'post_title'  => $title,
            'post_status' => 'publish',
            'post_author' => $sender->ID
          ]);
          if (!is_wp_error($tx_id)) {
            update_post_meta($tx_id, 'from_user_id', $sender->ID);
            update_post_meta($tx_id, 'to_user_id', $receiver->ID);
            update_post_meta($tx_id, 'amount', $amount);
            if ($note) update_post_meta($tx_id, 'note', $note);
            update_post_meta($tx_id, 'sender_balance_after', $this->get_balance($sender->ID));
            update_post_meta($tx_id, 'receiver_balance_after', $this->get_balance($receiver->ID));
          }

          return rest_ensure_response([
            'ok' => true,
            'tx_id' => is_wp_error($tx_id) ? null : $tx_id,
            'from' => ['user_id' => $sender->ID, 'balance' => $this->get_balance($sender->ID)],
            'to'   => ['user_id' => $receiver->ID, 'balance' => $this->get_balance($receiver->ID)],
          ]);
        },
        'permission_callback' => '__return_true'
      ]
    ]);
  }

  // Get user's current token balance
  private function get_balance($user_id) {
    // get token_balance from user meta
    $bal = get_user_meta($user_id, 'token_balance', true);
    // if empty, set to 0
    if ($bal === '' || $bal === null) $bal = 0;
    return intval($bal);
  }

  // set user's token balance
  private function set_balance($user_id, $new_balance) {
    // write (update) new balance to user meta
    update_user_meta($user_id, 'token_balance', intval($new_balance));
  }

  // find user by login or email
  private function find_user_by_login_or_email($value) {
    // clean input
    $value = trim(sanitize_text_field($value));

    if (filter_var($value, FILTER_VALIDATE_EMAIL)) {
      // if email
      $user = get_user_by('email', $value);
    } else {
      // otherwise, find by login
      $user = get_user_by('login', $value);
      if (!$user) {
        // try to find by display name/slug
        $user = get_user_by('slug', sanitize_title($value));
      }
    }
    // if not found, return null
    return $user ?: null;
  }


  // === Handlers ===
  // Handle REST API request: Get all items from database
  public function get_items($request) {
    // Use WP_Query to query custom custom type item
    $q = new WP_Query([
      'post_type' => 'item',
      'post_status' => 'publish',
      'posts_per_page' => 50
    ]);
    $data = [];
    foreach ($q->posts as $p) {
      $data[] = [
        // Custom fields
        'id' => $p->ID,
        'title' => get_the_title($p),
        'category' => get_post_meta($p->ID, 'category', true),
        'quantity' => get_post_meta($p->ID, 'quantity', true),
        'price'  => get_post_meta($p->ID, 'price', true),
        'author' => get_the_author_meta('display_name', $p->post_author),
        'description' => apply_filters('the_content', $p->post_content),
      ];
    }
    return rest_ensure_response($data);
  }

  public function create_item($request) {
    $user = wp_get_current_user();
    $title = sanitize_text_field($request->get_param('title') ?? 'Untitled');
    $content = wp_kses_post($request->get_param('content') ?? '');
    $price = floatval($request->get_param('price') ?? 0);
    $quantity = intval($request->get_param('quantity') ?? 1);

    $post_id = wp_insert_post([
      'post_type'   => 'item',
      'post_title'  => $title,
      'post_content'=> $content,
      'post_status' => 'publish',
      'post_author' => $user->ID
    ]);
    if (is_wp_error($post_id)) {
      return new WP_Error('create_failed', 'Failed to create item', ['status' => 500]);
    }

    update_post_meta($post_id, 'price', $price);
    update_post_meta($post_id, 'quantity', $quantity);

    return rest_ensure_response(['ok' => true, 'id' => $post_id]);
  }

  public function create_transaction($request) {
    $user = wp_get_current_user();
    $to_user_id = intval($request->get_param('to_user_id'));
    $amount = intval($request->get_param('amount'));

    if ($to_user_id <= 0 || $amount <= 0) {
      return new WP_Error('invalid_params', 'to_user_id and amount are required', ['status' => 400]);
    }
    if ($to_user_id === $user->ID) {
      return new WP_Error('invalid_params', 'sender and receiver cannot be the same', ['status' => 400]);
    }

    $title = sprintf('TX: %s -> %s (%d)',
      $user->user_login,
      get_userdata($to_user_id)->user_login ?? 'unknown',
      $amount
    );

    $tx_id = wp_insert_post([
      'post_type'   => 'transaction',
      'post_title'  => $title,
      'post_status' => 'publish',
      'post_author' => $user->ID
    ]);

    if (is_wp_error($tx_id)) {
      return new WP_Error('create_failed', 'Failed to create transaction', ['status' => 500]);
    }

    update_post_meta($tx_id, 'from_user_id', $user->ID);
    update_post_meta($tx_id, 'to_user_id', $to_user_id);
    update_post_meta($tx_id, 'amount', $amount);

    return rest_ensure_response(['ok' => true, 'tx_id' => $tx_id]);
  }
}

add_action('wp_head', function () {
  if (is_user_logged_in()) {
    echo '<script>window.MVP_NONCE = "'. esc_js( wp_create_nonce('wp_rest') ) .'";</script>';
  }
});

// new user initial balance
add_action('user_register', function($user_id) {
  if (get_user_meta($user_id, 'token_balance', true) === '') {
    update_user_meta($user_id, 'token_balance', 100);
  }
});


new BasicNeedsMVP();
