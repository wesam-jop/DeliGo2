<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Symfony\Component\HttpFoundation\Response;

/**
 * Rate limiting middleware for OTP verification
 * Prevents brute force attacks on OTP codes
 */
class RateLimitOtp
{
    public function handle(Request $request, Closure $next): Response
    {
        $phone = $request->input('phone');
        $key = 'otp-verify-' . $phone;

        // Allow maximum 5 attempts per 10 minutes
        if (RateLimiter::tooManyAttempts($key, 5)) {
            $seconds = RateLimiter::availableIn($key);
            
            return response()->json([
                'success' => false,
                'message' => 'تم تجاوز الحد الأقصى من المحاولات. يرجى المحاولة بعد ' . ceil($seconds / 60) . ' دقيقة',
                'retry_after' => $seconds,
            ], 429);
        }

        RateLimiter::hit($key, 600); // 10 minutes

        $response = $next($request);

        // If verification failed, decrement one attempt
        if ($response->getStatusCode() === 400) {
            // Keep the hit to maintain attempt count
        }

        return $response;
    }
}
