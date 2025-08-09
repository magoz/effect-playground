import { Effect, Schema } from 'effect'
import { FetchHttpClient, HttpClient, HttpClientResponse } from '@effect/platform'

const User = Schema.Struct({
  id: Schema.Number,
  name: Schema.String
})

const fetchUser = Effect.fn(function* (id: number) {
  const client = yield* HttpClient.HttpClient.pipe(
    Effect.map(HttpClient.filterStatusOk) // error if non 2xx
  )

  const response = yield* client.get(`https://jsonplaceholder.typicode.com/users/${id}`)

  const user = yield* HttpClientResponse.schemaBodyJson(User)(response)
  return user
})

const program = Effect.gen(function* () {
  const user = yield* fetchUser(1)
  console.log('Fetched user:', user)
})

await program.pipe(
  // provide fetch implementation of HttpClient
  // (available on all platforms)
  Effect.provide(FetchHttpClient.layer),
  Effect.runPromise
)
