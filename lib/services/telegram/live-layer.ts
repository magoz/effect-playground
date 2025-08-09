import { Effect, Config, Redacted, Layer } from 'effect'
import { FetchHttpClient, HttpClient, HttpClientRequest } from '@effect/platform'
import { TelegramConfig, Telegram } from './service'
import { TelegramConfigError, TelegramNetworkError, TelegramAPIError } from './errors'

// Live implementation: Layer to create TelegramConfig from environment
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

// Live implementation: Telegram service that connects to real Telegram API
export const TelegramServiceLive = Layer.effect(
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

        const telegramResponse = yield* response.json.pipe(
          Effect.catchAll(error =>
            Effect.fail(
              new TelegramAPIError({
                message: 'Failed to parse Telegram API response'
              })
            )
          )
        )

        // Check if Telegram API returned an error
        if (
          telegramResponse &&
          typeof telegramResponse === 'object' &&
          'ok' in telegramResponse &&
          !telegramResponse.ok
        ) {
          const apiResponse = telegramResponse as {
            ok: boolean
            error_code?: number
            description?: string
          }
          yield* new TelegramAPIError({
            message: 'Telegram API returned error',
            errorCode: apiResponse.error_code || 0,
            description: apiResponse.description || 'Unknown error'
          })
        }

        return telegramResponse
      })

    return { sendMessage }
  })
)

// Complete live layer with all dependencies
export const TelegramLive = TelegramServiceLive.pipe(
  Layer.provide(TelegramConfigLive),
  Layer.provide(FetchHttpClient.layer)
)

