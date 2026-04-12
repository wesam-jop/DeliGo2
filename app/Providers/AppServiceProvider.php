<?php

namespace App\Providers;

use App\Http\Middleware\RateLimitLogin;
use App\Http\Middleware\RateLimitOtp;
use App\Http\Middleware\RateLimitSendOtp;
use App\Models\Conversation;
use App\Models\Order;
use App\Policies\ConversationPolicy;
use App\Policies\OrderPolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Register policies
        Gate::policy(Order::class, OrderPolicy::class);
        Gate::policy(Conversation::class, ConversationPolicy::class);

        // Register custom middleware aliases
        Route::aliasMiddleware('rate.limit.otp', RateLimitOtp::class);
        Route::aliasMiddleware('rate.limit.login', RateLimitLogin::class);
        Route::aliasMiddleware('rate.limit.send.otp', RateLimitSendOtp::class);
    }
}
