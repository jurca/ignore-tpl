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
            for (const node of value) {
                if (node instanceof DocumentFragment) {
                    throw new TypeError(
                        'Array values must not contain document fragments, instead inline the nodes inside the ' +
                        'document fragment directly into the array itself.',
                    )
                }
            }
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
        if (this.lastValue instanceof DocumentFragment) {
            this.unmountPreviousValue()
            lastValue.splice(0)
        }
        const valueAsSet = new Set(value)
        const lastValueAsSet = new Set(lastValue)
        const container = this.end.parentNode!

        for (const node of lastValue) {
            if (
              node.parentNode && // Make sure the node has not been removed by a parent fragment
              !valueAsSet.has(node)
            ) {
                container.removeChild(node)
            }
        }

        const firstKeptLastValueNode = lastValue.filter((node) => valueAsSet.has(node))[0]
        if (firstKeptLastValueNode) {
            let currentNode = firstKeptLastValueNode
            for (const node of value) {
                if (lastValueAsSet.has(node)) {
                    if (node !== currentNode) {
                        container.insertBefore(node, currentNode)
                    } else {
                        currentNode = currentNode.nextSibling!
                    }
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
