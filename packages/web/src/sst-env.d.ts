/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VUE_APP_API_URL: string
  readonly VUE_APP_WS_URL: string
}
interface ImportMeta {
  readonly env: ImportMetaEnv
}