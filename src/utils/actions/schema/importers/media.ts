import { ContentImporter } from './index'
import { MediaObjectDescriptor } from '../../../../types/content'
import { admin } from '../../../admin'
import { APIResourceResponse } from '../../../../types/adminApi'
import { MediaObject } from '../../../../types/entities'
import path from 'node:path'
import { FormData } from 'formdata-node'
import { FormDataEncoder } from 'form-data-encoder'
import { Readable } from 'node:stream'
import { fileFromPath } from 'formdata-node/file-from-path'

export const mediaImporter: ContentImporter<MediaObjectDescriptor> = async (
  descriptor,
  parameters,
  contentBag,
  contentFileFolder,
) => {
  const { file, ...data } = descriptor.data
  const formData = new FormData()

  for (const dataKey in data) {
    if (Object.prototype.hasOwnProperty.call(data, dataKey)) {
      const value = data[dataKey as keyof typeof data]

      if (value) {
        formData.set(dataKey, value)
      }
    }
  }

  const filePath = path.resolve(contentFileFolder, file)

  formData.set('file', await fileFromPath(filePath))

  const encoder = new FormDataEncoder(formData)

  const response = await admin
    .post(
      `organizations/${parameters.organization.slug}/workspaces/${parameters.workspace.slug}/media`,
      {
        body: Readable.from(encoder),
        headers: encoder.headers,
      },
    )
    .json<APIResourceResponse<MediaObject>>()

  return {
    type: 'media',
    slug: descriptor.data.title,
    metadata: {
      id: response.data.id,
      slug: response.data.title,
    },
  }
}
