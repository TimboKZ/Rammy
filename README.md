# ![Rammy](./assets/rammy-banner.png)

[![npm](https://img.shields.io/npm/v/rammy.svg)](https://www.npmjs.com/package/rammy)
[![npm](https://img.shields.io/npm/dt/rammy.svg)](https://www.npmjs.com/package/rammy)
[![Build Status](https://travis-ci.org/TimboKZ/Rammy.svg?branch=master)](https://travis-ci.org/TimboKZ/Rammy)
[![Build status](https://ci.appveyor.com/api/projects/status/5x1l205m023tfe5n/branch/master?svg=true)](https://ci.appveyor.com/project/TimboKZ/rammy/branch/master)
![David](https://img.shields.io/david/TimboKZ/Rammy.svg)

📝🛠️ Command line assistant and template manager for LaTeX projects.

Features:
* **LaTeX project setup** with Git support
* **Rammy modules** with templates and useful LaTeX snippets
* **TeX file generation** using templates from modules
* **TeX compilation** supporting several TeX engines
* **Directory cleaning** by removing auxiliary files

Documentation:
* **README.md** (this file): General usage, command reference.
* **[Modules.md](./Modules.md)**: Information about Rammy modules, example templates and snippets.
* **[Changelog.md](./Changelog.md)**: Overview of changes in each version, including breaking changes.

> Rammy is still in active development - any feedback is welcome! If you encounter a bug, please [create an issue](https://github.com/TimboKZ/Rammy/issues) so it can be fixed.
> Development branch status:
> [![Build Status](https://travis-ci.org/TimboKZ/Rammy.svg?branch=dev)](https://travis-ci.org/TimboKZ/Rammy)
> [![Build status](https://ci.appveyor.com/api/projects/status/5x1l205m023tfe5n/branch/dev?svg=true)](https://ci.appveyor.com/project/TimboKZ/rammy/branch/dev)

# Quick example

```bash
# Install Rammy
npm install -g rammy

# Prepare a folder for the project
mkdir my-project
cd my-project

# Initialise a Rammy project
rammy init
# Add `--git` flag to create a Git repo at the same time

# Add a Rammy module, we'll use https://github.com/TimboKZ/latex-common
rammy add TimboKZ/latex-common

# List available modules, templates, snippets
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

You can execute `rammy` or `rammy help <command>` in terminal for to view a brief overview of commands. This section has
a detailed description of each command.


------------


### Create a Rammy project

```bash
rammy init [directory] [--git]
```

Creates a Rammy project in the target directory. If no directory is specified, current directory is used. By default,
only creates a `.rammyrc.json` file.

When `--git` flag is supplied, Rammy executes `git init` (if necessary) and appends [the contents of
`TeX.gitignore`](./assets/TeX.gitignore) to `.gitignore`. `.gitignore` is created if it doesn't already exist. Using
this flag requires [Git](https://git-scm.com/) to be installed (for the `git` command).


------------


### Create a Rammy module

```bash
rammy init-module <name> [directory]
```

Creates a module `.rammyrc.json` in the specified directory. If no directory is specified, current directory is used.
The name should be command-line friendly, e.g. `latex-common`.

You only need to create a new Rammy module if you want to define some new templates or snippets.


------------


### Add a Rammy module

```bash
rammy add <module>
```

Adds a Rammy module to the current project. `<module>` can be one of the following:

1. Shorthand for a GitHub repository, e.g. `TimboKZ/latex-common`.
2. Valid Git URL, e.g. `git@github.com:TimboKZ/Rammy.git`. This doesn't have to be hosted on GitHub.
3. Local path, e.g. `./path/to/module`. When using a local path, you must supply the `--path` flag.

When using (1) or (2), Git logic might differ. If your Rammy project is inside a Git repository, the Rammy module folder
will be added as a Git submodule. If Rammy project is not inside a Git repository, the Rammy module will be simply
cloned. The project is always cloned into the directory where `.rammyrc.json` is located. See [Modules.md](./Modules.md)
for more details on how modules work.

If you don't want to or can't use Git, you can just place the module folder anywhere on your hard disk and use (3).


------------


### List details of available modules

```bash
rammy list [--modules-only]
```

Lists modules, templates and snippets discovered through the config. `--modules-only` or `-m` flag can be supplied to
only display module names.


------------


### Remove a module

```bash
rammy remove <module-name>
```

Removes a module by its name. You can find out what modules are installed using `rammy list`. Doesn't actually remove
the module folder, just erases it from the config.


------------


### Create a TeX file from a template

```bash
rammy create <file> <template>
```

Creates a TeX file using the specified template. The template can either be a full template name (e.g.
`latex-common/lecture-notes`), short template name (e.g. `lecture-notes`) or a path to a tex file (e.g. `
./path/to/template.tex`).


------------


### Add a snippet to existing TeX file

```bash
rammy extend <file> <snippet>
```

Adds a TeX snippet to an existing `.tex` file. Specified snippet name can either be a snippet name or a path to another
`.tex` file. Snippets are added through `\input{...}` commands - see [Modules.md](./Modules.md) for more details on how
snippets work.


------------


### Compile a TeX file into a PDF

```bash
rammy compile <file> [--clean]
```

Compiles a TeX file using either `pdflatex` or `latexmk`, depending on what is available. If none of these are
available, the command will fail.

`--clean` or `-c` flag can be supplied to delete auxiliary files afterwards. This is equivalent to running `rammy
compile <file>` followed by `rammy clean <file>`.


------------


### Cleaning auxiliary files

```bash
rammy clean [file]
```

Cleans the current working directory or the specified TeX file. If a TeX file is specified, e.g.
`rammy clean ./folder/doc.tex`, Rammy will scan the folder containing the TeX file and delete *relevant* `.aux`,
`.fdb_latexmk`, `.fls`, `.log`, `.out` and others. *Relevant* means files that share the same basename, e.g. `doc.aux`.


------------


# Contributing

Rammy is still in experimental phase so contributing at this stage is not recommended. You can [create an issue](https://github.com/TimboKZ/Rammy/issues) to start a discussion.

If you end up adding something, make sure `npm test` and `npm run lint` terminate without any errors before creating a
pull request.


# Notes about Rammy

Some planned features:
* `rammy fix <file>` command: If you move a generated `.tex` file around, relative paths might break. Rammy can fix most (if not all) of these paths thanks to metadata in comments. This command will do exactly that.
* Add redundancy checks to `rammy extend`: if a snippet is already a part of the file, Rammy will not import it again.
* Support more engines for `rammy compile`, make `rammy clean` more intelligent.

If you want to chat about this project you can join Rammy's [Discord server](https://discord.gg/B7QVaDb).

I wrote Rammy during my time at [Caltech](http://www.caltech.edu/), so I can't help but include this:

![CalTeX](./assets/caltex.png)
