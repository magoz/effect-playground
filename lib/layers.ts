import { Effect, Layer } from 'effect'
import { BetterAuth } from './services/auth/service'
import { DbLive } from './services/db/live-layer'
import { PgClient } from '@effect/sql-pg'
import { Config } from 'effect'

// Create the PgClient layer ONCE and reuse it
const PgLive = PgClient.layerConfig({
  url: Config.redacted('DATABASE_URL'),
  ssl: Config.succeed(true)
})

// Create the complete app layer ONCE and reuse it
export const AppLayer = BetterAuth.Default.pipe(
  Layer.provide(
    DbLive.Default.pipe(
      Layer.provide(PgLive)
    )
  )
)

// Memoize the layer for extra safety (though global provision should handle this)
export const MemoizedAppLayer = Layer.memoize(AppLayer).pipe(
  Effect.scoped
)