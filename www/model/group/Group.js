/* 
 * /sencha-core/www/model/group/Group.js
 *
 * Copyright (C) 2014 ]project-open[
 * All rights reserved. Please see
 * http://www.project-open.com/license/sencha/ for details.
 *
 * This is the default Sencha model for groups and sub-
 * types including "im_profile" and "im_ticket_queue" with 
 * all important fields available from the ]po[ data-model.
 */

Ext.define('PO.model.group.Group', {
    extend: 'Ext.data.Model',
    fields: [
	'id',
	'object_type',				// Type of group: 'group', 'im_profile', ...

	// Basic Information
	'group_id',				// The primary key or object_id of the group
	'group_name',				// System name, frequently the Windows login of the group
	'join_policy',				// Obsolete, probably 'closed'
	'email',				// Optional email of the group, from parties, probably empty

	// Object metainformation
	'creation_date',			// 
	'creation_ip',				// 
	'creation_group',			// 
	'last_modified',			// 
	'modifying_ip',				// 
	'modifying_user'			// 
    ],

    proxy: {
	type:			'rest',				// Use the standard ]po[ REST interface for loading/saving
	url:			'/intranet-rest/group',	// Standard URL for groups
	appendId:		true,				// Append the object_id: ../im_ticket/<object_id>
	timeout:		300000,
	
	extraParams: {
	    format:		'json',				// Tell the ]po[ REST to return JSON data.
	    deref_p:		'0'				// By default also load denormalized fields 
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

