<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\Customer\CustomerAddressRequest;
use App\Models\CustomerAddress;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CustomerController extends ApiController
{
    /**
     * Get customer dashboard statistics
     */
    public function dashboard(): JsonResponse
    {
        $customer = auth()->user();
        $customerId = $customer->id;

        // Get total orders count
        $totalOrders = Order::where('customer_id', $customerId)->count();

        // Get active orders (not delivered or cancelled)
        $activeOrders = Order::where('customer_id', $customerId)
            ->whereIn('status', ['pending', 'confirmed', 'preparing', 'ready', 'picked_up'])
            ->count();

        // Get completed orders
        $completedOrders = Order::where('customer_id', $customerId)
            ->where('status', 'delivered')
            ->count();

        // Get cancelled orders
        $cancelledOrders = Order::where('customer_id', $customerId)
            ->where('status', 'cancelled')
            ->count();

        // Get total spent
        $totalSpent = Order::where('customer_id', $customerId)
            ->where('status', 'delivered')
            ->sum('total');

        // Get addresses count
        $addressesCount = CustomerAddress::where('customer_id', $customerId)->count();

        // Get current active order (if any)
        $currentOrder = Order::where('customer_id', $customerId)
            ->whereIn('status', ['pending', 'confirmed', 'preparing', 'ready', 'picked_up'])
            ->with(['store', 'items.product'])
            ->latest()
            ->first();

        // Get last order date
        $lastOrder = Order::where('customer_id', $customerId)
            ->latest()
            ->first();

        return $this->success([
            'statistics' => [
                'total_orders' => $totalOrders,
                'active_orders' => $activeOrders,
                'completed_orders' => $completedOrders,
                'cancelled_orders' => $cancelledOrders,
                'total_spent' => $totalSpent,
                'addresses_count' => $addressesCount,
            ],
            'current_order' => $currentOrder,
            'last_order_date' => $lastOrder?->created_at,
        ]);
    }

    /**
     * Get customer profile
     */
    public function profile(): JsonResponse
    {
        $customer = auth()->user()->load(['governorate', 'area']);

        return $this->success($customer);
    }

    /**
     * Update customer profile
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $customer = auth()->user();

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'phone' => ['sometimes', 'string'],
            'governorate_id' => ['sometimes', 'exists:governorates,id'],
            'area_id' => ['sometimes', 'exists:areas,id'],
            'profile_image' => ['nullable', 'image', 'max:2048'],
        ]);

        $updateData = [];
        
        // Handle image upload
        if ($request->hasFile('profile_image')) {
            $image = $request->file('profile_image');
            $imageName = time() . '_' . $image->getClientOriginalName();
            $imagePath = $image->storeAs('customers/profiles', $imageName, 'public');
            $updateData['profile_image'] = asset('storage/' . $imagePath);
        }

        // Merge other fields
        $updateData = array_merge($updateData, [
            'name' => $validated['name'] ?? $customer->name,
            'phone' => $validated['phone'] ?? $customer->phone,
            'governorate_id' => $validated['governorate_id'] ?? $customer->governorate_id,
            'area_id' => $validated['area_id'] ?? $customer->area_id,
        ]);

        $customer->update($updateData);

        return $this->success([
            'customer' => $customer->fresh(),
        ], 'Profile updated successfully');
    }

    /**
     * Get customer addresses
     */
    public function addresses(): JsonResponse
    {
        $addresses = auth()->user()
            ->addresses()
            ->with(['governorate', 'area'])
            ->latest()
            ->get();

        return $this->success($addresses);
    }

    /**
     * Add new address
     */
    public function addAddress(CustomerAddressRequest $request): JsonResponse
    {
        try {
            $validated = $request->validated();
            $validated['customer_id'] = auth()->id();

            // If this is set as default, unset other defaults
            if (isset($validated['is_default']) && $validated['is_default']) {
                auth()->user()->addresses()->update(['is_default' => false]);
            }

            $address = CustomerAddress::create($validated);
            $address->load(['governorate', 'area']);

            return $this->success([
                'address' => $address,
            ], 'Address added successfully', 201);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * Update address
     */
    public function updateAddress(CustomerAddressRequest $request, CustomerAddress $address): JsonResponse
    {
        if ($address->customer_id !== auth()->id()) {
            return $this->error('Unauthorized', 403);
        }

        try {
            $validated = $request->validated();

            // If this is set as default, unset other defaults
            if (isset($validated['is_default']) && $validated['is_default']) {
                auth()->user()->addresses()->update(['is_default' => false]);
            }

            $address->update($validated);
            $address->load(['governorate', 'area']);

            return $this->success([
                'address' => $address,
            ], 'Address updated successfully');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * Delete address
     */
    public function deleteAddress(CustomerAddress $address): JsonResponse
    {
        if ($address->customer_id !== auth()->id()) {
            return $this->error('Unauthorized', 403);
        }

        $address->delete();

        return $this->success(null, 'Address deleted successfully');
    }

    /**
     * Set default address
     */
    public function setDefaultAddress(CustomerAddress $address): JsonResponse
    {
        if ($address->customer_id !== auth()->id()) {
            return $this->error('Unauthorized', 403);
        }

        $address->setAsDefault();

        return $this->success([
            'address' => $address,
        ], 'Default address updated');
    }

    /**
     * Get default address
     */
    public function getDefaultAddress(): JsonResponse
    {
        $address = auth()->user()
            ->addresses()
            ->default()
            ->with(['governorate', 'area'])
            ->first();

        return $this->success([
            'address' => $address,
        ]);
    }
}
