<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CustomerAddress extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'customer_id',
        'label',
        'address_details',
        'latitude',
        'longitude',
        'governorate_id',
        'area_id',
        'is_default',
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
            'is_default' => 'boolean',
        ];
    }

    /**
     * Get the customer who owns this address
     */
    public function customer()
    {
        return $this->belongsTo(User::class, 'customer_id');
    }

    /**
     * Get the governorate of this address
     */
    public function governorate()
    {
        return $this->belongsTo(Governorate::class);
    }

    /**
     * Get the area of this address
     */
    public function area()
    {
        return $this->belongsTo(Area::class);
    }

    /**
     * Get orders for this address
     */
    public function orders()
    {
        return $this->hasMany(Order::class, 'address_id');
    }

    /**
     * Scope for default address
     */
    public function scopeDefault($query)
    {
        return $query->where('is_default', true);
    }

    /**
     * Set as default address (and unset others)
     */
    public function setAsDefault(): void
    {
        $this->customer->addresses()->update(['is_default' => false]);
        $this->update(['is_default' => true]);
    }
}
