// Simple auth client for our Effect-based API
export const authClient = {
  signUp: {
    email: async ({ email, password, name }: { email: string; password: string; name: string }) => {
      const response = await fetch('/api/auth/sign-up/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      })
      return response.json()
    }
  },
  signIn: {
    email: async ({ email, password }: { email: string; password: string }) => {
      const response = await fetch('/api/auth/sign-in/email', {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      return response.json()
    }
  },
  signOut: async () => {
    const response = await fetch('/api/auth/sign-out', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
    return response.json()
  },
  getSession: async () => {
    const response = await fetch('/api/auth/session')
    return response.json()
  }
}