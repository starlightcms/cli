import { Args, Flags, ux } from '@oclif/core'
import { input } from '@inquirer/prompts'
import got from 'got'
import { x as tarExtract } from 'tar'
import * as path from 'node:path'
import * as os from 'node:os'
import * as stream from 'node:stream/promises'
import { constants as fsConstants, createWriteStream } from 'node:fs'
import * as fs from 'node:fs/promises'
import { BaseCommand } from '../BaseCommand'
import { octokit } from '../utils/github'
import { installDependencies } from '../utils/install'
import { selectOrganization, selectWorkspace } from '../utils/admin'
import execa from 'execa'
import { validateTemplateMetadata } from '../utils/template'
import { TemplateFile, TemplateParameters } from '../types/template'
import { ValidationError } from 'yup'
import chalk from 'chalk'
import { makeParameterMap, replaceParameters } from '../utils/parameters'
import { runTemplateActions } from '../utils/actions/template'
import { getDotStarlightPath } from '../utils/fs'

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
    const { args } = await this.parse(Create)

    await this.needsAuthentication('You need to login to create a new project')

    const [projectName, projectPath] = await this.promptProjectInfo(
      args.template,
      args.projectName,
    )
    const dotStarlightPath = getDotStarlightPath(projectPath)

    if (await this.isLocalDirectory(args.template)) {
      // User wants to clone a local template
      await this.cloneLocalDirectory(args.template, projectPath)
    } else if (this.isGitRepositoryUrl(args.template)) {
      // User wants to clone a git template
      await this.cloneRepository(args.template, projectPath)
    } else {
      // User wants to clone a Web Template
      await this.checkIfWebTemplateExists(args.template)
      await this.cloneWebTemplate(args.template, projectPath)
    }

    // Install dependencies
    ux.action.start('Running npm install')
    await installDependencies(projectPath)
    ux.action.stop()

    let templateMetadata: TemplateFile | null = null
    let templateParameters: TemplateParameters | null = null

    // Setup Starlight SDK if template metadata is present and valid
    try {
      templateMetadata = await validateTemplateMetadata(dotStarlightPath)

      this.log()
      this.log('🌟 The included Starlight SDK should request content from:')

      const organization = await selectOrganization(this)
      const workspace = await selectWorkspace(this, organization)
      templateParameters = makeParameterMap(
        projectName,
        organization,
        workspace,
      )

      ux.action.start('Running template actions')
      await runTemplateActions(
        templateMetadata,
        projectPath,
        templateParameters,
        this,
      )
      ux.action.stop()
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        this.warn(
          `Template metadata file not found at ${error.path}; Starlight SDK configuration skipped.`,
        )
      } else if (error instanceof ValidationError) {
        this.warn(
          `Template metadata file (${error.path}) is invalid; Starlight SDK configuration skipped.`,
        )
        this.log(
          `Tip: use "${chalk.cyan(
            'npx @starlightcms/cli template validate',
          )}" to find structure and syntax problems in your template metadata files. Try again after fixing existing issues.`,
        )
      } else {
        this.warn(
          `Something went wrong while reading the template metadata file (${error.path}); Starlight SDK configuration skipped.`,
        )
        this.log('Tip: check if its JSON syntax is correct and try again.')
      }
    }

    await this.initializeGit(projectPath)

    // Show usage instructions
    if (
      templateMetadata &&
      templateMetadata.instructions &&
      templateParameters
    ) {
      this.log()
      this.log(
        '✅ Template cloned successfully. The template provides these instructions:',
      )
      this.log()
      this.log(
        replaceParameters(templateMetadata.instructions, templateParameters),
      )
    } else {
      this.log()
      this.log(`✅ Template cloned successfully.`)
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

  private async checkIfWebTemplateExists(template: string): Promise<void> {
    let templateFiles

    // Fetch metadata
    try {
      ux.action.start('Retrieving template metadata')
      templateFiles = await octokit.rest.repos.getContent({
        owner: 'starlightcms',
        repo: 'web-templates',
        path: `templates/${template}`,
      })
      ux.action.stop()
    } catch (error: any) {
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
  ): Promise<void> {
    // Download repository files
    const tarFile = path.join(os.tmpdir(), `sl-template-${Date.now()}`)

    try {
      ux.action.start('Downloading template tarball')
      await stream.pipeline(
        got.stream(
          'https://codeload.github.com/starlightcms/web-templates/tar.gz/main',
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
      //    the repository contents inside a folder called "<repo name>-<branch name>")
      //  - Second: the "templates" folder.
      //  - Third: the folder of the template itself (which is the value of args.template)
      // After that level, all other files are extracted normally, and are
      // placed directly in the "cwd" path we set above (respecting folder
      // structures, of course).
      strip: 3,
      // We only want to extract the files of the selected template.
      filter: (path) => {
        return path.startsWith(`web-templates-main/templates/${template}/`)
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
  ): Promise<void> {
    ux.action.start('Cloning template repository')

    try {
      await execa('git', ['clone', '--depth=1', url, projectPath])
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
