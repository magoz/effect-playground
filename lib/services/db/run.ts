import { Effect } from 'effect'
import { eq } from 'drizzle-orm'
import { users } from './schema'
import { DbLive } from './live-layer'

const program = Effect.gen(function* () {
  const db = yield* DbLive
  const allUsers = yield* db.query.users.findMany()
  console.log('Users:', allUsers)

  const nonExistingUser = yield* db.query.users.findFirst({
    where: eq(users.id, 999999)
  })

  console.log('Non existing user:', nonExistingUser)
}).pipe(Effect.catchAll(error => Effect.logError(`❌ Error: ${error}`)))

program.pipe(Effect.provide(DbLive.Default), Effect.runPromise)
