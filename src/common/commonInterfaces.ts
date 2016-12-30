export import parser=require("raml-1-parser");
import search=parser.search;
import hl=parser.hl;
import ll=parser.ll;

/**
 * Provides current AST state.
 * If set via setASTProvider method, will be used instead of a new AST calculation
 * by parsing the text provided by IEditorProvider.
 */
export interface IASTProvider {

    /**
     * Gets current AST root.
     */
    getASTRoot() : hl.IHighLevelNode;

    /**
     * Gets current AST node
     */
    getSelectedNode() : hl.IParseResult;
}

/**
 * Provides node decoration info.
 */
export interface Decorator {

    /**
     * Gets node icon.
     * @param node
     */
    getIcon(node:hl.IParseResult) : string

    /**
     * Gets node text style.
     * @param node
     */
    getTextStyle(node:hl.IParseResult) : string
}

/**
 * Constructs node text for high-level node.
 */
export interface LabelProvider {
    /**
     * Gets label (text) for a high-level node.
     * @param node
     */
    getLabelText(node:hl.IParseResult) : string

    /**
     * Gets type text for a high-level node.
     * @param node
     */
    getTypeText(node: hl.IParseResult) : string
}

/**
 * Can hide nodes from the resulting tree.
 */
export interface VisibilityFilter {
    /**
     * Allows blocking some nodes from being added to the structure tree, on top of what
     * StructureBuilder returns.
     * @param node
     */
    (node:hl.IParseResult) : boolean
}

/**
 * Checks if node belongs to a category.
 */
export interface CategoryFilter {
    /**
     * Checks if node belongs to a category.
     * This method is only applied to the direct children of the root node.
     * If node belongs to a category, all of its children are automatically rendered unless
     * blocked out by a visibility filter.
     * @param node
     */
    (node:hl.IParseResult) : boolean;
}

export interface KeyProvider {
    /**
     * Gets unique node identifier.
     * @param node
     */
    (node : hl.IParseResult) : string;
}

/**
 * Position in text.
 */
export interface IPoint {
    row:number;
    column:number;
}

/**
 * Range of positions in text.
 */
export interface IRange {
    start:IPoint;
    end:IPoint;
}

/**
 * Text editor buffer.
 */
export interface IEditorTextBuffer {

    /**
     * Gets position by the offset from the beginning of the document.
     * @param offset
     */
    positionForCharacterIndex(offset:number):IPoint

    /**
     * Gets offset from the beginning of the document by the position
     * @param position
     */
    characterIndexForPosition(position:IPoint):number;

    /**
     * Gets a range for the row number.
     * @param row - row number
     * @param includeNewline - whether to include new line character(s).
     */
    rangeForRow(row:number, includeNewline?:boolean):IRange;

    /**
     * Gets text in range.
     * @param range
     */
    getTextInRange(range:IRange):string;

    /**
     * Sets (replacing if needed) text in range
     * @param range - text range
     * @param text - text to set
     * @param normalizeLineEndings - whether to convert line endings to the ones standard for this document.
     */
    setTextInRange(range:IRange, text:string, normalizeLineEndings?:boolean):IRange;

    /**
     * Returns buffer text.
     */
    getText(): string;

    /**
     * Gets buffer end.
     */
    getEndPosition():IPoint;
}

/**
 * Abstract text editor, able to provide document text buffer and cursor position.
 */
export interface IAbstractTextEditor {
    /**
     * Returns complete text of the document opened in the editor.
     */
    getText() : string;

    /**
     * Gets text buffer for the editor.
     */
    getBuffer() : IEditorTextBuffer;

    /**
     * Gets file path.
     */
    getPath();

    /**
     * Returns current cursor position
     */
    getCursorBufferPosition() : IPoint;

    /**
     * Sets editor text.
     * @param text
     */
    setText(text:string);
}

/**
 * Provider, which can return current text editor
 */
export interface IEditorProvider {

    /**
     * Returns current text editor.
     */
    getCurrentEditor() : IAbstractTextEditor
}