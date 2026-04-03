<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Area extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'governorate_id',
        'name_en',
        'name_ar',
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
     * Get the governorate this area belongs to
     */
    public function governorate()
    {
        return $this->belongsTo(Governorate::class);
    }

    /**
     * Get users (drivers) in this area
     */
    public function users()
    {
        return $this->hasMany(User::class);
    }

    /**
     * Get stores in this area
     */
    public function stores()
    {
        return $this->hasMany(Store::class);
    }

    /**
     * Get customer addresses in this area
     */
    public function customerAddresses()
    {
        return $this->hasMany(CustomerAddress::class);
    }

    /**
     * Scope for active areas
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
