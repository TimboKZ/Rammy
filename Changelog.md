# Rammy changelog

# v0.0.7

**Breaking changes:**

* Rammy-managed areas of `.tex` files now has to be delimited. `TODO: Add details`
* New template structure (see [Modules file](./Modules.md) for more info). Before, TeX templates for Rammy would use 
intrusive syntax, e.g.:
    ```latex
    \input{%MODULE_HOME%/my/snippet.tex}
    ```
    
    Trying to compile a  `.tex` file with the old syntax would result in an error. The new syntax is much less 
    intrusive and relies on comments:
    
    ```latex
    \input{../my/snippet.tex} % path: module-relative
    ```
    
New features:

* More warnings on incorrect use/configuration.
* `rammy create <file> <template>` now accepts a path to a `.tex` file as the `<template>`.

# v0.0.6

First documented release.
