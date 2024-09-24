var resourceString = 
"group { \
    orientation:'column', \
    alignment: ['fill', 'top'], \
    pathGroup: Panel { \
        alignment: ['fill', 'center'], \
        text: 'Export to folder', \
        pathGroupButtons: Group { \
            orientation:'row', \
            alignment: ['fill', 'center'], \
            pathText: StaticText { \
                text: '~myPath/folder', \
                alignment: ['fill', 'center'], \
                justify: 'left',\
                minimumSize: [30, 30], \
            }, \
            folderDialog: Button { \
                alignment: ['right', 'center'], \
                text: '...' , \
            }, \
        }, \
        newFolder: Checkbox { \
            alignment: ['left', 'center'], \
            text: 'Create New Folder', \
            value: true, \
        }, \
        dropDownGroup: Group { \
            orientation: 'row', \
            alignment: ['fill', 'center'], \
            textDropDown: StaticText { \
                alignment: ['fill', 'center'], \
                text: 'Target:', \
                minimumSize: [30, 10], \
            }, \
            dropDown: DropDownList { \
                alignment: ['right', 'center'], \
                properties: { items: ['Active Comp', 'Selected Comps', 'Full Project'] }\
            }, \
        }, \
    }, \
    progressGroup: Group { \
        orientation: 'row', \
        alignment: ['fill', 'top'], \
        progressLabel: StaticText { text: 'Progress:' }, \
        myProgressBar: Progressbar { \
            alignment: ['fill', 'center'], \
            minvalue: 0, \
            maxvalue: 100, \
            value: 0, \
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

    var dropdown = UI.pathGroup.dropDownGroup.dropDown;
    dropdown.selection = [0];

    return UI;
}

var scriptName = "Export Expressions";
var UI = createUserInterface(this, resourceString, scriptName);