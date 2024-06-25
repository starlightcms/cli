import got, { HTTPError } from 'got'
import { APIResourceResponse, Organization, Workspace } from '../types/adminApi'
import { BaseCommand } from '../BaseCommand'
import { input, select, Separator } from '@inquirer/prompts'
import kebabCase from 'lodash/kebabCase'
import { ADMIN_API_URL } from '../constants'

export const admin = got.extend({
  // We allow this instance to me mutated so other parts of the
  // CLI code can update this instance with a valid API token.
  mutableDefaults: true,
  prefixUrl: ADMIN_API_URL,
})

export const getOrganization = async (
  slug: string,
  command: BaseCommand,
): Promise<Organization> => {
  try {
    const response = await admin.get<APIResourceResponse<Organization>>({
      url: `organizations/${slug}`,
      resolveBodyOnly: true,
      responseType: 'json',
    })

    return response.data
  } catch (error: any) {
    if (error instanceof HTTPError && error.response.statusCode === 404) {
      command.exitWithError(
        'error 404 while requesting organization information, are you sure the given organization exists?',
        error,
      )
    }

    command.exitWithError(
      'something went wrong while requesting organization information, check response for more details.',
      error,
    )
  }
}

export const selectOrganization = async (
  command: BaseCommand,
): Promise<Organization> => {
  try {
    const response = await admin
      .get('organizations?limit=100')
      .json<APIResourceResponse<Organization[]>>()

    const selection = await select({
      message: 'Select an organization',
      choices: [
        new Separator(),
        {
          name: '🆕 Create organization',
          value: null,
          description:
            'Create an organization (Note: you will be assigned as its administrator)',
        },
        new Separator(),
        ...response.data.map((organization) => ({
          name: organization.title,
          value: organization,
          description: `Organization ID: ${organization.id}`,
        })),
      ],
    })

    return selection ?? (await promptAndCreateOrganization(command))
  } catch (error: any) {
    if (error instanceof HTTPError) {
      command.exitWithError(
        'something went wrong while fetching your organizations.',
        error,
      )
    }

    throw error
  }
}

export const promptAndCreateOrganization = async (
  command: BaseCommand,
): Promise<Organization> => {
  const organizationName = await input({
    message: 'Organization name:',
  })

  const organizationSlug = await input({
    message: 'Organization slug:',
    default: kebabCase(organizationName),
  })

  try {
    const response = await admin
      .post(`organizations`, {
        json: {
          title: organizationName,
          slug: organizationSlug,
        },
      })
      .json<APIResourceResponse<Organization>>()

    return response.data
  } catch (error: any) {
    if (error instanceof HTTPError) {
      // If the given slug is already being used, let the user try again.
      if (
        error.response.statusCode === 422 &&
        typeof error.response.body === 'string'
      ) {
        const response = JSON.parse(error.response.body)

        if (
          response?.errors?.slug?.[0] ===
          'The slug has already been taken by another organization.'
        ) {
          command.log(
            '⚠️ An organization with this slug already exists, try using another one.',
          )
          return promptAndCreateOrganization(command)
        }
      }

      command.exitWithError(
        `something went wrong while creating an organization.`,
        error,
      )
    }

    throw error
  }
}

export const selectWorkspace = async (
  command: BaseCommand,
  organization: Organization,
): Promise<Workspace> => {
  try {
    const response = await admin
      .get(`organizations/${organization.slug}/workspaces`)
      .json<APIResourceResponse<Workspace[]>>()

    const selection = await select({
      message: 'Select a workspace',
      choices: [
        new Separator(),
        {
          name: '🆕 Create workspace',
          value: null,
          description: `Create a workspace in the ${organization.title} organization`,
        },
        new Separator(),
        ...response.data.map((workspace) => ({
          name: workspace.title,
          value: workspace,
          description: `Workspace ID: ${workspace.id}`,
        })),
      ],
    })

    return selection ?? (await promptAndCreateWorkspace(command, organization))
  } catch (error: any) {
    if (error instanceof HTTPError) {
      command.exitWithError(
        `something went wrong while fetching ${organization.title}'s workspaces.`,
        error,
      )
    }

    throw error
  }
}

export const createWorkspace = async (
  organization: string,
  name: string,
  slug: string,
  command: BaseCommand,
): Promise<Workspace> => {
  try {
    const response = await admin.post<APIResourceResponse<Workspace>>({
      url: `organizations/${organization}/workspaces`,
      json: { title: name, slug },
      resolveBodyOnly: true,
      responseType: 'json',
    })

    return response.data
  } catch (error: any) {
    if (error instanceof HTTPError && error.response.statusCode === 404) {
      command.exitWithError(
        'error 404 while creating a workspace, are you sure the given organization exists?',
        error,
      )
    } else if (
      error instanceof HTTPError &&
      error.response.statusCode === 422
    ) {
      command.exitWithError(
        'validation error while creating a workspace, are you sure the given slug is unique within the given organization?',
        error,
      )
    }

    command.exitWithError(
      'something went wrong while creating a workspace.',
      error,
    )
  }
}

export const promptAndCreateWorkspace = async (
  command: BaseCommand,
  organization: Organization,
): Promise<Workspace> => {
  const workspaceName = await input({
    message: 'Workspace name:',
  })

  const workspaceSlug = await input({
    message: 'Workspace slug:',
    default: kebabCase(workspaceName),
  })

  try {
    const response = await admin
      .post(`organizations/${organization.slug}/workspaces`, {
        json: {
          title: workspaceName,
          slug: workspaceSlug,
        },
      })
      .json<APIResourceResponse<Workspace>>()

    return response.data
  } catch (error: any) {
    if (error instanceof HTTPError) {
      // If the given slug is already being used, let the user try again.
      if (
        error.response.statusCode === 422 &&
        typeof error.response.body === 'string'
      ) {
        const response = JSON.parse(error.response.body)

        if (
          response?.errors?.slug?.[0] ===
          'The slug has already been taken by another workspace in this organization.'
        ) {
          command.log(
            '⚠️ A workspace with this slug already exists, try using another one.',
          )
          return promptAndCreateWorkspace(command, organization)
        }
      }

      command.exitWithError(
        `something went wrong while creating a workspace in the ${organization.title} organization.`,
        error,
      )
    }

    throw error
  }
}
