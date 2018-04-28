# Rammy modules

Rammy modules are meant to hold reusable LaTeX snippets and `.tex` file templates.

Documentation:
* **[README.md](./README.md)**: General usage, command reference.
* **Modules.md** (this file): Information about Rammy modules, example templates and snippets.
* **[Changelog.md](./Changelog.md)**: Overview of changes in each version, including breaking changes.

# Module config

Any module needs a `.rammyrc.json` to work correctly. You can initialise a Rammy module in a folder using 
`rammy init-module <name>`. A typical `.rammyrc.json` will look like this:

```json
{
  "rammyVersion": "0.0.7",
  "name": "latex-common",
  "module": true,
  "templates": {
    "lecture-notes": {
      "description": "Template for lecture notes with useful shorthand commands.",
      "path": "./templates/lecture-notes.tex"  
    },
    "minimal": {
      "description": "Minimal template, useful for a fresh start.",
      "path": "./templates/minimal.tex"
    }
  },
  "snippets": {
    "symbols": {
      "description": "Common maths symbols.",
      "path": "./symbols.tex"  
    },
    "header": {
      "description": "A compact header for simple documents.",
      "path": "./header.tex"  
    }
  }
}
```

In the example above, there is one template - lectures-notes, and two snippets - symbols, header. Each of them has a
path and a description; the path should be relative to module's .rammyrc.json. You can define as many snippets and 
templates as you want.

For illustration purposes, consider the example module directory below.

```
.
├── .rammyrc.json
├── symbols.tex
├── header.tex
└── templates
    ├── lecture-notes.tex
    └── minimal.tex
```

# Templates

In essence, Rammy templates are just normal TeX files with special comments inside them. These comments let Rammy 
generate `.tex` files from the templates.

Ideally, templates should be valid TeX files. That is, users should be able to compile them directly using some TeX 
engine (without having to use Rammy). This is useful if your users want to preview templates before using them.

Consider the example config above. The `.tex` file for the `lectures-notes` template could look like this:

```latex
\documentclass{article}
\usepackage{hyperref}
\newcommand\HeaderTitle{\textbf{CS 666 Lecture Notes} by Timur Kuzhagaliyev}

%-- Rammy start ----------------
\input{../symbols.tex} % snippet: symbols
\input{../header.tex} % snippet: header
%-- Rammy end ------------------

\begin{document}

\section{Description}
This template was meant to be used for lecture notes.

\end{document}
```

Note that any LaTeX engine will easily compile this template - it's a perfectly valid TeX file since all Rammy specific
notes are in the comments. By default, Rammy only looks at the lines between `%-- Rammy start` and `%-- Rammy end`,
everything else is rendered as-is.

When a new `.tex` file is created from a template, the path for `\input` commands has to adjusted. This happens
automatically - Rammy uses comments of form `% <type>: <value>` to figure out how to update the path. Here are examples
of comments you can add to your `\input`s:

#### Referencing a snippet

Use a comment of form `% snippet: <name>` to reference a snippet. When this line will be rendered in a template, Rammy
will completely ignore the path in `\input{...}` - it will just use the snippet path from `.rammyrc.json`.
```latex
% This will compile directly as a TeX file and in a Rammy template:
\input{../symbols.tex} % snippet: symbols

% This is not a valid TeX file but will compile as a Rammy template:
\input{!@#$} % snippet: symbols
```

#### Referencing another template

Though this is generally not recommended, you can reference another template. Rules are similar to snippets:
```latex
% This will compile directly as TeX and in a Rammy template:
\input{./minimal.tex} % template: minimal
```

#### Referencing files by path

If there are `.tex` files in your module that are not exposed through templates or snippets, you can still include them
using relative or absolute paths. This is done using `% path: <type>` comment. Possible path types can be seen below.

```latex
% This will transform the path in `\input{...}` as if it was a relative to the current template.
\input{../templates/minimal.tex} % path: file-relative


% This will transform the path in `\input{...}` as if it was a relative to the current module.
% Not recommended - using this option might make your template an invalid TeX file.
\input{./templates/minimal.tex} % path: module-relative
```

If you want the path to be treated as absolute, you can just include it without any comments or add a `% path: absolute`
comment. Using absolute paths is not recommended since this will make your templates bound to your particular local
machine.


# Snippets

Snippets are standalone TeX files that are either too small or too specific to be templates. These could contain 
definition of new shorthand commands or package configurations. They are meant to be added to an existing TeX file 
using the `\input{...}` command.

> More information on snippets will be added at a later date.