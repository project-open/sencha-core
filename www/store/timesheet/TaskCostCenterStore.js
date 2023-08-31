// /sencha-core/www/store/timesheet/TaskCostCenterStore.js
//
// Copyright (C) 2013 ]project-open[
//
// All rights reserved. Please see
// https://www.project-open.com/license/ for details.

Ext.define('PO.store.timesheet.TaskCostCenterStore', {
    extend:         'Ext.data.Store',
    model: 	    'PO.model.finance.CostCenter',
    storeId:	    'taskCostCenterStore',
    proxy: {
	type:       'rest',
	url:        '/intranet-rest/im_cost_center',
	appendId:   true,
	extraParams: {
	    format: 'json',
	    limit: 1000000
	},
	reader: { type: 'json', root: 'data' }
    }
});

