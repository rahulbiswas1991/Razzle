<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('credit_transactions', function (Blueprint $table) {
            $table->id();
            $table->uuid('transaction_id')->unique();
            $table->foreignId('user_id')->constrained('users');
            $table->foreignId('raffle_id')->nullable()->constrained('raffles');
            $table->enum('type', ['purchase', 'spend']);
            $table->enum('payment_status', ['unpaid', 'paid', 'failed'])->default('unpaid');
            $table->integer('credits');
            $table->string('stripe_session_id')->nullable();
            $table->string('stripe_payment_intent_id')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('credit_transactions');
    }
};
