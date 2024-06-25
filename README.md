oclif-hello-world
=================

oclif example Hello World CLI

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![CircleCI](https://circleci.com/gh/oclif/hello-world/tree/main.svg?style=shield)](https://circleci.com/gh/oclif/hello-world/tree/main)
[![GitHub license](https://img.shields.io/github/license/oclif/hello-world)](https://github.com/oclif/hello-world/blob/main/LICENSE)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g @starlightcms/cli
$ starlight COMMAND
running command...
$ starlight (--version)
@starlightcms/cli/0.6.0 darwin-arm64 node-v16.16.0
$ starlight --help [COMMAND]
USAGE
  $ starlight COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`starlight create TEMPLATE [PROJECTNAME]`](#starlight-create-template-projectname)
* [`starlight help [COMMANDS]`](#starlight-help-commands)
* [`starlight login`](#starlight-login)
* [`starlight logout`](#starlight-logout)
* [`starlight plugins`](#starlight-plugins)
* [`starlight plugins:install PLUGIN...`](#starlight-pluginsinstall-plugin)
* [`starlight plugins:inspect PLUGIN...`](#starlight-pluginsinspect-plugin)
* [`starlight plugins:install PLUGIN...`](#starlight-pluginsinstall-plugin-1)
* [`starlight plugins:link PLUGIN`](#starlight-pluginslink-plugin)
* [`starlight plugins:uninstall PLUGIN...`](#starlight-pluginsuninstall-plugin)
* [`starlight plugins:uninstall PLUGIN...`](#starlight-pluginsuninstall-plugin-1)
* [`starlight plugins:uninstall PLUGIN...`](#starlight-pluginsuninstall-plugin-2)
* [`starlight plugins update`](#starlight-plugins-update)
* [`starlight template import [FOLDER]`](#starlight-template-import-folder)
* [`starlight template validate [FOLDER]`](#starlight-template-validate-folder)

## `starlight create TEMPLATE [PROJECTNAME]`

Create an application using a template.

```
USAGE
  $ starlight create TEMPLATE [PROJECTNAME] [--typescript] [--branch <value>] [--email <value> --password
    <value>] [--organization <value> --workspace-name <value> --workspace-slug <value>]

ARGUMENTS
  TEMPLATE     Web Template name, git repository URL or local directory path
  PROJECTNAME  The name of the project (and directory) that will be created

FLAGS
  --branch=<value>          [default: main] Which branch to checkout when cloning Web Templates or a git repository
                            (defaults to "main")
  --email=<value>           E-mail address used to log in. If passed, the --password flag is required.
  --organization=<value>    An organization slug to use when importing content.
  --password=<value>        Password used to log in. If passed, the --email flag is required.
  --typescript              Clone the TypeScript version of a Web Template (if available)
  --workspace-name=<value>  The name of the workspace that should be created when importing content. If passed, the
                            --organization and --workspace-slug flags are required.
  --workspace-slug=<value>  The slug of the workspace that should be created when importing content. If passed, the
                            --organization and --workspace-name flags are required.

DESCRIPTION
  Create an application using a template.

  This command creates a new application using an existing template by cloning
  its files locally and configuring it using metadata defined in the template.
  Templates can be fetched from the Web Templates repository, git repositories,
  or from a local directory.

  Web Templates are official Starlight web application templates, learn more at:
  https://github.com/starlightcms/web-templates

  Tip: Some Web Templates offer both JavaScript and TypeScript versions. You can
  choose to clone a TypeScript version by passing a --typescript flag. The CLI
  will warn you in case the chosen template doesn't have a TypeScript version.

EXAMPLES
  Create an application using the nextjs Web Template

    $ starlight create nextjs

  Create an application using a git repository

    $ starlight create https://github.com/my-org/example-template

  Create an application using a local template

    $ starlight create ~/my-company/starlight-templates/example-template

  Clone the TypeScript version of a Web Template (if available)

    $ starlight create nextjs --typescript
```

_See code: [dist/commands/create.ts](https://github.com/starlightcms/cli/blob/v0.6.0/dist/commands/create.ts)_

## `starlight help [COMMANDS]`

Display help for starlight.

```
USAGE
  $ starlight help [COMMANDS] [-n]

ARGUMENTS
  COMMANDS  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for starlight.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v5.2.16/src/commands/help.ts)_

## `starlight login`

Log in with your Starlight account

```
USAGE
  $ starlight login

DESCRIPTION
  Log in with your Starlight account

EXAMPLES
  $ starlight login
```

_See code: [dist/commands/login.ts](https://github.com/starlightcms/cli/blob/v0.6.0/dist/commands/login.ts)_

## `starlight logout`

Log out from your Starlight account

```
USAGE
  $ starlight logout

DESCRIPTION
  Log out from your Starlight account

EXAMPLES
  $ starlight logout
```

_See code: [dist/commands/logout.ts](https://github.com/starlightcms/cli/blob/v0.6.0/dist/commands/logout.ts)_

## `starlight plugins`

List installed plugins.

```
USAGE
  $ starlight plugins [--json] [--core]

FLAGS
  --core  Show core plugins.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  List installed plugins.

EXAMPLES
  $ starlight plugins
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v3.2.0/src/commands/plugins/index.ts)_

## `starlight plugins:install PLUGIN...`

Installs a plugin into the CLI.

```
USAGE
  $ starlight plugins:install PLUGIN...

ARGUMENTS
  PLUGIN  Plugin to install.

FLAGS
  -f, --force    Run yarn install with force flag.
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Installs a plugin into the CLI.
  Can be installed from npm or a git url.

  Installation of a user-installed plugin will override a core plugin.

  e.g. If you have a core plugin that has a 'hello' command, installing a user-installed plugin with a 'hello' command
  will override the core plugin implementation. This is useful if a user needs to update core plugin functionality in
  the CLI without the need to patch and update the whole CLI.


ALIASES
  $ starlight plugins add

EXAMPLES
  $ starlight plugins:install myplugin 

  $ starlight plugins:install https://github.com/someuser/someplugin

  $ starlight plugins:install someuser/someplugin
```

## `starlight plugins:inspect PLUGIN...`

Displays installation properties of a plugin.

```
USAGE
  $ starlight plugins:inspect PLUGIN...

ARGUMENTS
  PLUGIN  [default: .] Plugin to inspect.

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Displays installation properties of a plugin.

EXAMPLES
  $ starlight plugins:inspect myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v3.2.0/src/commands/plugins/inspect.ts)_

## `starlight plugins:install PLUGIN...`

Installs a plugin into the CLI.

```
USAGE
  $ starlight plugins:install PLUGIN...

ARGUMENTS
  PLUGIN  Plugin to install.

FLAGS
  -f, --force    Run yarn install with force flag.
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Installs a plugin into the CLI.
  Can be installed from npm or a git url.

  Installation of a user-installed plugin will override a core plugin.

  e.g. If you have a core plugin that has a 'hello' command, installing a user-installed plugin with a 'hello' command
  will override the core plugin implementation. This is useful if a user needs to update core plugin functionality in
  the CLI without the need to patch and update the whole CLI.


ALIASES
  $ starlight plugins add

EXAMPLES
  $ starlight plugins:install myplugin 

  $ starlight plugins:install https://github.com/someuser/someplugin

  $ starlight plugins:install someuser/someplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v3.2.0/src/commands/plugins/install.ts)_

## `starlight plugins:link PLUGIN`

Links a plugin into the CLI for development.

```
USAGE
  $ starlight plugins:link PLUGIN

ARGUMENTS
  PATH  [default: .] path to plugin

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Links a plugin into the CLI for development.
  Installation of a linked plugin will override a user-installed or core plugin.

  e.g. If you have a user-installed or core plugin that has a 'hello' command, installing a linked plugin with a 'hello'
  command will override the user-installed or core plugin implementation. This is useful for development work.


EXAMPLES
  $ starlight plugins:link myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v3.2.0/src/commands/plugins/link.ts)_

## `starlight plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ starlight plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ starlight plugins unlink
  $ starlight plugins remove
```

## `starlight plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ starlight plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ starlight plugins unlink
  $ starlight plugins remove
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v3.2.0/src/commands/plugins/uninstall.ts)_

## `starlight plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ starlight plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ starlight plugins unlink
  $ starlight plugins remove
```

## `starlight plugins update`

Update installed plugins.

```
USAGE
  $ starlight plugins update [-h] [-v]

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Update installed plugins.
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v3.2.0/src/commands/plugins/update.ts)_

## `starlight template import [FOLDER]`

import a template's schema and content into Starlight

```
USAGE
  $ starlight template import [FOLDER]

ARGUMENTS
  FOLDER  template folder

DESCRIPTION
  import a template's schema and content into Starlight

EXAMPLES
  $ starlight template import
```

_See code: [dist/commands/template/import.ts](https://github.com/starlightcms/cli/blob/v0.6.0/dist/commands/template/import.ts)_

## `starlight template validate [FOLDER]`

validate a template's metadata

```
USAGE
  $ starlight template validate [FOLDER]

ARGUMENTS
  FOLDER  template folder to validade

DESCRIPTION
  validate a template's metadata

EXAMPLES
  $ starlight template validate
```

_See code: [dist/commands/template/validate.ts](https://github.com/starlightcms/cli/blob/v0.6.0/dist/commands/template/validate.ts)_
<!-- commandsstop -->
