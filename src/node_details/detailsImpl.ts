import detailsInterfaces = require("detailsInterfaces")

import rp=require("raml-1-parser")
import hl=rp.hl;
import def=rp.ds;
import search=rp.search;
import lowLevel=rp.ll;
import _=require("underscore")
import universe = rp.universes;
import universehelpers =rp.universeHelpers;

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

export abstract class Item implements detailsInterfaces.DetailsItem {

    public title : string;
    public description : string
    public parent : Item;
    public error : string
    public children : Item[] = []

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

    parent() : Item {
        return this.parent;
    }

    root(){
        if (this.parent){
            return this.parent.root();
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
}

class PropertyEditorInfo extends Item {

    fld:UI.BasicComponent<any>;

    constructor(public property:hl.IProperty,protected node:hl.IHighLevelNode){
        super(property.nameId(),property.description());
    }

    getDefaultValue() {
        return getDefaultValue(this.node, this.property);
    }

    hasDefault() {
        return hasDefault(this.property);
    }

    clearErrors(){
        this.setError(null);
    }

    toLocalValue(inputValue) {
        return inputValue;
    }

    toUIValue(value) {
        return value;
    }

    fromModelToEditor(){
        var attr = this.node.attr(this.property.nameId());

        if (attr || this.hasDefault()){
            var val = attr ? attr.value() : this.getDefaultValue();

            if (val==null){
                val="";
            }

            this.fld.getBinding().set(this.toUIValue("" + val));
        }
    }
    rendered:boolean=false
    update=(newValue, oldValue)=>{
        if(!this.rendered) {
            return;
        }

        this.fromEditorToModel(newValue, oldValue);
    }

    render(){
        var container=new UI.WrapPanel();
        this.errorLabel=UI.label("",UI.Icon.BUG,UI.TextClasses.ERROR);
        this.errorLabel.setDisplay(false);
        this.errorLabel.setStyle("margin-left",(this._title.length+1)+"ch")

        var field=this.createField();
        this.fld=<UI.BasicComponent<any>>field;
        field.getBinding().addListener(this.update)
        container.setCaption(this.title());
        this.fromModelToEditor();
        container.addChild(field);
        var attr=this.node.attr(this.property.nameId());
        if (attr){
            var val=attr.value();
        }
        var np=(<def.Property>this.property).valueDocProvider();
        if (np){
            var ac=np(val);
            if (ac==null){
                ac="";
            }
            var lbl=UI.label(ac,UI.Icon.INFO,UI.TextClasses.SUBTLE);
            if (!ac){
                lbl.setDisplay(false)
            }
            container.addChild(lbl);
            field.getBinding().addListener(x=>{
                var newDoc=np(field.getBinding().get());
                if (!newDoc){
                    newDoc="";
                }
                lbl.setText(newDoc);
                lbl.setDisplay(newDoc.length>0)
            });
            lbl.setStyle("margin-left",(this._title.length+1)+"ch");
        }
        if (attr&&attr.lowLevel().includePath()){
            container.addChild(UI.label("Included from "+attr.lowLevel().includePath(),UI.Icon.INFO,UI.TextClasses.SUBTLE));
        }
        //container.addChild(this.descLabel)
        container.addChild(this.errorLabel);

        this.rendered = true;

        return container;
    }
    createField():UI.IField<any>{
        return UI.texfField(this.needsSeparateLabel()?"":this.property.nameId(),"",x=>{});
    }
}

class Category extends Item{

    _children:Item[]=[]

    add(i:Item){
        i.parent=this;
        this._children.push(i);
    }

    children(){
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
            if (x.title()==name){
                it=x;
            }
            var rr=x.item(name);
            if (rr){
                it=rr;
            }
        });
        return it;
    }

    descriptionLabel:UI.UIComponent;
    subCategories: UI.UIComponent;
    _result:UI.Panel;
    render(r:RenderingOptions={}):UI.UIComponent{
        var section=this.createSection(r);
        this._result=section;
        if (this.description&&r.showDescription){
            this.descriptionLabel=UI.label(this.description);
            section.addChild(this.descriptionLabel);
        }
        this.contributeTop(section);
        this.plainChildren().forEach(x=>this.addChild(section,x));

        var wrappedChild=this.createWrappedChild(section);
        this.subCategories=wrappedChild;
        var cats=this.categories()
        var remap={}
        cats.forEach(x=>remap[x.title()]=x);
        var newCats=[];
        if (remap["General"]){
            newCats.push(remap["General"]);
            delete remap["General"];
        }
        if (remap["Facets"]){
            newCats.push(remap["Facets"]);
            delete remap["Facets"];
        }
        for (var c in remap){
            newCats.push(remap[c]);
        }
        newCats.forEach(x=>this.addChild(wrappedChild,x));
        return section;
    }
    detach(){
        super.detach();
        this._result.dispose();
    }

    createSection(r:RenderingOptions):UI.Panel{
        if (r.showHeader) {
            return new UI.Section(<any>UI.h3(this.title()), false)
        }
        var pnl=new UI.Panel();
        pnl.setCaption(this.title());
        return pnl;
    }
    createWrappedChild(section:UI.UIComponent){
        return section;
    }


    addChild(section:UI.UIComponent, item:Item){
        var child=item.render();
        if (section instanceof UI.TabFolder){
            var tf=<UI.TabFolder>section;
            tf.add(child.caption(),UI.Icon.NONE,child);
        }
        else {
            if (item.needsSeparateLabel()){
                var firstLabel = UI.label(item.title());

                firstLabel.margin(0, 5, 0, 0);

                section.addChild(firstLabel);
                section.addChild(UI.label(item.description));
            }
            section.addChild(child);
        }
    }

    contributeTop(section:UI.Panel){

    }
    dispose():void{

    }
    setError(text:string){

    }
    clearErrors(){
        this._children.forEach(x=>x.clearErrors())
    }
    update(i:Item){

    }
}

class TopLevelNode extends Category{


    detach(){
        super.detach();
        this._result.dispose();
    }

    createWrappedChild(section:UI.UIComponent){
        var tf=new UI.TabFolder()
        tf.setOnSelected(()=>{
            if (!inRender) {
                lastSelectedCaption = (tf.selectedComponent().caption());
            }
        });
        section.addChild(tf);
        return tf;
    }
    subCategoryByNameOrCreate(name:string){
        var item=_.find(this.children(),x=>x.title()==name);
        if (!item){
            var rs=new Category(name);
            this.add(rs);
            return rs;
        }
        return item;
    }
    addItemToCategory(name:string,it:Item){
        if (name==null){
            this._children.push(it);
            it.parent=this;
            return;
        }
        this.subCategoryByNameOrCreate(name).add(it);
    }


    errorLabel:UI.TextElement<any>
    ep:UI.Panel=null;
    contributeTop(section:UI.Panel){
        this.errorLabel=UI.label("",UI.Icon.BUG,UI.TextClasses.ERROR);
        this.ep=UI.hc(this.errorLabel);
        this.ep.setDisplay(false)
        section.addChild(this.ep);
    }

    _panel:UI.Panel;
    _options:RenderingOptions;

    render(r: RenderingOptions={}){
        inRender=true;
        try {
            var result = super.render(r);
            this._options = r;
            this._panel = <any>result;
            var tf = <UI.TabFolder>this.subCategories;
            for (var n = 0; n < tf.tabsCount(); n++) {
                var item = tf.get(n);
                if (item.header == lastSelectedCaption) {
                    tf.setSelectedIndex(n);
                    return result;
                }
            }
            var documentation="";
            if (this.node.property()){
                documentation=this.node.property().description();
            }
            else{
                documentation=this.node.definition().description();
            }
            if (documentation.length&&!r.showDescription){
                result.addChild(UI.html("<hr/>"))
                result.addChild(UI.label(documentation,UI.Icon.INBOX,UI.TextClasses.SUBTLE))
            }
            this.update(this);
            return result;
        } finally {
            inRender=false;
        }
    }

    constructor(protected node:hl.IHighLevelNode){
        super(node.definition().nameId(),node.definition().description());
    }
    dispose():void{
        this.node=null;
    }

    update(i:Item){
        //this.listeners.forEach(x=>x(i));
        if (!this._panel){
            return;
        }
        if (i instanceof PropertyEditorInfo){
            var prInfo=<PropertyEditorInfo>i;
            if (prInfo.property.getAdapter(def.RAMLPropertyService).isTypeExpr()||prInfo.property.isDescriminator()){
                rp.utils.updateType(this.node);
                var extras=<Category>this.item("Facets");
                if (extras&&extras._result) {
                    extras._result.clear();
                }

                var item=buildItem(this.node,false);
                var newExtras=<Category>item.item("Facets");
                if (newExtras) {
                    if (extras&&extras._result) {
                        extras._children = newExtras._children;
                        extras._children.forEach(x=>x.parent = extras);
                        if (extras._children.length > 0) {
                            extras._result.setDisplay(true);
                            //workaroung events flow issue in UI.ts
                        }
                        newExtras.children().forEach(x=> {
                            extras._result.addChild(x.render(this._options))
                        })
                    }
                    else{
                        this._children.push(newExtras);
                        if (this._panel) {
                            this._panel.addChild(newExtras.render(this._options))
                        }
                    }
                }
                else{
                    if (extras&&extras._result) {
                        extras._result.setDisplay(false);
                    }
                }
            }
        }
        var kp=null;
        this.node.definition().allProperties().forEach(x=>{
            if (x.getAdapter(def.RAMLPropertyService).isKey()){
                kp=x;
            }
        })
        if (kp){
            var keyItem=<PropertyEditorInfo>this.item(kp.nameId());
            if (keyItem){
                var m=keyItem.fld;
                var vl=m.getBinding().get();
                if ((!vl)||vl.trim().length==0){
                    this._panel.getBinding().setStatus(UI.errorStatus(""));
                }
                else{
                    this._panel.getBinding().setStatus(UI.okStatus());
                }
            }
        }

        var errors;

        if(this.node.property() && universehelpers.isExampleProperty(this.node.property())) {
            var parent = this.node.parent()

            if(parent) {
                var parsed = parent.parsedType();

                var exampleMeta =  _.find((<any>parsed).metaInfo || [], (meta: any): boolean => {
                    return meta && meta._name === 'example';
                });

                if(exampleMeta) {
                    var validateObject = exampleMeta.validateSelf(this.node.types().getAnnotationTypeRegistry());

                    errors = ((validateObject && validateObject.getErrors()) || []).map(error => {
                        return this.node.createIssue(error);
                    });
                }
            }
        } else {
            errors = this.node.errors();
        }

        this.clearErrors();
        this.ep.setDisplay(false)
        if (!resourceRegistry.hasAsyncRequests() && errors&&errors.length>0){
            var notFound=[];
            errors.forEach(error=>{
                if (error.extras&&error.extras.length>0){
                    error=error.extras[0];
                }
                var item=this.item(error.node.name());
                if (item){
                    item.setError(error.message);
                }
                else{notFound.push(error);}
            })
            if (notFound.length>0){
                this.errorLabel.setIcon(UI.Icon.BUG)
                var et=notFound.map(x=>x.node.name()+":"+x.message).join(",");
                if (et.length>100){
                    et=et.substring(0,100)+"...";
                }
                this.errorLabel.setText(et)
                this.ep.setDisplay(true);
            }
            else{
                this.ep.setDisplay(false);
            }
        }
    }
}

class StructuredField extends PropertyEditorInfo{
    constructor(pr:hl.IProperty,node:hl.IHighLevelNode,private stvalue:hl.IStructuredValue){
        super(pr,node);
    }
    createField(){
        var tm= new TreeField(this.stvalue.lowLevel(),this.title()+":");
        return tm;
    }
}

class JSONSchemaField extends PropertyEditorInfo{
    createField(){
        var editor = new JSONField("",x=>{});
        return editor;
    }

    needsSeparateLabel(){
        return true;
    }
}

class TreeField extends UI.Panel implements UI.IField<any>{

    constructor(private input:lowLevel.ILowLevelASTNode,caption:string) {
        super();

        var rend={


            render(n:lowLevel.ILowLevelASTNode){
                var key=n.key();
                var value=n.value();

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

                var res=UI.label(key,UI.Icon.CIRCUIT_BOARD,UI.TextClasses.HIGHLIGHT);
                value=UI.label(value?(":"+value):"",UI.Icon.NONE,UI.TextClasses.SUCCESS);
                var result=UI.hc(res,value);
                return result;
            }
        };

        var getChildren = (x:lowLevel.ILowLevelASTNode) => {
            return x.children();
        }

        var viewer=UI.treeViewer(getChildren, rend, x => x.key());
        var inputV={
            children(){
                return [input];
            }
        }
        viewer.setInput(<any>inputV);
        this.addChild(UI.label(caption))
        this.addChild(viewer);
    }



    setLabelWidth(){

    }
    setLabelHeight(){

    }
    setRequired(v:boolean){

    }
}

class XMLSchemaField extends PropertyEditorInfo{
    createField(){
        var editor = new XMLField("",x=>{});
        return editor;
    }

    needsSeparateLabel(){
        return true;
    }
}

class TypeSelectBox extends SelectBox {

    fromEditorToModel(newValue? : any, oldValue? : any){
        //current implementation only allows changing the facets of certain types for safety
        //TODO change this to arbitrary facets (remove type filtering)

        var oldNames : string[] = [];
        var savedAttrs = [];
        if (newValue && oldValue) {
            try {
                this.node.definition().allSuperTypes().forEach(superType=> {
                    if (this.isAllowedTypeToReplaceFacets(superType)) {
                        this.addTypeFacets(superType, oldNames)
                    }
                })

                savedAttrs = [].concat(this.node.attrs())
            } catch (err) {console.log(err)}
        }

        super.fromEditorToModel();

        if (newValue && oldValue) {
            try {
                //collecting facets allowed to remove
                var currentUniverse = this.node.definition().universe();
                var names : string[] = [];

                this.node.definition().allSuperTypes().forEach(superType=>{
                    if (this.isAllowedTypeToReplaceFacets(superType)) {
                        this.addTypeFacets(superType, names)
                    }
                })

                if (oldNames.length > 0 && names.length > 0) {
                    savedAttrs.forEach(attribute => {
                        if (_.find(oldNames, facetName => facetName == attribute.name())
                            && !_.find(names, facetName => facetName == attribute.name())) {

                            this.node.remove(attribute)
                        }
                    })
                }
            } catch (err) {console.log(err)}
        }

    }

    private isAllowedTypeToReplaceFacets(currentTypeDef : hl.ITypeDefinition) : boolean {
        return currentTypeDef.key() == universe.Universe10.StringTypeDeclaration ||
            currentTypeDef.key() == universe.Universe10.BooleanTypeDeclaration ||
            currentTypeDef.key() == universe.Universe10.NumberTypeDeclaration ||
            currentTypeDef.key() == universe.Universe10.IntegerTypeDeclaration;
    }

    private addTypeFacets(currentTypeDef : hl.ITypeDefinition , names : string[]) : void {
        currentTypeDef.properties().map(property=>property.nameId()).forEach(name=>names.push(name));
    }
}

class SelectBox extends PropertyEditorInfo{
    createField(){
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
        var select= new UI.SelectField(this.property.nameId(),x=>{},"",UI.Icon.NONE,options);
        select.getActualField().setOptions(options)
        // select.clearUI();
        return select;
    }

}

class SimpleMultiEditor extends PropertyEditorInfo{
    fromEditorToModel(){
        var field=this.fld;
        var vl=field.getBinding().get();
        if (vl==null){
            vl="";
        }
        var attrs=this.node.attributes(this.property.nameId());
        var av=attrs.map(x=>escapeValue(""+x.value())).join(", ");
        if (av==vl){
            return;
        }
        var ww=vl.split(",");
        var vl=ww.filter(x=>x.trim().length>0).map(x=>x.trim());

        if(this.node.lowLevel().includePath() && !this.node.lowLevel().unit().resolve(this.node.lowLevel().includePath())) {
            return;
        }

        var attribute = this.node.attrOrCreate(this.property.nameId());
        attribute.setValues(vl)

        var root=this.root()
        if (root){
            root.update(this);
        }
    }
    fromModelToEditor(){
        var attrs=this.node.attributes(this.property.nameId());
        var av=attrs.map(x=>escapeValue(""+x.value())).join(", ");
        this.fld.getBinding().set(av);
    }
}

class CheckBoxField extends PropertyEditorInfo{
    createField(){
        return new CheckBox2(this.property.nameId(),UI.Icon.NONE,x=>{});
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

    toLocalValue(value: any): any {
        return value + "";
    }
}

class MarkdownField extends PropertyEditorInfo{
    createField(){
        var editor = new MarkdownFieldUI("",x=>{});
        return editor;
    }

    needsSeparateLabel(){
        return true;
    }

}

export class TypeDisplayItem extends Item{

    constructor(private node:hl.IHighLevelNode){
        super("Type","");
    }
    render(r:RenderingOptions){
        return typeDisplay.render(this.node);
    }
    dispose(){

    }
}

export function buildItem(node:hl.IHighLevelNode,dialog:boolean){
    rp.utils.updateType(node);
    var props=node.propertiesAllowedToUse();

    var result=new TopLevelNode(node);
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
                result.addItemToCategory(category(x,node), new StructuredField(x, node,<hl.IStructuredValue>nm.value()));
                return;
            }
            if (x.getAdapter(def.RAMLPropertyService).isTypeExpr()){
                var nm=node.attr(x.nameId());
                if (nm){
                    var vl=nm.value();
                    if (vl.trim().charAt(0)=='{'){
                        result.addItemToCategory(category(x,node), new JSONSchemaField(x, node));
                        return;
                    }
                    if (vl.trim().charAt(0)=='<'){
                        result.addItemToCategory(category(x,node), new XMLSchemaField(x, node));
                        return;
                    }
                }
            }
            if (universehelpers.isSchemaProperty(x)
                &&x.domain()&&x.domain().isAssignableFrom(universe.Universe10.TypeDeclaration.name)){
                return;
            }
            var vls = valueOptions(x, node);
            if (vls&&vls.length>0&&((x.domain()&&x.domain().getAdapter(def.RAMLService).isUserDefined()))){
                if (universehelpers.isTypeProperty(x) &&
                    node.definition().isAssignableFrom(universe.Universe10.TypeDeclaration.name)) {

                    result.addItemToCategory(category(x, node), new TypeSelectBox(x, node));
                } else {
                    result.addItemToCategory(category(x, node), new SelectBox(x, node));
                }
            }
            else {
                if (x.isMultiValue()){
                    result.addItemToCategory(category(x,node), new SimpleMultiEditor(x, node));
                }
                else {

                    result.addItemToCategory(category(x, node), new PropertyEditorInfo(x, node));
                }
            }

        }
    })
    props.forEach(x=>{
        if (x.isValueProperty()) {
            if (universehelpers.isBooleanTypeType(x.range())){
                result.addItemToCategory(category(x,node), new CheckBoxField(x,node));
            }
        }
    })
    props.forEach(x=>{
        if (x.isValueProperty()) {
            if (universehelpers.isMarkdownStringType(x.range())){
                result.addItemToCategory(category(x,node), new MarkdownField(x,node));
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
        result.addItemToCategory("Type",new TypeDisplayItem(node))
    }
    return result;
}