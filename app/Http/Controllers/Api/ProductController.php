<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\Product\ProductRequest;
use App\Models\Product;
use App\Models\ProductOption;
use App\Models\ProductOptionItem;
use App\Models\Store;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProductController extends ApiController
{
    /**
     * Get products for a store
     */
    public function index(Store $store): JsonResponse
    {
        if (!$store->is_approved || !$store->is_active) {
            return $this->error('Store not found', 404);
        }

        $products = $store->products()
            ->with('options.items')
            ->sorted()
            ->get();

        return $this->success($products);
    }

    /**
     * Get product by ID
     */
    public function show(Product $product): JsonResponse
    {
        $product->load(['store', 'options.items']);

        return $this->success($product);
    }

    /**
     * Create a new product (store owner)
     */
    public function store(Request $request): JsonResponse
    {
        $user = auth()->user();
        
        if (!$user->isStoreOwner()) {
            return $this->error('Unauthorized. Only store owners can create products', 403);
        }

        $store = \App\Models\Store::where('owner_id', $user->id)->first();
        
        if (!$store) {
            return $this->error('No store associated with your account', 400);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'image' => ['nullable', 'file', 'mimes:jpg,jpeg,png,gif,webp', 'max:2048'],
            'price' => ['required', 'numeric', 'min:0'],
            'is_available' => ['sometimes'], // Accept any truthy/falsy value
            'sort_order' => ['sometimes', 'integer'],
            'category' => ['nullable', 'string'],
        ]);

        try {
            return DB::transaction(function () use ($validated, $request, $store) {
                // Handle image upload
                $imagePath = null;
                if ($request->hasFile('image')) {
                    $image = $request->file('image');
                    $imageName = time() . '_' . $image->getClientOriginalName();
                    $imagePath = $image->storeAs('products', $imageName, 'public');
                    // Use url() instead of asset() to ensure HTTP URL
                    $imagePath = url('storage/' . $imagePath);
                }

                $product = $store->products()->create([
                    'name' => $validated['name'],
                    'description' => $validated['description'] ?? null,
                    'image' => $imagePath,
                    'price' => $validated['price'],
                    'is_available' => isset($validated['is_available']) ? filter_var($validated['is_available'], FILTER_VALIDATE_BOOLEAN) : true,
                    'sort_order' => $validated['sort_order'] ?? 0,
                    'category' => $validated['category'] ?? null,
                ]);

                $product->load('options.items');

                return $this->success([
                    'product' => $product,
                ], 'Product created successfully', 201);
            });
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * Update product (store owner)
     */
    public function update(Request $request, Product $product): JsonResponse
    {
        $store = $product->store;

        if ($store->owner_id !== auth()->id()) {
            return $this->error('Unauthorized', 403);
        }

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'image' => ['nullable', 'image', 'max:2048'],
            'price' => ['sometimes', 'numeric', 'min:0'],
            'is_available' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer'],
            'category' => ['nullable', 'string'],
        ]);

        try {
            $updateData = [];
            
            // Handle image upload
            if ($request->hasFile('image')) {
                $image = $request->file('image');
                $imageName = time() . '_' . $image->getClientOriginalName();
                $imagePath = $image->storeAs('products', $imageName, 'public');
                $updateData['image'] = asset('storage/' . $imagePath);
            }

            // Merge other fields
            $updateData = array_merge($updateData, [
                'name' => $validated['name'] ?? $product->name,
                'description' => $validated['description'] ?? $product->description,
                'price' => $validated['price'] ?? $product->price,
                'is_available' => $validated['is_available'] ?? $product->is_available,
                'sort_order' => $validated['sort_order'] ?? $product->sort_order,
                'category' => $validated['category'] ?? $product->category,
            ]);

            $product->update($updateData);
            $product->fresh();

            return $this->success([
                'product' => $product,
            ], 'Product updated successfully');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * Delete product (store owner)
     */
    public function destroy(Product $product): JsonResponse
    {
        $store = $product->store;

        if ($store->owner_id !== auth()->id()) {
            return $this->error('Unauthorized', 403);
        }

        $product->delete();

        return $this->success(null, 'Product deleted successfully');
    }

    /**
     * Toggle product availability
     */
    public function toggleAvailability(Product $product): JsonResponse
    {
        $store = $product->store;

        if ($store->owner_id !== auth()->id()) {
            return $this->error('Unauthorized', 403);
        }

        $product->update(['is_available' => !$product->is_available]);

        return $this->success([
            'is_available' => $product->is_available,
        ], 'Product availability updated');
    }

    /**
     * Get store owner's products
     */
    public function myProducts(): JsonResponse
    {
        $store = Store::where('owner_id', auth()->id())->first();

        if (!$store) {
            return $this->error('Store not found', 404);
        }

        $products = $store->products()
            ->with('options.items')
            ->sorted()
            ->get();

        return $this->success($products);
    }
}
