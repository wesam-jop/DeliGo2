<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $mode === 'reset' ? 'استعادة كلمة المرور' : 'تأكيد الحساب' }}</title>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary: #f97316;
            --primary-dark: #ea580c;
            --success: #10b981;
            --error: #ef4444;
            --bg: #0f172a;
            --card: #1e293b;
            --input: #334155;
            --text: #f8fafc;
            --text-secondary: #94a3b8;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Cairo', sans-serif;
        }

        body {
            background-color: var(--bg);
            color: var(--text);
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            padding: 20px;
        }

        .container {
            width: 100%;
            max-width: 450px;
            background-color: var(--card);
            padding: 40px;
            border-radius: 24px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
            text-align: center;
            border: 1px solid rgba(255, 255, 255, 0.05);
            animation: fadeIn 0.8s ease-out;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .icon-wrapper {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            display: flex;
            justify-content: center;
            align-items: center;
            margin: 0 auto 30px;
            font-size: 40px;
            background-color: rgba(249, 115, 22, 0.1);
            color: var(--primary);
        }

        h1 {
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 15px;
        }

        p {
            color: var(--text-secondary);
            font-size: 15px;
            margin-bottom: 30px;
            line-height: 1.6;
        }

        .phone-display {
            background-color: var(--input);
            padding: 12px 20px;
            border-radius: 10px;
            font-size: 18px;
            font-weight: 600;
            color: var(--text);
            margin-bottom: 30px;
            display: inline-block;
        }

        .otp-container {
            display: flex;
            justify-content: center;
            gap: 12px;
            margin-bottom: 30px;
            direction: ltr;
        }

        .otp-input {
            width: 60px;
            height: 60px;
            background-color: var(--input);
            border: 2px solid rgba(255, 255, 255, 0.05);
            border-radius: 12px;
            color: var(--text);
            font-size: 24px;
            font-weight: bold;
            text-align: center;
            outline: none;
            transition: all 0.3s;
        }

        .otp-input:focus {
            border-color: var(--primary);
            box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.2);
            background-color: rgba(249, 115, 22, 0.1);
        }

        .otp-input.filled {
            border-color: var(--primary);
            background-color: rgba(249, 115, 22, 0.1);
            color: var(--primary);
        }

        .btn {
            width: 100%;
            background-color: var(--primary);
            color: white;
            padding: 14px;
            border-radius: 12px;
            border: none;
            font-size: 17px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.3s;
            margin-bottom: 20px;
            box-shadow: 0 10px 15px -3px rgba(249, 115, 22, 0.3);
        }

        .btn:hover {
            background-color: var(--primary-dark);
            transform: translateY(-2px);
        }

        .btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
        }

        .resend-container {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 8px;
        }

        .resend-text {
            color: var(--text-secondary);
            font-size: 14px;
        }

        .resend-link {
            color: var(--primary);
            font-size: 14px;
            font-weight: 600;
            text-decoration: none;
            cursor: pointer;
            transition: all 0.3s;
        }

        .resend-link:hover {
            color: var(--primary-dark);
        }

        .resend-link.disabled {
            opacity: 0.5;
            cursor: not-allowed;
            pointer-events: none;
        }

        .timer {
            color: var(--text-secondary);
            font-size: 14px;
            font-weight: 600;
        }

        .error-box {
            background-color: rgba(239, 68, 68, 0.1);
            color: var(--error);
            padding: 12px;
            border-radius: 10px;
            margin-bottom: 20px;
            font-size: 14px;
            border: 1px solid rgba(239, 68, 68, 0.2);
        }

        .message-box {
            background-color: rgba(16, 185, 129, 0.1);
            color: var(--success);
            padding: 12px;
            border-radius: 10px;
            margin-bottom: 20px;
            font-size: 14px;
            border: 1px solid rgba(16, 185, 129, 0.2);
        }

        .success-icon {
            background-color: rgba(16, 185, 129, 0.1);
            color: var(--success);
        }

        .error-icon {
            background-color: rgba(239, 68, 68, 0.1);
            color: var(--error);
        }

        .loader {
            width: 50px;
            height: 50px;
            border: 3px solid rgba(255, 255, 255, 0.1);
            border-top: 3px solid var(--primary);
            border-radius: 50%;
            margin: 20px auto;
            animation: spin 1s linear infinite;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        .btn-link {
            display: inline-block;
            color: var(--primary);
            text-decoration: none;
            font-weight: 600;
            transition: all 0.3s;
        }

        .btn-link:hover {
            color: var(--primary-dark);
        }
    </style>
</head>
<body>
    <div class="container">
        @if($mode === 'success')
            {{-- Success: OTP verified --}}
            <div class="icon-wrapper success-icon">✓</div>
            <h1>تم التفعيل بنجاح</h1>
            <p>{{ $message ?? 'تم التحقق من حسابك بنجاح. يمكنك الآن تسجيل الدخول.' }}</p>

            <div class="loader"></div>
            <p style="font-size: 14px; color: var(--text-secondary);">
                سيتم تحويلك تلقائياً خلال <span id="timer" style="color: var(--primary); font-weight: 700;">5</span> ثواني...
            </p>

            <a href="/login" class="btn" style="margin-top: 15px; text-decoration: none;">اذهب الآن</a>

            <script>
                let count = 5;
                const timerElement = document.getElementById('timer');
                const countdown = setInterval(() => {
                    count--;
                    timerElement.textContent = count;
                    if (count <= 0) {
                        clearInterval(countdown);
                        window.location.href = '/login';
                    }
                }, 1000);
            </script>
        @elseif($mode === 'reset' && $verified)
            {{-- Password reset after OTP verification --}}
            <div class="icon-wrapper">🔑</div>
            <h1>كلمة المرور الجديدة</h1>
            <p>أدخل كلمة المرور الجديدة وتأكيدها</p>

            @if(session('success'))
                <div class="message-box">{{ session('success') }}</div>
            @endif

            @if($errors->any())
                <div class="error-box">{{ $errors->first() }}</div>
            @endif

            @if(isset($error))
                <div class="error-box">{{ $error }}</div>
            @endif

            <form action="/auth/reset-password-after-otp" method="POST">
                @csrf
                <input type="hidden" name="phone" value="{{ $phone }}">

                <div class="form-group" style="text-align: right; margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: 600; color: var(--text-secondary);">كلمة المرور الجديدة</label>
                    <input type="password" name="password" required placeholder="أدخل 8 أحرف على الأقل" style="width: 100%; padding: 14px 20px; background-color: var(--input); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 12px; color: var(--text); font-size: 16px; outline: none; transition: all 0.3s;">
                </div>

                <div class="form-group" style="text-align: right; margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: 600; color: var(--text-secondary);">تأكيد كلمة المرور</label>
                    <input type="password" name="password_confirmation" required placeholder="أعد إدخال كلمة المرور" style="width: 100%; padding: 14px 20px; background-color: var(--input); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 12px; color: var(--text); font-size: 16px; outline: none; transition: all 0.3s;">
                </div>

                <button type="submit" class="btn">تغيير كلمة المرور</button>
            </form>
        @elseif($mode === 'forgot')
            {{-- Forgot Password: Enter Phone --}}
            <div class="icon-wrapper">🔒</div>
            <h1>نسيت كلمة المرور؟</h1>
            <p>أدخل رقم هاتفك وسنرسل لك رمز التحقق عبر واتساب</p>

            @if($errors->any())
                <div class="error-box">{{ $errors->first() }}</div>
            @endif

            @if(isset($error))
                <div class="error-box">{{ $error }}</div>
            @endif

            <form action="/auth/forgot-password" method="POST">
                @csrf
                <div class="form-group" style="text-align: right; margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: 600; color: var(--text-secondary);">رقم الهاتف</label>
                    <input type="tel" name="phone" required placeholder="مثال: +963912345678" style="width: 100%; padding: 14px 20px; background-color: var(--input); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 12px; color: var(--text); font-size: 16px; outline: none; transition: all 0.3s;">
                </div>
                <button type="submit" class="btn">إرسال الرمز</button>
            </form>

            <a href="/login" class="btn-link">← العودة لتسجيل الدخول</a>
        @elseif($mode === 'verify-otp')
            {{-- Enter OTP --}}
            <div class="icon-wrapper">📩</div>
            <h1>{{ $mode === 'reset' ? 'أدخل رمز التحقق' : 'تأكيد الحساب' }}</h1>
            <p>أدخل الرمز المكون من 4 أرقام الذي وصلك على واتساب</p>

            <div class="phone-display">{{ $phone ?? '' }}</div>

            @if($errors->any())
                <div class="error-box">{{ $errors->first() }}</div>
            @endif

            @if(isset($error))
                <div class="error-box">{{ $error }}</div>
            @endif

            <form action="/auth/verify-otp" method="POST" id="otp-form">
                @csrf
                <input type="hidden" name="phone" value="{{ $phone }}">
                <input type="hidden" name="mode" value="{{ $mode }}">

                <div class="otp-container">
                    <input type="text" class="otp-input" name="otp[]" maxlength="1" inputmode="numeric" autofocus>
                    <input type="text" class="otp-input" name="otp[]" maxlength="1" inputmode="numeric">
                    <input type="text" class="otp-input" name="otp[]" maxlength="1" inputmode="numeric">
                    <input type="text" class="otp-input" name="otp[]" maxlength="1" inputmode="numeric">
                </div>

                <button type="submit" class="btn" id="submit-btn">تأكيد</button>
            </form>

            <div class="resend-container">
                <span class="resend-text">لم يصلك الرمز؟</span>
                @if($canResend)
                    <a href="/auth/resend-otp?phone={{ $phone }}&mode={{ $mode }}" class="resend-link" id="resend-link">إعادة الإرسال</a>
                @else
                    <span class="timer">يمكنك الإعادة بعد <span id="countdown">60</span> ثانية</span>
                @endif
            </div>

            <script>
                const inputs = document.querySelectorAll('.otp-input');
                const form = document.getElementById('otp-form');
                const submitBtn = document.getElementById('submit-btn');

                inputs.forEach((input, index) => {
                    input.addEventListener('input', (e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        e.target.value = value;

                        if (value && index < inputs.length - 1) {
                            inputs[index + 1].focus();
                        }

                        if (value) {
                            e.target.classList.add('filled');
                        } else {
                            e.target.classList.remove('filled');
                        }
                    });

                    input.addEventListener('keydown', (e) => {
                        if (e.key === 'Backspace' && !e.target.value && index > 0) {
                            inputs[index - 1].focus();
                        }
                    });

                    input.addEventListener('paste', (e) => {
                        e.preventDefault();
                        const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
                        paste.split('').forEach((char, i) => {
                            if (inputs[i]) {
                                inputs[i].value = char;
                                inputs[i].classList.add('filled');
                            }
                        });
                        if (paste.length > 0) {
                            inputs[Math.min(paste.length, inputs.length) - 1].focus();
                        }
                    });
                });

                form.addEventListener('submit', () => {
                    submitBtn.disabled = true;
                    submitBtn.textContent = 'جاري التحقق...';
                });

                @if(!$canResend)
                    let seconds = 60;
                    const countdownEl = document.getElementById('countdown');
                    const resendLink = document.getElementById('resend-link');

                    const interval = setInterval(() => {
                        seconds--;
                        countdownEl.textContent = seconds;

                        if (seconds <= 0) {
                            clearInterval(interval);
                            document.querySelector('.resend-container').innerHTML = `
                                <span class="resend-text">لم يصلك الرمز؟</span>
                                <a href="/auth/resend-otp?phone={{ $phone }}&mode={{ $mode }}" class="resend-link">إعادة الإرسال</a>
                            `;
                        }
                    }, 1000);
                @endif
            </script>
        @else
            {{-- Error state --}}
            <div class="icon-wrapper error-icon">✕</div>
            <h1>فشل في التفعيل</h1>
            <p>{{ $message ?? 'حدث خطأ في عملية التحقق. يرجى المحاولة مرة أخرى.' }}</p>

            <a href="/login" class="btn" style="text-decoration: none;">العودة للرئيسية</a>
        @endif
    </div>
</body>
</html>
