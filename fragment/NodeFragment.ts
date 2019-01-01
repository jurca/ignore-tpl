import IDynamicFragment from './IDynamicFragment.js'

export default class NodeFragment implements IDynamicFragment {
    private readonly start: null | Node
    private readonly end: Comment
    private lastValue: any

    constructor(endNode: Comment) {
        this.start = endNode.previousSibling
        this.end = endNode
    }

    public setValue(value: Node): void {
        if (value === this.lastValue) {
            return
        }
        this.lastValue = value

        const {end, start} = this
        const container = end.parentNode!
        while (end.previousSibling !== start) {
            container.removeChild(end.previousSibling!)
        }

        container.insertBefore(value, end)
    }
}
