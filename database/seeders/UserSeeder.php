<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create Admin User ONLY
        User::firstOrCreate(
            ['phone' => '+963911111111'],
            [
                'name' => 'مدير النظام',
                'password' => Hash::make('123456'),
                'role' => 'admin',
                'phone_verified_at' => now(),
                'is_approved' => true,
            ]
        );

    }
}
