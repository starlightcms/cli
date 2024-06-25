import { Args } from '@oclif/core'
import { BaseCommand } from '../../BaseCommand'
import {
  TemplateValidationError,
  validateTemplateMetadata,
} from '../../utils/template'
import { getDotStarlightPath, getJsonFromFile } from '../../utils/fs'
import { MigrateAction, TemplateFile } from '../../types/template'
import chalk from 'chalk'
import { promptAndCreateWorkspace, selectOrganization } from '../../utils/admin'
import { SchemaFile } from '../../types/schema'
import { runSchemaActions } from '../../utils/actions/schema'
import path from 'node:path'
import { makeParameterMap } from '../../utils/parameters'
import { HTTPError } from 'got'
import type { FormData } from 'formdata-node'
import { STARLIGHT_FRONT_URL } from '../../constants'

export default class Import extends BaseCommand {
  static description = "import a template's schema and content into Starlight"

  static examples = ['<%= config.bin %> <%= command.id %>']

  static args = {
    folder: Args.string({
      description: 'template folder',
      required: false,
    }),
  }

  public async run(): Promise<void> {
    const { args } = await this.parse(Import)

    await this.needsAuthentication(
      'You need to login to import data into Starlight',
    )

    const dotStarlightPath = getDotStarlightPath(args.folder)
    let templateFile: TemplateFile

    try {
      templateFile = await validateTemplateMetadata(dotStarlightPath)
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        this.log(
          `🔴 Template metadata file not found at ${error.path}. Are you sure this folder contains a Starlight template?`,
        )
        this.exit(1)
      } else if (error instanceof TemplateValidationError) {
        this.log(`❌ ${error.file} is invalid, import aborted.`)
        this.log(
          `\nTip: use "${chalk.cyan(
            `npx @starlightcms/cli template validate${
              args.folder ? ` ${args.folder}` : ''
            }`,
          )}" to find structure and syntax problems in your template metadata files. Try again after fixing existing issues.`,
        )
        this.exit(1)
      }

      this.exitWithError(
        `something went wrong while validating the template metadata (.starlight/template.json). Check if its JSON syntax is correct and try again.`,
        error,
      )
    }

    const migrateAction = templateFile.actions?.find(
      (action): action is MigrateAction => action.type === 'migrate',
    )

    if (!migrateAction) {
      this.log(
        `⚠️ The ${templateFile.name} template has nothing to migrate: no "migrate" action found in the template metadata.`,
      )
      this.exit()
    }

    const organization = await selectOrganization(this)
    const workspace = await promptAndCreateWorkspace(this, organization)
    const parameters = makeParameterMap(
      organization.title,
      organization,
      workspace,
    )
    const [schemaFile, schemaFilePath] = await getJsonFromFile<SchemaFile>(
      dotStarlightPath,
      migrateAction.file,
    )

    try {
      await runSchemaActions(
        schemaFile,
        path.dirname(schemaFilePath),
        parameters,
        this,
      )
    } catch (error: any) {
      if (error instanceof HTTPError) {
        this.log(
          `⚠️ The API responded with code ${error.response.statusCode} (${error.response.statusMessage}).`,
        )
        this.log(
          `⚠️ Request was a ${error.options.method} to URL: ${error.request.requestUrl}`,
        )

        this.log(
          `⚠️ Request body: ${JSON.stringify(
            error.options.json ??
              (error.options.form &&
                Object.fromEntries(error.options.form as FormData)),
            null,
            2,
          )}`,
        )

        this.log(
          `⚠️ API response: ${JSON.stringify(
            JSON.parse(error.response.body as string),
            null,
            2,
          )}`,
        )
      }

      this.exitWithError(
        `something went wrong while applying migrations from the ${templateFile.name} template.`,
        error,
      )
    }

    this.log()
    this.log(
      `✅ ${templateFile.name} migrations applied successfully to the ${workspace.title} workspace.`,
    )
    this.log(
      `Access the new content at ${STARLIGHT_FRONT_URL}/@${organization.slug}/${workspace.slug}`,
    )
    this.log(
      `To use this workspace with a Starlight SDK, use the following workspace ID: ${workspace.id}`,
    )
  }
}
