import { Effect } from 'effect'
import { BetterAuth } from '../services/auth/service'
import { AppLayer } from '../layers'

export async function getSession() {
  const result = await Effect.runPromise(
    Effect.gen(function* () {
      const authService = yield* BetterAuth
      return yield* authService.getSessionFromCookies()
    }).pipe(Effect.provide(AppLayer), Effect.scoped)
  )

  return result
}

