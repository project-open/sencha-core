/**
 * sencha-core/www/class/GanttTimeline.js
 * A Ext.draw.Component (SVG surface) that knows how to draw
 * Gantt diagrams.
 *
 * Copyright (C) 2014, ]project-open[
 * @author Frank Bergmann (frank.bergmann@project-open.com)
 * @creation-date 2013-11-29
 * @cvs-id $Id$
 */

/**
 * Like a chart Series, displays a list of projects
 * using Gantt bars.
 */
Ext.define('PO.view.gantt.GanttTimeline', {

    extend: 'PO.view.gantt.GanttDrawComponent',

    requires: [
        'PO.view.gantt.GanttDrawComponent'
    ],

    axisFactor: 3.0,                                              // time range of the Timeline relative to GanttDrawComponent

    initComponent: function() {
        var me = this;
        this.callParent(arguments);

	me.barHeight = 2;                                         // This preview is really thin

	// Extend the data axis for the Timeline relative to the base GanttDrawComponent
	var baseAxisEndTime = me.axisEndTime;
	var baseAxisStartTime = me.axisStartTime;
	var baseAxisTimeDiff = (baseAxisEndTime - baseAxisStartTime) * (me.axisFactor / 3.0);
	me.axisStartTime = baseAxisStartTime - baseAxisTimeDiff;
	me.axisEndTime = baseAxisEndTime + baseAxisTimeDiff;
	
    },


    /**
     * pressed the (+) (zoom in) button
     */
    onZoomIn: function() {
	console.log('GanttTimeline.onZoomIn');
    },


    /**
     * pressed the (-) (zoom out) button
     */
    onZoomOut: function() {
	console.log('GanttTimeline.onZoomOut');
    },


    /**
     * Draw all Gantt bars
     */
    redraw: function(a,b,c,d,e) {
        console.log('PO.class.GanttTimeline.redraw: Starting');
        var me = this;
        var ganttTreeStore = me.ganttTreePanel.store;
        var ganttTreeView = me.ganttTreePanel.getView();
        var rootNode = ganttTreeStore.getRootNode();

        me.surface.removeAll();

        // Draw the top axis
        me.drawAxis();

        // Iterate through all children of the root node and check if they are visible
        rootNode.cascadeBy(function(model) {
            var viewNode = ganttTreeView.getNode(model);

            // hidden nodes/models don't have a viewNode, so we don't need to draw a bar.
            if (viewNode == null) { return; }
            if (!model.isVisible()) { return; }
            me.drawBar(model, viewNode);
        });

        console.log('PO.class.GanttTimeline.redraw: Finished');
    },


    /**
     * Draw a horizontal axis from start until end date
     */
    drawAxis: function() {
        var me = this;
        var time = me.axisStartTime;
        var x = me.axisStartX;
        var count = 0;
        var y = 0;

        me.drawAxisYear(y);

    },

    /**
     * Draw a single bar for a project or task
     */
    drawBar: function(project, viewNode) {
        var me = this;
        if (me.debug) { console.log('PO.class.GanttTimeline.drawBar: Starting'); }
        var ganttTreeStore = me.ganttTreePanel.store;
        var ganttTreeView = me.ganttTreePanel.getView();
        var surface = me.surface;

        var panelY = me.ganttTreePanel.getY();

        var project_name = project.get('project_name');
        var start_date = project.get('start_date').substring(0,10);
        var end_date = project.get('end_date').substring(0,10);
        var startTime = new Date(start_date).getTime();
        var endTime = new Date(end_date).getTime();

        // Used for grouping all sprites into one group
        var spriteGroup = Ext.create('Ext.draw.CompositeSprite', {
            surface: surface,
            autoDestroy: true
        });

        var projectY = ganttTreeView.getNode(project).getBoundingClientRect().top;
        var x = me.date2x(startTime);
        var y = projectY - panelY;
        var w = Math.floor( me.ganttWidth * (endTime - startTime) / (me.axisEndTime - me.axisStartTime));
        var h = me.barHeight; 							// Height of the bars
        var d = Math.floor(h / 2.0) + 1;    				// Size of the indent of the super-project bar

	y = y / 6.0;  // smaller bars in preview

        var spriteBar = surface.add({
            type: 'rect',
            x: x,
            y: y,
            width: w,
            height: h,
            radius: 3,
            fill: 'url(#gradientId)',
            stroke: 'blue',
            'stroke-width': 0.3
        }).show(true);
        spriteBar.model = project;                                      // Store the task information for the sprite
        spriteGroup.add(spriteBar);

        // Store the start and end points of the bar
        var id = project.get('id');
        me.barStartHash[id] = [x,y];                                  // Move the start of the bar 5px to the right
        me.barEndHash[id] = [x+w, y+h];                             // End of the bar is in the middle of the bar

        if (me.debug) { console.log('PO.class.GanttTimeline.drawBar: Finished'); }
    }


});

