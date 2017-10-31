import structure = require("./structure/structureInterfaces")
import structureImpl = require("./structure/structureImpl")
import structureDefault = require("./structure/structureDefault")
import structureDefaultInterfaces = require("./structure/structureDefaultInterfaces")
import detailsInterface = require("./node_details/detailsInterfaces")
import detailsImplementation = require("./node_details/detailsImpl")
import commonInterfaces = require("./common/commonInterfaces")
import tools = require("./common/tools")

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
export type LabelProvider = commonInterfaces.LabelProvider;

/**
 * Provides node decoration info.
 */
export type Decorator = commonInterfaces.Decorator;

/**
 * Core tree builder, not recommended to set directly.
 */
export type ContentProvider = structure.ContentProvider;

/**
 * Checks if node belongs to a category.
 */
export type CategoryFilter = commonInterfaces.CategoryFilter;

/**
 * Can hide nodes from the resulting tree.
 */
export type VisibilityFilter = commonInterfaces.VisibilityFilter;

/**
 * Provides current AST state.
 * If set via setASTProvider method, will be used instead of a new AST calculation
 * by parsing the text provided by IEditorProvider.
 */
export type IASTProvider = commonInterfaces.IASTProvider;

/**
 * Gets unique node identifier.
 */
export type KeyProvider = commonInterfaces.KeyProvider;

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
 * The node of details tree converted to JSON
 */
export type DetailsItemJSON = detailsInterface.DetailsItemJSON;

/**
 * Details item having a value text.
 */
export type DetailsValuedItemJSON = detailsInterface.DetailsValuedItemJSON;

/**
 * Details item having potential value options
 */
export type DetailsItemWithOptionsJSON = detailsInterface.DetailsItemWithOptionsJSON;

/**
 * Type of details item
 */
export type DetailsItemType = detailsInterface.DetailsItemType;

/**
 * Details tree node.
 */
export type DetailsItem = detailsInterface.DetailsItem;

/**
 * Provider, which can return current text editor
 */
export type IEditorProvider = commonInterfaces.IEditorProvider

/**
 * Abstract text editor, able to provide document text buffer and cursor position.
 */
export type IAbstractTextEditor = commonInterfaces.IAbstractTextEditor

/**
 * Text editor buffer.
 */
export type IEditorTextBuffer = commonInterfaces.IEditorTextBuffer

/**
 * Range of positions in text.
 */
export type IRange = commonInterfaces.IRange

/**
 * Position in text.
 */
export type IPoint = commonInterfaces.IPoint

/**
 * Initializes default contributors.
 */
export function initialize() {
    structureDefault.initialize()
}

/**
 * Sets AST provider. Must be called to use the module.
 */
export function setASTProvider(astProvider : commonInterfaces.IASTProvider) : void {
    tools.setASTProvider(astProvider)
}

/**
 * Adds label provider. The system can contain several label providers at once,
 * the first one returning a label will be used.
 * @param provider
 */
export function addLabelProvider(provider : commonInterfaces.LabelProvider) : void {
    structureImpl.addLabelProvider(provider)
}

/**
 * Adds decorator. The system can contain severla decorators. The first one providing
 * data will be used.
 * @param decorator
 */
export function addDecorator(decorator : commonInterfaces.Decorator) : void {
    structureImpl.addDecorator(decorator)
}

/**
 * Adds new category and its filter. Each category creates its own structure tree.
 * Several categories may contain the same node.
 * Adding the same category the second tie overrides the filter.
 * @param categoryFilter
 */
export function addCategoryFilter(categoryName: string,
                                  categoryFilter : commonInterfaces.CategoryFilter) : void {
    structureImpl.addCategoryFilter(categoryName, categoryFilter)
}

/**
 * Sets global visibility filters. Nodes being rejected by the filter are not
 * going into the structure tree of any category.
 * @param visibilityFilter
 */
export function setVisibilityFilter(visibilityFilter : commonInterfaces.VisibilityFilter) : void {
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
export function setKeyProvider(keyProvider : commonInterfaces.KeyProvider) : void {
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
 * Gets structure tree for the category. If category is not specified (null), or its
 * filter is not found, returns the whole tree.
 * The root node of the tree always match RAML HL tree root.
 * @param categoryName
 */
export function getStructureJSON(categoryName : string) : structure.StructureNodeJSON {
    var structureRoot = structureImpl.getStructure(categoryName);
    if (!structureRoot) return null;

    return structureRoot.toJSON();
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

/**
 * Gets details for a position.
 * Requires AST provider to be set up via setASTProvider method call.
 *
 * In case of the optional position parameter missing, AST provider's getSelectedNode method
 * will be called to determine the node to return detaisl for.
 * @param position - position index in text counting from 0. Optional.
 */
export function getDetails(position?: number) : detailsInterface.DetailsItem {
    return detailsImplementation.buildItemByPosition(position);
}

/**
 * Gets details JSON for a position.
 * Requires AST provider to be set up via setASTProvider method call.
 *
 * In case of the optional position parameter missing, AST provider's getSelectedNode method
 * will be called to determine the node to return detaisl for.
 * @param position
 */
export function getDetailsJSON(position?: number) : detailsInterface.DetailsItemJSON {
    var detailsRoot = getDetails(position);
    if (!detailsRoot) return null;

    return detailsRoot.toJSON();
}


/**
 * Sets editor provider. This method MUST be called at least once, otherwise
 * it will be impossible to calculate the state and an empty state will be returned.
 * @param editorProvider
 */
export function setEditorProvider(editorProvider : commonInterfaces.IEditorProvider) {
    tools.setEditorProvider(editorProvider)
}

/**
 * Changes the value of details item.
 * @param position - cursor position
 * @param itemID - details item ID
 * @param value - new value
 */
export function changeDetailValue(position: number,
                                  itemID: string,
                                  value: string | number | boolean): commonInterfaces.IChangedDocument {

    return detailsImplementation.changeDetailValue(position, itemID, value);
}