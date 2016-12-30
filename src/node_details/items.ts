import detailsInterfaces = require("./detailsInterfaces")

import rp=require("raml-1-parser")
import hl=rp.hl;
import def=rp.ds;
import search=rp.search;
import lowLevel=rp.ll;
import _=require("underscore")
import universe = rp.universes;
import universehelpers =rp.universeHelpers;

export function getDefaultValue(node: hl.IHighLevelNode, property: hl.IProperty) {
    if(property.nameId() === <string>universe.Universe10.TypeDeclaration.properties.required.name) {
        return node.name().indexOf("?")==node.name().length-1;
    }
}

export function hasDefault(property: hl.IProperty) {
    if(property.nameId() === <string>universe.Universe10.TypeDeclaration.properties.required.name) {
        return true;
    }
    return false;
}

/**
 * Abstract item implementation.
 */
export abstract class Item implements detailsInterfaces.DetailsItem {

    private title : string;
    private description : string
    private parent : Item;
    private error : string

    constructor(title : string , description:string=""){
        this.title = title;
        this.description = description;
    }

    needsSeparateLabel(){
        return false;
    }

    add(i:Item): void {
        throw new Error("Not supported")
    }

    getParent() : detailsInterfaces.DetailsItem {
        return this.parent;
    }

    setParent(parent: Item) {
        this.parent = parent;
    }

    getRoot(){
        if (this.parent){
            return this.parent.getRoot();
        }
        return this;
    }

    setDescription(desc:string){
        this.description=desc;
    }

    setTitle(t:string){
        this.title=t;
    }

    item(name:string):Item{
        return null;
    }

    setError(text:string){
        this.error = text;
    }

    clearErrors(){
        this.error = null;
    }

    /**
     * Node title.
     */
    getTitle() : string {
        return this.title;
    }

    /**
     * Node description
     */
    getDescription() : string {
        return this.description;
    }

    /**
     * Error, associated with the node.
     */
    getError() : string {
        return this.error;
    }

    /**
     * Node children.
     */
    getChildren() : detailsInterfaces.DetailsItem[] {
        return [];
    }

    /**
     * Node type name
     */
    abstract getType() : detailsInterfaces.DetailsItemType;

    /**
     * Converts this node and its subnodes to JSON, recursivelly.
     */
    abstract toJSON() : detailsInterfaces.DetailsItemJSON;
}

/**
 * Item responsible for a single property value.
 */
export abstract class PropertyItem extends Item {

    constructor(public property:hl.IProperty,protected node:hl.IHighLevelNode){
        super(property.nameId(),property.description());
    }

    getDefaultValue() {
        return getDefaultValue(this.node, this.property);
    }

    hasDefault() {
        return hasDefault(this.property);
    }

    getValue() : string {
        var attr = this.node.attr(this.property.nameId());

        if (attr || this.hasDefault()){
            var val = attr ? attr.value() : this.getDefaultValue();

            if (val==null){
                val="";
            }

            return val;
        }

        return null;
    }

    toJSON() : detailsInterfaces.DetailsValuedItemJSON {
        return {

            title : this.getTitle(),

            description : this.getDescription(),

            type : (this.getType()?detailsInterfaces.DetailsItemType[this.getType()]:null),

            error : this.getError(),

            children : [],

            valueText : this.getValue()
        };
    }

    /**
     * Node type name
     */
    abstract getType() : detailsInterfaces.DetailsItemType;
}

/**
 * Complex item, containing several items from a single category.
 */
export class Category extends Item{

    _children:Item[]=[]

    add(i:Item){
        i.setParent(this);
        this._children.push(i);
    }

    getChildren() : detailsInterfaces.DetailsItem [] {
        return this._children;
    }
    plainChildren(){
        return this._children.filter(x=>!(x instanceof Category));
    }
    categories(){
        return this._children.filter(x=>(x instanceof Category));
    }

    item(name:string):Item{
        var it:Item;
        this._children.forEach(x=>{
            if (x.getTitle()==name){
                it=x;
            }
            var rr=x.item(name);
            if (rr){
                it=rr;
            }
        });
        return it;
    }

    clearErrors(){
        this._children.forEach(x=>x.clearErrors())
    }

    update(i:Item){

    }

    getType() : detailsInterfaces.DetailsItemType {
        return detailsInterfaces.DetailsItemType.CATEGORY;
    }

    toJSON() : detailsInterfaces.DetailsValuedItemJSON {
        return {

            title : this.getTitle(),

            description : this.getDescription(),

            type : (this.getType()?detailsInterfaces.DetailsItemType[this.getType()]:null),

            error : this.getError(),

            children : _.map(this.getChildren(), child=>child.toJSON()),

            valueText : null
        };
    }
}

/**
 * Root item.
 */
export class TopLevelNode extends Category{

    getType() : detailsInterfaces.DetailsItemType {
        return detailsInterfaces.DetailsItemType.ROOT;
    }

    subCategoryByNameOrCreate(name:string) : Item{
        var item=_.find(this.getChildren(),x=>x.getTitle()==name);
        if (!item){
            var rs=new Category(name);
            this.add(rs);
            return rs;
        }
        return <Item>item;
    }
    addItemToCategory(name:string,it:Item){
        if (name==null){
            this._children.push(it);
            it.setParent(this);
            return;
        }
        this.subCategoryByNameOrCreate(name).add(it);
    }

    constructor(protected node:hl.IHighLevelNode){
        super(node.definition().nameId(),node.definition().description());
    }
    dispose():void{
        this.node=null;
    }

    update(i:Item){
        //TODO port update if needed.
    }
}

export class StructuredField extends PropertyItem{

    getType() : detailsInterfaces.DetailsItemType {
        return detailsInterfaces.DetailsItemType.STRUCTURED;
    }

    constructor(pr:hl.IProperty,node:hl.IHighLevelNode,private stvalue:hl.IStructuredValue){
        super(pr,node);
    }

    getValue() : string {
        return null;
    }

    getChildren() : detailsInterfaces.DetailsItem[] {
        var tree= new TreeField(this.stvalue.lowLevel());
        return [tree];
    }

}

export class JSONSchemaField extends PropertyItem{

    getType() : detailsInterfaces.DetailsItemType {
        return detailsInterfaces.DetailsItemType.JSONSCHEMA;
    }

    needsSeparateLabel(){
        return true;
    }
}

export class TreeField extends Item {

    private node : lowLevel.ILowLevelASTNode;

    getType() : detailsInterfaces.DetailsItemType {
        return detailsInterfaces.DetailsItemType.TREE;
    }

    findKeyValue() : {key:string, value: string} {
        var key=this.node.key();
        var value=this.node.value();

        if(typeof value === 'number' || typeof value === 'boolean') {
            value = "" + value;
        }

        if (typeof value!='string'){
            value="";
        }
        if (value.length>30){
            value=value.substring(0,20)+"...";
        }

        if (!key) {
            if(value) {
                key = value;
                value = "";
            } else {
                key = "-";
                value = "";
            }
        }

        return {key, value};
    }

    getTitle() : string {
        return this.findKeyValue().key;
    }

    getValue() : string {
        return this.findKeyValue().value;
    }

    toJSON() : detailsInterfaces.DetailsItemJSON {


        return <detailsInterfaces.DetailsValuedItemJSON>{

            title : this.getTitle(),

            description : this.getDescription(),

            type : (this.getType()?detailsInterfaces.DetailsItemType[this.getType()]:null),

            error : this.getError(),

            children : _.map(this.getChildren(), child=>child.toJSON()),

            valueText : this.getValue()
        };
    }

    constructor(private input:lowLevel.ILowLevelASTNode) {
        super("");

        this.node = input;
    }

    getChildren() : detailsInterfaces.DetailsItem[] {
        return _.map(this.node.children(), child=>new TreeField(child))
    }
}

export class XMLSchemaField extends PropertyItem{

    getType() : detailsInterfaces.DetailsItemType {
        return detailsInterfaces.DetailsItemType.XMLSCHEMA;
    }

    needsSeparateLabel(){
        return true;
    }
}

export class SelectBox extends PropertyItem{

    getType() : detailsInterfaces.DetailsItemType {
        return detailsInterfaces.DetailsItemType.SELECTBOX;
    }

    calculateOptions() : string[] {
        var options= valueOptions(this.property, this.node);


        var a=this.node.attr(this.property.nameId());
        if (a){
            if (!_.find(options,x=>x==a.value())){
                options.push(a.value());
            }
        }
        if (!this.property.isRequired()&&!this.property.getAdapter(def.RAMLPropertyService).isKey()){
            options=[""].concat(options);
        }

        return options;
    }

    toJSON() : detailsInterfaces.DetailsItemWithOptionsJSON {
        var superResults = super.toJSON();

        var results = <detailsInterfaces.DetailsItemWithOptionsJSON> superResults;

        results.options = this.calculateOptions();

        return results;
    }
}

export class TypeSelectBox extends SelectBox {

    getType() : detailsInterfaces.DetailsItemType {
        return detailsInterfaces.DetailsItemType.TYPESELECT;
    }

}

export var valueOptions = function (x:hl.IProperty, node:hl.IHighLevelNode):string[] {
    var vls = search.enumValues(x,node);
    if (universehelpers.isNameProperty(x)){
        if (node.definition().isAssignableFrom(universe.Universe10.TypeDeclaration.name)){
            if (node.property()&&universehelpers.isBodyProperty(node.property())){
                if (!(node.property() instanceof def.UserDefinedProp)) {
                    if (node.parent()&&
                        universehelpers.isMethodType(node.parent().definition())){
                        return ["application/json", "application/xml","multipart/form-data","application/x-www-form-urlencoded"]
                    }
                    return ["application/json", "application/xml"]
                }
            }
        }
    }
    if ((!vls) || vls.length == 0) {
        var sug = (<def.Property>x).suggester()
        if (sug) {
            vls = sug(node);

        }
        if ((!vls) || vls.length == 0) {
            vls = (<def.Property>x).getOftenKeys();

        }
    }
    return _.unique(vls);
};

function escapeValue(v:string){
    if (v.length>0) {
        if (v.charAt(0) == "'") {
            return '"' + v + '"';
        }
        if (v.charAt(0) == '"') {
            return '"' + v + '"';
        }
    }
    if (v.indexOf(' ')!=-1||v.indexOf(',')!=-1){
        if (v.indexOf('"')==-1){
            return '"'+v+'"'
        }
        if (v.indexOf("'")==-1){
            return "'"+v+"'"
        }
    }
    return v;
}

export class SimpleMultiEditor extends PropertyItem{

    getType() : detailsInterfaces.DetailsItemType {
        return detailsInterfaces.DetailsItemType.MULTIEDITOR;
    }

    getValue() : string {
        var attrs=this.node.attributes(this.property.nameId());

        return attrs.map(x=>escapeValue(""+x.value())).join(", ");
    }
}

export class CheckBoxField extends PropertyItem{

    getType() : detailsInterfaces.DetailsItemType {
        return detailsInterfaces.DetailsItemType.CHECKBOX;
    }

    getValue() : string {
        return "" + this.toUIValue(super.getValue());
    }

    toUIValue(value: string): any {
        if(!value) {
            return false;
        }

        if((<any>value) === true || value.trim() === 'true') {
            return true;
        }

        return false;
    }
}

export class MarkdownField extends PropertyItem{

    getType() : detailsInterfaces.DetailsItemType {
        return detailsInterfaces.DetailsItemType.MARKDOWN;
    }

    needsSeparateLabel(){
        return true;
    }

}

export class TypeDisplayItem extends PropertyItem{


    getType() : detailsInterfaces.DetailsItemType {
        return detailsInterfaces.DetailsItemType.TYPEDISPLAY;
    }

    constructor(node:hl.IHighLevelNode){
        super(node.definition().property("type"),node);
    }

    getTitle() : string {
        return "Type";
    }
}

export class LowLevelTreeField extends PropertyItem {
    constructor(pr:hl.IProperty,node:hl.IHighLevelNode,
                private lowLevel:lowLevel.ILowLevelASTNode,
                title?: string){
        super(pr,node);
        if(title) this.setTitle(title);
    }

    getValue() : string {
        return null;
    }

    getChildren() : detailsInterfaces.DetailsItem[] {
        var tree= new TreeField(this.lowLevel);
        return [tree];
    }

    getType() : detailsInterfaces.DetailsItemType {
        return detailsInterfaces.DetailsItemType.TREE;
    }
}

export class ExampleField extends PropertyItem {
    constructor(public property:hl.IProperty,protected node:hl.IHighLevelNode,
                private text : string, title?: string) {
        super(property, node);
        this.setDescription("")
        if(title)this.setTitle(title);
    }

    getType() : detailsInterfaces.DetailsItemType {
        return detailsInterfaces.DetailsItemType.JSONEXAMPLE;
    }
}
export class XMLExampleField extends PropertyItem{

    constructor(public property:hl.IProperty,protected node:hl.IHighLevelNode,
                private text : string, title?: string) {
        super(property, node);
        this.setDescription("")
        if(title)this.setTitle(title);
    }

    getType() : detailsInterfaces.DetailsItemType {
        return detailsInterfaces.DetailsItemType.XMLEXAMPLE;
    }
}

export class AttributeTextField extends PropertyItem{

    constructor(public property:hl.IProperty,protected node:hl.IHighLevelNode){
        super(property,node);
    }

    getType() : detailsInterfaces.DetailsItemType {
        return detailsInterfaces.DetailsItemType.ATTRIBUTETEXT;
    }
}

