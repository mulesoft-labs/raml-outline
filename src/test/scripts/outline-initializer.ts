import ramlOutline = require("../../index")
import rp=require("raml-1-parser")
import lowLevel=rp.ll;
import hl=rp.hl;
var universes=rp.universes

export function keyProvider(node: hl.IParseResult) : string {
    if (!node) return null;
    if (node && !node.parent()) return node.name();
    else return node.name() + " :: " + keyProvider(node.parent());
}


export function initialize(
    root : hl.IHighLevelNode) {

    var astProvider = {
        getASTRoot() : hl.IHighLevelNode {
            return root;
        },

        getSelectedNode() : hl.IParseResult {
            return root;
        }
    }

    initialize2(astProvider);
}

export function initialize2(
    astProvider : ramlOutline.IASTProvider) {

    ramlOutline.setASTProvider(<any>astProvider);
    ramlOutline.initialize();
    ramlOutline.setKeyProvider(<any>keyProvider);

    createCategories();

    createDecorations();
}

export function isResource(p: hl.IHighLevelNode) {
    return (p.definition().key()===universes.Universe08.Resource||p.definition().key()===universes.Universe10.Resource);
}

var prohibit={
    resources:true,
    schemas:true,
    types:true,
    resourceTypes:true,
    traits:true
}

export function isOther(p: hl.IHighLevelNode) {
    if (p.property()){
        var nm=p.property().nameId();
        if (prohibit[nm]){
            return false;
        }
    }
    return true;
}
export function isResourceTypeOrTrait(p: hl.IHighLevelNode) {
    var pc=p.definition().key();

    return (pc ===universes.Universe08.ResourceType
    ||pc===universes.Universe10.ResourceType||
    pc === universes.Universe08.Trait
    ||
    pc===universes.Universe10.Trait);
}

export function isSchemaOrType(p: hl.IHighLevelNode) {
    var pc=p.definition().key();
    return (pc===universes.Universe08.GlobalSchema)|| (p.property() && p.property().nameId()
        == universes.Universe10.LibraryBase.properties.types.name);
}

function createCategories() : void {
    ramlOutline.addCategoryFilter("ResourcesCategory", <any>isResource);
    ramlOutline.addCategoryFilter("SchemasAndTypesCategory", <any>isSchemaOrType);
    ramlOutline.addCategoryFilter("ResourceTypesAndTraitsCategory", <any>isResourceTypeOrTrait);
    ramlOutline.addCategoryFilter("OtherCategory", <any>isOther);
}

function createDecorations() : void {
    ramlOutline.addDecoration(ramlOutline.NodeType.ATTRIBUTE, {
        icon: "ARROW_SMALL_LEFT",
        textStyle: "NORMAL"
    });

    ramlOutline.addDecoration(ramlOutline.NodeType.RESOURCE, {
        icon: "PRIMITIVE_SQUARE",
        textStyle: "HIGHLIGHT"
    });

    ramlOutline.addDecoration(ramlOutline.NodeType.METHOD, {
        icon: "PRIMITIVE_DOT",
        textStyle: "WARNING"
    });

    ramlOutline.addDecoration(ramlOutline.NodeType.SECURITY_SCHEME, {
        icon: "FILE_SUBMODULE",
        textStyle: "NORMAL"
    });

    ramlOutline.addDecoration(ramlOutline.NodeType.ANNOTATION_DECLARATION, {
        icon: "TAG",
        textStyle: "HIGHLIGHT"
    });

    ramlOutline.addDecoration(ramlOutline.NodeType.TYPE_DECLARATION, {
        icon: "FILE_BINARY",
        textStyle: "SUCCESS"
    });

    ramlOutline.addDecoration(ramlOutline.NodeType.DOCUMENTATION_ITEM, {
        icon: "BOOK",
        textStyle: "NORMAL"
    });
}



