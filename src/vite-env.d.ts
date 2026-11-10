/// <reference types="vite/client" />
/// <reference types="./globals" />

interface ImportMetaEnv {
  readonly VITE_SITE_URL: string
  readonly VITE_BASE_PATH: string
  readonly VITE_CORS_PROXY: string
  /** degeocode.benlab.link API key (exposed to client — restrict by origin on the service) */
  readonly VITE_DEGEOCODE_API_KEY?: string
  /** Override default https://degeocode.benlab.link */
  readonly VITE_DEGEOCODE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}