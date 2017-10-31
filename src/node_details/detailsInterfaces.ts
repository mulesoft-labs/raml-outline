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

    /**
     * Node ID.
     */
    id : string
}

/**
 * Details item having a value text.
 */
export interface DetailsValuedItemJSON extends DetailsItemJSON {

    /**
     * Value text.
     */
    valueText : string
}

/**
 * Details item having potential value options
 */
export interface DetailsItemWithOptionsJSON extends DetailsValuedItemJSON {

    /**
     * Potential options.
     */
    options : string[]
}

/**
 * Type of details item
 */
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
    TYPESELECT,
    JSONEXAMPLE,
    XMLEXAMPLE,
    ATTRIBUTETEXT
}

/**
 * Details tree node.
 */
export interface DetailsItem {

    /**
     * Node title.
     */
    getTitle() : string;

    /**
     * Node description
     */
    getDescription() : string;

    /**
     * Node type name
     */
    getType() : DetailsItemType;

    /**
     * Error, associated with the node.
     */
    getError() : string;

    /**
     * Node children.
     */
    getChildren() : DetailsItem[];

    /**
     * Node parent.
     */
    getParent() : DetailsItem;

    /**
     * Tree root.
     */
    getRoot() : DetailsItem;

    /**
     * Converts this node and its subnodes to JSON, recursivelly.
     */
    toJSON() : DetailsItemJSON;

    /**
     * Returns item ID.
     */
    getId() : string;
}