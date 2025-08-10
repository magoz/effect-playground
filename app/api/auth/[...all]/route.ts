import { Effect } from 'effect'
import { BetterAuth } from '@/lib/services/auth/service'
import { AppLayer } from '@/lib/layers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const url = new URL(request.url)
  const path = url.pathname.replace('/api/auth/', '')

  try {
    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const authService = yield* BetterAuth
        const body = yield* Effect.tryPromise(() => request.json())

        // Handle different auth endpoints
        switch (path) {
          case 'sign-up/email':
            return yield* authService.signUp(body.email, body.password, body.name)

          case 'sign-in/email':
            return yield* authService.signIn(body.email, body.password)

          case 'sign-out':
            return yield* authService.signOut(request.headers)

          default:
            return { error: 'Unknown endpoint' }
        }
      }).pipe(Effect.provide(AppLayer))
    )

    return NextResponse.json(result)
  } catch (error) {
    console.error('Auth POST error:', error)
    console.error('Error details:', error instanceof Error ? error.message : error)
    return NextResponse.json(
      {
        error: 'Authentication failed',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 400 }
    )
  }
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const path = url.pathname.replace('/api/auth/', '')

  try {
    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const authService = yield* BetterAuth

        // Handle different auth endpoints
        switch (path) {
          case 'session':
            return yield* authService.getSession(request.headers)

          default:
            return { error: 'Unknown endpoint' }
        }
      }).pipe(Effect.provide(AppLayer))
    )

    return NextResponse.json(result)
  } catch (error) {
    console.error('Auth GET error:', error)
    return NextResponse.json({ error: 'Authentication failed' }, { status: 400 })
  }
}

