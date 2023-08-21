import { array, lazy, object, ObjectSchema, string, StringSchema } from 'yup'
import {
  CopyAction,
  ReplaceAction,
  TemplateParameterMap,
  TemplateActions,
  TemplateActionTypes,
  TemplateMetadata,
} from '../types/template'

const validParameters: TemplateParameterMap = {
  project: ['name'],
  organization: ['title', 'slug', 'id'],
  workspace: ['title', 'slug', 'id'],
}

const getInvalidParameters = (replacement: string): string[] => {
  return [...replacement.matchAll(/(\$\w+?\.\w+)/g)]
    .map((match) => match[0].replace('$', ''))
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

const stringWithParametersSchema = string().test(
  'template-parameters',
  ({ path, value }) =>
    `${path} has invalid parameters: ${getInvalidParameters(value).join(
      ', ',
    )}.`,
  (value) => {
    return typeof value === 'string' && getInvalidParameters(value).length === 0
  },
)

const makeReplaceMap = (required = false) =>
  lazy((value = {}) => {
    const schema = object(
      Object.fromEntries(
        Object.keys(value).map((key) => [key, stringWithParametersSchema]),
      ) as Record<string, StringSchema<string>>,
    )

    return required ? schema.required() : schema
  })

const replaceActionSchema: ObjectSchema<ReplaceAction> = object({
  type: string().oneOf(['replace']).required(),
  target: string().required(),
  replace: makeReplaceMap(true),
})

const copyActionSchema: ObjectSchema<CopyAction> = object({
  type: string().oneOf(['copy']).required(),
  file: string().required(),
  to: string().required(),
  replace: makeReplaceMap(),
})

const actionTypes = new Set<TemplateActionTypes>(['copy', 'replace'])

const templateActionSchema = lazy((action: TemplateActions | undefined) => {
  // Invalidate the action if it is an empty object or an action of an unknown
  // type. Since we're returning a schema that is technically not a valid
  // TemplateAction, we assert it as a valid one (like a CopyAction)
  // so TypeScript don't scream at us.
  if (!action || !actionTypes.has(action.type)) {
    return object({
      type: string()
        .oneOf([...actionTypes])
        .required(),
    }) as ObjectSchema<CopyAction>
  }

  switch (action.type) {
    case 'replace':
      return replaceActionSchema
    case 'copy':
      return copyActionSchema
  }
})

export const templateMetadataSchema: ObjectSchema<TemplateMetadata> = object({
  name: string().required(),
  description: string(),
  author: string(),
  url: string(),
  preview: string(),
  instructions: stringWithParametersSchema,
  actions: array().of(templateActionSchema),
})
