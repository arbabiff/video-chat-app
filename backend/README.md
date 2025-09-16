# Video Chat Backend API

یک پلتفرم ویدیو چت تصادفی با رابط فارسی و قابلیت‌های پیشرفته.

## 🚀 ویژگی‌ها

### احراز هویت و مدیریت کاربران
- ثبت‌نام و ورود کاربران
- تأیید ایمیل
- بازیابی رمز عبور
- مدیریت پروفایل کاربران
- سیستم دوستان و درخواست دوستی
- مسدود کردن کاربران

### چت و ویدیو کال
- چت تصادفی با فیلترهای پیشرفته
- ویدیو کال با WebRTC
- Socket.IO برای ارتباطات real-time
- سیستم matching هوشمند
- گزارش و امتیازدهی کاربران

### مدیریت سیستم
- پنل مدیریت کامل
- آمار و گزارشات
- مدیریت کاربران
- نظارت بر سلامت سیستم

### امنیت
- احراز هویت JWT
- محدودسازی نرخ درخواست‌ها
- اعتبارسنجی ورودی‌ها
- حفاظت در برابر حملات

## 📋 پیش‌نیازها

- Node.js (نسخه 16 یا بالاتر)
- MongoDB (نسخه 4.4 یا بالاتر)
- npm یا yarn

### اختیاری
- Redis (برای بهبود عملکرد)
- Cloudinary (برای آپلود تصاویر)
- Stripe (برای پرداخت)

## 🛠 نصب و راه‌اندازی

### 1. کلون کردن پروژه
```bash
git clone <repository-url>
cd video-chat/backend
```

### 2. نصب وابستگی‌ها
```bash
npm install
```

### 3. تنظیمات محیط
فایل `.env.example` را کپی کرده و نام آن را به `.env` تغییر دهید:
```bash
cp .env.example .env
```

سپس مقادیر مربوط به محیط خود را وارد کنید.

### 4. راه‌اندازی پایگاه داده
MongoDB را نصب کرده و اجرا کنید. پایگاه داده به صورت خودکار ایجاد خواهد شد.

### 5. اجرای برنامه

#### حالت توسعه
```bash
npm run dev
```

#### حالت تولید
```bash
npm start
```

## 📚 API Documentation

### احراز هویت (Authentication)

#### ثبت‌نام کاربر
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "testuser",
  "email": "test@example.com",
  "password": "password123",
  "displayName": "Test User",
  "gender": "male",
  "birthDate": "1995-01-01",
  "country": "IR"
}
```

#### ورود کاربر
```http
POST /api/auth/login
Content-Type: application/json

{
  "login": "testuser",
  "password": "password123"
}
```

#### دریافت اطلاعات کاربر
```http
GET /api/auth/me
Authorization: Bearer <token>
```

### مدیریت کاربران (Users)

#### جستجوی کاربران
```http
GET /api/users/search?query=test&gender=female&page=1&limit=20
Authorization: Bearer <token>
```

#### یافتن کاربران مطابق
```http
GET /api/users/find-match
Authorization: Bearer <token>
```

#### ارسال درخواست دوستی
```http
POST /api/users/{userId}/friend-request
Authorization: Bearer <token>
```

### چت (Chat)

#### دریافت آمار چت
```http
GET /api/chat/stats
Authorization: Bearer <token>
```

#### گزارش کاربر
```http
POST /api/chat/report
Authorization: Bearer <token>
Content-Type: application/json

{
  "reportedUserId": "user_id",
  "reason": "inappropriate_content",
  "description": "توضیحات اختیاری"
}
```

#### امتیازدهی به چت
```http
POST /api/chat/rate
Authorization: Bearer <token>
Content-Type: application/json

{
  "partnerUserId": "user_id",
  "rating": 5
}
```

### مدیریت (Admin)

#### آمار داشبورد
```http
GET /api/admin/dashboard
Authorization: Bearer <admin_token>
```

#### لیست کاربران
```http
GET /api/admin/users?page=1&limit=20&status=active
Authorization: Bearer <admin_token>
```

#### به‌روزرسانی وضعیت کاربر
```http
PUT /api/admin/users/{userId}/status
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "status": "banned"
}
```

## 🔌 Socket.IO Events

### اتصال و احراز هویت
```javascript
// اتصال به سرور
const socket = io('http://localhost:8000');

// احراز هویت
socket.emit('authenticate', token);

// تأیید احراز هویت
socket.on('authenticated', (data) => {
  console.log('Authenticated successfully');
});
```

### چت تصادفی
```javascript
// جستجوی شریک چت
socket.emit('find_random_chat', {
  genderPreference: 'both',
  ageRange: { min: 18, max: 30 }
});

// یافتن شریک
socket.on('chat_matched', (data) => {
  console.log('Match found:', data.partner);
});

// ارسال پیام
socket.emit('send_message', {
  roomId: 'room_id',
  message: 'سلام!',
  type: 'text'
});

// دریافت پیام
socket.on('new_message', (messageData) => {
  console.log('New message:', messageData);
});
```

### ویدیو کال
```javascript
// شروع تماس
socket.emit('initiate_call', {
  targetUserId: 'user_id',
  callType: 'video'
});

// پذیرش تماس
socket.emit('accept_call', {
  callId: 'call_id'
});

// WebRTC Signaling
socket.emit('webrtc_offer', {
  callId: 'call_id',
  offer: rtcOffer
});

socket.on('webrtc_answer', (data) => {
  // Handle WebRTC answer
});
```

## 📊 مدل‌های داده

### کاربر (User)
```javascript
{
  _id: ObjectId,
  username: String (unique),
  email: String (unique),
  password: String (hashed),
  displayName: String,
  avatar: String,
  role: ['user', 'moderator', 'admin'],
  status: ['active', 'inactive', 'banned', 'pending'],
  gender: ['male', 'female', 'other'],
  birthDate: Date,
  country: String,
  language: ['fa', 'en'],
  
  preferences: {
    ageRange: { min: Number, max: Number },
    genderPreference: ['male', 'female', 'both'],
    allowLocation: Boolean
  },
  
  subscription: {
    type: ['free', 'premium', 'vip'],
    expiresAt: Date,
    autoRenew: Boolean
  },
  
  stats: {
    totalChats: Number,
    totalMinutes: Number,
    averageRating: Number,
    reportCount: Number
  },
  
  privacy: {
    showOnline: Boolean,
    allowMessages: Boolean,
    profileVisibility: ['public', 'friends', 'private']
  },
  
  friends: [{ user: ObjectId, addedAt: Date }],
  friendRequests: [{ from: ObjectId, sentAt: Date }],
  blockedUsers: [ObjectId],
  
  createdAt: Date,
  updatedAt: Date,
  lastActive: Date
}
```

## 🛡 امنیت

### JWT Token
```javascript
{
  id: user_id,
  role: user_role,
  subscription: subscription_type,
  iat: issued_at,
  exp: expires_at
}
```

### محدودسازی نرخ
- 100 درخواست در 15 دقیقه برای هر IP
- محدودیت‌های خاص برای عملیات حساس

### اعتبارسنجی
- تمام ورودی‌ها با express-validator بررسی می‌شوند
- پارامترها sanitize می‌شوند
- حداکثر اندازه فایل: 5MB

## 🧪 تست

```bash
# اجرای تست‌ها
npm test

# اجرای تست‌ها در حالت watch
npm run test:watch
```

## 📝 Logging

لاگ‌ها در پوشه `logs/` ذخیره می‌شوند:
- `combined.log`: تمام لاگ‌ها
- `error.log`: فقط خطاها
- `exceptions.log`: استثناها

## 🔧 Scripts مفید

```bash
# اجرای در حالت توسعه
npm run dev

# اجرای در حالت تولید
npm start

# بررسی کیفیت کد
npm run lint

# اصلاح خودکار کد
npm run lint:fix

# seed کردن پایگاه داده (اختیاری)
npm run seed

# migration پایگاه داده (اختیاری)
npm run migrate
```

## 🌍 متغیرهای محیط

| متغیر | توضیحات | پیش‌فرض |
|-------|---------|---------|
| `NODE_ENV` | محیط اجرا | development |
| `PORT` | پورت سرور | 8000 |
| `MONGODB_URI` | آدرس MongoDB | mongodb://localhost:27017/video_chat_db |
| `JWT_SECRET` | کلید مخفی JWT | - |
| `JWT_EXPIRE` | مدت انقضای JWT | 7d |
| `CLIENT_URL` | آدرس کلاینت | http://localhost:3000 |

## 🤝 مشارکت

1. Fork کنید
2. برنچ جدید ایجاد کنید (`git checkout -b feature/amazing-feature`)
3. تغییرات را commit کنید (`git commit -m 'Add amazing feature'`)
4. Push کنید (`git push origin feature/amazing-feature`)
5. Pull Request ایجاد کنید

## 📄 مجوز

این پروژه تحت مجوز MIT منتشر شده است.

## 🆘 پشتیبانی

در صورت بروز مشکل:
1. ابتدا مستندات را بررسی کنید
2. لاگ‌ها را چک کنید
3. Issue جدید ایجاد کنید

## 📞 تماس

برای سوالات و پیشنهادات با ما در تماس باشید.
