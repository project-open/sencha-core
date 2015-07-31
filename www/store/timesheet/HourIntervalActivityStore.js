// /sencha-core/www/store/timesheet/HourIntervalActivity.js
//
// Copyright (C) 2013 ]project-open[
//
// All rights reserved. Please see
// http://www.project-open.com/license/ for details.

Ext.define('PO.store.timesheet.HourIntervalActivityStore', {
    extend:         'PO.store.CategoryStore',
    model: 	    'PO.model.category.Category',
    storeId:	    'hourIntervalActivity',
    autoLoad:	    true,
    remoteFilter:   true,
    pageSize:	    1000,
    proxy: {
	type:       'rest',
	url:        '/intranet-rest/im_category',
	appendId:   true,
	extraParams: {
	    format: 'json',
	    category_type: '\'Intranet Project Status\''
	},
	reader: { type: 'json', root: 'data' }
    }
});

