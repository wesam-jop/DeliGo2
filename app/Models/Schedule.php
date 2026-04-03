<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Schedule extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'schedulable_type',
        'schedulable_id',
        'day',
        'from_time',
        'to_time',
        'is_active',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    /**
     * Get the parent schedulable model (store or user/driver)
     */
    public function schedulable()
    {
        return $this->morphTo();
    }

    /**
     * Scope for active schedules
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope for specific day
     */
    public function scopeForDay($query, string $day)
    {
        return $query->where('day', $day);
    }

    /**
     * Check if schedule is currently active
     */
    public function isCurrentlyActive(): bool
    {
        if (!$this->is_active) {
            return false;
        }

        $currentTime = now()->format('H:i:s');

        return $currentTime >= $this->from_time && $currentTime <= $this->to_time;
    }
}
