<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NotificationPreference extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'enable_in_app',
        'enable_push',
        'enable_whatsapp',
        'order_updates',
        'message_updates',
        'marketing_messages',
        'quiet_hours_start',
        'quiet_hours_end',
        'respect_quiet_hours',
    ];

    protected $casts = [
        'enable_in_app' => 'boolean',
        'enable_push' => 'boolean',
        'enable_whatsapp' => 'boolean',
        'order_updates' => 'boolean',
        'message_updates' => 'boolean',
        'marketing_messages' => 'boolean',
        'respect_quiet_hours' => 'boolean',
        'quiet_hours_start' => 'string',
        'quiet_hours_end' => 'string',
    ];

    /**
     * Get the user that owns the preferences.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Check if a channel is enabled for this user.
     */
    public function isChannelEnabled(string $channel): bool
    {
        $channelMap = [
            'in_app' => 'enable_in_app',
            'push' => 'enable_push',
            'whatsapp' => 'enable_whatsapp',
        ];

        $field = $channelMap[$channel] ?? null;
        if (!$field) {
            return false;
        }

        return (bool) $this->$field;
    }

    /**
     * Check if notification type is enabled.
     */
    public function isTypeEnabled(string $type): bool
    {
        $typeMap = [
            'order' => 'order_updates',
            'message' => 'message_updates',
            'chat' => 'message_updates',
            'marketing' => 'marketing_messages',
            'broadcast' => 'marketing_messages',
        ];

        // Check prefix matching
        foreach ($typeMap as $prefix => $field) {
            if (str_starts_with($type, $prefix)) {
                return (bool) $this->$field;
            }
        }

        return true; // Unknown types are allowed by default
    }

    /**
     * Check if should send notification based on quiet hours.
     */
    public function isWithinQuietHours(): bool
    {
        if (!$this->respect_quiet_hours) {
            return false;
        }

        if (!$this->quiet_hours_start || !$this->quiet_hours_end) {
            return false;
        }

        $now = now();
        $start = Carbon::parse($this->quiet_hours_start);
        $end = Carbon::parse($this->quiet_hours_end);

        // Handle overnight quiet hours (e.g., 22:00 - 08:00)
        if ($start->gt($end)) {
            return $now->gte($start) || $now->lte($end);
        }

        // Same day quiet hours (e.g., 14:00 - 16:00)
        return $now->between($start, $end);
    }

    /**
     * Check if notification should be sent considering all preferences.
     */
    public function shouldSend(string $channel, string $type): bool
    {
        // Check quiet hours first
        if ($this->isWithinQuietHours()) {
            return false;
        }

        // Check channel preference
        if (!$this->isChannelEnabled($channel)) {
            return false;
        }

        // Check notification type
        if (!$this->isTypeEnabled($type)) {
            return false;
        }

        return true;
    }

    /**
     * Get formatted quiet hours for API response.
     */
    public function getQuietHoursFormatted(): ?array
    {
        if (!$this->quiet_hours_start || !$this->quiet_hours_end) {
            return null;
        }

        return [
            'start' => $this->quiet_hours_start,
            'end' => $this->quiet_hours_end,
            'enabled' => $this->respect_quiet_hours,
        ];
    }
}
