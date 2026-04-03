<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Conversation extends Model
{
    use HasFactory;

    /**
     * Conversation types
     */
    const TYPE_DIRECT = 'direct';
    const TYPE_ORDER = 'order';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'type',
        'order_id',
        'created_by',
        'last_message_at',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'last_message_at' => 'datetime',
        ];
    }

    /**
     * Boot the model.
     */
    protected static function boot(): void
    {
        parent::boot();

        static::creating(function ($conversation) {
            if (!$conversation->last_message_at) {
                $conversation->last_message_at = now();
            }
        });
    }

    /**
     * Get the users in this conversation
     */
    public function users()
    {
        return $this->belongsToMany(User::class, 'conversation_users')
            ->withPivot('joined_at', 'left_at', 'last_read_at', 'unread_count')
            ->withTimestamps();
    }

    /**
     * Get the active users (not left) in this conversation
     */
    public function activeUsers()
    {
        return $this->users()->whereNull('conversation_users.left_at');
    }

    /**
     * Get the conversation participants with pivot data
     */
    public function participants()
    {
        return $this->hasMany(ConversationUser::class);
    }

    /**
     * Get the messages in this conversation
     */
    public function messages()
    {
        return $this->hasMany(Message::class);
    }

    /**
     * Get the last message
     */
    public function lastMessage()
    {
        return $this->hasOne(Message::class)->latest();
    }

    /**
     * Get the order associated with this conversation
     */
    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    /**
     * Get the user who created the conversation
     */
    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Check if user is a participant
     */
    public function isParticipant(User $user): bool
    {
        return $this->users()->where('users.id', $user->id)
            ->whereNull('conversation_users.left_at')
            ->exists();
    }

    /**
     * Get unread message count for a user
     */
    public function unreadCountFor(User $user): int
    {
        $participant = $this->participants()
            ->where('user_id', $user->id)
            ->first();

        return $participant?->unread_count ?? 0;
    }

    /**
     * Get conversation name for display
     */
    public function getDisplayName(User $currentUser): string
    {
        if ($this->type === self::TYPE_ORDER) {
            return 'Order #' . ($this->order?->order_number ?? $this->id);
        }

        // For direct chat, return the other participant's name
        $otherUser = $this->activeUsers()
            ->where('users.id', '!=', $currentUser->id)
            ->first();

        if (!$otherUser) return 'Unknown';

        // If other user is a store owner, return store name
        if ($otherUser->role === 'store_owner' && $otherUser->store) {
            return $otherUser->store->name;
        }

        return $otherUser->name;
    }

    /**
     * Get conversation image for display
     */
    public function getDisplayImage(User $currentUser): ?string
    {
        if ($this->type === self::TYPE_ORDER) {
            // For order chat, return the store image
            $store = $this->order?->storeSplits->first()?->store;
            return $store?->image;
        }

        // For direct chat, return the other participant's image
        $otherUser = $this->activeUsers()
            ->where('users.id', '!=', $currentUser->id)
            ->first();

        if (!$otherUser) return null;

        // If other user is a store owner, return store image
        if ($otherUser->role === 'store_owner' && $otherUser->store) {
            return $otherUser->store->image;
        }

        return $otherUser->profile_image;
    }

    /**
     * Scope for conversations of a specific type
     */
    public function scopeOfType($query, string $type)
    {
        return $query->where('type', $type);
    }

    /**
     * Scope for conversations where user is participant
     */
    public function scopeForUser($query, User $user)
    {
        return $query->whereHas('participants', function ($q) use ($user) {
            $q->where('user_id', $user->id)
                ->whereNull('left_at');
        });
    }

    /**
     * Scope for order conversations
     */
    public function scopeForOrder($query, int $orderId)
    {
        return $query->where('type', self::TYPE_ORDER)
            ->where('order_id', $orderId);
    }

    /**
     * Update last message timestamp
     */
    public function touchLastMessage(): void
    {
        $this->update(['last_message_at' => now()]);
    }

    /**
     * Get or create direct conversation between two users
     */
    public static function getOrCreateDirectConversation(User $user1, User $user2): self
    {
        // Check if conversation already exists by looking for any conversation that HAS BOTH users
        $conversation = Conversation::where('type', self::TYPE_DIRECT)
            ->whereHas('participants', function ($q) use ($user1) {
                $q->where('user_id', $user1->id);
            })
            ->whereHas('participants', function ($q) use ($user2) {
                $q->where('user_id', $user2->id);
            })
            ->first();

        if ($conversation) {
            return $conversation;
        }

        // Create new conversation
        return Conversation::create([
            'type' => self::TYPE_DIRECT,
            'created_by' => $user1->id,
        ]);
    }
}
