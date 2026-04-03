<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\Chat\SendMessageRequest;
use App\Http\Requests\Chat\StartConversationRequest;
use App\Http\Resources\ConversationResource;
use App\Http\Resources\MessageResource;
use App\Models\Conversation;
use App\Models\User;
use App\Services\ChatService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ChatController extends ApiController
{
    public function __construct(
        protected ChatService $chatService
    ) {}

    /**
     * Get user's conversations
     */
    public function index(Request $request): JsonResponse
    {
        $conversations = $this->chatService->getUserConversations(
            $request->user(),
            $request->input('limit', 20)
        );

        return $this->success([
            'conversations' => $conversations,
            'total_unread' => $this->chatService->getUnreadCount($request->user()),
        ]);
    }

    /**
     * Start a direct conversation with a user
     */
    public function startConversation(StartConversationRequest $request): JsonResponse
    {
        $otherUser = User::findOrFail($request->user_id);

        $conversation = $this->chatService->getOrCreateDirectConversation(
            $request->user(),
            $otherUser
        );

        return $this->success([
            'conversation' => new ConversationResource($conversation->load(['lastMessage.sender', 'users'])),
        ], 'Conversation started successfully');
    }

    /**
     * Get conversation details
     */
    public function show(Conversation $conversation): JsonResponse
    {
        $user = auth()->user();

        if (!$this->chatService->canAccessConversation($conversation, $user)) {
            return $this->error('You are not a participant of this conversation', 403);
        }

        $conversation->load(['users', 'order.storeSplits.store']);

        return $this->success([
            'conversation' => [
                'id' => $conversation->id,
                'type' => $conversation->type,
                'order_id' => $conversation->order_id,
                'order_number' => $conversation->order?->order_number,
                'display_name' => $conversation->getDisplayName($user),
                'participants' => $this->chatService->getConversationParticipants($conversation),
                'created_at' => $conversation->created_at->toIso8601String(),
            ],
        ]);
    }

    /**
     * Get messages in a conversation
     */
    public function messages(Request $request, Conversation $conversation): JsonResponse
    {
        $user = $request->user();

        if (!$this->chatService->canAccessConversation($conversation, $user)) {
            return $this->error('You are not a participant of this conversation', 403);
        }

        $messages = $this->chatService->getConversationMessages(
            $conversation,
            $user,
            $request->input('limit', 50),
            $request->input('before_id')
        );

        return $this->success([
            'messages' => $messages,
            'has_more' => count($messages) >= $request->input('limit', 50),
        ]);
    }

    /**
     * Send a message
     */
    public function sendMessage(SendMessageRequest $request, Conversation $conversation): JsonResponse
    {
        $user = $request->user();

        if (!$this->chatService->canAccessConversation($conversation, $user)) {
            return $this->error('You are not a participant of this conversation', 403);
        }

        $message = $this->chatService->sendMessage(
            $conversation,
            $user,
            $request->message ?? '',
            $request->type ?? 'text',
            $request->attachments ?? []
        );

        return $this->success([
            'message' => new MessageResource($message->load('sender')),
        ], 'Message sent successfully');
    }

    /**
     * Mark conversation as read
     */
    public function markAsRead(Request $request, Conversation $conversation): JsonResponse
    {
        $user = $request->user();

        if (!$this->chatService->canAccessConversation($conversation, $user)) {
            return $this->error('You are not a participant of this conversation', 403);
        }

        $this->chatService->markConversationAsRead($conversation, $user);

        return $this->success(null, 'Conversation marked as read');
    }

    /**
     * Leave a conversation
     */
    public function leave(Request $request, Conversation $conversation): JsonResponse
    {
        $user = $request->user();

        if (!$this->chatService->canAccessConversation($conversation, $user)) {
            return $this->error('You are not a participant of this conversation', 403);
        }

        $this->chatService->leaveConversation($conversation, $user);

        return $this->success(null, 'Left conversation successfully');
    }

    /**
     * Get conversation participants
     */
    public function participants(Conversation $conversation): JsonResponse
    {
        $user = auth()->user();

        if (!$this->chatService->canAccessConversation($conversation, $user)) {
            return $this->error('You are not a participant of this conversation', 403);
        }

        $participants = $this->chatService->getConversationParticipants($conversation);

        return $this->success([
            'participants' => $participants,
        ]);
    }

    /**
     * Start conversation with specific role (admin feature)
     */
    public function startConversationWithRole(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'user_id' => ['required', 'exists:users,id'],
            'type' => ['sometimes', 'in:direct,order'],
            'order_id' => ['sometimes', 'exists:orders,id'],
        ]);

        $otherUser = User::findOrFail($validated['user_id']);
        $currentUser = $request->user();

        // Check permissions
        if ($currentUser->role === 'admin' || 
            ($currentUser->role === 'customer' && in_array($otherUser->role, ['store_owner', 'driver', 'admin'])) ||
            ($currentUser->role === 'store_owner' && in_array($otherUser->role, ['customer', 'admin'])) ||
            ($currentUser->role === 'driver' && in_array($otherUser->role, ['customer', 'admin']))) {
            
            $conversation = $this->chatService->getOrCreateDirectConversation($currentUser, $otherUser);
            
            return $this->success([
                'conversation' => new ConversationResource($conversation->load(['lastMessage.sender', 'users'])),
            ], 'Conversation started successfully');
        }

        return $this->error('Not authorized to start conversation with this user', 403);
    }

    /**
     * Get unread message count
     */
    public function unreadCount(Request $request): JsonResponse
    {
        $count = $this->chatService->getUnreadCount($request->user());

        return $this->success([
            'count' => $count,
        ]);
    }
}
