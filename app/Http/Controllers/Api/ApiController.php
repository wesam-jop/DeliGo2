<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;

class ApiController extends Controller
{
    /**
     * Success response
     */
    protected function success($data = null, string $message = 'Success', int $statusCode = 200): \Illuminate\Http\JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $data,
        ], $statusCode);
    }

    /**
     * Error response
     */
    protected function error(string $message = 'Error', int $statusCode = 400, $errors = null): \Illuminate\Http\JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message,
            'errors' => $errors,
        ], $statusCode);
    }

    /**
     * Validation error response
     */
    protected function validationError(\Illuminate\Contracts\Validation\Validator $validator): \Illuminate\Http\JsonResponse
    {
        return $this->error('Validation failed', 422, $validator->errors());
    }
}
