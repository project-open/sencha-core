/* 
 * /sencha-core/www/store/user/UserStore.js
 *
 * Copyright (C) 2014 ]project-open[
 * All rights reserved. Please see
 * https://www.project-open.com/license/sencha/ for details.
 *
 * <ul>
 * <li>A store with the list of all active main projects in the system.
 * <li>The store needs explicit sync() in order to store changes.
 * <li>The store does not explicitely exclude tasks and tickets
 *     with parent_id=NULL, which may occur accidentally in ]po[.
 * </ul>
 */

Ext.define('PO.store.user.UserStore', {
    storeId:		'userStore',
    extend:		'Ext.data.Store',
    requires:		['PO.model.user.User'],
    model: 		'PO.model.user.User',			// Uses standard User as model
    autoLoad:		false,
    remoteFilter:	true,					// Do not filter on the Sencha side
    pageSize:		100000,					// Load all projects, no matter what size(?)
    proxy: {
	type:		'rest',					// Standard ]po[ REST interface for loading
	url:		'/intranet-rest/user',
	appendId:	true,
	timeout:	300000,
	extraParams: {
	    format:		'json'
	    // deref_p:		'1'				// We don't need company_name etc.
	    // This should be overwrittten during load.
	},
	reader: {
	    type:		'json',				// Tell the Proxy Reader to parse JSON
	    root:		'data',				// Where do the data start in the JSON file?
	    totalProperty:	'total'				// Total number of tickets for pagination
	},
	writer: {
	    type:		'json'				// Allow Sencha to write ticket changes
	}
    }
});

