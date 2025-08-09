import { Effect, Context, Redacted } from 'effect'
import { HttpClientResponse, HttpBody } from '@effect/platform'
import { TelegramNetworkError } from './errors'

export class TelegramConfig extends Context.Tag('TelegramConfig')<
  TelegramConfig,
  {
    readonly botToken: Redacted.Redacted<string>
    readonly chatId: Redacted.Redacted<string>
  }
>() {}

export class Telegram extends Context.Tag('Telegram')<
  Telegram,
  {
    readonly sendMessage: (
      text: string
    ) => Effect.Effect<
      HttpClientResponse.HttpClientResponse,
      TelegramNetworkError | HttpBody.HttpBodyError,
      never
    >
  }
>() {}

const splitStringIntoChunks = (str: string, chunkSize: number) => {
  const strLength = Math.ceil(str.length / chunkSize)
  return Array.from({ length: strLength }, (_, i) => {
    return str.slice(i * chunkSize, i * chunkSize + chunkSize)
  })
}

export const sendTelegram = Effect.fn(function* (
  text: string,
  options?: {
    json?: unknown
  }
) {
  const telegram = yield* Telegram
  const stringifiedJson = options?.json ? JSON.stringify(options.json, null, 2) : undefined

  const TELEGRAM_MESSAGE_MAX_LENGTH = 4096

  const chunks = stringifiedJson
    ? splitStringIntoChunks(stringifiedJson, TELEGRAM_MESSAGE_MAX_LENGTH - 200) // -200 for code block margin
    : splitStringIntoChunks(text, TELEGRAM_MESSAGE_MAX_LENGTH)

  yield* Effect.logInfo(`Sending ${chunks.length} message chunks to Telegram`)

  for (const chunk of chunks) {
    const message = options?.json
      ? `\`\`\`typescript
${chunk}
\`\`\``.trim()
      : chunk

    yield* telegram.sendMessage(message)
  }

  yield* Effect.logInfo('All Telegram messages sent successfully')
})

