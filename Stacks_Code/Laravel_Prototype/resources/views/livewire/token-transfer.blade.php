<div x-data="transferApp()" class="max-w-md mx-auto space-y-3">
  <h2 class="font-bold text-xl">Token Transfer (JWT)</h2>

  <!-- JWT login to get Token -->
  <div class="border p-3 space-y-2">
    <input class="border p-2 w-full" placeholder="Email" x-model="email">
    <input class="border p-2 w-full" placeholder="Password" type="password" x-model="password">
    <button class="px-3 py-2 bg-black text-white" @click="getToken()">Get JWT</button>
    <div class="text-xs break-all">Token: <span x-text="token || 'N/A'"></span></div>
  </div>

  <!-- Query balance -->
  <div class="border p-3">
    <button class="px-3 py-2 bg-gray-800 text-white" @click="myBalance()">My Balance</button>
    <div class="mt-2">Balance: <b x-text="balance"></b></div>
  </div>

  <!-- Send token (JWT auth) -->
  <div class="border p-3 space-y-2">
    <input class="border p-2 w-full" placeholder="To (email)" x-model="to">
    <input class="border p-2 w-full" placeholder="Amount" type="number" min="1" x-model.number="amount">
    <input class="border p-2 w-full" placeholder="Note (optional)" x-model="note">
    <button class="px-3 py-2 bg-green-700 text-white" @click="send()">Send</button>
    <pre class="text-xs whitespace-pre-wrap break-words" x-text="out"></pre>
  </div>
</div>

<script>
document.addEventListener('alpine:init', () => {
  Alpine.data('transferApp', () => ({
    email: '', password: '',
    token: localStorage.getItem('jwt') || '',
    to: '', amount: 1, note: '',
    balance: '-', out: '',

    api(p){ return `${location.origin}/api${p}`; },
    hdr(){ return this.token ? { 'Authorization': 'Bearer ' + this.token } : {}; },

    // 1) Get JWT
    async getToken(){
      this.out = '';
      try {
        const r = await fetch(this.api('/login'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ email: this.email, password: this.password })
        });
        const j = await r.json();
        this.out = JSON.stringify(j, null, 2);
        if (j.token) {
          this.token = j.token;
          localStorage.setItem('jwt', j.token);
        }
      } catch (e) {
        this.out = `Login error: ${e.message}`;
      }
    },

    // 2) Query balance 
    async myBalance(){
      this.out = '';
      try {
        const r = await fetch('/api/me/balance', {
          headers: { 'Accept': 'application/json' },
          credentials: 'same-origin'
        });

        // not 2xx: show error text, avoid whole page 404 HTML
        if (!r.ok) {
          const txt = await r.text();
          this.out = `Error ${r.status}: ${txt}`;
          return;
        }

        const data = await r.json();
        this.balance = (data && typeof data.balance !== 'undefined') ? data.balance : '-';
      } catch (e) {
        this.out = `Balance error: ${e.message}`;
      }
    },

    // 3) Send token
    async send(){
      this.out = '';
      try {
        const r = await fetch(this.api('/transfer'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', ...this.hdr() },
          body: JSON.stringify({
            to: this.to,
            amount: Number(this.amount),
            note: this.note
          })
        });

        const txt = await r.text();
        // try to format JSON for debugging
        try {
          this.out = JSON.stringify(JSON.parse(txt), null, 2);
        } catch {
          this.out = txt;
        }
      } catch (e) {
        this.out = `Transfer error: ${e.message}`;
      }
    }
  }));
});
</script>
