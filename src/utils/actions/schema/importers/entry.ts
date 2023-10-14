import { ContentImporter } from './index'
import { EntryDescriptor } from '../../../../types/content'
import { admin } from '../../../admin'
import { APIResourceResponse } from '../../../../types/adminApi'
import { Entry } from '../../../../types/entities'
import { deeplyReplaceParameters } from '../../../parameters'

export const entryImporter: ContentImporter<EntryDescriptor> = async (
  descriptor,
  parameters,
  contentBag,
) => {
  const dataWithParameters = deeplyReplaceParameters(
    descriptor.data,
    parameters,
    contentBag,
  )

  const response = await admin
    .post(
      `organizations/${parameters.organization.slug}/workspaces/${parameters.workspace.slug}/models/${descriptor.model}/entries`,
      { json: dataWithParameters },
    )
    .json<APIResourceResponse<Entry>>()

  return {
    type: 'entry',
    slug: `${descriptor.model}.${response.data.slug}`,
    metadata: {
      id: response.data.id,
      slug: response.data.slug,
    },
  }
}
