import { SchemaMutator } from './index'
import { ModelMutation } from '../../../../types/mutations'
import { admin } from '../../../admin'

export const modelMutator: SchemaMutator<ModelMutation> = {
  async create(data, parameters) {
    await admin.post(
      `organizations/${parameters.organization.slug}/workspaces/${parameters.workspace.slug}/models`,
      { json: data },
    )
  },
}
