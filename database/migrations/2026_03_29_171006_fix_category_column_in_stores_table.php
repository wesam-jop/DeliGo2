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
            // Drop old category column (string)
            if (Schema::hasColumn('stores', 'category')) {
                $table->dropColumn('category');
            }
            
            // Add category_id foreign key
            if (!Schema::hasColumn('stores', 'category_id')) {
                $table->foreignId('category_id')->nullable()->after('description')
                      ->constrained('categories')->onDelete('set null');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('stores', function (Blueprint $table) {
            if (Schema::hasColumn('stores', 'category_id')) {
                $table->dropForeign(['category_id']);
                $table->dropColumn('category_id');
            }
            
            if (!Schema::hasColumn('stores', 'category')) {
                $table->string('category')->after('description');
            }
        });
    }
};
