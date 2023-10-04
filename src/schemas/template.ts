import {
  array,
  lazy,
  number,
  object,
  ObjectSchema,
  string,
  StringSchema,
} from 'yup'
import {
  TemplateAction,
  TemplateActionMap,
  TemplateActionTypes,
  TemplateFile,
  TemplateFileValidationContext,
} from '../types/template'
import fs from 'node:fs/promises'
import path from 'node:path'
import { constants as fsConstants } from 'node:fs'
import { stringWithParametersSchema } from '../utils/parameters'

const makeReplaceMap = (required = false) =>
  lazy((value = {}) => {
    const schema = object(
      Object.fromEntries(
        Object.keys(value).map((key) => [key, stringWithParametersSchema]),
      ) as Record<string, StringSchema<string>>,
    )

    return required ? schema.required() : schema
  })

export type ActionSchemaMap<
  ActionType extends TemplateActionTypes = TemplateActionTypes,
> = Record<ActionType, ObjectSchema<TemplateActionMap[ActionType]>>

const actionSchemas: ActionSchemaMap = {
  copy: object({
    type: string().oneOf(['copy']).required(),
    file: string().required(),
    to: string().required(),
    replace: makeReplaceMap(),
  }),
  replace: object({
    type: string().oneOf(['replace']).required(),
    target: string().required(),
    replace: makeReplaceMap(true),
  }),
  migrate: object({
    type: string().oneOf(['migrate']).required(),
    file: string<string, TemplateFileValidationContext>()
      .required()
      .test(
        'schema-exists',
        ({ path }) => `${path} is invalid: schema file doesn't exist`,
        async (file, context) => {
          if (!context.options.context?.basePath) {
            throw new Error(
              `context.basePath is undefined, did you forget to pass a context to the validate() method?`,
            )
          }

          try {
            await fs.access(
              path.resolve(context.options.context.basePath, file),
              fsConstants.R_OK,
            )
            return true
          } catch {
            return false
          }
        },
      ),
  }),
}

const templateActionSchema = lazy((action: TemplateAction | undefined) => {
  // Invalidate the action if it is an empty object or an action of an unknown type.
  if (
    !action ||
    !Object.prototype.hasOwnProperty.call(actionSchemas, action.type)
  ) {
    return object({
      type: string().oneOf(Object.keys(actionSchemas)).required(),
    })
  }

  return actionSchemas[action.type as keyof typeof actionSchemas]
})

const actionsSchema = array()
  .of(templateActionSchema)
  .test({
    name: 'actions-max-one-migration',
    message: ({ path }) =>
      `${path} array is invalid: can't have more than one action of type "migrate"`,
    test: (value) =>
      !value ||
      value.length === 0 ||
      value.filter((action) => action.type === 'migrate').length <= 1,
  })

export const templateFileSchema: ObjectSchema<
  TemplateFile,
  TemplateFileValidationContext
> = object({
  version: number().required(),
  name: string().required(),
  description: string(),
  author: string(),
  url: string(),
  preview: string(),
  instructions: stringWithParametersSchema,
  actions: actionsSchema,
})
