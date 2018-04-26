# Rammy

Command line assistant for LaTeX projects.

Features (implemented: ✅, in development: ⚜️, planned: 💤):
* ⚜ LaTeX project initialization (`.gitignore`, Git submodule with common snippets)
* ⚜ Template-based `.tex` file generation
* ⚜ Directory cleaning (removing logs, `.aux` files, etc.)

# Installation

First, install [Node.js v6+](https://nodejs.org/). Then run the following command:

```bash
npm install -g rammy
```

This will install Rammy globally and expose the `rammy` command in the terminal.

# Commands

## `rammy init`

Interactively initialises a Rammy LaTeX project in the current directory. Creates `.rammyrc.json` config.

I
