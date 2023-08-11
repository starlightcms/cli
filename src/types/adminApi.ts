/* eslint-disable camelcase */
export type LoginResponseData = {
  token: string
  type: string
  access_expires_in: number
  refresh_expires_in: number
}

export type APIResourceResponse<Resource> = {
  data: Resource
}

/* API Resources */

export type Organization = {
  id: number
  title: string
  slug: string
  created_at?: string
  updated_at?: string
}

export type Workspace = {
  id: number
  slug: string
  title: string
  created_at?: string
  updated_at?: string
}
