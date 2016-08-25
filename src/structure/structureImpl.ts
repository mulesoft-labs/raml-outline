/// <reference path="../../typings/main.d.ts" />

import structure = require("./structureInterfaces")
export import parser=require("raml-1-parser");
import search=parser.search;
import hl=parser.hl;
import ll=parser.ll;
import _ = require("underscore");

var _labelProviders : structure.LabelProvider[]  = [];
var _decorators : structure.Decorator[]  = [];
var _categoryFilters : {[categoryName:string]:structure.CategoryFilter} = {};
var _visibilityFilter : structure.VisibilityFilter = null;
var _contentProvider : structure.ContentProvider = null;
var _astProvider : structure.IASTProvider = null;
var _keyProvider : structure.KeyProvider = null;

/**
 * Adds label provider. The system can contain several lable providers at once,
 * the first one returning a label will be used.
 * @param provider
 */
export function addLabelProvider(provider : structure.LabelProvider) {
    _labelProviders.push(provider)
}

/**
 * Adds decorator. The system can contain severla decorators. The first one providing
 * data will be used.
 * @param decorator
 */
export function addDecorator(decorator : structure.Decorator) {
    _decorators.push(decorator)
}

/**
 * Adds new category and its filter. Each category creates its own structure tree.
 * Several categories may contain the same node.
 * Adding the same category the second tie overrides the filter.
 * @param categoryFilter
 */
export function addCategoryFilter(categoryName: string,
                                  categoryFilter : structure.CategoryFilter) {
    _categoryFilters[categoryName] = categoryFilter;
}

/**
 * Sets global visibility filters. Nodes being rejected by the filter are not
 * going into the structure tree of any category.
 * @param visibilityFilter
 */
export function setVisibilityFilter(visibilityFilter : structure.VisibilityFilter) {
    _visibilityFilter = visibilityFilter
}

/**
 * Sets content provider. It is recommended to use the default one.
 * @param contentProvider
 */
export function setContentProvider(contentProvider : structure.ContentProvider) {
    _contentProvider = contentProvider;
}

/**
 * Sets key provider. It is recommended to use the default one.
 * @param keyProvider
 */
export function setKeyProvider(keyProvider : structure.KeyProvider) {
    _keyProvider = keyProvider;
}

/**
 * Sets AST provider. Must be called to use the module.
 */
export function setASTProvider(astProvider : structure.IASTProvider) {
    _astProvider = astProvider
}

class StructureNodeImpl implements structure.StructureNode {
    /**
     * Node text to be displayed.
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
     * Node children.
     */
    children : StructureNodeImpl[]

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
     * Node category, if determined by a category filter.
     */
    category : string;

    constructor(private hlSource : hl.IParseResult) {
    }

    /**
     * Returns structure node source.
     */
    getSource() : hl.IParseResult {
        return this.hlSource;
    }

    /**
     * Converts structure node and its children recursively into JSON, containing
     * text, icon and children fields.
     */
    toJSON() : structure.StructureNodeJSON {
        var result : structure.StructureNodeJSON = {
            text : this.text,
            typeText : this.typeText,
            icon : this.icon,
            textStyle : this.textStyle,
            children : [],
            key : this.key,
            start : this.start,
            end : this.end,
            selected : this.selected,
            category : this.category
        };

        if (this.children) {
            this.children.forEach(child=>{
                result.children.push(child.toJSON())
            })
        }

        return result;
    }
}


function isStructureNodeImpl(node : structure.StructureNode) : node is StructureNodeImpl {
    return (<any>node).getSource != null;
}

function getLabelProvider(node: structure.StructureNode) : structure.LabelProvider {
    if (!_labelProviders) return null;

    var source = node.getSource();
    if (!source) return null;

    return _.find(_labelProviders, labelProvider=>labelProvider.getLabelText(source)!=null);
}

function getDecorator(node: structure.StructureNode) : structure.Decorator {
    if (!_decorators) return null;

    var source = node.getSource();
    if (!source) return null;

    return _.find(_decorators, decorator=>{
        return decorator.getIcon(source)!=null || decorator.getTextStyle(source)!=null
    });
}

/**
 * Converts node to a structure node filling its properties. Does not filter or fill children.
 * @param node
 * @returns {any}
 */
function hlNodeToStructureNode(hlNode : hl.IParseResult,
    selected : hl.IParseResult) : structure.StructureNode {

    if (!hlNode) return null;
    
    var result = new StructureNodeImpl(hlNode);

    var labelProvider = getLabelProvider(result);
    if (labelProvider) {
        result.text = labelProvider.getLabelText(hlNode);
        result.typeText = labelProvider.getTypeText(hlNode);
    }

    var decorator = getDecorator(result);
    if (decorator) {
        result.icon = decorator.getIcon(hlNode);
        result.textStyle = decorator.getTextStyle(hlNode);
    }

    if (_keyProvider) {
        result.key = _keyProvider(hlNode);
    }

    result.start = hlNode.getLowLevelStart();
    result.end = hlNode.getLowLevelEnd();

    if (selected && selected.isSameNode(hlNode))
        result.selected = true;

    return result;
}

function cloneNode(toClone: structure.StructureNode) : structure.StructureNode {
    var result : StructureNodeImpl = new StructureNodeImpl(toClone.getSource())

    result.text = toClone.text
    result.typeText = toClone.typeText
    result.icon = toClone.icon
    result.textStyle = toClone.textStyle
    result.children = <any>toClone.children
    result.key = toClone.key
    result.start = toClone.start
    result.end = toClone.end
    result.selected = toClone.selected
    result.category = toClone.category

    return result;
}

function filterTreeByCategory(root : structure.StructureNode,
    categoryName : string) : structure.StructureNode {

    if (!root.children) return;

    var result = cloneNode(root)

    var filteredChildren = root.children;

    if (categoryName) {
        var filter = _categoryFilters[categoryName];

        if (filter){

            filteredChildren =
                _.filter(root.children, child=>filter(child.getSource()));
            
            filteredChildren.forEach(filteredChild=>filteredChild.category = categoryName);
        }
    }

    result.children = filteredChildren;
    return result;
}

function buildTreeRecursively(structureNode : structure.StructureNode,
    contentProvider : structure.ContentProvider) {

    var children = contentProvider(structureNode);
    if (children) {
        structureNode.children = children;
        children.forEach(child=>buildTreeRecursively(child, contentProvider))
    } else {
        structureNode.children = [];
    }
}

var _selected : hl.IParseResult = null;

/**
 * Default implementation of content provider.
 * 
 * @param node
 * @returns {Array}
 */
function defaultContentProvider(node : structure.StructureNode) :
    structure.StructureNode[] {

    if(node === null) {
        return [];
    }

    var isStructureImpl = isStructureNodeImpl(node);
    if (!isStructureImpl) return;

    var source : hl.IParseResult = node.getSource();

    if (source == null) return [];

    if(source.isAttr()){
        return [];
    }

    if (source.isUnknown()){
        return [];
    }
    var sourceChildren = source.children();

    var filteredSourceChildren =
        sourceChildren.filter(child=>!child.isAttr()&&!child.isUnknown())

    var result = [];

    filteredSourceChildren.forEach(child=>{
        if (_visibilityFilter && !_visibilityFilter(child)) return;

        var converted = hlNodeToStructureNode(child, _selected);
        if (!converted) return;

        result.push(converted);
    })

    return result;
}

/**
 * Gets structure tree for the category. If category is not specified (null), or its
 * filter is not found, returns the whole tree.
 * The root node of the tree always match RAML HL tree root.
 * @param categoryName
 */
export function getStructure(categoryName? : string) : structure.StructureNode {
    if (!_astProvider) return null;

    var hlRoot = _astProvider.getASTRoot();
    if (!hlRoot) return null;

    var _selected = _astProvider.getSelectedNode();

    var structureRoot = hlNodeToStructureNode(hlRoot, _selected);
    if (!structureRoot) return null;

    var contentProvider = _contentProvider;
    if (!contentProvider) contentProvider = defaultContentProvider;

    buildTreeRecursively(structureRoot, contentProvider);

    var result = filterTreeByCategory(structureRoot, categoryName);

    return result;
}

export function getStructureForAllCategories() : {[categoryName:string] : structure.StructureNode} {
    if (!_astProvider) return null;

    var hlRoot = _astProvider.getASTRoot();
    if (!hlRoot) return null;

    var _selected = _astProvider.getSelectedNode();

    var structureRoot = hlNodeToStructureNode(hlRoot, _selected);
    if (!structureRoot) return null;

    var contentProvider = _contentProvider;
    if (!contentProvider) contentProvider = defaultContentProvider;

    buildTreeRecursively(structureRoot, contentProvider);

    var result : {[categoryName:string] : structure.StructureNode} = {};
    for (var categoryName in _categoryFilters) {
        if (_categoryFilters.hasOwnProperty(categoryName)) {
            var filteredTree = filterTreeByCategory(structureRoot, categoryName);
            result[categoryName] = filteredTree;
        }
    }

    return result;
}
