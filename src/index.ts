import structure = require("./structure/structureInterfaces")
import structureImpl = require("./structure/structureImpl")
import structureDefault = require("./structure/structureDefault")
import structureDefaultInterfaces = require("./structure/structureDefaultInterfaces")


/**
 * Structure node JSON representation.
 */
export type StructureNodeJSON = structure.StructureNodeJSON;

/**
 * Arbitrary structure tree node.
 * Depending on the highly customizable filters and
 * look-and-feel providers results in a read-to-display structure tree
 * for RAML document.
 */
export type StructureNode = structure.StructureNode;

/**
 * Constructs node text for high-level node.
 */
export type LabelProvider = structure.LabelProvider;

/**
 * Provides node decoration info.
 */
export type Decorator = structure.Decorator;

/**
 * Core tree builder, not recommended to set directly.
 */
export type ContentProvider = structure.ContentProvider;

/**
 * Checks if node belongs to a category.
 */
export type CategoryFilter = structure.CategoryFilter;

/**
 * Can hide nodes from the resulting tree.
 */
export type VisibilityFilter = structure.VisibilityFilter;

/**
 * Provides current AST state.
 * If set via setASTProvider method, will be used instead of a new AST calculation
 * by parsing the text provided by IEditorProvider.
 */
export type IASTProvider = structure.IASTProvider;

/**
 * Gets unique node identifier.
 */
export type KeyProvider = structure.KeyProvider;

/**
 * Types of node recognizable by default decorator.
 */
export import NodeType = structureDefaultInterfaces.NodeType;

/**
 * Icon and text style.
 */
export type Decoration = structureDefaultInterfaces.Decoration;

/**
 * Structured node having default type assigned by decorator.
 */
export type TypedStructureNode = structureDefaultInterfaces.TypedStructureNode;

/**
 * Initializes default contributors.
 */
export function initialize() {
    structureDefault.initialize()
}

/**
 * Sets AST provider. Must be called to use the module.
 */
export function setASTProvider(astProvider : structure.IASTProvider) : void {
    structureImpl.setASTProvider(astProvider)
}

/**
 * Adds label provider. The system can contain several label providers at once,
 * the first one returning a label will be used.
 * @param provider
 */
export function addLabelProvider(provider : structure.LabelProvider) : void {
    structureImpl.addLabelProvider(provider)
}

/**
 * Adds decorator. The system can contain severla decorators. The first one providing
 * data will be used.
 * @param decorator
 */
export function addDecorator(decorator : structure.Decorator) : void {
    structureImpl.addDecorator(decorator)
}

/**
 * Adds new category and its filter. Each category creates its own structure tree.
 * Several categories may contain the same node.
 * Adding the same category the second tie overrides the filter.
 * @param categoryFilter
 */
export function addCategoryFilter(categoryName: string,
                                  categoryFilter : structure.CategoryFilter) : void {
    structureImpl.addCategoryFilter(categoryName, categoryFilter)
}

/**
 * Sets global visibility filters. Nodes being rejected by the filter are not
 * going into the structure tree of any category.
 * @param visibilityFilter
 */
export function setVisibilityFilter(visibilityFilter : structure.VisibilityFilter) : void {
    structureImpl.setVisibilityFilter(visibilityFilter)
}

/**
 * Sets content provider. It is recommended to use the default one.
 * @param contentProvider
 */
export function setContentProvider(contentProvider : structure.ContentProvider) : void {
    structureImpl.setContentProvider(contentProvider)
}

/**
 * Sets key provider. It is recommended to use the default one.
 * @param keyProvider
 */
export function setKeyProvider(keyProvider : structure.KeyProvider) : void {
    structureImpl.setKeyProvider(keyProvider)
}

/**
 * Gets structure tree for the category. If category is not specified (null), or its
 * filter is not found, returns the whole tree.
 * The root node of the tree always match RAML HL tree root.
 * @param categoryName
 */
export function getStructure(categoryName : string) : structure.StructureNode {
    return structureImpl.getStructure(categoryName)
}

/**
 * Returns a map from category name to a category structure subtree.
 * @returns {{}}
 */
export function getStructureForAllCategories() : {[categoryName:string] : structure.StructureNode} {
    return structureImpl.getStructureForAllCategories()
}

/**
 * Adds another decoration to the default decorator, allowing simple set up
 * of decorations as a map from node type to its icon and text style.
 * @param nodeType
 * @param decoration
 */
export function addDecoration(nodeType : NodeType,
                              decoration : Decoration) : void {
    structureDefault.addDecoration(nodeType, decoration);
}


/**
 * Chesk if instance is of TypedStructureNode type.
 * @param node
 */
export function isTypedStructureNode(node : StructureNode) : node is TypedStructureNode {
    return structureDefaultInterfaces.isTypedStructureNode(node);
}