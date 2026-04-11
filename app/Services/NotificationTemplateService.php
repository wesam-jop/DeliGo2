<?php

namespace App\Services;

use Illuminate\Support\Str;

/**
 * Notification Template Service
 * 
 * Resolves notification templates and replaces placeholders with actual values.
 */
class NotificationTemplateService
{
    /**
     * Resolve a notification template with data
     *
     * @param string $templateKey The template key (e.g., 'order_created')
     * @param array $data Data to replace placeholders (e.g., ['order_id' => 123])
     * @param array $overrides Override values for sound, silent, etc.
     * @return array Resolved notification payload
     */
    public static function resolve(string $templateKey, array $data = [], array $overrides = []): array
    {
        $templates = config('notification_templates');
        $template = $templates[$templateKey] ?? $templates['default'] ?? [];

        // Extract template fields
        $title = $template['title'] ?? '{title}';
        $message = $template['message'] ?? '{message}';
        $actionUrl = $template['action_url'] ?? null;
        $priority = $template['priority'] ?? 'medium';
        $type = $template['type'] ?? 'app.system';
        $channels = $template['channels'] ?? ['in_app'];
        $sound = $template['sound'] ?? 'default';
        $silent = $template['silent'] ?? false;

        // Replace placeholders in title
        foreach ($data as $key => $value) {
            $placeholder = '{' . $key . '}';
            $title = str_replace($placeholder, (string) $value, $title);
            $message = str_replace($placeholder, (string) $value, $message);

            if ($actionUrl) {
                $actionUrl = str_replace($placeholder, (string) $value, $actionUrl);
            }
        }

        // Remove any remaining unmatched placeholders
        $title = preg_replace('/\{[^}]+\}/', '', $title);
        $message = preg_replace('/\{[^}]+\}/', '', $message);
        if ($actionUrl) {
            $actionUrl = preg_replace('/\{[^}]+\}/', '', $actionUrl);
        }

        // Allow overrides for sound and silent
        $finalSound = $overrides['sound'] ?? $sound;
        $finalSilent = $overrides['silent'] ?? $silent;

        // If silent is true, disable sound
        if ($finalSilent) {
            $finalSound = null;
        }

        return [
            'title' => trim($title),
            'message' => trim($message),
            'action_url' => $actionUrl ? trim($actionUrl) : null,
            'priority' => $priority,
            'type' => $type,
            'channels' => $channels,
            'sound' => $finalSound,
            'silent' => $finalSilent,
        ];
    }

    /**
     * Generate mobile deep link from action URL
     *
     * @param string|null $actionUrl Web action URL (e.g., '/orders/123')
     * @param string $scheme Mobile app scheme (e.g., 'deligo')
     * @return string|null Mobile deep link (e.g., 'deligo://orders/123')
     */
    public static function generateMobileDeepLink(?string $actionUrl, string $scheme = 'deligo'): ?string
    {
        if (!$actionUrl) {
            return null;
        }

        // If already a deep link, return as is
        if (strpos($actionUrl, '://') !== false) {
            return $actionUrl;
        }

        // Convert web URL to deep link
        return $scheme . ':' . $actionUrl;
    }

    /**
     * Get sound file path for notification type
     *
     * @param string $type Notification type
     * @return string Sound filename
     */
    public static function getSoundForType(string $type): string
    {
        $soundMap = [
            'order.created' => 'order_new.mp3',
            'order.accepted' => 'order_accepted.mp3',
            'order.cancelled' => 'order_cancelled.mp3',
            'message.received' => 'message.mp3',
            'conversation.created' => 'message.mp3',
            'broadcast' => 'default.mp3',
        ];

        return $soundMap[$type] ?? 'default.mp3';
    }

    /**
     * Get all available template keys
     *
     * @return array
     */
    public static function getAvailableTemplates(): array
    {
        return array_keys(config('notification_templates', []));
    }

    /**
     * Get a specific template without resolving
     *
     * @param string $templateKey
     * @return array
     */
    public static function getTemplate(string $templateKey): array
    {
        return config("notification_templates.{$templateKey}", config('notification_templates.default', []));
    }

    /**
     * Check if a template exists
     *
     * @param string $templateKey
     * @return bool
     */
    public static function hasTemplate(string $templateKey): bool
    {
        return config()->has("notification_templates.{$templateKey}");
    }

    /**
     * Map order status to template key
     *
     * @param string $status
     * @return string
     */
    public static function getTemplateForOrderStatus(string $status): string
    {
        $mapping = [
            'pending' => 'order_created',
            'accepted_by_driver' => 'order_accepted',
            'confirmed' => 'order_confirmed',
            'preparing' => 'order_preparing',
            'ready' => 'order_ready',
            'picked_up' => 'order_picked_up',
            'delivered' => 'order_delivered',
            'cancelled' => 'order_cancelled',
        ];

        return $mapping[$status] ?? 'order_created';
    }

    /**
     * Validate action URL format
     *
     * @param string|null $url
     * @return bool
     */
    public static function isValidActionUrl(?string $url): bool
    {
        if (!$url) {
            return false;
        }

        // Allow relative URLs starting with /
        if (Str::startsWith($url, '/')) {
            return true;
        }

        // Allow full URLs
        return filter_var($url, FILTER_VALIDATE_URL) !== false;
    }
}
