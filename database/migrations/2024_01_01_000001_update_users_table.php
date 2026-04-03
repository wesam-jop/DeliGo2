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
        Schema::table('users', function (Blueprint $table) {
            // Add phone number as primary auth field
            $table->string('phone')->unique()->after('email');
            $table->string('phone_verified_at')->nullable()->after('phone');
            
            // Remove email requirement (make nullable)
            $table->string('email')->nullable()->change();
            
            // Add role column
            $table->enum('role', ['admin', 'store_owner', 'driver', 'customer'])->default('customer')->after('email');
            
            // Add profile image
            $table->string('profile_image')->nullable()->after('role');
            
            // Add approval status for store owners and drivers
            $table->boolean('is_approved')->default(false)->after('profile_image');
            $table->text('rejection_reason')->nullable()->after('is_approved');
            
            // Add location info for drivers (nullable, no foreign key constraint yet)
            $table->unsignedBigInteger('governorate_id')->nullable()->after('rejection_reason');
            $table->unsignedBigInteger('area_id')->nullable()->after('governorate_id');
            
            // Driver specific fields
            $table->string('bike_image')->nullable()->after('area_id');
            $table->boolean('is_online')->default(false)->after('bike_image');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'phone',
                'phone_verified_at',
                'role',
                'profile_image',
                'is_approved',
                'rejection_reason',
                'governorate_id',
                'area_id',
                'bike_image',
                'is_online',
            ]);
            $table->string('email')->change();
        });
    }
};
