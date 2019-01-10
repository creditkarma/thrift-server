export const normalizePath = (path: string = '/'): string => {
    path = path.trim()

    if (path === '/') {
        return path
    }

    if (path === '') {
        return '/'
    }

    if (!path.startsWith('/')) {
        path = `/${path}`
    }

    if (path.endsWith('/')) {
        path = path.substring(0, path.length - 1)
    }

    return path
}
