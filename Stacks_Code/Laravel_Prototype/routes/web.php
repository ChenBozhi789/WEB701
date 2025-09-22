<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;


// default homepage
Route::get('/', function () {
    return view('welcome');
});

// Register page (resources/views/register.blade.php)
Route::get('/jwt-register', function () {
    return view('register');
})->name('jwt.register');

// Login page (resources/views/login.blade.php)
Route::get('/jwt-login', function () {
    return view('login');
})->name('jwt.login');

// Dashboard (resources/views/dashboard.blade.php)
Route::get('/dashboard', function () {
    return view('dashboard');
})->name('dashboard');

// Laravel Breeze/Fortify profile function
Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
