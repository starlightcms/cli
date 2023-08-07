export type ReplaceMap = {
  [searchValue: string]: string
}

export type ReplaceAction = {
  type: 'replace'
  target: string
  replace: ReplaceMap
}

export type CopyAction = {
  type: 'copy'
  file: string
  to: string
  replace?: ReplaceMap[]
}

export type TemplateAction = CopyAction | ReplaceAction

export type TemplateMetadata = {
  name: string
  description?: string
  author?: string
  url?: string
  preview?: string
  instructions?: string
  actions?: TemplateAction[]
}
