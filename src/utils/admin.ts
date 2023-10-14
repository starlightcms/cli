import got, { HTTPError } from 'got'
import { APIResourceResponse, Organization, Workspace } from '../types/adminApi'
import { BaseCommand } from '../BaseCommand'
import { input, select } from '@inquirer/prompts'
import kebabCase from 'lodash/kebabCase'
import { ADMIN_API_URL } from '../constants'

export const admin = got.extend({
  // We allow this instance to me mutated so other parts of the
  // CLI code can update this instance with a valid API token.
  mutableDefaults: true,
  prefixUrl: ADMIN_API_URL,
})

export const selectOrganization = async (
  command: BaseCommand,
): Promise<Organization> => {
  try {
    const response = await admin
      .get('organizations?limit=100')
      .json<APIResourceResponse<Organization[]>>()

    return select({
      message: 'Select an organization',
      choices: response.data.map((organization) => ({
        name: organization.title,
        value: organization,
        description: `Organization ID: ${organization.id}`,
      })),
    })
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

export const selectWorkspace = async (
  command: BaseCommand,
  organization: Organization,
): Promise<Workspace> => {
  try {
    const response = await admin
      .get(`organizations/${organization.slug}/workspaces`)
      .json<APIResourceResponse<Workspace[]>>()

    return select({
      message: 'Select a workspace',
      choices: response.data.map((workspace) => ({
        name: workspace.title,
        value: workspace,
        description: `Workspace ID: ${workspace.id}`,
      })),
    })
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
      command.exitWithError(
        `something went wrong while creating a workspace in the ${organization.title} organization.`,
        error,
      )
    }

    throw error
  }
}
