/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FASTPASS_DATA_SOURCE?: 'mock' | 'dataverse';
  readonly VITE_DATAVERSE_ENVIRONMENT_URL?: string;
  readonly VITE_DATAVERSE_CLIENT_ID?: string;
  readonly VITE_DATAVERSE_TENANT_ID?: string;
  readonly VITE_GRAPH_CLIENT_ID?: string;
  readonly VITE_GRAPH_TENANT_ID?: string;
  readonly VITE_ASSISTANT_ENGINE?: 'mock' | 'azure-openai' | 'copilot-studio';
  readonly VITE_AZURE_OPENAI_ENDPOINT?: string;
  readonly VITE_AZURE_OPENAI_DEPLOYMENT?: string;
  readonly VITE_PROFILE_ANALYSIS?: 'mock' | 'power-automate';
  readonly VITE_PROFILE_FLOW_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
