/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly SITE_URL: string;
  readonly CF_BEACON_TOKEN?: string;
  readonly BAIDU_TONGJI_ID?: string;
  readonly RESEND_API_KEY?: string;
  readonly DATABASE_URL?: string;
  readonly AD_ENABLED?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
