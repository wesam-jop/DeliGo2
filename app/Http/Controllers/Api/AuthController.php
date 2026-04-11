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
     * Register a new user (web redirect)
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
                'redirect' => '/auth/verify-otp?phone=' . urlencode($data['phone'] ?? $user->phone) . '&mode=register',
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
     * Forgot Password - Send OTP code
     */
    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate([
            'phone' => ['required', 'string'],
        ]);

        try {
            $code = $this->authService->forgotPassword($request->phone);

            return $this->success([
                'message' => 'تم إرسال رمز التحقق بنجاح',
                'expires_in' => config('auth.otp_expiry_minutes', 10) . ' دقيقة',
            ], 'تم إرسال رمز التحقق بنجاح');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * Verify OTP for password reset
     */
    public function verifyOtpForPassword(Request $request): JsonResponse
    {
        $request->validate([
            'phone' => ['required', 'string'],
            'code' => ['required', 'string', 'digits:4'],
        ]);

        try {
            $this->authService->verifyOtpForPassword($request->phone, $request->code);

            return $this->success([
                'message' => 'تم التحقق بنجاح',
            ], 'تم التحقق من رمز OTP بنجاح');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * Reset Password after OTP verification
     */
    public function resetPasswordAfterOtp(Request $request): JsonResponse
    {
        $request->validate([
            'phone' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        try {
            $this->authService->resetPasswordAfterOtp($request->phone, $request->password);

            return $this->success([
                'message' => 'تم تغيير كلمة المرور بنجاح',
            ], 'تم تغيير كلمة المرور بنجاح');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * Show OTP verification form (web)
     */
    public function showOtpForm(Request $request)
    {
        $phone = $request->input('phone', '');
        $mode = $request->input('mode', 'register'); // register or reset
        $success = $request->input('success', false);

        return view('auth.verify', [
            'phone' => $phone,
            'mode' => $success ? 'success' : 'verify-otp',
            'success' => !!$success,
            'canResend' => true,
            'message' => $success ? 'تم التحقق من حسابك بنجاح. يمكنك الآن تسجيل الدخول.' : null,
        ]);
    }

    /**
     * Verify OTP (web)
     */
    public function verifyOtpWeb(Request $request)
    {
        $request->validate([
            'phone' => ['required', 'string'],
            'otp' => ['required', 'array', 'size:4'],
            'mode' => ['required', 'string', 'in:register,reset'],
        ]);

        $code = implode('', $request->otp);
        $phone = $request->phone;
        $mode = $request->mode;

        try {
            if ($mode === 'register') {
                $verified = $this->authService->verifyOtp($phone, $code);

                if ($verified) {
                    return redirect('/auth/verify?success=1&mode=register');
                } else {
                    return back()->withInput()->withErrors(['otp' => 'رمز التحقق غير صحيح أو منتهي الصلاحية']);
                }
            } else {
                // Password reset flow
                $this->authService->verifyOtpForPassword($phone, $code);
                return redirect('/auth/reset-password-after-otp?phone=' . urlencode($phone));
            }
        } catch (\Exception $e) {
            return back()->withInput()->withErrors(['otp' => $e->getMessage()]);
        }
    }

    /**
     * Show forgot password form (web)
     */
    public function showForgotPasswordForm()
    {
        return view('auth.verify', [
            'mode' => 'forgot',
            'success' => false,
        ]);
    }

    /**
     * Handle forgot password submission (web)
     */
    public function forgotPasswordWeb(Request $request)
    {
        $request->validate([
            'phone' => ['required', 'string'],
        ]);

        try {
            $this->authService->forgotPassword($request->phone);
            return redirect('/auth/verify-otp?phone=' . urlencode($request->phone) . '&mode=reset');
        } catch (\Exception $e) {
            return back()->withInput()->withErrors(['phone' => $e->getMessage()]);
        }
    }

    /**
     * Show reset password form after OTP (web)
     */
    public function showResetPasswordAfterOtp(Request $request)
    {
        return view('auth.verify', [
            'mode' => 'reset',
            'verified' => true,
            'phone' => $request->input('phone', ''),
            'success' => false,
        ]);
    }

    /**
     * Handle reset password after OTP (web)
     */
    public function resetPasswordAfterOtpWeb(Request $request)
    {
        $request->validate([
            'phone' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        try {
            $this->authService->resetPasswordAfterOtp($request->phone, $request->password);
            return view('auth.reset-success');
        } catch (\Exception $e) {
            return back()->withInput()->withErrors(['password' => $e->getMessage()]);
        }
    }

    /**
     * Resend OTP (web)
     */
    public function resendOtpWeb(Request $request)
    {
        $phone = $request->input('phone', '');
        $mode = $request->input('mode', 'register');

        try {
            $this->authService->sendOtp($phone);
            return redirect('/auth/verify-otp?phone=' . urlencode($phone) . '&mode=' . $mode);
        } catch (\Exception $e) {
            return redirect('/auth/verify-otp?phone=' . urlencode($phone) . '&mode=' . $mode)
                ->withErrors(['otp' => $e->getMessage()]);
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
