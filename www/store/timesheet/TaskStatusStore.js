// /sencha-core/www/store/timesheet/TimesheetTask.js
//
// Copyright (C) 2013 ]project-open[
//
// All rights reserved. Please see
// https://www.project-open.com/license/ for details.

/*
Ext.define('PO.store.timesheet.TaskStatusStore', {
    extend:     'Ext.data.Store',
    storeId:	'taskStatusStore',
    fields:     ['id', 'category'],
    data: [
	{"id":"76", "category":"Open"},
	{"id":"81", "category":"Closed"}
    ]
});
*/


Ext.define('PO.store.timesheet.TaskStatusStore', {
    extend:         'PO.store.CategoryStore',
    model: 	    'PO.model.category.Category',
    storeId:	    'taskStatusStore',
    proxy: {
	type:       'rest',
	url:        '/intranet-rest/im_category',
	appendId:   true,
	extraParams: {
	    format: 'json',
	    include_disabled_p: '1', // Make sure to include "Open" and "Closed" even if disabled
	    category_type: '\'Intranet Project Status\''
	},
	reader: { type: 'json', root: 'data' }
    }
});

