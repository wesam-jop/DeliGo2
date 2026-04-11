<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Scheduled broadcast (e.g. lunch reminder)
    |--------------------------------------------------------------------------
    |
    | Runs via Laravel scheduler + queue workers. Set enabled=true and ensure
    | `php artisan schedule:run` is in cron, and queue workers are running.
    |
    */

    'scheduled' => [
        'enabled' => env('SCHEDULED_BROADCAST_ENABLED', false),
        'time' => env('SCHEDULED_BROADCAST_TIME', '12:00'),
        'title' => env('SCHEDULED_BROADCAST_TITLE', '🍽️ وقت الغداء'),
        'message' => env('SCHEDULED_BROADCAST_MESSAGE', 'اطلب طعامك الآن من مطاعم قريبة منك!'),
        /** customer | driver | store_owner — set SCHEDULED_BROADCAST_ROLE=all in .env to include every role except admin */
        'role' => env('SCHEDULED_BROADCAST_ROLE', 'customer') === 'all'
            ? null
            : env('SCHEDULED_BROADCAST_ROLE', 'customer'),
    ],

    'chunk_size' => (int) env('BROADCAST_NOTIFICATION_CHUNK_SIZE', 500),

];
