import { SchemaMutator } from './index'
import { FormMutation } from '../../../../types/mutations'
import { admin } from '../../../admin'

export const formMutator: SchemaMutator<FormMutation> = {
  async create(data, parameters) {
    await admin.post(
      `organizations/${parameters.organization.slug}/workspaces/${parameters.workspace.slug}/forms`,
      { json: data },
    )
  },
}
