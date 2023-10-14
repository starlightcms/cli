import { SchemaMutator } from './index'
import { SingletonStructureMutation } from '../../../../types/mutations'
import { admin } from '../../../admin'

export const singletonMutator: SchemaMutator<SingletonStructureMutation> = {
  async create(data, parameters) {
    await admin.post(
      `organizations/${parameters.organization.slug}/workspaces/${parameters.workspace.slug}/singletons`,
      { json: data },
    )
  },
}
