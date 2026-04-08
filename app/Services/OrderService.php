<?php

namespace App\Services;

use App\Events\OrderCreated;
use App\Events\OrderAssignedToDriver;
use App\Events\NewOrderForDrivers;
use App\Events\OrderStatusChanged;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderStoreSplit;
use App\Models\OrderStatusHistory;
use App\Models\User;
use App\Models\Store;
use App\Models\CustomerAddress;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class OrderService
{
    public function __construct(
        protected ChatService $chatService
    ) {}
    /**
     * Create a new order
     */
    public function createOrder(array $data): Order
    {
        return DB::transaction(function () use ($data) {
            $customer = User::findOrFail($data['customer_id']);
            $address = CustomerAddress::findOrFail($data['address_id']);

            // Calculate totals
            $subtotal = 0;
            $storeItems = []; // Group items by store

            foreach ($data['items'] as $item) {
                $product = $item['product'];
                $itemTotal = $product->price * $item['quantity'];
                $subtotal += $itemTotal;

                $storeId = $product->store_id;
                if (!isset($storeItems[$storeId])) {
                    $storeItems[$storeId] = ['subtotal' => 0, 'items' => []];
                }
                $storeItems[$storeId]['subtotal'] += $itemTotal;
                $storeItems[$storeId]['items'][] = $item;
            }

            // Calculate delivery fee based on unique store governorates (same as CartContext logic)
            $governorateFees = [];
            foreach ($storeItems as $storeId => $storeData) {
                $store = Store::with('governorate')->find($storeId);
                if ($store && $store->governorate_id && $store->governorate) {
                    $governorateFees[$store->governorate_id] = (float) $store->governorate->delivery_fee;
                }
            }
            
            $calculatedDeliveryFee = array_sum($governorateFees);
            $deliveryFee = $calculatedDeliveryFee > 0 ? $calculatedDeliveryFee : 0.50;
            
            $total = $subtotal + $deliveryFee;

            // Create the order
            $order = Order::create([
                'order_number' => 'ORD-' . strtoupper(\Illuminate\Support\Str::random(10)),
                'customer_id' => $data['customer_id'],
                'address_id' => $data['address_id'],
                'latitude' => $address->latitude,
                'longitude' => $address->longitude,
                'subtotal' => $subtotal,
                'delivery_fee' => $deliveryFee,
                'total' => $total,
                'status' => Order::STATUS_PENDING,
                'notes' => $data['notes'] ?? null,
            ]);

            // Create order items
            foreach ($data['items'] as $item) {
                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $item['product']->id,
                    'product_name' => $item['product']->name,
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['product']->price,
                    'total_price' => $item['product']->price * $item['quantity'],
                    'selected_options' => $item['selected_options'] ?? null,
                ]);
            }

            // Create store splits
            foreach ($storeItems as $storeId => $storeData) {
                OrderStoreSplit::create([
                    'order_id' => $order->id,
                    'store_id' => $storeId,
                    'subtotal' => $storeData['subtotal'],
                    'status' => Order::STATUS_PENDING,
                ]);
            }

            // Log status history
            OrderStatusHistory::create([
                'order_id' => $order->id,
                'status' => Order::STATUS_PENDING,
                'changed_by' => $customer->id,
            ]);

            // Dispatch events for real-time notifications
            event(new OrderCreated($order));
            event(new NewOrderForDrivers($order));

            // Create order conversation for chat
            $this->chatService->createOrderConversation($order);

            return $order;
        });
    }

    /**
     * Get available drivers for an order
     */
    public function getAvailableDrivers(CustomerAddress $address): array
    {
        $day = strtolower(now()->format('l'));
        $currentTime = now()->format('H:i:s');

        return User::role('driver')
            ->approved()
            ->where('is_online', true)
            ->where('governorate_id', $address->governorate_id)
            ->where('area_id', $address->area_id)
            ->whereHas('schedules', function ($query) use ($day, $currentTime) {
                $query->where('day', $day)
                    ->where('is_active', true)
                    ->where('from_time', '<=', $currentTime)
                    ->where('to_time', '>=', $currentTime);
            })
            ->whereDoesntHave('deliveredOrders', function ($query) {
                $query->active();
            })
            ->get()
            ->toArray();
    }

    /**
     * Assign driver to order
     */
    public function assignDriver(Order $order, int $driverId): bool
    {
        return DB::transaction(function () use ($order, $driverId) {
            $driver = User::findOrFail($driverId);

            if ($driver->role !== 'driver' || !$driver->is_approved || !$driver->is_online) {
                throw new \Exception('Driver not available', 400);
            }

            $order->update([
                'driver_id' => $driverId,
                'status' => Order::STATUS_ACCEPTED_BY_DRIVER,
            ]);

            // Update all store splits
            $order->storeSplits()->update([
                'status' => Order::STATUS_ACCEPTED_BY_DRIVER,
            ]);

            // Log status history
            OrderStatusHistory::create([
                'order_id' => $order->id,
                'status' => Order::STATUS_ACCEPTED_BY_DRIVER,
                'changed_by' => $driver->id,
            ]);

            // Dispatch events
            event(new OrderAssignedToDriver($order, $driver));
            event(new OrderStatusChanged($order, Order::STATUS_ACCEPTED_BY_DRIVER));

            // Add driver to order conversation
            $this->chatService->addDriverToOrderConversation($order, $driver);

            // Send automated notification
            $this->chatService->sendOrderStatusMessage($order, Order::STATUS_ACCEPTED_BY_DRIVER, $driver);

            return true;
        });
    }

    /**
     * Update order status
     */
    public function updateOrderStatus(Order $order, string $status, ?string $note = null, ?int $changedBy = null): bool
    {
        $validTransitions = [
            Order::STATUS_PENDING => [Order::STATUS_ACCEPTED_BY_DRIVER, Order::STATUS_CONFIRMED, Order::STATUS_CANCELLED],
            Order::STATUS_ACCEPTED_BY_DRIVER => [Order::STATUS_CONFIRMED, Order::STATUS_PREPARING, Order::STATUS_CANCELLED],
            Order::STATUS_CONFIRMED => [Order::STATUS_PREPARING],
            Order::STATUS_PREPARING => [Order::STATUS_READY],
            Order::STATUS_READY => [Order::STATUS_PICKED_UP],
            Order::STATUS_PICKED_UP => [Order::STATUS_DELIVERED],
        ];

        if (!isset($validTransitions[$order->status]) ||
            !in_array($status, $validTransitions[$order->status])) {
            throw new \Exception("Invalid status transition from {$order->status} to {$status}", 400);
        }

        return DB::transaction(function () use ($order, $status, $note, $changedBy) {
            $order->updateStatus($status, $note, $changedBy);

            // Update store splits status only for certain statuses
            if (in_array($status, [Order::STATUS_CONFIRMED, Order::STATUS_PREPARING, Order::STATUS_READY, Order::STATUS_PICKED_UP, Order::STATUS_DELIVERED])) {
                $order->storeSplits()->update(['status' => $status]);
            }

            // Send automated chat notification
            $this->chatService->sendOrderStatusMessage(
                $order, 
                $status, 
                $changedBy ? User::find($changedBy) : Auth::user()
            );

            event(new OrderStatusChanged($order->fresh(), $status, $note));

            return true;
        });
    }

    /**
     * Cancel order
     */
    public function cancelOrder(Order $order, string $reason, ?int $cancelledBy = null): bool
    {
        if (!$order->canBeCancelled()) {
            throw new \Exception('Order cannot be cancelled at this stage', 400);
        }

        return $this->updateOrderStatus(
            $order,
            Order::STATUS_CANCELLED,
            $reason,
            $cancelledBy
        );
    }

    /**
     * Accept order (called by store owner)
     */
    public function acceptOrder(Order $order, ?int $storeId = null): bool
    {
        if ($storeId) {
            $split = $order->storeSplits()->where('store_id', $storeId)->first();
            if ($split) {
                $split->update(['status' => Order::STATUS_CONFIRMED]);
            }
        }

        // Update main order status if all splits are confirmed
        if ($order->status === Order::STATUS_PENDING || $order->status === Order::STATUS_ACCEPTED_BY_DRIVER) {
            $splitsCount = $order->storeSplits()->count();
            $confirmedSplitsCount = $order->storeSplits()->where('status', Order::STATUS_CONFIRMED)->count();
            
            // If this is the last (or only) store to confirm
            if ($confirmedSplitsCount === $splitsCount) {
                try {
                    return $this->updateOrderStatus($order, Order::STATUS_CONFIRMED);
                } catch (\Exception $e) {
                    throw new \Exception("فشل تحديث حالة الطلب: " . $e->getMessage(), 400);
                }
            }
        }
        
        return true;
    }

    /**
     * Driver accepts order (called by driver)
     */
    public function driverAcceptOrder(Order $order, int $driverId): bool
    {
        if ($order->status !== Order::STATUS_PENDING) {
            throw new \Exception('Order cannot be accepted by driver at this stage', 400);
        }

        return DB::transaction(function () use ($order, $driverId) {
            // Assign driver to order
            $order->update([
                'driver_id' => $driverId,
                'status' => Order::STATUS_ACCEPTED_BY_DRIVER,
            ]);

            // Log status history
            OrderStatusHistory::create([
                'order_id' => $order->id,
                'status' => Order::STATUS_ACCEPTED_BY_DRIVER,
                'changed_by' => $driverId,
            ]);

            event(new OrderStatusChanged($order->fresh(), Order::STATUS_ACCEPTED_BY_DRIVER));

            return true;
        });
    }

    /**
     * Store confirms order (after driver accepted)
     */
    public function storeConfirmOrder(Order $order, int $storeId): bool
    {
        if ($order->status !== Order::STATUS_ACCEPTED_BY_DRIVER) {
            throw new \Exception('Order is not ready for store confirmation', 400);
        }

        // Update store split status
        $split = $order->storeSplits()->where('store_id', $storeId)->first();
        if ($split) {
            $split->update(['status' => Order::STATUS_CONFIRMED]);
        }

        // Update order status to confirmed
        return $this->updateOrderStatus($order, Order::STATUS_CONFIRMED);
    }

    /**
     * Mark order as preparing (called by store)
     */
    public function markAsPreparing(Order $order, ?int $storeId = null): bool
    {
        if ($storeId) {
            $split = $order->storeSplits()->where('store_id', $storeId)->first();
            if ($split) {
                $split->update(['status' => Order::STATUS_PREPARING]);
            }
        }

        // Allow transition from both accepted_by_driver and confirmed
        if (in_array($order->status, [Order::STATUS_ACCEPTED_BY_DRIVER, Order::STATUS_CONFIRMED])) {
            return $this->updateOrderStatus($order, Order::STATUS_PREPARING);
        }

        return true;
    }

    /**
     * Mark order as ready (called by store)
     */
    public function markAsReady(Order $order, ?int $storeId = null): bool
    {
        if ($storeId) {
            $split = $order->storeSplits()->where('store_id', $storeId)->first();
            if ($split) {
                $split->update(['status' => Order::STATUS_READY]);
            }
        }

        if ($order->status === Order::STATUS_PREPARING) {
            return $this->updateOrderStatus($order, Order::STATUS_READY);
        }

        return true;
    }

    /**
     * Mark order as picked up (called by driver)
     */
    public function markAsPickedUp(Order $order): bool
    {
        if ($order->status === Order::STATUS_READY) {
            return $this->updateOrderStatus($order, Order::STATUS_PICKED_UP);
        }

        throw new \Exception('Order must be ready before pickup', 400);
    }

    /**
     * Mark order as delivered (called by driver)
     */
    public function markAsDelivered(Order $order): bool
    {
        if ($order->status === Order::STATUS_PICKED_UP) {
            return $this->updateOrderStatus($order, Order::STATUS_DELIVERED);
        }

        throw new \Exception('Order must be picked up before delivery', 400);
    }
}
