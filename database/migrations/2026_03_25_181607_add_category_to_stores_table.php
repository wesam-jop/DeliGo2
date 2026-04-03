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
        Schema::table('stores', function (Blueprint $table) {
            // Add foreign key constraint if column already exists
            if (!Schema::hasColumn('stores', 'category_id')) {
                $table->foreignId('category_id')->nullable()->after('category')
                      ->constrained('categories')->onDelete('set null');
            } else {
                // Just add the foreign key constraint
                $table->foreign('category_id')->references('id')->on('categories')->onDelete('set null');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('stores', function (Blueprint $table) {
            $table->dropForeign(['category_id']);
            if (Schema::hasColumn('stores', 'category_id')) {
                $table->dropColumn('category_id');
            }
        });
    }
};
