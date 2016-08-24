import structureInterfaces = require("./structureInterfaces")

/**
 * Types of node recognizable by default decorator.
 */
export enum NodeType {
    ATTRIBUTE,
    RESOURCE,
    METHOD,
    SECURITY_SCHEME,
    TYPE_DECLARATION,
    ANNOTATION_DECLARATION,
    DOCUMENTATION_ITEM,
    EXTERNAL_UNIT,
    UNKNOWN,
    OTHER
}

/**
 * Icon and text style.
 */
export interface Decoration {
    icon : string
    textStyle : string
}

/**
 * Structured node having default type assigned by decorator.
 */
export interface TypedStructureNode extends structureInterfaces.StructureNode {
    type : NodeType;
}

/**
 * Chesk if instance is of TypedStructureNode type.
 * @param node
 */
export function isTypedStructureNode(node : structureInterfaces.StructureNode) : node is TypedStructureNode {
    return (<any>node).type;
}