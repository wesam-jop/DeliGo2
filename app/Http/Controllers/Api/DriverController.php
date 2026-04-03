<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\Driver\DriverRegisterRequest;
use App\Http\Requests\Schedule\ScheduleRequest;
use App\Models\User;
use App\Services\DriverService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DriverController extends ApiController
{
    public function __construct(
        protected DriverService $driverService
    ) {}

    /**
     * Register as a driver
     */
    public function register(DriverRegisterRequest $request): JsonResponse
    {
        try {
            $driver = $this->driverService->registerDriver($request->validated());

            return $this->success([
                'driver' => $driver,
            ], 'تم التسجيل بنجاح. بانتظار موافقة الإدارة.', 201);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * Get driver profile
     */
    public function profile(): JsonResponse
    {
        $driver = auth()->user()->load(['governorate', 'area']);

        return $this->success($driver);
    }

    /**
     * Update driver profile
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $driver = auth()->user();

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'phone' => ['sometimes', 'string'],
            'governorate_id' => ['sometimes', 'exists:governorates,id'],
            'area_id' => ['sometimes', 'exists:areas,id'],
            'profile_image' => ['nullable', 'image', 'max:2048'],
        ]);

        $updateData = [];
        
        if ($request->hasFile('profile_image')) {
            $image = $request->file('profile_image');
            $imageName = time() . '_' . $image->getClientOriginalName();
            $imagePath = $image->storeAs('drivers/profiles', $imageName, 'public');
            $updateData['profile_image'] = asset('storage/' . $imagePath);
        }

        $updateData = array_merge($updateData, [
            'name' => $validated['name'] ?? $driver->name,
            'phone' => $validated['phone'] ?? $driver->phone,
            'governorate_id' => $validated['governorate_id'] ?? $driver->governorate_id,
            'area_id' => $validated['area_id'] ?? $driver->area_id,
        ]);

        $driver->update($updateData);

        return $this->success([
            'driver' => $driver->fresh(),
        ], 'تم تحديث الملف الشخصي بنجاح');
    }

    /**
     * Toggle online status
     */
    public function toggleOnline(): JsonResponse
    {
        try {
            $isOnline = $this->driverService->toggleOnlineStatus(auth()->user());

            return $this->success([
                'is_online' => $isOnline,
            ], 'تم تحديث الحالة بنجاح');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * Get driver working hours
     */
    public function getHours(): JsonResponse
    {
        $hours = $this->driverService->getDriverHours(auth()->user());

        return $this->success([
            'hours' => $hours,
        ]);
    }

    /**
     * Update driver working hours
     */
    public function updateHours(ScheduleRequest $request): JsonResponse
    {
        try {
            $this->driverService->updateDriverHours(
                auth()->user(),
                $request->input('schedules')
            );

            return $this->success(null, 'تم تحديث ساعات العمل بنجاح');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * Get current orders (assigned to driver)
     */
    public function currentOrders(): JsonResponse
    {
        $driver = auth()->user();

        // Get orders assigned to this driver
        $orders = \App\Models\Order::with(['customer', 'address', 'items', 'storeSplits.store'])
            ->where('driver_id', $driver->id)
            ->whereIn('status', ['accepted_by_driver', 'confirmed', 'preparing', 'ready', 'picked_up'])
            ->latest()
            ->get();

        return $this->success($orders);
    }

    /**
     * Get dashboard stats
     */
    public function dashboard(): JsonResponse
    {
        $driver = auth()->user();

        $today = now()->startOfDay();

        // Get orders assigned to driver today
        $todayOrders = \App\Models\Order::where('driver_id', $driver->id)
            ->whereDate('created_at', '>=', $today)
            ->get();

        $completedOrders = $todayOrders->filter(function($order) {
            return in_array($order->status, ['delivered', 'completed']);
        });

        $todayEarnings = $completedOrders->sum('delivery_fee') ?? 0;

        return $this->success([
            'today_orders' => $todayOrders->count(),
            'today_earnings' => $todayEarnings,
            'completed_orders' => $completedOrders->count(),
            'rating' => $driver->rating ?? 5.0,
            'is_online' => $driver->is_online ?? false,
        ]);
    }

    /**
     * Get order history
     */
    public function orderHistory(): JsonResponse
    {
        $history = $this->driverService->getOrderHistory(auth()->user());

        return $this->success($history);
    }

    /**
     * Get available orders (for drivers to accept)
     */
    public function availableOrders(Request $request): JsonResponse
    {
        $driver = auth()->user();

        // Get pending orders in driver's area
        $orders = \App\Models\Order::with(['customer', 'address', 'items'])
            ->where('status', 'pending')
            ->where('driver_id', null)
            ->whereHas('address', function ($q) use ($driver) {
                if ($driver->governorate_id) {
                    $q->where('governorate_id', $driver->governorate_id);
                }
                if ($driver->area_id) {
                    $q->where('area_id', $driver->area_id);
                }
            })
            ->latest()
            ->get();

        return $this->success($orders);
    }

    /**
     * Approve driver (admin only)
     */
    public function approve(User $driver): JsonResponse
    {
        if ($driver->role !== 'driver') {
            return $this->error('المستخدم ليس سائق', 400);
        }

        $this->driverService->approveDriver($driver);

        return $this->success(null, 'تمت الموافقة على السائق بنجاح');
    }

    /**
     * Reject driver (admin only)
     */
    public function reject(User $driver, Request $request): JsonResponse
    {
        if ($driver->role !== 'driver') {
            return $this->error('المستخدم ليس سائق', 400);
        }

        $request->validate([
            'reason' => ['required', 'string'],
        ]);

        $this->driverService->rejectDriver($driver, $request->reason);

        return $this->success(null, 'تم رفض السائق');
    }
}
