/* eslint-disable camelcase */
import { array, boolean, lazy, number, object, ObjectSchema, string } from 'yup'
import {
  MutableEntity,
  MutableEntityMap,
  MutableEntityTypes,
  SchemaAction,
  SchemaActionMap,
  SchemaActionTypes,
  SchemaFile,
  SchemaFileValidationContext,
} from '../types/schema'
import { FormField, ModelField } from '../types/mutations'
import fs from 'node:fs/promises'
import { constants as fsConstants } from 'node:fs'
import path from 'node:path'

const baseFieldSchema = object({
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

const modelFieldSchema: ObjectSchema<ModelField> = baseFieldSchema.shape({
  type: string()
    .oneOf([
      'title',
      'slug',
      'string',
      'text',
      'visual',
      'html',
      'media',
      'boolean',
      'relation',
    ])
    .required(),
})

const formFieldSchema: ObjectSchema<FormField> = baseFieldSchema.shape({
  is_identifier: boolean(),
})

const makeGroupOf = (fieldType: ObjectSchema<any>) =>
  object({
    title: string().required(),
    type: string().oneOf(['group']).required(),
    fields: array().of(fieldType).required(),
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
      // FIXME: add test: models should have one title field and one slug field
      groups: array().of(makeGroupOf(modelFieldSchema)).required(),
    }).required(),
  }),
  modelCategory: object({
    type: string().oneOf(['modelCategory']).required(),
    data: object({
      model: string().required(),
      title: string().required(),
      slug: string().required(),
    }).required(),
  }),
  singleton: object({
    type: string().oneOf(['singleton']).required(),
    data: object({
      title: string().required(),
      slug: string().required(),
      category: string().required(),
      groups: array().of(makeGroupOf(baseFieldSchema)).required(),
    }).required(),
  }),
  singletonCategory: object({
    type: string().oneOf(['singletonCategory']).required(),
    data: object({
      title: string().required(),
      slug: string().required(),
    }).required(),
  }),
  collection: object({
    type: string().oneOf(['collection']).required(),
    data: object({
      title: string().required(),
      slug: string().required(),
      type: string().oneOf(['any', 'entry', 'media', 'singleton']).required(),
    }).required(),
  }),
  form: object({
    type: string().oneOf(['form']).required(),
    data: object({
      title: string().required(),
      slug: string().required(),
      groups: array().of(makeGroupOf(formFieldSchema)).required(),
    }).required(),
  }),
}

const mutableEntitySchema = lazy(
  (entity: MutableEntity<unknown> | undefined) => {
    // Invalidate the entity if it is an empty
    // object or an entity of an unknown type.
    if (
      !entity ||
      !Object.prototype.hasOwnProperty.call(mutableEntities, entity.type)
    ) {
      return object({
        type: string().oneOf(Object.keys(mutableEntities)).required(),
        data: object(),
      })
    }

    return mutableEntities[entity.type as keyof typeof mutableEntities]
  },
)

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
