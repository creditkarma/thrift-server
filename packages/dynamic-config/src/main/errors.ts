export class DynamicConfigMissingKey extends Error {
  constructor(key: string) {
    super(`Unable to retrieve value for key: ${key}`)
  }
}

export class DynamicConfigInvalidObject extends Error {
  constructor(key: string) {
    super(`Object for does not match expected schema for: ${key}`)
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

export class ConsulFailed extends Error {
  constructor(message?: string) {
    super(`Consul failed with error: ${message}`)
  }
}

export class ConsulNotConfigured extends Error {
  constructor(key: string) {
    super(`Unable to retrieve key: ${key}. Hashicorp Consul is not configured`)
  }
}
