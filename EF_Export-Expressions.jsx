/**========================================================================
 * ?                  EF_Export-Expressions.jsx
 * @author            Eveline Falcão (https://evelinefalcao.com)
 * @email             hello@evelinefalcao.com
 * @version           1.0.0
 * @createdFor        Adobe After Effects CC 2024 (Version 24.1.0 Build 78)
 * @description       Export expressions to .jsx files.
 *========================================================================**/

(function(thisObj) {

    var resourceString =
        "group { \
            orientation:'column', \
            alignment: ['fill', 'top'], \
            minimumSize: [250, 150], \
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
                        properties: { items: ['Active Comp', 'Selected Comps', 'Full Project'] }, \
                    }, \
                }, \
            }, \
            applyButton: Button { \
                text: 'Export', \
                alignment: ['right', 'bottom'], \
                preferredSize: [100, 30], \
            }, \
        }"
    
    
    var pathButton, pathText, newFolderCheckbox, dropDownMenu, applyButton, selectedPath, projectPath, selectedFolder, filePath,
        fullProjectName, lastSlashIndex, projectName;

    var project = app.project;
    var separator = "/";
    var expressions = [];
    projectPath = (project.file != null) ? project.file : null;

    // Define the filePath from saved project
    if (projectPath != null) {
        filePath = projectPath.fullName.toString().replace(/\/[^\/]*$/, ""); // Remove everything after the last "/"
        // alert(filePath);
    } else {
        // alert("Save your project to continue.");
    }

    function createUserInterface(thisObj, userInterfaceString, scriptName) {

        var myPanel = (thisObj instanceof Panel) ? thisObj : new Window("palette", scriptName, undefined, { resizeable: true });
        if (myPanel == null) return myPanel;
        var UI = myPanel.add(userInterfaceString);
        myPanel.layout.layout(true);
        myPanel.layout.resize();
        myPanel.onResizing = myPanel.onResize = function() {
            this.layout.resize();
        }

        if ((myPanel != null) && (myPanel instanceof Window)) {
            myPanel.center();
            myPanel.show();
        }

        // UI Functions
        pathButton = UI.pathGroup.pathGroupButtons.folderDialog;
        pathText = UI.pathGroup.pathGroupButtons.pathText;
        newFolderCheckbox = UI.pathGroup.newFolder;
        dropDownMenu = UI.pathGroup.dropDownGroup.dropDown;
        applyButton = UI.applyButton;
        dropDownMenu.selection = [0];

        pathButton.onClick = function() {
            selectedFolder = Folder.selectDialog("Choose a destination folder");

            // Update path based on checkbox state
            if (selectedFolder) {
                // Update based on checkbox state
                selectedPath = selectedFolder.fullName;
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
            var selectedIndex = dropDownMenu.selection.index;

            // Prompt the user to save the project if project isn't saved
            if (project.file != null) {
                projectPath = project.file;
            } else {
                alert("Please save your project to use Export Expressions.");
                var saveFile = File.saveDialog("Save Project As");
                
                if (saveFile != null) {
                    project.save(saveFile);
                    projectPath = project.file;
                }
            }

            // Get project name from projectPath
            fullProjectName = projectPath.toString();
            lastSlashIndex = fullProjectName.lastIndexOf(separator);
            projectName = fullProjectName.substring(lastSlashIndex + 1).replace(".aep", "");

            // If selectedPath is undefined export to the project location
            if (selectedPath != null) {
                var exportPath = selectedPath;
            } else {
                selectedPath = filePath;
            }

            // Creates the "Expressions" folder if it needed
            if (newFolderCheckbox.value) {
                if (!exportPath.includes("\\Expressions")) {
                    var expressionsFolder = new Folder(exportPath + "\\Expressions");
                    if (!expressionsFolder.exists) {
                        var created = expressionsFolder.create();
                    }
                }
            }

            // Export to the expressions folder if needeed, else export to selectedPath
            exportPath = (expressionsFolder != null) ? expressionsFolder.fullName : selectedPath;

            if (selectedIndex === 0) { // Active Comp
                exportActiveComp(exportPath, projectName, expressions);
            } else if (selectedIndex === 1) { // Selected Comps
                exportSelectedComps(exportPath, projectName, expressions);
            } else if (selectedIndex === 2) { // Full Project
                exportAllComps(exportPath, projectName, expressions);
            }
        }

        return UI;
    }

    var scriptName = "Export Expressions";
    var UI = createUserInterface(thisObj, resourceString, scriptName);

    // Primary functions //
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

    // Supporting functions //
    function saveProject() {
        alert("Save your project to continue.");
        var saveFile = File.saveDialog("Save Project As");
        if (saveFile != null) {
            app.project.save(saveFile); 
        } else {
            alert("Project must be saved to continue.");
        }
    }

    function updatePathBasedOnCheckbox() {
        var folderPathFeedback;

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

})(this);