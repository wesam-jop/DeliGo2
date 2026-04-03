<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\Store\StoreRequest;
use App\Models\Category;
use App\Models\Store;
use App\Models\User;
use App\Services\StoreService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StoreController extends ApiController
{
    public function __construct(
        protected StoreService $storeService
    ) {}

    /**
     * Get platform general statistics
     */
    public function statistics(): JsonResponse
    {
        $storesCount = Store::approved()->active()->count();
        $customersCount = User::where('role', 'customer')->count();
        $driversCount = User::where('role', 'driver')->where('is_approved', true)->count();
        
        return $this->success([
            'stores_count' => $storesCount,
            'customers_count' => $customersCount,
            'drivers_count' => $driversCount,
            'fastest_time' => 15, // Fastest prep time in minutes (static metric or calculate if DB allows)
        ], 'Statistics retrieved successfully');
    }

    /**
     * Get all approved stores
     */
    public function index(Request $request): JsonResponse
    {
        $query = Store::with(['owner', 'governorate', 'area', 'category'])
            ->approved()
            ->active();

        if (auth('sanctum')->check()) {
            $query->withExists(['favorites as is_favorite' => function($query) {
                $query->where('user_id', auth('sanctum')->id());
            }]);
        }

        if ($request->has('governorate_id')) {
            $query->where('governorate_id', $request->governorate_id);
        }

        if ($request->has('area_id')) {
            $query->where('area_id', $request->area_id);
        }

        if ($request->has('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->has('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        $stores = $query->latest()->paginate(15);

        // Append is_open_now to each store
        $stores->getCollection()->transform(function ($store) {
            $store->is_open_now = $store->isOpenNow();
            return $store;
        });

        return $this->success($stores);
    }

    /**
     * Get all store categories
     */
    public function categories(): JsonResponse
    {
        $categories = Category::active()
            ->sorted()
            ->get();

        return $this->success($categories);
    }

    /**
     * Get stores near a location
     */
    public function nearby(Request $request): JsonResponse
    {
        $request->validate([
            'latitude' => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
            'radius' => ['sometimes', 'numeric', 'min:1', 'max:50'],
        ]);

        $radius = $request->input('radius', 5);
        $stores = $this->storeService->getStoresNearby(
            $request->latitude,
            $request->longitude,
            $radius
        );

        return $this->success($stores);
    }

    /**
     * Get store by ID
     */
    public function show(Store $store): JsonResponse
    {
        if (!$store->is_approved || !$store->is_active) {
            return $this->error('المتجر غير موجود', 404);
        }

        if (auth('sanctum')->check()) {
            $store->loadExists(['favorites as is_favorite' => function($query) {
                $query->where('user_id', auth('sanctum')->id());
            }]);
        }
        $store->load(['owner', 'governorate', 'area', 'products.options.items']);
        $store->is_open_now = $store->isOpenNow();

        return $this->success($store);
    }

    /**
     * Create a new store (store owner)
     */
    public function store(StoreRequest $request): JsonResponse
    {
        try {
            $store = $this->storeService->createStore(
                $request->validated(),
                auth()->user()
            );

            return $this->success([
                'store' => $store,
            ], 'تم إنشاء المتجر بنجاح. بانتظار موافقة الإدارة.', 201);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * Update store (store owner)
     */
    public function update(StoreRequest $request, Store $store): JsonResponse
    {
        if ($store->owner_id !== auth()->id()) {
            return $this->error('غير مصرح لك', 403);
        }

        try {
            $store = $this->storeService->updateStore($store, $request->validated());

            return $this->success([
                'store' => $store,
            ], 'تم تحديث المتجر بنجاح');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * Get store's products
     */
    public function products(Store $store): JsonResponse
    {
        if (!$store->is_approved || !$store->is_active) {
            return $this->error('المتجر غير موجود', 404);
        }

        $productQuery = $store->products()
            ->available()
            ->sorted()
            ->with('options.items');

        if (auth('sanctum')->check()) {
            $productQuery->withExists(['favorites as is_favorite' => function($query) {
                $query->where('user_id', auth('sanctum')->id());
            }]);
        }

        $products = $productQuery->get();

        return $this->success($products);
    }

    /**
     * Get single product by ID (including unavailable ones)
     */
    public function product(Store $store, Product $product): JsonResponse
    {
        if (!$store->is_approved || !$store->is_active) {
            return $this->error('المتجر غير موجود', 404);
        }

        // Check if product belongs to this store
        if ($product->store_id !== $store->id) {
            return $this->error('المنتج غير موجود', 404);
        }

        if (auth('sanctum')->check()) {
            $product->loadExists(['favorites as is_favorite' => function($query) {
                $query->where('user_id', auth('sanctum')->id());
            }]);
        }
        $product->load(['store', 'options.items']);

        return $this->success($product);
    }

    /**
     * Get my store working hours
     */
    public function myHours(): JsonResponse
    {
        $userId = auth()->id();
        
        \Log::info('myHours - User ID: ' . $userId);
        
        $store = Store::where('owner_id', $userId)->first();
        
        \Log::info('myHours - Store found: ' . ($store ? 'Yes' : 'No'));
        
        if (!$store) {
            // Try to get store by user's role
            $user = auth()->user();
            \Log::info('myHours - User role: ' . ($user ? $user->role : 'No user'));
            
            return $this->error('لم يتم العثور على المتجر', 404);
        }

        $hours = $this->storeService->getStoreHours($store);

        return $this->success([
            'hours' => $hours,
            'is_open_now' => $store->isOpenNow(),
        ]);
    }

    /**
     * Get store working hours
     */
    public function hours(Store $store): JsonResponse
    {
        $hours = $this->storeService->getStoreHours($store);

        return $this->success([
            'hours' => $hours,
            'is_open_now' => $store->isOpenNow(),
        ]);
    }

    /**
     * Approve store (admin only)
     */
    public function approve(Store $store): JsonResponse
    {
        $this->storeService->approveStore($store);

        return $this->success(null, 'تمت الموافقة على المتجر بنجاح');
    }

    /**
     * Reject store (admin only)
     */
    public function reject(Store $store, Request $request): JsonResponse
    {
        $request->validate([
            'reason' => ['required', 'string'],
        ]);

        $this->storeService->rejectStore($store, $request->reason);

        return $this->success(null, 'تم رفض المتجر');
    }

    /**
     * Get store owner's store
     */
    public function myStore(): JsonResponse
    {
        $store = Store::with(['owner', 'governorate', 'area', 'category', 'schedules'])
            ->where('owner_id', auth()->id())
            ->first();

        if (!$store) {
            return $this->error('المتجر غير موجود', 404);
        }

        return $this->success($store);
    }

    /**
     * Get store owner's dashboard stats
     */
    public function dashboard(): JsonResponse
    {
        $store = Store::where('owner_id', auth()->id())->first();

        if (!$store) {
            return $this->error('المتجر غير موجود', 404);
        }

        $today = now()->startOfDay();

        $storeSplits = $store->orderSplits()->with('order.customer')->get();

        $todayOrders = $storeSplits->filter(function($split) use ($today) {
            return $split->order && $split->order->created_at >= $today;
        });

        $preparingOrders = $storeSplits->filter(function($split) {
            return $split->order && in_array($split->order->status, ['confirmed', 'preparing']);
        });

        $completedOrders = $storeSplits->filter(function($split) {
            return $split->order && in_array($split->order->status, ['delivered', 'completed']);
        });

        return $this->success([
            'today_orders' => $todayOrders->count(),
            'today_revenue' => $todayOrders->sum(function($split) {
                return $split->order ? ($split->order->subtotal ?? 0) : 0;
            }),
            'preparing_orders' => $preparingOrders->count(),
            'completed_orders' => $completedOrders->count(),
            'total_products' => $store->products()->count(),
            'available_products' => $store->products()->where('is_available', true)->count(),
        ]);
    }

    /**
     * Update store hours (store owner)
     */
    public function updateHours(Request $request): JsonResponse
    {
        $user = auth()->user();

        if (!$user->isStoreOwner()) {
            return $this->error('غير مصرح لك. فقط أصحاب المتاجر يمكنهم تحديث ساعات العمل', 403);
        }

        $store = Store::where('owner_id', $user->id)->first();

        if (!$store) {
            return $this->error('لا يوجد متجر مرتبط بحسابك', 400);
        }

        $validated = $request->validate([
            'schedules' => ['required', 'array'],
            'schedules.*.day' => ['required', 'string', 'in:saturday,sunday,monday,tuesday,wednesday,thursday,friday'],
            'schedules.*.is_active' => ['required', 'boolean'],
            'schedules.*.from_time' => ['required', 'date_format:H:i'],
            'schedules.*.to_time' => ['required', 'date_format:H:i'],
        ]);

        try {
            DB::transaction(function () use ($store, $validated) {
                $store->schedules()->delete();

                foreach ($validated['schedules'] as $scheduleData) {
                    $store->schedules()->create([
                        'day' => $scheduleData['day'],
                        'is_active' => $scheduleData['is_active'],
                        'from_time' => $scheduleData['from_time'],
                        'to_time' => $scheduleData['to_time'],
                    ]);
                }
            });

            return $this->success(null, 'تم تحديث ساعات العمل بنجاح');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }
}
