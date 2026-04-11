<?php

namespace App\Policies;

use App\Models\Conversation;
use App\Models\User;

class ConversationPolicy
{
    /**
     * Determine if the user can view the conversation.
     */
    public function view(User $user, Conversation $conversation): bool
    {
        // Check if user is an active participant
        return $conversation->isParticipant($user);
    }

    /**
     * Determine if the user can send messages in the conversation.
     */
    public function sendMessage(User $user, Conversation $conversation): bool
    {
        // Only active participants can send messages
        return $conversation->isParticipant($user);
    }

    /**
     * Determine if the user can leave the conversation.
     */
    public function leave(User $user, Conversation $conversation): bool
    {
        // Participants can leave (except maybe the creator in some cases)
        return $conversation->users()->where('users.id', $user->id)->exists();
    }
}
