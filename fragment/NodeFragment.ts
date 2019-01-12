import IDynamicFragment from './IDynamicFragment.js'

export default class NodeFragment implements IDynamicFragment {
    private readonly start: null | Node
    private readonly end: Comment
    private lastValue: Node | Node[] = []

    constructor(endNode: Comment) {
        this.start = endNode.previousSibling
        this.end = endNode
    }

    public setValue(value: Node | Node[]): void {
        if (value === this.lastValue) {
            return
        }

        if (value instanceof Array) {
            this.setArrayValue(value)
        } else {
            this.unmountPreviousValue()

            const {end} = this
            const container = end.parentNode!
            container.insertBefore(value, end)
        }

        this.lastValue = value
    }

    private setArrayValue(value: Node[]): void {
        const lastValue = this.lastValue instanceof Array ? this.lastValue : [this.lastValue]
        if (lastValue[0] instanceof DocumentFragment) {
            this.unmountPreviousValue()
            lastValue.splice(0)
        }
        const valueAsSet = new Set(value)
        const lastValueAsSet = new Set(lastValue)
        const container = this.end.parentNode!

        for (const node of lastValue) {
            if (!valueAsSet.has(node)) {
                container.removeChild(node)
            }
        }

        const firstKeptLastValueNode = lastValue.filter((node) => valueAsSet.has(node))[0]
        if (firstKeptLastValueNode) {
            const {childNodes} = container
            // Unless we are traversing a very large node list, linear search is just fine. Also, interestingly enough,
            // it appears that linear search of childNodes can be a lot faster than using binary search (because of the
            // performance of the underlying DOM implementation) - see
            // https://stackoverflow.com/questions/5913927/get-child-node-index#answer-44875786
            const startingNodeIndex = Array.prototype.indexOf.call(childNodes, firstKeptLastValueNode)
            let currentNodeIndex = startingNodeIndex
            for (const node of value) {
                if (lastValueAsSet.has(node)) {
                    if (childNodes[currentNodeIndex] !== node) {
                        container.insertBefore(node, childNodes[currentNodeIndex])
                    }
                    currentNodeIndex++
                }
            }
        }

        let insertBeforeNode: Node = firstKeptLastValueNode || this.end
        for (const node of value) {
            if (node !== insertBeforeNode) {
                container.insertBefore(node, insertBeforeNode)
            } else {
                insertBeforeNode = insertBeforeNode.nextSibling!
            }
        }
    }

    private unmountPreviousValue() {
        const {end, start} = this
        const container = end.parentNode!
        while (end.previousSibling !== start) {
            container.removeChild(end.previousSibling!)
        }
    }
}
