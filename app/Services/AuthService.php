<?php

namespace App\Services;

use App\Models\Otp;
use App\Models\User;
use App\Services\WhatsAppService;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AuthService
{
    public function __construct(
        protected WhatsAppService $whatsapp
    ) {}
    /**
     * OTP expiry time in minutes
     */
    const OTP_EXPIRY_MINUTES = 10; // 10 minutes for security

    /**
     * OTP code length (not used anymore, using token)
     */
    const OTP_CODE_LENGTH = 4;

    /**
     * Register a new user (creates account but requires link verification)
     */
    public function register(array $data): User
    {
        $normalizedPhone = $this->normalizePhoneNumber($data['phone']);

        // Check if user exists and is verified
        $existingUser = User::where('phone', $normalizedPhone)->first();
        
        if ($existingUser && $existingUser->phone_verified_at) {
            throw new \Exception('This phone number is already registered and verified');
        }
        
        // If user exists but not verified, delete old account
        if ($existingUser && !$existingUser->phone_verified_at) {
            $existingUser->delete();
        }

        $userData = [
            'name' => $data['name'],
            'phone' => $normalizedPhone,
            'role' => $data['role'] ?? 'customer',
            'governorate_id' => $data['governorate_id'] ?? null,
            'area_id' => $data['area_id'] ?? null,
            'phone_verified_at' => null, // Not verified yet
        ];

        // Password required for all users
        if (isset($data['password']) && !empty($data['password'])) {
            $userData['password'] = Hash::make($data['password']);
        } else {
            throw new \Exception('Password is required for all users');
        }

        // Drivers and store owners need admin approval
        if (in_array($data['role'], ['driver', 'store_owner'])) {
            $userData['is_approved'] = false;
        }

        $user = User::create($userData);

        // If store owner, create store record
        if ($data['role'] === 'store_owner' && isset($data['store_name'])) {
            $imagePath = null;
            
            // Handle image upload
            if (isset($data['store_image']) && $data['store_image'] instanceof \Illuminate\Http\UploadedFile) {
                $image = $data['store_image'];
                $imageName = time() . '_' . $image->getClientOriginalName();
                $imagePath = $image->storeAs('stores', $imageName, 'public');
                // Use asset() to generate proper HTTP URL
                $imagePath = url('storage/' . $imagePath);
                
                \Log::info('Store image uploaded', [
                    'original_name' => $image->getClientOriginalName(),
                    'stored_path' => $imagePath,
                    'full_url' => $imagePath,
                ]);
            } else {
                \Log::warning('Store image not uploaded', [
                    'has_image' => isset($data['store_image']),
                    'is_file' => isset($data['store_image']) ? $data['store_image'] instanceof \Illuminate\Http\UploadedFile : false,
                ]);
            }

            $user->store()->create([
                'name' => $data['store_name'],
                'description' => $data['store_description'] ?? null,
                'image' => $imagePath,
                'category_id' => $data['category_id'] ?? null,
                'phone' => $data['phone'] ?? $user->phone,
                'governorate_id' => $data['governorate_id'] ?? null,
                'area_id' => $data['area_id'] ?? null,
                'address_details' => $data['address_details'] ?? null,
                'latitude' => $data['latitude'] ?? null,
                'longitude' => $data['longitude'] ?? null,
                'is_approved' => false,
            ]);
        }

        // Send OTP for phone verification
        $this->sendOtp($normalizedPhone);

        return $user;
    }

    /**
     * Send OTP code to phone number
     * Returns the OTP code (for testing) - in production should NOT return code
     */
    public function sendOtp(string $phone): string
    {
        $normalizedPhone = $this->normalizePhoneNumber($phone);

        // Delete any existing unused OTPs for this phone
        Otp::where('phone', $normalizedPhone)->where('is_used', false)->delete();

        // Generate 4-digit OTP code
        $code = str_pad(rand(0, 9999), 4, '0', STR_PAD_LEFT);

        // Create OTP record
        Otp::create([
            'phone' => $normalizedPhone,
            'token' => \Illuminate\Support\Str::random(64), // Keep token for link-based verification
            'code' => $code, // Store the actual OTP code
            'expires_at' => now()->addMinutes(self::OTP_EXPIRY_MINUTES),
        ]);

        // Send OTP via WhatsApp
        $whatsappMessage = "أهلاً بك في DeliGo \nرمز التحقق الخاص بك هو: {$code}\nصالح لمدة " . self::OTP_EXPIRY_MINUTES . " دقيقة.";
        $this->whatsapp->sendMessage($normalizedPhone, $whatsappMessage);

        // Log OTP code generation (without exposing the actual code for security)
        \Log::info('🔑 OTP Code Generated', [
            'phone' => $normalizedPhone,
            'code' => '****', // Code hidden for security
            'expires_at' => now()->addMinutes(self::OTP_EXPIRY_MINUTES)->format('Y-m-d H:i:s'),
        ]);

        return $code; // Return for testing - remove in production
    }

    /**
     * Generate unique verification token
     */
    private function generateVerificationToken(): string
    {
        return \Illuminate\Support\Str::random(64);
    }

    /**
     * Verify email/token
     */
    public function verifyEmail(string $token): bool
    {
        return $this->verifyToken($token);
    }

    /**
     * Verify token (common logic for email and password reset)
     */
    public function verifyToken(string $token): bool
    {
        $otp = Otp::where('token', $token)
            ->unused()
            ->where('expires_at', '>', now())
            ->first();

        if (!$otp) {
            return false;
        }

        // Mark OTP as used
        $otp->update(['is_used' => true]);

        // Verify user's phone if it was for email verification
        $user = User::where('phone', $otp->phone)->first();
        
        if ($user && !$user->phone_verified_at) {
            $user->update(['phone_verified_at' => now()]);
        }

        return true;
    }

    /**
     * Initiate password reset - Send OTP code
     */
    public function forgotPassword(string $phone): string
    {
        $normalizedPhone = $this->normalizePhoneNumber($phone);
        $user = User::where('phone', $normalizedPhone)->first();

        if (!$user) {
            throw new \Exception('رقم الهاتف غير مسجل لدينا', 404);
        }

        // Generate and send OTP code
        $code = $this->sendOtp($normalizedPhone);

        return $code;
    }

    /**
     * Verify OTP code for password reset
     */
    public function verifyOtpForPassword(string $phone, string $code): bool
    {
        $normalizedPhone = $this->normalizePhoneNumber($phone);

        $otp = Otp::where('phone', $normalizedPhone)
            ->where('code', $code)
            ->where('is_used', false)
            ->where('expires_at', '>', now())
            ->first();

        if (!$otp) {
            throw new \Exception('رمز التحقق غير صحيح أو منتهي الصلاحية', 400);
        }

        // Mark OTP as used
        $otp->update(['is_used' => true]);

        return true;
    }

    /**
     * Reset password after OTP verification
     */
    public function resetPasswordAfterOtp(string $phone, string $password): bool
    {
        $normalizedPhone = $this->normalizePhoneNumber($phone);
        $user = User::where('phone', $normalizedPhone)->first();

        if (!$user) {
            throw new \Exception('المستخدم غير موجود', 404);
        }

        // Update password
        $user->update([
            'password' => \Hash::make($password),
            'phone_verified_at' => $user->phone_verified_at ?? now(),
        ]);

        return true;
    }

    /**
     * Reset password using token (legacy - keep for backward compatibility)
     */
    public function resetPassword(string $token, string $password): bool
    {
        $otp = Otp::where('token', $token)
            ->unused()
            ->where('expires_at', '>', now())
            ->first();

        if (!$otp) {
            throw new \Exception('الرابط غير صالح أو منتهي الصلاحية', 400);
        }

        $user = User::where('phone', $otp->phone)->first();

        if (!$user) {
            throw new \Exception('المستخدم غير موجود', 404);
        }

        // Update password
        $user->update([
            'password' => Hash::make($password),
            'phone_verified_at' => $user->phone_verified_at ?? now() // Verify phone if not already verified
        ]);

        // Mark token as used
        $otp->update(['is_used' => true]);

        return true;
    }

    /**
     * Verify OTP code
     */
    public function verifyOtp(string $phone, string $code): bool
    {
        $otp = Otp::where('phone', $phone)
            ->unused()
            ->notExpired()
            ->where('code', $code)
            ->first();

        if (!$otp) {
            return false;
        }

        // Mark OTP as used
        $otp->update(['is_used' => true]);

        // Mark user's phone as verified
        User::where('phone', $phone)
            ->update(['phone_verified_at' => now()]);

        return true;
    }

    /**
     * Login with phone and password
     */
    public function login(string $phone, string $password): array
    {
        // Normalize phone number (add + if missing)
        $normalizedPhone = $this->normalizePhoneNumber($phone);
        
        $user = User::where('phone', $normalizedPhone)->first();

        if (!$user) {
            throw new \Exception('Invalid credentials', 401);
        }

        if (!Hash::check($password, $user->password)) {
            throw new \Exception('Invalid credentials', 401);
        }

        if (!$user->phone_verified_at) {
            throw new \Exception('رقم الهاتف غير مُؤكَّد. يُرجى التحقق من رقم هاتفك أولاً.', 403);
        }

        // For store owners and drivers, check approval
        if (in_array($user->role, ['store_owner', 'driver']) && !$user->is_approved) {
            throw new \Exception('الحساب قيد الانتظار للموافقة من قبل الإدارة.', 403);
        }

        // Create Sanctum token
        $token = $user->createToken('auth_token')->plainTextToken;

        return [
            'user' => $user,
            'token' => $token,
        ];
    }

    /**
     * Normalize phone number (ensure it starts with +)
     */
    public function normalizePhoneNumber(string $phone): string
    {
        // Remove any existing + and spaces
        $cleaned = str_replace(['+', ' ', '-'], '', $phone);
        
        // Add + at the beginning
        return '+' . $cleaned;
    }

    /**
     * Logout user (revoke current token)
     */
    public function logout(User $user): void
    {
        $user->currentAccessToken()->delete();
    }

    /**
     * Resend OTP for verification
     */
    public function resendOtp(string $phone): string
    {
        $user = User::where('phone', $phone)->first();

        if (!$user) {
            throw new \Exception('User not found', 404);
        }

        if ($user->phone_verified_at) {
            throw new \Exception('Phone number already verified', 400);
        }

        return $this->sendOtp($phone);
    }
}
