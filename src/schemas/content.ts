import { array, boolean, lazy, number, object, ObjectSchema, string } from 'yup'
import {
  ContentDescriptor,
  ContentDescriptorMap,
  ContentDescriptorTypes,
  ContentFile,
} from '../types/content'
import {
  objectWithDeepStringParametersSchema,
  stringWithParametersSchema,
} from '../utils/parameters'
import { TemplateFileValidationContext } from '../types/template'
import fs from 'node:fs/promises'
import path from 'node:path'
import { constants as fsConstants } from 'node:fs'

type ContentDescriptorSchemaMap<
  ContentType extends ContentDescriptorTypes = ContentDescriptorTypes,
> = Record<ContentType, ObjectSchema<ContentDescriptorMap[ContentType]>>

const contentDescriptorSchemas: ContentDescriptorSchemaMap = {
  entry: object({
    type: string().oneOf(['entry']).required(),
    model: string().required(),
    data: object({
      data: objectWithDeepStringParametersSchema.required(),
      draft: boolean(),
    }),
  }),
  singleton: object({
    type: string().oneOf(['singleton']).required(),
    slug: string().required(),
    data: object({
      data: objectWithDeepStringParametersSchema.required(),
    }),
  }),
  media: object({
    type: string().oneOf(['media']).required(),
    data: object({
      file: string<string, TemplateFileValidationContext>()
        .required()
        .test(
          'media-file-exists',
          ({ path }) =>
            `${path} is invalid: media file doesn't exist or you don't have permission to read it`,
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
      title: string().required(),
      alt: stringWithParametersSchema,
      description: stringWithParametersSchema,
    }),
  }),
  collectionItems: object({
    type: string().oneOf(['collectionItems']).required(),
    collection: string().required(),
    items: array().of(string().required()).required(),
  }),
  modelCategoryEntries: object({
    type: string().oneOf(['modelCategoryEntries']).required(),
    model: string().required(),
    category: string().required(),
    entries: array().of(string().required()).required(),
  }),
}

const contentDescriptorSchema = lazy(
  (descriptor: ContentDescriptor | undefined) => {
    // Invalidate the action if it is an empty object or an action of an unknown type.
    if (
      !descriptor ||
      !Object.prototype.hasOwnProperty.call(
        contentDescriptorSchemas,
        descriptor.type,
      )
    ) {
      return object({
        type: string().oneOf(Object.keys(contentDescriptorSchemas)).required(),
      })
    }

    return contentDescriptorSchemas[
      descriptor.type as keyof typeof contentDescriptorSchemas
    ]
  },
)

export const contentFileSchema: ObjectSchema<
  ContentFile,
  TemplateFileValidationContext
> = object({
  version: number().required(),
  content: array().of(contentDescriptorSchema).required(),
})
