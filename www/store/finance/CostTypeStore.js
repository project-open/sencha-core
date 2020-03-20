// /sencha-core/www/store/finance/CostTypeStore.js
//
// Copyright (C) 2013-2020 ]project-open[
//
// All rights reserved. Please see
// http://www.project-open.com/license/ for details.

Ext.define('PO.store.finance.CostTypeStore', {
    extend:         'PO.store.CategoryStore',
    model: 	    'PO.model.category.Category',
    storeId:	    'costTypeStore',
    proxy: {
	type:       'rest',
	url:        '/intranet-rest/im_category',
	appendId:   true,
	extraParams: {
	    format: 'json',
	    include_disabled_p: '1', // Make sure to include "Open" and "Closed" even if disabled
	    category_type: '\'Intranet Cost Type\''
	},
	reader: { type: 'json', root: 'data' }
    }
});
