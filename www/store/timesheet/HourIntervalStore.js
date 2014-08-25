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
    autoDestroy:    true,
    autoLoad:	    false,
    autoSync:	    false,
    remoteFilter:   true,
    pageSize:	    1000,
    sorters: [{
        property: 'interval_start',
        direction: 'DESC'
    }],
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
    },

    listeners: {
	update: function(store, record, operation, modifiedFields) { 
	    if ("commit" == operation) { return; }
	    // if (store.isLoading()) { return; }
	    console.log('PO.controller.timesheet.HourIntervalStore: update: '+record + ', modified='+modifiedFields);
	},

	// Extract the editable fields interval_date, start_time and end_time
	// from the data returned by the ]po[ REST interface.
	load: function(store, records, successful, eOpts) {
	    if (null == records) { return; }
	    console.log('PO.controller.timesheet.HourIntervalStore: load: ');

	    var regexp = /(\d\d:\d\d)/;
	    for (var i = 0; i < records.length; i++) {
		var rec = records[i];
		var start = rec.get('interval_start');
		var end = rec.get('interval_end');

		// Update the data WITHOUT using rec.set(...)
		rec.data['interval_date'] = start.substring(0,10);
		var regArr = regexp.exec(start);
		rec.data['interval_start_time'] = regArr[1];
		var regArr = regexp.exec(end);
		rec.data['interval_end_time'] = regArr[1];

		store.afterEdit(rec, ['interval_date', 'interval_start_time', 'interval_end_time']);
	    }

	    var isLoading = store.isLoading();
	    store.loading = true;
	    store.loading = isLoading;
	}
    }
});

