import Template from './Template.js'

export default class TemplateData {
    public readonly key: any
    public readonly templateSource: TemplateStringsArray
    public readonly placeholderValues: any[]

    constructor(key: any, templateSource: TemplateStringsArray, placeholderValues: any[]) {
        this.key = key
        this.templateSource = templateSource
        this.placeholderValues = placeholderValues
    }

    public createTemplate(): Template {
        return new Template(this.templateSource)
    }
}
