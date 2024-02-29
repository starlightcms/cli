import {
  EntryMutation,
  MediaObjectMutation,
  SingletonContentMutation,
} from './mutations'

export interface ContentDescriptor {
  type: string
}

export interface MediaObjectDescriptor extends ContentDescriptor {
  type: 'media'
  data: MediaObjectMutation
}

export interface SingletonDescriptor extends ContentDescriptor {
  type: 'singleton'
  slug: string
  data: SingletonContentMutation
}

export interface EntryDescriptor extends ContentDescriptor {
  type: 'entry'
  model: string
  data: EntryMutation
}

export interface CollectionItemsDescriptor extends ContentDescriptor {
  type: 'collectionItems'
  collection: string
  items: string[]
}

export interface ModelCategoryEntriesDescriptor extends ContentDescriptor {
  type: 'modelCategoryEntries'
  model: string
  category: string
  entries: string[]
}

export type ContentDescriptorMap = {
  entry: EntryDescriptor
  singleton: SingletonDescriptor
  media: MediaObjectDescriptor
  collectionItems: CollectionItemsDescriptor
  modelCategoryEntries: ModelCategoryEntriesDescriptor
}

export type ContentDescriptorTypes = keyof ContentDescriptorMap

export type ContentFile = {
  version: number
  content: ContentDescriptor[]
}
