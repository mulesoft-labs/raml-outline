import commonInterfaces = require("./commonInterfaces")
export import parser=require("raml-1-parser");
import search=parser.search;
import hl=parser.hl;
import ll=parser.ll;


var _astProvider : commonInterfaces.IASTProvider = null;
var _editorProvider : commonInterfaces.IEditorProvider = null;

class EditorBasedASTProvider implements commonInterfaces.IASTProvider {

    constructor(private editorProvider : commonInterfaces.IEditorProvider){
    }

    getASTRoot() : hl.IHighLevelNode {
        var editor = this.editorProvider.getCurrentEditor();
        if (!editor) return null;

        var filePath = editor.getPath();

        var prj=parser.project.createProject(dirname(filePath));
        var offset=editor.getBuffer().characterIndexForPosition(
            editor.getCursorBufferPosition());
        var text=editor.getBuffer().getText();

        var unit=prj.setCachedUnitContent(basename(filePath),text);

        return <hl.IHighLevelNode>unit.highLevel();
    }

    getSelectedNode() : hl.IParseResult {

        var editor = this.editorProvider.getCurrentEditor();
        if (!editor) return null;

        var ast = this.getASTRoot();
        if (!ast) return null;

        var offset = editor.getBuffer().characterIndexForPosition(
            editor.getCursorBufferPosition());

        var modifiedOffset = offset;

        var text = editor.getText();

        for (var currentOffset=offset-1;currentOffset>=0;currentOffset--){
            var currentCharacter=text[currentOffset];

            if (currentCharacter==' '||currentCharacter=='\t'){
                modifiedOffset=currentOffset-1;
                continue;
            }
            break;
        }
        var astNode=ast.findElementAtOffset(modifiedOffset);

        if (!astNode){
            return ast;
        }

        return astNode;
    }
}

/**
 * Sets AST provider. Must be called to use the module.
 */
export function setASTProvider(astProvider : commonInterfaces.IASTProvider) {
    _astProvider = astProvider
}

/**
 * Sets editor provider. Optional.
 */
export function setEditorProvider(editorProvider : commonInterfaces.IEditorProvider) {
    _editorProvider = editorProvider
}

export function getRootNode() : hl.IHighLevelNode {
    if (_astProvider) return _astProvider.getASTRoot();

    if (!_editorProvider) return null;

    return (new EditorBasedASTProvider(_editorProvider)).getASTRoot();
}

export function getCurrentNode(position?:number) : hl.IParseResult {

    if (_astProvider) {

        var root = _astProvider.getASTRoot();
        if (root && position != null) return root.findElementAtOffset(position);

        var astProviderSelectedNode = _astProvider.getSelectedNode();
        if (astProviderSelectedNode) return astProviderSelectedNode;
    }

    if (_editorProvider)
        return (new EditorBasedASTProvider(_editorProvider)).getASTRoot();

    return null;
}

function basename(path: string) : string {
    var delimiterIndex = -1;
    delimiterIndex = path.lastIndexOf('\\');
    if (delimiterIndex == -1) delimiterIndex = path.lastIndexOf('/');

    return delimiterIndex+1<path.length?path.substring(delimiterIndex+1):"";
}

function dirname(path: string) : string {
    var delimiterIndex = -1;
    delimiterIndex = path.lastIndexOf('\\');
    if (delimiterIndex == -1) delimiterIndex = path.lastIndexOf('/');

    return path.substring(0,delimiterIndex-1)
}
