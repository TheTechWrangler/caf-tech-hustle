/// <reference types="vite/client" />

interface Window {
  cafSave?: {
    load: () => Promise<unknown>;
    write: (data: unknown) => Promise<{ ok: boolean }>;
  };
}
