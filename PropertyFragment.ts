import IDynamicFragment from './IDynamicFragment.js'

export default class PropertyFragment implements IDynamicFragment {
    private readonly element: Element
    private readonly propertyName: string

    constructor(element: Element, propertyName: string) {
        this.element = element
        this.propertyName = propertyName
    }

    public setValue(value: any): void {
        this.element[this.propertyName] = value
    }
}
