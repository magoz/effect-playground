import { Effect } from 'effect'
import { eq } from 'drizzle-orm'
import { DbLive } from '../services/db/live-layer'
import * as schema from '../services/db/schema'

export type User = typeof schema.users.$inferSelect
export type UserInsert = typeof schema.users.$inferInsert
export type UserUpdate = Partial<Omit<UserInsert, 'id' | 'createdAt'>>

export const getUser = (id: number) =>
  Effect.gen(function* () {
    const db = yield* DbLive
    const result = yield* db.select().from(schema.users).where(eq(schema.users.id, id))
    return result[0] ?? null
  })

export const getUserByEmail = (email: string) =>
  Effect.gen(function* () {
    const db = yield* DbLive
    const result = yield* db.select().from(schema.users).where(eq(schema.users.email, email))
    return result[0] ?? null
  })

export const createUser = (data: UserInsert) =>
  Effect.gen(function* () {
    const db = yield* DbLive
    const result = yield* db.insert(schema.users).values(data).returning()
    return result[0]
  })

export const updateUser = (id: number, data: UserUpdate) =>
  Effect.gen(function* () {
    const db = yield* DbLive
    const result = yield* db
      .update(schema.users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.users.id, id))
      .returning()
    return result[0] ?? null
  })

export const deleteUser = (id: number) =>
  Effect.gen(function* () {
    const db = yield* DbLive
    yield* db.delete(schema.users).where(eq(schema.users.id, id))
    return true
  })

export const listUsers = (limit = 10, offset = 0) =>
  Effect.gen(function* () {
    const db = yield* DbLive
    return yield* db.select().from(schema.users).limit(limit).offset(offset)
  })

