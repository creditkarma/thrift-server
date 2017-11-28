/**
 * Address of the Consul instance we're reading from
 */
export const CONSUL_ADDRESS: string = 'CONSUL_ADDRESS'

/**
 * Datacenter for the KV Store
 */
export const CONSUL_KV_DC: string = 'CONSUL_KV_DC'

/**
 * Consul Keys are a comma separated list of configs to load and merge
 */
export const CONSUL_KEYS: string = 'CONSUL_KEYS'

/**
 * Path to local config files
 */
export const CONFIG_PATH: string = 'CONFIG_PATH'

/**
 * The key in the config where we find Vault configuration
 */
export const HVAULT_CONFIG_KEY: string = 'hashicorp-vault'

/**
 * Local folder, relative to cwd, to find configs
 */
export const DEFAULT_CONFIG_PATH: string = 'config'

/**
 * In the event NODE_ENV isn't set, this will be used
 */
export const DEFAULT_ENVIRONMENT: string = 'development'
