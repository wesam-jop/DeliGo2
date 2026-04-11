<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('notification_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('type'); // e.g., 'order.status', 'chat.message'
            $table->string('entity_type')->nullable(); // e.g., 'order', 'conversation'
            $table->unsignedBigInteger('entity_id')->nullable(); // e.g., order ID
            $table->timestamp('sent_at');
            
            // Indexes for deduplication queries
            $table->index(['user_id', 'type', 'entity_type', 'entity_id']);
            $table->index('sent_at');
            $table->index(['user_id', 'sent_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notification_logs');
    }
};
