import structuredClone from '@ungap/structured-clone'
import { TemplateParameterMap, TemplateParameters } from '../types/template'
import { object, string } from 'yup'
import { Organization, Workspace } from '../types/adminApi'
import { ContentDescriptorMap } from '../types/content'

export type ContentMetadata = {
  id: number
  slug: string
}

export type ContentBag = Map<
  keyof ContentDescriptorMap,
  Map<string, ContentMetadata>
>

const matcherRegex = /([#$@]){(\w+?)\.(.+?)}/g
const parameterMatcherRegex = /(\$){(\w+?)\.(.+?)}/g
const referenceMatcherRegex = /([#@]){(\w+?)\.(.+?)}/g
const validParameters: TemplateParameterMap = {
  project: ['name'],
  organization: ['title', 'slug', 'id'],
  workspace: ['title', 'slug', 'id'],
}
const validReferenceTypes = new Set([
  'entry',
  'media',
  'singleton',
  'collection',
])

const getInvalidParameters = (string: string): string[] => {
  return [...string.matchAll(parameterMatcherRegex)]
    .filter((match) => {
      const group = match[2]
      const parameter = match[3]

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
    .map((match) => match[0])
}

const getInvalidReferences = (string: string): string[] => {
  return [...string.matchAll(referenceMatcherRegex)]
    .filter((match) => {
      return !validReferenceTypes.has(match[2])
    })
    .map((match) => match[0])
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
      const inner = recursivelyTestStrings(value, test)

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
    'template-string-references',
    ({ path, value }) =>
      `${path} has invalid references: ${getInvalidReferences(value).join(
        ', ',
      )}.`,
    (value) => {
      return (
        typeof value === 'string' && getInvalidReferences(value).length === 0
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
    'template-object-references',
    ({ path, value }) =>
      `${path} has invalid references in its structure: ${recursivelyTestStrings(
        value,
        getInvalidReferences,
      ).join(', ')}.`,
    (value) => {
      return recursivelyTestStrings(value, getInvalidReferences).length === 0
    },
  )

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

const getParametersFromString = (string: string): string[][] => {
  return [...string.matchAll(matcherRegex)].map((match) => [
    match[1],
    match[2],
    match[3],
  ])
}

export const replaceParameters = (
  string: string,
  parameters: TemplateParameters,
  contentBag?: ContentBag,
): string => {
  const matchedParameters = getParametersFromString(string)

  if (matchedParameters.length > 0) {
    for (const matchedParameter of matchedParameters) {
      const [matcherSymbol, group, slug] = matchedParameter
      let value

      if (matcherSymbol === '@' || matcherSymbol === '#') {
        if (!contentBag) {
          throw new Error(
            `Parameter ${matcherSymbol}{${group}.${slug}} was used in a context where content metadata is unavailable. Only template parameters (parameters starting with $) are allowed here.`,
          )
        }

        const contentMetadata = contentBag!
          .get(group as keyof ContentDescriptorMap)!
          .get(slug)

        if (!contentMetadata) {
          throw new Error(
            group === 'entry' && !slug.includes('.')
              ? `No content metadata found for the ${matcherSymbol}{${group}.${slug}} parameter. Did you forget to include the model name before the entry slug, like in ${matcherSymbol}{entry.model-slug.entry-slug}? Also, make sure that the content you're trying to reference is being created **before** you try to refer to it.`
              : `No content metadata found for the ${matcherSymbol}{${group}.${slug}} parameter. Content creation order matters, so make sure that the content you're trying to reference is being created **before** you try to refer to it.`,
          )
        }

        value = contentMetadata[matcherSymbol === '@' ? 'slug' : 'id']
      } else {
        value = parameters[group as keyof TemplateParameters][slug as never]
      }

      string = string.replace(
        `${matcherSymbol}{${group}.${slug}}`,
        String(value),
      )
    }
  }

  return string
}

export const deeplyReplaceParameters = (
  object: Record<string, unknown> | unknown[],
  parameters: TemplateParameters,
  contentBag?: ContentBag,
): any => {
  const cloned = structuredClone(object)
  const isArray = Array.isArray(cloned)
  const iterator = isArray ? cloned : Object.keys(cloned)

  for (const item of iterator) {
    if (!isArray && !Object.prototype.hasOwnProperty.call(cloned, item)) {
      continue
    }

    const value = isArray ? item : cloned[item]
    let replaced

    if (typeof value === 'string') {
      replaced = replaceParameters(value, parameters, contentBag)
    } else if (
      typeof value === 'object' &&
      value !== null &&
      (Array.isArray(value) || Object.keys(value).length > 0)
    ) {
      replaced = deeplyReplaceParameters(value, parameters, contentBag)
    }

    if (isArray) cloned[cloned.indexOf(value)] = replaced ?? value
    else cloned[item] = replaced ?? value
  }

  return cloned
}
