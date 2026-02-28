function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const config = {
  HF_TOKEN: requireEnv("HF_TOKEN"),
  HF_REPO_ID: requireEnv("HF_REPO_ID"),
  API_KEY: requireEnv("API_KEY"),
};
