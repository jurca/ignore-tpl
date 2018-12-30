import IDynamicFragment from './IDynamicFragment.js'

export default class AttributeFragment implements IDynamicFragment {
    private readonly element: Element
    private readonly attributeName: string
    private lastValue: any

    constructor(element: Element, attributeName: string) {
        this.element = element
        this.attributeName = attributeName
    }

    public setValue(value: any): void {
        if (value === this.lastValue) {
            return
        }
        this.lastValue = value

        if (value === undefined || value === null) {
            this.element.removeAttribute(this.attributeName)
        } else {
            this.element.setAttribute(this.attributeName, value)
        }
    }
}
