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
        Schema::create('product_option_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_option_id')->constrained()->onDelete('cascade');
            $table->string('name'); // e.g., "Small", "Medium", "Large"
            $table->decimal('price_adjustment', 10, 2)->default(0); // Additional price
            $table->timestamps();

            $table->index('product_option_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('product_option_items');
    }
};
