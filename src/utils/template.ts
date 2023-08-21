import path from 'node:path'
import fs from 'node:fs/promises'
import {
  TemplateActionTypes,
  TemplateMetadata,
  TemplateParameters,
} from '../types/template'
import { templateMetadataSchema } from '../schemas/template'
import actionRunners from './actions'
import { Organization, Workspace } from '../types/adminApi'

export const getTemplateMetadata = async (
  folder?: string,
): Promise<unknown> => {
  const templateFile = path.join(
    path.resolve(folder ?? process.cwd()),
    '.starlight',
    'template.json',
  )

  return JSON.parse(await fs.readFile(templateFile, 'utf8'))
}

export const validateTemplateMetadata = async (
  templateMetadata: unknown,
): Promise<TemplateMetadata> => {
  return templateMetadataSchema.validate(templateMetadata, {
    strict: true,
    abortEarly: false,
    stripUnknown: true,
  })
}

export const getParametersFromString = (string: string): string[] => {
  return [...string.matchAll(/(\$\w+?\.\w+)/g)].map((match) =>
    match[0].replace('$', ''),
  )
}

export const replaceParameters = (
  string: string,
  parameters: TemplateParameters,
): string => {
  const foundParameters = getParametersFromString(string)

  if (foundParameters.length > 0) {
    for (const foundParameter of foundParameters) {
      const [group, parameter] = foundParameter.split('.')
      const value =
        parameters[group as keyof TemplateParameters][parameter as never]
      string = string.replace(`$${foundParameter}`, value)
    }
  }

  return string
}

export const makeParameterMap = (
  projectName: string,
  organization: Organization,
  workspace: Workspace,
): TemplateParameters => {
  return {
    project: {
      name: projectName,
    },
    organization,
    workspace,
  }
}

export const runActions = async (
  templateMetadata: TemplateMetadata,
  rootFolder: string,
  parameters: TemplateParameters,
): Promise<void> => {
  if (templateMetadata.actions && templateMetadata.actions.length > 0) {
    for (const action of templateMetadata.actions) {
      if (Object.prototype.hasOwnProperty.call(actionRunners, action.type)) {
        // It's okay to disable this rule here. The action array order needs
        // to be respected, so we can't run actions in parallel.
        // eslint-disable-next-line no-await-in-loop
        await actionRunners[action.type as TemplateActionTypes](
          action,
          rootFolder,
          parameters,
        )
      }
    }
  }
}
