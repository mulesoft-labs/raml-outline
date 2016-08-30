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
     * Error, associated with the node.
     */
    error : string

    /**
     * Node children.
     */
    children : DetailsItemJSON[]
}

/**
 * Details tree node.
 */
export interface DetailsItem extends DetailsItemJSON {

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