<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('status', 50)->default('pending')->change();
        });

        Schema::table('order_store_splits', function (Blueprint $table) {
            $table->string('status', 50)->default('pending')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('status', 50)->default('pending')->change();
        });

        Schema::table('order_store_splits', function (Blueprint $table) {
            $table->string('status', 50)->default('pending')->change();
        });
    }
};
