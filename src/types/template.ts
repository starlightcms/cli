export type TemplateParameters = {
  project: {
    name: string
  }
  organization: {
    id: number
    title: string
    slug: string
  }
  workspace: {
    id: number
    title: string
    slug: string
  }
}

export type TemplateParameterMap = {
  [Key in keyof TemplateParameters]: (keyof TemplateParameters[Key])[]
}

export type ReplaceMap = {
  [searchValue: string]: string
}

export interface TemplateAction<Type extends string> {
  type: Type
}

export interface ReplaceAction extends TemplateAction<'replace'> {
  target: string
  replace: ReplaceMap
}

export interface CopyAction extends TemplateAction<'copy'> {
  file: string
  to: string
  replace?: ReplaceMap
}

export type TemplateActions = CopyAction | ReplaceAction

export type TemplateActionTypes = TemplateActions['type']

export type TemplateMetadata = {
  name: string
  description?: string
  author?: string
  url?: string
  preview?: string
  instructions?: string
  actions?: TemplateAction<any>[]
}
