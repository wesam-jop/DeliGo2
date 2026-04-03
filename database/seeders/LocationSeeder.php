<?php

namespace Database\Seeders;

use App\Models\Area;
use App\Models\Governorate;
use Illuminate\Database\Seeder;

class LocationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create Idlib Governorate
        $idlib = Governorate::create([
            'name_en' => 'Idlib',
            'name_ar' => 'إدلب',
            'delivery_fee' => 0.5,
            'is_active' => true,
        ]);

        // Create Saraqib Area
        Area::create([
            'governorate_id' => $idlib->id,
            'name_en' => 'Saraqib',
            'name_ar' => 'سراقب',
            'is_active' => true,
        ]);
    }
}
