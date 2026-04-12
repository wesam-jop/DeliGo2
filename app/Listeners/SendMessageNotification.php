<?php

namespace App\Listeners;

use App\Events\MessageSent;
use App\Models\Conversation;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class SendMessageNotification implements ShouldQueue
{
    use InteractsWithQueue;

    /**
     * Create the event listener.
     */
    public function __construct(
        protected NotificationService $notificationService
    ) {}

    /**
     * Handle the event.
     */
    public function handle(MessageSent $event): void
    {
        $message = $event->message;
        $sender = $event->sender;
        $conversation = $message->conversation;

        // Get all participants except sender
        $recipients = $conversation->users()
            ->where('users.id', '!=', $sender->id)
            ->whereNull('conversation_users.left_at')
            ->get();

        // Send notification to each recipient
        foreach ($recipients as $recipient) {
            $this->notificationService->sendChatNotification(
                $recipient,
                $sender->name,
                $message->message ?? $message->type . ' message',
                $conversation->id
            );
        }

        // If this is an order conversation, also notify all admins
        if ($conversation->type === Conversation::TYPE_ORDER && $conversation->order_id) {
            $admins = User::where('role', 'admin')->get();
            
            foreach ($admins as $admin) {
                // Don't notify admin if they're the sender or already a participant
                if ($admin->id === $sender->id || $recipients->contains('id', $admin->id)) {
                    continue;
                }

                $this->notificationService->sendChatNotification(
                    $admin,
                    $sender->name,
                    $message->message ?? $message->type . ' message',
                    $conversation->id,
                    [
                        'type' => 'order.message',
                        'entity_type' => 'order',
                        'entity_id' => $conversation->order_id,
                        'meta' => [
                            'order_id' => $conversation->order_id,
                            'conversation_id' => $conversation->id,
                        ],
                    ]
                );
            }
        }
    }
}
