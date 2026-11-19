<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('raffles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('host_id')->constrained('users')->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->enum('scope', ['public', 'private']);
            $table->longText('raffle_image')->nullable();
            $table->integer('spots_count');
            $table->enum('status', ['draft', 'published']);
            $table->enum('type', ['fixed', 'open']);
            $table->boolean('ends_enabled');
            $table->integer('auto_delete_days');
            $table->uuid('slug')->unique();
            $table->boolean('is_locked');
            $table->timestamp('starts_at');
            $table->timestamp('drawn_at')->nullable();
            $table->integer('drawn_number')->nullable();
            $table->longText('random_signature')->nullable();
            $table->softDeletes();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('raffles');
    }
};
