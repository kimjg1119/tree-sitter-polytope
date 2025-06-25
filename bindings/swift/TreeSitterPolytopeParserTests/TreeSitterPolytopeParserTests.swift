import XCTest
import SwiftTreeSitter
import TreeSitterPolytopeParser

final class TreeSitterPolytopeParserTests: XCTestCase {
    func testCanLoadGrammar() throws {
        let parser = Parser()
        let language = Language(language: tree_sitter_polytope_parser())
        XCTAssertNoThrow(try parser.setLanguage(language),
                         "Error loading Polytope-Parser grammar")
    }
}
