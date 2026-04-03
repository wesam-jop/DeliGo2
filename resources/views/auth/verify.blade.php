<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $success ? 'تم التفعيل بنجاح' : 'خطأ في التفعيل' }}</title>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary: #f97316;
            --primary-dark: #ea580c;
            --success: #10b981;
            --error: #ef4444;
            --bg: #0f172a;
            --card: #1e293b;
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
        }

        .icon-success {
            background-color: rgba(16, 185, 129, 0.1);
            color: var(--success);
            box-shadow: 0 0 20px rgba(16, 185, 129, 0.2);
        }

        .icon-error {
            background-color: rgba(239, 68, 68, 0.1);
            color: var(--error);
            box-shadow: 0 0 20px rgba(239, 68, 68, 0.2);
        }

        h1 {
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 15px;
        }

        p {
            color: var(--text-secondary);
            font-size: 16px;
            line-height: 1.6;
            margin-bottom: 30px;
        }

        .redirect-text {
            font-size: 14px;
            color: var(--text-secondary);
            opacity: 0.8;
        }

        .timer {
            font-weight: 700;
            color: var(--primary);
            display: inline-block;
            min-width: 20px;
        }

        .btn {
            display: inline-block;
            background-color: var(--primary);
            color: white;
            padding: 12px 30px;
            border-radius: 12px;
            text-decoration: none;
            font-weight: 600;
            transition: all 0.3s ease;
            box-shadow: 0 10px 15px -3px rgba(249, 115, 22, 0.3);
        }

        .btn:hover {
            background-color: var(--primary-dark);
            transform: translateY(-2px);
            box-shadow: 0 20px 25px -5px rgba(249, 115, 22, 0.4);
        }

        /* Countdown circle animation */
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
    </style>
</head>
<body>
    <div class="container">
        @if($success)
            <div class="icon-wrapper icon-success">✓</div>
            <h1>تم تفعيل الحساب بنجاح</h1>
            <p>{{ $message ?? 'تم التحقق من بريدك الإلكتروني وتنشيط حسابك بالكامل. يمكنك الآن البدء باستخدام كافة ميزات التطبيق.' }}</p>
            
            <div class="loader"></div>
            <p class="redirect-text">
                سيتم تحويلك تلقائياً لصفحة تسجيل الدخول خلال <span id="timer" class="timer">5</span> ثواني...
            </p>
            
            <a href="/login" class="btn">اذهب الآن</a>
        @else
            <div class="icon-wrapper icon-error">✕</div>
            <h1>فشل في التفعيل</h1>
            <p>{{ $message ?? 'عذراً، الرابط الذي استخدمته غير صالح أو منتهي الصلاحية. يرجى طلب رابط جديد والمحاولة مرة أخرى.' }}</p>
            
            <a href="/login" class="btn">العودة للرئيسية</a>
        @endif
    </div>

    @if($success)
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
    @endif
</body>
</html>
