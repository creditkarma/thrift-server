import {
    IConnectionOptions,
    IHttpConnectionOptions,
} from '../../main'

export const APACHE_SERVER_CONFIG: IConnectionOptions = {
    hostName: 'localhost',
    port: 8888,
}

export const CALC_SERVER_CONFIG: IHttpConnectionOptions = {
    hostName: 'localhost',
    port: 8090,
}

export const ADD_SERVER_CONFIG: IHttpConnectionOptions = {
    hostName: 'localhost',
    port: 8080,
}

export const CLIENT_CONFIG: IHttpConnectionOptions = {
    hostName: 'localhost',
    port: 9000,
}
