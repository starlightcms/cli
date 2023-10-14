import { SchemaActionRunner } from './index'
import { CreateAction, MutableEntityMap } from '../../../types/schema'
import { ux } from '@oclif/core'
import { SchemaMutator } from './mutators'
import { modelMutator } from './mutators/model'
import { singletonMutator } from './mutators/singleton'
import { singletonCategoryMutator } from './mutators/singletonCategory'
import { modelCategoryMutator } from './mutators/modelCategory'
import { collectionMutator } from './mutators/collection'
import { formMutator } from './mutators/form'

type MutatorMap = {
  [EntityType in keyof MutableEntityMap]: SchemaMutator<
    MutableEntityMap[EntityType]['data']
  >
}

const mutators: MutatorMap = {
  model: modelMutator,
  modelCategory: modelCategoryMutator,
  singleton: singletonMutator,
  singletonCategory: singletonCategoryMutator,
  collection: collectionMutator,
  form: formMutator,
}

export const create: SchemaActionRunner<CreateAction> = async (
  action,
  rootFolder,
  parameters,
): Promise<void> => {
  ux.action.start(
    `Schema migration: creating ${action.entities.length} entit${
      action.entities.length === 1 ? 'y' : 'ies'
    }`,
  )

  for (const entity of action.entities) {
    /* eslint-disable no-await-in-loop --
     * It's okay to disable this rule here. The entity array order needs
     * to be respected, so we can't run mutations in parallel.
     */
    await mutators[entity.type as keyof MutableEntityMap].create(
      // Since schema files are always validated before running any actions,
      // we're sure the entity data is always valid for its given mutator.
      // That being said, it's okay to assert `data` as any.
      entity.data as any,
      parameters,
    )
  }

  ux.action.stop('finished')
}
