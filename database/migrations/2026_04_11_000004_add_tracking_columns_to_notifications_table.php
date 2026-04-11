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
        Schema::table('notifications', function (Blueprint $table) {
            $table->timestamp('sent_at')->nullable()->after('read_at');
            $table->timestamp('delivered_at')->nullable()->after('sent_at');
            $table->timestamp('opened_at')->nullable()->after('delivered_at');
            $table->integer('sent_attempts')->default(0)->after('opened_at');
            $table->text('last_error')->nullable()->after('sent_attempts');
            $table->json('delivery_data')->nullable()->after('last_error');
            
            // Add index for opened_at for analytics
            $table->index('sent_at');
            $table->index('opened_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            $table->dropColumn([
                'sent_at',
                'delivered_at',
                'opened_at',
                'sent_attempts',
                'last_error',
                'delivery_data',
            ]);
        });
    }
};
