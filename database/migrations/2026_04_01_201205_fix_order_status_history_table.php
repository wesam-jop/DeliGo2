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
        // Change status column to VARCHAR to support all statuses
        DB::statement("ALTER TABLE order_status_history MODIFY COLUMN status VARCHAR(50)");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert to enum if needed
        DB::statement("ALTER TABLE order_status_history MODIFY COLUMN status ENUM('pending', 'accepted_by_driver', 'preparing', 'ready', 'picked_up', 'delivered', 'cancelled')");
    }
};
