import { Effect, Config, Redacted, Layer } from 'effect'
import { FetchHttpClient, HttpClient, HttpClientRequest } from '@effect/platform'
import { TelegramConfig, Telegram } from './service'
import { TelegramConfigError, TelegramNetworkError } from './errors'

export const TelegramConfigLive = Layer.effect(
  TelegramConfig,
  Effect.gen(function* () {
    const botToken = yield* Config.redacted('TELEGRAM_BOT_TOKEN').pipe(
      Effect.mapError(() => new TelegramConfigError({ message: 'TELEGRAM_BOT_TOKEN not found' }))
    )
    const chatId = yield* Config.redacted('TELEGRAM_CHAT_ID').pipe(
      Effect.mapError(() => new TelegramConfigError({ message: 'TELEGRAM_CHAT_ID not found' }))
    )

    return { botToken, chatId }
  })
)

const TelegramServiceLive = Layer.effect(
  Telegram,
  Effect.gen(function* () {
    const config = yield* TelegramConfig
    const client = yield* HttpClient.HttpClient

    const sendMessage = (text: string) =>
      Effect.gen(function* () {
        const telegramBaseUrl = 'https://api.telegram.org/'
        const endpoint = telegramBaseUrl + 'bot' + Redacted.value(config.botToken) + '/sendMessage'

        const requestWithBody = yield* HttpClientRequest.bodyJson(
          HttpClientRequest.post(endpoint),
          {
            chat_id: Redacted.value(config.chatId),
            text,
            disable_web_page_preview: true
          }
        )

        const request = HttpClientRequest.setHeaders(requestWithBody, {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        })

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

        // If we get here, it was a 2xx response - success!
        // We don't need to parse or validate the JSON response
        return response
      })

    return { sendMessage }
  })
)

export const TelegramLive = TelegramServiceLive.pipe(
  Layer.provide(TelegramConfigLive),
  Layer.provide(FetchHttpClient.layer)
)
