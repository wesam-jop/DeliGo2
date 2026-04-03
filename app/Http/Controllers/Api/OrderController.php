<?php

namespace App\Http\Controllers\Api;
 
use App\Http\Resources\OrderResource;


use App\Http\Requests\Order\CreateOrderRequest;
use App\Models\Conversation;
use App\Models\ConversationUser;
use App\Models\Message;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use App\Models\CustomerAddress;
use App\Services\OrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrderController extends ApiController
{
    public function __construct(
        protected OrderService $orderService
    ) {}

    /**
     * Get user orders
     */
    public function index(Request $request): JsonResponse
    {
        $query = Order::with(['items.product', 'address', 'driver', 'storeSplits.store', 'customer']);

        // Customer sees their orders
        if (auth()->user()->isCustomer()) {
            $query->where('customer_id', auth()->id());
        }

        // Driver sees assigned orders
        if (auth()->user()->isDriver()) {
            $query->where('driver_id', auth()->id());
        }

        // Store owner sees orders for their store
        if (auth()->user()->isStoreOwner()) {
            $store = \App\Models\Store::where('owner_id', auth()->id())->first();
            if ($store) {
                $query->whereHas('storeSplits', function($q) use ($store) {
                    $q->where('store_id', $store->id);
                });
            } else {
                return $this->success([]);
            }
        }

        // Filter by status
        if ($request->filled('status')) {
            $status = $request->status;
            if ($status === 'active') {
                $query->whereNotIn('status', [Order::STATUS_DELIVERED, Order::STATUS_CANCELLED]);
            } elseif ($status === 'completed') {
                $query->where('status', Order::STATUS_DELIVERED);
            } else {
                $query->where('status', $status);
            }
        }

        $orders = $query->latest()->paginate($request->input('limit', 15));
 
        return $this->success(OrderResource::collection($orders)->response()->getData(true));
    }

    /**
     * Get order by ID
     */
    public function show(Order $order): JsonResponse
    {
        $user = auth()->user();

        if ($user->isCustomer() && $order->customer_id !== $user->id) {
            return $this->error('غير مصرح لك', 403);
        }

        if ($user->isDriver() && $order->driver_id !== $user->id) {
            return $this->error('غير مصرح لك', 403);
        }

        if ($user->isStoreOwner()) {
            $store = \App\Models\Store::where('owner_id', $user->id)->first();
            if ($store) {
                $hasOrder = $order->storeSplits()->where('store_id', $store->id)->exists();
                if (!$hasOrder) {
                    return $this->error('غير مصرح لك', 403);
                }
            } else {
                return $this->error('غير مصرح لك', 403);
            }
        }

        $order->load(['items.product', 'address.governorate', 'address.area', 'driver', 'customer', 'storeSplits.store', 'statusHistory.changedBy']);

        return $this->success(new OrderResource($order));
    }

    /**
     * Create a new order (customer)
     */
    public function store(CreateOrderRequest $request): JsonResponse
    {
        try {
            $validated = $request->validated();

            $items = [];
            foreach ($validated['items'] as $item) {
                $product = Product::findOrFail($item['product_id']);

                if (!$product->is_available) {
                    return $this->error("المنتج '{$product->name}' غير متاح", 400);
                }

                $items[] = [
                    'product' => $product,
                    'quantity' => $item['quantity'],
                    'selected_options' => $item['selected_options'] ?? null,
                ];
            }

            $validated['customer_id'] = auth()->id();
            $validated['items'] = $items;

            // Check if there are online drivers in the delivery area
            $address = CustomerAddress::findOrFail($validated['address_id']);
            $onlineDriversCount = User::where('role', 'driver')
                ->where('is_approved', true)
                ->where('is_online', true)
                ->where('governorate_id', $address->governorate_id)
                ->count();

            if ($onlineDriversCount === 0) {
                return $this->error('لا يوجد عامل توصيل متصل حالياً في منطقتك. يرجى المحاولة لاحقاً.', 400);
            }

            $order = $this->orderService->createOrder($validated);
            $order->load(['items.product', 'address', 'storeSplits.store']);

            return $this->success([
                'order' => $order,
            ], 'تم إنشاء الطلب بنجاح', 201);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * Cancel order
     */
    public function cancel(Order $order, Request $request): JsonResponse
    {
        $user = auth()->user();
        $request->validate([
            'reason' => ['required', 'string'],
        ]);

        if ($user->isCustomer() && $order->customer_id === $user->id) {
            try {
                $this->orderService->cancelOrder($order, $request->reason, $user->id);
                return $this->success(null, 'تم إلغاء الطلب بنجاح');
            } catch (\Exception $e) {
                return $this->error($e->getMessage(), 400);
            }
        }

        if ($user->isStoreOwner()) {
            $store = $user->store;
            if ($store) {
                $hasStoreItems = $order->storeSplits()->where('store_id', $store->id)->exists();
                if ($hasStoreItems) {
                    try {
                        $this->orderService->cancelOrder($order, $request->reason, $user->id);
                        return $this->success(null, 'تم إلغاء الطلب بنجاح');
                    } catch (\Exception $e) {
                        return $this->error($e->getMessage(), 400);
                    }
                }
            }
        }

        return $this->error('غير مصرح لك', 403);
    }

    /**
     * Accept order
     */
    public function accept(Order $order): JsonResponse
    {
        $user = auth()->user();

        if ($user->isDriver()) {
            try {
                $this->orderService->driverAcceptOrder($order, $user->id);

                return $this->success(null, 'تم قبول الطلب بنجاح');
            } catch (\Exception $e) {
                return $this->error($e->getMessage(), 400);
            }
        }

        if ($user->isStoreOwner()) {
            $store = $user->store;

            if (!$store) {
                return $this->error('لا يوجد متجر مرتبط بحسابك', 400);
            }

            $hasStoreItems = $order->storeSplits()->where('store_id', $store->id)->exists();
            if (!$hasStoreItems) {
                return $this->error('هذا الطلب لا يحتوي على منتجات من متجرك', 403);
            }

            try {
                $this->orderService->acceptOrder($order, $store->id);

                return $this->success(null, 'تم تأكيد الطلب بنجاح');
            } catch (\Exception $e) {
                return $this->error($e->getMessage(), 400);
            }
        }

        return $this->error('فقط السائقين أو أصحاب المتاجر يمكنهم قبول الطلبات', 403);
    }

    /**
     * Mark order as preparing
     */
    public function markAsPreparing(Order $order): JsonResponse
    {
        $user = auth()->user();

        if (!$user->isStoreOwner()) {
            return $this->error('فقط أصحاب المتاجر يمكنهم تحديث حالة التحضير', 403);
        }

        $store = $user->store;

        if (!$store) {
            return $this->error('لا يوجد متجر مرتبط بحسابك', 400);
        }

        $hasStoreItems = $order->storeSplits()->where('store_id', $store->id)->exists();
        if (!$hasStoreItems) {
            return $this->error('هذا الطلب لا يحتوي على منتجات من متجرك', 403);
        }

        if ($order->status !== Order::STATUS_CONFIRMED) {
            return $this->error('يجب تأكيد الطلب قبل البدء بالتحضير', 400);
        }

        try {
            $this->orderService->markAsPreparing($order, $store->id);
            return $this->success(null, 'تم تحديث حالة الطلب إلى قيد التحضير');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * Mark order as ready
     */
    public function markAsReady(Order $order): JsonResponse
    {
        $user = auth()->user();

        if (!$user->isStoreOwner()) {
            return $this->error('فقط أصحاب المتاجر يمكنهم تحديث حالة الجاهزية', 403);
        }

        $store = $user->store;

        if (!$store) {
            return $this->error('لا يوجد متجر مرتبط بحسابك', 400);
        }

        $hasStoreItems = $order->storeSplits()->where('store_id', $store->id)->exists();
        if (!$hasStoreItems) {
            return $this->error('هذا الطلب لا يحتوي على منتجات من متجرك', 403);
        }

        if ($order->status !== Order::STATUS_PREPARING) {
            return $this->error('يجب أن يكون الطلب قيد التحضير قبل تعليمه كجاهز', 400);
        }

        try {
            $this->orderService->markAsReady($order, $store->id);
            return $this->success(null, 'تم تحديث حالة الطلب إلى جاهز للاستلام');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * Mark order as picked up
     */
    public function markAsPickedUp(Order $order): JsonResponse
    {
        if ($order->driver_id !== auth()->id()) {
            return $this->error('غير مصرح لك', 403);
        }

        try {
            $this->orderService->markAsPickedUp($order);
            return $this->success(null, 'تم تأكيد استلام الطلب');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * Mark order as delivered
     */
    public function markAsDelivered(Order $order): JsonResponse
    {
        if ($order->driver_id !== auth()->id()) {
            return $this->error('غير مصرح لك', 403);
        }

        try {
            $this->orderService->markAsDelivered($order);
            return $this->success(null, 'تم تأكيد تسليم الطلب');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * Get order status history
     */
    public function history(Order $order): JsonResponse
    {
        $user = auth()->user();

        if ($user->isCustomer() && $order->customer_id !== $user->id) {
            return $this->error('غير مصرح لك', 403);
        }

        if ($user->isDriver() && $order->driver_id !== $user->id) {
            return $this->error('غير مصرح لك', 403);
        }

        $history = $order->statusHistory()->with('changedBy')->latest()->get();

        return $this->success($history);
    }

    /**
     * Check if there are online drivers in the delivery area
     */
    public function checkDriverAvailability(Request $request): JsonResponse
    {
        $request->validate([
            'address_id' => ['required', 'exists:customer_addresses,id'],
        ]);

        $address = CustomerAddress::findOrFail($request->address_id);

        $onlineDriversCount = User::where('role', 'driver')
            ->where('is_approved', true)
            ->where('is_online', true)
            ->where('governorate_id', $address->governorate_id)
            ->count();

        return $this->success([
            'available' => $onlineDriversCount > 0,
            'drivers_count' => $onlineDriversCount,
        ]);
    }
}
