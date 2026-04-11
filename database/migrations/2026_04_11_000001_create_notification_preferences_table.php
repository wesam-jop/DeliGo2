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
        Schema::create('notification_preferences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            
            // Channel preferences
            $table->boolean('enable_in_app')->default(true);
            $table->boolean('enable_push')->default(true);
            $table->boolean('enable_whatsapp')->default(true);
            
            // Notification types
            $table->boolean('order_updates')->default(true);
            $table->boolean('message_updates')->default(true);
            $table->boolean('marketing_messages')->default(false);
            
            // Quiet hours
            $table->time('quiet_hours_start')->nullable();
            $table->time('quiet_hours_end')->nullable();
            $table->boolean('respect_quiet_hours')->default(false);
            
            $table->timestamps();
            
            $table->unique('user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notification_preferences');
    }
};
