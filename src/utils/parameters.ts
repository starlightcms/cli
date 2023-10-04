import { TemplateParameterMap, TemplateParameters } from '../types/template'
import { object, string } from 'yup'
import { Organization, Workspace } from '../types/adminApi'

/* Parameters */
const parameterRegex = /(\${\w+?\.\w+})/g
const parameterReplacementRegex = /^\${(.+)}$/
const validParameters: TemplateParameterMap = {
  project: ['name'],
  organization: ['title', 'slug', 'id'],
  workspace: ['title', 'slug', 'id'],
}

export const getParametersFromString = (string: string): string[] => {
  return [...string.matchAll(parameterRegex)].map((match) =>
    match[0].replace(parameterReplacementRegex, '$1'),
  )
}

const getInvalidParameters = (string: string): string[] => {
  return [...string.matchAll(parameterRegex)]
    .map((match) => match[0].replace(parameterReplacementRegex, '$1'))
    .filter((match) => {
      const [group, parameter] = match.split('.')

      return (
        !Object.prototype.hasOwnProperty.call(validParameters, group) ||
        !validParameters[group as keyof typeof validParameters].includes(
          // Not sure why, but TS types validParameters[group] as "never", so...
          // It might be a bug in TypeScript, but even if it isn't,
          // this assertion is pretty safe.
          parameter as never,
        )
      )
    })
}

/* Relations */
const relationRegex = /(@{\w+?\..+})/g
const relationReplacementRegex = /^@{(.+)}$/
const validRelationTypes = new Set([
  'entry',
  'media',
  'singleton',
  'collection',
])

const getInvalidRelations = (string: string): string[] => {
  return [...string.matchAll(relationRegex)]
    .map((match) => match[0].replace(relationReplacementRegex, '$1'))
    .filter((match) => {
      const [, type] = match.match(/^(\w+?)\.(.+)$/)!

      return !validRelationTypes.has(type)
    })
}

const recursivelyTestStrings = (
  object: Record<string, unknown> | unknown[],
  test: (value: string) => string[],
): string[] => {
  const isArray = Array.isArray(object)
  const iterator = isArray ? object : Object.keys(object)

  for (const item of iterator) {
    if (
      !Array.isArray(object) &&
      !Object.prototype.hasOwnProperty.call(object, item)
    ) {
      continue
    }

    const value = isArray ? item : object[item]

    if (typeof value === 'string' && test(value).length > 0) {
      return test(value)
    }

    if (
      typeof value === 'object' &&
      value !== null &&
      (Array.isArray(value) || Object.keys(value).length > 0)
    ) {
      const inner = recursivelyTestStrings(
        value as Record<string, unknown>,
        test,
      )

      if (inner.length > 0) return inner
    }
  }

  return []
}

export const stringWithParametersSchema = string()
  .test(
    'template-string-parameters',
    ({ path, value }) =>
      `${path} has invalid parameters: ${getInvalidParameters(value).join(
        ', ',
      )}.`,
    (value) => {
      return (
        typeof value === 'string' && getInvalidParameters(value).length === 0
      )
    },
  )
  .test(
    'template-string-relations',
    ({ path, value }) =>
      `${path} has invalid relations: ${getInvalidRelations(value).join(
        ', ',
      )}.`,
    (value) => {
      return (
        typeof value === 'string' && getInvalidRelations(value).length === 0
      )
    },
  )

export const objectWithDeepStringParametersSchema = object()
  .test(
    'template-object-parameters',
    ({ path, value }) =>
      `${path} has invalid parameters in its structure: ${recursivelyTestStrings(
        value,
        getInvalidParameters,
      ).join(', ')}.`,
    (value) => {
      return recursivelyTestStrings(value, getInvalidParameters).length === 0
    },
  )
  .test(
    'template-object-relations',
    ({ path, value }) =>
      `${path} has invalid relations in its structure: ${recursivelyTestStrings(
        value,
        getInvalidRelations,
      ).join(', ')}.`,
    (value) => {
      return recursivelyTestStrings(value, getInvalidRelations).length === 0
    },
  )

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
