import { Effect, Layer } from 'effect'
import { BetterAuth } from './services/auth/service'
import { DbLive } from './services/db/live-layer'
import { PgClient } from '@effect/sql-pg'
import { Config } from 'effect'

// Create the complete layer stack
const AppLayer = BetterAuth.Default.pipe(
  Layer.provide(DbLive.Default.pipe(
    Layer.provide(PgClient.layerConfig({
      url: Config.redacted('DATABASE_URL'),
      ssl: Config.succeed(true)
    }))
  ))
)

// Create a cached auth instance
let authInstance: any = null

export const auth = {
  get handler() {
    if (!authInstance) {
      throw new Error('Auth not initialized. Make sure to call the auth endpoints first.')
    }
    return authInstance.handler
  },
  
  async initialize() {
    if (!authInstance) {
      authInstance = await Effect.runPromise(
        Effect.gen(function* () {
          const authService = yield* BetterAuth
          return authService.auth
        }).pipe(Effect.provide(AppLayer))
      )
    }
    return authInstance
  }
}