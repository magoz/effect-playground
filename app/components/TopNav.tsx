'use client'

import { authClient } from '@/lib/auth-client'
import Link from 'next/link'
import { useState } from 'react'

export function TopNav() {
  const { data: session, isPending } = authClient.useSession()
  console.log('Session', session)

  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await authClient.signOut()
      window.location.reload()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Learning Effect</h1>
        </div>

        <div className="flex items-center space-x-4">
          {isPending ? (
            <div className="text-sm text-gray-500">Loading...</div>
          ) : session?.user ? (
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-700">Welcome, {session.user.name}</span>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoggingOut ? 'Signing out...' : 'Sign out'}
              </button>
            </div>
          ) : (
            <div className="text-sm text-gray-500">
              <Link href="/login" className="text-sm text-gray-700 hover:underline">
                Login
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

