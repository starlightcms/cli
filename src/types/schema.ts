import {
  CollectionMutation,
  FormMutation,
  ModelCategoryMutation,
  ModelMutation,
  SingletonCategoryMutation,
  SingletonStructureMutation,
} from './mutations'

export interface SchemaAction {
  type: string
}

export interface CreateAction extends SchemaAction {
  type: 'create'
  entities: MutableEntity<unknown>[]
}

export interface ImportAction extends SchemaAction {
  type: 'import'
  file: string
}

export type SchemaActionMap = {
  create: CreateAction
  import: ImportAction
}

export type SchemaActionTypes = keyof SchemaActionMap

export type SchemaFile = {
  version: number
  timestamp: string
  actions: SchemaAction[]
}

export type SchemaFileValidationContext = {
  schemaPath: string
}

/* Schema Entities */

export interface MutableEntity<EntityData> {
  type: string
  data: EntityData
}

export type MutableEntityMap = {
  model: MutableModelEntity
  modelCategory: MutableModelCategoryEntity
  singleton: MutableSingletonEntity
  singletonCategory: MutableSingletonCategoryEntity
  collection: MutableCollectionEntity
  form: MutableFormEntity
}

export type MutableEntityTypes = keyof MutableEntityMap

export interface MutableModelEntity extends MutableEntity<ModelMutation> {
  type: 'model'
}

export interface MutableModelCategoryEntity
  extends MutableEntity<ModelCategoryMutation> {
  type: 'modelCategory'
}

export interface MutableSingletonEntity
  extends MutableEntity<SingletonStructureMutation> {
  type: 'singleton'
}

export interface MutableSingletonCategoryEntity
  extends MutableEntity<SingletonCategoryMutation> {
  type: 'singletonCategory'
}

export interface MutableCollectionEntity
  extends MutableEntity<CollectionMutation> {
  type: 'collection'
}

export interface MutableFormEntity extends MutableEntity<FormMutation> {
  type: 'form'
}
