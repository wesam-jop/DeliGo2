<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Favorite;
use App\Models\Product;
use App\Models\Store;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class FavoriteController extends Controller
{
    /**
     * Get all favorites for the authenticated user.
     */
    public function index()
    {
        $favorites = Auth::user()->favorites()
            ->with(['favoritable'])
            ->latest()
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $favorites,
        ]);
    }

    /**
     * Toggle favorite for a store.
     */
    public function toggleStore(Store $store)
    {
        $user = Auth::user();
        
        $favorite = $user->favorites()
            ->where('favoritable_id', $store->id)
            ->where('favoritable_type', Store::class)
            ->first();

        if ($favorite) {
            $favorite->delete();
            return response()->json([
                'status' => 'success',
                'message' => 'Store removed from favorites',
                'is_favorite' => false,
            ]);
        }

        $user->favorites()->create([
            'favoritable_id' => $store->id,
            'favoritable_type' => Store::class,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Store added to favorites',
            'is_favorite' => true,
        ]);
    }

    /**
     * Toggle favorite for a product.
     */
    public function toggleProduct(Product $product)
    {
        $user = Auth::user();
        
        $favorite = $user->favorites()
            ->where('favoritable_id', $product->id)
            ->where('favoritable_type', Product::class)
            ->first();

        if ($favorite) {
            $favorite->delete();
            return response()->json([
                'status' => 'success',
                'message' => 'Product removed from favorites',
                'is_favorite' => false,
            ]);
        }

        $user->favorites()->create([
            'favoritable_id' => $product->id,
            'favoritable_type' => Product::class,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Product added to favorites',
            'is_favorite' => true,
        ]);
    }
}
