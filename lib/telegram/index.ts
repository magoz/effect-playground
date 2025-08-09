import { Effect, Config, Redacted } from 'effect'
import { FetchHttpClient, HttpClient, HttpClientRequest } from '@effect/platform'

const TELEGRAM_MESSAGE_MAX_LENGTH = 4096

const sendTelegramAPI = Effect.fn(function* (text: string) {
  const client = yield* HttpClient.HttpClient.pipe(
    Effect.map(HttpClient.filterStatusOk) // error if non 2xx
  )

  const TELEGRAM_BOT_TOKEN = yield* Config.redacted('TELEGRAM_BOT_TOKEN')
  const TELEGRAM_CHAT_ID = yield* Config.redacted('TELEGRAM_CHAT_ID')

  const telegramBaseUrl = 'https://api.telegram.org/'
  const endpoint = telegramBaseUrl + 'bot' + Redacted.value(TELEGRAM_BOT_TOKEN) + '/sendMessage'

  const requestWithBody = yield* HttpClientRequest.bodyJson(HttpClientRequest.post(endpoint), {
    chat_id: Redacted.value(TELEGRAM_CHAT_ID),
    text,
    disable_web_page_preview: true
  })

  const request = HttpClientRequest.setHeaders(requestWithBody, {
    Accept: 'application/json',
    'Content-Type': 'application/json'
  })

  const response = yield* client.execute(request)

  const telegramResponse = yield* response.json

  return telegramResponse
})

// const program = Effect.gen(function* () {
//   const user = yield* sendTelegram(text)
//   console.log('Fetched user:', user)
// })

// await program.pipe(
//   // provide fetch implementation of HttpClient
//   // (available on all platforms)
//   Effect.provide(FetchHttpClient.layer),
//   Effect.runPromise
// )
//
//

const splitStringIntoChunks = (str: string, chunkSize: number) => {
  // Create array of specific length with undefined elements
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
  const stringifiedJson = options?.json ? JSON.stringify(options.json, null, 2) : undefined

  const textChunks = text ? splitStringIntoChunks(text, TELEGRAM_MESSAGE_MAX_LENGTH) : null
  const jsonChunks = stringifiedJson
    ? splitStringIntoChunks(stringifiedJson, TELEGRAM_MESSAGE_MAX_LENGTH - 200) // -200 to account for the code block, and some extra margin
    : null

  const chunks = textChunks ?? jsonChunks
  if (!chunks) return

  if (chunks) {
    for (const chunk of chunks) {
      const message = options?.json
        ? `\`\`\`typescript
${chunk}
\`\`\``.trim()
        : chunk

      yield* sendTelegramAPI(message)
    }
  }
})

const program = Effect.gen(function* () {
  yield* sendTelegram('heeeelllo!!')
})

program.pipe(Effect.provide(FetchHttpClient.layer), Effect.runPromise)

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------

// const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
// if (!TELEGRAM_BOT_TOKEN) throw new Error('TELEGRAM_BOT_TOKEN env variable not found')
//
// const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID
// if (!TELEGRAM_CHAT_ID) throw new Error('TELEGRAM_CHAT_ID env variable not found')
//
// const TELEGRAM_MESSAGES_THREAD_ID = process.env.TELEGRAM_MESSAGES_THREAD_ID
// if (!TELEGRAM_MESSAGES_THREAD_ID)
//   throw new Error('TELEGRAM_MESSAGES_THREAD_ID env variable not found')
//
// const TELEGRAM_EVENTS_THREAD_ID = process.env.TELEGRAM_EVENTS_THREAD_ID
// if (!TELEGRAM_EVENTS_THREAD_ID)
//   throw new Error('TELEGRAM_MESSAGES_THREAD_ID env variable not found')
//
// const TELEGRAM_MESSAGE_MAX_LENGTH = 4096

// const sendTelegramAPI = async ({
//   message,
//   parseMode,
//   chat,
//   retry = true
// }: {
//   message: string
//   markdown?: boolean
//   parseMode?: 'MarkdownV2' | 'HTML'
//   chat: 'messages' | 'events'
//   retry?: boolean
// }) => {
//   const telegramBaseUrl = 'https://api.telegram.org/'
//   const endpoint = telegramBaseUrl + 'bot' + TELEGRAM_BOT_TOKEN + '/sendMessage'
//
//   const settings = {
//     method: 'POST',
//     headers: {
//       Accept: 'application/json',
//       'Content-Type': 'application/json'
//     },
//     body: JSON.stringify({
//       chat_id: TELEGRAM_CHAT_ID,
//       message_thread_id:
//         chat === 'messages' ? TELEGRAM_MESSAGES_THREAD_ID : TELEGRAM_EVENTS_THREAD_ID,
//       disable_web_page_preview: true,
//       text: message,
//       parse_mode: parseMode
//     })
//   }
//
//   const { error: networkError, result } = await mightFail(fetch(endpoint, settings))
//
//   if (networkError) {
//     Sentry.captureException(networkError)
//     return
//   }
//
//   if (!result.ok) {
//     const resultJson = await result.json()
//     const errorMessage = typeof resultJson === 'object' ? JSON.stringify(resultJson) : resultJson
//
//     if (retry) {
//       await sendTelegramAPI({
//         message: 'Error sending message to Telegram: ' + errorMessage.slice(0, 3000),
//         retry: false,
//         chat
//       })
//     }
//
//     Sentry.captureException(new Error(errorMessage))
//
//     return
//   }
// }

// const splitStringIntoChunks = (str: string, chunkSize: number) => {
//   // Create array of specific length with undefined elements
//   const strLength = Math.ceil(str.length / chunkSize)
//   return Array.from({ length: strLength }, (_, i) => {
//     return str.slice(i * chunkSize, i * chunkSize + chunkSize)
//   })
// }
//
// /**
//  * sendTelegram sends a message in Telegram.
//  * @param text - The message to be sent.
//  * @param options - An optional parameter that could contain:
//  *   - json - Some JSON data that will be send in a telegam message inside a code block. Optional.
//  *   - truncate - Whether to truncate or not. Optional, defaults to true.
//  */
// export const sendTelegram = async (
//   text: string,
//   options: {
//     chat: 'messages' | 'events'
//     json?: unknown
//     truncate?: boolean
//     parseMode?: 'MarkdownV2' | 'HTML'
//   }
// ) => {
//   const truncate = options.truncate ?? true
//
//   const stringifiedJson = options.json ? JSON.stringify(options.json, null, 2) : undefined
//
//   const textChunks = text ? splitStringIntoChunks(text, TELEGRAM_MESSAGE_MAX_LENGTH) : null
//   const jsonChunks = stringifiedJson
//     ? splitStringIntoChunks(stringifiedJson, TELEGRAM_MESSAGE_MAX_LENGTH - 200) // -200 to account for the code block, and some extra margin
//     : null
//
//   if (textChunks) {
//     for (const textChunk of textChunks) {
//       await sendTelegramAPI({
//         message: textChunk,
//         chat: options.chat,
//         parseMode: options?.parseMode
//       })
//     }
//   }
//
//   if (jsonChunks) {
//     for (let i = 0; i < jsonChunks.length; i++) {
//       if (truncate && i > 0) return
//       const jsonChunk = jsonChunks.at(i)
//       if (!jsonChunk) return
//
//       const hasMultipleChunks = jsonChunks.length > 1
//
//       const jsonChunkMessageTruncated =
//         `${truncate && hasMultipleChunks ? `TRUNCATED MESSAGE showing ${jsonChunk.length} of ${stringifiedJson ? stringifiedJson.length : 'many'} characters` : ''}
// \`\`\`typescript
// ${jsonChunk}
// \`\`\``.trim()
//
//       await sendTelegramAPI({
//         message: jsonChunkMessageTruncated,
//         chat: options.chat,
//         parseMode: 'MarkdownV2'
//       })
//     }
//   }
// }
