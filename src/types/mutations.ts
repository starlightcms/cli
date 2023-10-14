/* eslint-disable camelcase */
import {
  Collection,
  Entry,
  Form,
  Model,
  ModelCategory,
  Singleton,
} from './entities'

export type Field = {
  title: string
  key: string
  type: 'string' | 'text' | 'visual' | 'html' | 'media' | 'boolean' | 'relation'
  is_required?: boolean
  is_listable?: boolean
  is_private?: boolean
  is_archived?: boolean
  rules?: {
    [rule: string]: any
  }
}

export type ModelField = Omit<Field, 'type'> & {
  type: Field['type'] | 'title' | 'slug'
}

export type FormField = Field & {
  is_identifier?: boolean
}

export interface FieldGroup<FieldType = Field> {
  title: string
  type: 'group'
  fields: FieldType[]
}

export type ModelMutation = Pick<Model, 'title' | 'slug' | 'preview_url'> & {
  groups: FieldGroup<ModelField>[]
}

export type ModelCategoryMutation = Pick<ModelCategory, 'title' | 'slug'> & {
  model: string
}

export type SingletonStructureMutation = Pick<Singleton, 'title' | 'slug'> & {
  category: string
  groups: FieldGroup[]
}

export type SingletonContentMutation = Pick<Singleton, 'data'>

export type SingletonCategoryMutation = {
  title: string
  slug: string
}

export type EntryMutation = Pick<Entry, 'data'> & {
  draft?: boolean
}

export type MediaObjectMutation = {
  file: string
  title: string
  alt?: string
  description?: string
}

export type CollectionMutation = Pick<Collection, 'title' | 'slug' | 'type'>

export type FormMutation = Pick<Form, 'title' | 'slug'> & {
  groups: FieldGroup<FormField>[]
}
