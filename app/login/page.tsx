import { getSession } from '@/lib/auth/getSession'
import { AuthForm } from '../components/auth/auth-form'
import { redirect } from 'next/navigation'

export default async function Page() {
  const session = await getSession()
  if (session) redirect('/')

  return <AuthForm />
}
