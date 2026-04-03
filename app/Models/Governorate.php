<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Governorate extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name_en',
        'name_ar',
        'delivery_fee',
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
            'delivery_fee' => 'decimal:2',
        ];
    }

    /**
     * Get areas in this governorate
     */
    public function areas()
    {
        return $this->hasMany(Area::class);
    }

    /**
     * Get users (drivers) in this governorate
     */
    public function users()
    {
        return $this->hasMany(User::class);
    }

    /**
     * Get stores in this governorate
     */
    public function stores()
    {
        return $this->hasMany(Store::class);
    }

    /**
     * Get customer addresses in this governorate
     */
    public function customerAddresses()
    {
        return $this->hasMany(CustomerAddress::class);
    }

    /**
     * Scope for active governorates
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
