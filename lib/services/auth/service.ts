import * as Effect from 'effect/Effect'
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { nextCookies } from "better-auth/next-js"
import { DbLive } from '../db/live-layer'
import { BetterAuthApiError } from './errors'
import * as schema from '../db/schema'

export class BetterAuth extends Effect.Service<BetterAuth>()('@app/BetterAuth', {
  accessors: true,
  effect: Effect.gen(function* () {
    const db = yield* DbLive
    
    console.log('Initializing better-auth with database:', typeof db)
    console.log('Database methods available:', Object.keys(db))
    
    const auth = betterAuth({
      database: drizzleAdapter(db, {
        provider: "pg", 
        schema,
      }),
      emailAndPassword: {
        enabled: true,
      },
      session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days
        updateAge: 60 * 60 * 24, // 24 hours
      },
      plugins: [nextCookies()],
    })
    
    console.log('Better-auth initialized successfully')

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

    return {
      call,
      auth,
      signUp,
      signIn,
      signOut,
      getSession,
      updateUser,
      changePassword
    } as const
  })
}) {}
