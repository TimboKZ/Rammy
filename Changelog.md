# Rammy changelog

Documentation:
* **[README.md](./README.md)**: General usage, command reference.
* **[Modules.md](./Modules.md)**: Information about Rammy modules, example templates and snippets.
* **Changelog.md** (this file): Overview of changes in each version, including breaking changes.

-------------------------------------------------------------------------


# v0.0.10:

Fixes:
* Fixed the bug where modules added through the full Git URL will have `.git` in their folder names.

New features:
* You can now use `rammy add ...` command on modules.


-------------------------------------------------------------------------


# v0.0.9:

Fixes:
* Fixed `rammy-cli` syntax issue on Node v6.


-------------------------------------------------------------------------


# v0.0.8:

Fixes:
* When initialising a Git repo using `rammy init --git`, Rammy now uses Windows-style line endings on Windows when
creating/extending the `.gitignore` file.
* Replaced `path` package with `upath` for more consistent line endings (especially on Windows).


-------------------------------------------------------------------------


# v0.0.7

**Breaking changes:**
* By default, Rammy will not parse the whole template. Everything in template will be rendered as-is, except for the
commands between `%-- Rammy start` and `%-- Rammy end`. See [Modules file](./Modules.md) for more info.
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
* The `--git` flag in `rammy init --git` now works as intended.


-------------------------------------------------------------------------


# v0.0.6

First documented release.
