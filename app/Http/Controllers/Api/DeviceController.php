<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DeviceToken;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;

class DeviceController extends Controller
{
    /**
     * Register a device token for push notifications.
     *
     * POST /api/v1/devices/register
     */
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'token' => 'required|string|max:500',
            'device_type' => ['sometimes', 'string', Rule::in(['ios', 'android', 'web'])],
            'device_name' => 'sometimes|string|max:255',
        ]);

        $user = $request->user();

        // Update or create device token
        $deviceToken = DeviceToken::updateOrCreate(
            [
                'user_id' => $user->id,
                'token' => $validated['token'],
            ],
            [
                'device_type' => $validated['device_type'] ?? null,
                'device_name' => $validated['device_name'] ?? null,
                'is_active' => true,
                'last_used_at' => now(),
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'تم تسجيل الجهاز بنجاح',
            'data' => [
                'id' => $deviceToken->id,
                'device_type' => $deviceToken->device_type,
                'device_name' => $deviceToken->device_name,
                'is_active' => $deviceToken->is_active,
                'last_used_at' => $deviceToken->last_used_at?->toIso8601String(),
            ],
        ]);
    }

    /**
     * Unregister a device token.
     *
     * POST /api/v1/devices/unregister
     */
    public function unregister(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'token' => 'required|string',
        ]);

        $user = $request->user();

        $deleted = DeviceToken::where('user_id', $user->id)
            ->where('token', $validated['token'])
            ->update(['is_active' => false]);

        if (!$deleted) {
            return response()->json([
                'success' => false,
                'message' => 'الجهاز غير موجود',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'تم إلغاء تسجيل الجهاز بنجاح',
        ]);
    }

    /**
     * Get all registered devices for the user.
     *
     * GET /api/v1/devices
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $devices = $user->deviceTokens()
            ->orderByDesc('last_used_at')
            ->get()
            ->map(function ($device) {
                return [
                    'id' => $device->id,
                    'device_type' => $device->device_type,
                    'device_type_label' => $device->getDeviceTypeLabel(),
                    'device_name' => $device->device_name,
                    'is_active' => $device->is_active,
                    'last_used_at' => $device->last_used_at?->toIso8601String(),
                    'created_at' => $device->created_at->toIso8601String(),
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $devices,
        ]);
    }

    /**
     * Unregister all devices for the user.
     *
     * POST /api/v1/devices/unregister-all
     */
    public function unregisterAll(Request $request): JsonResponse
    {
        $user = $request->user();

        $count = $user->deviceTokens()
            ->where('is_active', true)
            ->update(['is_active' => false]);

        return response()->json([
            'success' => true,
            'message' => "تم إلغاء تسجيل {$count} جهاز(أجهزة)",
            'unregistered_count' => $count,
        ]);
    }
}
