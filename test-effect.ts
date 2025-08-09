import { Effect, pipe, Console, Layer, Context } from 'effect'
import { EffectPrototype } from 'effect/Effectable'

// Test 1: Effect.gen with yield* - hover over the yield* to see Effect type parameters
const generatorEffect = Effect.gen(function* () {
  const value1 = yield* Effect.succeed(42) // Hover over this yield*
  const value2 = yield* Effect.succeed('hello') // Hover over this yield*
  const logged = yield* Console.log(`Values: ${value1}, ${value2}`) // Hover over this yield*

  return { value1, value2 }
})

// Test 2: Layer composition - hover over 'myLayer' to see service dependency graph
interface UserService {
  getUser: (id: string) => Effect.Effect<string, never, never>
}

interface DatabaseService {
  query: (sql: string) => Effect.Effect<string[], never, never>
}

const UserService = Context.GenericTag<UserService>('UserService')
const DatabaseService = Context.GenericTag<DatabaseService>('DatabaseService')

const databaseLayer = Layer.succeed(DatabaseService, {
  query: (sql: string) => Effect.succeed([sql])
})

const userServiceLayer = Layer.effect(
  UserService,
  Effect.gen(function* () {
    const db = yield* DatabaseService
    return {
      getUser: (id: string) =>
        pipe(
          db.query(`SELECT * FROM users WHERE id = ${id}`),
          Effect.map(rows => rows[0] || 'not found')
        )
    }
  })
)

// Hover over this to see the dependency graph
const myLayer = Layer.provide(userServiceLayer, databaseLayer)

// Test 3: Variable assignment with Layer - hover over 'fullApp' to see how services are involved
const fullApp = Effect.gen(function* () {
  const userService = yield* UserService
  const user = yield* userService.getUser('123')
  yield* Console.log(`Found user: ${user}`)
  return user
})

// Test 4: Extended Effect types - hover to see full Effect type information
const complexEffect = pipe(
  Effect.succeed(42),
  Effect.map(x => x.toString()),
  Effect.flatMap(s => Effect.succeed(s.length)),
  Effect.catchAll(() => Effect.succeed(0)),
  Effect.provide(myLayer)
)
