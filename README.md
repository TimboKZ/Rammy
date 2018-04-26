# Rammy


[![npm](https://img.shields.io/npm/v/rammy.svg)](https://www.npmjs.com/package/rammy)
[![npm](https://img.shields.io/npm/dt/rammy.svg)](https://www.npmjs.com/package/rammy)


Command line assistant for LaTeX projects.

Features (implemented: [x], in development: [d]️, planned: [p]):
* [d] LaTeX project initialization (`.gitignore`, Git submodule with common snippets)
* [x] Modules with templates
* [x] Template-based `.tex` file generation
* [d] Directory cleaning (removing logs, `.aux` files, etc.)

# Installation

First, install [Node.js v6+](https://nodejs.org/). Then run the following command:

```bash
npm install -g rammy
```

This will install Rammy globally and expose the `rammy` command in the terminal.

# Commands

### `rammy init [target-directory]`
Interactively initialises a Rammy LaTeX project in the current directory. Creates `.rammyrc.json` config.


### `rammy init-module <name> [target-directory]`
Interactively initialises a Rammy module in the current directory. Creates `.rammyrc.json` config.


### `rammy add <path-to-module>`
Adds a module using the path to its folder. Folder name automatically becomes the module name.


###  `rammy remove <module-name>`
Removes modules by its name.


### `rammy list`
List currently available modules, templates and inputs.


### `rammy create <file> <template>`
Create a TeX file using the specified template.


### `rammy clean [file]`
Delete generated TeX files (`.aux`, `.log`, etc).
