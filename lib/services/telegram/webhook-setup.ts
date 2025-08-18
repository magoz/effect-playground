import { HttpClientRequest, HttpClient } from '@effect/platform'
import { NodeHttpClient } from '@effect/platform-node'
import { Redacted, Effect, Config } from 'effect'
import { TelegramConfigError, TelegramNetworkError } from './errors'

export const setupTelegramWebhooks = Effect.fn(function* () {
  const TELEGRAM_BOT_TOKEN = yield* Config.redacted('TELEGRAM_BOT_TOKEN').pipe(
    Effect.mapError(() => new TelegramConfigError({ message: 'TELEGRAM_BOT_TOKEN not found' }))
  )

  const TELEGRAM_WEBHOOK_SECRET_TOKEN = yield* Config.redacted(
    'TELEGRAM_WEBHOOK_SECRET_TOKEN'
  ).pipe(
    Effect.mapError(
      () => new TelegramConfigError({ message: 'TELEGRAM_WEBHOOK_SECRET_TOKEN not found' })
    )
  )

  const TELEGRAM_WEBHOOK_URL = yield* Config.redacted('TELEGRAM_WEBHOOK_URL').pipe(
    Effect.mapError(() => new TelegramConfigError({ message: 'TELEGRAM_WEBHOOK_URL not found' }))
  )

  const telegramBaseUrl = 'https://api.telegram.org/'
  const endpoint = telegramBaseUrl + 'bot' + Redacted.value(TELEGRAM_BOT_TOKEN) + '/setWebhook'

  const requestWithBody = yield* HttpClientRequest.bodyJson(HttpClientRequest.post(endpoint), {
    url: Redacted.value(TELEGRAM_WEBHOOK_URL),
    secret_token: Redacted.value(TELEGRAM_WEBHOOK_SECRET_TOKEN)
  })

  const request = HttpClientRequest.setHeaders(requestWithBody, {
    Accept: 'application/json',
    'Content-Type': 'application/json'
  })

  const client = yield* HttpClient.HttpClient
  const response = yield* client.execute(request).pipe(
    Effect.catchAll(error => {
      if (error._tag === 'ResponseError') {
        return Effect.fail(
          new TelegramNetworkError({
            message: `HTTP ${error.response.status}: ${error.reason}`,
            statusCode: error.response.status
          })
        )
      }
      return Effect.fail(
        new TelegramNetworkError({
          message: 'Network error occurred',
          response: error
        })
      )
    })
  )

  const responseBody = yield* response.json
  yield* Effect.logInfo('Telegram webhook setup successful', { response: responseBody })

  return response
})

Effect.runPromise(setupTelegramWebhooks().pipe(Effect.provide(NodeHttpClient.layer)))
