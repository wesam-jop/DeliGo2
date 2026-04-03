<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ConversationResource extends JsonResource
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
            'type' => $this->type,
            'order_id' => $this->order_id,
            'order_number' => $this->when($this->order, fn() => $this->order->order_number),
            'display_name' => $this->getDisplayName($request->user()),
            'display_image' => $this->when($this->type === 'direct', function () use ($request) {
                return $this->activeUsers()
                    ->where('users.id', '!=', $request->user()->id)
                    ->first()?->profile_image;
            }),
            'last_message' => new MessageResource($this->whenLoaded('lastMessage')),
            'last_message_at' => $this->last_message_at?->toIso8601String(),
            'unread_count' => $this->unreadCountFor($request->user()),
            'participants_count' => $this->activeUsers()->count(),
            'created_at' => $this->created_at->toIso8601String(),
        ];
    }
}
