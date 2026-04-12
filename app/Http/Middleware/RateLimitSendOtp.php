<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Symfony\Component\HttpFoundation\Response;

/**
 * Rate limiting middleware for sending OTP
 * Prevents OTP flooding/spamming
 */
class RateLimitSendOtp
{
    public function handle(Request $request, Closure $next): Response
    {
        $phone = $request->phone ?? $request->route('phone');
        $key = 'otp-send-' . $phone;

        // Allow maximum 3 OTP sends per 10 minutes
        if (RateLimiter::tooManyAttempts($key, 3)) {
            $seconds = RateLimiter::availableIn($key);
            
            return response()->json([
                'success' => false,
                'message' => 'تم تجاوز الحد الأقصى من الطلبات. يرجى المحاولة بعد ' . ceil($seconds / 60) . ' دقيقة',
                'retry_after' => $seconds,
            ], 429);
        }

        RateLimiter::hit($key, 600); // 10 minutes

        return $next($request);
    }
}
