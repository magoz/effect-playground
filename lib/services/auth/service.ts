import { betterAuth } from 'better-auth'
import * as Effect from 'effect/Effect'
import { DbLive } from '../db/live-layer'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { nextCookies } from 'better-auth/next-js'
import * as schema from '../db/schema'

export class BetterAuth extends Effect.Service<BetterAuth>()('@app/BetterAuth', {
  accessors: true,
  effect: Effect.gen(function* () {
    const db = yield* DbLive

    const auth = betterAuth({
      database: drizzleAdapter(db, {
        provider: 'pg',
        schema
      }),

      plugins: [
        nextCookies() // make sure this is the last plugin in the array
      ]
    })

    const call = <A>(f: (client: typeof auth, signal: AbortSignal) => Promise<A>) =>
      Effect.tryPromise({
        try: signal => f(auth, signal),
        catch: error => new BetterAuthApiError({ error })
      })

    return {
      call,
      auth
    } as const
  })
}) {}
