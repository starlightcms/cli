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
    data: object({
      data: objectWithDeepStringParametersSchema.required(),
    }),
  }),
  media: object({
    type: string().oneOf(['media']).required(),
    data: object({
      file: string().required(),
      title: string().required(),
      alt: stringWithParametersSchema,
      description: stringWithParametersSchema,
    }),
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

export const contentFileSchema: ObjectSchema<ContentFile> = object({
  version: number().required(),
  content: array().of(contentDescriptorSchema).required(),
})
