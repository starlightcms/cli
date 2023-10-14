import { ContentImporter } from './index'
import { SingletonDescriptor } from '../../../../types/content'
import { admin } from '../../../admin'
import { Singleton } from '../../../../types/entities'
import { deeplyReplaceParameters } from '../../../parameters'

export const singletonImporter: ContentImporter<SingletonDescriptor> = async (
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
    .patch(
      `organizations/${parameters.organization.slug}/workspaces/${parameters.workspace.slug}/singletons/${descriptor.slug}`,
      { json: dataWithParameters },
    )
    // This route is an outlier: it doesn't return the singleton inside a "data"
    // property like all other API route responses. This will be fixed in the
    // next version of the Admin API.
    .json<Singleton>()

  return {
    type: 'singleton',
    slug: response.slug,
    metadata: {
      id: response.id,
      slug: response.slug,
    },
  }
}
