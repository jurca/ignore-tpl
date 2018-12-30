import Template from './Template.js'

export default class TemplateData {
    public readonly key: any
    public readonly templateSource: string[]
    public readonly placeholderValues: any[]

    constructor(key: any, templateSource: string[], placeholderValues: any[]) {
        this.key = key
        this.templateSource = templateSource
        this.placeholderValues = placeholderValues
    }

    createTemplate(): Template {
        return new Template(this.templateSource)
    }
}
