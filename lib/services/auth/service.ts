import * as Effect from 'effect/Effect'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { nextCookies } from 'better-auth/next-js'
import { BetterAuthApiError } from './errors'
import * as schema from '../db/schema'
import { Context } from 'effect'

// Create a separate Drizzle database tag for better-auth
export class AuthDb extends Context.Tag('@app/AuthDb')<AuthDb, any>() {}

export class BetterAuth extends Effect.Service<BetterAuth>()('@app/BetterAuth', {
  accessors: true,
  effect: Effect.gen(function* () {
    // Get the separate Drizzle database instance for auth
    const authDb = yield* AuthDb

    const auth = betterAuth({
      baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      database: drizzleAdapter(authDb, {
        provider: 'pg',
        schema
      }),
      emailAndPassword: {
        enabled: true
      },
      session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days
        updateAge: 60 * 60 * 24 // 24 hours
      },
      plugins: [nextCookies()]
    })

    const call = <A>(f: (client: typeof auth, signal: AbortSignal) => Promise<A>) =>
      Effect.tryPromise({
        try: signal => f(auth, signal),
        catch: error => {
          console.error('Better-auth API error:', error)
          console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
          console.error('Error details:', JSON.stringify(error, null, 2))
          return new BetterAuthApiError({ error })
        }
      })

    const signUp = (email: string, password: string, name: string) =>
      call(auth => auth.api.signUpEmail({ body: { email, password, name } }))

    const signIn = (email: string, password: string) =>
      call(auth => auth.api.signInEmail({ body: { email, password } }))

    const signOut = (headers: Headers = new Headers()) =>
      call(auth => auth.api.signOut({ headers }))

    const getSession = (headers: Headers = new Headers()) =>
      call(auth => auth.api.getSession({ headers }))

    const updateUser = (data: { name?: string; email?: string }) =>
      call(auth => auth.api.updateUser({ body: data }))

    const changePassword = (currentPassword: string, newPassword: string) =>
      call(auth =>
        auth.api.changePassword({
          body: { currentPassword, newPassword }
        })
      )

    // Server-side helper that automatically gets cookies from Next.js
    const getSessionFromCookies = () =>
      Effect.gen(function* () {
        // Import cookies dynamically to avoid issues in client-side code
        const { cookies } = yield* Effect.tryPromise(() => import('next/headers'))
        const cookieStore = yield* Effect.tryPromise(() => cookies())

        // Create Headers object from cookies
        const headers = new Headers()
        cookieStore.getAll().forEach((cookie: { name: string; value: string }) => {
          headers.append('cookie', `${cookie.name}=${cookie.value}`)
        })

        return yield* getSession(headers)
      })

    return {
      call,
      auth,
      signUp,
      signIn,
      signOut,
      getSession,
      getSessionFromCookies,
      updateUser,
      changePassword
    } as const
  })
}) {}
