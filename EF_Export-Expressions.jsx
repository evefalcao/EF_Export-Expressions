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
                        text: '~/Path/', \
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
    var dropDownMenu = UI.pathGroup.dropDownGroup.dropDown;
    var applyButton = UI.applyButton;

    var selectedPath, selectedFolder;
    var separator = "/";

    var project = app.project;
    var projectPath = project.file;
    var expressions = [];
    var totalItemsToExport = 0;
    var processedItems = 0;

    // Get project name
    var fullProjectName = projectPath.toString();
    var lastSlashIndex = fullProjectName.lastIndexOf(separator);
    var projectName = fullProjectName.substring(lastSlashIndex + 1).replace(".aep", "");


    // Check if project is saved and define the filePath
    if (projectPath != null) {
        var filePath = projectPath.toString().replace(/\/[^\/]*$/, "");
    } else {
        alert("Save your project to continue.");
    }

    pathButton.onClick = function() {
        selectedFolder = Folder.selectDialog("Choose a destination folder");

        // Update path based on checkbox state
        if (selectedFolder) {
            // Update based on checkbox state
            updatePathBasedOnCheckbox();
            selectedPath = selectedFolder.fullName;
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
        var selectedIndex = dropDownMenu.selection.index;

        // Fallback to filePath if selectedPath is undefined
        if (selectedPath != null) {
            var exportPath = selectedPath;
        } else {
            selectedPath = filePath;
        }

        if (newFolderCheckbox.value) {
            if (!exportPath.includes("\\Expressions")) {
                var expressionsFolder = new Folder(exportPath + "\\Expressions");
                if (!expressionsFolder.exists) {
                    var created = expressionsFolder.create();
                }
            }
        }
        exportPath = (expressionsFolder != null) ? expressionsFolder.fullName : selectedPath;


        if (selectedIndex === 0) { // Active Comp
            exportActiveComp(exportPath, projectName, expressions);
        } else if (selectedIndex === 1) { // Selected Comps
            exportSelectedComps(exportPath, projectName, expressions);
        } else if (selectedIndex === 2) { // Full Project
            exportAllComps(exportPath, projectName, expressions);
        }
    }

    function exportActiveComp(filePath, projectName, expressions) {
        var activeComp = app.project.activeItem;

        if (activeComp instanceof CompItem) {
            processCompExpressions(activeComp, filePath, projectName, expressions);
        } else {
            alert("Click on the timeline to set the comp as active.");
        }
    }

    function exportSelectedComps(filePath, projectName, expressions) {
        var projSelection = app.project.selection;

        for (var item = 0; item < projSelection.length; item++) {
            var curItem = projSelection[item];

            if (curItem instanceof CompItem) {
                processCompExpressions(curItem, filePath, projectName, expressions);
            }
        }
    }

    function exportAllComps(filePath, projectName, expressions) {
        var projItems = app.project.items;

        for (var item = 1; item <= projItems.length; item++) {
            var curItem = projItems[item];

            if (curItem instanceof CompItem) {
                processCompExpressions(curItem, filePath, projectName, expressions);
            }
        }
    }

    function processCompExpressions(comp, filePath, projectName, expressions) {
        var layers = comp.layers;
        expressions = [];

        for (var layer = 1; layer <= layers.length; layer++) {
            var currentLayer = layers[layer];
            var curLayerName = currentLayer.name;
            var curLayerIndex = currentLayer.index;

            processProperty(currentLayer, curLayerName, curLayerIndex, expressions);
        }

        // Only proceed if there are expressions to export
        if (expressions.length != 0) {
            // Add project and comp name at the top of the file
            var compString = "/*\n\tProject: " + projectName + "\n\tComposition: " + comp.name + "\n*/";
            expressions.unshift(compString);

            // Join the array and save the file
            var expressionsString = expressions.join("\n\n\n\n");
            saveFile(filePath, projectName, "Expressions", ".jsx", expressionsString, comp);

            // Reset the expressions array for the next comp
            expressions = [];
        }
    }

    // Supporting functions

    function updatePathBasedOnCheckbox() {
        if (newFolderCheckbox.value) {
            // Checkbox is checked, add "Expressions" folder
            folderPathFeedback = selectedFolder.fullName + separator + "Expressions";
        } else {
            // Checkbox is unchecked, show only the selected folder path
            folderPathFeedback = selectedFolder.fullName;
        }
        // Update the text field
        pathText.text = folderPathFeedback;
    }

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

    function saveFile(filePath, projectName, fileSuffix, fileFormat, content, comp) {
        // Prompt to save the file
        var extension = fileFormat;
        var compName = comp.name;

        // Ensure the path ends with a separator (slash or backslash)
        if (filePath.charAt(filePath.length - 1) !== "\\" && filePath.charAt(filePath.length - 1) !== "/") {
            filePath += "\\";  // Use backslash for Windows paths
        }

        // var file = new File(filePath + projectName + "_" + compName + "_" + fileSuffix + extension);
        var file = new File(filePath + projectName + "_" + compName + "_" + fileSuffix + extension);

        // Write the file
        if (file != null) {
            file.open("w");
            file.write(content);
            file.close();
        }
    }

})();