import { Args, Flags, ux } from '@oclif/core'
import { input, select } from '@inquirer/prompts'
import got from 'got'
import { x as tarExtract } from 'tar'
import * as path from 'node:path'
import * as os from 'node:os'
import * as stream from 'node:stream/promises'
import { constants as fsConstants, createWriteStream } from 'node:fs'
import * as fs from 'node:fs/promises'
import { BaseCommand } from '../BaseCommand'
import { octokit } from '../utils/github'
import {
  createWorkspace,
  selectOrganization,
  selectWorkspace,
} from '../utils/admin'
import execa from 'execa'
import { validateTemplateMetadata } from '../utils/template'
import { TemplateFile, TemplateParameters } from '../types/template'
import { ValidationError } from 'yup'
import chalk from 'chalk'
import { makeParameterMap, replaceParameters } from '../utils/parameters'
import { runTemplateActions } from '../utils/actions/template'
import { getDotStarlightPath } from '../utils/fs'
import { Organization, Workspace } from '../types/adminApi'
import { STARLIGHT_FRONT_URL } from '../constants'
import kebabCase from 'lodash/kebabCase'
import { installDependencies } from '../utils/install'

type TemplateSetupMetadata = {
  organization: Organization
  workspace: Workspace
  templateFile: TemplateFile
  parameters: TemplateParameters
}

export default class Create extends BaseCommand {
  static summary = 'Create an application using a template.'
  static description = `This command creates a new application using an existing template by cloning
its files locally and configuring it using metadata defined in the template.
Templates can be fetched from the Web Templates repository, git repositories,
or from a local directory.

Web Templates are official Starlight web application templates, learn more at:
https://github.com/starlightcms/web-templates

Tip: Some Web Templates offer both JavaScript and TypeScript versions. You can
choose to clone a TypeScript version by passing a --typescript flag. The CLI
will warn you in case the chosen template doesn't have a TypeScript version.`

  static examples = [
    {
      description: 'Create an application using the nextjs Web Template',
      command: '<%= config.bin %> <%= command.id %> nextjs',
    },
    {
      description: 'Create an application using a git repository',
      command:
        '<%= config.bin %> <%= command.id %> https://github.com/my-org/example-template',
    },
    {
      description: 'Create an application using a local template',
      command:
        '<%= config.bin %> <%= command.id %> ~/my-company/starlight-templates/example-template',
    },
    {
      description:
        'Clone the TypeScript version of a Web Template (if available)',
      command: '<%= config.bin %> <%= command.id %> nextjs --typescript',
    },
  ]

  static flags = {
    typescript: Flags.boolean({
      description:
        'Clone the TypeScript version of a Web Template (if available)',
    }),
    branch: Flags.string({
      description:
        'Which branch to checkout when cloning Web Templates or a git repository (defaults to "main")',
      default: 'main',
    }),
  }

  static args = {
    template: Args.string({
      description:
        'Web Template name, git repository URL or local directory path',
      required: true,
    }),
    projectName: Args.string({
      description:
        'The name of the project (and directory) that will be created',
      required: false,
    }),
  }

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(Create)

    await this.needsAuthentication('You need to login to create a new project')

    const [projectName, projectPath] = await this.promptProjectInfo(
      args.template,
      args.projectName,
    )
    const dotStarlightPath = getDotStarlightPath(projectPath)

    if (await this.isLocalDirectory(args.template)) {
      // User wants to clone a local template.
      await this.cloneLocalDirectory(args.template, projectPath)
    } else if (this.isGitRepositoryUrl(args.template)) {
      // User wants to clone a git template.
      await this.cloneRepository(args.template, projectPath, flags.branch)
    } else {
      // User wants to clone a Web Template.
      await this.checkIfWebTemplateExists(
        args.template,
        flags.branch,
        flags.typescript,
      )
      await this.cloneWebTemplate(
        args.template,
        projectPath,
        flags.branch,
        flags.typescript,
      )
    }

    // Install dependencies.
    ux.action.start('Installing project dependencies')
    await installDependencies(projectPath)
    ux.action.stop()

    // Configure template and optionally run migrations.
    const metadata = await this.runTemplateActions(
      dotStarlightPath,
      projectName,
    )

    // Initialize a git repository and create an initial commit.
    await this.initializeGit(projectPath)

    // Print usage instructions to the user.
    this.printInstructions(metadata)
  }

  private printInstructions(metadata?: TemplateSetupMetadata): void {
    // Show usage instructions
    if (
      metadata &&
      metadata.templateFile &&
      metadata.templateFile.instructions &&
      metadata.parameters
    ) {
      this.log()
      this.log(
        '✅ Template cloned successfully. The template provides these instructions:',
      )
      this.log()
      this.log(
        replaceParameters(
          metadata.templateFile.instructions,
          metadata.parameters,
        ),
      )
    } else {
      this.log()
      this.log(`✅ Template cloned successfully.`)
    }

    if (metadata) {
      this.log()
      this.log(
        `Access your new application content at ${STARLIGHT_FRONT_URL}/@${metadata.organization.slug}/${metadata.workspace.slug}`,
      )
    }
  }

  private async runTemplateActions(
    dotStarlightPath: string,
    projectName: string,
  ): Promise<TemplateSetupMetadata | undefined> {
    try {
      let templateParameters: TemplateParameters | null
      let organization: Organization
      let workspace: Workspace

      const templateMetadata = await validateTemplateMetadata(dotStarlightPath)

      this.log('Configuring Starlight...')

      if (
        templateMetadata.actions?.find((action) => action.type === 'migrate')
      ) {
        const selection = await select({
          message:
            'This template includes example content. Do you want to import it into Starlight?',
          choices: [
            {
              name: 'Import template content into Starlight in a new workspace',
              value: 'import',
            },
            {
              name: 'Skip importing template content and create a blank workspace or select an existing one',
              value: 'select',
            },
          ],
        })

        if (selection === 'import') {
          organization = await selectOrganization(this)
          this.log(
            `Create a workspace in the ${organization.title} organization:`,
          )
          workspace = await createWorkspace(this, organization)

          templateParameters = makeParameterMap(
            projectName,
            organization,
            workspace,
          )

          ux.action.start('Running template actions')
          await runTemplateActions(
            templateMetadata,
            dotStarlightPath,
            templateParameters,
            this,
          )
          ux.action.stop()

          return {
            organization,
            workspace,
            templateFile: templateMetadata,
            parameters: templateParameters,
          }
        }
      }

      organization = await selectOrganization(this)
      workspace = await selectWorkspace(this, organization)
      templateParameters = makeParameterMap(
        projectName,
        organization,
        workspace,
      )

      ux.action.start('Running template actions')
      await runTemplateActions(
        templateMetadata,
        dotStarlightPath,
        templateParameters,
        this,
        // If the user chose to select or create a workspace, we should ignore
        // migrations. If there are no migration actions, this has no effect.
        true,
      )
      ux.action.stop()

      return {
        organization,
        workspace,
        templateFile: templateMetadata,
        parameters: templateParameters,
      }
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        this.warn(
          `Template metadata file not found at ${error.path}; configuration step skipped.`,
        )
      } else if (error instanceof ValidationError) {
        this.warn(
          `Template metadata file (${error.path}) is invalid; configuration step skipped.`,
        )
        this.log(
          `Tip: use "${chalk.cyan(
            'npx @starlightcms/cli@latest template validate',
          )}" to find structure and syntax problems in your template metadata files. Try again after fixing existing issues.`,
        )
      } else {
        this.warn(
          `Something went wrong while reading the template metadata file (${error.path}); configuration step skipped.`,
        )
        this.log('Tip: check if its JSON syntax is correct and try again.')
      }
    }
  }

  private async promptProjectInfo(
    templateArgument: string,
    projectNameArgument?: string,
  ): Promise<[string, string]> {
    const projectName =
      projectNameArgument ??
      (await input({
        message: 'What will your project be called?',
        default:
          (await this.isLocalDirectory(templateArgument)) ||
          this.isGitRepositoryUrl(templateArgument)
            ? 'my-project'
            : templateArgument.replace('-typescript', ''),
      }))

    const projectPath = path.resolve(projectName)

    return [projectName, projectPath]
  }

  private async checkIfWebTemplateExists(
    template: string,
    branch: string,
    typescript = false,
  ): Promise<void> {
    let templateFiles

    // Try to fetch the template folder metadata. If it works, the template exists.
    try {
      ux.action.start('Retrieving template metadata')
      templateFiles = await octokit.rest.repos.getContent({
        owner: 'starlightcms',
        repo: 'web-templates',
        path: `templates/${typescript ? `${template}-typescript` : template}`,
        ref: branch,
      })
      ux.action.stop()
    } catch (error: any) {
      if (typescript) {
        this.exitWithError(
          'something went wrong while retrieving the template. Check the template name for typos and if the given template really has a TypeScript variant.',
          error,
        )
      }

      this.exitWithError(
        'something went wrong while retrieving the template. Check the template name for typos and try again.',
        error,
      )
    }

    // Check if the template has a package.json file
    if (
      Array.isArray(templateFiles.data) &&
      !templateFiles.data.some((file) => file.name === 'package.json')
    ) {
      this.exitWithError('template is missing package.json file.')
    }
  }

  private async cloneWebTemplate(
    template: string,
    projectPath: string,
    branch: string,
    typescript = false,
  ): Promise<void> {
    // Download repository files
    const tarFile = path.join(os.tmpdir(), `sl-template-${Date.now()}`)

    try {
      ux.action.start('Downloading template tarball')
      await stream.pipeline(
        got.stream(
          `https://codeload.github.com/starlightcms/web-templates/tar.gz/${branch}`,
        ),
        createWriteStream(tarFile),
      )
      ux.action.stop()
    } catch (error: any) {
      await fs.unlink(tarFile)
      this.exitWithError(
        'something went wrong while downloading the template tarball from GitHub. Check your internet connection and try again.',
        error,
      )
    }

    // Create project folder
    try {
      await fs.mkdir(projectPath)
    } catch (error: any) {
      this.exitWithError(
        `something went wrong while creating this folder: ${projectPath}. Make sure this folder doesn't exist and that you have permission to write in ${path.resolve(
          projectPath,
          '..',
        )}.`,
        error,
      )
    }

    // Extract template files
    ux.action.start('Extracting template files')
    await tarExtract({
      file: tarFile,
      cwd: projectPath,
      // strip ignores the first N levels of files in the given tarball.
      // Since all templates live inside the "templates" folder in the
      // repository, we need to ignore 3 levels:
      //  - First: the root folder, called "web-templates-main" (GitHub places
      //    the repository contents inside a folder called
      //    "<repo name>-<branch name>")
      //  - Second: the "templates" folder.
      //  - Third: the folder of the template itself (which is the value of args.template)
      // After that level, all other files are extracted normally, and are
      // placed directly in the "cwd" path we set above (respecting folder
      // structures, of course).
      strip: 3,
      // We only want to extract the files of the selected template.
      filter: (path) => {
        return path.startsWith(
          `web-templates-${kebabCase(branch)}/templates/${
            typescript ? `${template}-typescript` : template
          }/`,
        )
      },
    })
    ux.action.stop()

    // Delete template tarball
    await fs.unlink(tarFile)
  }

  private async isLocalDirectory(string: string) {
    try {
      await fs.access(path.resolve(string), fsConstants.R_OK)
      return true
    } catch {
      return false
    }
  }

  private async cloneLocalDirectory(
    templatePath: string,
    projectPath: string,
  ): Promise<void> {
    ux.action.start('Cloning local template')

    const resolvedTemplatePath = path.resolve(templatePath)
    const ignoredPaths = new Set(
      ['node_modules', '.next', 'dist', '.env', '.env.local'].map((ignored) =>
        path.join(resolvedTemplatePath, ignored),
      ),
    )

    try {
      await fs.cp(resolvedTemplatePath, projectPath, {
        recursive: true,
        filter: (source) => !ignoredPaths.has(source),
      })
    } catch (error: any) {
      this.exitWithError(
        `something went wrong while cloning a local template. Check if you have read permissions to ${resolvedTemplatePath} and try again.`,
        error,
      )
    }

    await fs.rm(path.join(projectPath, '.git'), {
      recursive: true,
      force: true,
    })

    ux.action.stop()
  }

  private isGitRepositoryUrl(string: string) {
    return (
      string.startsWith('http://') ||
      string.startsWith('https://') ||
      string.startsWith('git@')
    )
  }

  private async cloneRepository(
    url: string,
    projectPath: string,
    branch: string,
  ): Promise<void> {
    ux.action.start('Cloning template repository')

    try {
      await execa('git', [
        'clone',
        `--branch=${branch}`,
        '--depth=1',
        url,
        projectPath,
      ])
    } catch (error: any) {
      this.exitWithError(
        'something went wrong while cloning the template repository. Check if git is installed correctly and try again.',
        error,
      )
    }

    await fs.rm(path.join(projectPath, '.git'), {
      recursive: true,
      force: true,
    })

    ux.action.stop()
  }

  private async initializeGit(projectPath: string): Promise<void> {
    ux.action.start('Creating first git commit')

    try {
      await execa('git', ['init'], { cwd: projectPath })
      await execa('git', ['add', '-A'], { cwd: projectPath })
      await execa('git', ['commit', '-m "Initial commit"'], {
        cwd: projectPath,
      })
    } catch (error: any) {
      this.exitWithError('something went wrong while running git init.', error)
    }

    ux.action.stop()
  }
}
