<?php

namespace App\Http\Controllers\Api;

use App\Events\DriverRegistered;
use App\Events\StoreRegistered;
use App\Models\Area;
use App\Models\Governorate;
use App\Models\Order;
use App\Models\Store;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminController extends ApiController
{
    /**
     * Get dashboard statistics
     */
    public function dashboard(): JsonResponse
    {
        $stats = [
            'total_users' => User::count(),
            'total_customers' => User::role('customer')->count(),
            'total_drivers' => User::role('driver')->count(),
            'pending_drivers' => User::role('driver')->where('is_approved', false)->count(),
            'total_stores' => Store::count(),
            'pending_stores' => Store::where('is_approved', false)->count(),
            'total_orders' => Order::count(),
            'pending_orders' => Order::status(Order::STATUS_PENDING)->count(),
            'active_orders' => Order::active()->count(),
        ];

        return $this->success($stats);
    }

    /**
     * Get all users
     */
    public function users(Request $request): JsonResponse
    {
        $query = User::with(['governorate', 'area']);

        if ($request->has('role')) {
            $query->where('role', $request->role);
        }

        if ($request->has('is_approved')) {
            $query->where('is_approved', $request->is_approved);
        }

        $users = $query->latest()->paginate(20);

        return $this->success($users);
    }

    /**
     * Get pending stores for approval
     */
    public function pendingStores(): JsonResponse
    {
        $stores = Store::where('is_approved', false)
            ->with(['owner', 'governorate', 'area'])
            ->latest()
            ->get();

        return $this->success($stores);
    }

    /**
     * Get all drivers with their statuses
     */
    public function allDrivers(Request $request): JsonResponse
    {
        $query = User::role('driver')
            ->with(['governorate', 'area'])
            ->latest();

        // Optional: filter by approval status
        if ($request->has('is_approved')) {
            $query->where('is_approved', $request->is_approved);
        }

        $drivers = $query->paginate(100);

        return $this->success($drivers);
    }

    /**
     * Get pending drivers for approval
     */
    public function pendingDrivers(): JsonResponse
    {
        $drivers = User::role('driver')
            ->where('is_approved', false)
            ->with(['governorate', 'area'])
            ->latest()
            ->get();

        return $this->success($drivers);
    }

    /**
     * Approve store
     */
    public function approveStore(Store $store): JsonResponse
    {
        // Approve the store
        $store->update([
            'is_approved' => true,
            'rejection_reason' => null,
        ]);

        // Also approve the store owner user account
        if ($store->owner) {
            $store->owner->update([
                'is_approved' => true,
                'rejection_reason' => null,
            ]);

            // Dispatch event to notify admins
            event(new StoreRegistered($store->owner));
        }

        return $this->success(null, 'Store approved successfully');
    }

    /**
     * Reject store
     */
    public function rejectStore(Store $store, Request $request): JsonResponse
    {
        $request->validate([
            'reason' => ['required', 'string'],
        ]);

        // Reject the store
        $store->update([
            'is_approved' => false,
            'rejection_reason' => $request->reason,
        ]);

        // Also reject the store owner user account
        if ($store->owner) {
            $store->owner->update([
                'is_approved' => false,
                'rejection_reason' => $request->reason,
            ]);
        }

        return $this->success(null, 'Store rejected');
    }

    /**
     * Approve driver
     */
    public function approveDriver(User $driver): JsonResponse
    {
        if ($driver->role !== 'driver') {
            return $this->error('User is not a driver', 400);
        }

        $driver->update([
            'is_approved' => true,
            'rejection_reason' => null,
        ]);

        // Dispatch event to notify admins
        event(new DriverRegistered($driver));

        return $this->success(null, 'Driver approved successfully');
    }

    /**
     * Reject driver
     */
    public function rejectDriver(User $driver, Request $request): JsonResponse
    {
        if ($driver->role !== 'driver') {
            return $this->error('User is not a driver', 400);
        }

        $request->validate([
            'reason' => ['required', 'string'],
        ]);

        $driver->update([
            'is_approved' => false,
            'rejection_reason' => $request->reason,
        ]);

        return $this->success(null, 'Driver rejected');
    }

    /**
     * Get all orders
     */
    public function orders(Request $request): JsonResponse
    {
        $query = Order::with(['customer', 'driver', 'address', 'storeSplits.store']);

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $orders = $query->latest()->paginate(20);

        return $this->success($orders);
    }

    /**
     * Get order details
     */
    public function order(Order $order): JsonResponse
    {
        $order->load(['customer', 'driver', 'address.governorate', 'address.area', 'items.product', 'storeSplits.store', 'statusHistory.changedBy']);

        return $this->success($order);
    }

    /**
     * Get all governorates
     */
    public function governorates(): JsonResponse
    {
        $governorates = Governorate::with('areas')
            ->active()
            ->get();

        return $this->success($governorates);
    }

    /**
     * Create governorate
     */
    public function createGovernorate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name_en' => ['required', 'string', 'max:255'],
            'name_ar' => ['required', 'string', 'max:255'],
            'delivery_fee' => ['required', 'numeric', 'min:0'],
        ]);

        $governorate = Governorate::create($validated);

        return $this->success([
            'governorate' => $governorate,
        ], 'Governorate created successfully', 201);
    }

    /**
     * Update governorate
     */
    public function updateGovernorate(Request $request, Governorate $governorate): JsonResponse
    {
        $validated = $request->validate([
            'name_en' => ['sometimes', 'string', 'max:255'],
            'name_ar' => ['sometimes', 'string', 'max:255'],
            'delivery_fee' => ['sometimes', 'numeric', 'min:0'],
        ]);

        $governorate->update($validated);

        return $this->success([
            'governorate' => $governorate->fresh(),
        ], 'Governorate updated successfully');
    }

    /**
     * Delete governorate
     */
    public function deleteGovernorate(Governorate $governorate): JsonResponse
    {
        $governorate->delete();

        return $this->success(null, 'Governorate deleted successfully');
    }

    /**
     * Create area
     */
    public function createArea(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'governorate_id' => ['required', 'exists:governorates,id'],
            'name_en' => ['required', 'string', 'max:255'],
            'name_ar' => ['required', 'string', 'max:255'],
        ]);

        $area = Area::create($validated);

        return $this->success([
            'area' => $area,
        ], 'Area created successfully', 201);
    }

    /**
     * Update area
     */
    public function updateArea(Request $request, Area $area): JsonResponse
    {
        $validated = $request->validate([
            'governorate_id' => ['sometimes', 'exists:governorates,id'],
            'name_en' => ['sometimes', 'string', 'max:255'],
            'name_ar' => ['sometimes', 'string', 'max:255'],
        ]);

        $area->update($validated);

        return $this->success([
            'area' => $area->fresh(),
        ], 'Area updated successfully');
    }

    /**
     * Delete area
     */
    public function deleteArea(Area $area): JsonResponse
    {
        $area->delete();

        return $this->success(null, 'Area deleted successfully');
    }

    /**
     * Delete user
     */
    public function deleteUser(User $user): JsonResponse
    {
        if ($user->role === 'admin') {
            return $this->error('Cannot delete admin user', 400);
        }

        $user->delete();

        return $this->success(null, 'User deleted successfully');
    }

    /**
     * Queue a broadcast notification to many users (processed by queue workers in chunks).
     */
    public function broadcastNotification(Request $request, NotificationService $notificationService): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:120'],
            'message' => ['required', 'string', 'max:2000'],
            'role' => ['nullable', 'string', 'in:customer,driver,store_owner,all'],
            'send_ntfy' => ['sometimes', 'boolean'],
            'send_whatsapp' => ['sometimes', 'boolean'],
            'exclude_admin' => ['sometimes', 'boolean'],
            
            // رابط إجراء مخصص (اختياري)
            'action_url' => ['nullable', 'url', 'max:500'],
            
            // وسائط مرفقة (اختياري)
            'media_url' => ['nullable', 'url', 'max:500'],
            'media_type' => ['nullable', 'string', 'in:image,video'],
        ]);

        $role = $validated['role'] ?? null;
        if ($role === 'all') {
            $role = null;
        }

        $chunks = $notificationService->queueBroadcastToUsers(
            $validated['title'],
            $validated['message'],
            [
                'role' => $role,
                'exclude_admin' => $validated['exclude_admin'] ?? true,
                'skip_ntfy' => !($validated['send_ntfy'] ?? true),
                'skip_whatsapp' => !($validated['send_whatsapp'] ?? false),
                'click' => $validated['action_url'] ?? null,
                'media_url' => $validated['media_url'] ?? null,
                'media_type' => $validated['media_type'] ?? null,
                'meta' => [
                    'source' => 'admin_broadcast',
                    'admin_id' => $request->user()->id,
                ],
            ]
        );

        return $this->success([
            'queued_chunks' => $chunks,
        ], 'Broadcast queued for delivery');
    }
}
