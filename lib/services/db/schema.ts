import { defineConfig } from 'drizzle-kit'
import { integer, pgTable } from 'drizzle-orm/pg-core'

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts'
})

export const users = pgTable('users', {
  id: integer()
})
