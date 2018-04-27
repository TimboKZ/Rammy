# Rammy


[![npm](https://img.shields.io/npm/v/rammy.svg)](https://www.npmjs.com/package/rammy)
[![npm](https://img.shields.io/npm/dt/rammy.svg)](https://www.npmjs.com/package/rammy)


Command line assistant for LaTeX projects.

Features:
* *LaTeX project setup* with Git support
* *Rammy modules* with templates and useful LaTeX snippets
* *`.tex` file generation* using templates from modules
* *`.tex` compilation* supporting several TeX engines
* *Directory cleaning* by removing logs, `.aux` files, etc.

# Quick example

```bash
# Install Rammy
npm install -g rammy

# Prepare a folder for the project
mkdir my-project
cd my-project

# Initialise a Rammy project
rammy init --git
# `--git` flag creates a Git repo and adds a TeX `.gitignore`
# * Requires `git` to be installed

# Add a Rammy module, we'll use `https://github.com/TimboKZ/latex-common`
rammy add TimboKZ/latex-common

# List available modules, templates, inputs
rammy list

# Create a TeX file from `lecture-notes` template
rammy create notes.tex lecture-notes

# Compile the .tex file into a .pdf, requires `pdflatex` command
rammy compile notes.tex

# Delete logs, .aux files, etc.
rammy clean
```

# Installation

First, install [Node.js v6+](https://nodejs.org/). Then run the following command:

```bash
npm install -g rammy
```

This will install Rammy globally and expose the `rammy` command in the terminal.

# Commands


### Create a Rammy project

Command:
```bash
rammy init [directory] [--git]
```

Creates a Rammy project in the target directory. If no directory is specified, current directory is used. By default, only creates a `.rammyrc.json` file. When `--git` flag is supplied, Rammy executes `git init` (if necessary) and appends [the contents of `TeX.gitignore`](./assets/TeX.gitignore) to `.gitignore`. `.gitignore` is created if it doesn't already exist. Using the `--git` flag requires [Git](https://git-scm.com/) to be installed (for the `git` command).

------------


### Create a Rammy module

Command:
```bash
rammy init-module <name> [directory]
```

Creates a module `.rammyrc.json` in the specified directory. If no directory is specified, current directory is used. The name should be command-line friendly, e.g. `latex-common`.

------------


### `rammy add <module>`
Adds a Rammy module. `<module>` can be a GitHub repo name (e.g. `TimboKZ/latex-common`) or a Git url (e.g.
`https://github.com/TimboKZ/latex-common`). Additionally, you can add a module by path, but you'll need to add the
`--path` flag (e.g. `rammy add ./my-folder/ --path`). If the added module doesn't have a `.rammyrc.json`, folder name
is used as the module name.


###  `rammy remove <module-name>`
Removes modules by its name.


### `rammy list`
List currently available modules, templates and inputs.


### `rammy create <file> <template>`
Create a TeX file using the specified template.


### `rammy clean [file]`
Delete generated TeX files (`.aux`, `.log`, etc).
