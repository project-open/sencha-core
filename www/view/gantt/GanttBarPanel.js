/*
 * GanttBarPanel.js
 *
 * Copyright (c) 2011 - 2015 ]project-open[ Business Solutions, S.L.
 * This file may be used under the terms of the GNU General Public
 * License version 3.0 or alternatively unter the terms of the ]po[
 * FL or CL license as specified in www.project-open.com/en/license.
 */

/**
 * Gantt panel for GanttEditor, displaying the list of 
 * task of a single project.
 * Relies on GanttTreePanel for the Y position of the bars.
 */
Ext.define('PO.view.gantt.GanttBarPanel', {
    extend: 'PO.view.gantt.AbstractGanttPanel',
    requires: [
        'PO.view.gantt.AbstractGanttPanel',
        'Ext.draw.Component',
        'Ext.draw.Surface',
        'Ext.layout.component.Draw'
    ],

    debug: false,
    taskBBoxHash: {},								// Hash array from object_ids -> Start/end point
    taskModelHash: {},								// Start and end date of tasks
    preferenceStore: null,

    /**
     * Starts the main editor panel as the right-hand side
     * of a project grid and a cost center grid for the departments
     * of the resources used in the projects.
     */
    initComponent: function() {
        var me = this;
        if (me.debug) console.log('PO.view.gantt_editor.GanttBarPanel.initComponent: Starting');
        this.callParent(arguments);

        me.barHeight = 15;
        me.arrowheadSize = 5;

        // Attract events from the TreePanel showing the task names etc.
        me.objectPanel.on({
            'itemexpand': me.onItemExpand,
            'itemcollapse': me.onItemCollapse,
            'itemmove': me.redraw,
            'itemremove': me.redraw,
            'iteminsert': me.redraw,
            'itemappend': me.redraw,
            'resize': me.redraw,
            'columnschanged': me.redraw,
            'scope': this
        });;

        // Catch the moment when the "view" of the Project grid
        // is ready in order to draw the GanttBars for the first time.
        // The view seems to take a while...
        me.objectPanel.on({
            'viewready': me.onProjectGridViewReady,
            'sortchange': me.onProjectGridSortChange,
            'scope': this
        });

        // Catch the event that the object got moved
        me.on({
            'spriterightclick': me.onSpriteRightClick,
            'resize': me.redraw,
            'scope': this
        });

        // Iterate through all children of the root node and check if they are visible
        me.objectStore.on({
            'datachanged': me.redraw,
            'scope': this
        });

        var rootNode = me.objectStore.getRootNode();
        rootNode.cascadeBy(function(model) {
            var id = model.get('id');
            me.taskModelHash[id] = model;					// Quick storage of models
        });

        this.addEvents('move');

        if (me.debug) console.log('PO.view.gantt_editor.GanttBarPanel.initComponent: Finished');
    },

    /**
     * The user has collapsed a super-task in the GanttTreePanel.
     * We now save the 'c'=closed status using a ]po[ URL.
     * These values will appear in the TaskTreeStore.
     */
    onItemCollapse: function(taskModel) {
        var me = this;
        var object_id = taskModel.get('id');
        Ext.Ajax.request({
            url: '/intranet/biz-object-tree-open-close.tcl',
            params: { 'object_id': object_id, 'open_p': 'c' }
        });

        me.redraw();
    },

   /**
     * The user has expanded a super-task in the GanttTreePanel.
     * Please see onItemCollapse for further documentation.
     */
    onItemExpand: function(taskModel) {
        var me = this;
        if (me.debug) console.log('PO.class.GanttDrawComponent.onItemExpand: ');

        // Remember the new state
        var object_id = taskModel.get('id');
        Ext.Ajax.request({
            url: '/intranet/biz-object-tree-open-close.tcl',
            params: { 'object_id': object_id, 'open_p': 'o' }
        });

        me.redraw();
    },

    /**
     * The list of tasks is (finally...) ready to be displayed.
     * We need to wait until this one-time event in in order to
     * set the width of the surface and to perform the first redraw().
     * Write the selection preferences into the SelModel.
     */
    onProjectGridViewReady: function() {
        var me = this;
        if (me.debug) console.log('PO.view.gantt_editor.GanttBarPanel.onProjectGridViewReady: Starting');

        if (me.debug) console.log('PO.view.gantt_editor.GanttBarPanel.onProjectGridViewReady: Finished');
    },

    onProjectGridSortChange: function(headerContainer, column, direction, eOpts) {
        var me = this;
        if (me.debug) console.log('PO.view.gantt_editor.GanttBarPanel.onProjectGridSortChange: Starting');
        me.redraw();
        if (me.debug) console.log('PO.view.gantt_editor.GanttBarPanel.onProjectGridSortChange: Finished');
    },

    /**
     * The user has right-clicked on a sprite.
     */
    onSpriteRightClick: function(event, sprite) {
        var me = this;
        if (me.debug) console.log('PO.view.gantt_editor.GanttBarPanel.onSpriteRightClick: Starting: '+ sprite);
        if (null == sprite) { return; }     				    	// Something went completely wrong...

        var dndConfig = sprite.dndConfig;
        if (!!dndConfig) {
            this.onProjectRightClick(event, sprite);
            return;
        }

        var dependencyModel = sprite.dependencyModel;
        if (!!dependencyModel) {
            this.onDependencyRightClick(event, sprite);
            return;
        }
        if (me.debug) { console.log('PO.view.gantt_editor.GanttBarPanel.onSpriteRightClick: Unknown sprite:'); console.log(sprite); }
    },

    /**
     * The user has right-clicked on a dependency.
     */
    onDependencyRightClick: function(event, sprite) {
        var me = this;
        if (me.debug) console.log('PO.view.gantt_editor.GanttBarPanel.onDependencyRightClick: Starting: '+ sprite);
        if (null == sprite) { return; }     					// Something went completely wrong...
        var dependencyModel = sprite.dependencyModel;

        // Menu for right-clicking a dependency arrow.
        if (!me.dependencyContextMenu) {
            me.dependencyContextMenu = Ext.create('Ext.menu.Menu', {
                id: 'dependencyContextMenu',
                style: {overflow: 'visible'},					// For the Combo popup
                items: [{
                    text: 'Delete Dependency',
                    handler: function() {
                        if (me.debug) console.log('dependencyContextMenu.deleteDependency: ');
                        var predId = dependencyModel.pred_id;
                        var succId = dependencyModel.succ_id;
                        var succModel = me.taskModelHash[succId];	// Dependencies are stored as succModel.predecessors

                        var predecessors = succModel.get('predecessors');
                	var orgPredecessorsLen = predecessors.length
                        for (i = 0; i < predecessors.length; i++) {
                            var el = predecessors[i];
                            if (el.pred_id == predId) {
                        	predecessors.splice(i,1);
                            }
                        }
                        succModel.set('predecessors',predecessors);
                	if (predecessors.length != orgPredecessorsLen) {
                	    me.redraw();
                	}
                    }
                }]
            });
        }
        me.dependencyContextMenu.showAt(event.getXY());
        if (me.debug) console.log('PO.view.gantt_editor.GanttBarPanel.onDependencyRightClick: Finished');
    },

    /**
     * The user has right-clicked on a project bar
     */
    onProjectRightClick: function(event, sprite) {
        var me = this;
        if (me.debug) console.log('PO.view.gantt_editor.GanttBarPanel.onProjectRightClick: '+ sprite);
        if (null == sprite) { return; }     					// Something went completely wrong...
    },

    /**
     * Move the project forward or backward in time.
     * This function is called by onMouseUp as a
     * successful "drop" action of a drag-and-drop.
     */
    onProjectMove: function(projectSprite, xDiff) {
        var me = this;
        var projectModel = projectSprite.dndConfig.model;
        if (!projectModel) return;
        var projectId = projectModel.get('id');
        if (me.debug) console.log('PO.view.gantt_editor.GanttBarPanel.onProjectMove: Starting');

        var bBox = me.dndBaseSprite.getBBox();					// Get the current coordinates of the moved Gantt bar
        var diffTime = xDiff * (me.axisEndDate.getTime() - me.axisStartDate.getTime()) / (me.axisEndX - me.axisStartX);
	var diffDays = Math.round(diffTime / 24.0 / 3600.0 / 1000.0);

        var startDate = Date.fromPg(projectModel.get('start_date'));
        var endDate = Date.fromPg(projectModel.get('end_date'));
        var startTime = startDate.getTime();
        var endTime = endDate.getTime();

        // Save original start- and end time in non-model variables
        if (!projectModel.orgStartTime) {
            projectModel.orgStartTime = startTime;
            projectModel.orgEndTime = endTime;
        }

        startTime = startTime + diffDays * 24.0 * 3600 * 1000;
        endTime = endTime + diffDays * 24.0 * 3600 * 1000;

        var newStartDate = new Date(startTime);
        var newEndDate = new Date(endTime);

        projectModel.set('start_date', newStartDate.toPg());
        projectModel.set('end_date', newEndDate.toPg());

        me.redraw();
        if (me.debug) console.log('PO.view.gantt_editor.GanttBarPanel.onProjectMove: Finished');
    },

    /**
     * Move the end-date of the project forward or backward in time.
     * This function is called after a successful drag-and-drop operation
     * of the "resize handle" of the bar.
     */
    onProjectResize: function(projectSprite, xDiff) {
        var me = this;
        var projectModel = projectSprite.dndConfig.model;
        if (!projectModel) return;
        var projectId = projectModel.get('id');
        if (me.debug) console.log('PO.view.gantt_editor.GanttBarPanel.onProjectResize: Starting');

        var bBox = me.dndBaseSprite.getBBox();
        var diffTime = Math.floor(1.0 * xDiff * (me.axisEndDate.getTime() - me.axisStartDate.getTime()) / (me.axisEndX - me.axisStartX));
        var endTime = new Date(projectModel.get('end_date')).getTime();

        // Save original start- and end time in non-model variables
        if (!projectModel.orgEndTime) {
            projectModel.orgEndTime = endTime;
        }
        endTime = endTime + diffTime;
        var endDate = new Date(endTime);
        projectModel.set('end_date', endDate.toPg());

        me.redraw();
        if (me.debug) console.log('PO.view.gantt_editor.GanttBarPanel.onProjectResize: Finished');
    },

    /**
     * Move the end of the percent_completed bar according to mouse-up position.
     */
    onProjectPercentResize: function(projectSprite, percentSprite) {
        var me = this;
        var projectModel = projectSprite.dndConfig.model;
        if (!projectModel) return;
        var projectId = projectModel.get('id');
        if (me.debug) console.log('PO.view.gantt_editor.GanttBarPanel.onProjectPercentResize: Starting');

        var projectBBox = projectSprite.getBBox();
        var percentBBox = percentSprite.getBBox();

        var projectWidth = projectBBox.width;
        if (0 == projectWidth) projectWidth = projectWidth + 1;			// Avoid division by zero.
        var percent = Math.floor(100.0 * percentBBox.width / projectWidth);
        if (percent > 100.0) percent = 100;
        if (percent < 0) percent = 0;
        projectModel.set('percent_completed', ""+percent);			// Write to project model and update tree via events

        me.redraw();			      					// redraw the entire Gantt editor surface. ToDo: optimize
        if (me.debug) console.log('PO.view.gantt_editor.GanttBarPanel.onProjectPercentResize: Finished');
    },

    /**
     * Create a dependency between two two tasks.
     * This function is called by onMouseUp as a successful 
     * "drop" action if the drop target is another project.
     */
    onCreateDependency: function(fromSprite, toSprite) {
        var me = this;
        var fromTaskModel = fromSprite.dndConfig.model;
        var toTaskModel = toSprite.dndConfig.model;
        if (null == fromTaskModel) return;
        if (null == toTaskModel) return;
        if (me.debug) console.log('PO.view.portfolio_planner.PortfolioPlannerTaskPanel.onCreateDependency: Starting: '+fromTaskModel.get('id')+' -> '+toTaskModel.get('id'));

        // Try connecting the two tasks via a task dependency
        var fromTaskId = fromTaskModel.get('task_id');				// String value!
        if (null == fromTaskId) { return; }					// Something went wrong...
        var toTaskId = toTaskModel.get('task_id');				// String value!
        if (null == toTaskId) { return; }					// Something went wrong...

        // Create a new dependency object
        if (me.debug) console.log('PO.view.gantt.GanttBarPanel.createDependency: '+fromTaskId+' -> '+toTaskId);
        var dependency = {
            pred_id: parseInt(fromTaskId),
            succ_id: parseInt(toTaskId),
            type_id: 9650,							// "Depend", please see im_categories.category_id
            diff: 0.0
        };
        var dependencies = toTaskModel.get('predecessors');
        dependencies.push(dependency);
        toTaskModel.set('predecessors', dependencies);

        me.redraw();

        if (me.debug) console.log('PO.view.portfolio_planner.PortfolioPlannerProjectPanel.onCreateDependency: Finished');
    },

    /**
     * Draw all Gantt bars
     */
    redraw: function(a, b, c, d, e) {
        var me = this;
        if (me.debug) console.log('PO.class.GanttDrawComponent.redraw: Starting');
        if (undefined === me.surface) { return; }

        me.surface.removeAll();
        me.surface.setSize(me.ganttSurfaceWidth, me.surface.height);		// Set the size of the drawing area
        me.drawAxis();								// Draw the top axis

        // Iterate through all children of the root node and check if they are visible
        var ganttTreeView = me.objectPanel.getView();
        var rootNode = me.objectStore.getRootNode();
        rootNode.cascadeBy(function(model) {
            var viewNode = ganttTreeView.getNode(model);
            if (viewNode == null) { return; }					// Hidden nodes have no viewNode -> no bar
            me.drawProjectBar(model);
        });
        
        // Iterate through all children and draw dependencies
        rootNode.cascadeBy(function(model) {
            var viewNode = ganttTreeView.getNode(model);
            if (viewNode == null) { return; }					// Hidden nodes have no viewNode -> no bar
            me.drawProjectDependencies(model);
        });
        if (me.debug) console.log('PO.class.GanttDrawComponent.redraw: Finished');
    },

    /**
     * Draw a single bar for a project or task
     */
    drawProjectBar: function(project) {
        var me = this;
        if (me.debug) { if (me.debug) console.log('PO.view.gantt_editor.GanttBarPanel.drawProjectBar'); }

        var surface = me.surface;
        var project_name = project.get('project_name');
        var percentCompleted = parseFloat(project.get('percent_completed'));
        var predecessors = project.get('predecessors');
        var assignees = project.get('assignees');				// Array of {id, percent, name, email, initials}
        var startTime = new Date(project.get('start_date')).getTime();				// milliseconds after 1970-01-01
        var endTime = new Date(project.get('end_date')).getTime();	// end_date means 23:59:59 of that day

        var x = me.date2x(startTime);						// X position based on time scale
        var y = me.calcGanttBarYPosition(project);				// Y position based on TreePanel y position of task.
        var w = Math.floor(me.ganttSurfaceWidth * (endTime - startTime) / (me.axisEndDate.getTime() - me.axisStartDate.getTime()));
        var h = me.ganttBarHeight;						// Constant determines height of the bar
        var d = Math.floor(h / 2.0) + 1;					// Size of the indent of the super-project bar

        // Store the start and end points of the Gantt bar
        var id = project.get('id');
        me.taskBBoxHash[id] = [x, y, x+w, y+h];					// Remember the outer dimensions of the box for dependency drawing
        me.taskModelHash[id] = project;						// Remember the models per ID

        if (!project.hasChildNodes()) {						// Parent tasks don't have DnD and look different
            // The main Gantt bar with Drag-and-Drop configuration
            var spriteBar = surface.add({
                type: 'rect', x: x, y: y, width: w, height: h, radius: 3,
                fill: 'url(#gradientId)',
                stroke: 'blue',
                'stroke-width': 0.3,
                zIndex: 0,							// Neutral zIndex - in the middle
                listeners: {							// Highlight the sprite on mouse-over
                    mouseover: function() { this.animate({duration: 500, to: {'stroke-width': 0.5}}); },
                    mouseout: function()  { this.animate({duration: 500, to: {'stroke-width': 0.3}}); }
                }
            }).show(true);
            spriteBar.dndConfig = {						// Drag-and-drop configuration
                model: project,							// Store the task information for the sprite
                baseSprite: spriteBar,						// "Base" sprite for the DnD action
                dragAction: function(panel, e, diff, dndConfig) {		// Executed onMouseMove in AbstractGanttPanel
                    var shadow = panel.dndShadowSprite;				// Sprite "shadow" (copy of baseSprite) to move around
                    shadow.setAttributes({translate: {x: diff[0], y: 0}}, true);// Move shadow according to mouse position
                },
                dropAction: function(panel, e, diff, dndConfig) {		// Executed onMouseUp in AbastractGanttPanel
                    if (me.debug) console.log('PO.view.gantt_editor.GanttBarPanel.drawProjectBar.spriteBar.dropAction:');
                    var point = me.getMousePoint(e);				// Corrected mouse coordinates
                    var baseSprite = panel.dndBaseSprite;			// spriteBar to be affected by DnD
                    if (!baseSprite) { return; }				// Something went completely wrong...
                    var dropSprite = panel.getSpriteForPoint(point);		// Check where the user has dropped the shadow
                    if (baseSprite == dropSprite) { dropSprite = null; }	// Dropped on same sprite? => normal drop
                    if (0 == Math.abs(diff[0]) + Math.abs(diff[1])) {  		// Same point as before?
                        return;							// Drag-start == drag-end or single-click
                    }
                    if (null != dropSprite) {
                        me.onCreateDependency(baseSprite, dropSprite);		// Dropped on another sprite - create dependency
                    } else {
                        me.onProjectMove(baseSprite, diff[0]);			// Dropped on empty space or on the same bar
                    }
                }
            };

            // Resize-Handle of the Gantt Bar: This is an invisible box at the right end of the bar
            // used to change the cursor and to initiate a specific resizing DnD operation.
            var spriteBarHandle = surface.add({
                type: 'rect', x: x+w, y: y, width: 4, height: h,		// Located at the right edge of spriteBar.
                stroke: 'red',	 	      	     				// For debugging - not visible
                fill: 'red',							// Need to be filled for cursor display
                opacity: 0.0,							// Invisible
                zIndex: 50,							// At the very top of the z-stack
                style: { cursor: 'e-resize' }					// Shows a horizontal arrow cursor
            }).show(true);
            spriteBarHandle.dndConfig = {
                model: project,							// Store the task information for the sprite
                baseSprite: spriteBar,
                dragAction: function(panel, e, diff, dndConfig) {
                    if (me.debug) console.log('PO.view.gantt_editor.GanttBarPanel.drawProjectBar.spriteBarHandle.dragAction:');
                    var baseBBox = panel.dndBaseSprite.getBBox();
                    var shadow = panel.dndShadowSprite;
                    shadow.setAttributes({
                        width: baseBBox.width + diff[0]
                    }).show(true);
                },
                dropAction: function(panel, e, diff, dndConfig) {
                    if (me.debug) console.log('PO.view.gantt_editor.GanttBarPanel.drawProjectBar.spriteBarHandle.dropAction:');
                    me.onProjectResize(panel.dndBaseSprite, diff[0]);		// Changing end-date to match x coo
                }
            };

            // Percent_complete bar on top of the Gantt bar:
            // Allows for special DnD affecting only %done.
            var opacity = 0.0;
            if (isNaN(percentCompleted)) percentCompleted = 0;
            if (percentCompleted > 0.0) opacity = 1.0;
            var percentW = w*percentCompleted/100;
            if (percentW < 2) percentW = 2;
            var spriteBarPercent = surface.add({
                type: 'rect', x: x, y: y+2, width: percentW, height: (h-6)/2,
                stroke: 'black',
                fill: 'black',
                'stroke-width': 0.0,
                zIndex: 20,
                opacity: opacity
            }).show(true);

            var spriteBarPercentHandle = surface.add({
                type: 'rect', x: x+percentW-8, y: y, width: 6, height: h,	// -8: Draw handle left of the resize handle above
                stroke: 'red',
                fill: 'red',
                opacity: 0.0,
                zIndex: 40,
                style: { cursor: 'col-resize' }					// Set special cursor shape ("column resize")
            }).show(true);
            spriteBarPercentHandle.dndConfig = {
                model: project,							// Store the task information for the sprite
                baseSprite: spriteBarPercent,
                projectSprite: spriteBar,
                dragAction: function(panel, e, diff, dndConfig) {
                    if (me.debug) console.log('PO.view.gantt_editor.GanttBarPanel.drawProjectBar.spriteBarPercent.dragAction:');
                    var baseBBox = panel.dndBaseSprite.getBBox();
                    var shadow = panel.dndShadowSprite;
                    shadow.setAttributes({
                        width: baseBBox.width + diff[0]
                    }).show(true);
                },
                dropAction: function(panel, e, diff, dndConfig) {
                    if (me.debug) console.log('PO.view.gantt_editor.GanttBarPanel.drawProjectBar.spriteBarPercent.dropAction:');
                    var shadow = panel.dndShadowSprite;
                    me.onProjectPercentResize(dndConfig.projectSprite, shadow);	// Changing end-date to match x coo
                }
            };

        } else {
            var spriteBar = surface.add({
                type: 'path',
                stroke: 'blue',
                'stroke-width': 0.3,
                fill: 'url(#gradientId)',
                zIndex: 0,
                path: 'M '+ x + ', ' + y
                    + 'L '+ (x+w) + ', ' + (y)
                    + 'L '+ (x+w) + ', ' + (y+h)
                    + 'L '+ (x+w-d) + ', ' + (y+h-d)
                    + 'L '+ (x+d) + ', ' + (y+h-d)
                    + 'L '+ (x) + ', ' + (y+h)
                    + 'L '+ (x) + ', ' + (y),
                listeners: {							// Highlight the sprite on mouse-over
                    mouseover: function() { this.animate({duration: 500, to: {'stroke-width': 2.0}}); },
                    mouseout: function()  { this.animate({duration: 500, to: {'stroke-width': 0.3}}); }
                }
            }).show(true);
        }
        
        // Convert assignment information into a string
        // and write behind the Gantt bar
        var projectMemberStore = Ext.StoreManager.get('projectMemberStore');
        var text = "";
        if ("" != assignees) {
            assignees.forEach(function(assignee) {
                if (0 == assignee.percent) { return; }				// Don't show empty assignments
                var userModel = projectMemberStore.getById(""+assignee.user_id);
                if ("" != text) { text = text + ', '; }
                text = text + userModel.get('first_names').substr(0, 1) + userModel.get('last_name').substr(0, 1);
                if (100 != assignee.percent) {
                    text = text + '['+assignee.percent+'%]';
                }
            });
            var axisText = surface.add({type:'text', text:text, x:x+w+2, y:y+d, fill:'#000', font:"10px Arial"}).show(true);
        }
    },

    /**
     * Iterate throught all successors of a Gantt bar
     * and draw dependencies.
     */
    drawProjectDependencies: function(project) {
        var me = this;

        var predecessors = project.get('predecessors');
        if (!predecessors instanceof Array) return;
        if (!me.preferenceStore.getPreferenceBoolean('show_project_dependencies', true)) return;

        for (var i = 0, len = predecessors.length; i < len; i++) {
            var dependencyModel = predecessors[i];
            me.drawDependency(dependencyModel);
        }
    },

    /**
     * Draws a dependency line from one bar to the next one
     */
    drawDependency: function(dependencyModel) {
        var me = this;
	if (me.debug) if (me.debug) console.log('PO.view.portfolio_planner.PortfolioPlannerProjectPanel.drawTaskDependency: Starting');

        var fromId = dependencyModel.pred_id;
        var toId = dependencyModel.succ_id;
        var s = me.arrowheadSize;

        var fromBBox = me.taskBBoxHash[fromId];					// We start drawing with the end of the first bar...
        var fromModel = me.taskModelHash[fromId]
        var toBBox = me.taskBBoxHash[toId];			        	// .. and draw towards the start of the 2nd bar.
        var toModel = me.taskModelHash[toId]
        if (!fromBBox || !toBBox) { return; }

        // Add a tool tip to the dependency
        var html = "<b>Task dependency</b>:<br>" +
            "From <a href='/intranet/projects/view?project_id=" + fromId + "' target='_blank'>" + fromModel.get('project_name') + "</a> " +
            "to <a href='/intranet/projects/view?project_id=" + toId + "' target='_blank'>" + toModel.get('project_name') + "</a>";

	me.drawDependencyMsp(dependencyModel,html);
	if (me.debug) if (me.debug) console.log('PO.view.portfolio_planner.PortfolioPlannerProjectPanel.drawTaskDependency: Finished');
    },



    /**
     * Draws a dependency line from one bar to the next one
     */
    drawDependencyMsp: function(dependencyModel) {
        var me = this;

        var fromId = dependencyModel.pred_id;
        var toId = dependencyModel.succ_id;
        var s = me.arrowheadSize;

        var fromBBox = me.taskBBoxHash[fromId];					// We start drawing with the end of the first bar...
        var fromModel = me.taskModelHash[fromId]
        var toBBox = me.taskBBoxHash[toId];			        	// .. and draw towards the start of the 2nd bar.
        var toModel = me.taskModelHash[toId]
        if (!fromBBox || !toBBox) { return; }

        var startX = fromBBox[2];						// End-to-start dependencies from a earlier task to a later task
        var startY = fromBBox[3];
        var endX = toBBox[0];
        var endY = toBBox[1];

        // Color: Arrows are black if dependencies are OK, or red otherwise
        var color = '#222';
        if (endX < startX) { color = 'red'; }

        // Set the vertical start point to Correct the start/end Y position
        // and the direction of the arrow head
        var sDirected = null;
        if (endY > startY) {
            // startY = startY + me.barHeight;
            sDirected = -s;							// Draw "normal" arrowhead pointing downwards
            startY = startY - 2;
            endY = endY + 0;
        } else {
            startY = startY - me.barHeight + 4;
            endY = endY + me.barHeight - 2;
            sDirected = +s;							// Draw arrowhead pointing upward
        }

        // Draw the arrow head (filled)
        var arrowHead = me.surface.add({
            type: 'path',
            stroke: color,
            fill: color,
            'stroke-width': 0.5,
            zIndex: -100,
            path: 'M '+ (endX)   + ', ' + (endY)					// Point of arrow head
                + 'L '+ (endX-s) + ', ' + (endY + sDirected)
                + 'L '+ (endX+s) + ', ' + (endY + sDirected)
                + 'L '+ (endX)   + ', ' + (endY)
        }).show(true);
        arrowHead.dependencyModel = dependencyModel;

        // Draw the main connection line between start and end.
        var arrowLine = me.surface.add({
            type: 'path',
            stroke: color,
            'shape-rendering': 'crispy-edges',
            'stroke-width': 0.5,
            zIndex: -100,
            path: 'M '+ (startX) + ', ' + (startY)
                + 'L '+ (startX) + ', ' + (startY - sDirected)
                + 'L '+ (endX)   + ', ' + (endY + sDirected * 2)
                + 'L '+ (endX)   + ', ' + (endY + sDirected)
        }).show(true);
        arrowHead.dependencyModel = dependencyModel;

        // Add a tool tip to the dependency
        var html = "<b>Task dependency</b>:<br>" +
            "From <a href='/intranet/projects/view?project_id=" + fromId + "' target='_blank'>" + fromModel.get('project_name') + "</a> " +
            "to <a href='/intranet/projects/view?project_id=" + toId + "' target='_blank'>" + toModel.get('project_name') + "</a>";

        // Give 1 second to click on project link
        var tip1 = Ext.create("Ext.tip.ToolTip", { target: arrowHead.el, width: 250, html: html, hideDelay: 1000 });
        var tip2 = Ext.create("Ext.tip.ToolTip", { target: arrowLine.el, width: 250, html: html, hideDelay: 1000 });
        if (me.debug) console.log('PO.view.portfolio_planner.PortfolioPlannerProjectPanel.drawTaskDependency: Finished');
        return;
    }
});

