/*
 * ResizeController.js
 *
 * Copyright (c) 2011 - 2014 ]project-open[ Business Solutions, S.L.
 * This file may be used under the terms of the GNU General Public
 * License version 3.0 or alternatively unter the terms of the ]po[
 * FL or CL license as specified in www.project-open.com/en/license.
 */

/**
 * ResizeController
 *
 * This controller is responsible for editor geometry and resizing:
 * <ul>
 * <li>The boundaries of the outer window
 * <li>The separator between the treePanel and the ganttPanel
 * </ul>
 */
Ext.define('PO.controller.ResizeController', {
    extend: 'Ext.app.Controller',
    debug: false,
    'outerContainer': null,						// Defined during initialization

    init: function() {
        var me = this;
        if (me.debug) { if (me.debug) console.log('PO.controller.gantt_editor.GanttResizeController: init'); }

        var sideBarTab = Ext.get('sideBarTab');	    			// ]po[ side-bar collapses the left-hand menu
        sideBarTab.on('click', me.onSideBarResize, me);			// Handle collapsable side menu
        Ext.EventManager.onWindowResize(me.onWindowResize, me);		// Deal with resizing the main window
        me.outerContainer.on('resize', me.onGanttPanelContainerResize, me);	// Deal with resizing the outer boundaries
        return this;
    },

    /**
     * Adapt the size of the outerContainer (the outer Gantt panel)
     * to the available drawing area.
     * Takes the size of the browser and subtracts the sideBar at the
     * left and the size of the menu on top.
     */
    onResize: function (sideBarWidth) {
        var me = this;
        if (me.debug) console.log('PO.controller.gantt_editor.GanttResizeController.onResize: Starting');
        var sideBar = Ext.get('sidebar');				// ]po[ left side bar component

        if (undefined === sideBarWidth) {
            sideBarWidth = sideBar.getSize().width;
        }

        var screenSize = Ext.getBody().getViewSize();			// Total browser size
        var width = screenSize.width - sideBarWidth - 100;		// What's left after ]po[ side borders
        var height = screenSize.height - 280;	  			// What's left after ]po[ menu bar on top
        me.outerContainer.setSize(width, height);
        if (me.debug) console.log('PO.controller.gantt_editor.GanttResizeController.onResize: Finished');
    },

    /**
     * Clicked on the ]po[ "side menu" bar for showing/hiding the left-menu
     */
    onSideBarResize: function () {
        var me = this;
        if (me.debug) console.log('PO.controller.gantt_editor.GanttResizeController.onSidebarResize: Starting');
        var sideBar = Ext.get('sidebar');				// ]po[ left side bar component
        var sideBarWidth = sideBar.getSize().width;
        // We get the event _before_ the sideBar has changed it's size.
        // So we actually need to the the oposite of the sidebar size:
        if (sideBarWidth > 100) {
            sideBarWidth = 2;						// Determines size when Sidebar collapsed
        } else {
            sideBarWidth = 245;						// Determines size when Sidebar visible
        }
        me.onResize(sideBarWidth);					// Perform actual resize
        if (me.debug) console.log('PO.controller.gantt_editor.GanttResizeController.onSidebarResize: Finished');
    },

    /**
     * The user changed the size of the browser window
     */
    onWindowResize: function () {
        var me = this;
        if (me.debug) console.log('PO.controller.gantt_editor.GanttResizeController.onWindowResize: Starting');

	if (!me.fullScreenP) {
	    var sideBar = Ext.get('sidebar');// ]po[ left side bar component
	    var sideBarWidth = sideBar.getSize().width;
	    if (sideBarWidth > 100) {
		sideBarWidth = 245;					// Determines size when Sidebar visible
	    } else {
		sideBarWidth = 2;					// Determines size when Sidebar collapsed
	    }
	    me.onResize(sideBarWidth);
	} else {
	    me.onSwitchToFullScreen();
	}
	
        if (me.debug) console.log('PO.controller.gantt_editor.GanttResizeController.onWindowResize: Finished');
    },

    /**
     * Manually changed the size of the outerContainer
     */
    onGanttPanelContainerResize: function () {
        var me = this;
        if (me.debug) console.log('PO.controller.gantt_editor.GanttResizeController.onGanttPanelContainerResize: Starting');

	// Fraber 160413: Nothing to do, really.

        if (me.debug) console.log('PO.controller.gantt_editor.GanttResizeController.onGanttPanelContainerResize: Finished');
    },

    onSwitchToFullScreen: function () {
        var me = this;
	me.fullScreenP = true; 
        if (me.debug) console.log('PO.controller.gantt_editor.GanttResizeController.onSwitchToFullScreen: Starting');

	// Set the outer container to the browser screen size
	me.outerContainer.setSize(Ext.getBody().getViewSize().width, Ext.getBody().getViewSize().height);

	// Fraber 160413: Nothing to do, really.

        if (me.debug) console.log('PO.controller.gantt_editor.GanttResizeController.onSwitchToFullScreen: Finished');
    },

    onSwitchBackFromFullScreen: function () {
        var me = this;
	me.fullScreenP = false; 
	
        if (me.debug) console.log('PO.controller.gantt_editor.GanttResizeController.onSwitchBackFromFullScreen: Starting');
	
        var sideBar = Ext.get('sidebar');                                   // ]po[ left side bar component
        var sideBarWidth = sideBar.getSize().width;
	
        if (undefined === sideBarWidth) {
            sideBarWidth = Ext.get('sidebar').getSize().width;
        }
	
        var screenSize = Ext.getBody().getViewSize();
        var width = screenSize.width - sideBarWidth - 100;
        var height = screenSize.height - 280;
	
        me.outerContainer.setSize(width, height);

        if (me.debug) console.log('PO.controller.gantt_editor.GanttResizeController.onSwitchBackFromFullScreen: Finished');
    }
});
