import { ContentImporter } from './index'
import { CollectionItemsDescriptor } from '../../../../types/content'
import { admin } from '../../../admin'
import { deeplyReplaceParameters } from '../../../parameters'

export const collectionItemsImporter: ContentImporter<
  CollectionItemsDescriptor
> = async (descriptor, parameters, contentBag) => {
  const itemsWithParameters = deeplyReplaceParameters(
    descriptor.items,
    parameters,
    contentBag,
  )

  for (const item of itemsWithParameters) {
    /* eslint-disable no-await-in-loop --
     * It's okay to disable this rule here. The item array order needs
     * to be respected, so we can't add items in parallel.
     */
    await admin.post(
      `organizations/${parameters.organization.slug}/workspaces/${parameters.workspace.slug}/collections/${descriptor.collection}/items/add`,
      { json: { id: item } },
    )
  }

  return null
}
