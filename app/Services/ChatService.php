<?php

namespace App\Services;

use App\Events\ConversationCreated;
use App\Events\MessageSent;
use App\Models\Conversation;
use App\Models\ConversationUser;
use App\Models\Message;
use App\Models\Order;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class ChatService
{
    /**
     * Create or get direct conversation between two users
     */
    public function getOrCreateDirectConversation(User $currentUser, User $otherUser): Conversation
    {
        return DB::transaction(function () use ($currentUser, $otherUser) {
            $conversation = Conversation::getOrCreateDirectConversation($currentUser, $otherUser);

            // Add participants if not already added
            $this->addParticipant($conversation, $currentUser);
            $this->addParticipant($conversation, $otherUser);

            return $conversation;
        });
    }

    /**
     * Create order conversation
     */
    public function createOrderConversation(Order $order): Conversation
    {
        return DB::transaction(function () use ($order) {
            // Check if conversation already exists for this order
            $conversation = Conversation::forOrder($order->id)->first();
            
            if (!$conversation) {
                $conversation = Conversation::create([
                    'type' => Conversation::TYPE_ORDER,
                    'order_id' => $order->id,
                    'created_by' => $order->customer_id,
                ]);
            }

            $this->ensureOrderConversationParticipants($conversation, $order);

            // Dispatch event
            event(new ConversationCreated($conversation));

            return $conversation;
        });
    }

    /**
     * Ensure all relevant parties are participants in the order conversation
     */
    public function ensureOrderConversationParticipants(Conversation $conversation, Order $order): void
    {
        // Add customer
        if ($order->customer) {
            $this->addParticipant($conversation, $order->customer);
        }

        // Add store owners involved in the order
        $order->loadMissing('storeSplits.store.owner');
        foreach ($order->storeSplits as $split) {
            if ($split->store && $split->store->owner) {
                $this->addParticipant($conversation, $split->store->owner);
            }
        }

        // Add driver if assigned
        if ($order->driver) {
            $this->addParticipant($conversation, $order->driver);
        }
    }

    /**
     * Send automated status message for an order
     */
    public function sendOrderStatusMessage(Order $order, string $status, ?User $actor = null): ?Message
    {
        $conversation = Conversation::forOrder($order->id)->first();
        if (!$conversation) {
            $conversation = $this->createOrderConversation($order);
        }

        // Ensure participants are up to date (e.g. driver just joined)
        $this->ensureOrderConversationParticipants($conversation, $order);

        $messageText = $this->getStatusMessageText($order, $status, $actor);

        if (!$messageText) {
            return null;
        }

        // Use actor as sender, or the first participant (usually customer/system)
        $sender = $actor ?? $order->customer;

        return $this->sendMessage($conversation, $sender, $messageText, Message::TYPE_TEXT);
    }

    /**
     * Get Arabic message text for status transitions
     */
    protected function getStatusMessageText(Order $order, string $status, ?User $actor = null): ?string
    {
        switch ($status) {
            case Order::STATUS_ACCEPTED_BY_DRIVER:
                $driverName = $actor ? $actor->name : ($order->driver ? $order->driver->name : 'السائق');
                return "✅ تم قبول طلبك رقم #{$order->id} من قبل السائق {$driverName}. سأقوم باستلام الطلب وتوصيله لك في أقرب وقت.";

            case Order::STATUS_CONFIRMED:
                return "👍 تم تأكيد طلبك رقم #{$order->id} من قبل المتجر. نحن الآن بصدد تجهيزه.";

            case Order::STATUS_PREPARING:
                return "👨‍🍳 بدأ المتجر بتحضير طلبك رقم #{$order->id}.";

            case Order::STATUS_READY:
                return "🔔 طلبك رقم #{$order->id} جاهز الآن للاستلام من قبل السائق.";

            case Order::STATUS_PICKED_UP:
                return "🚚 استلم السائق طلبك رقم #{$order->id} وهو في الطريق إليك الآن.";

            case Order::STATUS_DELIVERED:
                return "🏁 تم تسليم طلبك رقم #{$order->id} بنجاح. شكراً لتعاملك معنا!";

            case Order::STATUS_CANCELLED:
                return "❌ تم إلغاء طلبك رقم #{$order->id}. نعتذر عن ذلك.";

            default:
                return null;
        }
    }

    /**
     * Add driver to order conversation
     */
    public function addDriverToOrderConversation(Order $order, User $driver): void
    {
        $conversation = Conversation::forOrder($order->id)->first();

        if (!$conversation) {
            $conversation = $this->createOrderConversation($order);
        }

        $this->addParticipant($conversation, $driver);
    }

    /**
     * Add participant to conversation
     */
    public function addParticipant(Conversation $conversation, User $user): ConversationUser
    {
        $participant = ConversationUser::where('conversation_id', $conversation->id)
            ->where('user_id', $user->id)
            ->first();

        if ($participant) {
            // Re-join if left
            if ($participant->left_at) {
                $participant->update([
                    'left_at' => null,
                    'joined_at' => now(),
                ]);
            }
            return $participant;
        }

        return ConversationUser::create([
            'conversation_id' => $conversation->id,
            'user_id' => $user->id,
            'joined_at' => now(),
        ]);
    }

    /**
     * Send message
     */
    public function sendMessage(Conversation $conversation, User $sender, string $message, string $type = 'text', array $attachments = []): Message
    {
        return DB::transaction(function () use ($conversation, $sender, $message, $type, $attachments) {
            $chatMessage = Message::create([
                'conversation_id' => $conversation->id,
                'sender_id' => $sender->id,
                'message' => $message,
                'type' => $type,
                'attachments' => $attachments,
            ]);

            // Send push notifications to other participants
            $notificationService = app(NotificationService::class);
            $participants = $conversation->activeUsers()->where('users.id', '!=', $sender->id)->get();

            $senderDisplayName = $sender->name;
            if ($sender->role === 'store_owner' && $sender->store) {
                $senderDisplayName = $sender->store->name;
            }

            foreach ($participants as $recipient) {
                $notificationService->sendToUser(
                    $recipient,
                    '💬 رسالة جديدة من ' . $senderDisplayName,
                    substr($message, 0, 100),
                    [
                        'click' => url("/conversations/{$conversation->id}"),
                        'priority' => 5,
                        'tags' => ['speech_balloon'],
                    ]
                );
            }

            return $chatMessage;
        });
    }

    /**
     * Send system message
     */
    public function sendSystemMessage(Conversation $conversation, string $message): Message
    {
        return Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => auth()->id(),
            'message' => $message,
            'type' => Message::TYPE_SYSTEM,
        ]);
    }

    /**
     * Check if user is participant of conversation
     */
    public function canAccessConversation(Conversation $conversation, User $user): bool
    {
        return $conversation->isParticipant($user);
    }

    /**
     * Get conversations for user
     */
    public function getUserConversations(User $user, int $limit = 20): array
    {
        $conversations = $user->activeConversations()
            ->with(['lastMessage.sender', 'users'])
            ->withPivot('last_read_at', 'unread_count')
            ->orderByDesc('last_message_at')
            ->limit($limit)
            ->get();

        return $conversations->map(function ($conversation) use ($user) {
            return [
                'id' => $conversation->id,
                'type' => $conversation->type,
                'order_id' => $conversation->order_id,
                'display_name' => $conversation->getDisplayName($user),
                'display_image' => $conversation->getDisplayImage($user),
                'last_message' => $conversation->lastMessage?->getPreview(),
                'last_message_at' => $conversation->last_message_at?->toIso8601String(),
                'unread_count' => $conversation->unreadCountFor($user),
                'order_number' => $conversation->order?->order_number,
            ];
        })->toArray();
    }

    /**
     * Get messages in conversation
     */
    public function getConversationMessages(Conversation $conversation, User $user, int $limit = 50, ?int $beforeId = null): array
    {
        // Mark messages as read
        $this->markMessagesAsRead($conversation, $user);

        $query = $conversation->messages()
            ->with('sender')
            ->orderByDesc('created_at')
            ->limit($limit);

        if ($beforeId) {
            $query->where('id', '<', $beforeId);
        }

        $messages = $query->get()->reverse();

        return $messages->map(function ($message) {
            $senderName = $message->sender->name;
            $senderImage = $message->sender->profile_image;

            if ($message->sender->role === 'store_owner' && $message->sender->store) {
                $senderName = $message->sender->store->name;
                $senderImage = $message->sender->store->image;
            }

            return [
                'id' => $message->id,
                'sender_id' => $message->sender_id,
                'sender_name' => $senderName,
                'sender_profile_image' => $senderImage,
                'message' => $message->message,
                'type' => $message->type,
                'attachments' => $message->attachments,
                'created_at' => $message->created_at->toIso8601String(),
                'is_read' => $message->isRead(),
            ];
        })->values()->toArray();
    }

    /**
     * Mark all messages as read for user
     */
    public function markMessagesAsRead(Conversation $conversation, User $user): void
    {
        $participant = $conversation->participants()
            ->where('user_id', $user->id)
            ->first();

        if ($participant) {
            $participant->markAllAsRead();
        }
    }

    /**
     * Get conversation participants
     */
    public function getConversationParticipants(Conversation $conversation): array
    {
        return $conversation->activeUsers()
            ->get()
            ->map(function ($user) use ($conversation) {
                $participant = $conversation->participants()
                    ->where('user_id', $user->id)
                    ->first();

                $name = $user->name;
                $image = $user->profile_image;

                if ($user->role === 'store_owner' && $user->store) {
                    $name = $user->store->name;
                    $image = $user->store->image;
                }

                return [
                    'id' => $user->id,
                    'name' => $name,
                    'profile_image' => $image,
                    'role' => $user->role,
                    'joined_at' => $participant?->joined_at?->toIso8601String(),
                    'last_read_at' => $participant?->last_read_at?->toIso8601String(),
                ];
            })
            ->toArray();
    }

    /**
     * Get unread count for user
     */
    public function getUnreadCount(User $user): int
    {
        return $user->getTotalUnreadMessagesCount();
    }

    /**
     * Mark conversation as read for user
     */
    public function markConversationAsRead(Conversation $conversation, User $user): void
    {
        $participant = ConversationUser::where('conversation_id', $conversation->id)
            ->where('user_id', $user->id)
            ->first();

        if ($participant) {
            $participant->update([
                'last_read_at' => now(),
                'unread_count' => 0,
            ]);
        }
    }

    /**
     * Leave conversation
     */
    public function leaveConversation(Conversation $conversation, User $user): void
    {
        $participant = ConversationUser::where('conversation_id', $conversation->id)
            ->where('user_id', $user->id)
            ->first();

        if ($participant) {
            $participant->update(['left_at' => now()]);
        }
    }
}
