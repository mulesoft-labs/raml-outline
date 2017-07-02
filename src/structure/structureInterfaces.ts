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
 * Core tree builder, not recommended to set directly.
 */
export interface ContentProvider {

    /**
     * Constructs structured node children.
     * @param node
     */
    (node : StructureNode) : StructureNode[];
}