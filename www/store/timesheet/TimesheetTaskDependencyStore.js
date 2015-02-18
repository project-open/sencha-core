// /sencha-core/www/store/timesheet/TimesheetTaskDependencyStore.js
//
// Copyright (C) 2013-2015 ]project-open[
//
// All rights reserved. Please see
// http://www.project-open.com/license/ for details.

Ext.define('PO.store.timesheet.TimesheetTaskDependencyStore', {
    extend:         'Ext.data.Store',
    model: 	    'PO.model.timesheet.TimesheetTaskDependency',
    storeId:	    'timesheetTaskDependencyStore',
    autoDestroy:    true,
    autoLoad:	    false,
    autoSync:	    false,
    remoteFilter:   true,
    pageSize:	    10000,
    proxy: {
	type:       'rest',
	url:        '/intranet-rest/im_timesheet_task_dependency',
	appendId:   true,
	extraParams: {
	    format: 'json'
	},
	reader: { type: 'json', root: 'data' }
    }
});

