import Template from './Template.js'

export default class TemplateData {
    public readonly templateSource: string[]
    public readonly placeholderValues: any[]

    constructor(templateSource: string[], placeholderValues: any[]) {
        this.templateSource = templateSource
        this.placeholderValues = placeholderValues
    }

    createTemplate(): Template {
        return new Template(this.templateSource)
    }
}
