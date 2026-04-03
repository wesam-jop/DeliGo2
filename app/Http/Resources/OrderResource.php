<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
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
            'order_number' => $this->order_number,
            'customer' => new UserResource($this->whenLoaded('customer')),
            'driver' => new UserResource($this->whenLoaded('driver')),
            'address' => new CustomerAddressResource($this->whenLoaded('address')),
            'latitude' => $this->latitude,
            'longitude' => $this->longitude,
            'subtotal' => $this->subtotal,
            'delivery_fee' => $this->delivery_fee,
            'total' => $this->total,
            'status' => $this->status,
            'notes' => $this->notes,
            'items' => OrderItemResource::collection($this->whenLoaded('items')),
            'store_splits' => OrderStoreSplitResource::collection($this->whenLoaded('storeSplits')),
            'status_history' => OrderStatusHistoryResource::collection($this->whenLoaded('statusHistory')),
            'delivered_at' => $this->delivered_at,
            'created_at' => $this->created_at,
        ];
    }
}
