# raml-outline

[![Build Status](https://travis-ci.org/mulesoft/raml-outline.svg?branch=code)](https://travis-ci.org/mulesoft/raml-outline)

This is a central place for RAML outline.

## Getting Started
```typescript
import ramlOutline = require("raml-outline")

//intializing AST provider and outline generally

var astProvider = {
                  
  getASTRoot() {
    ...
  },
  
  getSelectedNode() {
      ...
  }
}

ramlOutline.setASTProvider(astProvider);
ramlOutline.initialize();

//Adding category filters, which split nodes into categories

var ResourcesCategory = "ResourcesCategory"
var SchemasAndTypesCategory = "SchemasAndTypesCategory"
var ResourceTypesAndTraitsCategory = "ResourceTypesAndTraitsCategory"
var OtherCategory = "OtherCategory"

function isResource(node) {
    ...
}
function isSchemaOrType(node) {
    ...
}
function isResourceTypeOrTrait(node) {
    ...
}
function isOther(node) {
    ...
}

ramlOutline.addCategoryFilter(ResourcesCategory, isResource);
ramlOutline.addCategoryFilter(SchemasAndTypesCategory, isSchemaOrType);
ramlOutline.addCategoryFilter(ResourceTypesAndTraitsCategory, isResourceTypeOrTrait);
ramlOutline.addCategoryFilter(OtherCategory, isOther);

//adding decorations to node types

ramlOutline.addDecoration(ramlOutline.NodeType.ATTRIBUTE, {
    icon: UI.Icon.ARROW_SMALL_LEFT,
    textStyle: UI.TextClasses.NORMAL
});

ramlOutline.addDecoration(ramlOutline.NodeType.RESOURCE, {
    icon: UI.Icon.PRIMITIVE_SQUARE,
    textStyle: UI.TextClasses.HIGHLIGHT
});

...

// Now at any point for any category we can ask for a subtree and convert it to JSON

var resourceCategoryOutline = ramlOutline.getStructure(ResourcesCategory).toJSON()

//each node contains:
//resourceCategoryOutline.text - Node label text to be displayed.
//resourceCategoryOutline.typeText - Node type label, if any.
//resourceCategoryOutline.icon - Node icon, set using node type based decorations, or directly via Decorator
//resourceCategoryOutline.textStyle - Node test style, set using node type based decorations, or directly via Decorator
//resourceCategoryOutline.key - Unique node identifier, is set if there is key provider assigned. 
//resourceCategoryOutline.start - Node start position.
//resourceCategoryOutline.end - Node start position.
//resourceCategoryOutline.selected - Whether the node is selected.
//resourceCategoryOutline.category - Node category.
//resourceCategoryOutline.children - Node children.

```

## Code highlights

### Outline core

`setASTProvider` method sets AST provider to feed outline with parser data.

`addCategoryFilter` method creates new category, provided the name and a node filtering method.

`addDecorator` method sets up a new decorator, being able to provide icon and text style for the node.

`addLabelProvider` method sets up a new label provider, being able to provide label and type text for the node.

`setVisibilityFilter` method sets up a way to filter out nodes, which should not be visible.

`setContentProvider` method sets up a way to convert AST tree to outline tree. Not recommended to override the default content provider.

`setKeyProvider` if set, will be asked to provide an unique key for each node.

`getStructure` method returns outline tree for the specified category, or in general.
`getStructureForAllCategories` method returns the map from category name to the category sub-tree.

### Defaults
Defaults module simplify outline usage by not making the user to implement decorators, label providers etc.
 
Defaults module provide outline with default label provider, key provider, visibility filter, and decorator, which is based on simplified decorations.

Besides setting AST provider, user should set up categories if needed, and add static decorations for node types like this:

ramlOutline.addDecoration(ramlOutline.NodeType.ATTRIBUTE, {
    icon: UI.Icon.ARROW_SMALL_LEFT,
    textStyle: UI.TextClasses.NORMAL
});

ramlOutline.addDecoration(ramlOutline.NodeType.RESOURCE, {
    icon: UI.Icon.PRIMITIVE_SQUARE,
    textStyle: UI.TextClasses.HIGHLIGHT
});

Here, node type is one of the supported node types list, and icon and textStyle are arbitrary strings, which will then be put into the respective node fields.