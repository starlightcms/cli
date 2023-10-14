import { Args, ux } from '@oclif/core'
import { BaseCommand } from '../../BaseCommand'
import {
  TemplateValidationError,
  validateTemplateMetadata,
} from '../../utils/template'
import { getDotStarlightPath } from '../../utils/fs'

export default class Validate extends BaseCommand {
  static description = "validate a template's metadata"

  static examples = ['<%= config.bin %> <%= command.id %>']

  static args = {
    folder: Args.string({
      description: 'template folder to validade',
      required: false,
    }),
  }

  public async run(): Promise<void> {
    const { args } = await this.parse(Validate)

    const dotStarlightPath = getDotStarlightPath(args.folder)

    try {
      ux.action.start(
        `➡️ Validating template metadata (.starlight/template.json)`,
      )

      const templateFile = await validateTemplateMetadata(dotStarlightPath)

      ux.action.stop(`done.`)

      this.log(`✅ ${templateFile.name} template is valid.`)
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        this.log(
          `🔴 Template metadata file not found at ${error.path}. Are you sure this folder contains a Starlight template?`,
        )
        this.exit(1)
      } else if (error instanceof TemplateValidationError) {
        ux.action.stop('failed')

        this.log(`❌ ${error.file} is invalid:`)
        this.log()

        for (const validationError of error.validationError.inner) {
          this.log(`▶️ ${validationError.message}`)
        }

        this.exit(1)
      }

      this.exitWithError(
        `something went wrong while validating the template metadata (.starlight/template.json). Check if its JSON syntax is correct and try again.`,
        error,
      )
    }
  }
}
