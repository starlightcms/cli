import { Command, ux } from '@oclif/core'

export abstract class BaseCommand extends Command {
  public exitWithError(
    message?: string,
    originalError?: Error,
    exitCode = 1,
  ): never {
    // Stop any running spinners.
    ux.action.stop('failed')

    this.log(`🛑 Error: ${message ?? 'an unknown error occurred.'}`)

    if (originalError) {
      this.log('⚠️ Original error message:')
      this.error(originalError ?? '', { exit: exitCode })
    }

    this.exit(exitCode)
  }
}
