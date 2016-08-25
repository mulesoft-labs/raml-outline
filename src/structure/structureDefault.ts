/// <reference path="../../typings/main.d.ts" />

import structure = require("./structureInterfaces")
import structureImpl = require("./structureImpl")
export import parser=require("raml-1-parser");
import search=parser.search;
import hl=parser.hl;
import ll=parser.ll;
import _ = require("underscore");
import universes = parser.universes;
import universeHelpers = parser.universeHelpers;
import defaultInterfaces = require("./structureDefaultInterfaces")

/**
 * Default label provider.
 * @param node
 * @returns {string}
 * @constructor
 */
class DefaultLabelProvider {

    /**
     * Gets label (text) for a high-level node.
     * @param node
     */
    getLabelText(node:hl.IParseResult):string {
        if (node.isAttr()) {
            var attr = <hl.IAttribute>node;
            if (attr.value()) return attr.name() + ":" + attr.value()
        } else if (node.isUnknown()) {
            return "Unknown";
        }

        var hlNode = <hl.IHighLevelNode> node;
        if (hlNode.definition().key()===universes.Universe08.DocumentationItem
            ||hlNode.definition().key()===universes.Universe10.DocumentationItem){

            var titleAttribute=hlNode.attr("title");
            if (titleAttribute){
                return titleAttribute.value();
            }
        }

        if (!node.lowLevel()) return "";
        
        return node.name();
    }

    /**
     * Gets type text for a high-level node.
     * @param node
     */
    getTypeText(node: hl.IParseResult) : string {
        if (!node.isElement()) return null;

        var hlNode = <hl.IHighLevelNode> node;
        var typeAttribute=hlNode.attr("type");
        if (typeAttribute){
            var typeValue=typeAttribute.value();
            if (typeValue==null){
                typeValue="";
            }

            var typeText="";
            if (typeof typeValue ==="object"){
                typeText=":"+(<hl.IStructuredValue>typeValue).valueName();
            }
            else{
                typeText=":"+typeValue;
            }

            return typeText;
        }

        return null;
    }
}



export class DefaultDecorator implements structure.Decorator {
    private decorations : {[nodeType: number] : defaultInterfaces.Decoration} = {}

    addDecoration(nodeType : defaultInterfaces.NodeType, decoration : defaultInterfaces.Decoration) : void {
        this.decorations[nodeType] = decoration;
    }

    getNodeType(node : hl.IParseResult) : defaultInterfaces.NodeType {
        if (node.isAttr()) {
            return defaultInterfaces.NodeType.ATTRIBUTE;
        } else if (node.isUnknown()) {
            return defaultInterfaces.NodeType.UNKNOWN;
        }

        var hlNode = <hl.IHighLevelNode> node;

        var nodeDefinition = hlNode.definition().key();
        if (nodeDefinition == universes.Universe08.Resource
            || nodeDefinition===universes.Universe10.Resource) {

            return defaultInterfaces.NodeType.RESOURCE;
        } else if (nodeDefinition === universes.Universe08.Method
            || nodeDefinition===universes.Universe10.Method) {

            return defaultInterfaces.NodeType.METHOD;
        } else if (nodeDefinition === universes.Universe08.AbstractSecurityScheme
            ||nodeDefinition===universes.Universe10.AbstractSecurityScheme) {

            return defaultInterfaces.NodeType.SECURITY_SCHEME;
        } else if (nodeDefinition==universes.Universe10.TypeDeclaration
            && universeHelpers.isAnnotationTypesProperty(node.property())) {

            return defaultInterfaces.NodeType.ANNOTATION_DECLARATION;
        } else if (hlNode.definition().isAssignableFrom(universes.Universe10.TypeDeclaration.name)||
            hlNode.definition().isAssignableFrom(universes.Universe08.Parameter.name)) {

            return defaultInterfaces.NodeType.TYPE_DECLARATION;
        } else if (nodeDefinition===universes.Universe08.DocumentationItem
            ||nodeDefinition===universes.Universe10.DocumentationItem) {

            return defaultInterfaces.NodeType.DOCUMENTATION_ITEM;
        }

        if (node.lowLevel().unit()!=node.root().lowLevel().unit()){
            return defaultInterfaces.NodeType.EXTERNAL_UNIT;
        }

        return defaultInterfaces.NodeType.OTHER;
    }

    getDecoration(node : hl.IParseResult) : defaultInterfaces.Decoration {
        var nodeType = this.getNodeType(node);
        if (!nodeType) return null;

        return this.decorations[nodeType];
    }

    /**
     * Gets node icon.
     * @param node
     */
    getIcon(node:hl.IParseResult) : string {
        var decoration = this.getDecoration(node);
        if (!decoration) return null;

        return decoration.icon
    }

    /**
     * Gets node text style.
     * @param node
     */
    getTextStyle(node:hl.IParseResult) : string {
        var decoration = this.getDecoration(node);
        if (!decoration) return null;

        return decoration.textStyle;
    }
}

var _defaultDecorator = new DefaultDecorator();
var _defaultLabelProvider = new DefaultLabelProvider();

/**
 * Adds another decoration to the default decorator, allowing simple set up
 * of decorations as a map from node type to its icon and text style.
 * @param nodeType
 * @param decoration
 */
export function addDecoration(nodeType : defaultInterfaces.NodeType, decoration : defaultInterfaces.Decoration) : void {
    _defaultDecorator.addDecoration(nodeType, decoration);
}

/**
 * Default implementation of key provider.
 * @param node
 * @constructor
 */
function DefaultKeyProvider(node : hl.IParseResult) : string {
    if (!node) return null;

    if (node && !node.parent()) {
        return node.name();
    }
    else {
        return node.name() + " :: " + DefaultKeyProvider(node.parent());
    }
}

/**
 * Default implementation of visibility filter.
 * @param node
 * @constructor
 */
function DefaultVisibilityFilter(node:hl.IParseResult) : boolean {
    return true;
}

/**
 * Intializes default providers.
 */
export function initialize() {
    structureImpl.setKeyProvider(DefaultKeyProvider);
    structureImpl.addLabelProvider(_defaultLabelProvider);
    structureImpl.addDecorator(_defaultDecorator);
    structureImpl.setVisibilityFilter(DefaultVisibilityFilter);
}