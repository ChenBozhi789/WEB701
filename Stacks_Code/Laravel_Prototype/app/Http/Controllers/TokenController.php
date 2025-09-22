<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class TokenController extends Controller
{
    // return current user's token balance
    public function balance(Request $request)
    {
        $user = $request->user();
        // return the balance
        return response()->json([
            'balance' => $user->token_balance ?? 0,
        ]);
    }
}
