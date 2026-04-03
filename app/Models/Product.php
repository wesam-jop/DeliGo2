<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'store_id',
        'name',
        'description',
        'image',
        'price',
        'is_available',
        'sort_order',
        'category',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'is_available' => 'boolean',
        ];
    }

    /**
     * Get the store this product belongs to
     */
    public function store()
    {
        return $this->belongsTo(Store::class);
    }

    /**
     * Get options for this product
     */
    public function options()
    {
        return $this->hasMany(ProductOption::class);
    }

    /**
     * Get order items for this product
     */
    public function orderItems()
    {
        return $this->hasMany(OrderItem::class);
    }

    /**
     * Scope for available products
     */
    public function scopeAvailable($query)
    {
        return $query->where('is_available', true);
    }

    /**
     * Scope ordered by sort order
     */
    public function scopeSorted($query)
    {
        return $query->orderBy('sort_order')->orderBy('name');
    }
    /**
     * Get the product's image URL.
     */
    public function getImageAttribute($value)
    {
        if (!$value) return null;
        if (str_starts_with($value, 'http')) return $value;
        return url('storage/' . $value);
    }

    /**
     * Get all of the product's favorites.
     */
    public function favorites()
    {
        return $this->morphMany(Favorite::class, 'favoritable');
    }
}
