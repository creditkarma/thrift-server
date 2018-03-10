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
    parentId: number | null
    exited: boolean
    data: IDictionary
    children: Array<number>
}

type AsyncMap = Map<number, IAsyncNode>

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
            return asyncMap.get(asyncId)!.data[key]
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
            delete asyncNode.data[key]
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

export class AsyncScope implements IAsyncScope {
    private asyncMap: Map<number, IAsyncNode>

    constructor() {
        const self = this
        this.asyncMap = new Map()

        AsyncHooks.createHook({
            init(asyncId, type, triggerAsyncId, resource) {
                // AsyncHooks.debug('init: ', arguments)
                if (!self.asyncMap.has(triggerAsyncId)) {
                    self.asyncMap.set(triggerAsyncId, {
                        id: triggerAsyncId,
                        parentId: null,
                        exited: false,
                        data: {},
                        children: [],
                    })
                }

                self.asyncMap.get(triggerAsyncId)!.children.push(asyncId)

                self.asyncMap.set(asyncId, {
                    id: asyncId,
                    parentId: triggerAsyncId,
                    exited: false,
                    data: {},
                    children: [],
                })
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
                // AsyncHooks.debug('destroy: ', asyncId)
                if (self.asyncMap.has(asyncId)) {
                    // Only delete if the the child scopes are not still active
                    if (self.asyncMap.get(asyncId)!.children.length === 0) {
                        const parentId: number | null = self.asyncMap.get(asyncId)!.parentId
                        if (parentId !== null) {
                            self.asyncMap.delete(asyncId)

                            cleanUpParents(asyncId, parentId, self.asyncMap)
                        }

                    // If child scopes are still active mark this scope as exited so we can clean up
                    // when child scopes do exit.
                    } else {
                        self.asyncMap.get(asyncId)!.exited = true
                    }
                }
            },
        }).enable()
    }

    public get<T>(key: string): T | null {
        const activeId: number = AsyncHooks.executionAsyncId()
        console.log(`get[${key}]: activeId[${activeId}]: `, this.lineage)
        return recursiveGet<T>(key, activeId, this.asyncMap)
    }

    public set<T>(key: string, value: T): void {
        const activeId: number = AsyncHooks.executionAsyncId()
        console.log(`set[${key}]: activeId[${activeId}]: `, this.lineage)
        if (this.asyncMap.has(activeId)) {
            this.asyncMap.get(activeId)!.data[key] = value
        }
    }

    public delete(key: string): void {
        const activeId: number = AsyncHooks.executionAsyncId()
        console.log(`delete[${key}]: activeId[${activeId}]: `, this.lineage)
        recursiveDelete(key, activeId, this.asyncMap)
    }

    public lineage(): Array<number> {
        const activeId: number = AsyncHooks.executionAsyncId()
        return lineageFor(activeId, this.asyncMap)
    }
}

export const asyncScope: AsyncScope = new AsyncScope()
