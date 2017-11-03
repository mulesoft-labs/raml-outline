import detailsInterfaces = require("./detailsInterfaces")
import itemsImpl = require("./items")

import rp=require("raml-1-parser")
import hl=rp.hl;
import def=rp.ds;
import search=rp.search;
import lowLevel=rp.ll;
import _=require("underscore")
import universe = rp.universes;
import universehelpers =rp.universeHelpers;
import commonInterfaces = require("../common/commonInterfaces")
import tools = require("../common/tools")
import loggerModule = require("../common/logger")



function category(p:hl.IProperty,node:hl.IHighLevelNode):string{
    if (p.getAdapter(def.RAMLPropertyService).isKey()||p.isRequired()){
        return null;
    }
    if (p.domain()&&!p.domain().getAdapter(def.RAMLService).isUserDefined()) {
        if (universehelpers.isDocumentationProperty(p) ||
            universehelpers.isUsageProperty(p) ||
            universehelpers.isDescriptionProperty(p) ||
            universehelpers.isDisplayNameProperty(p) ||
            universehelpers.isTitleProperty(p)) {
            return "Documentation";
        }
        if (universehelpers.isAnnotationsProperty(p) ||
            universehelpers.isIsProperty(p) ||
            universehelpers.isSecuredByProperty(p) ||
            (universehelpers.isTypeProperty(p)&&!p.getAdapter(def.RAMLPropertyService).isTypeExpr())) {
            return "References";
        }
        if (universehelpers.isProtocolsProperty(p)){
            return "General";
        }
    }

    if (universehelpers.isTypeProperty(p)){
        if (p.domain()&&!p.domain().getAdapter(def.RAMLService).isUserDefined()){
            return null;
        }
    }
    if (node.property()) {
        if (p.domain() && p.domain() != node.property().range()) {
            return "Facets";
        }
    }
    return "General";
}

function addExampleControl(property: hl.IProperty, node : hl.IHighLevelNode,
                           exampleElement : hl.IHighLevelNode, example : def.rt.nominalTypes.IExpandableExample,
                           container : itemsImpl.TopLevelNode) {

    if (example.isYAML()) {
        container.addItemToCategory(category(property, node),
            new itemsImpl.LowLevelTreeField(property, node, exampleElement.lowLevel(), example.name()));
    } else if (example.isJSONString()) {
        container.addItemToCategory(category(property, node),
            new itemsImpl.ExampleField(property, node, example.asString(), example.name()));
    } else if (example.isXMLString()) {
        container.addItemToCategory(category(property, node),
            new itemsImpl.XMLExampleField(property, node, example.asString(), example.name()));
    }
}


/**
 * Gets details for a position.
 * Requires AST provider to be set up via setASTProvider method call.
 *
 * In case of the optional position parameter missing, AST provider's getSelectedNode method
 * will be called to determine the node to return detaisl for.
 * @param position - position index in text counting from 0.
 */
export function buildItemByPosition(position?:number) {
    return buildItem(findNode(position));
}

function findNode(position?:number) : hl.IParseResult {
    return tools.getCurrentNode(position)
}

/**
 * Creates an item by node.
 * @param node
 * @returns {TopLevelNode}
 */
export function buildItem(parseResults:hl.IParseResult) : detailsInterfaces.DetailsItem {
    if (!parseResults) return null;

    if (!parseResults.asElement()) return null;

    var node = <hl.IHighLevelNode> parseResults;

    rp.utils.updateType(node);
    var props=node.propertiesAllowedToUse();

    var result=new itemsImpl.TopLevelNode(node);
    if (node.property()&&node.property().description()){
        result.setDescription(node.property().description());
    }

    var isFragment = false;

    if(node.definition() && !node.parent()) {
        var fragmentName = rp.utils.getFragmentDefenitionName(node);

        var superTypes = node.definition().allSuperTypes();

        superTypes.push(node.definition());

        superTypes.forEach(superType => {
            if(superType.nameId && superType.nameId() === fragmentName) {
                isFragment = true;
            }
        });
    }

    props=props.filter(x=>{
        if(isFragment && universehelpers.isNameProperty(x)) {
            return false;
        }

        if ((universehelpers.isNameProperty(x))&&universehelpers.isApiType(node.definition())&&(!x.domain().getAdapter(def.RAMLService).isUserDefined())){
            return false;
        }
        if ((universehelpers.isDisplayNameProperty(x))&&universehelpers.isApiType(node.definition())&&(!x.domain().getAdapter(def.RAMLService).isUserDefined())){
            return false;
        }

        return true;
    })
    props=props.sort((x,y)=> {
        if (x.getAdapter(def.RAMLPropertyService).isKey()){
            return -1;
        }
        if (y.getAdapter(def.RAMLPropertyService).isKey()){
            return 1;
        }
        if (x.nameId()<y.nameId()){
            return -1;
        }
        return 1;
    });
    props.forEach(x=>{
        if (x.isValueProperty()) {
            //

            if (universehelpers.isAnnotationsProperty(x)) {
                //we ban annotations from appearing as we can not provide the editing
                //with this mechanism
                return;
            }

            if (universehelpers.isBooleanTypeType(x.range())){
                return;
            }
            if (universehelpers.isMarkdownStringType(x.range())){
                return;
            }

            // if (x.getAdapter(def.RAMLPropertyService).isExampleProperty()&&node.name()=="application/json"){
            //     result.addItemToCategory(category(x,node), new ExampleField(x, node));
            //     return;
            // }
            // if (x.getAdapter(def.RAMLPropertyService).isExampleProperty()&&node.name()=="application/xml"){
            //     result.addItemToCategory(category(x,node), new XMLExampleField(x, node));
            //     return;
            // }
            var nm=node.attr(x.nameId());
            if (nm && typeof nm.value() ==="object"){
                result.addItemToCategory(category(x,node), new itemsImpl.StructuredField(x, node,<hl.IStructuredValue>nm.value()));
                return;
            }
            if (x.getAdapter(def.RAMLPropertyService).isTypeExpr()){
                var nm=node.attr(x.nameId());
                if (nm){
                    var vl=nm.value();
                    if (vl.trim().charAt(0)=='{'){
                        result.addItemToCategory(category(x,node), new itemsImpl.JSONSchemaField(x, node));
                        return;
                    }
                    if (vl.trim().charAt(0)=='<'){
                        result.addItemToCategory(category(x,node), new itemsImpl.XMLSchemaField(x, node));
                        return;
                    }
                }
            }
            if (universehelpers.isSchemaProperty(x)
                &&x.domain()&&x.domain().isAssignableFrom(universe.Universe10.TypeDeclaration.name)){
                return;
            }
            var vls = itemsImpl.valueOptions(x, node);
            if (vls&&vls.length>0&&((x.domain()&&x.domain().getAdapter(def.RAMLService).isUserDefined()))){
                if (universehelpers.isTypeProperty(x) &&
                    node.definition().isAssignableFrom(universe.Universe10.TypeDeclaration.name)) {

                    result.addItemToCategory(category(x, node), new itemsImpl.TypeSelectBox(x, node));
                } else {
                    result.addItemToCategory(category(x, node), new itemsImpl.SelectBox(x, node));
                }
            }
            else {
                if (x.isMultiValue()){
                    result.addItemToCategory(category(x,node), new itemsImpl.SimpleMultiEditor(x, node));
                }
                else {

                    result.addItemToCategory(category(x, node), new itemsImpl.AttributeTextField(x, node));
                }
            }

        }
    })
    props.forEach(x=>{
        if (x.isValueProperty()) {
            if (universehelpers.isBooleanTypeType(x.range())){
                result.addItemToCategory(category(x,node), new itemsImpl.CheckBoxField(x,node));
            }
        }
    })
    props.forEach(x=>{
        if (x.isValueProperty()) {
            if (universehelpers.isMarkdownStringType(x.range())){
                result.addItemToCategory(category(x,node), new itemsImpl.MarkdownField(x,node));
            }
        }
    })
    if (universehelpers.isTypeDeclarationSibling(node.definition())) {
        props.forEach(x=> {
            if (universehelpers.isExampleProperty(x)) {
                var exampleElement = node.element(universe.Universe10.TypeDeclaration.properties.example.name);
                if (exampleElement) {
                    var examples = node.localType().examples();
                    if (examples && examples.length == 1){
                        var example = examples[0];
                        addExampleControl(x, node, exampleElement, example, result);
                    }
                }
            } else if (universehelpers.isExamplesProperty(x)) {
                var exampleElements  =
                    node.elementsOfKind(universe.Universe10.TypeDeclaration.properties.examples.name);
                if (exampleElements && exampleElements.length > 0) {
                    var examples = node.localType().examples();
                    exampleElements.forEach(exampleElement=>{
                        var exampleElementName = exampleElement.attrValue(universe.Universe10.ExampleSpec.properties.name.name);
                        if (exampleElementName) {
                            var example = _.find(examples, currentExample=>currentExample.name() == exampleElementName);
                            if (example) {
                                addExampleControl(x, node, exampleElement, example, result);
                            }
                        }
                    })
                }
            }
        })
    }

    if (node.definition().getAdapter(def.RAMLService).isUserDefined()||node.definition().isAssignableFrom(universe.Universe10.TypeDeclaration.name)){
        result.addItemToCategory("Type",new itemsImpl.TypeDisplayItem(node))
    }
    return result;
}

/**
 * Finds item by its ID.
 *
 * @param root - details root.
 * @param id - id of the item to find.
 */
export function getItemById(root: detailsInterfaces.DetailsItem,
                            id: string) : detailsInterfaces.DetailsItem {
    if (root.getId() == id) {
        return root;
    }

    if (root.getChildren() == null || root.getChildren().length == 0) {
        return null;
    }

    for (const child of root.getChildren()) {

        const childResult = getItemById(child, id);

        if (childResult != null) {
            return childResult;
        }
    }

    return null;
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

    loggerModule.getLogger().debugDetail("Changing value of item " + itemID + " to " + value,
        "detailsImpl", "changeDetailValue");

    const root = buildItemByPosition(position) as itemsImpl.Item;

    const item = getItemById(root, itemID) as itemsImpl.Item;
    if (!item) {
        loggerModule.getLogger().debugDetail("Item not found",
            "detailsImpl", "changeDetailValue");
        return null;
    }

    loggerModule.getLogger().debugDetail("Item found of type " + item.getType(),
        "detailsImpl", "changeDetailValue");

    const result = item.setValue(value);

    if (result) {
        loggerModule.getLogger().debugDetail("Result is " + JSON.stringify(result),
            "detailsImpl", "changeDetailValue");
    } else {
        loggerModule.getLogger().debugDetail("Result not found",
            "detailsImpl", "changeDetailValue");
    }

    return result;
}