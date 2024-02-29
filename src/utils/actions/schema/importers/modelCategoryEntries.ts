import { ContentImporter } from './index'
import { ModelCategoryEntriesDescriptor } from '../../../../types/content'
import { admin } from '../../../admin'
import { deeplyReplaceParameters } from '../../../parameters'

export const modelCategoryEntriesImporter: ContentImporter<
  ModelCategoryEntriesDescriptor
> = async (descriptor, parameters, contentBag) => {
  const entriesWithParameters = deeplyReplaceParameters(
    descriptor.entries,
    parameters,
    contentBag,
  )

  for (const item of entriesWithParameters) {
    /* eslint-disable no-await-in-loop --
     * It's okay to disable this rule here. The item array order needs
     * to be respected, so we can't add items in parallel.
     */
    await admin.post(
      `organizations/${parameters.organization.slug}/workspaces/${parameters.workspace.slug}/models/${descriptor.model}/categories/${descriptor.category}/add`,
      { json: { id: item } },
    )
  }

  return null
}
