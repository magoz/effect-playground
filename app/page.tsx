import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/getSession'

export default async function Home() {
  const session = await getSession()
  if (!session) redirect('/login')

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gray-50 flex items-center justify-center p-4 text-gray-900">
      Hello {session?.user.name}
    </div>
  )
}
