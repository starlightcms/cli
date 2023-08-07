import { Args, Command, Flags, ux } from '@oclif/core'
import { input } from '@inquirer/prompts'
import got from 'got'
import { x as tarExtract } from 'tar'
import { Octokit } from 'octokit'
import * as path from 'node:path'
import * as os from 'node:os'
import * as stream from 'node:stream/promises'
import { createWriteStream } from 'node:fs'
import * as fs from 'node:fs/promises'
import { installDependencies } from '../utils/install'

const octokit = new Octokit()

export default class Create extends Command {
  static summary = 'Create an application using a template.'
  static description = `This command creates a new application using an existing template by cloning
the template repository locally and configuring a Starlight SDK client using
environment variables. Templates can be either a Web Template name or a git
repository URL (starting with https:// or git://).

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
      description:
        'Clone the TypeScript version of the template (if available)',
      command: '<%= config.bin %> <%= command.id %> nextjs --typescript',
    },
  ]

  static flags = {
    typescript: Flags.boolean({
      description: 'Clone the TypeScript version (if available)',
    }),
  }

  static args = {
    template: Args.string({
      description: 'Web Template name or git repository URL',
      required: true,
    }),
    projectName: Args.string({
      description: 'The name of the project (and folder) that will be created',
      required: false,
    }),
  }

  public async run(): Promise<void> {
    const { args } = await this.parse(Create)

    const projectName =
      args.projectName ??
      (await input({
        message: 'What will your project be called?',
        default: args.template?.replace('-typescript', '') ?? 'example-app',
      }))

    let templateFiles

    // Fetch metadata
    try {
      ux.action.start('Retrieving template metadata')
      templateFiles = await octokit.rest.repos.getContent({
        owner: 'starlightcms',
        repo: 'web-templates',
        path: `templates/${args.template}`,
      })
      ux.action.stop()
    } catch {
      this.error(
        'something went wrong while retrieving the template. Check the template name for typos and try again.',
        { exit: 1 },
      )
    }

    // Check if the template has a package.json file
    if (
      Array.isArray(templateFiles.data) &&
      !templateFiles.data.some((file) => file.name === 'package.json')
    ) {
      this.error('template is missing package.json file.', {
        exit: 1,
      })
    }

    // Download repository files
    const tarFile = path.join(os.tmpdir(), `sl-template-${Date.now()}`)

    try {
      ux.action.start('Downloading template tarball')
      await stream.pipeline(
        got.stream(
          `https://codeload.github.com/starlightcms/web-templates/tar.gz/main`,
        ),
        createWriteStream(tarFile),
      )
      ux.action.stop()
    } catch {
      await fs.unlink(tarFile)
      this.error(
        'something went wrong while downloading the template tarball from GitHub. Check your internet connection and try again.',
        { exit: 1 },
      )
    }

    // Create project folder
    const projectFolder = path.resolve(projectName)

    try {
      await fs.mkdir(projectFolder)
    } catch {
      this.error(
        `something went wrong while creating this folder: ${projectFolder}. Make sure this folder doesn't exist and that you have permission to write in ${path.resolve(
          projectFolder,
          '..',
        )}.`,
        { exit: 1 },
      )
    }

    ux.action.start('Extracting template files')
    await tarExtract({
      file: tarFile,
      cwd: projectFolder,
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
        return path.startsWith(`web-templates-main/templates/${args.template}`)
      },
    })
    ux.action.stop()

    // Delete template tarball
    await fs.unlink(tarFile)

    // Install dependencies
    ux.action.start('Running npm install')
    await installDependencies(projectFolder)
    ux.action.stop()

    // Setup .env
    // try {
    //   let envContents = await fs.readFile(
    //     path.join(projectFolder, '.env.example'),
    //     { encoding: 'utf8' },
    //   )
    //
    //   envContents = envContents.replace('NEXT_PUBLIC_STARLIGHT_WORKSPACE=replace_me', 'NEXT_PUBLIC_STARLIGHT_WORKSPACE=replace_me')
    //
    //   this.log(envContents)
    //   // por enquanto, só precisa copiar .env.example direto e dar replace
    // } catch {
    //   this.warn('.env.example file not found, skipping Starlight SDK setup.')
    // }

    // Show usage instructions
    this.log('')
    this.log(`✅  ${args.template} template cloned successfully.`)
    this.log(
      'To start working, enter its folder and run the development server:',
    )
    this.log('')
    this.log(`$ cd ${projectName}`)
    this.log('$ npm run dev')
  }
}
