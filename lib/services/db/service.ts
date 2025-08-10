import * as PgDrizzle from '@effect/sql-drizzle/Pg'
import { PgClient } from '@effect/sql-pg'
import { Config, Effect } from 'effect'
import * as schema from './schema'

const PgLive = PgClient.layerConfig({
  url: Config.redacted('DATABASE_URL'),
  ssl: Config.succeed(true)
})

export class DrizzleClient extends Effect.Service<DrizzleClient>()('@app/DrizzleClient', {
  dependencies: [PgLive],
  effect: Effect.gen(function* () {
    const db = yield* PgDrizzle.make<typeof schema>({
      schema: schema
    })
    return db
  })
}) {}
