export class MissingConfigPlaceholder extends Error {
  constructor(key: string) {
    super(`Unable to resolve placeholder with key: ${key}`)
  }
}

export class DynamicConfigMissingKey extends Error {
  constructor(key: string) {
    super(`Unable to find value for key: ${key}`)
  }
}

export class DynamicConfigInvalidObject extends Error {
  constructor(key: string) {
    super(`Object does not match expected schema for: ${key}`)
  }
}

export class HVNotConfigured extends Error {
  constructor(key: string) {
    super(`Unable to retrieve key: ${key}. Hashicorp Vault is not configured`)
  }
}

export class HVFailed extends Error {
  constructor(message?: string) {
    super(`Vault failed with error: ${message}`)
  }
}

export class ConsulNotConfigured extends Error {
  constructor(key: string) {
    super(`Unable to retrieve key: ${key}. Hashicorp Consul is not configured`)
  }
}

export class ConsulFailed extends Error {
  constructor(message?: string) {
    super(`Consul failed with error: ${message}`)
  }
}

export class ResolverUnavailable extends Error {
  constructor(key: string) {
    super(`Unable to retrieve key: ${key}. No resolver found`)
  }
}
