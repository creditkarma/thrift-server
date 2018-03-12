import * as AsyncHooks from '@creditkarma/async-hooks'

export interface IAsyncScope {
    get<T>(key: string): T | null
    set<T>(key: string, value: T): void
    delete(key: string): void
}

interface IDictionary {
    [key: string]: any
}

interface IAsyncNode {
    id: number
    timestamp: number
    parentId: number | null
    exited: boolean
    data: IDictionary
    children: Array<number>
}

type AsyncMap = Map<number, IAsyncNode>

// Data has a ten minute expiration
const NODE_EXPIRATION: number = (1000 * 60 * 10)

// Purge data every 10 minutes
const PURGE_INTERVAL: number = (1000 * 60 * 5)

function cleanUpParents(asyncId: number, parentId: number, asyncMap: AsyncMap): void {
    const asyncNode: IAsyncNode | undefined = asyncMap.get(parentId)
    if (asyncNode !== undefined) {
        asyncNode.children = asyncNode.children.filter((next: number) => {
            return next !== asyncId
        })

        if (asyncNode.exited && asyncNode.children.length === 0) {
            const nextParentId: number | null = asyncNode.parentId
            if (nextParentId !== null) {
                asyncMap.delete(parentId)
                cleanUpParents(parentId, nextParentId, asyncMap)
            }
        }
    }
}

function recursiveGet<T>(key: string, asyncId: number, asyncMap: AsyncMap): T | null {
    const asyncNode: IAsyncNode | undefined = asyncMap.get(asyncId)
    if (asyncNode !== undefined) {
        if (asyncNode.data[key] !== undefined) {
            return asyncNode.data[key]

        } else {
            const parentId: number | null = asyncNode.parentId
            if (parentId !== null) {
                return recursiveGet<T>(key, parentId, asyncMap)
            } else {
                return null
            }
        }
    } else {
        return null
    }
}

function recursiveDelete(key: string, asyncId: number, asyncMap: AsyncMap): void {
    const asyncNode: IAsyncNode | undefined = asyncMap.get(asyncId)
    if (asyncNode !== undefined) {
        const parentId: number | null = asyncNode.parentId

        if (asyncNode.data[key] !== undefined) {
            asyncNode.data[key] = undefined
        }

        if (parentId !== null) {
            recursiveDelete(key, parentId, asyncMap)
        }
    }
}

function lineageFor(asyncId: number, asyncMap: AsyncMap): Array<number> {
    const asyncNode: IAsyncNode | undefined = asyncMap.get(asyncId)
    if (asyncNode !== undefined) {
        const parentId: number | null = asyncNode.parentId

        if (parentId !== null) {
            return [ asyncId, ...lineageFor(parentId, asyncMap) ]
        }
    }

    return [ asyncId ]
}

function destroyNode(asyncId: number, nodeToDestroy: IAsyncNode, asyncMap: AsyncMap): void {
    // Only delete if the the child scopes are not still active
    if (nodeToDestroy.children.length === 0) {
        const parentId: number | null = nodeToDestroy.parentId
        if (parentId !== null) {
            asyncMap.delete(asyncId)
            cleanUpParents(asyncId, parentId, asyncMap)
        }

    // If child scopes are still active mark this scope as exited so we can clean up
    // when child scopes do exit.
    } else {
        nodeToDestroy.exited = true
    }
}

function schedulePurge(asyncMap: AsyncMap): void {
    setTimeout(() => {
        const currentTime: number = Date.now()
        const toPurge: Array<IAsyncNode> = []
        asyncMap.forEach((element: IAsyncNode) => {
            if ((currentTime - element.timestamp) > NODE_EXPIRATION) {
                toPurge.push(element)
            }
        })

        toPurge.forEach((element: IAsyncNode) => {
            destroyNode(element.id, element, asyncMap)
        })

        schedulePurge(asyncMap)
    }, PURGE_INTERVAL)
}

export class AsyncScope implements IAsyncScope {
    private asyncMap: Map<number, IAsyncNode>

    constructor() {
        const self = this
        this.asyncMap = new Map()

        AsyncHooks.createHook({
            init(asyncId, type, triggerAsyncId, resource) {
                const currentTime: number = Date.now()

                if (!self.asyncMap.has(triggerAsyncId)) {
                    self.asyncMap.set(triggerAsyncId, {
                        id: triggerAsyncId,
                        timestamp: currentTime,
                        parentId: null,
                        exited: false,
                        data: {},
                        children: [],
                    })
                }

                const parentNode: IAsyncNode | undefined = self.asyncMap.get(triggerAsyncId)

                if (parentNode !== undefined) {
                    parentNode.children.push(asyncId)
                    parentNode.timestamp = currentTime

                    self.asyncMap.set(asyncId, {
                        id: asyncId,
                        timestamp: currentTime,
                        parentId: triggerAsyncId,
                        exited: false,
                        data: {},
                        children: [],
                    })
                }
            },
            before(asyncId) {
                // AsyncHooks.debug('before: ', asyncId)
            },
            after(asyncId) {
                // AsyncHooks.debug('after: ', asyncId)
            },
            promiseResolve(asyncId) {
                // AsyncHooks.debug('promiseResolve: ', asyncId)
            },
            destroy(asyncId) {
                const nodeToDestroy = self.asyncMap.get(asyncId)
                if (nodeToDestroy !== undefined) {
                    destroyNode(asyncId, nodeToDestroy, self.asyncMap)
                }
            },
        }).enable()

        // This will periodically remove long-lived nodes to prevent excess memory usage
        schedulePurge(this.asyncMap)
    }

    public get<T>(key: string): T | null {
        const activeId: number = AsyncHooks.executionAsyncId()
        return recursiveGet<T>(key, activeId, this.asyncMap)
    }

    public set<T>(key: string, value: T): void {
        const activeId: number = AsyncHooks.executionAsyncId()
        const activeNode: IAsyncNode | undefined = this.asyncMap.get(activeId)
        if (activeNode !== undefined) {
            activeNode.data[key] = value
        }
    }

    public delete(key: string): void {
        const activeId: number = AsyncHooks.executionAsyncId()
        recursiveDelete(key, activeId, this.asyncMap)
    }

    /**
     * A method for debugging, returns the lineage (parent scope ids) of the current scope
     */
    public lineage(): Array<number> {
        const activeId: number = AsyncHooks.executionAsyncId()
        return lineageFor(activeId, this.asyncMap)
    }
}

export const asyncScope: AsyncScope = new AsyncScope()
