import React, { useState } from 'react'

const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!email || !password) return
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login: email, password })
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error?.message || 'ورود ناموفق بود')
      }
      const data = await res.json()
      if (!data?.token || data?.user?.role !== 'admin') {
        throw new Error('دسترسی مجاز نیست. حساب ادمین نیست')
      }
      localStorage.setItem('token', data.token)
      // هدایت به صفحه پنل ادمین در صورت وجود
      window.location.href = '/admin.html'
    } catch (e: any) {
      setError(e?.message || 'خطا در ورود')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg,#0f172a 0%,#1e293b 50%,#334155 100%)' }}>
      <form onSubmit={onSubmit} style={{ width: '100%', maxWidth: 380, background: 'rgba(0,0,0,0.6)', padding: 24, borderRadius: 16, border: '1px solid rgba(255,255,255,0.1)' }}>
        <h1 style={{ color: '#fff', fontSize: 20, fontWeight: 700, marginBottom: 16, textAlign: 'center' }}>ورود ادمین</h1>
        <div style={{ display: 'grid', gap: 12 }}>
          <input
            type="email"
            placeholder="ایمیل ادمین"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            dir="ltr"
            style={{ background: '#111827', color: '#fff', border: '1px solid #374151', borderRadius: 8, padding: '10px 12px' }}
          />
          <input
            type="password"
            placeholder="رمز عبور"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            dir="ltr"
            style={{ background: '#111827', color: '#fff', border: '1px solid #374151', borderRadius: 8, padding: '10px 12px' }}
          />
          {error && (
            <div style={{ color: '#fecaca', background: '#7f1d1d', border: '1px solid #ef4444', borderRadius: 8, padding: '8px 10px', fontSize: 12 }}>
              {error}
            </div>
          )}
          <button type="submit" disabled={loading || !email || !password} style={{ background: '#2563eb', color: '#fff', padding: '10px 14px', borderRadius: 10, border: 0, cursor: 'pointer', opacity: loading || !email || !password ? 0.6 : 1 }}>
            {loading ? 'در حال ورود…' : 'ورود'}
          </button>
        </div>
        <p style={{ color: '#9ca3af', fontSize: 12, marginTop: 12, textAlign: 'center' }}>
          فقط برای مدیر سیستم
        </p>
      </form>
    </div>
  )
}

export default AdminLogin
