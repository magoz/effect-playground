import { Effect } from 'effect'
import { BetterAuth } from '@/lib/services/auth/service'
import { AppLayer } from '@/lib/layers'
import { toNextJsHandler } from 'better-auth/next-js'

// Get the better-auth handler from our Effect service
async function getAuthHandler() {
  return await Effect.runPromise(
    Effect.gen(function* () {
      const authService = yield* BetterAuth
      return authService.auth
    }).pipe(Effect.provide(AppLayer), Effect.scoped)
  )
}

// Use better-auth's built-in Next.js handler
export async function GET(request: Request) {
  const auth = await getAuthHandler()
  const handler = toNextJsHandler(auth.handler)
  return handler.GET(request)
}

export async function POST(request: Request) {
  const auth = await getAuthHandler()
  const handler = toNextJsHandler(auth.handler)
  return handler.POST(request)
}

