<?php

namespace App\Listeners;

use App\Events\ConversationCreated;
use App\Services\NotificationService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class NotifyConversationParticipants implements ShouldQueue
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
    public function handle(ConversationCreated $event): void
    {
        $conversation = $event->conversation;
        $creator = $conversation->creator;

        // Get all participants
        $participants = $conversation->activeUsers()->get();

        foreach ($participants as $participant) {
            // Skip the creator
            if ($participant->id === $creator?->id) {
                continue;
            }

            $creatorName = $creator?->name ?? 'النظام';

            $this->notificationService->sendToUser(
                $participant,
                '💬 محادثة جديدة',
                "تم إنشاء محادثة جديدة مع {$creatorName}",
                [
                    'type' => 'conversation.created',
                    'click' => url("/conversations/{$conversation->id}"),
                    'priority' => 4,
                    'meta' => [
                        'conversation_id' => $conversation->id,
                        'conversation_type' => $conversation->type,
                    ],
                ]
            );
        }
    }
}
