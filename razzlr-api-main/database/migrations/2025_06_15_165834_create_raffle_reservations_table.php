<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('raffle_reservations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('raffle_id')->constrained('raffles')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->integer('spot_number');
            $table->boolean('is_locked')->default(false);
            $table->timestamps();
            $table->unique(['raffle_id', 'spot_number']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('raffle_reservations');
    }
};
