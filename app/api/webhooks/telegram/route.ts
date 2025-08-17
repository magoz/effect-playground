import { TelegramConfigError } from '@/lib/services/telegram/errors'
import { HttpApp, HttpServerRequest, HttpServerResponse } from '@effect/platform'
import { Config, Context, Effect, Layer, ManagedRuntime, Redacted, Schema } from 'effect'

// https://effectbyexample.com/nextjs-api-handler

class TelegramWebhookConfig extends Context.Tag('@app/api/webhooks/telegram')<
  TelegramWebhookConfig,
  {
    readonly telegramWebhookSecretToken: Redacted.Redacted<string>
  }
>() {}

const TelegramConfigLive = Layer.effect(
  TelegramWebhookConfig,
  Effect.gen(function* () {
    const telegramWebhookSecretToken = yield* Config.redacted('TELEGRAM_WEBHOOK_SECRET_TOKEN').pipe(
      Effect.mapError(
        () => new TelegramConfigError({ message: 'TELEGRAM_WEBHOOK_SECRET_TOKEN not found' })
      )
    )
    return { telegramWebhookSecretToken }
  })
)

const managedRuntime = ManagedRuntime.make(TelegramConfigLive)
const runtime = await managedRuntime.runtime()

// everything interesting happens in this effect
// Which is of type Effect<HttpServerResponse, _, HttpServerRequest>
// it consumes the request from context anywhere
// and ultimately produces some http response
const exampleEffectHandler = Effect.gen(function* () {
  // Temporarily disable secret token validation to test
  yield* Effect.logInfo('Webhook received')

  const { message } = yield* HttpServerRequest.schemaBodyJson(
    Schema.Struct({
      update_id: Schema.Number,
      message: Schema.Struct({
        message_id: Schema.Number,
        from: Schema.Struct({
          id: Schema.Number,
          first_name: Schema.String
        }),
        chat: Schema.Struct({
          id: Schema.Number,
          title: Schema.optional(Schema.String),
          type: Schema.String
        }),
        date: Schema.Number,
        text: Schema.String
      })
    })
  )
  yield* Effect.logInfo('Message received', { 
    text: message.text, 
    from: message.from.first_name,
    chatId: message.chat.id 
  })
  
  return yield* HttpServerResponse.json({
    message: `Hello ${message.from.first_name}, you said: ${message.text}`
  })
})

const handler = HttpApp.toWebHandlerRuntime(runtime)(exampleEffectHandler)

type Handler = (req: Request) => Promise<Response>
export const POST: Handler = handler
