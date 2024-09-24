var resourceString = 
"group { \
    orientation:'column', \
    alignment: ['fill', 'top'], \
    pathGroup: Panel { \
        alignment: ['fill', 'top'], \
        text: 'Export to folder', \
        pathGroupButtons: Group { \
            orientation:'row', \
            alignment: ['fill', 'top'], \
            pathText: StaticText { \
                text: '~myPath/folder', \
                alignment: ['left', 'center'], \
                justify: 'left' }, \
            folderDialog: Button { \
                text: '...' , \
                preferredSize: [60, 30], \
                alignment: ['fill', 'center'], \
            }, \
        }, \
        newFolder: Checkbox { \
            alignment: ['left', 'fill'], \
            text: 'Create New Folder', \
            value: true, \
        }, \
        dropDownGroup: Group { \
            orientation: 'row', \
            alignment: ['fill', 'fill'], \
            textDropDown: StaticText { \
                text: 'Target' \
            }, \
            dropDown: DropDownList { \
                alignment: ['fill', 'fill'], \
                properties: { items: ['Active Comp', 'Selected Comps', 'Full Project']}\
            }, \
        }, \
    }, \
    applyButton: Button { \
        text: 'Export', \
        alignment: ['right', 'bottom'], \
        preferredSize: [100, 30], \
    }\
}"

function createUserInterface(thisObj, userInterfaceString, scriptName){

    var pal = (thisObj instanceof Panel) ? thisObj : new Window("palette", scriptName, undefined, {resizeable: true});
    if (pal == null) return pal;
    var UI = pal.add(userInterfaceString);
    pal.layout.layout(true);
    pal.layout.resize();
    pal.onResizing = pal.onResize = function(){
        this.layout.resize();
    }
    if ((pal != null) && (pal instanceof Window)){
        pal.show();
    }

    return UI;
}

var scriptName = "Export Expressions";
var UI = createUserInterface(this, resourceString, scriptName);