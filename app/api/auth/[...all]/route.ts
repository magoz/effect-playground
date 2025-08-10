import { auth } from '@/lib/auth'
import { toNextJsHandler } from 'better-auth/next-js'

// Initialize auth and export handlers
const getHandlers = async () => {
  const authInstance = await auth.initialize()
  return toNextJsHandler(authInstance.handler)
}

export async function GET(request: Request) {
  const { GET } = await getHandlers()
  return GET(request)
}

export async function POST(request: Request) {
  const { POST } = await getHandlers()
  return POST(request)
}