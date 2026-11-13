/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />
/// <reference types="./globals" />

interface ImportMetaEnv {
  readonly VITE_SITE_URL: string
  readonly VITE_BASE_PATH: string
  readonly VITE_CORS_PROXY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}