<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Auth\VerifyOtpRequest;
use App\Models\Otp;
use App\Models\User;
use App\Services\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends ApiController
{
    public function __construct(
        protected AuthService $authService
    ) {}

    /**
     * Register a new user
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        try {
            $data = $request->validated();

            // Handle image upload if present
            if ($request->hasFile('store_image')) {
                $data['store_image'] = $request->file('store_image');
            }

            $user = $this->authService->register($data);

            return $this->success([
                'user' => $user,
            ], 'تم إنشاء الحساب بنجاح. يرجى التحقق من رقم هاتفك برمز التحقق المرسل.', 201);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * Send OTP verification
     */
    public function sendOtp(string $phone): JsonResponse
    {
        try {
            $code = $this->authService->sendOtp($phone);

            // In production, don't return the code
            return $this->success([
                'code' => $code, // Remove in production
            ], 'تم إرسال رمز التحقق بنجاح');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * Verify OTP
     */
    public function verifyOtp(VerifyOtpRequest $request): JsonResponse
    {
        $validated = $request->validated();

        if ($this->authService->verifyOtp($validated['phone'], $validated['code'])) {
            // Get user data
            $user = User::where('phone', $this->authService->normalizePhoneNumber($validated['phone']))->first();

            return $this->success([
                'user' => $user,
            ], 'تم التحقق من رقم الهاتف بنجاح');
        }

        return $this->error('رمز التحقق غير صحيح أو منتهي الصلاحية', 400);
    }

    /**
     * Verify email with token link
     */
    public function verifyEmail(Request $request)
    {
        $token = $request->input('token');

        if (!$token) {
            return view('auth.verify', [
                'success' => false,
                'message' => 'رابط التحقق غير صحيح'
            ]);
        }

        if ($this->authService->verifyEmail($token)) {
            return view('auth.verify', [
                'success' => true,
                'message' => 'تم تفعيل حسابك بنجاح. يمكنك الآن البدء باستخدام كافة ميزات التطبيق.'
            ]);
        }

        return view('auth.verify', [
            'success' => false,
            'message' => 'رابط التحقق غير صحيح أو منتهي الصلاحية'
        ]);
    }

    /**
     * Resend verification link
     */
    public function resendVerification(Request $request): JsonResponse
    {
        $request->validate([
            'phone' => ['required', 'string'],
        ]);

        try {
            $this->authService->sendOtp($request->phone);

            return $this->success(null, 'تم إعادة إرسال رابط التحقق بنجاح');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * Forgot Password - Send reset link
     */
    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate([
            'phone' => ['required', 'string'],
        ]);

        try {
            $token = $this->authService->forgotPassword($request->phone);

            // In production, send SMS. For now, we return token/log it.
            return $this->success([
                'token' => $token,
                'link' => url('/api/v1/auth/reset-password?token=' . $token)
            ], 'تم إرسال رابط استعادة كلمة المرور بنجاح');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * Show reset password view (GET)
     */
    public function showResetForm(Request $request)
    {
        $token = $request->input('token');
        
        // This would typically render the React page, but for simplicity 
        // with the user's flow, we'll use a Blade view just like verifyEmail.
        return view('auth.reset-password', [
            'token' => $token,
            'success' => !!$token
        ]);
    }

    /**
     * Reset Password (POST)
     */
    public function resetPassword(Request $request)
    {
        $request->validate([
            'token' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        try {
            $this->authService->resetPassword($request->token, $request->password);

            return view('auth.reset-success');
        } catch (\Exception $e) {
            return view('auth.reset-password', [
                'token' => $request->token,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Login
     */
    public function login(LoginRequest $request): JsonResponse
    {
        try {
            $result = $this->authService->login(
                $request->input('phone'),
                $request->input('password')
            );

            return $this->success([
                'user' => $result['user'],
                'token' => $result['token'],
            ], 'تم تسجيل الدخول بنجاح')
            ->cookie('token', $result['token'], 60 * 24 * 30, '/', null, true, true, false, 'Lax');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), $e->getCode() ?: 400);
        }
    }

    /**
     * Logout
     */
    public function logout(): JsonResponse
    {
        $this->authService->logout(auth()->user());

        return $this->success(null, 'تم تسجيل الخروج بنجاح')
        ->withoutCookie('token');
    }

    /**
     * Get authenticated user
     */
    public function me(): JsonResponse
    {
        return $this->success([
            'user' => auth()->user(),
        ]);
    }

    /**
     * Resend OTP
     */
    public function resendOtp(string $phone): JsonResponse
    {
        try {
            $code = $this->authService->resendOtp($phone);

            return $this->success([
                'code' => $code, // Remove in production
            ], 'تم إعادة إرسال رمز التحقق بنجاح');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }
}
