import { Effect, Layer } from 'effect'
import { BetterAuth, AuthDb } from './services/auth/service'
import { DbLive } from './services/db/live-layer'
import { PgClient } from '@effect/sql-pg'
import { Config } from 'effect'
import { NodeContext } from '@effect/platform-node'
import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import * as schema from './services/db/schema'

// Create the PgClient layer ONCE for main app (Effect SQL)
const PgLive = PgClient.layerConfig({
  url: Config.redacted('DATABASE_URL'),
  ssl: Config.succeed(true)
})

// Create a separate Drizzle database layer for better-auth
const AuthDbLive = Layer.effect(
  AuthDb,
  Effect.gen(function* () {
    // Use string config instead of redacted for neon
    const url = yield* Config.string('DATABASE_URL')
    const sql = neon(url)
    return drizzle(sql, { schema })
  })
)

// Create the complete app layer with separate database connections
export const AppLayer = Layer.provide(BetterAuth.Default, AuthDbLive)

// Keep DbLayer separate for other services that need Effect SQL
export const DbLayer = DbLive.Default.pipe(Layer.provide(PgLive), Layer.provide(NodeContext.layer))

// Memoize the layer for extra safety (though global provision should handle this)
export const MemoizedAppLayer = Layer.memoize(AppLayer).pipe(Effect.scoped)

