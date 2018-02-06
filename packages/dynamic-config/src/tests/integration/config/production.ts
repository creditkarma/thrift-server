import { IProjectConfig } from './default'
import { project } from './foo'

const x: IProjectConfig = {
    health: {
        control: '',
        response: '',
    },
}

console.log('x: ', x)

export { project }

export const database = {
  username: {
    _source: 'env',
    _key: 'TEST_USERNAME',
    _default: 'default-user',
  },
  password: {
    _source: 'env',
    _key: 'TEST_PASSWORD',
    _default: 'monkey',
  },
}
