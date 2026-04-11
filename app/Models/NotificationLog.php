<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NotificationLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'type',
        'entity_type',
        'entity_id',
        'sent_at',
    ];

    protected $casts = [
        'sent_at' => 'datetime',
        'entity_id' => 'integer',
    ];

    /**
     * Get the user that owns the log.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope: Logs for a specific user.
     */
    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope: Logs of a specific type.
     */
    public function scopeOfType($query, string $type)
    {
        return $query->where('type', $type);
    }

    /**
     * Scope: Logs sent within a time window.
     */
    public function scopeSentWithin($query, int $minutes)
    {
        return $query->where('sent_at', '>=', now()->subMinutes($minutes));
    }

    /**
     * Check if a duplicate exists within time window.
     */
    public static function hasDuplicate(int $userId, string $type, ?string $entityType = null, $entityId = null, int $withinMinutes = 5): bool
    {
        $query = self::where('user_id', $userId)
            ->where('type', $type)
            ->where('sent_at', '>=', now()->subMinutes($withinMinutes));

        if ($entityType && $entityId) {
            $query->where('entity_type', $entityType)
                ->where('entity_id', $entityId);
        }

        return $query->exists();
    }

    /**
     * Clean up old logs (older than specified days).
     */
    public static function cleanupOldLogs(int $days = 7): int
    {
        return self::where('sent_at', '<', now()->subDays($days))->delete();
    }
}
