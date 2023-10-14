import { SchemaMutator } from './index'
import { ModelCategoryMutation } from '../../../../types/mutations'
import { admin } from '../../../admin'

export const modelCategoryMutator: SchemaMutator<ModelCategoryMutation> = {
  async create(data, parameters) {
    const { model, ...rest } = data
    await admin.post(
      `organizations/${parameters.organization.slug}/workspaces/${parameters.workspace.slug}/models/${model}/categories`,
      { json: rest },
    )
  },
}
