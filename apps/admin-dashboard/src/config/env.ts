function getApiUrl(): string {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && typeof envUrl === "string") {
    return envUrl.replace(/\/+$/, "");
  }

  return "";
}

export const ENV = {
  API_URL: getApiUrl(),
} as const;
