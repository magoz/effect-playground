import { Effect, Layer } from 'effect'
import { BetterAuth } from '../services/auth/service'
import { DbLive } from '../services/db/live-layer'
import { PgClient } from '@effect/sql-pg'
import { Config } from 'effect'

// Create the complete layer stack
const AppLayer = BetterAuth.Default.pipe(
  Layer.provide(
    DbLive.Default.pipe(
      Layer.provide(
        PgClient.layerConfig({
          url: Config.redacted('DATABASE_URL'),
          ssl: Config.succeed(true)
        })
      )
    )
  )
)

export async function getSession() {
  try {
    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const authService = yield* BetterAuth
        return yield* authService.getSessionFromCookies()
      }).pipe(Effect.provide(AppLayer))
    )
    
    return result
  } catch (error) {
    console.error('GetSession error:', error)
    return null
  }
}