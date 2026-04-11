<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Advertisement extends Model
{
    use HasFactory;

    protected $fillable = [
        'type',
        'placement',
        'title',
        'description',
        'media_url',
        'media_type',
        'link_url',
        'start_date',
        'end_date',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'is_active' => 'boolean',
    ];

    /**
     * Scope: only active advertisements
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope: currently running (within date range)
     */
    public function scopeRunning($query)
    {
        $today = now()->toDateString();
        return $query->where('start_date', '<=', $today)
            ->where('end_date', '>=', $today);
    }

    /**
     * Scope: filter by placement
     */
    public function scopePlacement($query, string $placement)
    {
        return $query->where('placement', $placement);
    }

    /**
     * Scope: filter by type
     */
    public function scopeType($query, string $type)
    {
        return $query->where('type', $type);
    }

    /**
     * Get the full media URL
     */
    public function getMediaUrlFullAttribute()
    {
        if (!$this->media_url) {
            return null;
        }
        if (str_starts_with($this->media_url, 'http')) {
            return $this->media_url;
        }
        return url('storage/' . $this->media_url);
    }

    /**
     * Check if ad is currently active (within date range)
     */
    public function getIsCurrentlyRunningAttribute(): bool
    {
        $today = now()->toDateString();
        return $this->is_active
            && $this->start_date <= $today
            && $this->end_date >= $today;
    }
}
