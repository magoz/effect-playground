import { Effect } from 'effect'
import { BetterAuth } from './service'

export async function getSession() {
  return Effect.flatMap(BetterAuth, authService => authService.getSessionFromCookies())
}
