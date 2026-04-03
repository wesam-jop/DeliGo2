<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Str;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'phone',
        'password',
        'phone_verified_at',
        'role',
        'profile_image',
        'is_approved',
        'rejection_reason',
        'governorate_id',
        'area_id',
        'bike_image',
        'is_online',
        'ntfy_topic',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'phone_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_approved' => 'boolean',
            'is_online' => 'boolean',
        ];
    }

    /**
     * Check if user is admin
     */
    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    /**
     * Check if user is store owner
     */
    public function isStoreOwner(): bool
    {
        return $this->role === 'store_owner';
    }

    /**
     * Check if user is driver
     */
    public function isDriver(): bool
    {
        return $this->role === 'driver';
    }

    /**
     * Check if user is customer
     */
    public function isCustomer(): bool
    {
        return $this->role === 'customer';
    }

    /**
     * Get the governorate this user belongs to (for drivers)
     */
    public function governorate()
    {
        return $this->belongsTo(Governorate::class);
    }

    /**
     * Get the area this user belongs to (for drivers)
     */
    public function area()
    {
        return $this->belongsTo(Area::class);
    }

    /**
     * Get the store owned by this user
     */
    public function store()
    {
        return $this->hasOne(Store::class, 'owner_id');
    }

    /**
     * Get customer addresses
     */
    public function addresses()
    {
        return $this->hasMany(CustomerAddress::class, 'customer_id');
    }

    /**
     * Get orders placed by this user (if customer)
     */
    public function orders()
    {
        return $this->hasMany(Order::class, 'customer_id');
    }

    /**
     * Get orders delivered by this user (if driver)
     */
    public function deliveredOrders()
    {
        return $this->hasMany(Order::class, 'driver_id');
    }

    /**
     * Get schedules for this user (if driver)
     */
    public function schedules()
    {
        return $this->morphMany(Schedule::class, 'schedulable');
    }

    /**
     * Get conversations this user is part of
     */
    public function conversations()
    {
        return $this->belongsToMany(Conversation::class, 'conversation_users')
            ->withPivot('joined_at', 'left_at', 'last_read_at', 'unread_count')
            ->withTimestamps();
    }

    /**
     * Get active conversations (not left)
     */
    public function activeConversations()
    {
        return $this->conversations()->whereNull('conversation_users.left_at');
    }

    /**
     * Get messages sent by this user
     */
    public function messages()
    {
        return $this->hasMany(Message::class, 'sender_id');
    }

    /**
     * Get conversation participants
     */
    public function conversationParticipants()
    {
        return $this->hasMany(ConversationUser::class);
    }

    /**
     * Generate unique ntfy topic for this user
     */
    public function generateNtfyTopic(): string
    {
        if ($this->ntfy_topic) {
            return $this->ntfy_topic;
        }

        $topic = 'user-' . $this->id . '-' . Str::random(10);
        $this->update(['ntfy_topic' => $topic]);

        return $topic;
    }

    /**
     * Get total unread messages count
     */
    public function getTotalUnreadMessagesCount(): int
    {
        return $this->conversationParticipants()
            ->active()
            ->sum('unread_count');
    }

    /**
     * Scope for approved users
     */
    public function scopeApproved($query)
    {
        return $query->where('is_approved', true);
    }

    /**
     * Scope for specific role
     */
    public function scopeRole($query, string $role)
    {
        return $query->where('role', $role);
    }

    /**
     * Scope for phone verified users
     */
    public function scopePhoneVerified($query)
    {
        return $query->whereNotNull('phone_verified_at');
    }
    /**
     * Get the user's profile image URL.
     */
    public function getProfileImageAttribute($value)
    {
        if (!$value) return null;
        if (str_starts_with($value, 'http')) return $value;
        return url('storage/' . $value);
    }

    /**
     * Get the user's bike image URL.
     */
    public function getBikeImageAttribute($value)
    {
        if (!$value) return null;
        if (str_starts_with($value, 'http')) return $value;
        return url('storage/' . $value);
    }

    /**
     * Get all of the user's favorites.
     */
    public function favorites()
    {
        return $this->hasMany(Favorite::class);
    }
}
