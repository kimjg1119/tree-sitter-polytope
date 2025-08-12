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

(int_literal_expr) @number
(string_literal_expr) @string
(identifier) @variable

(binary_op) @operator
(unary_op) @operator