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

    it('should support rendering DOM nodes in node fragments', () => {
        const container = document.createElement('div')
        const nodeValue = document.createDocumentFragment()
        nodeValue.appendChild(document.createElement('div'))
        nodeValue.appendChild(document.createTextNode('foo'))
        nodeValue.appendChild(document.createElement('p'))
        nodeValue.appendChild(document.createComment('bar'))
        nodeValue.appendChild(document.createTextNode('baz'))
        render(container, tpl`
            <div>${nodeValue}</div>
        `)
        expect(container.innerHTML).toBe(
            '\n            <div><div></div>foo<p></p><!--bar-->baz<!----></div>\n        ',
        )
    })

    it('should support rendering templates in node fragments and cache them if and only if they are keyed', () => {
        const container = document.createElement('div')
        render(container, tpl`<div>${tpl`<p></p>`}</div>`)
        expect(container.innerHTML).toBe('<div><p></p><!----></div>')
        const injectedParagraph = container.firstChild!.firstChild!
        expect(injectedParagraph.nodeName).toBe('P')
        render(container, tpl`<div>${tpl`<p></p>`}</div>`)
        const currentParagraph = container.firstChild!.firstChild
        expect(currentParagraph).not.toBe(injectedParagraph)

        render(container, tpl`<div>${keyed(null)`<span></span>`}</div>`)
        const injectedContainer = container.firstChild!.firstChild!
        expect(injectedContainer.nodeName).toBe('SPAN')
        render(container, tpl`<div>${keyed(null)`<span></span>`}</div>`)
        const currentContainer = container.firstChild!.firstChild
        expect(currentContainer).toBe(injectedContainer)
    })

    it('should support rendering of array containing primitive values and templates in node fragments', () => {
        const container = document.createElement('div')
        render(container, tpl`
            <div>
                ${[
                    true,
                    false,
                    123.456,
                    'lorem ipsum',
                    null,
                    undefined,
                    ' dolor sit amet.',
                    keyed(null)`<p>${0}</p>`,
                ]}
            </div>
        `)
        expect(container.innerHTML).toBe(
            '\n            <div>\n                truefalse123.456lorem ipsum dolor sit amet.<p>0<!----></p>' +
            '<!---->\n            </div>\n        ',
        )
    })

    it('should reject rendering of unkeyed templates in arrays in node fragments', () => {
        expect(() => {
            render(document.createElement('div'), tpl`<div>${[tpl`<p></p>`]}</div>`)
        }).toThrowError(Error)
        render(document.createElement('div'), tpl`<div>${[keyed(0)`<p></p>`]}</div>`)
    })

    if (!('flat' in Array.prototype)) {
        (Array.prototype as any).flat = function(depth = 0) {
            let result = []
            let hasArrays = false
            for (let i = 0; i < this.length; i++) { // tslint:disable-line prefer-for-of
                result = result.concat(this[i])
                if (this[i] instanceof Array) {
                    hasArrays = true
                }
            }

            if (depth <= 0 || !hasArrays) {
                return result
            }

            return (result as any).flat(depth - 1)
        }
    }

    it('should cache the template instances by their keys in arrays rendered in node fragments', () => {
        const container = document.createElement('div')
        render(container, tpl`
            <ul>
                ${[
                    keyed(0)`<li>${0}</li>`,
                    keyed(1)`<li>${1}</li>`,
                    keyed(2)`<li>
                        ${[
                            keyed(0)`<span>${0}</span>`,
                            keyed(1)`<span>${1}</span>`,
                        ]}
                    </li>`,
                ]}
            </ul>
        `)
        expect(container.innerHTML).toBe(
            '\n            <ul>\n                <li>0<!----></li><li>1<!----></li>' +
            '<li>\n                        ' +
            '<span>0<!----></span><span>1<!----></span><!---->' +
            '\n                    </li><!---->\n            </ul>\n        ',
        )
        const liElements = Array.from(container.querySelectorAll('li'))
        const spanElements = Array.from(container.querySelectorAll('span'))

        render(container, tpl`
            <ul>
                ${[
                    keyed(-1)`<li>${-1}</li>`,
                    keyed(0)`<li>${0}</li>`,
                    keyed(1)`<li>${1}</li>`,
                    keyed('1.5')`<li>${'1.5'}</li>`,
                    keyed(2)`<li>
                        ${[
                            keyed(0)`<span>${0}</span>`,
                            keyed(1)`<span>${1}</span>`,
                            keyed(2)`<span>${2}</span>`,
                        ]}
                    </li>`,
                    keyed(3)`<li>${3}</li>`,
                ]}
            </ul>
        `)
        expect(container.innerHTML).toBe(
            '\n            <ul>\n                ' +
            '<li>-1<!----></li><li>0<!----></li><li>1<!----></li><li>1.5<!----></li><li>\n                        ' +
            '<span>0<!----></span><span>1<!----></span><span>2<!----></span><!---->' +
            '\n                    </li><li>3<!----></li><!---->\n            ' +
            '</ul>\n        ',
        )
        const currentLiElements = Array.from(container.querySelectorAll('li'))
        const currentSpanElements = Array.from(container.querySelectorAll('span'))

        expect(currentLiElements[1]).toBe(liElements[0])
        expect(currentLiElements[2]).toBe(liElements[1])
        expect(currentLiElements[4]).toBe(liElements[2])
        expect(currentSpanElements[0]).toBe(spanElements[0])
        expect(currentSpanElements[1]).toBe(spanElements[1])

        expect(liElements.includes(currentLiElements[0])).toBe(false)
        expect(liElements.includes(currentLiElements[3])).toBe(false)
        expect(liElements.includes(currentLiElements[5])).toBe(false)

        expect(spanElements.includes(currentSpanElements[2])).toBe(false)
    })

    it('should handle rendering the same template with the same key nested inside itself', () => {
        const container = document.createElement('div')
        render(container, tpl`<div>${keyed(0)`<div>${keyed(0)`<div>${keyed(0)`<div>${0}</div>`}</div>`}</div>`}</div>`)
        expect(container.innerHTML).toBe(
            '<div><div><div><div>0<!----></div><!----></div><!----></div><!----></div>',
        )
    })

    it('should drop the cached template instances of array elements that were removed', () => {
        const container = document.createElement('div')
        render(container, tpl`
            <ul>
                ${[
                    keyed(1)`<li></li>`,
                ]}
            </ul>
        `)
        expect(container.innerHTML).toBe(
            '\n            <ul>\n                <li></li><!---->\n            </ul>\n        ',
        )
        const firstLiElement = container.querySelector('li')

        render(container, tpl`
            <ul>
                ${[]}
            </ul>
        `)
        expect(container.innerHTML).toBe('\n            <ul>\n                <!---->\n            </ul>\n        ')

        render(container, tpl`
            <ul>
                ${[
                    keyed(1)`<li></li>`,
                ]}
            </ul>
        `)
        expect(container.innerHTML).toBe(
            '\n            <ul>\n                <li></li><!---->\n            </ul>\n        ',
        )
        const secondLiElement = container.querySelector('li')
        expect(secondLiElement).not.toBe(firstLiElement)
    })

    it('should handle replacing the template in array with another template with the same key', () => {
        const container = document.createElement('div')
        render(container, tpl`
            <div>${[keyed(0)`<p></p>`]}</div>
        `)
        expect(container.innerHTML).toBe('\n            <div><p></p><!----></div>\n        ')

        render(container, tpl`
            <div>${[keyed(0)`<span></span>`]}</div>
        `)
        expect(container.innerHTML).toBe('\n            <div><span></span><!----></div>\n        ')
    })

    it('should set the values of sub-templates when rendering', () => {
        const container = document.createElement('div')
        render(container, tpl`
            <ul>
                ${[
                    keyed(0)`<li>${0}</li>`,
                    keyed(1)`<li>
                        ${[
                            keyed(0)`<span>${'a'}</span>`,
                            keyed(1)`<span>${'b'}</span>`,
                        ]}
                    </li>`,
                    keyed(2)`<li>${2}</li>`,
                ]}
            </ul>
        `)
        expect(container.innerHTML).toBe(
            '\n            <ul>\n                <li>0<!----></li><li>\n                        ' +
            '<span>a<!----></span><span>b<!----></span><!---->\n                    </li><li>2<!----></li><!---->' +
            '\n            </ul>\n        ',
        )
        const firstLiElements = Array.from(container.querySelectorAll('li'))
        const firstSpanElements = Array.from(container.querySelectorAll('span'))

        render(container, tpl`
            <ul>
                ${[
                    keyed(0)`<li>${1}</li>`,
                    keyed(1)`<li>
                        ${[
                            keyed(0)`<span>${'c'}</span>`,
                            keyed(1)`<span>${'d'}</span>`,
                        ]}
                    </li>`,
                    keyed(2)`<li>${3}</li>`,
                ]}
            </ul>
        `)
        expect(container.innerHTML).toBe(
            '\n            <ul>\n                <li>1<!----></li><li>\n                        ' +
            '<span>c<!----></span><span>d<!----></span><!---->\n                    </li><li>3<!----></li><!---->' +
            '\n            </ul>\n        ',
        )
        const secondLiElements = Array.from(container.querySelectorAll('li'))
        const secondSpanElements = Array.from(container.querySelectorAll('span'))

        for (let i = 0; i < firstLiElements.length; i++) {
            expect(firstLiElements[i]).toBe(secondLiElements[i])
        }
        for (let i = 0; i < firstSpanElements.length; i++) {
            expect(firstSpanElements[i]).toBe(secondSpanElements[i])
        }
    })

    it('should reject using the same template key multiple times in the same array', () => {
        const container = document.createElement('div')
        expect(() => {
            render(container, tpl`
                <ul>
                    ${[
                        keyed(0)`<li></li>`,
                        keyed(0)`<li></li>`,
                    ]}
                </ul>
            `)
        }).toThrowError(Error)
    })

    it('should correctly handle updates of flatly nested fragments', () => {
        const container = document.createElement('div')
        const items = [
            {
                content: '1',
                id: 1,
                isImportant: false,
            },
            {
                content: '2',
                id: 2,
                isImportant: true,
            },
            {
                content: '3',
                id: 3,
                isImportant: false,
            },
        ]

        renderItems()
        items.splice(2)
        items.splice(1, 0, {
            content: '4',
            id: 4,
            isImportant: false,
        })
        items.push({
            content: '5',
            id: 5,
            isImportant: false,
        })
        renderItems()

        function renderItems() {
            render(container, tpl`
                <ul>
                    ${items.map((item) => keyed(item.id)`
                        ${item.isImportant ?
                            tpl`<li>${item.content}</li>`
                        :
                            tpl`<li><strong>${item.content}</strong></li>`
                        }
                    `)}
                </ul>
            `)
        }
    })
})
