package tree_sitter_polytope_parser_test

import (
	"testing"

	tree_sitter "github.com/tree-sitter/go-tree-sitter"
	tree_sitter_polytope_parser "github.com/kimjg1119/polytope-parser/bindings/go"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_polytope_parser.Language())
	if language == nil {
		t.Errorf("Error loading Polytope-Parser grammar")
	}
}
