<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class NotificationPreferenceController extends Controller
{
    /**
     * Get user's notification preferences.
     *
     * GET /api/v1/notifications/preferences
     */
    public function get(Request $request): JsonResponse
    {
        $user = $request->user();
        
        // Get or create preferences
        $preferences = $user->notificationPreferences;

        return response()->json([
            'success' => true,
            'data' => [
                'channels' => [
                    'in_app' => $preferences->enable_in_app,
                    'push' => $preferences->enable_push,
                    'whatsapp' => $preferences->enable_whatsapp,
                ],
                'types' => [
                    'order_updates' => $preferences->order_updates,
                    'message_updates' => $preferences->message_updates,
                    'marketing_messages' => $preferences->marketing_messages,
                ],
                'quiet_hours' => $preferences->getQuietHoursFormatted(),
            ],
        ]);
    }

    /**
     * Update user's notification preferences.
     *
     * PUT /api/v1/notifications/preferences
     */
    public function update(Request $request): JsonResponse
    {
        $user = $request->user();
        
        // Get or create preferences
        $preferences = $user->notificationPreferences;

        $validated = $request->validate([
            // Channel preferences
            'channels.in_app' => 'sometimes|boolean',
            'channels.push' => 'sometimes|boolean',
            'channels.whatsapp' => 'sometimes|boolean',
            
            // Notification types
            'types.order_updates' => 'sometimes|boolean',
            'types.message_updates' => 'sometimes|boolean',
            'types.marketing_messages' => 'sometimes|boolean',
            
            // Quiet hours
            'quiet_hours.start' => 'sometimes|nullable|date_format:H:i',
            'quiet_hours.end' => 'sometimes|nullable|date_format:H:i',
            'quiet_hours.enabled' => 'sometimes|boolean',
        ]);

        // Update channel preferences
        if (isset($validated['channels'])) {
            if (isset($validated['channels']['in_app'])) {
                $preferences->enable_in_app = $validated['channels']['in_app'];
            }
            if (isset($validated['channels']['push'])) {
                $preferences->enable_push = $validated['channels']['push'];
            }
            if (isset($validated['channels']['whatsapp'])) {
                $preferences->enable_whatsapp = $validated['channels']['whatsapp'];
            }
        }

        // Update notification types
        if (isset($validated['types'])) {
            if (isset($validated['types']['order_updates'])) {
                $preferences->order_updates = $validated['types']['order_updates'];
            }
            if (isset($validated['types']['message_updates'])) {
                $preferences->message_updates = $validated['types']['message_updates'];
            }
            if (isset($validated['types']['marketing_messages'])) {
                $preferences->marketing_messages = $validated['types']['marketing_messages'];
            }
        }

        // Update quiet hours
        if (isset($validated['quiet_hours'])) {
            if (isset($validated['quiet_hours']['start'])) {
                $preferences->quiet_hours_start = $validated['quiet_hours']['start'];
            }
            if (isset($validated['quiet_hours']['end'])) {
                $preferences->quiet_hours_end = $validated['quiet_hours']['end'];
            }
            if (isset($validated['quiet_hours']['enabled'])) {
                $preferences->respect_quiet_hours = $validated['quiet_hours']['enabled'];
            }
        }

        $preferences->save();

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث تفضيلات الإشعارات بنجاح',
            'data' => [
                'channels' => [
                    'in_app' => $preferences->enable_in_app,
                    'push' => $preferences->enable_push,
                    'whatsapp' => $preferences->enable_whatsapp,
                ],
                'types' => [
                    'order_updates' => $preferences->order_updates,
                    'message_updates' => $preferences->message_updates,
                    'marketing_messages' => $preferences->marketing_messages,
                ],
                'quiet_hours' => $preferences->getQuietHoursFormatted(),
            ],
        ]);
    }

    /**
     * Reset preferences to defaults.
     *
     * POST /api/v1/notifications/preferences/reset
     */
    public function reset(Request $request): JsonResponse
    {
        $user = $request->user();
        
        $preferences = $user->notificationPreferences;
        
        $preferences->update([
            'enable_in_app' => true,
            'enable_push' => true,
            'enable_whatsapp' => true,
            'order_updates' => true,
            'message_updates' => true,
            'marketing_messages' => false,
            'quiet_hours_start' => null,
            'quiet_hours_end' => null,
            'respect_quiet_hours' => false,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'تم إعادة تعيين تفضيلات الإشعارات إلى الإعدادات الافتراضية',
        ]);
    }
}
