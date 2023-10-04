// TODO: escrever função que migra conteúdo

import { ModelMutation, SingletonStructureMutation } from './mutations'

export interface SchemaAction {
  type: string
}

export interface CreateAction extends SchemaAction {
  type: 'create'
  entities: MutableEntity[]
}

// TODO: é aqui que você pode importar conteúdo
//  - criar entradas
//  - adicionar conteúdo em singletons
//  - adicionar itens em coleções
//  - enviar arquivos de mídia
export interface ImportAction extends SchemaAction {
  type: 'import'
  file: string
}

// TODO: ConfigureAction

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

export interface MutableEntity {
  type: string
  // TODO:
  //  | 'modelCategory'
  //  | 'singletonCategory'
  //  | 'collection'
  //  | 'form'
}

export type MutableEntityMap = {
  model: MutableModelEntity
  singleton: MutableSingletonEntity
}

export type MutableEntityTypes = keyof MutableEntityMap

export interface MutableModelEntity extends MutableEntity {
  type: 'model'
  data: ModelMutation
}
export interface MutableSingletonEntity extends MutableEntity {
  type: 'singleton'
  data: SingletonStructureMutation
}
