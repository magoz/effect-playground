import { Effect } from 'effect'
import { sendTelegram } from './services/telegram/service'
import { TelegramLive } from './services/telegram/live-layer'

// Test program using the service
const program = Effect.gen(function* () {
  yield* sendTelegram('Hello from Refactored Effect Services! 🚀')
  
  yield* sendTelegram('Debug data:', { 
    json: { 
      timestamp: new Date().toISOString(),
      version: '3.0',
      architecture: 'domain-organized',
      fileNaming: 'kebab-case'
    } 
  })
}).pipe(
  Effect.catchAll((error) => Effect.logError(`❌ Error: ${error}`))
)

// Run the application
program.pipe(Effect.provide(TelegramLive), Effect.runPromise)