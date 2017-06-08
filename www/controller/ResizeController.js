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
 * This controller is responsible for the outer editor geometry and 
 * resizing when one of the following changes:
 * <ul>
 * <li>The boundaries of the outer window
 * <li>The separator between the treePanel and the ganttPanel
 * </ul>
 * However, resizes are separated from zooming or re-centering the 
 * Gantt bars.
 */
Ext.define('PO.controller.ResizeController', {
    extend: 'Ext.app.Controller',
    id: 'resizeController',
    debug: false,
    
    'renderDiv': null,								// We assume all app HTML drawn inside this DIV
    'outerContainer': null,							// Defined during initialization
    'redrawPanel': null,							// The panel with a needsRedraw variable

    init: function() {
        var me = this;
        if (me.debug) { if (me.debug) console.log('PO.controller.gantt_editor.GanttResizeController: init'); }

        var sideBarTab = Ext.get('sideBarTab');	    				// ]po[ side-bar collapses the left-hand menu
        if (sideBarTab)
            sideBarTab.on('click', me.onSideBarResize, me);			// Handle collapsable side menu

        var sidebarCloseButton = Ext.get('sidebar-close-button');	    	// ]po[ side-bar collapses the left-hand menu
        if (sidebarCloseButton)
            sidebarCloseButton.on('click', me.onSideBarResize, me);		// Handle collapsable side menu

        Ext.EventManager.onWindowResize(me.onWindowResize, me);			// Deal with resizing the main window

        me.outerContainer.on('resize', me.onGanttPanelContainerResize, me);	// Deal with resizing the outer boundaries

        if (me.redrawPanel)
            me.redrawPanel.on('resize', me.onGanttPanelContainerResize, me);	// Deal with resizing the inner boundaries

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
        var sideBar = Ext.get('sidebar');					// ]po[ left side bar component

        if (undefined === sideBarWidth) {
            if (sideBar)
                sideBarWidth = sideBar.getSize().width;
            else
                sideBarWidth = 0;
        }

        var screenSize = Ext.getBody().getViewSize();				// Total browser size
        var width = screenSize.width - sideBarWidth - 100;			// What's left after ]po[ side borders
        var height = screenSize.height - 280;	  				// What's left after ]po[ menu bar on top
        me.outerContainer.setSize(width, height);
        if (me.debug) console.log('PO.controller.gantt_editor.GanttResizeController.onResize: Finished');
    },

    /**
     * Clicked on the ]po[ "side menu" bar for showing/hiding the left-menu
     */
    onSideBarResize: function () {
        var me = this;
        if (me.debug) console.log('PO.controller.gantt_editor.GanttResizeController.onSidebarResize: Starting');
        var sideBar = Ext.get('sidebar');					// ]po[ left side bar component
        var sideBarWidth = sideBar.getSize().width;
        // We get the event _before_ the sideBar has changed it's size.
        // So we actually need to the the oposite of the sidebar size:
        if (sideBarWidth > 100) {
            sideBarWidth = 2;							// Determines size when Sidebar collapsed
        } else {
            sideBarWidth = 245;							// Determines size when Sidebar visible
        }
        me.onResize(sideBarWidth);						// Perform actual resize
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
            var sideBarWidth = 2;
            if (sideBar) sideBarWidth = sideBar.getSize().width;
            if (sideBarWidth > 100) {
                sideBarWidth = 245;						// Determines size when Sidebar visible
            } else {
                sideBarWidth = 2;						// Determines size when Sidebar collapsed
            }
            me.onResize(sideBarWidth);
        } else {
            me.onSwitchToFullScreen();
        }
        
        if (me.debug) console.log('PO.controller.gantt_editor.GanttResizeController.onWindowResize: Finished');
    },

    /**
     * Manually changed the size of the outerContainer.
     * We wouldn't have to initiate a redraw() here,
     * but moving the outer resize border somehow
     * cuts off part of the surface plane. So we do
     * require a redraw here to work around this behavior.
     */
    onGanttPanelContainerResize: function () {
        var me = this;
        if (me.debug) console.log('PO.controller.gantt_editor.GanttResizeController.onGanttPanelContainerResize: Starting');

        if (me.redrawPanel)
            me.redrawPanel.needsRedraw = true;					// Require a redraw before passing control back to the browser

        if (me.debug) console.log('PO.controller.gantt_editor.GanttResizeController.onGanttPanelContainerResize: Finished');
    },

    /**
      * Somebody pressed the "Fullscreen" button...
      */
    onSwitchToFullScreen: function () {
        var me = this;
        me.fullScreenP = true; 
        if (me.debug) console.log('PO.controller.gantt_editor.GanttResizeController.onSwitchToFullScreen: Starting');

        me.outerContainer.setSize(Ext.getBody().getViewSize().width, Ext.getBody().getViewSize().height);

        me.renderDiv.setWidth('100%');
        me.renderDiv.setHeight('100%');
        me.renderDiv.applyStyles({ 
            'position':'absolute',
            'z-index': '2000',
            'left': '0',
            'top': '0'
        });
          
        // Disable the "resizable" properties of the outer panel
        me.outerContainer.resizer.resizeTracker.disable();

        // Disable scrolling in the browser and set vertical scroll to zero
        document.documentElement.style.overflow = 'hidden';			// firefox, chrome
        document.body.scroll = "no";	      					// ie only

        // Scroll to the top of the page
        document.body.scrollLeft = 0;
        document.body.scrollTop = 0;

	// Check if the surface is smaller than the ganttPanel
	// and resize and redraw the surface if necessary
	me.ganttZoomController.onSwitchToFullScreen();

        if (me.debug) console.log('PO.controller.gantt_editor.GanttResizeController.onSwitchToFullScreen: Finished');
    },

    /**
      * Somebody pressed the "Resize" button to return from fullscreen mode.
      */
    onSwitchBackFromFullScreen: function () {
        var me = this;
        me.fullScreenP = false; 
        if (me.debug) console.log('PO.controller.gantt_editor.GanttResizeController.onSwitchBackFromFullScreen: Starting');

        me.renderDiv.setWidth('auto');
        me.renderDiv.setHeight('auto');
        me.renderDiv.applyStyles({
            'position':'relative',
            'z-index': '0',
        });

        // Re-enable the "resizable" properties of the outer panel
        me.outerContainer.resizer.resizeTracker.enable();

        // Disable scrolling in the browser
        document.documentElement.style.overflow = 'auto';			// firefox, chrome
        document.body.scroll = "yes";	      					// ie only

        me.onWindowResize();   							// scale DIV back to suitable size

        if (me.debug) console.log('PO.controller.gantt_editor.GanttResizeController.onSwitchBackFromFullScreen: Finished');
    }
});


// Popup window before leaving the page.
// Show popup only if there are unsaved changes.
window.onbeforeunload = function() {
    console.log('onBeforeUnload: Starting');

    var dirty = false;
    var taskTreeStore = Ext.StoreManager.get('taskTreeStore');
    taskTreeStore.tree.root.eachChild(function(model) { 
	if (model.dirty) dirty = true;
    });

    console.log('onBeforeUnload: Finished');
    if (dirty) {
	return "Are you sure you want to navigate away?";
    } else {
	return;
    }
}
