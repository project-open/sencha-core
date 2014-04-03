// /sencha-core/www/controller/gantt/GanttButtonController.js
//
// Copyright (C) 2013 ]project-open[
//
// All rights reserved. Please see
// http://www.project-open.com/license/ for details.
//

/*
 * GanttButtonController
*/

Ext.define('PO.controller.gantt.GanttButtonController', {
    extend: 'Ext.app.Controller',

    // Variables
    debug: false,
    'renderDiv': null,
    'ganttEditor': null,
    'ganttButtonController': null,
    'ganttTreePanel': null,
    'ganttDrawComponent': null,
    'ganttTimeline': null,                                        // x3 time axis

    refs: [
        { ref: 'ganttTreePanel', selector: '#ganttTreePanel' }
    ],
    
    init: function() {
	var me = this;
        if (me.debug) { console.log('PO.controller.gantt.GanttButtonController: init'); }

        this.control({
            '#buttonLoad': { click: this.onButtonLoad },
            '#buttonSave': { click: this.onButton },
            '#buttonAdd': { click: { fn: me.ganttTreePanel.onButtonAdd, scope: me.ganttTreePanel }},
            '#buttonDelete': { click: { fn: me.ganttTreePanel.onButtonDelete, scope: me.ganttTreePanel }},
            '#buttonReduceIndent': { click: { fn: me.ganttTreePanel.onButtonReduceIndent, scope: me.ganttTreePanel }},
            '#buttonIncreaseIndent': { click: { fn: me.ganttTreePanel.onButtonIncreaseIndent, scope: me.ganttTreePanel }},
            '#buttonAddDependency': { click: this.onButton },
            '#buttonBreakDependency': { click: this.onButton },
            '#buttonZoomIn': { click: this.onZoomIn },
            '#buttonZoomOut': { click: this.onZoomOut },
            '#buttonSettings': { click: this.onButton },
            scope: me.ganttTreePanel
        });

        // Listen to changes in the selction model in order to enable/disable the "delete" button.
        me.ganttTreePanel.on('selectionchange', this.onTreePanelSelectionChange, this);

        // Listen to a click into the empty space below the tree in order to add a new task
        me.ganttTreePanel.on('containerclick', me.ganttTreePanel.onContainerClick, me.ganttTreePanel);

        // Listen to special keys
        me.ganttTreePanel.on('cellkeydown', this.onCellKeyDown, me.ganttTreePanel);
        me.ganttTreePanel.on('beforecellkeydown', this.onBeforeCellKeyDown, me.ganttTreePanel);

	// Deal with mouse move events from both surfaces
	me.ganttTimeline.on('move', this.onTimelineMove, me);
	me.ganttDrawComponent.on('move', this.onDrawComponentMove, me);

        return this;
    },

    onButtonLoad: function() {
        console.log('GanttButtonController.ButtonLoad');
    },

    onButtonSave: function() {
        console.log('GanttButtonController.ButtonSave');
    },

    onZoomIn: function() {
        console.log('GanttButtonController.onZoomIn');
	this.ganttDrawComponent.onZoomIn();
	this.ganttTimeline.onZoomIn();
    },

    onZoomOut: function() {
        console.log('GanttButtonController.onZoomOut');
	this.ganttDrawComponent.onZoomOut();
	this.ganttTimeline.onZoomOut();
    },

    /**
     * The user is drag-and-dropping the Timeline around.
     * Now update the main DrawComponent accordingly.
     */
    onTimelineMove: function(dist) {
        // console.log('GanttButtonController.onTimelineMove: dist='+dist);
	var axisFactor = this.ganttTimeline.axisFactor;
        this.ganttDrawComponent.translate(dist * axisFactor);	// Move the DrawComponent multiplied

	// ToDo: There are still some break when switching between the surfaces
	// this.ganttDrawComponent.dndBase[0] = -dist;
    },

    /**
     * The user is drag-and-dropping the main DrawComponent around.
     * Now move the Timeline accordingly.
     */
    onDrawComponentMove: function(dist) {
        console.log('GanttButtonController.onDrawComponentMove: dist='+dist);
	var axisFactor = this.ganttTimeline.axisFactor;
        this.ganttTimeline.translate(dist / axisFactor);	// Move the Timeline by a fraction

	// ToDo: There are still some break when switching between the surfaces
	// this.ganttTimeline.dndBase[0] = -dist;
    },

    /**
     * Control the enabled/disabled status of the (-) (Delete) button
     */
    onTreePanelSelectionChange: function(view, records) {
        if (this.debug) { console.log('GanttButtonController.onTreePanelSelectionChange'); }
        var buttonDelete = Ext.getCmp('buttonDelete');

        if (1 == records.length) {            // Exactly one record enabled
            var record = records[0];
            buttonDelete.setDisabled(!record.isLeaf());
        } else {                              // Zero or two or more records enabled
            buttonDelete.setDisabled(true);
        }
    },

    /**
     * Disable default tree key actions
     */
    onBeforeCellKeyDown: function(me, htmlTd, cellIndex, record, htmlTr, rowIndex, e, eOpts ) {
        var keyCode = e.getKey();
        var keyCtrl = e.ctrlKey;
        if (this.debug) { console.log('GanttButtonController.onBeforeCellKeyDown: code='+keyCode+', ctrl='+keyCtrl); }
        var panel = this;
        switch (keyCode) {
        case 8: 				// backspace 8
            panel.onButtonDelete();
            break;
        case 37: 				// cursor left
            if (keyCtrl) {
        	panel.onButtonReduceIndent();
        	return false;                   // Disable default action (fold tree)
            }
            break;
        case 39: 				// cursor right
            if (keyCtrl) {
        	panel.onButtonIncreaseIndent();
        	return false;                   // Disable default action (unfold tree)
            }
            break;
        case 45: 				// insert 45
            panel.onButtonAdd();
            break;
        case 46: 				// delete 46
            panel.onButtonDelete();
            break;
        }

        return true;                            // Enable default TreePanel actions for keys
    },

    /**
     * Handle various key actions
     */
    onCellKeyDown: function(table, htmlTd, cellIndex, record, htmlTr, rowIndex, e, eOpts) {
        var keyCode = e.getKey();
        var keyCtrl = e.ctrlKey;
        // console.log('GanttButtonController.onCellKeyDown: code='+keyCode+', ctrl='+keyCtrl);
    },


    /**
     * The windows as a whole was resized
     */
    onWindowsResize: function(width, height) {
        console.log('GanttButtonController.onWindowResize');
        var me = this;
        var sideBar = Ext.get('sidebar');				// ]po[ left side bar component
        var sideBarSize = sideBar.getSize();

	me.onResize(sideBarSize.width);
    },

    /**
     * The ]po[ left sideBar was resized
     */
    onSideBarResize: function(event, el, config) {
        console.log('GanttButtonController.onSideBarResize');
        var me = this;
        var sideBar = Ext.get('sidebar');				// ]po[ left side bar component
        var sideBarSize = sideBar.getSize();

	// We get the event _before_ the sideBar has changed it's size.
	// So we actually need to the the oposite of the sidebar size:
	if (sideBarSize.width > 100) {
	    sideBarSize.width = -5;
	} else {
	    sideBarSize.width = 245;
	}

	me.onResize(sideBarSize.width);
    },

    /**
     * Generic resizing function, called with the target width of the sideBar
     */
    onResize: function(sideBarWidth) {
        console.log('GanttButtonController.onResize: '+sideBarWidth);
        var me = this;
        var screenSize = Ext.getBody().getViewSize();
        var height = me.ganttEditor.getSize().height;
        var width = screenSize.width - sideBarWidth - 75;
        me.ganttEditor.setSize(width, height);
    }
    
});

