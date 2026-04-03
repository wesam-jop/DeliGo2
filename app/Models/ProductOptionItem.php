<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductOptionItem extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'product_option_id',
        'name',
        'price_adjustment',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'price_adjustment' => 'decimal:2',
        ];
    }

    /**
     * Get the option this item belongs to
     */
    public function option()
    {
        return $this->belongsTo(ProductOption::class, 'product_option_id');
    }
}
