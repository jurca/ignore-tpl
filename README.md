# ignore-tpl

The ignore-tpl is the DOM renderer for the [ignore.js](https://github.com/jurca/ignore.js/) project. Ignore-tpl
provides declarative high-performance DOM rendering using ES6 tagged template literals instead of using code
transpilation (which is used with [JSX](https://reactjs.org/docs/introducing-jsx.html)). Also, unlike JSX, you write
actual HTML without the (no comments support, you are specifying properties instead of attributes, etc.).

## About this project

This project is an improvement on the ignore.js [0.0.x](https://github.com/jurca/ignore.js/tree/0.0.x)'s DOM rendering,
which is an iteration on [this little experiment](https://github.com/jurca/reactive-component). After experimenting
with specifying a component template once and using callback for dynamic parts, an approach more similar to
[hyper-html](https://github.com/WebReflection/hyperHTML) or [lit-html][https://github.com/Polymer/lit-html] since the
callback syntax was way too verbose. Also, this project opted for using the `<template>` element instead of
[custom DOM parser](https://github.com/jurca/ignore.js/tree/0.0.x/template), resulting in simpler and more efficient
code, while sacrificing the support for setting `camelCase` properties declaratively (to be fair, those are usually
reflectd by DOM attributes on native HTML elements, and custom elements can simply use `lowercase` or `snake_case`
property names).
