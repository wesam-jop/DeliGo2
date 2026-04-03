<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ConversationUser extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'conversation_id',
        'user_id',
        'joined_at',
        'left_at',
        'last_read_at',
        'unread_count',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'joined_at' => 'datetime',
            'left_at' => 'datetime',
            'last_read_at' => 'datetime',
        ];
    }

    /**
     * Get the conversation
     */
    public function conversation()
    {
        return $this->belongsTo(Conversation::class);
    }

    /**
     * Get the user
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Mark all messages as read
     */
    public function markAllAsRead(): void
    {
        $this->update([
            'last_read_at' => now(),
            'unread_count' => 0,
        ]);
    }

    /**
     * Increment unread count
     */
    public function incrementUnread(int $amount = 1): void
    {
        $this->increment('unread_count', $amount);
    }

    /**
     * Decrement unread count
     */
    public function decrementUnread(int $amount = 1): void
    {
        if ($this->unread_count > 0) {
            $this->decrement('unread_count', min($amount, $this->unread_count));
        }
    }

    /**
     * Leave the conversation
     */
    public function leave(): void
    {
        $this->update(['left_at' => now()]);
    }

    /**
     * Check if user has left
     */
    public function hasLeft(): bool
    {
        return $this->left_at !== null;
    }

    /**
     * Scope for active participants
     */
    public function scopeActive($query)
    {
        return $query->whereNull('left_at');
    }
}
