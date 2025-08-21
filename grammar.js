/**
 * @file Parser of Polytope
 * @author Jungyeom Kim <kimjg1199lock@gmail.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check
const KEYWORDS = [
  "input",
  "output",
  "solution",
  "satisfies",
  "if",
  "else",
  "for",
  "while",
  "print",
  "continue",
  "break",
  "var",
  "int",
  "string",
  "bool",
  "def",
  "true",
  "false",
  // quantifier
  "forall",
  // restriction-related
  "distinct",
  "sorted",
  "in_range",
  "asc",
  "desc",
  "nondecreasing",
  "nonincreasing",
];
const sep = (p, c) => optional(sep1(p, c));
const sep1 = (p, c) => seq(p, repeat(seq(c, p)));

module.exports = grammar({
  name: "polytope_parser",
  word: $ => $.identifier,

  rules: {
    main: ($) => seq(field("input", $.input), field("output", $.output), field("solution", $.solution)),

    identifier: $ => /[a-zA-Z_][a-zA-Z0-9_]*/,

    input: ($) =>
      seq(
        "input",
        "{",
        field("body", repeat($.input_line)),
        "}",
        "satisfies",
        "{",
        field("restriction", repeat($._restriction)),
        "}"
      ),
    _restriction: ($) => choice($.expr_stmt, $.distinct_stmt, $.sorted_stmt, $.in_range_stmt, $.forall_stmt),
    output: ($) =>
      seq("output", "{", field("body", repeat($.output_line)), "}"),
    solution: ($) => seq("solution", "{", field("body", repeat($._stmt)), "}"),

    io_target: ($) => seq(field("id", $.identifier), ":", field("type", $._type)),
    input_line: ($) => seq(field("targets", sep1($.io_target, ",")), ";"),
    output_line: ($) => seq(field("targets", sep1($.io_target, ",")), ";"),

    _stmt: ($) =>
      choice(
        $.assign_stmt,
        $.if_stmt,
        $.for_stmt,
        $.while_stmt,
        $.print_stmt,
        $.decl_stmt,
        $.continue_stmt,
        $.break_stmt,
        $.expr_stmt
      ),

    assign_stmt: ($) =>
      seq(choice($.identifier, $.index_expr), field("op", $.assign_op), $._expr, ";"),
    if_stmt: ($) =>
      prec.right(seq(
        "if",
        "(",
        field("cond", $._expr),
        ")",
        choice(
          seq("{", field("then", repeat($._stmt)), "}"),
          field("then", $._stmt)
        ),
        optional(seq(
          "else",
          choice(
            seq("{", field("else", repeat($._stmt)), "}"),
            field("else", $._stmt)
          )
        ))
      )),
    for_stmt: ($) =>
      prec.left(10, seq(
        "for",
        "(",
        field("lb", $._expr),
        "<=",
        field("id", $.identifier),
        "<=",
        field("ub", $._expr),
        ")",
        choice(
          seq("{", field("body", repeat($._stmt)), "}"),
          field("body", $._stmt)
        )
      )),
    while_stmt: ($) =>
      seq(
        "while",
        "(", field("cond", $._expr), ")",
        choice(
          seq("{", field("body", repeat($._stmt)), "}"),
          field("body", $._stmt)
        )
      ),
    print_stmt: ($) => seq("print", "(", field("expr", $._expr), ")", ";"),
    decl_stmt: ($) => seq($._decl, ";"),
    continue_stmt: ($) => seq("continue", ";"),
    break_stmt: ($) => seq("break", ";"),
    expr_stmt: ($) => seq($._expr, ";"),

    assign_op: ($) => choice("=", "+=", "-=", "*=", "/=", "%="),

    // --------------------
    // Restriction statements (each ends with ';')
    // --------------------
    distinct_stmt: ($) => seq("distinct", "(", field("target", $.identifier), ")", ";"),
    sorted_stmt: ($) =>
      seq(
        "sorted",
        "(",
        field("target", $.identifier),
        optional(seq(
          ",",
          field("order", $.sort_order)
        )),
        ")",
        ";"
      ),
    sort_order: ($) => choice("asc", "desc", "nondecreasing", "nonincreasing"),
    in_range_stmt: ($) =>
      seq(
        "in_range",
        "(",
        field("target", choice($.identifier, $.index_expr)),
        ",",
        field("lb", $._expr),
        ",",
        field("ub", $._expr),
        ")",
        ";"
      ),

    // forall 1 <= i <= N | predicate;
    forall_stmt: ($) =>
      prec.left(10, seq(
        "forall",
        field("lb", $._expr),
        "<=",
        field("id", $.identifier),
        "<=",
        field("ub", $._expr),
        "|",
        field("pred", $._expr),
        ";"
      )),

    _decl: ($) => choice($.var_decl, $.function_decl),
    function_decl: ($) => seq("def", $.identifier, "(", repeat(seq($.identifier, ":", $._type)), ")", "{", field("body", repeat($._stmt)), "}"),

    var_decl: ($) =>
      seq(
        "var",
        field("id", $.identifier),
        ":",
        field("ty", $._type,),
        field("value", optional(seq("=", $._expr)))
      ),

    _expr: ($) =>
      choice($.paren_expr, $.call_expr, $.index_expr, $.identifier, $.int_literal_expr, $.string_literal_expr, $.bool_literal_expr, $.unary_expr, $.binary_expr),
    index_expr: ($) =>
      seq(field("array", $.identifier), "[", field("index", $._expr), "]"),

    paren_expr: ($) => seq("(", field("expr", $._expr), ")"),

    call_expr: ($) =>
      seq(
        field("callee", $.identifier),
        "(",
        field("argument", sep($._expr, ",")),
        ")"
      ),
    int_literal_expr: ($) => /\d+/,
    string_literal_expr: ($) => seq('"', repeat(/[^"]|\\["\\]/), '"'),
    bool_literal_expr: ($) => choice("true", "false"),
    unary_expr: ($) => prec.right(5, seq(field("op", $.unary_op), field("expr", $._expr))),
    binary_expr: ($) =>
      choice(
        prec.left(1, seq(
          field("left", $._expr),
          field("op", alias(choice("&&", "||"), $.binary_op)),
          field("right", $._expr)
        )),
        prec.left(2, seq(
          field("left", $._expr),
          field("op", alias(choice("==", "!=", "<", "<=", ">", ">="), $.binary_op)),
          field("right", $._expr)
        )),
        prec.left(3, seq(
          field("left", $._expr),
          field("op", alias(choice("+", "-"), $.binary_op)),
          field("right", $._expr)
        )),
        prec.left(4, seq(
          field("left", $._expr),
          field("op", alias(choice("*", "/", "%"), $.binary_op)),
          field("right", $._expr)
        ))
      ),

    _op: ($) => choice($.unary_op, $.binary_op),

    unary_op: ($) => choice("+", "-", "!", "~"),
    binary_op: ($) => choice(
      "&&", "||",
      "==", "!=", "<", "<=", ">", ">=",
      "+", "-",
      "*", "/", "%"
    ),
<<<<<<< Current (Your changes)
    _type: ($) => choice($.atomic_type, $.array_type),
    array_type: ($) => seq(field("elem", $._type), "[", field("size", $._expr), "]"),
=======
    _type: ($) => choice($.atomic_type, $.array_type, $.vector_type),
    // Array type: only allows static, literal sizes; explicit 'array:' discriminator
    array_type: ($) =>
      seq(
        field("elem", $._type),
        "[",
        "array",
        ":",
        field("size", $.int_literal_expr),
        "]"
      ),
    // Vector type: allows any expression size, e.g., int[N]
    vector_type: ($) => seq(field("elem", $._type), "[", field("size", $._expr), "]"),
>>>>>>> Incoming (Background Agent changes)
    atomic_type: ($) => choice("int", "string", "bool"),
  },
});
