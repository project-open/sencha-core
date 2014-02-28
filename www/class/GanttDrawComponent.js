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

    startTime: 0,
    endTime: 0,

    startX: 0,
    endX: 0,
    w: 0,
    h: 0,

    initComponent: function() {
        var me = this;
        this.callParent(arguments);

        me.startTime = new Date('2013-01-01').getTime();
        me.endTime = new Date('2015-01-01').getTime();
        
        me.startX = 10;
        me.endX = 300;
        me.w = 300;
        me.h = 300;

        me.ganttTreePanel.on({
            'itemexpand': me.redraw,
            'itemcollapse': me.redraw,
            'itemmove': me.redraw,
            'itemremove': me.redraw,
            'iteminsert': me.redraw,
            'itemappend': me.redraw,
            'resize': me.redraw,
            'scope': this
        });

/*
        me.ganttTreePanel.on('viewready', function() {
            console.log('PO.class.GanttDrawComponent.onViewReady');
            me.redraw();
        });
        me.ganttTreePanel.on('columnschanged', function() {
            console.log('PO.class.GanttDrawComponent.onColumnChanged');
            me.redraw();
        });
        me.ganttTreePanel.on('afterrender', function() {
            console.log('PO.class.GanttDrawComponent.onAfterRender');
            me.redraw();
        });
        me.ganttTreePanel.on('render', function() {
            console.log('PO.class.GanttDrawComponent.onRender');
            me.redraw();
        });
        me.ganttTreePanel.on('expand', function() {
            console.log('PO.class.GanttDrawComponent.onExpand');
            me.redraw();
        });
*/
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

        // Iterate through all children of the root node and check if they are visible
        rootNode.cascadeBy(function(model) {
            var viewNode = ganttTreeView.getNode(model);

            // hidden nodes/models don't have a viewNode, so we don't need to draw a bar.
            if (viewNode == null) { return; }
            if (!model.isVisible()) { return; }
            me.drawBar(model, viewNode);
            
        });
        console.log('PO.class.GanttDrawComponent.redraw: Finished');
    },


    /**
     * Draw a single bar for a project or task
     */
    drawBar: function(project, viewNode) {
        console.log('PO.class.GanttDrawComponent.drawBar: Starting');
        console.log(project);
        console.log(viewNode);

        var me = this;
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
	var y = projectY - panelY;
        var w = Math.floor( me.w * (endTime - startTime) / (me.endTime - me.startTime));

        var spriteBar = surface.add({
            type: 'rect',
            x: me.startX,
            y: y,
            width: w,
            height: 15,
            radius: 3,
	    fill: 'blue',
            stroke: 'blue',
            'stroke-width': 1
        }).show(true);
        spriteGroup.add(spriteBar);

        console.log('PO.class.GanttDrawComponent.drawBar: Finished');
    }

});

