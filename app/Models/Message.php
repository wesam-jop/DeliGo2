<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Message extends Model
{
    use HasFactory;

    /**
     * Message types
     */
    const TYPE_TEXT = 'text';
    const TYPE_IMAGE = 'image';
    const TYPE_FILE = 'file';
    const TYPE_SYSTEM = 'system';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'conversation_id',
        'sender_id',
        'message',
        'attachments',
        'type',
        'read_at',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'attachments' => 'array',
            'read_at' => 'datetime',
        ];
    }

    /**
     * Boot the model.
     */
    protected static function boot(): void
    {
        parent::boot();

        static::created(function ($message) {
            // Update conversation's last_message_at
            $message->conversation->touchLastMessage();

            // Update unread counts for other participants
            $message->updateUnreadCounts();
        });
    }

    /**
     * Get the conversation this message belongs to
     */
    public function conversation()
    {
        return $this->belongsTo(Conversation::class);
    }

    /**
     * Get the sender of the message
     */
    public function sender()
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    /**
     * Update unread counts for all participants except sender
     */
    protected function updateUnreadCounts(): void
    {
        $conversation = $this->conversation;

        $conversation->participants()
            ->where('user_id', '!=', $this->sender_id)
            ->whereNull('left_at')
            ->each(function ($participant) {
                // Only increment if user hasn't read past this message
                if (!$participant->last_read_at || 
                    $participant->last_read_at->isBefore($this->created_at)) {
                    $participant->incrementUnread();
                }
            });
    }

    /**
     * Mark message as read
     */
    public function markAsRead(): void
    {
        $this->update(['read_at' => now()]);
    }

    /**
     * Check if message is read
     */
    public function isRead(): bool
    {
        return $this->read_at !== null;
    }

    /**
     * Check if message is from user
     */
    public function isFrom(User $user): bool
    {
        return $this->sender_id === $user->id;
    }

    /**
     * Check if message has attachments
     */
    public function hasAttachments(): bool
    {
        return !empty($this->attachments);
    }

    /**
     * Scope for unread messages
     */
    public function scopeUnread($query)
    {
        return $query->whereNull('read_at');
    }

    /**
     * Scope for messages after a specific time
     */
    public function scopeAfter($query, $timestamp)
    {
        return $query->where('created_at', '>', $timestamp);
    }

    /**
     * Get message preview
     */
    public function getPreview(int $length = 50): string
    {
        if ($this->type === self::TYPE_IMAGE) {
            return '📷 Image';
        }

        if ($this->type === self::TYPE_FILE) {
            return '📎 File';
        }

        if ($this->type === self::TYPE_SYSTEM) {
            return 'ℹ️ ' . ($this->message ?? 'System message');
        }

        return Str::limit($this->message ?? '', $length);
    }
}
