# ignore-tpl

[![Build Status](https://travis-ci.org/jurca/ignore-tpl.svg?branch=master)](https://travis-ci.org/jurca/ignore-tpl)
![npm](http://img.shields.io/npm/v/@jurca/-x-ignore-tpl.svg)](https://www.npmjs.com/package/@jurca/-x-ignore-tpl)
[![License](https://img.shields.io/npm/l/@jurca/-x-ignore-tpl.svg)](LICENSE)

The ignore-tpl is the DOM renderer for the
[ignore.js](https://github.com/jurca/ignore.js/) project. Ignore-tpl provides
declarative high-performance DOM rendering using ES6 tagged template literals
instead of using code transpilation (which is used with
[JSX](https://reactjs.org/docs/introducing-jsx.html)). Also, unlike JSX, you
write actual HTML without the various gotchas (no comments support, you are
specifying properties instead of attributes, etc.).

## Installation

Install the project using npm:

```bash
npm i --save @jurca/-x-ignore-tpl
```

## Usage

The project can be used in a modern browser (anything except for IE) without
transpilation or polyfills. Usage in node.js requires transpilation (at least
until the TypeScript compiler will support outputting .mjs files or node.js
will allow the ES6 import/export syntax in .js files).

```javascript
import keyed from '/node_modules/@jurca/-x-ignore-tpl/keyed.js'
import render from '/node_modules/@jurca/-x-ignore-tpl/renderer.js'
import tpl from '/node_modules/@jurca/-x-ignore-tpl/tpl.js'

const exampleNode = document.createTextNode('example')

const simpleData = [
    undefined, // will not be rendered
    null, // will not be render
    'a string',
    123456,
    true, // will be rendered as 'true' (without the quotes)
    false, // will be rendered as 'false' (without the quotes)
    {foo: 'bar'}, // will be rendered as '[object Object]' (without the quotes)
]

const complexData = [
    {
        id: {value: 123},
        name: 'Joannete Doe',
        favouriteColors: [
            'magenta',
            'green',
        ],
    },
    {
        id: null,
        name: 'Xianert Smith',
        favouriteColors: [
            'red',
            'blue',
        ],
    },
]

const view = tpl`
    <div class="note">
        <img
            src="${
                'Attributes with dynamic values must contain a template litarl ' +
                'expression'
            }"
            alt="Mixing static attribute values with ${'dynamic parts'
                } does not work (and is not really needed anyway)"
            srcset="${
                `This is the correct way of composing static value if ${'dynamic ones'} in attributes`
                // Please note that attributes with dynamic values must use
                // double quotes (").
            }"
        >
        It's just HTML, self-closing elements are indeed self-closing.
        <button
            .disabled="${
                // Use the .property notation to set JS properties of elements
                // instead of attributes.
                false
            }"
            .onclick="${
                (event) => console.log('clicked!', event)
                /*
                    Use the DOM level 0 event listeners API, there is no
                    special event listener syntax. Since you need only up to
                    one event listener per element per event, there is little
                    need for the level 2 API
                    (addEventListener/removeEventLister). The down side of
                    this is that you cannot declaratively register event
                    listeners for the capture phase or a passive event
                    listener.
                */
            }"
        >
            Click me!
        </button>
        <button disabled="${null /* Setting an attribute to null or undefined removes it */}">No-op button</button>
    </div>
    <p>
        You can have as many top-level nodes as you want without using any
        additional helpers or a JSX fragment-like syntax.
    </p>
    <p>
        Any DOM node may be injected: ${exampleNode}
    </p>
    <p>
        Array that do not contain nested templates can be rendered easily as
        well: ${simpleData}<br>
        Note: Any array element that is not a template does not need any key
        and is keyed by its position in the array.
    </p>
    <p>
        Nested templates are supported too. These must have keys to allow
        efficient caching and smart efficient rendering.
        <ul>
            ${complexData.map((person) => keyed(person.id)`
                <!--
                    The key can be absolutely anything, including various
                    objects and null, except for undefined
                -->
                <li>
                    Name: ${person.name}<br>
                    Favourite colors:
                    <ul>
                        ${person.favouriteColors.map((color) => keyed(color)`
                            <li>${color}</li>
                        `)}
                    </ul>
                </li>
            `)}
        </ul>
    </p>
    <!-- comments are supported too, just cannot have dynamic content -->
`

// The view variable contains only the provided template source and values,
// templates are compiled lazily and only once.

// Compiles the template, creates an instace for the #app container and
// renders it.
render(document.getElementById('app'), view)
// Creates another instance of the already compiled template for the #app2
// container and renders it.
render(document.getElementById('app2'), view)
```

The `render` function is used both to initially render a template and to
update it. Consider the following simple example:

```javascript
import keyed from '/node_modules/@jurca/-x-ignore-tpl/keyed.js'
import render from '/node_modules/@jurca/-x-ignore-tpl/renderer.js'
import tpl from '/node_modules/@jurca/-x-ignore-tpl/tpl.js'

const numbers = []
let lastNumber = 0

function getView() {
    return tpl`
        Last 10 numbers:
        <ul>
            ${numbers.map((number) => keyed(number)`
                <li>${number}</li>
            `)}
        </ul>
        <p>
            Last number: ${lastNumber}
        </p>
    `
}

function update() {
    numbers.unshift(++lastNumber) // prepend a new number to the start
    numbers.splice(10) // limit the array length to the first 10 elements

    /*
        This will compile the template on the first call and render it into
        the #app element. After that, the render performs a smart incremental
        update:
         - only a single new <li> element is prepended to the start of the
           <ul> content
         - the last one (if there are 10 numbers already) is removed
         - and only the dynamic content parts *that receive a new content* are
           updated (the "last number" paragraph in this case, the other <li>
           elements have the same content they had previously and thus are not
           updated.
    */
    render(document.getElementById('app'), getView())
}

setInterval(update, 1000)

```

## About this project

This project is an improvement on the ignore.js
[0.0.x](https://github.com/jurca/ignore.js/tree/0.0.x)'s DOM rendering, which
is an iteration on
[this little experiment](https://github.com/jurca/reactive-component). After
experimenting with specifying a component template once and using callbacks
for dynamic parts, an approach more similar to
[hyper-html](https://github.com/WebReflection/hyperHTML) or
[lit-html](https://github.com/Polymer/lit-html) was chosen since the callback
syntax was way too verbose. Also, this project opted for using the
`<template>` element instead of a
[custom DOM parser](https://github.com/jurca/ignore.js/tree/0.0.x/template),
resulting in a simpler and more efficient code, while sacrificing the support
for setting `camelCase` properties declaratively (to be fair, those are
usually reflectd by DOM attributes on native HTML elements, and custom
elements can simply use `lowercase` or `snake_case` property names).
