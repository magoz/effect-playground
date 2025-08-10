'use client'

import { useState, useEffect } from 'react'

type Session = {
  user: {
    id: string
    name: string
    email: string
    emailVerified: boolean
  }
} | null

export function useSession() {
  const [session, setSession] = useState<Session>(null)
  const [isPending, setIsPending] = useState(true)

  useEffect(() => {
    const fetchSession = async () => {
      setIsPending(true)
      try {
        const response = await fetch('/api/auth/session', {
          credentials: 'include',
        })
        
        if (response.ok) {
          const data = await response.json()
          setSession(data)
        } else {
          setSession(null)
        }
      } catch (error) {
        console.error('Session fetch error:', error)
        setSession(null)
      } finally {
        setIsPending(false)
      }
    }

    fetchSession()
  }, [])

  return { data: session, isPending }
}