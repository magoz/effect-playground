import { Effect } from 'effect'
import { DrizzleClient } from './service'

const program = Effect.gen(function* () {
  const db = yield* DrizzleClient
  const users = yield* db.query.users.findMany()
}).pipe(Effect.catchAll(error => Effect.logError(`❌ Error: ${error}`)))

program.pipe(Effect.provide(PgLive), Effect.runPromise)
