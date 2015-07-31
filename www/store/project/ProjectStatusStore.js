// /sencha-core/www/store/project/ProjectStatusStore.js
//
// Copyright (C) 2014 ]project-open[
//
// All rights reserved. Please see
// http://www.project-open.com/license/ for details.

Ext.define('PO.store.project.ProjectStatusStore', {
    extend:         'PO.store.CategoryStore',
    model: 	    'PO.model.category.Category',
    storeId:	    'projectStatusStore',
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
