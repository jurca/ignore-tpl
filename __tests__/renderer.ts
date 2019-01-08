import keyed from '../keyed'
import render from '../renderer'
import tpl from '../tpl'

describe('renderer', () => {
    it('should render and append a template data instance into the provided element', () => {
        const container = document.createElement('div')
        container.appendChild(document.createElement('p'))
        render(container, tpl`
            <main>
                foo
            </main>
            bar
        `)
        expect(Array.from(container.childNodes).map((node) => node.nodeType)).toEqual([
            Node.ELEMENT_NODE,
            Node.TEXT_NODE,
            Node.ELEMENT_NODE,
            Node.TEXT_NODE,
        ])
        expect((container.firstChild as HTMLElement).outerHTML).toBe('<p></p>')
        expect(container.childNodes[1].nodeValue).toBe('\n            ')
        expect(container.childNodes[2].nodeName).toBe('MAIN')
        expect((container.childNodes[2] as HTMLElement).innerHTML).toBe('\n                foo\n            ')
        expect(container.childNodes[3].nodeValue).toBe('\n            bar\n        ')
    })

    it('should cache the template instance per element', () => {
        const view = tpl`
            <p>
                Lorem ipsum dolor sit amet.
            </p>
            <div>Foo</div>
            <main>&hellip;bar</main>
            <!-- baz -->
        `
        const container = document.createElement('div')
        render(container, view)
        const firstDomNodes = Array.from(container.childNodes)
        render(container, view)
        const currentDomNodes = Array.from(container.childNodes)
        expect(currentDomNodes.length).toBe(firstDomNodes.length)
        for (let i = 0; i < firstDomNodes.length; i++) {
            expect(currentDomNodes[i]).toBe(firstDomNodes[i])
        }

        const container2 = document.createElement('div')
        render(container2, view)
        const otherNodes = Array.from(container2.childNodes)
        expect(otherNodes.length).toBe(firstDomNodes.length)
        for (let i = 0; i < firstDomNodes.length; i++) {
            expect(otherNodes[i]).not.toBe(firstDomNodes[i])
        }

        expect(container.childNodes.length).toBe(9)
    })

    it('it should cache the template', () => {
        const view1 = tpl`
            <p>foo</p>
        `
        const view2 = tpl`
            <p>foo</p>
        `
        const createTemplate1Method = spyOn(view1, 'createTemplate').and.callThrough()
        const createTemplate2Method = spyOn(view2, 'createTemplate').and.callThrough()
        const container1 = document.createElement('div')
        const container2 = document.createElement('div')
        render(container1, view1)
        render(container2, view2)
        expect(createTemplate1Method).toHaveBeenCalledTimes(1)
        expect(createTemplate2Method).toHaveBeenCalledTimes(0)
    })

    it('should set the placeholder values before inserting the template instance DOM into the container', () => {
        const container = document.createElement('div')
        const onclick = jest.fn()
        container.appendChild = jest.fn((renderedDom) => {
            const mockContainer = document.createElement('div')
            mockContainer.appendChild(renderedDom)
            expect(mockContainer.innerHTML).toBe(
                '\n            <div class="row"></div>\n            <button></button>\n            ' +
                '<p>lorem ipsum<!----></p>\n        ',
            )
            expect(mockContainer.querySelector('button')!.onclick).toBe(onclick)
        })
        render(container, tpl`
            <div class="${'row'}"></div>
            <button .onclick="${onclick}"></button>
            <p>${document.createTextNode('lorem ipsum')}</p>
        `)
        expect(container.appendChild).toHaveBeenCalledTimes(1)
    })

    it('should insert the dom nodes of the root template instace into the container only once', () => {
        const container = document.createElement('div')
        const appendChild = spyOn(container, 'appendChild')
        render(container, tpl`
            <div>foo</div>
        `)
        render(container, tpl`
            <div>foo</div>
        `)
        expect(appendChild).toHaveBeenCalledTimes(1)
    })

    it('should only use the template instance\s setValues method for sub-sequent renders', () => {
        const container = document.createElement('div')
        render(container, tpl`<div class="${'foo'}"></div>`)
        const appendChildRoot = spyOn(container, 'appendChild')
        const replaceChildRoot = spyOn(container, 'replaceChild')
        const removeChildRoot = spyOn(container, 'removeChild')
        const insertBeforeRoot = spyOn(container, 'insertBefore')
        const appendChildContent = spyOn(container.childNodes[0], 'appendChild')
        const replaceChildContent = spyOn(container.childNodes[0], 'replaceChild')
        const removeChildContent = spyOn(container.childNodes[0], 'removeChild')
        const insertBeforeContent = spyOn(container.childNodes[0], 'insertBefore')
        const setAttributeContent = spyOn(container.childNodes[0] as HTMLElement, 'setAttribute')
        render(container, tpl`<div class="${'bar'}"></div>`)
        expect(appendChildRoot).toHaveBeenCalledTimes(0)
        expect(replaceChildRoot).toHaveBeenCalledTimes(0)
        expect(removeChildRoot).toHaveBeenCalledTimes(0)
        expect(insertBeforeRoot).toHaveBeenCalledTimes(0)
        expect(appendChildContent).toHaveBeenCalledTimes(0)
        expect(replaceChildContent).toHaveBeenCalledTimes(0)
        expect(removeChildContent).toHaveBeenCalledTimes(0)
        expect(insertBeforeContent).toHaveBeenCalledTimes(0)
        expect(setAttributeContent).toHaveBeenCalledTimes(1)
    })

    it('should remove the original root template instance DOM if the template changes', () => {
        const container = document.createElement('div')
        container.appendChild(document.createElement('p'))
        container.appendChild(document.createTextNode('foo  '))
        render(container, tpl`
            bar
            <div>baz</div>
        `)
        expect(container.childNodes.length).toBe(5)

        render(container, tpl` <p>test</p>`)
        expect(container.innerHTML).toBe('<p></p>foo   <p>test</p>')
    })

    it('should pass the values to attributes and properties without modifications', () => {
        const container = document.createElement('div')
        render(container, tpl`
            <div class="${'foo'}" .onclick="${() => 0}"></div>
        `)
        const attrValue = {}
        const callback = () => 1
        const setAttribute = spyOn(container.firstElementChild!, 'setAttribute')
        Object.defineProperty(container.firstElementChild!, 'onclick', {
            set: jest.fn((value) => {
                expect(value).toBe(callback)
            }),
        })
        render(container, tpl`
            <div class="${attrValue}" .onclick="${callback}"></div>
        `)
        expect(setAttribute).toHaveBeenCalledWith('class', attrValue)
        expect(Object.getOwnPropertyDescriptor(container.firstElementChild!, 'onclick')!.set).toHaveBeenCalledTimes(1)
    })

    it('should support rendering of strings, numbers, booleans, nulls and undefines in node fragments', () => {
        const container = document.createElement('div')
        render(container, tpl`
            <div>${'foo'}</div><p>${123.456}</p><div>${true}</div><p>${false}</p><small>${null}</small>
            <big>${undefined}</big>
        `)
        expect(container.innerHTML).toBe(
            '\n            <div>foo<!----></div><p>123.456<!----></p><div>true<!----></div><p>false<!----></p>' +
            '<small><!----></small>\n            <big><!----></big>\n        ',
        )
    })

    xit('should support rendering DOM nodes in node fragments', () => {})

    xit('should support rendering templates in node fragments and cache them if and only if they are keyed', () => {})

    xit('should support rendering of array containing primitive values and templates in node fragments', () => {})

    xit('should reject rendering of unkeyed templates in arrays in node fragments', () => {})

    xit('should cache the template instances by their keyes in arrays rendered in node fragments', () => {})

    xit('should drop the cached template instances of array elements that were removed', () => {})

    xit('should handle replacing the template in array with another template with the same key', () => {})

    xit('should set the values of sub-templates when rendering', () => {})
})
