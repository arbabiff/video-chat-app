export interface DemoUser {
  id: string;
  name: string;
  avatar: string;
  country: string;
  city: string;
  lat: number;
  lng: number;
  status: 'online' | 'offline' | 'busy';
  gender: 'male' | 'female';
  age: number;
}

export const demoUsers: DemoUser[] = [
  {
    id: '1',
    name: 'سارا احمدی',
    avatar: '👩‍💼',
    country: 'ایران',
    city: 'تهران',
    lat: 35.6892,
    lng: 51.3890,
    status: 'online',
    gender: 'female',
    age: 24
  },
  {
    id: '2',
    name: 'علی رضایی',
    avatar: '👨‍💻',
    country: 'ایران',
    city: 'اصفهان',
    lat: 32.6546,
    lng: 51.6680,
    status: 'online',
    gender: 'male',
    age: 28
  },
  {
    id: '3',
    name: 'مریم کریمی',
    avatar: '👩‍🎨',
    country: 'ترکیه',
    city: 'استانبول',
    lat: 41.0082,
    lng: 28.9784,
    status: 'busy',
    gender: 'female',
    age: 22
  },
  {
    id: '4',
    name: 'محمد حسینی',
    avatar: '👨‍🏫',
    country: 'آلمان',
    city: 'برلین',
    lat: 52.5200,
    lng: 13.4050,
    status: 'online',
    gender: 'male',
    age: 30
  },
  {
    id: '5',
    name: 'فاطمه زارعی',
    avatar: '👩‍⚕️',
    country: 'کانادا',
    city: 'تورنتو',
    lat: 43.6532,
    lng: -79.3832,
    status: 'online',
    gender: 'female',
    age: 26
  },
  {
    id: '6',
    name: 'حسین محمدی',
    avatar: '👨‍🎤',
    country: 'آمریکا',
    city: 'لس آنجلس',
    lat: 34.0522,
    lng: -118.2437,
    status: 'offline',
    gender: 'male',
    age: 27
  },
  {
    id: '7',
    name: 'زهرا نوری',
    avatar: '👩‍🔬',
    country: 'استرالیا',
    city: 'سیدنی',
    lat: -33.8688,
    lng: 151.2093,
    status: 'online',
    gender: 'female',
    age: 25
  },
  {
    id: '8',
    name: 'رضا شریفی',
    avatar: '👨‍🚀',
    country: 'ژاپن',
    city: 'توکیو',
    lat: 35.6762,
    lng: 139.6503,
    status: 'online',
    gender: 'male',
    age: 29
  },
  {
    id: '9',
    name: 'نیلوفر امینی',
    avatar: '👩‍🍳',
    country: 'فرانسه',
    city: 'پاریس',
    lat: 48.8566,
    lng: 2.3522,
    status: 'busy',
    gender: 'female',
    age: 23
  },
  {
    id: '10',
    name: 'امیر کاظمی',
    avatar: '👨‍✈️',
    country: 'امارات',
    city: 'دبی',
    lat: 25.2048,
    lng: 55.2708,
    status: 'online',
    gender: 'male',
    age: 31
  }
];
