import { Data } from 'effect'

export class TelegramConfigError extends Data.TaggedError('TelegramConfigError')<{
  message: string
}> {}

export class TelegramNetworkError extends Data.TaggedError('TelegramNetworkError')<{
  message: string
  statusCode?: number
  response?: unknown
}> {}

export class TelegramAPIError extends Data.TaggedError('TelegramAPIError')<{
  message: string
  errorCode?: number
  description?: string
}> {}

