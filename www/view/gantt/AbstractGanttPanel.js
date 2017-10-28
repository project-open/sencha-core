/*
 * AbstractGanttPanel.js
 *
 * Copyright (c) 2011 - 2015 ]project-open[ Business Solutions, S.L.
 * This file may be used under the terms of the GNU General Public
 * License version 3.0 or alternatively unter the terms of the ]po[
 * FL or CL license as specified in www.project-open.com/en/license.
 */

/**
 * Base class for various types of graphical editors using
 * Gantt bars including: GanttEditor, Project part of the
 * Portfolio Planner and the Department part of the
 * Portfolio Planner.
 */
Ext.define('PO.view.gantt.AbstractGanttPanel', {

    extend: 'Ext.draw.Component',

    requires: [
        'Ext.draw.Component',
        'Ext.draw.Surface',
        'Ext.layout.component.Draw'
    ],

    // surface: null,					// Inherited from draw.Component
    debug: false,
    debugAxis: false,

    objectPanel: null,					// Set during init: Reference to grid or tree panel at the left
    objectStore: null,					// Set during init: Reference to object store (tree or flat)
    preferenceStore: null,				// Set during init: Reference to store with user preferences

    // Axis information - can be overwritten during init
    axisStartDate: null,				// Set during init
    axisEndDate: null,					// Set during init
    axisStartX: 0,					// Start of the X-axis. Should be 0 always.
    axisEndX: 0,					// Set during init
    axisHeight: 11,					// Height of each of the two axis levels
    axisScale: 'month',					// Default scale for the time axis

    // fraber 160412: We should get rid of granularity, or at least separate it from the data axis
    granularity: 'none',				// Set during init: 'week' or 'day'

    // Drag-and-drop state variables
    dndEnabled: true,					// Enable drag-and-drop at all?
    dndBasePoint: null,					// Drag-and-drop starting point
    dndBaseSprite: null,				// DnD sprite being draged
    dndShadowSprite: null,				// DnD shadow generated for BaseSprite
    dndLinkSprite: null,				// DnD "chain" icon
    dndConfig: null,
    ganttBarHeight: 12,

    monthThreeChar: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    weekThreeChar: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    weekOneChar: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],

    /**
     * Starts the main editor panel as the right-hand side
     * of a project grid, cost center grid or project tree.
     */
    initComponent: function() {
        var me = this;
        if (me.debug) console.log('PO.view.gantt.AbstractGanttPanel.initComponent: Starting');
        this.callParent(arguments);

        me.dndBasePoint = null;				// Drag-and-drop starting point
        me.dndBaseSprite = null;			// DnD sprite being draged
        me.dndShadowSprite = null;			// DnD shadow generated for BaseSprite
        me.dndLinkSprite = null;			// DnD "chain"
        me.dndConfig = null;

        // New Event: Drag-and-Drop for a Gantt bar
        this.addEvents('spriterightclick');

        // Drag & Drop on the "surface"
        me.on({
            'mousedown': me.onMouseDown,
            'mouseup': me.onMouseUp,
            'mouseleave': me.onMouseUp,
            'mousemove': me.onMouseMove,
            'scope': this
        });
        if (me.debug) console.log('PO.view.gantt.AbstractGanttPanel.initComponent: Finished');
    },

    /**
     * Get the mouse coordinates relative to the surface
     * because sprites.getBBox() also returns relative coo.
     */
    getMousePoint: function(mouseEvent) {
        var me = this;
        var scroll = me.getEl().getScroll();				// We need to adjust the mouse point by the scroll

        var surfaceBaseCoo = this.getXY();
        var mouseScreenCoo = mouseEvent.getXY();
        var mousePoint = [mouseScreenCoo[0] - surfaceBaseCoo[0] + scroll.left, mouseScreenCoo[1] - surfaceBaseCoo[1] + scroll.top]
        return mousePoint;
    },

    /**
     * Drag-and-drop:
     * The user starts a drag operation.
     */
    onMouseDown: function(e) {
        var me = this;
        if (!me.dndEnabled) { return; }
        var point = me.getMousePoint(e);				// Get corrected screen coordinates
        if (me.debug) console.log('PO.view.gantt.AbstractGanttPanel.onMouseDown: button='+e.button+", point="+point);
        var mouseSprite = me.getSpriteForPoint(point);  		// Trust on zIndex to get the right sprite

        if (e.button == 2) {                            		// Right-click on sprite?
            if (!!mouseSprite) {                        		// Found a "real" sprite for the mouse coo
                me.fireEvent('spriterightclick', e, mouseSprite);
                return true;
            }
            var mouseSprites = me.getSpritesForPoint(point, true);	// Get _all_sprites for the point
            if (mouseSprites.length > 0) {
                me.fireEvent('spriterightclick', e, mouseSprites[0]);
                return true;
            }
            return true;							// Don't continue with Drag-and-Drop stuff
        }

        // Now using offsetX/offsetY instead of getXY()
        if (!mouseSprite) return;
        var dndConfig = mouseSprite.dndConfig;				// DnD info stored together with mouseSprite
        var baseSprite = dndConfig.baseSprite;				// baseSprite is the sprite to be DnD'ed

        var bBox = baseSprite.getBBox();
        var radius = baseSprite.radius || 0;
        var spriteShadow = me.surface.add({				// Create a "shadow" copy of the baseSprite with red borders
            x: bBox.x, y: bBox.y, width: bBox.width, height: bBox.height, radius: radius,
            type: 'rect',
            stroke: 'red',
            'stroke-width': 1
        }).show(true);

        var spriteLink = me.surface.add({                               // Create a "chain" icon 
            type: 'image',
            x: bBox.x,
            y: bBox.y,
            width: 16,
            height: 16,
            src: '/intranet/images/navbar_default/link.png'
        }).show(false);

        me.dndConfig = dndConfig;					// Store DnD configuration in the GanttEditor
        me.dndBasePoint = point;
        me.dndBaseSprite = baseSprite;
        me.dndShadowSprite = spriteShadow;
        me.dndLinkSprite = spriteLink;
    },

    /**
     * Drag-and-drop:
     * Move the shadow of the selected sprite according to mouse
     */
    onMouseMove: function(e) {
        var me = this;
        var point = me.getMousePoint(e);

        if (!me.dndEnabled) { return; }
        if (!me.dndBasePoint) { return; }				// Only if we are dragging
        if (!me.dndConfig) { return; }				// Only if we are dragging

        var xDiff = point[0] - me.dndBasePoint[0];
        var yDiff = point[1] - me.dndBasePoint[1];
        var diff = [xDiff,yDiff];

        var dndConfig = me.dndConfig;
        dndConfig.dragAction(me, e, diff, dndConfig);
    },

    /**
     * Drag-and-drop:
     * End the DnD and call the function to update the underlying object
     */
    onMouseUp: function(e) {
        var me = this;
        if (!me.dndEnabled) { return; }
        if (!me.dndBasePoint) { return; }				// Only if we are dragging
        if (!me.dndConfig) { return; }				// Only if we are dragging

        var point = me.getMousePoint(e);
        var xDiff = point[0] - me.dndBasePoint[0];
        var yDiff = point[1] - me.dndBasePoint[1];
        var diff = [xDiff,yDiff];

        var dndConfig = me.dndConfig;
        dndConfig.dropAction(me, e, diff, dndConfig);

        // Stop DnD'ing
        me.dndBasePoint = null;					// Stop dragging
        me.dndBaseSprite = null;
        me.dndShadowSprite.destroy();
        me.dndShadowSprite = null;
    },

    /**
     * Returns a list of sprites for a x/y mouse coordinate
     */
    getSpritesForPoint: function(point, allSprites) {
        var me = this,
            x = point[0],
            y = point[1];
        var result = [];
        var items = me.surface.items.items;

        for (var i = 0, ln = items.length; i < ln; i++) {
            var sprite = items[i];
            if (!sprite) continue;
            if (!allSprites) {					// Check, unless allSprites is "true"
                if (!sprite.dndConfig) continue;		// Only check for sprites with a (project) model
            }

            var bbox = sprite.getBBox();
            if (bbox.x > x) continue;
            if (bbox.y > y) continue;
            if (bbox.x + bbox.width < x) continue;
            if (bbox.y + bbox.height < y) continue;

            result.push(sprite);
        }

        return result;
    },

    /**
     * Return the topmost sprite of the list returned
     * by getSpritesForPoint().
     */
    getSpriteForPoint: function(point) {
        var me = this;
        var sprites = me.getSpritesForPoint(point);
        var result = null;
        var maxZIndex = -1000;

        sprites.forEach(function(v) {
            if (v.attr.zIndex > maxZIndex) {
                maxZIndex = v.attr.zIndex;
                result = v;
            }
        });

        return result;
    },

    /**
     * Calculate the number of nodes in an arbitrary tree model
     */
    nodesInTree: function(node) {
        var me = this;
        var count = 1;
        // if (me.debug) console.log('PO.view.gantt.GanttBarPanel.nodesInTree: Starting');

        if (node.isExpanded() || node.isRoot()) {
            var children = node.childNodes;
            children.forEach(function(child) {
                count = count + me.nodesInTree(child);
            });
        }

        // if (me.debug) console.log('PO.view.gantt.GanttBarPanel.nodesInTree: Finished');
        return count;
    },



    /**
     * Draw all Gantt bars
     */
    redraw: function() {
        if (me.debug) console.log('PO.view.gantt.AbstractGanttPanel.redraw: Needs to be overwritten');
        var me = this;
        me.surface.removeAll();
        me.drawAxisAuto();							// Draw the top axis
    },

    /**
     * Calculate the Y-position of a Gantt bar,
     * based on the Y position of the project or CC
     * in the grid at the left.
     */
    calcGanttBarYPosition: function(model) {
        var me = this;
        var objectPanelView = me.objectPanel.getView();						// The "view" for the GridPanel with HTML elements
        var projectNode = objectPanelView.getNode(0);
        if (!projectNode) { return 0; }
        var projectNodeHeight = objectPanelView.getNode(0).getBoundingClientRect().height;	// Height of a project node
        var projectYFirstProject = objectPanelView.getNode(0).getBoundingClientRect().top;	// Y position of the very first project
        var centerOffset = (projectNodeHeight - me.ganttBarHeight) / 2.0;			// Small offset in order to center Gantt
        var projectY = objectPanelView.getNode(model).getBoundingClientRect().top;		// Y position of current project
        var y = projectY - projectYFirstProject + 2 * me.axisHeight + centerOffset;
        return y;
    },


    /**
     * Draws a graph on a Gantt bar that consists of:
     * - ganttSprite is the actual sprite for the bar and defines the base coordinates
     * - graphArray is an array for the individual values
     * - maxGraphArray is the max value of the graphArray ("100%")
     * - startDate corresponds to ganttSprite.x
     * The graph will range between 0 (bottom of the Gantt bar) and
     * maxGraphArray (top of the Gantt bar).
     */
    graphOnGanttBar: function(ganttSprite, model, graphArray, maxGraphArray, spriteBarStartDate, colorConf, tooltipTemplate) {
        var me = this;
        var surface = me.surface;
        if (me.debug) console.log('PO.view.gantt.AbstractGanttPanel.graphOnGanttBar');

        // Add a -1 at the end of the graphArray, "-1" indicates the end of the array
        if (graphArray[graphArray.length-1] != -1) {
            graphArray.push(-1);
        }

        // Granularity
        var oneDayMilliseconds = 1000.0 * 3600 * 24 * 1.0;
        var intervalTimeMilliseconds;

        switch(me.granularity) {
        case 'month': intervalTimeMilliseconds = oneDayMilliseconds * 30.0; break;	// One month
        case 'week': intervalTimeMilliseconds = oneDayMilliseconds * 7.0; break;	// One week
        case 'day':  intervalTimeMilliseconds = oneDayMilliseconds * 1.0; break;	// One day
        default:     alert('Undefined granularity: '+me.granularity);
        }

        // Calculate the biggest element of the graphArray
        var i;
        var len = graphArray.length;
        if (null === maxGraphArray || 0.0 == maxGraphArray) {
            maxGraphArray = 0.00001;
            for (i = 0; i < len; i++) {
                if (graphArray[i] > maxGraphArray) { maxGraphArray = graphArray[i]; };
            }
        }

        var spriteBarStartX = ganttSprite.x;
        var spriteBarEndX = ganttSprite.x + ganttSprite.width;
        var spriteBarBaseY = ganttSprite.y + ganttSprite.height;
        var spriteBarHeight = ganttSprite.height - 1;

        var intervalStartDate = spriteBarStartDate;
        var segmentStartDate = spriteBarStartDate;
        var intervalStartX =  me.date2x(intervalStartDate);
        var lastIntervalStartDate = spriteBarStartDate;
        var lastIntervalEndDate = new Date(spriteBarStartDate.getTime() + intervalTimeMilliseconds);

        var intervalY = Math.floor(spriteBarBaseY - (graphArray[0] / maxGraphArray) * spriteBarHeight) + 0.5;
        var lastIntervalY = intervalY;
        var intervalEndDate, intervalEndX;

        var path = "M" + intervalStartX + " " + intervalY;		// Start point for path

        var value = graphArray[0];
        var lastValue = graphArray[0];
        for (i = 0; i < len; i++) {
            value = graphArray[i];
            intervalY = Math.floor(spriteBarBaseY - (value / maxGraphArray) * spriteBarHeight) + 0.5;

            intervalEndDate = new Date(intervalStartDate.getTime() + intervalTimeMilliseconds);
            intervalEndX = me.date2x(intervalEndDate);
            if (intervalEndX > spriteBarEndX) { intervalEndX = spriteBarEndX; }		// Fix the last interval to stop at the bar

            if (lastIntervalY != intervalY) {
                // A new segment starts with a new Y coordinate
                // Finish off the previous segment.
                path = path + " L" + intervalStartX + " " + lastIntervalY;

                if (intervalStartX < spriteBarEndX) {
                    path = path + " L" + intervalStartX + " " + intervalY;
                }
                var spritePath = surface.add({
                    type: 'path',
                    stroke: colorConf,
                    'stroke-width': 2,
                    path: path
                }).show(true);

                // Format a ToolTip based on the provided template,
                // the values of the current segment
                // and the model of the object shown.
                if (undefined !== tooltipTemplate) {
                    var data = {};
                    for (var v in model.data) { data[v] = model.data[v]; }
                    data['value'] = lastValue;
                    data['maxValue'] = maxGraphArray;
                    data['startDate'] = PO.Utilities.dateToPg(segmentStartDate).substring(0,10);
                    data['endDate'] = PO.Utilities.dateToPg(new Date(lastIntervalEndDate.getTime() - oneDayMilliseconds)).substring(0,10);
                    var tip = Ext.create("Ext.tip.ToolTip", {
                        target: spritePath.el,
                        width: 250,
                        html: tooltipTemplate.apply(data) 		// Replace {0} in the template with value
                    });
                }

                path = "M" + intervalStartX + " " + intervalY;      	// Start point for path

                // A new segment will start here.
                segmentStartDate = intervalStartDate;

            } else {
                // Nothing - still on the same Y coordinates
            }

            // Remember the values of the last iteration
            lastValue = value;
            lastIntervalY = intervalY;
            lastIntervalStartDate = intervalStartDate;
            lastIntervalEndDate = intervalEndDate;

            // The former end of the interval becomes the start for the next interval
            intervalStartDate = intervalEndDate;
            intervalStartX = intervalEndX;

        }
    },

    /**
     * Draw a date axis on the top of the diagram with auto
     */
    drawAxis: function() {
        var me = this;
        if (me.debugAxis) console.log('PO.view.gantt.AbstractGanttPanel.drawAxis: Starting: granularity='+me.granularity);
        var h = 0;

        var startDate = new Date(me.axisStartDate.getTime()).setHours(0,0,0,0);
        var endDate = new Date(me.axisEndDate.getTime()).setHours(0,0,0,0);

        switch (me.granularity) {
        case "day":
            me.drawAxisMonth(h); h = h + me.axisHeight;
            me.drawAxisDay(h); h = h + me.axisHeight;
            break;
        case "week":
            me.drawAxisMonth(h); h = h + me.axisHeight;
            me.drawAxisWeek(h); h = h + me.axisHeight;
            break;
        case "month":
            me.drawAxisYear(h); h = h + me.axisHeight;
            me.drawAxisMonth(h); h = h + me.axisHeight;
            break;
        default:
            me.drawAxisAuto();
        }
    },

    /**
     * Draw a date axis on the top of the diagram
     * with auto-scaling
     */
    drawAxisAuto: function() {
        var me = this;
        if (me.debugAxis) console.log('PO.view.gantt.AbstractGanttPanel.drawAxisAuto: Starting');
        var h = 0;

        var startDate = new Date(me.axisStartDate.getTime()).setHours(0,0,0,0);
        var endDate = new Date(me.axisEndDate.getTime()).setHours(0,0,0,0);
        var timespanDays = (me.axisEndDate.getTime() - me.axisStartDate.getTime()) / (1000 * 3600 * 24);
        var xPerDay = me.axisEndX / timespanDays;
        var xPerYear = 365 * xPerDay;
        var xPerQuarter = xPerYear / 3;
        var xPerMonth = xPerDay * 30;
        var xPerWeek = xPerDay * 7;

	var min = 18;
	var drawn = false;
	if (!drawn && xPerDay > min) {
            me.drawAxisWeek(h); h = h + me.axisHeight;
            me.drawAxisDay(h); h = h + me.axisHeight;
	    drawn = true;
	}
	
	if (!drawn && xPerWeek > min) {
            me.drawAxisMonth(h); h = h + me.axisHeight;
            me.drawAxisWeek(h); h = h + me.axisHeight;
	    drawn = true;
	}

	if (!drawn && xPerMonth > min) {
            me.drawAxisQuarter(h); h = h + me.axisHeight;
            me.drawAxisMonth(h); h = h + me.axisHeight;
	    drawn = true;
	}

	if (!drawn) {
            me.drawAxisYear(h); h = h + me.axisHeight;
            me.drawAxisQuarter(h); h = h + me.axisHeight;
	    drawn = true;
	}

	// Show with a red line where we are today
        me.drawAxisNow();


        if (me.debugAxis) console.log('PO.view.gantt.AbstractGanttPanel.drawAxisAuto: Finished');
    },

    /**
     * Draw a date axis on the top of the diagram
     */
    drawAxisYear: function(h) {
        var me = this;
        if (me.debugAxis) console.log('PO.view.gantt.AbstractGanttPanel.drawAxisYear: Starting');

        // Draw Yearly blocks
        var startYear = me.axisStartDate.getFullYear();
        var endYear = me.axisEndDate.getFullYear();
        for (var year = startYear; year <= endYear; year++) {
            var x = me.date2x(new Date(year+"-01-01"));
            var xEnd = me.date2x(new Date((year+1)+"-01-01"));
            var w = xEnd - x;

            var axisBar = me.surface.add({
                type: 'rect',
                x: x,
                y: h,
                width: w,
                height: me.axisHeight,
                fill: '#e1e2e1',						// '#ace'
                stroke: 'grey'
            }).show(true);

           var axisText = me.surface.add({
                type: 'text',
                text: ""+year,
                x: x + 2,
                y: h + (me.axisHeight / 2),
                fill: '#000',
                font: "10px Arial"
            }).show(true);
        }
        if (me.debugAxis) console.log('PO.view.gantt.AbstractGanttPanel.drawAxisYear: Finished');
    },



    /**
     * Draw a date axis on the top of the diagram
     */
    drawAxisQuarter: function(h) {
        var me = this;
        if (me.debugAxis) console.log('PO.view.gantt.AbstractGanttPanel.drawAxisQuarter: Starting');

        // Draw quarterly blocks
        var startYear = me.axisStartDate.getFullYear();
        var endYear = me.axisEndDate.getFullYear();
        var startQuarter = Math.floor(me.axisStartDate.getMonth() / 3);
        var endQuarter = Math.floor(me.axisEndDate.getMonth() / 3);
        var yea = startYear;
        var qua = startQuarter;

        while (yea * 100 + qua <= endYear * 100 + endQuarter) {
            var xEndQua = qua+1;
            var xEndYea = yea;
            if (xEndQua > 3) { xEndQua = 0; xEndYea = xEndYea + 1; }
            var x = me.date2x(new Date(yea+"-"+  ("0"+(3*qua+1)).slice(-2)  +"-01"));
            var xEnd = me.date2x(new Date(xEndYea+"-"+  ("0"+(3*xEndQua+1)).slice(-2)  +"-01"));
            var w = xEnd - x;

            // Calculate name of quarter, including year if possible
            var text = "Q"+(qua+1);
            if (w > 30) { text = text + " " + (""+yea).substring(0,4); }

            var axisBar = me.surface.add(
                {type: 'rect', x: x, y: h, width: w, height: me.axisHeight, fill: '#e1e2e1', stroke: 'grey'}).show(true);
            var axisText = me.surface.add(
                {type: 'text', text: text, x:x+2, y:h+(me.axisHeight/2), fill: '#000', font: "9px Arial"}).show(true);

            qua = qua + 1;
            if (qua > 3) {
                qua = 0;
                yea = yea + 1;
            }
        }

        if (me.debugAxis) console.log('PO.view.gantt.AbstractGanttPanel.drawAxisQuarter: Finished');
    },




    /**
     * Draw a date axis on the top of the diagram
     */
    drawAxisMonth: function(h) {
        var me = this;
        if (me.debugAxis) console.log('PO.view.gantt.AbstractGanttPanel.drawAxisMonth: Starting');

        // Draw monthly blocks
        var startYear = me.axisStartDate.getFullYear();
        var endYear = me.axisEndDate.getFullYear();
        var startMonth = me.axisStartDate.getMonth();
        var endMonth = me.axisEndDate.getMonth();
        var yea = startYear;
        var mon = startMonth;

        while (yea * 100 + mon <= endYear * 100 + endMonth) {
            var xEndMon = mon+1;
            var xEndYea = yea;
            if (xEndMon > 11) { xEndMon = 0; xEndYea = xEndYea + 1; }
            var x = me.date2x(new Date(yea+"-"+  ("0"+(mon+1)).slice(-2)  +"-01"));
            var xEnd = me.date2x(new Date(xEndYea+"-"+  ("0"+(xEndMon+1)).slice(-2)  +"-01"));
            var w = xEnd - x;

            // Calculate name of month, including year if possible
            var text = me.monthThreeChar[mon];
            if (w > 30) { text = text + " " + (""+yea).substring(2,4); }

            var axisBar = me.surface.add(
                {type: 'rect', x: x, y: h, width: w, height: me.axisHeight, fill: '#e1e2e1', stroke: 'grey'}).show(true);
            var axisText = me.surface.add(
                {type: 'text', text: text, x:x+2, y:h+(me.axisHeight/2), fill: '#000', font: "9px Arial"}).show(true);

            mon = mon + 1;
            if (mon > 11) {
                mon = 0;
                yea = yea + 1;
            }
        }

        if (me.debugAxis) console.log('PO.view.gantt.AbstractGanttPanel.drawAxisMonth: Finished');
    },

    /**
     * Draw a date axis on the top of the diagram
     */
    drawAxisWeek: function(h) {
        var me = this;
        if (me.debugAxis) console.log('PO.view.gantt.AbstractGanttPanel.drawAxisWeek: Starting');

        // Calculate the start of the first week of the year
        var axisStartTime = me.axisStartDate.getTime();
        var firstThu = new Date(axisStartTime);
        firstThu.setMonth(0,1);                                       		// First Thursday of that year
        firstThu.setHours(0,0,0,0);                                   		// Reset hour and minute to 0
        if (firstThu.getDay() != 4) {
            firstThu.setMonth(0, 1 + ((7 + 4 - firstThu.getDay())) % 7);      	// First Thursday of the year.
        }
        var startOfFirstWeek = new Date(firstThu.getTime() - 1000 * 3600 * 24 * 3);   // Monday of this first week
        var year = firstThu.getYear();

        // Search the start of the first week within the data axis
        var week = 0;
        var now = new Date(startOfFirstWeek.getTime());
        while (now.getTime() < axisStartTime) {
            now = new Date(now.getTime() + 1000 * 3600 * 24 * 7);     		// advance by one week
            week = week + 1;
        }

        // "now" points to the start of the first week (Monday 00:00 at night) within the data axis
	now = new Date(now.getTime() - 1000 * 3600 * 24 * 7);                 // Go back one week, so we don't have an half empty first week
        while (now.getTime() < me.axisEndDate.getTime()) {
            var startX = me.date2x(now);
            now = new Date(now.getTime() + 1000 * 3600 * 24 * 7);
            var endX = me.date2x(now);
            var w = endX - startX;

            week = week + 1;
            if (now.getYear() > year) {
                // The end of the week is in the new year.
                // We now need to change if the Thursday of this week is still in the new year
                var thu = new Date(now.getTime() - 1000 * 3600 * 24 * 4);
                if (thu.getYear() > year) {
                    week = 1;
                    year = now.getYear();
                }
            }

            // Show bar + text for the week
            var axisBar = me.surface.add({
                type:'rect', 
                x:startX, y:h, 
                width:w, height:me.axisHeight, 
                fill:'#e1e2e1', 
                stroke:'grey'
            }).show(true);
            var axisText = me.surface.add({
                type: 'text', 
                text:"W"+week, 
                x:startX+2, y:h+(me.axisHeight/2), 
                fill: '#000', 
                font:"9px Arial"
            }).show(true);

            // Show background bar for the weekend
            var surfaceHeight = me.surface.height;
            var weekendBar = me.surface.add({
                type:'rect', 
                x:startX + w * 5.0 / 7.0,
                y: me.axisHeight * 2, 
                width:w * 2.0 / 7.0,
                height: surfaceHeight - me.axisHeight * 2,
                fill:'#e1e2e1', 
                stroke:'#e1e2e1',
                opacity: 0.4,
                zIndex: -200						// really at the bottom of all
            }).show(true);

        }
        if (me.debugAxis) console.log('PO.view.gantt.AbstractGanttPanel.drawAxisWeek: Finished');
    },


    /**
     * Draw a date axis on the top of the diagram
     */
    drawAxisDay: function(h) {
        var me = this;
        if (me.debugAxis) console.log('PO.view.gantt.AbstractGanttPanel.drawAxisDay: Starting');
        var now = new Date(me.axisStartDate.getTime()).setHours(0,0,0,0);    // Reset hour and minute to 0
        while (now.getTime() < me.axisEndDate.getTime()) {
            var startX = me.date2x(now);
            var day = now.getDate(now);
            now = new Date(now.getTime() + 1000 * 3600 * 24);
            var endX = me.date2x(now);
            var w = endX - startX;

            var axisBar = me.surface.add({type:'rect', x:startX, y:h, width:w, height:me.axisHeight, fill:'#e1e2e1', stroke:'grey'}).show(true);
            var axisText = me.surface.add({type: 'text', text:""+day, x:startX+2, y:h+(me.axisHeight/2), fill: '#000', font:"9px Arial"}).show(true);
        }
        if (me.debugAxis) console.log('PO.view.gantt.AbstractGanttPanel.drawAxisDay: Finished');
    },



    /**
     * Draw a red vertical bar to indicate where we are today
     */
    drawAxisNow: function(h) {
        var me = this;
        if (me.debugAxis) console.log('PO.view.gantt.AbstractGanttPanel.drawAxisNow: Starting');

        var surfaceHeight = me.surface.height;
	now = new Date();                                            // Today
        var x = me.date2x(now);

        var nowBar = me.surface.add({
            type:'rect',
            x: x,
            y: me.axisHeight * 2,
            width: 0.5,
            height: surfaceHeight - me.axisHeight * 2,
            stroke:'#FF0000',
	    zIndex: 200
        }).show(true);

        if (me.debugAxis) console.log('PO.view.gantt.AbstractGanttPanel.drawAxisNow: Finished');
    },


    /**
     * Convert a date object into the corresponding X coordinate.
     * Returns NULL if the date is out of the range.
     */
    date2x: function(date) {
        var me = this;

        var dateMilliJulian = 0;
        switch (typeof date) {
        case "number":
            dateMilliJulian = date;
            break;
        case "object":
            if (date instanceof Date) {
                dateMilliJulian = date.getTime();
            } else {
                console.error('GanttDrawComponent.date2x: Unknown object type for date argument:'+typeof date);
            }
            break;
        default:
            console.error('GanttDrawComponent.date2x: Unknown type for date argument:'+t);
        }

        var axisWidth = me.axisEndX - me.axisStartX;
        var axisStartTime = me.axisStartDate.getTime();
        var axisEndTime = me.axisEndDate.getTime();

        var x = me.axisStartX + Math.floor(1.0 * axisWidth *
                (1.0 * dateMilliJulian - axisStartTime) /
                (1.0 * axisEndTime - axisStartTime)
        );

        return x;
    },

    /**
     * Convert a x coordinate on the surface to the corresponding date.
     */
    x2time: function(x) {
        var me = this;

        if ("number" != typeof x) {
            console.error('GanttDrawComponent.x2date: Unknown object type for number argument:'+typeof x);
        }

        var axisWidth = me.axisEndX - me.axisStartX;
        var axisStartTime = me.axisStartDate.getTime();
        var axisEndTime = me.axisEndDate.getTime();

        var time = axisStartTime + (axisEndTime - axisStartTime) * x / axisWidth;
        return Math.round(time);
    },


    /**
     * Advance a date to the 1st of the next month
     */
    currentMonth: function(date) {
        var result;
        result = new Date(date.getFullYear(), date.getMonth(), 1);
        return result;
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
     * Advance a date to the 1st of the prev month
     */
    prevMonth: function(date) {
        var result;
        if (date.getMonth() == 1) {
            result = new Date(date.getFullYear() - 1, 12, 1);
        } else {
            result = new Date(date.getFullYear(), date.getMonth() - 1, 1);
        }
        return result;
    }

});
