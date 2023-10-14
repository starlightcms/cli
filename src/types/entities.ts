/* eslint-disable camelcase */

export type Model = {
  id: number
  title: string
  slug: string
  preview_url?: string
  created_at: string
  updated_at: string
  entry_count?: number
}

export interface ModelCategory {
  id: number
  title: string
  slug: string
  entry_count: number
  created_at: string
  updated_at: string
}

export interface Organization {
  id: number
  title: string
  image: string
  slug: string
  created_at?: string
  updated_at?: string
}

export interface Permission {
  name: string
  content?: Model | string // Only Models are currently supported as content types by the backend
}

export interface Workspace {
  id: number
  slug: string
  title: string
  image?: string
  permissions?: Permission[]
  roles?: Role[]
  created_at?: string
  updated_at?: string
}

export interface Role {
  id: number
  title: string
  slug: string
  created_at: string
  updated_at: string
  permissions?: {
    name: string
    content?: Model | string
  }[]
  workspace?: Workspace
}

export interface User {
  id: string
  name: string
  email: string
  has_password?: boolean
  is_superuser: boolean
  created_at: string
  updated_at: string
  avatar?: string
  roles?: Role[]
}

export interface EntryRevision<DataSchema extends Record<string, any> = any> {
  id: number
  data?: DataSchema
  owner?: Pick<User, 'id' | 'name'>
  created_at: string
  updated_at: string
  publish_at?: string
  archive_at?: string
  is_draft?: boolean
  is_published?: boolean
}

export interface Entry<DataSchema extends Record<string, any> = any> {
  id: number
  title: string
  slug: string
  data?: DataSchema
  latest_revision: EntryRevision
  published_revision?: EntryRevision
  created_at: string
  updated_at: string
  published_at: string | null
}

export interface SingletonCategory {
  id: number
  title: string
  slug: string
  singleton_count: number
  created_at: string
  updated_at: string
}

export interface Singleton<
  DataSchema extends Record<string, any> = Record<string, any>,
> {
  id: number
  title: string
  slug: string
  category?: SingletonCategory
  data?: DataSchema
  updated_at: string
  published_at: string
}

export interface SingletonCategory {
  id: number
  title: string
  slug: string
  singleton_count: number
  created_at: string
  updated_at: string
}

type MediaMeta = {
  [meta: string]: any
  width?: number
  height?: number
}

export type MediaFileVariation =
  | 'original'
  | 'optimized'
  | 'thumbnail'
  | 'small'
  | 'medium'
  | 'large'
  | string

export type MediaFile = {
  id: number
  variation: MediaFileVariation
  path: string
  mime: string
  background_color: string
  file_size: number
  meta: MediaMeta
}

export interface MediaObject {
  id: number
  title: string
  extension: string
  mime: string
  files: MediaFile[]
  alt?: string
  description?: string
  created_at: string
  updated_at: string
}

export interface Collection {
  id: number
  title: string
  slug: string
  type: 'any' | 'entry' | 'media' | 'singleton'
  item_count: number
  created_at: string
  updated_at: string
}

export interface Form {
  id: number
  title: string
  slug: string
  submission_count?: number
  created_at: string
  updated_at: string
}
