import { SchemaMutator } from './index'
import { CollectionMutation } from '../../../../types/mutations'
import { admin } from '../../../admin'

export const collectionMutator: SchemaMutator<CollectionMutation> = {
  async create(data, parameters) {
    await admin.post(
      `organizations/${parameters.organization.slug}/workspaces/${parameters.workspace.slug}/collections`,
      { json: data },
    )
  },
}
