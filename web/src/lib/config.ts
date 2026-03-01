function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getConfig() {
  return {
    HF_TOKEN: requireEnv("HF_TOKEN"),
    HF_REPO_ID: requireEnv("HF_REPO_ID"),
    API_KEY: process.env.API_KEY, // Optional — kept for future admin endpoints
  };
}
