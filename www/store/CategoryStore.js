// /sencha-core/www/store/timesheet/TimesheetTask.js
//
// Copyright (C) 2013 ]project-open[
//
// All rights reserved. Please see
// http://www.project-open.com/license/ for details.

Ext.define('PO.store.timesheet.TaskStatusStore', {
    extend:     'Ext.data.Store',
    requires:   ['PO.model.category.Category'],
    model: 	'PO.model.category.Category',
    storeId:	'taskStatusStore',
    autoLoad:	false,
    pageSize:	10000,
    proxy: {
	type:   'rest',
	url:    '/intranet-rest/im_category',
	appendId: true,
	extraParams: {
	    format: 'json',
	    category_type: '\'Intranet Project Status\''
	},
	reader: { type: 'json', root: 'data' }
    },
    sorters: [{
	property: 'category_translated',
	direction: 'ASC'
    }]		
});

