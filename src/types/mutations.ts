/* eslint-disable camelcase */
import { Entry, Model, Singleton } from './entities'

export interface Field {
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

export interface FieldGroup {
  title: string
  type: 'group'
  fields: Field[]
}

export type ModelMutation = Pick<Model, 'title' | 'slug' | 'preview_url'> & {
  groups: FieldGroup[]
}

export type SingletonStructureMutation = Pick<Singleton, 'title' | 'slug'> & {
  category: string
  groups: FieldGroup[]
}

export type SingletonContentMutation = Pick<Singleton, 'data'>

export type EntryMutation = Pick<Entry, 'data'> & {
  draft?: boolean
}

export type MediaObjectMutation = {
  file: string
  title: string
  alt?: string
  description?: string
}
