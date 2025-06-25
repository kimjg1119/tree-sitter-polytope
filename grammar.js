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
  "print",
  "var",
  "int",
  "string",
];
const blocked = (p) => seq("{", p, "}");
const sep = (p, c) => optional(sep1(p, c));
const sep1 = (p, c) => seq(p, repeat(seq(c, p)));
const sep1opt = (p, c) => seq(sep1(p, c), optional(c));

module.exports = grammar({
  name: "polytope_parser",
  word: $ => $.id,

  rules: {
    source_file: ($) => seq(field("input", $.input), field("output", $.output), field("solution", $.solution)),

    id: $ => /[a-zA-Z_][a-zA-Z0-9_]*/,

    input: ($) =>
      seq(
        "input",
        "{",
        field("body", repeat($.input_line)),
        "}",
        "satisfies",
        "{",
        field("restriction", sep($._restriction, ";")),
        "}"
      ),
    _restriction: ($) => $.expr_stmt,
    output: ($) =>
      seq("output", "{", field("body", repeat($.output_line)), "}"),
    solution: ($) => seq("solution", "{", field("body", repeat($._stmt)), "}"),

    io_target: ($) => seq(field("id", $.id), ":", field("type", $._type)),
    input_line: ($) => seq(field("targets", sep1($.io_target, ",")), ";"),
    output_line: ($) => seq(field("targets", sep1($.io_target, ",")), ";"),

    _stmt: ($) =>
      choice(
        $.assign_stmt,
        $.if_stmt,
        $.for_stmt,
        $.print_stmt,
        $.decl_stmt,
        $.expr_stmt
      ),

    assign_stmt: ($) => seq($.id, "=", $._expr, ";"),
    if_stmt: ($) =>
      seq(
        "if",
        "(",
        field("cond", $._expr),
        ")",
        "{",
        field("then", repeat($._stmt)),
        "}",
        optional(seq("else", "{", field("else", repeat($._stmt)), "}"))
      ),
    for_stmt: ($) =>
      prec.left(10, seq(
        "for",
        "(",
        field("lb", $._expr),
        "<=",
        field("id", $.id),
        "<=",
        field("ub", $._expr),
        ")",
        "{",
        field("body", repeat($._stmt)),
        "}"
      )),
    print_stmt: ($) => seq("print", "(", field("expr", $._expr), ")", ";"),
    decl_stmt: ($) => seq($._decl, ";"),
    expr_stmt: ($) => seq($._expr, ";"),

    _decl: ($) => choice($.var_decl),
    var_decl: ($) => seq("var", sep1($.single_var_decl, ",")),
    single_var_decl: ($) =>
      seq(
        field("id", $.id),
        ":",
        $._type,
        field("value", optional(seq("=", $._expr)))
      ),

    _expr: ($) =>
      choice($.refer_expr, $.call_expr, $.int_literal, $.string_literal, $._op),

    refer_expr: ($) => $.id,
    call_expr: ($) =>
      seq(
        field("callee", $.id),
        "(",
        field("argument", sep($._expr, ",")),
        ")"
      ),
    int_literal: ($) => /\d+/,
    string_literal: ($) => seq('"', repeat(/[^"]|\\["\\]/), '"'),

    _op: ($) => choice($.binary_op, $.unary_op),

    unary_op: ($) => prec.right(2, seq(choice("+", "-", "!", "~"), $._expr)),
    binary_op: ($) =>
      choice($.multiplication_op, $.addition_op, $.comparison_op, $.logical_op),
    multiplication_op: ($) =>
      prec.left(4, seq($._expr, choice("*", "/", "%"), $._expr)),
    addition_op: ($) => prec.left(3, seq($._expr, choice("+", "-"), $._expr)),
    comparison_op: ($) =>
      prec.left(
        2,
        seq($._expr, choice("==", "!=", "<", "<=", ">", ">="), $._expr)
      ),
    logical_op: ($) => prec.left(1, seq($._expr, choice("&&", "||"), $._expr)),

    _type: ($) => choice("int", "string"),
  },
});
