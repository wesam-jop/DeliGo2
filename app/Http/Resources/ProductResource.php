<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'image' => $this->image,
            'price' => $this->price,
            'is_available' => $this->is_available,
            'sort_order' => $this->sort_order,
            'options' => ProductOptionResource::collection($this->whenLoaded('options')),
            'created_at' => $this->created_at,
        ];
    }
}
