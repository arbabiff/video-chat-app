export function getToken(): string | null {
  try {
    return localStorage.getItem('token');
  } catch {
    return null;
  }
}

export function getAdminToken(): string | null {
  try {
    return localStorage.getItem('admin_token');
  } catch {
    return null;
  }
}

export function parseJwt(token: string): any | null {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(function (c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function parseAdminToken(token: string): any | null {
  try {
    const decoded = JSON.parse(atob(token));
    return decoded;
  } catch {
    return null;
  }
}

export function isAdmin(): boolean {
  // بررسی سیستم احراز هویت جدید با تلفن
  const adminToken = getAdminToken();
  const isAuthenticated = localStorage.getItem('admin_authenticated') === 'true';
  
  if (adminToken && isAuthenticated) {
    const adminData = parseAdminToken(adminToken);
    if (adminData && adminData.role === 'admin') {
      // بررسی انقضای توکن (24 ساعت)
      const loginTime = adminData.loginTime;
      const now = Date.now();
      const twentyFourHours = 24 * 60 * 60 * 1000;
      
      if (now - loginTime < twentyFourHours) {
        return true;
      } else {
        // توکن منقضی شده
        logout();
        return false;
      }
    }
  }
  
  // fallback به سیستم قدیمی JWT
  const token = getToken();
  if (!token) return false;
  const payload = parseJwt(token);
  return payload?.role === 'admin';
}

export function getAdminInfo(): { phone: string; loginTime: number } | null {
  const adminToken = getAdminToken();
  if (adminToken) {
    const adminData = parseAdminToken(adminToken);
    if (adminData && adminData.role === 'admin') {
      return {
        phone: adminData.phone,
        loginTime: adminData.loginTime
      };
    }
  }
  return null;
}

export function logout(): void {
  try {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_authenticated');
    localStorage.removeItem('admin_phone');
    localStorage.removeItem('token');
  } catch {
    // Handle error silently
  }
}
