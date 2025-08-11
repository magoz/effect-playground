import { HttpApp, HttpServerRequest, HttpServerResponse } from '@effect/platform'
import { Effect, Layer, ManagedRuntime, Schema } from 'effect'

// https://effectbyexample.com/nextjs-api-handler

// your main layer representing all of the services your handler needs (db, auth, etc.)
const mainLive = Layer.empty

const managedRuntime = ManagedRuntime.make(mainLive)
const runtime = await managedRuntime.runtime()

// everything interesting happens in this effect
// Which is of type Effect<HttpServerResponse, _, HttpServerRequest>
// it consumes the request from context anywhere
// and ultimately produces some http response
const exampleEffectHandler = Effect.gen(function* () {
  // consumes request from context
  const { name } = yield* HttpServerRequest.schemaBodyJson(
    Schema.Struct({
      name: Schema.String
    })
  )
  return yield* HttpServerResponse.json({
    message: `Hello, ${name}`
  })
})

const handler = HttpApp.toWebHandlerRuntime(runtime)(exampleEffectHandler)

type Handler = (req: Request) => Promise<Response>
export const POST: Handler = handler
