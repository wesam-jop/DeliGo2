<?php

namespace Database\Seeders;

use App\Models\Advertisement;
use Illuminate\Database\Seeder;

class AdvertisementSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // ─── Banner Ads ───

        // Banner - Media (Image 1) - Food delivery promo
        Advertisement::create([
            'type' => 'media',
            'placement' => 'banner',
            'title' => 'اطلب الآن واحصل على خصم 20%',
            'description' => 'عروض حصرية على أفضل المطاعم والمتاجر في منطقتك. لا تفوّت الفرصة!',
            'media_url' => 'https://images.pexels.com/photos/31089991/pexels-photo-31089991.jpeg',
            'media_type' => 'image',
            'link_url' => '/stores',
            'start_date' => now()->subDays(5)->toDateString(),
            'end_date' => now()->addDays(30)->toDateString(),
            'is_active' => true,
            'sort_order' => 1,
        ]);

        // Banner - Media (Image 2) - Grocery promo
        Advertisement::create([
            'type' => 'media',
            'placement' => 'banner',
            'title' => 'تسوق بقالة ومستلزمات يومية',
            'description' => 'كل ما تحتاجه من البقالة والمتاجر القريبة يصلك لباب بيتك',
            'media_url' => 'https://images.pexels.com/photos/264507/pexels-photo-264507.jpeg',
            'media_type' => 'image',
            'link_url' => '/products',
            'start_date' => now()->subDays(3)->toDateString(),
            'end_date' => now()->addDays(25)->toDateString(),
            'is_active' => true,
            'sort_order' => 2,
        ]);

        // Banner - Media (Video) - Promo video
        Advertisement::create([
            'type' => 'media',
            'placement' => 'banner',
            'title' => 'اكتشف تجربة DeliGo الجديدة',
            'description' => 'شاهد كيف نوصّل طلبك بأسرع وقت وأعلى جودة',
            'media_url' => 'https://videos.pexels.com/video-files/4763888/4763888-uhd_2560_1440_30fps.mp4',
            'media_type' => 'video',
            'link_url' => '/about',
            'start_date' => now()->subDays(10)->toDateString(),
            'end_date' => now()->addDays(60)->toDateString(),
            'is_active' => true,
            'sort_order' => 3,
        ]);

        // Banner - Text
        Advertisement::create([
            'type' => 'text',
            'placement' => 'banner',
            'title' => '🔥 عروض اليوم: توصيل مجاني على الطلبات فوق 10$',
            'description' => 'سجّل الآن واستمتع بتوصيل مجاني من أفضل المتاجر',
            'link_url' => '/register',
            'start_date' => now()->subDays(2)->toDateString(),
            'end_date' => now()->addDays(15)->toDateString(),
            'is_active' => true,
            'sort_order' => 4,
        ]);

        // ─── Sidebar Ads ───

        // Sidebar - Media (Image)
        Advertisement::create([
            'type' => 'media',
            'placement' => 'sidebar',
            'title' => 'متاجر مميزة بالقرب منك',
            'description' => 'اكتشف المتاجر القريبة واستمتع بتجربة تسوق فريدة',
            'media_url' => 'https://images.pexels.com/photos/26802113/pexels-photo-26802113.jpeg',
            'media_type' => 'image',
            'link_url' => '/stores',
            'start_date' => now()->subDays(7)->toDateString(),
            'end_date' => now()->addDays(20)->toDateString(),
            'is_active' => true,
            'sort_order' => 1,
        ]);

        // Sidebar - Media (Video)
        Advertisement::create([
            'type' => 'media',
            'placement' => 'sidebar',
            'title' => 'انضم كسائق توصيل',
            'description' => 'حقق دخل إضافي مع جدول عمل مرن',
            'media_url' => 'https://videos.pexels.com/video-files/5708696/5708696-uhd_2560_1440_25fps.mp4',
            'media_type' => 'video',
            'link_url' => '/register',
            'start_date' => now()->subDays(1)->toDateString(),
            'end_date' => now()->addDays(45)->toDateString(),
            'is_active' => true,
            'sort_order' => 2,
        ]);

        // Sidebar - Text
        Advertisement::create([
            'type' => 'text',
            'placement' => 'sidebar',
            'title' => '📦 سجّل متجرك الآن وابدأ البيع',
            'description' => 'انضم لمئات المتاجر التي تبيع عبر DeliGo',
            'link_url' => '/register/store',
            'start_date' => now()->subDays(4)->toDateString(),
            'end_date' => now()->addDays(40)->toDateString(),
            'is_active' => true,
            'sort_order' => 3,
        ]);

        // ─── Footer Ads ───

        // Footer - Media (Image)
        Advertisement::create([
            'type' => 'media',
            'placement' => 'footer',
            'title' => 'حمل تطبيق DeliGo',
            'description' => 'اطلب من جوالك بكل سهولة',
            'media_url' => 'https://images.pexels.com/photos/4064881/pexels-photo-4064881.jpeg',
            'media_type' => 'image',
            'link_url' => '/',
            'start_date' => now()->subDays(15)->toDateString(),
            'end_date' => now()->addDays(90)->toDateString(),
            'is_active' => true,
            'sort_order' => 1,
        ]);

        // Footer - Media (Video)
        Advertisement::create([
            'type' => 'media',
            'placement' => 'footer',
            'title' => 'وجبات سريعة ولذيذة',
            'description' => 'أشهى الوجبات من مطاعمك المفضلة',
            'media_url' => 'https://videos.pexels.com/video-files/5607232/5607232-uhd_2560_1440_25fps.mp4',
            'media_type' => 'video',
            'link_url' => '/products',
            'start_date' => now()->subDays(6)->toDateString(),
            'end_date' => now()->addDays(35)->toDateString(),
            'is_active' => true,
            'sort_order' => 2,
        ]);

        // Footer - Text
        Advertisement::create([
            'type' => 'text',
            'placement' => 'footer',
            'title' => '🎁 ادعُ صديق واحصل على خصم',
            'description' => 'كلما دعا صديق أكثر كلما حصلت على عروض أفضل',
            'link_url' => '/register',
            'start_date' => now()->subDays(8)->toDateString(),
            'end_date' => now()->addDays(50)->toDateString(),
            'is_active' => true,
            'sort_order' => 3,
        ]);

        // ─── Inactive Ad (for testing) ───
        Advertisement::create([
            'type' => 'media',
            'placement' => 'banner',
            'title' => 'إعلان قديم (غير نشط)',
            'description' => 'هذا الإعلان منتهي الصلاحية ولا يجب أن يظهر',
            'media_url' => 'https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg',
            'media_type' => 'image',
            'link_url' => null,
            'start_date' => now()->subDays(60)->toDateString(),
            'end_date' => now()->subDays(30)->toDateString(),
            'is_active' => false,
            'sort_order' => 99,
        ]);
    }
}
