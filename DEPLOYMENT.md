# 🚀 راهنمای Deploy پروژه Video Chat

این پروژه به دو بخش جداگانه تقسیم شده است:

1. **اپلیکیشن کاربر** (User App) - در ریشه پروژه
2. **پنل مدیریت** (Admin Panel) - در `apps/admin`

## 📁 ساختار پروژه

```
video-chat-original/
├── apps/
│   └── admin/          # پنل مدیریت (جداگانه)
│       ├── src/
│       ├── package.json
│       └── vite.config.ts
├── backend/            # بکند مشترک
│   ├── server.js
│   └── routes/
├── src/                # اپلیکیشن کاربر
├── package.json        # اپلیکیشن کاربر
└── vite.config.ts
```

---

## 🎯 اپلیکیشن کاربر (User App)

### راه‌اندازی محلی
```bash
# در ریشه پروژه
npm install
npm run dev        # پورت 3000
```

### بیلد تولید
```bash
npm run build
npm run preview    # پورت 4173
```

### Deploy
- پوشه خروجی: `dist/`
- URL پیشنهادی: `https://yourdomain.com`
- سرویس‌های پیشنهادی: Vercel, Netlify, GitHub Pages

---

## 👨‍💼 پنل مدیریت (Admin Panel)

### راه‌اندازی محلی
```bash
cd apps/admin
npm install
npm run dev        # پورت 3001
```

### بیلد تولید
```bash
cd apps/admin
npm run build
npm run preview    # پورت 4174
```

### Deploy
- پوشه خروجی: `apps/admin/dist/`
- URL پیشنهادی: `https://admin.yourdomain.com` یا `https://yourdomain.com/admin`
- سرویس‌های پیشنهادی: Vercel, Netlify, Railway

**⚠️ مهم:** پنل ادمین را روی یک subdomain جداگانه یا مسیر محافظت‌شده deploy کنید.

---

## 🖥️ بکند (Backend)

### راه‌اندازی محلی
```bash
cd backend
npm install
node server.js     # پورت 5000
```

### متغیرهای محیطی (.env)
```env
PORT=5000
JWT_SECRET=your-secret-key
MONGODB_URI=your-mongodb-connection
NODE_ENV=production
```

### Deploy
- سرویس‌های پیشنهادی: Railway, Heroku, DigitalOcean, AWS
- نیازمند: Node.js 18+, MongoDB

---

## 🌐 تنظیمات API

### اپلیکیشن کاربر
در `vite.config.ts` (ریشه پروژه):
```typescript
proxy: {
  '/api': {
    target: 'http://localhost:5000',  // تغییر به URL بکند تولید
    changeOrigin: true
  }
}
```

### پنل ادمین
در `apps/admin/vite.config.ts`:
```typescript
proxy: {
  '/api': {
    target: 'http://localhost:5000',  // تغییر به URL بکند تولید
    changeOrigin: true
  }
}
```

---

## 📦 سناریوهای Deploy

### سناریو 1: Deploy همه بخش‌ها روی سرورهای جداگانه

**اپ کاربر:**
```bash
# Deploy به Vercel
cd D:\oflline-MG\video-chat-original
vercel --prod
```

**پنل ادمین:**
```bash
# Deploy به Netlify
cd D:\oflline-MG\video-chat-original\apps\admin
netlify deploy --prod
```

**بکند:**
```bash
# Deploy به Railway
cd D:\oflline-MG\video-chat-original\backend
railway up
```

### سناریو 2: Deploy اپ کاربر و بکند روی یک سرور

با این روش می‌توانید بکند را با فایل‌های static اپ سرو کنید:

```bash
# بیلد اپ کاربر
npm run build

# کپی فایل‌های بیلد شده به بکند
cp -r dist/* backend/public/

# اجرای بکند
cd backend
node server.js
```

---

## 🔐 امنیت

### پنل ادمین
- ✅ پنل ادمین را روی subdomain جداگانه (`admin.yourdomain.com`) deploy کنید
- ✅ محدودیت IP برای دسترسی به پنل ادمین
- ✅ استفاده از HTTPS برای هر دو بخش
- ✅ فایروال و محافظت از بکند

### احراز هویت
- کد تایید از طریق SMS ارسال شود
- توکن ادمین با تاریخ انقضا 24 ساعت
- لاگ تمام فعالیت‌های ادمین

---

## 🛠️ توسعه

### اجرای همزمان تمام بخش‌ها

**ترمینال 1 - بکند:**
```bash
cd backend
npm run dev
```

**ترمینال 2 - اپ کاربر:**
```bash
npm run dev
```

**ترمینال 3 - پنل ادمین:**
```bash
cd apps/admin
npm run dev
```

---

## 📝 چک‌لیست قبل از Deploy

- [ ] تغییر `JWT_SECRET` در متغیرهای محیطی
- [ ] تنظیم URL بکند در proxy هر دو فرانت‌اند
- [ ] فعال کردن CORS برای دامنه‌های تولید
- [ ] تست کامل هر سه بخش در محیط staging
- [ ] بررسی لاگ‌های بکند
- [ ] تنظیم SSL/HTTPS برای همه دامنه‌ها
- [ ] Backup از دیتابیس قبل از deploy

---

## 🌍 URLهای نمونه پس از Deploy

- اپ کاربر: `https://videochat.example.com`
- پنل ادمین: `https://admin-videochat.example.com`
- API بکند: `https://api-videochat.example.com`

---

**تاریخ ایجاد:** 2025-10-04  
**وضعیت:** ✅ آماده برای Deploy جداگانه

