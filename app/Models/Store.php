<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Store extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'owner_id',
        'name',
        'description',
        'category_id',
        'image',
        'phone',
        'latitude',
        'longitude',
        'governorate_id',
        'area_id',
        'address_details',
        'is_approved',
        'rejection_reason',
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
            'latitude' => 'decimal:8',
            'longitude' => 'decimal:8',
            'is_approved' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    /**
     * Get the owner of the store
     */
    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    /**
     * Get the category of the store
     */
    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * Get the governorate of the store
     */
    public function governorate()
    {
        return $this->belongsTo(Governorate::class);
    }

    /**
     * Get the area of the store
     */
    public function area()
    {
        return $this->belongsTo(Area::class);
    }

    /**
     * Get products for this store
     */
    public function products()
    {
        return $this->hasMany(Product::class);
    }

    /**
     * Get schedules for this store
     */
    public function schedules()
    {
        return $this->morphMany(Schedule::class, 'schedulable');
    }

    /**
     * Get order store splits
     */
    public function orderSplits()
    {
        return $this->hasMany(OrderStoreSplit::class);
    }

    /**
     * Scope for approved stores
     */
    public function scopeApproved($query)
    {
        return $query->where('is_approved', true);
    }

    /**
     * Scope for active stores
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Check if store is currently open based on schedules
     */
    public function isOpenNow(): bool
    {
        $day = strtolower(now()->format('l'));
        $currentTime = now()->format('H:i:s');

        $schedule = $this->schedules()
            ->where('day', $day)
            ->where('is_active', true)
            ->first();

        if (!$schedule) {
            return false;
        }

        return $currentTime >= $schedule->from_time && $currentTime <= $schedule->to_time;
    }

    /**
     * Get distance from a given point (in kilometers)
     */
    public function getDistanceFrom(float $lat, float $lng): float
    {
        if (!$this->latitude || !$this->longitude) {
            return PHP_FLOAT_MAX;
        }

        $earthRadius = 6371;

        $dLat = deg2rad($lat - $this->latitude);
        $dLng = deg2rad($lng - $this->longitude);

        $a = sin($dLat / 2) * sin($dLat / 2) +
            cos(deg2rad($this->latitude)) * cos(deg2rad($lat)) *
            sin($dLng / 2) * sin($dLng / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }
    /**
     * Get the store's image URL.
     */
    public function getImageAttribute($value)
    {
        if (!$value) return null;
        if (str_starts_with($value, 'http')) return $value;
        return url('storage/' . $value);
    }

    /**
     * Get all of the store's favorites.
     */
    public function favorites()
    {
        return $this->morphMany(Favorite::class, 'favoritable');
    }
}
