export class State {
    public enabled: boolean = true
    public previousIds: Array<number> = []
    public nextId: number = 0
    public currentId: number = 0
    public parentId: number = 0
    public idMap: Map<number, number> = new Map()
}
