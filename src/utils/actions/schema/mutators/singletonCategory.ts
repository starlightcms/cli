import { SchemaMutator } from './index'
import { SingletonCategoryMutation } from '../../../../types/mutations'
import { admin } from '../../../admin'

export const singletonCategoryMutator: SchemaMutator<SingletonCategoryMutation> =
  {
    async create(data, parameters) {
      await admin.post(
        `organizations/${parameters.organization.slug}/workspaces/${parameters.workspace.slug}/singletons/categories`,
        {
          json: {
            icon: 'cube',
            ...data,
          },
        },
      )
    },
  }
