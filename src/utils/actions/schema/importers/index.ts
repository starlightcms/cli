import { TemplateParameters } from '../../../../types/template'
import {
  ContentDescriptor,
  ContentDescriptorMap,
  ContentDescriptorTypes,
} from '../../../../types/content'
import { ContentBag, ContentMetadata } from '../../../parameters'
import { entryImporter } from './entry'
import { singletonImporter } from './singleton'
import { mediaImporter } from './media'
import { collectionItemsImporter } from './collectionItems'

export type ContentImporter<Descriptor extends ContentDescriptor> = (
  descriptor: Descriptor,
  parameters: TemplateParameters,
  contentBag: ContentBag,
  contentFileFolder: string,
) => Promise<{
  type: keyof ContentDescriptorMap
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
}
