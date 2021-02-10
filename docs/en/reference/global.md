# (global)
## ▶️ `generator.createMarkdownFiles`
`function` · Create Markdown files in the specified directory with given namespaces.

**Parameters:**
* **`outdir`** (`String`): Directory to create files in
* **`namespaces`** (`[parser.Namespace]`): Namespaces to generate Markdown files with

## ▶️ `generator.generateMarkdown`
`function` · Generate a Markdown file given a namespace.

**Parameters:**
* **`namespace`** (`parser.Namespace`): Namespace to generate Markdown with

## ▶️ `parser.parse`
`function` · Parse all supplied code and return namespaces containing references.

**Parameters:**
* **`input`** (`String`): Input code to parse

**Returns:** `[parser.Namespace]` · List containing `parser.Namespace` instances

## 🎛️ `references.Parameter`
`class` · A reference to a parameter that is part of a code entity.

**Parameters:**
* **`identifier`** (`String`): The identifier of the parameter
* **`type`** (`String` = `"*"`): The datatype that a value should be of when used as an argument for this parameter
* **`description`** (`String` = `""`): A description of the parameter. Leave blank if there's no description
* **`defaultValue`** (`String` = `"undefined"`): The default value the parameter will be if there is no matching argument specified

## 🔡️ `references.Parameter.defaultValue`
`prop <String>`

## 🔡️ `references.Parameter.description`
`prop <String>`

## 🔡️ `references.Parameter.identifier`
`prop <String>`

## 🔡️ `references.Parameter.type`
`prop <String>`

## 🎛️ `references.Reference`
`class` · Reference object containing documentable information about a code entity.

## 🔡️ `references.Reference.name`
`prop <null | String>` · Identifier or reference chain of code entity

## 🔡️ `references.Reference.parameters`
`prop <[references.Parameter]>` · A list of parameter references that code entity takes, if any.

## 🎛️ `references.Reference.returns`
`class <references.Return>` · A return object that code entity gives, if any.

## 🔡️ `references.Reference.synopsis`
`prop <String>` · The synopsis describing code entity.
Leave this blank if there is no synopsis.

## 🔡️ `references.Reference.type`
`prop <String>` · The type of code entity that is being referenced.


First word (item delimited by space) be any of:
* `"function"` for a function (defined by `function` keyword)
* `"class"` for a class (defined by `class` keyword), `"extends"` can be
  concatenated after a space to represent a class extension
* `"method"` for a class method
* `"static"` for a static class method (defined by `static` keyword)
* `"prop"` for a class property (typically referenced as
  `this.propName`)
* `"const"` for a constant variable (defined by `const` keyword)
* `"var"` for a variable (typically defined by `var` keyword)
* `"generator"` for a generator function (defined by `function*` syntax)


May also be anything else, but this is discouraged. If the type is a
`"prop"`, `"const"` or `"var"`, the type's datatype annotation can also
be concatenated after a space.

## 🎛️ `references.Return`
`class` · A reference to a value that a code entity returns.

**Parameters:**
* **`type`** (`String` = `"undefined"`): The datatype of the value that is returned
* **`description`** (`String` = `""`): A description of the return. Leave blank if there's no description

## 🔡️ `references.Return.description`
`prop <String>`

## 🔡️ `references.Return.type`
`prop <String>`

## ▶️ `references.parseComment`
`function` · Parse a comment's type annotations to generate a code reference.

**Parameters:**
* **`comment`** (`String`): Contents of comment to parse, excluding opening and closing comment syntax

**Returns:** `references.Reference` · The generated code reference instance

## ▶️ `tree.clean`
`function` · Delete directory and its contents if it doesn't exist.

**Parameters:**
* **`dir`** (`String`): Directory to delete

## ▶️ `tree.squash`
`function` · Get all contents of specified JavaScript files.

**Parameters:**
* **`files`** (`[String]`): List of files to extract contents of (may include non-JS files)

**Returns:** `String` · Concatenated contents of all JavaScript files

## ▶️ `tree.walk`
`function` · Get a list of paths to files in a directory.

**Parameters:**
* **`dir`** (`String`): Root path of directory to traverse

**Returns:** `[String]` · List of traversed file paths