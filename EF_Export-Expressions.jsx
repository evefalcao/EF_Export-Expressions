(function EF_ExportExpressions() {

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
                        text: '~/MyPath/', \
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
                        properties: { items: ['Active Comp', 'Selected Comps', 'Full Project'] } \
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
            }, \
        }"

    
    function createUserInterface(thisObj, userInterfaceString, scriptName) {

        var pal = (thisObj instanceof Panel) ? thisObj : new Window("palette", scriptName, undefined, {
            resizeable: true
        });
        if (pal == null) return pal;
        var UI = pal.add(userInterfaceString);
        pal.layout.layout(true);
        pal.layout.resize();
        pal.onResizing = pal.onResize = function() {
            this.layout.resize();
        }
        if ((pal != null) && (pal instanceof Window)) {
            pal.show();
        }

        var dropdown = UI.pathGroup.dropDownGroup.dropDown;
        dropdown.selection = [0];

        return UI;
    }

    var scriptName = "Export Expressions";
    var UI = createUserInterface(this, resourceString, scriptName);

    var pathButton = UI.pathGroup.pathGroupButtons.folderDialog;
    var pathText = UI.pathGroup.pathGroupButtons.pathText;
    var newFolderCheckbox = UI.pathGroup.newFolder;
    var selectedPath, selectedFolder;
    var separator = "/";

    var project = app.project;
    var projectPath = project.file;
    var projectName = projectPath.toString();
    var projItems = project.items;
    var projSelection = project.selection;
    var activeComp = project.activeItem;
    var activeCompLayers = comp.layers;


    // Check if project is saved
    if (projectPath != null) {
        var filePath = projectPath.fullName.toString().replace(/\/[^\/]*$/, "")
    } else {
        alert("Save your project to continue.");
    }

    function updatePathBasedOnCheckbox() {
        if (newFolderCheckbox.value) {
            // Checkbox is checked, add "Expressions" folder
            selectedPath = selectedFolder.fullName + separator + "Expressions";
        } else {
            // Checkbox is unchecked, show only the selected folder path
            selectedPath = selectedFolder.fullName;
        }
        // Update the text field
        pathText.text = selectedPath;
    }

    pathButton.onClick = function() {
        selectedFolder = Folder.selectDialog("Choose a destination folder");

        // Update path based on checkbox state
        if (selectedFolder) {
            // Update based on checkbox state
            updatePathBasedOnCheckbox();
        } else {
            // Fallback if no folder is selected
            selectedPath = filePath;
            pathText.text = selectedPath;
        }
    }

    newFolderCheckbox.onClick = function() {
        selectedFolder = (selectedFolder != null) ? selectedFolder : new Folder(filePath);
        updatePathBasedOnCheckbox();
    }

    applyButton.onClick = function() {
        alert(selectedFolder)
    }

    function exportAllExpressions() {
        var expressions = [];

        app.beginUndoGroup("Export Comps Expressions");
        for (var item = 1; item <= projItems.length; item++) {
            var curItem = projItems[item];

            if (curItem instanceof CompItem) {
                var curComp = projItems[item];
                var layers = curComp.layers;

                for (var layer = 1; layer <= layers.length; layer++) {
                    var currentLayer = layers[layer];
                    var curLayerName = currentLayer.name;
                    var curLayerIndex = currentLayer.index;

                    processProperty(currentLayer, curLayerName, curLayerIndex, expressions);
                }

                if (expressions.length != 0) {
                    // Add the project and comp name to the first element of the array
                    var compString = "/*\n\tProject: " + projectName + "\n\tComposition: " + curComp.name + "\n*/";
                    expressions.unshift(compString);

                    // Join array and save file
                    var expressionsString = expressions.join("\n\n\n\n");
                    saveFile(filePath, "Expressions", ".jsx", expressionsString, curComp);

                    // Reset the expressions array
                    expressions = [];
                }

            }
        }
        app.endUndoGroup();
    };

    // function processLayers() {
    //     for (var layer = 1; layer <= layers.length; layer++) {
    //         var currentLayer = layers[layer];
    //         var curLayerName = currentLayer.name;
    //         var curLayerIndex = currentLayer.index;

    //         processProperty(currentLayer, curLayerName, curLayerIndex, expressions);
    //     }
    // }


    // Supporting functions
    function processProperty(property, curLayerName, curLayerIndex, expressionsList) {

        // Pass a layer or a prop
        if (property.propertyType == PropertyType.PROPERTY) { // Check if value is a single property and do something

            if (property.expressionEnabled) {
                var layerAndPropInfo = "// Layer " + curLayerIndex + ": \"" + curLayerName + "\" - " + property.name;
                var exp = property.expression.replace(/[\r\n]+/g, "\n").trim();
                var expression = layerAndPropInfo + "\n" + exp;
                expressionsList.push(expression);
            }

        } else {

            for (var i = 1; i <= property.numProperties; i++) {
                processProperty(property.property(i), curLayerName, curLayerIndex, expressionsList);
            }

        }
    }

    function saveFile(filePath, fileSuffix, fileFormat, content, comp) {
        // Prompt to save the file
        var extension = fileFormat;
        var compName = comp.name;
        var file = new File(filePath + "_" + compName + "_" + fileSuffix + extension);

        // Write the file
        if (file != null) {
            file.open("w");
            file.write(content);
            file.close();
        }
    }

})();