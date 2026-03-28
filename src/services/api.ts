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
  const ownerId = session.user?.id || ''
  const res = await fetch(`${API_BASE_URL}/projects?owner_id=${ownerId}`, {
    headers: {
      'Authorization': `Bearer ${session.access_token}`
    }
  })
  
  if (res.status === 401) {
    throw new Error('Unauthorized')
  }
  
  const data = await res.json()
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.projects)) return data.projects
  if (Array.isArray(data?.items)) return data.items
  return []
}

export async function createProject(name: string) {
  const sessionStr = localStorage.getItem('session')
  if (!sessionStr) throw new Error('Not authenticated')
  const session = JSON.parse(sessionStr)
  
  const payload = {
    name,
    context: {
      company_summary: "Data to be defined...",
      product_name: name,
      product_description: "Data to be defined...",
      target_audience: "Data to be defined...",
      pricing_notes: "To be defined",
      market_context: "To be defined",
      category: "To be defined"
    }
  }

  const res = await fetch(`${API_BASE_URL}/projects`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`
    },
    body: JSON.stringify(payload)
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({}))
    throw new Error(parseErrorDetail(error.detail, 'Falla al crear proyecto'))
  }
  return await res.json()
}

export async function getProject(projectId: string) {
  const sessionStr = localStorage.getItem('session')
  if (!sessionStr) throw new Error('Not authenticated')
  const session = JSON.parse(sessionStr)
  
  const res = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${session.access_token}`
    }
  })
  if (res.status === 401) throw new Error('Unauthorized')
  if (!res.ok) throw new Error('Falla al cargar proyecto')
  return await res.json()
}

export async function updateProject(projectId: string, payload: any) {
  const sessionStr = localStorage.getItem('session')
  if (!sessionStr) throw new Error('Not authenticated')
  const session = JSON.parse(sessionStr)
  
  const res = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`
    },
    body: JSON.stringify(payload)
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({}))
    throw new Error(parseErrorDetail(error.detail, 'Falla al actualizar proyecto'))
  }
  return await res.json()
}

export async function deleteProject(projectId: string) {
  const sessionStr = localStorage.getItem('session')
  if (!sessionStr) throw new Error('Not authenticated')
  const session = JSON.parse(sessionStr)

  const res = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${session.access_token}`
    }
  })

  if (res.status === 401) throw new Error('Unauthorized')
  if (!res.ok) {
    const error = await res.json().catch(() => ({}))
    throw new Error(parseErrorDetail(error.detail, 'Falla al eliminar proyecto'))
  }
}

export async function logout() {
  const sessionStr = localStorage.getItem('session')
  if (sessionStr) {
    const session = JSON.parse(sessionStr)
    try {
      await fetch(`${API_BASE_URL}/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
    } catch (e) {
      console.error('Logout error', e)
    }
  }
  localStorage.removeItem('session')
}

export async function getProjectModels(projectId: string) {
  const sessionStr = localStorage.getItem('session')
  if (!sessionStr) throw new Error('Not authenticated')
  const session = JSON.parse(sessionStr)
  
  const res = await fetch(`${API_BASE_URL}/projects/${projectId}/models`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${session.access_token}` }
  })
  if (!res.ok) throw new Error('Error al cargar modelos')
  return await res.json()
}

export async function createProjectModel(projectId: string, payload: any) {
  const sessionStr = localStorage.getItem('session')
  if (!sessionStr) throw new Error('Not authenticated')
  const session = JSON.parse(sessionStr)
  
  const res = await fetch(`${API_BASE_URL}/projects/${projectId}/models`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`
    },
    body: JSON.stringify(payload)
  })
  if (!res.ok) throw new Error('Error al crear modelo')
  return await res.json()
}

export async function updateProjectModel(projectId: string, modelId: string, payload: any) {
  const sessionStr = localStorage.getItem('session')
  if (!sessionStr) throw new Error('Not authenticated')
  const session = JSON.parse(sessionStr)
  
  const res = await fetch(`${API_BASE_URL}/projects/${projectId}/models/${modelId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`
    },
    body: JSON.stringify(payload)
  })
  if (!res.ok) throw new Error('Error al actualizar modelo')
  return await res.json()
}

export async function deleteProjectModel(projectId: string, modelId: string) {
  const sessionStr = localStorage.getItem('session')
  if (!sessionStr) throw new Error('Not authenticated')
  const session = JSON.parse(sessionStr)
  
  const res = await fetch(`${API_BASE_URL}/projects/${projectId}/models/${modelId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${session.access_token}` }
  })
  if (!res.ok && res.status !== 204) throw new Error('Error al eliminar modelo')
}

export async function getProjectAgents(projectId: string) {
  const sessionStr = localStorage.getItem('session')
  if (!sessionStr) throw new Error('Not authenticated')
  const session = JSON.parse(sessionStr)
  
  const res = await fetch(`${API_BASE_URL}/projects/${projectId}/agents`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${session.access_token}` }
  })
  if (!res.ok) throw new Error('Error al cargar agentes')
  return await res.json()
}

export async function createProjectAgent(projectId: string, payload: any) {
  const sessionStr = localStorage.getItem('session')
  if (!sessionStr) throw new Error('Not authenticated')
  const session = JSON.parse(sessionStr)
  
  const res = await fetch(`${API_BASE_URL}/projects/${projectId}/agents`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`
    },
    body: JSON.stringify(payload)
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({}))
    throw new Error(parseErrorDetail(error.detail, 'Error al crear agente'))
  }
  return await res.json()
}

export async function updateProjectAgent(projectId: string, agentId: string, payload: any) {
  const sessionStr = localStorage.getItem('session')
  if (!sessionStr) throw new Error('Not authenticated')
  const session = JSON.parse(sessionStr)
  
  const res = await fetch(`${API_BASE_URL}/projects/${projectId}/agents/${agentId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`
    },
    body: JSON.stringify(payload)
  })
  if (!res.ok) throw new Error('Error al actualizar agente')
  return await res.json()
}

export async function deleteProjectAgent(projectId: string, agentId: string) {
  const sessionStr = localStorage.getItem('session')
  if (!sessionStr) throw new Error('Not authenticated')
  const session = JSON.parse(sessionStr)
  
  const res = await fetch(`${API_BASE_URL}/projects/${projectId}/agents/${agentId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${session.access_token}` }
  })
  if (!res.ok && res.status !== 204) throw new Error('Error al eliminar agente')
}
