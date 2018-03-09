import {
    asyncHooks,
    // debug,
} from '../async-hooks'

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
    parentId: number
    exited: boolean
    data: IDictionary
    children: Array<number>
}

type AsyncMap = Map<number, IAsyncNode>

function cleanUpParents(asyncId: number, parentId: number, asyncMap: AsyncMap): void {
    if (asyncMap.has(parentId)) {
        asyncMap.get(parentId)!.children = asyncMap.get(parentId)!.children.filter((next: number) => {
            return next !== asyncId
        })

        if (asyncMap.get(parentId)!.exited && asyncMap.get(parentId)!.children.length === 0) {
            const nextParentId: number = asyncMap.get(parentId)!.parentId
            asyncMap.delete(parentId)
            cleanUpParents(parentId, nextParentId, asyncMap)
        }
    }
}

function recursiveGet<T>(key: string, asyncId: number, asyncMap: AsyncMap): T | null {
    if (asyncMap.has(asyncId)) {
        if (asyncMap.get(asyncId)!.data[key] !== undefined) {
            return asyncMap.get(asyncId)!.data[key]
        } else {
            return recursiveGet<T>(key, asyncMap.get(asyncId)!.parentId, asyncMap)
        }
    } else {
        return null
    }
}

function recursiveDelete(key: string, asyncId: number, asyncMap: AsyncMap): void {
    if (asyncMap.has(asyncId)) {
        const parentId: number = asyncMap.get(asyncId)!.parentId

        if (asyncMap.get(asyncId)!.data[key] !== undefined) {
            delete asyncMap.get(asyncId)!.data[key]
        }

        recursiveDelete(key, parentId, asyncMap)
    }
}

export class AsyncScope implements IAsyncScope {
    private asyncMap: Map<number, IAsyncNode>

    constructor() {
        const self = this
        this.asyncMap = new Map()

        asyncHooks.createHook({
            init(asyncId, type, triggerAsyncId, resource) {
                // debug('init: ', arguments)
                if (!self.asyncMap.has(triggerAsyncId)) {
                    self.asyncMap.set(triggerAsyncId, {
                        id: triggerAsyncId,
                        parentId: -1,
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
                // debug('before: ', asyncId)
            },
            after(asyncId) {
                // debug('after: ', asyncId)
            },
            promiseResolve(asyncId) {
                // debug('promiseResolve: ', asyncId)
            },
            destroy(asyncId) {
                // debug('destroy: ', asyncId)
                if (self.asyncMap.has(asyncId)) {
                    // Only delete if the the child scopes are not still active
                    if (self.asyncMap.get(asyncId)!.children.length === 0) {
                        const parentId: number = self.asyncMap.get(asyncId)!.parentId
                        self.asyncMap.delete(asyncId)

                        cleanUpParents(asyncId, parentId, self.asyncMap)

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
        const activeId: number = asyncHooks.executionAsyncId()
        return recursiveGet<T>(key, activeId, this.asyncMap)
    }

    public set<T>(key: string, value: T): void {
        const activeId: number = asyncHooks.executionAsyncId()
        if (this.asyncMap.has(activeId)) {
            this.asyncMap.get(activeId)!.data[key] = value
        }
    }

    public delete(key: string): void {
        const activeId: number = asyncHooks.executionAsyncId()
        recursiveDelete(key, activeId, this.asyncMap)
    }
}

export const asyncScope: AsyncScope = new AsyncScope()
