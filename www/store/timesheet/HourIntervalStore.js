// /sencha-core/www/store/timesheet/HourIntervalStore.js
//
// Copyright (C) 2013-2014 ]project-open[
//
// All rights reserved. Please see
// http://www.project-open.com/license/ for details.

Ext.define('PO.store.timesheet.HourIntervalStore', {
    extend:         'Ext.data.Store',
    model: 	    'PO.model.timesheet.HourInterval',
    storeId:	    'hourIntervalStore',
    autoLoad:	    false,
    remoteFilter:   true,
    pageSize:	    1000,
    proxy: {
	type:       'rest',
	url:        '/intranet-rest/im_hour_interval',
	appendId:   true,
	extraParams: {
	    format: 'json',
	    user_id: 0,			// Needs to be overwritten by controller
	    project_id: 0		// Needs to be overwritten by controller
	},
	reader: { type: 'json', root: 'data' }
    }
});

