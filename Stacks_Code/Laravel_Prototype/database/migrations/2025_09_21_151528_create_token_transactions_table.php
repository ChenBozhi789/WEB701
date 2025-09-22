<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // create the token transactions table
    public function up(): void
    {
        Schema::create('token_transactions', function (Blueprint $table) {
            $table->id();
        
            $table->foreignId('from_user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('to_user_id')->constrained('users')->cascadeOnDelete();
    
            $table->unsignedBigInteger('amount');
            $table->string('note')->nullable();
    
            $table->timestamps();
        });
    }
    
    public function down(): void
    {
        Schema::dropIfExists('token_transactions');
    }
};
