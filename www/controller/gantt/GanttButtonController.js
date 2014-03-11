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

    refs: [{
        ref: 'ganttTreePanel',
        selector: '#ganttTreePanel'
    }],
    
    init: function() {
	console.log('PO.controller.gantt.GanttButtonController: init');

	var panel = this.getGanttTreePanel();
	this.control({
            '#buttonLoad': { click: this.onButtonLoad },
            '#buttonSave': { click: this.onButton },
            '#buttonAdd': { click: panel.onButtonAdd },
            '#buttonDelete': { click: this.onButton },
            '#buttonReduceIndent': { click: this.onButton },
            '#buttonIncreaseIndent': { click: this.onButton },
            '#buttonDependencies': { click: this.onButton },
            '#buttonAddDependency': { click: this.onButton },
            '#buttonBreakDependency': { click: this.onButton },
            '#buttonZoomIn': { click: this.onButton },
            '#buttonZoomOut': { click: this.onButton },
            '#buttonSettings': { click: this.onButton }
        });

	return this;
    },

    onButtonLoad: function() {
	console.log('ButtonLoad');
    },

    onButtonSave: function() {
	console.log('ButtonSave');
    }


});

