import { Args } from '@oclif/core'
import { BaseCommand } from '../../BaseCommand'
import { ValidationError } from 'yup'
import { TemplateMetadata } from '../../types/template'
import {
  getTemplateMetadata,
  validateTemplateMetadata,
} from '../../utils/template'

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

    const templateJson = await this.getTemplateMetadata(args.folder)
    await this.validateTemplateMetadata(templateJson)
  }

  private async getTemplateMetadata(folder?: string): Promise<any> {
    try {
      return await getTemplateMetadata(folder)
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        this.log(
          `🔴 Template metadata file not found at ${error.path}. Are you sure this folder contains a Starlight template?`,
        )
        this.exit(1)
      }

      this.exitWithError(
        `something went wrong while reading the template metadata file (.starlight/template.json). Check if its JSON syntax is correct and try again.`,
        error,
      )
    }
  }

  private async validateTemplateMetadata(
    templateMetadata: unknown,
  ): Promise<TemplateMetadata> {
    try {
      const data = await validateTemplateMetadata(templateMetadata)

      this.log('🟢 Template metadata (.starlight/template.json) is valid.')

      return data
    } catch (error: any) {
      if (error instanceof ValidationError) {
        this.log('🔴 Template metadata (.starlight/template.json) is invalid:')
        this.log()

        for (const validationError of error.inner) {
          this.log(`➡️ ${validationError.message}`)
        }

        this.exit(1)
      }

      this.exitWithError(
        'something went wrong while validating the template metadata.',
        error,
      )
    }
  }
}
