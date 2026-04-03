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
        Schema::create('order_store_splits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->onDelete('cascade');
            $table->foreignId('store_id')->constrained()->onDelete('cascade');
            $table->decimal('subtotal', 10, 2);
            $table->enum('status', [
                'pending',
                'accepted_by_driver',
                'preparing',
                'ready',
                'picked_up',
                'delivered',
                'cancelled'
            ])->default('pending');
            $table->timestamps();

            $table->index('order_id');
            $table->index('store_id');
            $table->unique(['order_id', 'store_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('order_store_splits');
    }
};
