<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;

// OTP Verification Flow
Route::get('/auth/verify-otp', [AuthController::class, 'showOtpForm']);
Route::post('/auth/verify-otp', [AuthController::class, 'verifyOtpWeb']);
Route::get('/auth/resend-otp', [AuthController::class, 'resendOtpWeb']);

// Forgot Password Flow
Route::get('/auth/forgot-password', [AuthController::class, 'showForgotPasswordForm']);
Route::post('/auth/forgot-password', [AuthController::class, 'forgotPasswordWeb']);

// Reset Password After OTP
Route::get('/auth/reset-password-after-otp', [AuthController::class, 'showResetPasswordAfterOtp']);
Route::post('/auth/reset-password-after-otp', [AuthController::class, 'resetPasswordAfterOtpWeb']);

// Legacy routes (keep for backward compatibility)
Route::get('/auth/verify-email', [AuthController::class, 'verifyEmail']);
Route::get('/auth/reset-password', [AuthController::class, 'showResetForm']);
Route::post('/auth/reset-password', [AuthController::class, 'resetPassword']);

// Catch-all route
Route::get('/{any?}', function () {
    return view('welcome');
})->where('any', '^(?!api|auth/).*$');
