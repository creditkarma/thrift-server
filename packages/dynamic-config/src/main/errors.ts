export class DynamicConfigMissingKey extends Error {
  constructor(key: string) {
    super(`Unable to retrieve value for key: ${key}`)
  }
}

export class HVNotConfigured extends Error {
  constructor() {
    super(`Hashicorp Vault is not configured`)
  }
}

export class HVFailed extends Error {
  constructor(message?: string) {
    super(message)
  }
}
