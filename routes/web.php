<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\AuthController;

Route::get('/auth/verify-email', [AuthController::class, 'verifyEmail']);
Route::get('/reset-password', [AuthController::class, 'showResetForm']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);

Route::get('/{any?}', function () {
    return view('welcome');
})->where('any', '^(?!api|auth/verify-email|reset-password).*$');
