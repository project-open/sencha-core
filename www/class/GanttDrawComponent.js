/**
 * sencha-core/www/class/GanttDrawComponent.js
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
Ext.define('PO.class.GanttDrawComponent', {

    extend: 'Ext.draw.Component',

    requires: [
        'Ext.draw.Component',
        'Ext.draw.Surface',
        'Ext.layout.component.Draw'
    ],

    ganttTreePanel: null,			// Needs to be set during init

    // Size of the Gantt diagram
    ganttWidth: 500,
    ganttHeight: 300,

    // Start of the date axis
    axisStartTime: 0,
    axisStartX: 0,

    // End of the date axis
    axisEndTime: 0,
    axisEndX: 290,

    axisHeight: 15,

    monthNames: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],

    dndBase: null,
    dndStartRawCoordinates: null,                          // Raw mouse coordinates when starting to drag
    dndTranslate: null,

    barStartHash: {},                                           // Hash array from object_ids -> Start/end point
    barEndHash: {},                                           // Hash array from object_ids -> Start/end point
    taskModelHash: {},

    initComponent: function() {
        var me = this;
        this.callParent(arguments);

        me.axisStartTime = new Date('2014-01-01').getTime() - 10000000;
        me.axisEndTime = new Date('2015-01-01').getTime();
        
        me.axisStartX = 10;
        me.axisEndX = 490;
        me.ganttWidth = 500;
        me.ganttHeight = 300;

	// Height of each(!) axis, there should be two.
	me.axisHeight = 15;
	
	me.dndBase = null;                // Drag-and-drop starting point
	me.dndTranslate = [0,0];           // Default translate of the surface
	me.dndStartRawCoordinates = null;

	me.barStartHash = {};                                     // Hash array from object_ids -> Start/end point
	me.barEndHash = {};                                     // Hash array from object_ids -> Start/end point
	me.taskModelHash = {};

        me.ganttTreePanel.on({
            'itemexpand': me.redraw,
            'itemcollapse': me.redraw,
            'itemmove': me.redraw,
            'itemremove': me.redraw,
            'iteminsert': me.redraw,
            'itemappend': me.redraw,
            'resize': me.redraw,
            'columnschanged': me.redraw,
            'scope': this
        });;

        me.on({
            'mousedown': me.onMouseDown,
            'mouseup': me.onMouseUp,
            'mouseleave': me.onMouseUp,
            'mousemove': me.onMouseMove,
	    'scope': this
	});


        // Iterate through all children of the root node and check if they are visible
	var ganttTreeStore = me.ganttTreePanel.store;
        var rootNode = ganttTreeStore.getRootNode();
        rootNode.cascadeBy(function(model) {
	    var id = model.get('id');
	    me.taskModelHash[id] = model;
        });

    },

    /**
     * The user starts a drag operation.
     * We subtract a previous dndTranslate coordinate from this point
     * in order to account for a previously translated axis
     */
    onMouseDown: function(e) {
	var me = this;
	var point = e.getXY();
	console.log('PO.class.GanttDrawComponent.onMouseDown: '+point);

	// Store the original raw values for MouseUp check
	me.dndStartRawCoordinates = point.slice(0);             // slice(0) creates a clone of the array

	// Subtract the previous position of the time axis
	point[0] = point[0] - me.dndTranslate[0];
	point[1] = point[1] - me.dndTranslate[1];

	me.dndBase = point;
	me.dndTranslate = null;
    },

    onMouseUp: function(e) {
	var me = this;
	if (me.dndBase == null) { return; }
	var point = e.getXY();
	console.log('PO.class.GanttDrawComponent.onMouseUp: '+point);

	if (me.dndStartRawCoordinates != null) {
	    console.log('oldX='+me.dndStartRawCoordinates[0]+', newX='+point[0]);
	    if (me.dndStartRawCoordinates[0] == point[0] && me.dndStartRawCoordinates[1] == point[1]) {
		// Single click - reset translate
		me.translate(0);
		me.dndBase = null;
		me.dndTranslate = [0,0];
		return;
	    }
	}

	// Remember by how much we have been translated
	if (me.dndBase != null) {
	    me.dndTranslate = [point[0]-me.dndBase[0], point[1]-me.dndBase[1]];
	}
	me.dndBase = null;                          // Stop dragging
    },

    onMouseMove: function(e) {
	var me = this;

	if (me.dndBase != null) {                  // Only if we are dragging
	    var point = e.getXY();
	    console.log('PO.class.GanttDrawComponent.onMouseMove: '+point);
	    
	    me.translate(point[0] - me.dndBase[0]);
	}
    },


    /**
     * "Translte" (=move) all sprites in the surface
     */
    translate: function(x) {
	var me = this;
	var items = me.surface.items.items;
        for (var i = items.length - 1; i > -1; i--) {
	    var sprite = items[i];
	    sprite.setAttributes({
		translate: {
		    x: x,
		    y: 0
		}
	    }, true);
        }
    },


    /**
     * Draw all Gantt bars
     */
    redraw: function(a,b,c,d,e) {
        console.log('PO.class.GanttDrawComponent.redraw: Starting');
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

        // Iterate through all children and draw dependencies
        rootNode.cascadeBy(function(model) {
            var viewNode = ganttTreeView.getNode(model);
	    var dependentTasks = model.get('successors');
	    if (dependentTasks instanceof Array) {
		for (var i = 0, len = dependentTasks.length; i < len; i++) {
		    var depTask = dependentTasks[i];
		    var depNode = me.taskModelHash[depTask];
		    me.drawDependency(model, depNode);
		}
	    }
        });

        console.log('PO.class.GanttDrawComponent.redraw: Finished');
    },

    /**
     * Draws a dependency line from one bar to the next one
     */
    drawDependency: function(predecessor, successor) {
	var me = this;
	var from = predecessor.get('id');
	var to = successor.get('id');

	var startPoint = me.barEndHash[from];
	var endPoint = me.barStartHash[to];

	console.log('Dependency: '+from+' -> '+to+': '+startPoint+' -> '+endPoint);

	if (startPoint && endPoint) {
	    var line = me.surface.add({
		type: 'path',
		stroke: '#444',
		'stroke-width': 1,
		path: 'M '+startPoint[0]+','+startPoint[1]+' L '+ +endPoint[0]+','+endPoint[1]
	    }).show(true);
	}

    },

    /**
     * Draw a horizontal axis from start until end date
     */
    drawAxis: function() {
	var me = this;
	var time = me.axisStartTime;
	var x = me.axisStartX;
	var count = 0;
	var y = 20;

	// Quarterly Axis
	var quarterTime = 90.0 * 24 * 3600 * 1000;
	var axisUnits = (me.axisEndTime - me.axisStartTime) / quarterTime;
	if (axisUnits > 3 && axisUnits < 50) {
	    me.drawAxisQuarter(y);
	    y = y + 20;
	}

	// Monthly Axis
	var monthTime = 30.0 * 24 * 3600 * 1000;
	var axisUnits = (me.axisEndTime - me.axisStartTime) / monthTime;
	if (axisUnits > 3 && axisUnits < 50) {
	    me.drawAxisMonth(y);
	    y = y + 20;
	}

	// Weekly Axis
	var weekTime = 7.0 * 24 * 3600 * 1000;
	var axisUnits = (me.axisEndTime - me.axisStartTime) / weekTime;
	if (axisUnits > 3 && axisUnits < 50) {
	    me.drawAxisWeek(y);
	    y = y + 20;
	}

    },

    /**
     * Draw a horizontal monthly axis
     */
    drawAxisQuarter: function(y) {
	var me = this;
	var count = 0;

	// Advance to first day of the next quarter
	var axisStartQuarter = me.nextQuarter(new Date(me.axisStartTime));
	var x = me.date2x(axisStartQuarter);
	while (x < me.axisEndX && count < 200) {
	    var line = me.surface.add({
		type: 'path',
		stroke: '#444',
		fill: 'none',
		'stroke-width': 1,
		path: 'M '+x+' '+y+' v '+ me.axisHeight
	    });

	    line.setAttributes({'shape-rendering': 'crispEdges'}, true);
	    line.show(true);

	    var quarter = Math.floor(axisStartQuarter.getMonth() / 3) + 1;
	    var text = ('' + axisStartQuarter.getYear()).substring(1,4) + 'Q' + quarter;
	    var textSprite = me.surface.add({
		type: 'text',
		text: text,
		x: x+2,
		y: y + 6,
		font: '12px tahoma'
	    }).show(true);
	    
	    // Advance to the next quarter
	    axisStartQuarter = me.nextQuarter(axisStartQuarter);
	    x = me.date2x(axisStartQuarter);
	    count++;
	}
    },

    /**
     * Draw a horizontal monthly axis
     */
    drawAxisMonth: function(y) {
	var me = this;
	var count = 0;

	// Advance to first day of the next month
	var axisStartMonth = me.nextMonth(new Date(me.axisStartTime));
	var x = me.date2x(axisStartMonth);
	while (x < me.axisEndX && count < 200) {
	    var line = me.surface.add({
		type: 'path',
		stroke: '#444',
		'stroke-width': 1,
		path: 'M '+x+' '+y+' v '+ me.axisHeight,
	    }).show(true);
	    
	    var month = axisStartMonth.getMonth();
	    var text = me.monthNames[month];
	    var textSprite = me.surface.add({
		type: 'text',
		text: text,
		x: x+2,
		y: y + 6,
		font: '12px tahoma'
	    }).show(true);
	    

	    // Advance to the next month
	    axisStartMonth = me.nextMonth(axisStartMonth);
	    x = me.date2x(axisStartMonth);
	    count++;
	}
    },

    /**
     * Draw a horizontal axis from start until end date
     */
    drawAxisWeek: function(y) {
	var me = this;
	var x = me.axisStartX;
	var count = 0;
	while (x < me.axisEndX && count < 200) {
	    var line = me.surface.add({
		type: 'path',
		stroke: '#444',
		'stroke-width': 1,
		path: 'M '+x+' '+y+' v '+ me.axisHeight,
	    }).show(true);
	    
	    time = time + weekTime;
	    x = me.date2x(time);
	    count++;
	}
    },


    /**
     * Draw a single bar for a project or task
     */
    drawBar: function(project, viewNode) {
        var me = this;
        if (me.debug) { console.log('PO.class.GanttDrawComponent.drawBar: Starting'); }
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

        var spriteBar = surface.add({
            type: 'rect',
            x: x,
            y: y,
            width: w,
            height: 15,
            radius: 3,
	    fill: 'blue',
            stroke: 'blue',
            'stroke-width': 1
        }).show(true);
        spriteGroup.add(spriteBar);

	// Store the start and end points of the bar
        var id = project.get('id');
	me.barStartHash[id] = [x,y];
	me.barEndHash[id] = [x+w, y+15];

        if (me.debug) { console.log('PO.class.GanttDrawComponent.drawBar: Finished'); }
    },

    /**
     * Convert a date object into the corresponding X coordinate.
     * Returns NULL if the date is out of the range.
     */
    date2x: function(date) {
	var me = this;

	var t = typeof date;
	var dateMilliJulian = 0;

	if ("number" == t) {
	    dateMilliJulian = date;
	} else if ("object" == t) {
	    if (date instanceof Date) {
		dateMilliJulian = date.getTime();
	    } else {
		console.error('GanttDrawComponent.date2x: Unknown object type for date argument:'+t);
	    }
	} else {
	    console.error('GanttDrawComponent.date2x: Unknown type for date argument:'+t);
	}

	var axisWidth = me.axisEndX - me.axisStartX;
	var x = me.axisStartX + Math.floor(1.0 * axisWidth * (1.0 * dateMilliJulian - me.axisStartTime) / (1.0 * me.axisEndTime - me.axisStartTime));
	if (x < 0) { x = 0; }

	return x;
    },

    /**
     * Advance a date to the 1st of the next month
     */
    nextMonth: function(date) {
	var result;
	if (date.getMonth() == 11) {
            result = new Date(date.getFullYear() + 1, 0, 1);
	} else {
            result = new Date(date.getFullYear(), date.getMonth() + 1, 1);
	}
	return result;
    },

    /**
     * Advance a date to the 1st of the next quarter
     */
    nextQuarter: function(date) {
	var result;
	if (date.getMonth() > 9) {
            result = new Date(date.getFullYear() + 1, 0, 1);
	} else {
            result = new Date(date.getFullYear(), date.getMonth() + 3, 1);
	}
	return result;
    }



});

