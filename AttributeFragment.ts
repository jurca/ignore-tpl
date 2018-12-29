import IDynamicFragment from './IDynamicFragment.js'

export default class AttributeFragment implements IDynamicFragment {
    private readonly element: Element
    private readonly attributeName: string

    constructor(element: Element, attributeName: string) {
        this.element = element
        this.attributeName = attributeName
    }

    public setValue(value: any): void {
        if (value === undefined || value === null) {
            this.element.removeAttribute(this.attributeName)
        } else {
            this.element.setAttribute(this.attributeName, value)
        }
    }
}
