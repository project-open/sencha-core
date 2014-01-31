/* /sencha-core/www/store/project/ProjectMainStore.js
 *
 * Copyright (C) 2014 ]project-open[
 *
 * All rights reserved. Please see
 * http://www.project-open.com/license/ for details.
 */

Ext.define('PO.store.project.ProjectMainStore', {
    extend:         'Ext.data.Store',
    model: 	    'PO.model.Project',
    storeId:	    'projectMainStore',
    autoLoad:	    true,
    remoteFilter:   true,
    pageSize:	    100000,
    proxy: {
	type:       'rest',
	url:        '/intranet-rest/im_project',
	appendId:   true,
	timeout:    300000,
	extraParams: {
	    format:	'json',
	    deref_p:	'1',
	    project_status_id:	'76',
	    query:	'parent_id is NULL'
	},
	reader: {
		type:		'json',		// Tell the Proxy Reader to parse JSON
		root:		'data',		// Where do the data start in the JSON file?
		totalProperty:  'total'		// Total number of tickets for pagination
	},
	writer: {
		type:		'json'		// Allow Sencha to write ticket changes
	}
    }
});
