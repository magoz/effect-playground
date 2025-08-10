import { Effect, Console, Exit } from 'effect'
import { DbLive } from '../services/db/live-layer'
import * as Users from './users'

// Example 1: Basic error handling
const basicExample = Effect.gen(function* () {
  console.log('=== Basic Error Handling ===')

  // This will handle all errors (database connection, SQL errors, etc.)
  const user = yield* Users.getUser('1').pipe(
    Effect.catchAll(error => {
      console.error('Failed to get user:', error)
      return Effect.succeed(null) // Return null on error
    })
  )

  console.log('User result:', user)
})

// Example 2: Different error handling strategies
const advancedExample = Effect.gen(function* () {
  console.log('=== Advanced Error Handling ===')

  // Create user with retry logic
  const createResult = yield* Users.createUser({
    id: '1',
    name: 'John Doe',
    email: 'john@example.com'
  }).pipe(
    Effect.retry({ times: 3 }), // Retry 3 times on failure
    Effect.catchAll(error => {
      console.error('Failed to create user after retries:', error)
      return Effect.fail('USER_CREATION_FAILED')
    })
  )

  console.log('Created user:', createResult)

  // Handle specific scenarios
  const user = yield* Users.getUser('999999').pipe(
    Effect.catchAll(error => {
      console.log('User not found, returning default')
      return Effect.succeed({
        id: 0,
        name: 'Guest',
        email: 'guest@example.com',
        createdAt: new Date(),
        updatedAt: new Date()
      })
    })
  )

  console.log('User or default:', user)
})

// Example 3: Graceful program-level error handling
const program = Effect.gen(function* () {
  yield* basicExample
  yield* advancedExample
}).pipe(
  Effect.catchAll(error =>
    Console.error(`❌ Program failed: ${error}`).pipe(
      Effect.as(Exit.void) // Convert to successful exit
    )
  )
)

// Run with proper error handling
program.pipe(Effect.provide(DbLive.Default), Effect.runPromise).catch(console.error)
