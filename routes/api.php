<?php

use App\Http\Controllers\Api\AdvertisementController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\ChatController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\DriverController;
use App\Http\Controllers\Api\LocationController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\StoreController;
use App\Http\Controllers\Api\FavoriteController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group.
|
*/

// Public routes (no authentication required)
Route::prefix('v1')->group(function () {
    // Authentication routes
    Route::post('/auth/register', [AuthController::class, 'register']);
    Route::post('/auth/login', [AuthController::class, 'login']);
    Route::post('/auth/otp/send/{phone}', [AuthController::class, 'sendOtp']);
    Route::post('/auth/otp/verify', [AuthController::class, 'verifyOtp']);
    Route::post('/auth/verify-otp', [AuthController::class, 'verifyOtp']); // Alias for mobile app compatibility
    Route::post('/auth/otp/resend/{phone}', [AuthController::class, 'resendOtp']);
    Route::get('/auth/verify-email', [AuthController::class, 'verifyEmail']);
    
    // Password reset flow
    Route::post('/auth/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/auth/verify-otp-password', [AuthController::class, 'verifyOtpForPassword']);
    Route::post('/auth/reset-password-after-otp', [AuthController::class, 'resetPasswordAfterOtp']);
    Route::get('/auth/reset-password', [AuthController::class, 'showResetForm']);
    Route::post('/auth/reset-password', [AuthController::class, 'resetPassword']);

    // Driver registration
    Route::post('/driver/register', [DriverController::class, 'register']);

    // Location routes
    Route::get('/locations/governorates', [LocationController::class, 'governorates']);
    Route::get('/locations/governorates/{governorate}', [LocationController::class, 'governorate']);
    Route::get('/locations/governorates/{governorate}/areas', [LocationController::class, 'areas']);
    Route::get('/locations/areas/{area}', [LocationController::class, 'area']);

    // Public store listing
    Route::get('/stores', [StoreController::class, 'index']);
    Route::get('/statistics', [StoreController::class, 'statistics']);
    Route::get('/stores/categories', [StoreController::class, 'categories']);
    Route::get('/stores/nearby', [StoreController::class, 'nearby']);
    Route::get('/stores/{store}', [StoreController::class, 'show']);
    Route::get('/stores/{store}/products', [StoreController::class, 'products']);
    Route::get('/stores/{store}/products/{product}', [StoreController::class, 'product']);
    Route::get('/stores/{store}/hours', [StoreController::class, 'hours']);
    Route::get('/store/hours', [StoreController::class, 'myHours']); // For store owner

    // Advertisements (public - active ads by placement)
    Route::get('/ads/{placement}', [AdvertisementController::class, 'getActiveAds']);
});

// Protected routes (authentication required)
Route::prefix('v1')->middleware('auth:sanctum')->group(function () {
    // Authentication
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);

    // Customer routes
    Route::prefix('customer')->middleware('role:customer')->group(function () {
        Route::get('/dashboard', [CustomerController::class, 'dashboard']);
        Route::get('/profile', [CustomerController::class, 'profile']);
        Route::put('/profile', [CustomerController::class, 'updateProfile']);
        Route::get('/addresses', [CustomerController::class, 'addresses']);
        Route::post('/addresses', [CustomerController::class, 'addAddress']);
        Route::put('/addresses/{address}', [CustomerController::class, 'updateAddress']);
        Route::delete('/addresses/{address}', [CustomerController::class, 'deleteAddress']);
        Route::post('/addresses/{address}/set-default', [CustomerController::class, 'setDefaultAddress']);
        Route::get('/addresses/default', [CustomerController::class, 'getDefaultAddress']);

        // Favorites
        Route::get('/favorites', [FavoriteController::class, 'index']);
        Route::post('/favorites/stores/{store}', [FavoriteController::class, 'toggleStore']);
        Route::post('/favorites/products/{product}', [FavoriteController::class, 'toggleProduct']);

        // Orders
        Route::get('/orders', [OrderController::class, 'index']);
        Route::get('/orders/{order}', [OrderController::class, 'show']);
    });

    // Store Owner routes
    Route::prefix('store')->middleware('role:store_owner')->group(function () {
        Route::get('/', [StoreController::class, 'myStore']);
        Route::get('/products', [ProductController::class, 'myProducts']);
        Route::get('/dashboard', [StoreController::class, 'dashboard']);
        Route::post('/', [StoreController::class, 'store']);
        Route::put('/{store}', [StoreController::class, 'update']);
        Route::post('/products', [ProductController::class, 'store']);
        Route::put('/products/{product}', [ProductController::class, 'update']);
        Route::delete('/products/{product}', [ProductController::class, 'destroy']);
        Route::post('/products/{product}/toggle-availability', [ProductController::class, 'toggleAvailability']);
        Route::post('/hours', [StoreController::class, 'updateHours']);
    });

    // Driver routes
    Route::prefix('driver')->middleware('role:driver')->group(function () {
        Route::get('/profile', [DriverController::class, 'profile']);
        Route::put('/profile', [DriverController::class, 'updateProfile']);
        Route::get('/dashboard', [DriverController::class, 'dashboard']);
        Route::post('/toggle-online', [DriverController::class, 'toggleOnline']);
        Route::get('/orders/current', [DriverController::class, 'currentOrders']);
        Route::get('/orders/history', [DriverController::class, 'orderHistory']);
        Route::get('/orders/available', [DriverController::class, 'availableOrders']);
    });

    // Order routes
    Route::post('orders/check-driver-availability', [OrderController::class, 'checkDriverAvailability']);
    Route::apiResource('orders', OrderController::class)->except(['update', 'destroy']);
    Route::prefix('orders/{order}')->group(function () {
        Route::post('/cancel', [OrderController::class, 'cancel']);
        Route::post('/accept', [OrderController::class, 'accept']);
        Route::post('/mark-preparing', [OrderController::class, 'markAsPreparing']);
        Route::post('/mark-ready', [OrderController::class, 'markAsReady']);
        Route::post('/mark-picked-up', [OrderController::class, 'markAsPickedUp']);
        Route::post('/mark-delivered', [OrderController::class, 'markAsDelivered']);
        Route::get('/history', [OrderController::class, 'history']);
    });

    // Chat routes
    Route::prefix('chat')->middleware('auth:sanctum')->group(function () {
        Route::get('/conversations', [ChatController::class, 'index']);
        Route::post('/conversations/start', [ChatController::class, 'startConversation']);
        Route::post('/conversations/start-with-role', [ChatController::class, 'startConversationWithRole']);
        Route::get('/conversations/{conversation}', [ChatController::class, 'show']);
        Route::get('/conversations/{conversation}/messages', [ChatController::class, 'messages']);
        Route::post('/conversations/{conversation}/messages', [ChatController::class, 'sendMessage']);
        Route::post('/conversations/{conversation}/mark-read', [ChatController::class, 'markAsRead']);
        Route::post('/conversations/{conversation}/leave', [ChatController::class, 'leave']);
        Route::get('/conversations/{conversation}/participants', [ChatController::class, 'participants']);
        Route::get('/unread-count', [ChatController::class, 'unreadCount']);
    });

    // Notification routes
    Route::prefix('notifications')->middleware('auth:sanctum')->group(function () {
        Route::get('/', [NotificationController::class, 'index']);
        Route::get('/unread-count', [NotificationController::class, 'unreadCount']);
        Route::post('/{notification}/read', [NotificationController::class, 'markAsRead']);
        Route::post('/mark-all-read', [NotificationController::class, 'markAllAsRead']);
        Route::get('/topic', [NotificationController::class, 'getTopic']);
        Route::post('/topic', [NotificationController::class, 'updateTopic']);
        Route::post('/test', [NotificationController::class, 'sendTest']);
        Route::get('/settings', [NotificationController::class, 'getSettings']);
    });

    // Admin routes
    Route::prefix('admin')->middleware('role:admin')->group(function () {
        Route::get('/dashboard', [AdminController::class, 'dashboard']);

        // User management
        Route::get('/users', [AdminController::class, 'users']);
        Route::delete('/users/{user}', [AdminController::class, 'deleteUser']);

        // Store approval
        Route::get('/stores/pending', [AdminController::class, 'pendingStores']);
        Route::post('/stores/{store}/approve', [AdminController::class, 'approveStore']);
        Route::post('/stores/{store}/reject', [AdminController::class, 'rejectStore']);

        // Driver approval
        Route::get('/drivers', [AdminController::class, 'allDrivers']);
        Route::get('/drivers/pending', [AdminController::class, 'pendingDrivers']);
        Route::post('/drivers/{driver}/approve', [AdminController::class, 'approveDriver']);
        Route::post('/drivers/{driver}/reject', [AdminController::class, 'rejectDriver']);

        // Order management
        Route::get('/orders', [AdminController::class, 'orders']);
        Route::get('/orders/{order}', [AdminController::class, 'order']);

        // Location management
        Route::get('/locations/governorates', [AdminController::class, 'governorates']);
        Route::post('/locations/governorates', [AdminController::class, 'createGovernorate']);
        Route::post('/locations/governorates/{governorate}', [AdminController::class, 'updateGovernorate']);
        Route::delete('/locations/governorates/{governorate}', [AdminController::class, 'deleteGovernorate']);
        Route::post('/locations/areas', [AdminController::class, 'createArea']);
        Route::post('/locations/areas/{area}', [AdminController::class, 'updateArea']);
        Route::delete('/locations/areas/{area}', [AdminController::class, 'deleteArea']);

        // Category management
        Route::apiResource('categories', CategoryController::class)->except(['create', 'edit']);

        // Broadcast notifications (marketing / reminders)
        Route::post('/notifications/broadcast', [AdminController::class, 'broadcastNotification']);

        // Advertisement management
        Route::get('/ads', [AdvertisementController::class, 'index']);
        Route::post('/ads', [AdvertisementController::class, 'store']);
        Route::put('/ads/{advertisement}', [AdvertisementController::class, 'update']);
        Route::delete('/ads/{advertisement}', [AdvertisementController::class, 'destroy']);
    });
});
