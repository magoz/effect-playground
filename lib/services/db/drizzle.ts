import { drizzle } from 'drizzle-orm/node-postgres'
import * as schema from './schema'

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) throw new Error('DATABASE_URL env variable not found')

export const db = drizzle(DATABASE_URL, { schema })
