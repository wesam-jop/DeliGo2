# 🔊 Sound Files Required

---

## 📂 Files Needed

You need to add **5 MP3 files** to your **React Native** project:

### File Names & Paths:

| Filename | Purpose | Used For |
|----------|---------|----------|
| `order_new.mp3` | طلب جديد | New order notifications |
| `order_accepted.mp3` | تم قبول الطلب | Order accepted by driver |
| `order_cancelled.mp3` | تم إلغاء الطلب | Order cancelled |
| `message.mp3` | رسالة جديدة | New chat message |
| `default.mp3` | افتراضي | Fallback sound |

---

## 📱 Where to Add Files

### **Android (React Native):**

```
android/app/src/main/res/raw/
├── order_new.mp3
├── order_accepted.mp3
├── order_cancelled.mp3
├── message.mp3
└── default.mp3
```

**Setup Command:**
```bash
mkdir -p android/app/src/main/res/raw
# Copy your .mp3 files to this directory
```

---

### **iOS (React Native):**

```
ios/YourAppName/
├── order_new.mp3
├── order_accepted.mp3
├── order_cancelled.mp3
├── message.mp3
└── default.mp3
```

**Setup Steps:**
1. Open **XCode**
2. Right-click on **YourApp** folder
3. Select **"Add Files to YourApp"**
4. Select all 5 `.mp3` files
5. ✅ Check **"Copy items if needed"**
6. ✅ Add to target: **YourApp**
7. Click **Add**

---

### **Web (React):**

```
public/sounds/
├── order_new.mp3
├── order_accepted.mp3
├── order_cancelled.mp3
├── message.mp3
└── default.mp3
```

**Usage:**
```jsx
const audio = new Audio('/sounds/order_new.mp3');
audio.play();
```

---

## 🎵 Sound Specifications

### Recommended Format:
- **Format:** MP3
- **Bitrate:** 128 kbps
- **Sample Rate:** 44.1 kHz
- **Duration:** 1-3 seconds
- **File Size:** < 100 KB each

### Where to Get Sounds:
- **Free:** https://freesound.org
- **Premium:** https://audiojungle.net
- **Custom:** Record your own or hire a sound designer

---

## 🔧 Backend Configuration

**Backend (Laravel) does NOT need sound files!**

Backend only sends the **sound filename** in the FCM payload:

```php
// config/notification_templates.php

'order_created' => [
    // ...
    'sound' => 'order_new.mp3',  // ← Just the filename
    // ...
],
```

**FCM Payload Example:**
```json
{
  "notification": {
    "title": "📦 طلب جديد",
    "sound": "order_new.mp3"  // ← Frontend will play this
  }
}
```

---

## ✅ Verification

### Android:
```bash
# Check if files exist
ls -la android/app/src/main/res/raw/*.mp3

# Should show all 5 files
```

### iOS:
```bash
# Check in XCode
# Files should appear in YourApp folder in Project Navigator
```

### Web:
```bash
# Check if files exist
ls -la public/sounds/*.mp3

# Should show all 5 files
```

---

## 🎯 Testing

### Test Sound in React Native:

```jsx
import Sound from 'react-native-sound';

// Test each sound
const testSounds = ['order_new', 'order_accepted', 'order_cancelled', 'message', 'default'];

testSounds.forEach(sound => {
  const s = new Sound(sound, Sound.MAIN_BUNDLE, (error) => {
    if (error) {
      console.log('❌ Failed to load:', sound, error);
    } else {
      console.log('✅ Loaded:', sound);
      s.play(() => s.release());
    }
  });
});
```

---

## 📝 Notes

1. **File names must match exactly** (case-sensitive)
2. **No spaces in filenames** (use underscores)
3. **MP3 format recommended** (most compatible)
4. **Keep files small** (< 100 KB each)
5. **Test on real device** (simulators may have audio issues)

---

## 🚀 Quick Start

1. **Get 5 MP3 files** (or use defaults from freesound.org)
2. **Add to Android:** `android/app/src/main/res/raw/`
3. **Add to iOS:** Via XCode (steps above)
4. **Add to Web:** `public/sounds/`
5. **Test:** Send a test notification and verify sound plays

**That's it! Backend is already configured. Just add the files! 🎵**
