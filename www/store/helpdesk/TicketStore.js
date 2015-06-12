/* 
 * /sencha-core/www/store/helpdesk/TicketStore.js
 *
 * Copyright (C) 2014 ]ticket-open[
 * All rights reserved. Please see
 * http://www.ticket-open.com/license/sencha/ for details.
 */

Ext.define('PO.store.helpdesk.TicketStore', {
    storeId:		'ticketStore',
    extend:		'Ext.data.Store',
    requires:		['PO.model.helpdesk.Ticket'],
    model: 		'PO.model.helpdesk.Ticket',	// Uses standard Ticket as model
    autoLoad:		false,				// Allow the application to set extraParams
    remoteFilter:	true,				// Do not filter on the Sencha side
    pageSize:		100000,				// Load all tickets, no matter what size(?)
    proxy: {
	type:		'rest',				// Standard ]po[ REST interface for loading
	url:		'/intranet-rest/im_ticket',
	appendId:	true,
	timeout:	300000,
	extraParams: {
	    // This should be overwrittten during load.
	    format:		'json',
	    deref_p:		'1'			// Also send category names for IDs
	},
	reader: {
	    type:		'json',			// Tell the Proxy Reader to parse JSON
	    root:		'data',			// Where do the data start in the JSON file?
	    totalProperty:	'total'			// Total number of tickets for pagination
	},
	writer: {
	    type:		'json'			// Allow Sencha to write ticket changes
	}
    }
});
