export const normalizePath = (path: string = '/'): string => {
    path = path.trim()

    if (path === '/' || path === '') {
        return ''
    }

    if (!path.startsWith('/')) {
        path = `/${path}`
    }

    if (path.endsWith('/')) {
        path = path.substring(0, path.length - 1)
    }

    return path
}
