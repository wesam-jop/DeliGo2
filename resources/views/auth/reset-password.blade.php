<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>إعادة تعيين كلمة المرور</title>
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
        }

        .form-group {
            text-align: right;
            margin-bottom: 20px;
        }

        label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            color: var(--text-secondary);
        }

        input {
            width: 100%;
            padding: 14px 20px;
            background-color: var(--input);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 12px;
            color: var(--text);
            font-size: 16px;
            outline: none;
            transition: all 0.3s;
        }

        input:focus {
            border-color: var(--primary);
            box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.1);
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
            margin-top: 10px;
            box-shadow: 0 10px 15px -3px rgba(249, 115, 22, 0.3);
        }

        .btn:hover {
            background-color: var(--primary-dark);
            transform: translateY(-2px);
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
    </style>
</head>
<body>
    <div class="container">
        <div class="icon-wrapper">🔒</div>
        <h1>استعادة كلمة المرور</h1>
        <p>يرجى إدخال كلمة المرور الجديدة وتأكيدها لاستعادة الوصول لموقع مشواري.</p>

        @if(isset($errors) && $errors->any())
            <div class="error-box">
                {{ $errors->first() }}
            </div>
        @endif

        @if(isset($error))
            <div class="error-box">
                {{ $error }}
            </div>
        @endif

        <form action="/api/v1/auth/reset-password" method="POST">
            @csrf
            <input type="hidden" name="token" value="{{ $token }}">

            <div class="form-group">
                <label>كلمة المرور الجديدة</label>
                <input type="password" name="password" required placeholder="أدخل 8 أحرف على الأقل">
            </div>

            <div class="form-group">
                <label>تأكيد كلمة المرور</label>
                <input type="password" name="password_confirmation" required placeholder="أعد إدخال كلمة المرور">
            </div>

            <button type="submit" class="btn">تغيير كلمة المرور</button>
        </form>
    </div>
</body>
</html>
