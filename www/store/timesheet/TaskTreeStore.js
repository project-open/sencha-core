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
    autoSync:			true,
    folderSort:			false,		// Needs to be false in order to preserve the MS-Project import order
    proxy: {
        type:			'ajax',
        url:			'/sencha-task-editor/treegrid.json',
        extraParams: {
            project_id:		0		// Will be set by app before loading
        },
        api: {
            create:		'/sencha-task-editor/treegrid.json?create=1',
            read:		'/sencha-task-editor/treegrid.json?read=1',
            update:		'/sencha-task-editor/treegrid-update',
            destroy:		'/sencha-task-editor/treegrid.json?destroy=1',
        },
        reader: {
            type:		'json', 
            rootProperty:	'data' 
        },
        writer: {
            type:		'json', 
            rootProperty:	'data' 
        }
    }
});

