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

const TelegramWebhookConfigLive = Layer.effect(
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

const managedRuntime = ManagedRuntime.make(TelegramWebhookConfigLive)
const runtime = await managedRuntime.runtime()

const effectHandler = Effect.gen(function* () {
  const headers = yield* HttpServerRequest.schemaHeaders(
    Schema.Struct({
      'x-telegram-bot-api-secret-token': Schema.String
    })
  )

  const { telegramWebhookSecretToken } = yield* TelegramWebhookConfig

  if (headers['x-telegram-bot-api-secret-token'] !== Redacted.value(telegramWebhookSecretToken)) {
    yield* Effect.logWarning('Invalid secret token')
    return yield* HttpServerResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

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

  return yield* HttpServerResponse.json({ status: 'ok' })
})

const handler = HttpApp.toWebHandlerRuntime(runtime)(effectHandler)

type Handler = (req: Request) => Promise<Response>
export const POST: Handler = handler
