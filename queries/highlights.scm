[
  "input"
  "output"
  "solution"
  "satisfies"
  "if"
  "else"
  "for"
  "print"
  "var"
] @keyword

[
  "int"
  "string"
] @type

(int_literal) @number
(string_literal) @string
(id) @variable

[
  "+"
  "-"
  "*"
  "/"
  "%"
  "=="
  "!="
  "<"
  ">"
  "<="
  ">="
  "&&"
  "||"
  "!"
] @operator