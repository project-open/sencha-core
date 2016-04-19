// /sencha-core/www/store/timesheet/TaskTreeStore.js
//
// Copyright (C) 2013 ]project-open[
//
// All rights reserved. Please see
// http://www.project-open.com/license/ for details.

/**
 * Stores all tasks of a single project as a hierarchical tree.
 * The store is used by the ]po[ Gantt Editor and the list of
 * tasks per project.
 */
Ext.define('PO.store.timesheet.TaskTreeStore', {
    extend:			'Ext.data.TreeStore',
    storeId:			'taskTreeStore',
    model:			'PO.model.timesheet.TimesheetTask',
    autoload:			false,
    autoSync:			false,          // We need manual control for saving etc.
    folderSort:			false,		// Needs to be false in order to preserve the MS-Project import order
    proxy: {
        type:			'ajax',
        url:			'/intranet-rest/data-source/project-task-tree.json',
        extraParams: {
            project_id:		0		// Will be set by app before loading
        },
        api: {
            read:		'/intranet-rest/data-source/project-task-tree.json?read=1',
            create:		'/intranet-rest/data-source/project-task-tree-action?action=create',
            update:		'/intranet-rest/data-source/project-task-tree-action?action=update',
            destroy:		'/intranet-rest/data-source/project-task-tree-action?action=delete'
        },
        reader: {
            type:		'json', 
            rootProperty:	'data' 
        },
        writer: {
            type:		'json', 
            rootProperty:	'data' 
        }
    },

    /**
     * Returns an entry for a task_id
     */
    getById: function(task_id) {
	var rootNode = this.getRootNode();
	var resultModel = null;
        rootNode.cascadeBy(function(model) {
	    var id = model.get('id');
	    if (task_id == id) { 
		resultModel = model; 
	    }
        });
	return resultModel;
    },

    /**
     * Return an array with the tree items ordered by sort_order.
     * The resulting array should not have "holes".
     */
    getSortOrderArray: function() {
	var me = this;
	var result = new Array();
        var rootNode = me.getRootNode();

        // Iterate through all children of the root node
        rootNode.cascadeBy(function(model) {
	    var sort_order = +model.get('sort_order');
	    if (0 != sort_order) {
		result[sort_order] = model;
	    }
        });

	return result;
    }
});

