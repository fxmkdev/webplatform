type Config = {
  canonicalHostname: string;
};

declare global {
  var _config: Config | undefined;
}

export function config() {
  if (!globalThis._config) {
    throw new Error("Config not initialized. Call initializeConfig first.");
  }
  return globalThis._config;
}

export function initializeConfig(config: Config) {
  if (!globalThis._config) {
    globalThis._config = config;
  }
}
