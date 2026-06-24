const getApiUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) return envUrl.replace(/\/+$/, "");

  return "";
};

export const ENV = {
  API_URL: getApiUrl(),
};
