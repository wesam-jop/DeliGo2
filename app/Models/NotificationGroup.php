<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NotificationGroup extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'type',
        'entity_type',
        'count',
        'last_entity_id',
        'entity_ids',
        'expires_at',
        'is_dispatched',
        'dispatched_at',
    ];

    protected $casts = [
        'count' => 'integer',
        'last_entity_id' => 'integer',
        'entity_ids' => 'array',
        'expires_at' => 'datetime',
        'is_dispatched' => 'boolean',
        'dispatched_at' => 'datetime',
    ];

    /**
     * Get the user that owns the notification group.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Add an entity ID to the group.
     */
    public function addEntity(int $entityId): void
    {
        $entityIds = $this->entity_ids ?? [];
        $entityIds[] = $entityId;
        
        $this->update([
            'count' => count($entityIds),
            'last_entity_id' => $entityId,
            'entity_ids' => $entityIds,
        ]);
    }

    /**
     * Get grouped message based on count.
     */
    public function getGroupedMessage(string $singleMessage, string $pluralMessage): string
    {
        if ($this->count === 1) {
            return $singleMessage;
        }

        return str_replace('{count}', (string) $this->count, $pluralMessage);
    }

    /**
     * Get action URL based on group count.
     */
    public function getActionUrl(?string $singleUrl, ?string $groupUrl): ?string
    {
        if ($this->count === 1 && $singleUrl) {
            return $singleUrl;
        }

        return $groupUrl;
    }

    /**
     * Check if group is expired.
     */
    public function isExpired(): bool
    {
        return now()->gte($this->expires_at);
    }

    /**
     * Mark group as dispatched.
     */
    public function markAsDispatched(): void
    {
        $this->update([
            'is_dispatched' => true,
            'dispatched_at' => now(),
        ]);
    }

    /**
     * Scope: Active (not expired, not dispatched) groups.
     */
    public function scopeActive($query)
    {
        return $query->where('is_dispatched', false)
            ->where('expires_at', '>', now());
    }

    /**
     * Scope: Find group for specific user and type.
     */
    public function scopeForUserAndType($query, int $userId, string $type, ?string $entityType = null)
    {
        $query = $query->where('user_id', $userId)
            ->where('type', $type)
            ->where('is_dispatched', false)
            ->where('expires_at', '>', now());

        if ($entityType) {
            $query->where('entity_type', $entityType);
        }

        return $query;
    }

    /**
     * Clean up old dispatched groups.
     */
    public static function cleanupOldGroups(int $days = 1): int
    {
        return self::where('is_dispatched', true)
            ->where('dispatched_at', '<', now()->subDays($days))
            ->delete();
    }

    /**
     * Clean up expired groups.
     */
    public static function cleanupExpiredGroups(): int
    {
        return self::where('expires_at', '<', now())
            ->where('is_dispatched', false)
            ->delete();
    }
}
