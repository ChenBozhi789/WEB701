<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\TokenController;

// Register, return JWT Token
Route::post('/register', [AuthController::class, 'register'])->name('api.register');

// Login, return JWT Token
Route::post('/login', [AuthController::class, 'login'])->name('api.login');

// API with JWT auth
Route::middleware('auth:api')->group(function () {
    // get current user info
    Route::get('/me', [AuthController::class, 'me'])->name('api.me');

    // get balance
    Route::get('/balance', [TokenController::class, 'balance'])->name('api.balance');

    // transfer
    Route::post('/transfer', [TokenController::class, 'transfer'])->name('api.transfer');
});
