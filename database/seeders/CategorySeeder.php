<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            [
                'name_ar' => 'مطعم',
                'name_en' => 'Restaurant',
                'icon' => '🍔',
                'color' => '#ef4444',
                'sort_order' => 1,
            ],
            [
                'name_ar' => 'صيدلية',
                'name_en' => 'Pharmacy',
                'icon' => '💊',
                'color' => '#3b82f6',
                'sort_order' => 2,
            ],
            [
                'name_ar' => 'سوبر ماركت',
                'name_en' => 'Supermarket',
                'icon' => '🛒',
                'color' => '#22c55e',
                'sort_order' => 3,
            ],
            [
                'name_ar' => 'ادوات منزلية',
                'name_en' => 'Home Appliances',
                'icon' => '🏠',
                'color' => '#f59e0b',
                'sort_order' => 4,
            ],
        ];

        foreach ($categories as $category) {
            Category::firstOrCreate(
                ['name_en' => $category['name_en']],
                $category
            );
        }
    }
}
