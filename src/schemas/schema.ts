/* eslint-disable camelcase */
import { array, boolean, lazy, number, object, ObjectSchema, string } from 'yup'
import {
  SchemaAction,
  SchemaActionMap,
  SchemaActionTypes,
  MutableEntity,
  SchemaFile,
  MutableEntityTypes,
  MutableEntityMap,
  SchemaFileValidationContext,
} from '../types/schema'
import { Field, FieldGroup } from '../types/mutations'
import fs from 'node:fs/promises'
import { constants as fsConstants } from 'node:fs'
import path from 'node:path'

const fieldSchema: ObjectSchema<Field> = object({
  title: string().required(),
  key: string().required(),
  type: string()
    .oneOf(['string', 'text', 'visual', 'html', 'media', 'boolean', 'relation'])
    .required(),
  is_required: boolean(),
  is_listable: boolean(),
  is_private: boolean(),
  is_archived: boolean(),
  rules: object(),
})

const groupSchema: ObjectSchema<FieldGroup> = object({
  title: string().required(),
  type: string().oneOf(['group']).required(),
  fields: array().of(fieldSchema).required(),
})

type MutableEntitySchemaMap<
  EntityType extends MutableEntityTypes = MutableEntityTypes,
> = Record<EntityType, ObjectSchema<MutableEntityMap[EntityType]>>

const mutableEntities: MutableEntitySchemaMap = {
  model: object({
    type: string().oneOf(['model']).required(),
    data: object({
      title: string().required(),
      slug: string().required(),
      preview_url: string(),
      groups: array().of(groupSchema).required(),
    }).required(),
  }),
  singleton: object({
    type: string().oneOf(['singleton']).required(),
    data: object({
      title: string().required(),
      slug: string().required(),
      category: string().required(),
      groups: array().of(groupSchema).required(),
    }).required(),
  }),
}

const mutableEntitySchema = lazy((entity: MutableEntity | undefined) => {
  // Invalidate the entity if it is an empty object or an entity of an unknown type.
  if (
    !entity ||
    !Object.prototype.hasOwnProperty.call(mutableEntities, entity.type)
  ) {
    return object({
      type: string().oneOf(Object.keys(mutableEntities)).required(),
    })
  }

  return mutableEntities[entity.type as keyof typeof mutableEntities]
})

type ActionSchemaMap<ActionType extends SchemaActionTypes = SchemaActionTypes> =
  Record<ActionType, ObjectSchema<SchemaActionMap[ActionType]>>

const actionSchemas: ActionSchemaMap = {
  import: object({
    type: string().oneOf(['import']).required(),
    file: string<string, SchemaFileValidationContext>()
      .required()
      .test(
        'content-exists',
        ({ path }) => `${path} is invalid: content file doesn't exist`,
        async (file, context) => {
          if (!context.options.context?.schemaPath) {
            throw new Error(
              `context.schemaPath is undefined, did you forget to pass a context to the validate() method?`,
            )
          }

          try {
            await fs.access(
              path.resolve(
                path.dirname(context.options.context.schemaPath),
                file,
              ),
              fsConstants.R_OK,
            )
            return true
          } catch {
            return false
          }
        },
      ),
  }),
  create: object({
    type: string().oneOf(['create']).required(),
    entities: array().of(mutableEntitySchema).required(),
  }),
}

const schemaActionSchema = lazy((action: SchemaAction | undefined) => {
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

export const schemaFileSchema: ObjectSchema<SchemaFile> = object({
  version: number().required(),
  timestamp: string().required(),
  actions: array().of(schemaActionSchema).required(),
})
