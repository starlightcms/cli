import { TemplateParameters } from '../../../../types/template'
import {
  ContentDescriptor,
  ContentDescriptorTypes,
} from '../../../../types/content'
import { ContentBag, ContentMetadata, ReferenceType } from '../../../parameters'
import { entryImporter } from './entry'
import { singletonImporter } from './singleton'
import { mediaImporter } from './media'
import { collectionItemsImporter } from './collectionItems'
import { modelCategoryEntriesImporter } from './modelCategoryEntries'

export type ContentImporter<Descriptor extends ContentDescriptor> = (
  descriptor: Descriptor,
  parameters: TemplateParameters,
  contentBag: ContentBag,
  contentFileFolder: string,
) => Promise<{
  type: ReferenceType
  slug: string
  metadata: ContentMetadata
} | null>

export type ContentImporterMap = {
  [ContentDescriptor in ContentDescriptorTypes]: ContentImporter<any>
}

export const contentImporters: ContentImporterMap = {
  entry: entryImporter,
  singleton: singletonImporter,
  media: mediaImporter,
  collectionItems: collectionItemsImporter,
  modelCategoryEntries: modelCategoryEntriesImporter,
}
