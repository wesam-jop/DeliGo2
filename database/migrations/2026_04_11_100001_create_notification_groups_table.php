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
        Schema::create('notification_groups', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('type'); // e.g., 'order.created', 'message.received'
            $table->string('entity_type')->nullable(); // e.g., 'order', 'message'
            $table->unsignedInteger('count')->default(1); // Number of grouped notifications
            $table->unsignedBigInteger('last_entity_id')->nullable(); // Latest entity ID for deep linking
            $table->json('entity_ids')->nullable(); // All entity IDs in the group (for batch navigation)
            $table->timestamp('expires_at'); // When the group should be sent
            $table->boolean('is_dispatched')->default(false); // Whether the group has been sent
            $table->timestamp('dispatched_at')->nullable(); // When the group was actually sent
            
            // Indexes for quick lookups
            $table->index(['user_id', 'type']);
            $table->index('expires_at');
            $table->index(['is_dispatched', 'expires_at']);
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notification_groups');
    }
};
