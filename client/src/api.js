// API base URL - uses environment variable in production, empty string (proxy) in dev
export const API_URL = import.meta.env.VITE_API_URL || ''

export async function api(endpoint, options = {}) {
  const token = localStorage.getItem('token')
  
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  })
  
  return res
}

