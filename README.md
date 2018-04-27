# Rammy


[![npm](https://img.shields.io/npm/v/rammy.svg)](https://www.npmjs.com/package/rammy)
[![npm](https://img.shields.io/npm/dt/rammy.svg)](https://www.npmjs.com/package/rammy)


Command line assistant for LaTeX projects.

Features:
* **LaTeX project setup** with Git support
* **Rammy modules** with templates and useful LaTeX snippets
* **`.tex` file generation** using templates from modules
* **`.tex` compilation** supporting several TeX engines
* **Directory cleaning** by removing logs, `.aux` files, etc.

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

# Add a Rammy module, we'll use `https://github.com/TimboKZ/latex-common`
rammy add TimboKZ/latex-common

# List available modules, templates, inputs
rammy list

# Create a TeX file from `lecture-notes` template
rammy create notes.tex lecture-notes

# Compile the .tex file into a .pdf
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

You can `rammy` or `rammy help <command>` in terminal for brief overview of commands. This section has detailed descriptions of each command.

------------


### Create a Rammy project

```bash
rammy init [directory] [--git]
```

Creates a Rammy project in the target directory. If no directory is specified, current directory is used. By default, only creates a `.rammyrc.json` file. When `--git` flag is supplied, Rammy executes `git init` (if necessary) and appends [the contents of `TeX.gitignore`](./assets/TeX.gitignore) to `.gitignore`. `.gitignore` is created if it doesn't already exist. Using the `--git` flag requires [Git](https://git-scm.com/) to be installed (for the `git` command).

> `--git` functionality is still in development and is currently unavailable.

------------


### Create a Rammy module

```bash
rammy init-module <name> [directory]
```

Creates a module `.rammyrc.json` in the specified directory. If no directory is specified, current directory is used. The name should be command-line friendly, e.g. `latex-common`.

------------


### Add a Rammy module

```bash
rammy add <module>
```

Adds a Rammy module to the current project. `<module>` can be one of the following:

1. Shorthand for a GitHub repository, e.g. `TimboKZ/latex-common`.
2. Valid Git URL, e.g. `git@github.com:TimboKZ/Rammy.git`. This doesn't have to be hosted on GitHub.
3. Local path, e.g. `./path/to/module`. When using a local path, you must supply the `--path` flag.

When using (1) or (2), Git logic might differ. If your Rammy project is inside a Git repository, the Rammy module folder will be added as a Git submodule. If Rammy project is not inside a Git repository, the Rammy module will be simply cloned. The project is always cloned into the directory where `.rammyrc.json` is located.

If you don't want to or can't use Git, you can just place the module folder anywhere on your hard disk and use (3).


------------


### List details of available modules

```bash
rammy list [--modules-only]
```

Lists modules, templates and inputs discovered through the config. `--modules-only`/`-m` flag can be supplied to only display module names.


------------


### Remove a module

```bash
rammy remove <module-name>
```

Removes a module by its name. You can find out what modules are installed using `rammy list`.


------------


### Create a TeX file from a template

```bash
rammy create <file> <template>
```

Creates a TeX file using the specified template.


------------


### Compile a TeX file into a PDF

```bash
rammy compile <file> [--clean]
```

Compiles a TeX file using either `pdflatex` or `latexmk`, depending on what is available. If no supported commands are found, the command will fail. `--clean`/`-c` flag can be supplied to delete auxiliary files afterwards. This is equivalent to running `rammy compile <file>` followed by `rammy clean <file>`.


------------


### Cleaning auxiliary files

```bash
rammy clean [file]
```

Cleans the current working directory or the specified TeX file. If a TeX file is specified, e.g. `rammy clean ./folder/doc.tex`, Rammy will scan the folder containing the TeX file and delete *relevant* `.aux`, `.fdb_latexmk`, `.fls`, `.log`, `.out` and others. *Relevant* means files that share the same basename, e.g. `doc.aux`.


# Contributing

Rammy is still in experimental phase so contributing at this stage is not recommended. You can [create an issue](https://github.com/TimboKZ/Rammy/issues/new) to start a discussion.
