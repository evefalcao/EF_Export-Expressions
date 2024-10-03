/**========================================================================
 * ?                  EF_Export-Expressions.jsx
 * @author            Eveline Falcão <https://evelinefalcao.com>
 * @email             hello@evelinefalcao.com
 * @version           1.0.1
 * @createdFor        Adobe After Effects CC 2024 (Version 24.1.0 Build 78)
 * @description       Export expressions to .jsx files.
 *========================================================================**/

(function (thisObj) {

    var resourceString =
        "group { \
            orientation:'column', \
            alignment: ['fill', 'top'], \
            minimumSize: [200, 150], \
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

    var pathButton, pathText, newFolderCheckbox, dropDownMenu, applyButton, selectedPath, projectPath, selectedFolder, filePath, projectName;
    var project = app.project;
    var separator = ($.os.indexOf("Windows") !== -1) ? "\\" : "/";
    var expressions = [];
    projectPath = (project.file != null) ? project.file : null;

    // Define the filePath from saved project
    if (projectPath != null) {
        filePath = projectPath.fsName.replace(/[\/\\][^\/\\]*$/, "");
    }

    function createUserInterface(thisObj, userInterfaceString, scriptName) {
        var myPanel = (thisObj instanceof Panel) ? thisObj : new Window("palette", scriptName, undefined, { resizeable: true });
        if (myPanel == null) return myPanel;
        var UI = myPanel.add(userInterfaceString);
        myPanel.layout.layout(true);
        myPanel.layout.resize();
        myPanel.onResizing = myPanel.onResize = function () {
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

        pathButton.onClick = function () {
            selectedFolder = Folder.selectDialog("Choose a destination folder");

            if (selectedFolder) {
                selectedPath = selectedFolder.fsName;
                updatePathBasedOnCheckbox();
            } else {
                selectedPath = filePath;
                pathText.text = selectedPath;
            }

            alert("Selected Path: " + selectedPath); // Debugging alert
        }

        newFolderCheckbox.onClick = function () {
            selectedFolder = (selectedFolder != null) ? selectedFolder : new Folder(filePath);
            updatePathBasedOnCheckbox();
        }

        applyButton.onClick = function () {
            var selectedIndex = dropDownMenu.selection.index;
            var exportPath, expressionsFolder, createdFolder, saveFile;

            if (project.file != null) {
                projectPath = project.file;
            } else {
                alert("Please save your project to use Export Expressions.");
                saveFile = File.saveDialog("Save Project As");

                if (saveFile != null) {
                    project.save(saveFile);
                    projectPath = project.file;
                }
            }

            projectName = projectPath.name.replace(".aep", "");

            if (selectedPath != null) {
                exportPath = selectedPath;
            } else {
                selectedPath = filePath;
            }

            if (newFolderCheckbox.value) {
                if (!exportPath.includes(separator + "Expressions")) {
                    expressionsFolder = new Folder(exportPath + separator + "Expressions");
                    if (!expressionsFolder.exists) {
                        createdFolder = expressionsFolder.create();
                        if (!createdFolder) {
                            alert("Failed to create folder. Please check your permissions.");
                        } else {
                            alert("Folder created: " + expressionsFolder.fsName); // Debugging alert
                        }
                    }
                }
            }

            exportPath = (expressionsFolder != null) ? expressionsFolder.fsName : selectedPath;
            alert("Final Export Path: " + exportPath); // Debugging alert

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

        if (expressions.length != 0) {
            var compString = "/*\n\tProject: " + projectName + ".aep" + "\n\tComposition: " + comp.name + "\n*/";
            expressions.unshift(compString);

            var expressionsString = expressions.join("\n\n\n\n");
            saveFile(filePath, projectName, "Expressions", ".jsx", expressionsString, comp);

            expressions = [];
        }
    }

    function saveFile(filePath, projectName, fileSuffix, fileFormat, content, comp) {
        var extension = fileFormat;
        var compName = comp.name;

        if (filePath.charAt(filePath.length - 1) !== separator) {
            filePath += separator;
        }

        var file = new File(filePath + projectName + "_" + compName + "_" + fileSuffix + extension);
        file.encoding = "UTF-8";

        if (file != null) {
            if (file.open("w")) {
                file.write(content);
                file.close();
                alert("File successfully written: " + file.fsName); // Debugging alert
            } else {
                alert("Failed to write file. Please check your permissions.");
            }
        }
    }

    var scriptName = "Export Expressions";
    var UI = createUserInterface(thisObj, resourceString, scriptName);

})(this);
