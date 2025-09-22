<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $data = $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:6',
            'role'     => 'required|string|in:member,beneficiary',
        ]);
    
        $user = User::create([
            'name'          => $data['name'],
            'email'         => $data['email'],
            'password'      => \Illuminate\Support\Facades\Hash::make($data['password']),
            'role'          => strtolower($data['role']),
            'token_balance' => 100,
        ]);
    
        // generate JWT token
        $token = \PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth::fromUser($user);
    
        return response()->json([
            'user'  => $user,
            'token' => $token,
        ], 201);
    }

    // login
    public function login(Request $request)
    {
        $credentials = $request->only('email', 'password');

        if (! $token = JWTAuth::attempt($credentials)) {
            return response()->json(['error' => 'Invalid credentials'], 401);
        }

        return response()->json([
            'token' => $token,
            'user'  => auth()->user()
        ]);
    }

    // get current user
    public function me(Request $request)
    {
        return response()->json(auth()->user());
    }
}
