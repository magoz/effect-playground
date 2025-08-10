import 'server-only'

import { redirect } from 'next/navigation'
import { getSession } from '../../auth/getSession'

export const ensureAuth = async () => {
  const session = await getSession()
  if (!session) redirect('/')
  return session
}
