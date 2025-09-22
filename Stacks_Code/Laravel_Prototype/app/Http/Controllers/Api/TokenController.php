<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\TokenTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TokenController extends Controller
{
    // return current user's token balance
    public function balance()
    {
        return response()->json(['balance'=>auth('api')->user()->token_balance]);
    }

    // transfer token to another user
    public function transfer(Request $request)
    {
        // validate the request data
        $data = $request->validate([
            'to'     => 'required|email',
            'amount' => 'required|integer|min:1',
            'note'   => 'nullable|string'
        ]);

        $from = auth('api')->user();
        // get the receiver user
        $to   = User::where('email',$data['to'])->first();

        if (! $to) return response()->json(['error'=>'receiver_not_found'], 404);
        // cannot send token to yourself
        if ($from->id === $to->id) return response()->json(['error'=>'cannot_send_to_self'], 422);
        if ($from->token_balance < $data['amount']) return response()->json(['error'=>'insufficient_balance'], 422);

        // transfer token
        DB::transaction(function() use ($from,$to,$data){
            $from->decrement('token_balance', $data['amount']);
            $to->increment('token_balance',   $data['amount']);
            TokenTransaction::create([
                'from_user_id'=>$from->id,
                'to_user_id'=>$to->id,
                'amount'=>$data['amount'],
                'note'=>$data['note'] ?? null,
            ]);
        });

        // return success
        return response()->json(['ok'=>true]);
    }
}
