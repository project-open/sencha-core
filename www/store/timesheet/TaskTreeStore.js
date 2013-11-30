// /sencha-core/www/store/timesheet/TaskTreeStore.js
//
// Copyright (C) 2013 ]project-open[
//
// All rights reserved. Please see
// http://www.project-open.com/license/ for details.

Ext.define('PO.store.timesheet.TaskTreeStore', {
    extend:     'Ext.data.TreeStore',
    storeId:    'taskTreeStore',
    model:      'PO.model.timesheet.TimesheetTask',
    autoload:   false,
    autoSync:   true,
    folderSort: true,
    proxy: {
	type:  'ajax',
        url:   '/sencha-task-editor/treegrid.json',
        extraParams: {
            project_id: 0		// The application needs to replace this by the actual
	    				// project_id of the project before calling load()
        },
	api: {
	    create  : '/sencha-task-editor/treegrid.json?create=1',
	    read    : '/sencha-task-editor/treegrid.json?read=1',
	    update  : '/sencha-task-editor/treegrid-update',
	    destroy : '/sencha-task-editor/treegrid.json?destroy=1',
	},
        reader: {
	    type: 'json', 
	    rootProperty: 'data' 
	},
        writer: {
	    type: 'json', 
	    rootProperty: 'data' 
	}
    }
});

