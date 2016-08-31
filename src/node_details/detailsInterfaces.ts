/**
 * The node of details tree converted to JSON
 */
export interface DetailsItemJSON {

    /**
     * Node title.
     */
    title : string

    /**
     * Node description
     */
    description : string

    /**
     * Node type name
     */
    type : string,

    /**
     * Error, associated with the node.
     */
    error : string

    /**
     * Node children.
     */
    children : DetailsItemJSON[]
}

export interface DetailsValuedItemJSON extends DetailsItemJSON {

    /**
     * Value text.
     */
    valueText : string
}

export interface DetailsItemJSONWithOptions extends DetailsValuedItemJSON {

    /**
     * Potential options.
     */
    options : string[]
}

export enum DetailsItemType {
    ROOT,
    CATEGORY,
    CHECKBOX,
    JSONSCHEMA,
    XMLSCHEMA,
    MARKDOWN,
    SELECTBOX,
    MULTIEDITOR,
    TREE,
    STRUCTURED,
    TYPEDISPLAY,
    TYPESELECT
}

/**
 * Details tree node.
 */
export interface DetailsItem {

    /**
     * Node title.
     */
    title() : string;

    /**
     * Node description
     */
    description() : string;

    /**
     * Node type name
     */
    type() : DetailsItemType;

    /**
     * Error, associated with the node.
     */
    error() : string;

    /**
     * Node children.
     */
    children() : DetailsItem[];

    /**
     * Node parent.
     */
    parent() : DetailsItem;

    /**
     * Tree root.
     */
    root() : DetailsItem;

    /**
     * Converts this node and its subnodes to JSON, recursivelly.
     */
    toJSON() : DetailsItemJSON;
}