<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Conversation;
use App\Models\CustomerAddress;
use App\Models\Favorite;
use App\Models\Governorate;
use App\Models\Message;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderStatusHistory;
use App\Models\OrderStoreSplit;
use App\Models\Product;
use App\Models\Schedule;
use App\Models\Store;
use App\Models\User;
use App\Models\Area;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DemoDataSeeder extends Seeder
{
    private const DEMO_STORE_PHONE = '+963994000001';

    /**
     * بيانات وهمية للاختبار: زبائن، سائقون، متاجر، منتجات، طلبات، مفضلة، محادثة نموذجية.
     * آمن للتشغيل مرة ثانية: يتخطى إذا وُجد متجر العرض التجريبي.
     */
    public function run(): void
    {
        $gov = Governorate::query()->first();
        $area = Area::query()->first();
        $category = Category::query()->orderBy('id')->first();

        if (!$gov || !$area || !$category) {
            $this->command->error('شغّل LocationSeeder و CategorySeeder أولاً.');

            return;
        }

        if (Store::query()->where('phone', self::DEMO_STORE_PHONE)->exists()) {
            $this->command->info('البيانات التجريبية موجودة مسبقاً (تخطّي DemoDataSeeder).');

            return;
        }

        $deliveryFee = (float) $gov->delivery_fee;

        DB::transaction(function () use ($gov, $area, $category, $deliveryFee) {
            $password = Hash::make('123456');

            $customers = [];
            foreach (['ليان', 'كريم', 'نور', 'يوسف', 'مها'] as $i => $name) {
                $phone = '+96399100010'.(string) ($i + 1);
                $customers[] = User::create([
                    'name' => $name.' (تجريبي)',
                    'email' => 'customer'.($i + 1).'@demo.deligo.test',
                    'password' => $password,
                    'phone' => $phone,
                    'phone_verified_at' => now(),
                    'role' => 'customer',
                    'is_approved' => true,
                ]);
            }

            $drivers = [];
            foreach (['محمود السائق', 'علي السائق'] as $i => $name) {
                $drivers[] = User::create([
                    'name' => $name,
                    'email' => 'driver'.($i + 1).'@demo.deligo.test',
                    'password' => $password,
                    'phone' => '+96399200010'.(string) ($i + 1),
                    'phone_verified_at' => now(),
                    'role' => 'driver',
                    'is_approved' => true,
                    'governorate_id' => $gov->id,
                    'area_id' => $area->id,
                    'is_online' => true,
                ]);
            }

            $owners = [];
            foreach (['صاحب مطعم التجربة', 'صاحب سوبر ماركت العرض'] as $i => $name) {
                $owners[] = User::create([
                    'name' => $name,
                    'email' => 'owner'.($i + 1).'@demo.deligo.test',
                    'password' => $password,
                    'phone' => '+96399300010'.(string) ($i + 1),
                    'phone_verified_at' => now(),
                    'role' => 'store_owner',
                    'is_approved' => true,
                ]);
            }

            $stores = [
                Store::create([
                    'owner_id' => $owners[0]->id,
                    'name' => 'مطعم الشام التجريبي',
                    'description' => 'مطبخ سوري للاختبار — بيانات وهمية.',
                    'category_id' => $category->id,
                    'phone' => self::DEMO_STORE_PHONE,
                    'latitude' => 35.8667,
                    'longitude' => 36.7167,
                    'governorate_id' => $gov->id,
                    'area_id' => $area->id,
                    'address_details' => 'سراقب — شارع تجريبي',
                    'is_approved' => true,
                    'is_active' => true,
                ]),
                Store::create([
                    'owner_id' => $owners[1]->id,
                    'name' => 'سوبر ماركت العرض',
                    'description' => 'بقالة ومستلزمات — للاختبار.',
                    'category_id' => Category::query()->where('name_en', 'Supermarket')->value('id') ?? $category->id,
                    'phone' => '+963994000002',
                    'latitude' => 35.8700,
                    'longitude' => 36.7200,
                    'governorate_id' => $gov->id,
                    'area_id' => $area->id,
                    'address_details' => 'سراقب — قرب المدخل',
                    'is_approved' => true,
                    'is_active' => true,
                ]),
            ];

            foreach ($stores as $store) {
                foreach (['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as $day) {
                    Schedule::create([
                        'schedulable_type' => Store::class,
                        'schedulable_id' => $store->id,
                        'day' => $day,
                        'from_time' => '08:00:00',
                        'to_time' => '23:59:00',
                        'is_active' => true,
                    ]);
                }
            }

            foreach ($drivers as $driver) {
                foreach (['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as $day) {
                    Schedule::create([
                        'schedulable_type' => User::class,
                        'schedulable_id' => $driver->id,
                        'day' => $day,
                        'from_time' => '08:00:00',
                        'to_time' => '22:00:00',
                        'is_active' => true,
                    ]);
                }
            }

            $productsRestaurant = [
                ['name' => 'وجبة شاورما دجاج', 'price' => 4.50, 'description' => 'مع بطاطا ومخلل'],
                ['name' => 'برغر لحم', 'price' => 6.00, 'description' => 'جبنة وصلصة'],
                ['name' => 'سلطة موسمية', 'price' => 2.00, 'description' => ''],
                ['name' => 'مشروب غازي', 'price' => 1.00, 'description' => '330مل'],
            ];
            foreach ($productsRestaurant as $idx => $p) {
                Product::create([
                    'store_id' => $stores[0]->id,
                    'name' => $p['name'],
                    'description' => $p['description'],
                    'price' => $p['price'],
                    'is_available' => true,
                    'sort_order' => $idx,
                    'category' => 'وجبات',
                ]);
            }

            $productsMarket = [
                ['name' => 'خبز عربي', 'price' => 0.50],
                ['name' => 'حليب 1ل', 'price' => 1.20],
                ['name' => 'مياه معدنية', 'price' => 0.35],
            ];
            foreach ($productsMarket as $idx => $p) {
                Product::create([
                    'store_id' => $stores[1]->id,
                    'name' => $p['name'],
                    'description' => null,
                    'price' => $p['price'],
                    'is_available' => true,
                    'sort_order' => $idx,
                    'category' => 'بقالة',
                ]);
            }

            $addresses = [];
            foreach ($customers as $i => $customer) {
                $addresses[$customer->id] = CustomerAddress::create([
                    'customer_id' => $customer->id,
                    'label' => $i === 0 ? 'المنزل' : 'عنوان '.$i,
                    'address_details' => 'سراقب — حي تجريبي — بناء '.($i + 1),
                    'latitude' => 35.8650 + ($i * 0.001),
                    'longitude' => 36.7150 + ($i * 0.001),
                    'governorate_id' => $gov->id,
                    'area_id' => $area->id,
                    'is_default' => $i === 0,
                ]);
            }

            $p1 = Product::query()->where('store_id', $stores[0]->id)->first();
            $p2 = Product::query()->where('store_id', $stores[0]->id)->skip(1)->first();

            Favorite::create([
                'user_id' => $customers[0]->id,
                'favoritable_id' => $stores[0]->id,
                'favoritable_type' => Store::class,
            ]);
            Favorite::create([
                'user_id' => $customers[0]->id,
                'favoritable_id' => $p1->id,
                'favoritable_type' => Product::class,
            ]);

            $statusScenarios = [
                ['status' => Order::STATUS_PENDING, 'driver' => null],
                ['status' => Order::STATUS_ACCEPTED_BY_DRIVER, 'driver' => 0],
                ['status' => Order::STATUS_CONFIRMED, 'driver' => 0],
                ['status' => Order::STATUS_PREPARING, 'driver' => 0],
                ['status' => Order::STATUS_READY, 'driver' => 0],
                ['status' => Order::STATUS_PICKED_UP, 'driver' => 1],
                ['status' => Order::STATUS_DELIVERED, 'driver' => 1],
                ['status' => Order::STATUS_CANCELLED, 'driver' => null],
            ];

            foreach ($statusScenarios as $idx => $scenario) {
                $customer = $customers[$idx % count($customers)];
                $address = $addresses[$customer->id];
                $driverUser = $scenario['driver'] !== null ? $drivers[$scenario['driver']] : null;

                $qty = 2;
                $unit = (float) $p1->price;
                $subtotal = round($unit * $qty, 2);
                $total = round($subtotal + $deliveryFee, 2);

                $order = Order::create([
                    'customer_id' => $customer->id,
                    'driver_id' => $driverUser?->id,
                    'address_id' => $address->id,
                    'latitude' => $address->latitude,
                    'longitude' => $address->longitude,
                    'subtotal' => $subtotal,
                    'delivery_fee' => $deliveryFee,
                    'total' => $total,
                    'status' => $scenario['status'],
                    'notes' => $idx === 0 ? 'بدون بصل' : null,
                    'cancellation_reason' => $scenario['status'] === Order::STATUS_CANCELLED ? 'اختبار إلغاء' : null,
                    'delivered_at' => $scenario['status'] === Order::STATUS_DELIVERED ? now()->subDays(1) : null,
                ]);

                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $p1->id,
                    'product_name' => $p1->name,
                    'quantity' => $qty,
                    'unit_price' => $unit,
                    'total_price' => $subtotal,
                    'selected_options' => null,
                ]);

                OrderStoreSplit::create([
                    'order_id' => $order->id,
                    'store_id' => $stores[0]->id,
                    'subtotal' => $subtotal,
                    'status' => $scenario['status'] === Order::STATUS_CANCELLED
                        ? Order::STATUS_CANCELLED
                        : ($scenario['status'] === Order::STATUS_PENDING
                            ? Order::STATUS_PENDING
                            : $scenario['status']),
                ]);

                OrderStatusHistory::create([
                    'order_id' => $order->id,
                    'status' => Order::STATUS_PENDING,
                    'note' => null,
                    'changed_by' => $customer->id,
                ]);

                if ($scenario['status'] !== Order::STATUS_PENDING) {
                    OrderStatusHistory::create([
                        'order_id' => $order->id,
                        'status' => $scenario['status'],
                        'note' => 'سجل تجريبي',
                        'changed_by' => $driverUser?->id ?? $customer->id,
                    ]);
                }
            }

            $conv = Conversation::create([
                'type' => Conversation::TYPE_DIRECT,
                'order_id' => null,
                'created_by' => $customers[0]->id,
                'last_message_at' => now(),
            ]);
            $conv->users()->attach([
                $customers[0]->id => ['joined_at' => now(), 'unread_count' => 0],
                $drivers[0]->id => ['joined_at' => now(), 'unread_count' => 1],
            ]);
            Message::create([
                'conversation_id' => $conv->id,
                'sender_id' => $customers[0]->id,
                'message' => 'مرحباً، هل التوصيل متاح الآن؟ (رسالة تجريبية)',
                'type' => 'text',
            ]);
            Message::create([
                'conversation_id' => $conv->id,
                'sender_id' => $drivers[0]->id,
                'message' => 'نعم، أنا في المنطقة.',
                'type' => 'text',
            ]);

            foreach ([$customers[0], $drivers[0]] as $u) {
                DB::table('notifications')->insert([
                    'id' => (string) Str::uuid(),
                    'type' => 'app.system',
                    'notifiable_type' => User::class,
                    'notifiable_id' => $u->id,
                    'data' => json_encode([
                        'title' => '🔔 تنبيه تجريبي',
                        'message' => 'هذا إشعار وهمي داخل صندوق الإشعارات.',
                        'priority' => 3,
                        'click' => null,
                        'meta' => ['demo' => true],
                    ], JSON_UNESCAPED_UNICODE),
                    'read_at' => null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        });

        $this->command->info('تم إنشاء البيانات التجريبية بنجاح.');
        $this->command->table(
            ['المستخدم', 'الهاتف', 'كلمة المرور'],
            [
                ['مدير (موجود مسبقاً)', '+963911111111', '123456'],
                ['زبائن تجريبيون', '+963991000101 …105', '123456'],
                ['سائقون', '+963992000101 …102', '123456'],
                ['أصحاب متاجر', '+963993000101 …102', '123456'],
            ]
        );
    }
}
