<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ValidateStoreOwner
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (!$request->user()->isStoreOwner()) {
            return response()->json([
                'success' => false,
                'message' => 'Forbidden. Only store owners can perform this action.',
            ], 403);
        }

        if (!$request->user()->store) {
            return response()->json([
                'success' => false,
                'message' => 'No store associated with your account.',
            ], 400);
        }

        return $next($request);
    }
}
