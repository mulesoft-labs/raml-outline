export import parser=require("raml-1-parser");
import search=parser.search;
import hl=parser.hl;
import ll=parser.ll;

/**
 * Strcture node JSON representation.
 */
export interface StructureNodeJSON {
    /**
     * Node label text to be displayed.
     */
    text : string

    /**
     * Node type label, if any.
     */
    typeText : string

    /**
     * Node icon. Structure module is not setting up, how icons are represented in the client
     * system, or what icons exist,
     * instead the client is responsible to configure the mapping from nodes to icon identifiers.
     */
    icon : string

    /**
     * Text style of the node. Structure module is not setting up, how text styles are represented in the client
     * system, or what text styles exist,
     * instead the client is responsible to configure the mapping from nodes to text styles identifiers.
     */
    textStyle : string

    /**
     * Unique node identifier.
     */
    key : string

    /**
     * Node start position from the beginning of the document.
     */
    start : number;

    /**
     * Node end position from the beginning of the document.
     */
    end : number;

    /**
     * Whether the node is selected.
     */
    selected : boolean;

    /**
     * Node children.
     */
    children : StructureNodeJSON[];

    /**
     * Node category, if determined by a category filter.
     */
    category : string
}

/**
 * Arbitrary structure tree node.
 * Depending on the highly customizable filters and
 * look-and-feel providers results in a read-to-display structure tree
 * for RAML document.
 */
export interface StructureNode extends StructureNodeJSON {
    /**
     * Node children.
     */
    children : StructureNode[]

    /**
     * Returns structure node source.
     */
    getSource() : hl.IParseResult;

    /**
     * Converts structure node and its children recursivelly into JSON, containing
     * text, icon and children fields.
     */
    toJSON() : StructureNodeJSON;
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
 * Core tree builder, not recommended to set directly.
 */
export interface ContentProvider {

    /**
     * Constructs structured node children.
     * @param node
     */
    (node : StructureNode) : StructureNode[];
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

export interface KeyProvider {
    /**
     * Gets unique node identifier.
     * @param node
     */
    (node : hl.IParseResult) : string;
}