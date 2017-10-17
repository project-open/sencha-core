// /sencha-core/www/store/timesheet/TaskMaterialStore.js
//
// Copyright (C) 2013 ]project-open[
//
// All rights reserved. Please see
// http://www.project-open.com/license/ for details.

Ext.define('PO.store.timesheet.TaskMaterialStore', {
    extend:         'Ext.data.Store',
    model: 	    'PO.model.timesheet.Material',
    storeId:	    'taskMaterialStore',
    pageSize:       100000,

    sorters: [{
        property: 'material_name',
        direction: 'DESC'
    }],

    proxy: {
	type:       'rest',
	url:        '/intranet-rest/im_material',
	appendId:   true,
	extraParams: {
	    format: 'json'
	},
	reader: { type: 'json', root: 'data' }
    }
});

