import { Effect } from 'effect'
import { redirect } from 'next/navigation'
import { DbLayer } from '@/lib/layers'
import { getUser, listUsers } from '@/lib/data/users'
import { ensureAuth } from '@/lib/services/auth/ensure-auth'

export default async function Page() {
  const session = await ensureAuth()

  const result = await Effect.runPromise(
    Effect.gen(function* () {
      const [user, allUsers] = yield* Effect.all([getUser(session.user.id), listUsers(10, 0)])
      return { user, allUsers }
    }).pipe(Effect.provide(DbLayer), Effect.scoped)
  )

  if (!result) redirect('/login')

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gray-50 flex items-center justify-center p-4 text-gray-900">
      <div className="max-w-4xl w-full space-y-6">
        <h1 className="text-3xl font-bold">Hello {result.user?.name}</h1>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">All Users ({result.allUsers.length})</h2>
          <div className="grid gap-2">
            {result.allUsers.map(u => (
              <div key={u.id} className="p-3 bg-gray-100 rounded">
                <div className="font-medium">{u.name}</div>
                <div className="text-sm text-gray-600">{u.email}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
