<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Symfony\Component\HttpFoundation\Response;

/**
 * Rate limiting middleware for login attempts
 * Prevents brute force attacks on password login
 */
class RateLimitLogin
{
    public function handle(Request $request, Closure $next): Response
    {
        $phone = $request->input('phone');
        $key = 'login-' . $phone;

        // Allow maximum 5 failed login attempts per 15 minutes
        if (RateLimiter::tooManyAttempts($key, 5)) {
            $seconds = RateLimiter::availableIn($key);
            
            return response()->json([
                'success' => false,
                'message' => 'تم تجاوز الحد الأقصى من محاولات تسجيل الدخول. يرجى المحاولة بعد ' . ceil($seconds / 60) . ' دقيقة',
                'retry_after' => $seconds,
            ], 429);
        }

        RateLimiter::hit($key, 900); // 15 minutes

        $response = $next($request);

        // If login failed, keep the hit
        // If login succeeded, clear the limiter
        if ($response->getStatusCode() === 200) {
            RateLimiter::clear($key);
        }

        return $response;
    }
}
