import { Effect } from 'effect'
import { DrizzleClient } from './service'
import { eq } from 'drizzle-orm'
import { users } from './schema'

const program = Effect.gen(function* () {
  const db = yield* DrizzleClient
  const allUsers = yield* db.query.users.findMany()
  console.log('Users:', allUsers)

  const nonExistingUser = yield* db.query.users.findFirst({
    where: eq(users.id, 999999)
  })

  console.log('Non existing user:', nonExistingUser)
}).pipe(Effect.catchAll(error => Effect.logError(`❌ Error: ${error}`)))

program.pipe(Effect.provide(DrizzleClient.Default), Effect.runPromise)
