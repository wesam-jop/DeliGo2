<?php

namespace App\Providers;

use App\Events\ConversationCreated;
use App\Events\DriverRegistered;
use App\Events\MessageSent;
use App\Events\NewOrderForDrivers;
use App\Events\OrderAssignedToDriver;
use App\Events\OrderStatusChanged;
use App\Events\StoreRegistered;
use App\Listeners\NotifyAdminsOfNewDriver;
use App\Listeners\NotifyAdminsOfNewStore;
use App\Listeners\NotifyConversationParticipants;
use App\Listeners\NotifyDriversOfNewOrder;
use App\Listeners\NotifyStoresOfNewOrder;
use App\Listeners\SendDriverAssignmentNotification;
use App\Listeners\SendMessageNotification;
use App\Listeners\SendOrderStatusNotification;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;

class EventServiceProvider extends ServiceProvider
{
    /**
     * The event to listener mappings for the application.
     *
     * @var array<class-string, array<int, class-string>>
     */
    protected $listen = [
        MessageSent::class => [
            SendMessageNotification::class,
        ],
        OrderStatusChanged::class => [
            SendOrderStatusNotification::class,
        ],
        NewOrderForDrivers::class => [
            NotifyDriversOfNewOrder::class,
            NotifyStoresOfNewOrder::class,
        ],
        OrderAssignedToDriver::class => [
            // SendDriverAssignmentNotification::class, // DISABLED - Driver only gets notified when order is ready
        ],
        ConversationCreated::class => [
            // NotifyConversationParticipants::class, // DISABLED - Users only get notified on new messages, not conversation creation
        ],
        StoreRegistered::class => [
            NotifyAdminsOfNewStore::class,
        ],
        DriverRegistered::class => [
            NotifyAdminsOfNewDriver::class,
        ],
    ];

    /**
     * Register any events for your application.
     */
    public function boot(): void
    {
        //
    }

    /**
     * Determine if events and listeners should be automatically discovered.
     */
    public function shouldDiscoverEvents(): bool
    {
        return false;
    }
}
