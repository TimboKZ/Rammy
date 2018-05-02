# Rammy modules

Rammy modules are meant to hold reusable LaTeX snippets and `.tex` file templates.

Documentation:
* **[README.md](./README.md)**: General usage, command reference.
* **Modules.md** (this file): Information about Rammy modules, example templates and snippets.
* **[Changelog.md](./Changelog.md)**: Overview of changes in each version, including breaking changes.

> If you want a quick example, take a look at [my `latex-common` module](https://github.com/TimboKZ/latex-common).

# Philosophy

Rammy modules are meant to hold reusable TeX snippets and templates, so that every time you start a new LaTeX project
you don't have to write any boilerplate code yourself. Ideally, Rammy modules should be publicly available Git
repositories so that other people can make use of your code (and for your own convenience). See [Modules](#modules)
section for more info.

**Templates** are self-contained TeX documents that will be used to generate new files when `rammy create <file>
<template>` command is called. Ideally, templates should be directly compilable without using Rammy. See
[Templates](#templates) section for more info.

**Snippets** are collections of useful TeX commands. Unlike templates, snippet files don't have to be self-contained TeX
documents - that is, they don't need an `\documentclass{...}` or `\begin{document}`. The idea behind snippets is that
they should be easily addable to an *existing* TeX file. See [Snippets](#snippets) section for more info.

> **Note on terminology:** Since a lot of concepts apply to both templates and snippets, they are sometimes collectively
referred to as "components".


# Modules

The idea of a Rammy module is fairly simple: it is a folder that contains a Rammy config, `.rammyrc.json`, and a bunch
of `.tex` files. To make modules more useful, they could be made into Git repositories but that is not a strict
requirement.

Making your module a publicly available Git repository makes it much easier to use. First of all, it lets Rammy
automatically discover and download your module - for example, my personal collection of TeX snippets and templates is
[available on GitHub](https://github.com/TimboKZ/latex-common) in `TimboKZ/latex-common` repository, so I can add it to
any Rammy project using `rammy add TimboKZ/latex-common`. Secondly, it lets your users make use of
[Git submodules](https://git-scm.com/book/en/v2/Git-Tools-Submodules) - that is, if they have a repository for their
LaTeX project, your Rammy module will be added as a Git submodule to their repository. This makes keeping track of
module versions easy.

The most important file in your module is the config, `.rammyrc.json`, which you can create using `rammy init-module
<module-name>` command. It defines all templates and snippets available in your module. Users of your module can
reference these templates and snippets using either their full name, `ModuleName/template-name`, or the shorthand,
`template-name`.

**Note that** module, template and snippet names *must* be alphanumeric - using non-alphanumeric can result in undefined
behaviour from Rammy. Moreover, when choosing a name for your module, make sure it matches the name of your
folder/repository - this is not a strict requirement, but will make things much less confusing for your users.

`.rammyrc.json` should be at the root folder of your module. A typical `.rammyrc.json` can look like this:

```json
{
  "rammyVersion": "0.1.0",
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
      "description": "Common math symbols.",
      "path": "./snippet/symbols.tex"
    },
    "header": {
      "description": "A compact header for simple documents.",
      "path": "./snippet/header.tex"
    }
  }
}
```

In the example above there are two templates (`lecture-notes` and `minimal`) and two snippets (`symbols` and `header`).
Note that each template and snippet must have a `description` and a `path`. The description is used to give the user a
basic idea of what the component does - namely when `rammy list` command is used. This description should be simple and
concise - if you want to tell the user more, you can just add it as a comment into the `.tex` file itself. The path
represents the location of the `.tex` file corresponding to the component. The path should be relative to
`.rammyrc.json`. For example, the directory structure for `.rammyrc.json` shown above could look like this:

```
. (root)
├── .rammyrc.json
└── templates (folder)
    ├── lecture-notes.tex
    └── minimal.tex
└── snippets (folder)
    ├── symbols.tex
    └── compact-header.tex
```

Keep this directory structure in mind - it will be referred to later in this document.


# Templates

In essence, Rammy templates are just normal TeX files with special comments inside them. Because of this, most of the
time your templates will have a `.tex` extension. These comments provide metadata and useful information about the
template, which lets Rammy do cool things like figure out relative paths and add extra commands.

> **Note on terminology:** Remember that there are two files involved: one is the template, i.e. the `.tex` file that
you defined as the author of the module. I will refer to this file as "the template". The second file is the `.tex` file
that the user will generate based on your template. I will refer to it as "the generated file".

Using templates to generate `.tex` file is a pretty straightforward process: when a user executes the
`rammy create <file> <template>` command, Rammy copies template `.tex` file to the location specified in `<file>` and
makes some minor changes to it.

By default, Rammy doesn't scan the entire template to look for things to modify. It only looks at the special parts of
the template, namely the lines that contain comments that begin with `%--`. The most important part of the template is
the "Rammy section" - zero or more lines surrounded by `%-- Rammy start` and `%-- Rammy end` comments. Although Rammy
can read the entire template, it will only ever modify lines in the Rammy section.

Rammy section can contain references to snippets, useful metadata or just more comments. Sections below cover the things
you can put into the Rammy section of your template. If a Rammy section does not exist when you use a command that
requires it, e.g. `rammy extend <file> <snippet>`, it will be added to the document. You can put your own comments or
commands into this section - if Rammy can't understand during a scan, they will just be ignored.

For the most part, Rammy sees your templates as simple text files. Because of this, Rammy really doesn't care about
anything outside of the Rammy section, so you can put anything you want in your template. That said, ideally, your
templates should be valid TeX files that are directly compilable. Being able to compile your templates directly is
useful if you want to provide your users with pre-compiled `.pdf`s of your templates as a preview.

Consider the directory structure we've shown in the end of the [Modules](#modules) section. Here's an example of a good
Rammy template that could correspond to `lecture-notes.tex`:

```latex
%-- summary: Template for lecture notes with a lot of useful snippets.

\documentclass{article}

% Title for the `compact-header` snippet
\newcommand\HeaderTitle{\textbf{CS 153 Lecture Notes} by Timur Kuzhagaliyev}

%-- Rammy start ----------------
\input{../symbols.tex} %-- snippet: symbols
\input{../compact-header.tex} %-- snippet: compact-header
%-- Rammy end ------------------

% Don't wrap long matrices
\setcounter{MaxMatrixCols}{20}

\begin{document}


%-- example usage start
\section{Lecture notes template}
This template was meant to be used for lecture notes.

\section{Features}
It has a lot of useful
shorthand commands defined that make writing math formulas easy:
$$ \norm{\M^{m \x n}} \ra \inr{v, u}$$
%-- example usage end


\end{document}
```

This is a good template because it provides descriptive comments, both normal `%` and Rammy-style `%--`. You can see
that the purpose of each command is explained, and when special commands are defined to configure Rammy snippets the
comments state explicitly which snippet is targeted. Additionally, the example usage section is clearly outlined, so the
user knows it's safe to delete it without breaking the template.

> Future versions of Rammy can make use of comments like `%-- summary:` and `%-- example usage start`/`end` to improve
use experience, so you are encouraged to include them too, although this is not a strict requirement.

If you look at the Rammy section, you'll see that it contains a bunch of `\input{...}` commands with special comments.
When a new `.tex` file is created from a template, the path for `\input` commands has to adjusted. This happens
automatically - Rammy uses comments of form `%-- <type>: <value>` to figure out how to update the path. Below you can
find the outline of things you can include in these comments.

#### Referencing a snippet

Use a comment of form `% snippet: <name>` to reference a snippet. When this line will be rendered in a template, Rammy
will completely ignore the path in `\input{...}` - it will just use the snippet path from `.rammyrc.json`.
```latex
% This will compile directly as a TeX file and in a Rammy template:
\input{../snippets/symbols.tex} % snippet: symbols

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
definitions of new shorthand commands or package configurations. They are meant to be used in Rammy templates or added
to existing TeX files using the `\input{...}` command.

Remember that your snippet `.tex` files will be used directly - this means that they should always be valid TeX files.
Of course, they don't have to be self-contained - that is, they don't need to have their own `\documentclass{...}` or
anything similar since an external template will probably do that for them.

Remember to include plenty of comments in your snippet to explain what the snippet does. If you need the user to
configure your snippet somehow, you can ask your users to define some command for you using `\newcommand`, and then,
inside of your snippet file, use `\providecommand` to define a default value. Read more on this
[here](https://tex.stackexchange.com/q/36175). You can also use some clever TeX tricks like
[conditional expressions](https://tex.stackexchange.com/q/5894).

Your snippets can be added to existing `.tex` files using `rammy extend <file> <snippet>`. If the specified file already
has a Rammy section, then the snippet will be added to the end of the Rammy section using the `\input` command. If the
file is corrupted and Rammy can find `%-- Rammy start` but not `%-- Rammy end`, then the snippet will be added right
after `%-- Rammy start`. If the specified file does not already have a Rammy section, it will be created.

Consider the directory structure we've shown in the end of the [Modules](#modules) section. Here's an example of a Rammy
snippet that could correspond to `lecture-notes.tex`:

```latex
%-- summary: Compact header for a document.

% The title for the header is specified using the \HeaderTitle command.
% If this command was not defined, the default value below will be used.
\providecommand\HeaderTitle{Untitled Document}

\usepackage{fancyhdr}
\usepackage[
  top=2cm,
  bottom=2cm,
  left=2cm,
  right=2cm,
  headheight=17pt,
  includehead,includefoot,
  heightrounded,
]{geometry}
\pagestyle{fancy}
\lhead{\HeaderTitle}
\rhead{Page \thepage}
```

Notice how this snippet lets users define a `\HeaderTitle` command to provide their own title, but still uses
`\providecommand` to define the default value. In terms of comments, the rules are pretty much the same as for
templates, except in snippets you don't want to put an `%-- example usage` section. Instead, use normal comments `%` to
explain how to use the snippet.
