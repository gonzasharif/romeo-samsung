const API_BASE_URL = 'http://localhost:8000'

function parseErrorDetail(detail: any, fallback: string): string {
  if (!detail) return fallback;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail.map((e: any) => `${e.loc?.[e.loc.length - 1] || 'Campo'}: ${e.msg}`).join(' | ');
  }
  return JSON.stringify(detail);
}

export async function login(payload: Record<string, any>) {
  const res = await fetch(`${API_BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  
  if (!res.ok) {
    const error = await res.json()
    throw new Error(parseErrorDetail(error.detail, 'Falla en el login'))
  }
  
  const data = await res.json()
  return data
}

export async function signup(payload: Record<string, any>) {
  const res = await fetch(`${API_BASE_URL}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  
  if (!res.ok) {
    const error = await res.json()
    throw new Error(parseErrorDetail(error.detail, 'Falla en el registro'))
  }
  
  const data = await res.json()
  return data
}

export async function getProjects() {
  const sessionStr = localStorage.getItem('session')
  if (!sessionStr) throw new Error('Not authenticated')
  
  const session = JSON.parse(sessionStr)
  const res = await fetch(`${API_BASE_URL}/projects`, {
    headers: {
      'Authorization': `Bearer ${session.access_token}`
    }
  })
  
  if (res.status === 401) {
    throw new Error('Unauthorized')
  }
  
  const data = await res.json()
  return data
}
