/* 
 * /sencha-core/www/model/user/Absence.js
 *
 * Copyright (C) 2014 ]project-open[
 * All rights reserved. Please see
 * http://www.absence-open.com/license/sencha/ for details.
 *
 * This is the default Sencha model for absences with all
 * important fields available from the ]po[ data-model.
 * Notes:
 * <ul>
 * <li>The model already includes a number of "denormalized" fields
 *     (absence_status, ...) that are filled ONLY if deref_p=1 during loading.
 * </ul>
 */

Ext.define('PO.model.user.Absence', {
    extend: 'Ext.data.Model',
    fields: [
	'id',

	// Basic Information
	'absence_id',				// The primary key or object_id of the absence
	'owner_id',				// The user affected by the absence
	'group_id',				// The group affected by the absence
	'absence_name',				// Title
	'start_date',				// Day of start, including this day
	'end_date',				// End of absence. A 1 day absence has start_date = end_date
	'duration_days',			// Days of duration. Normally = (end_date - start_date + 1)
	'absence_status_id',			// Status (approved, ...)
	'absence_type_id',			// Vacation, travel, sick, ...
	'description',				// 
	'contact_info',				// How to contact the vacation user in case of emergency?
	'vacation_replacement_id',		// Who should takover workflow tasks etc?

	// Object metainformation
	'creation_date',			// 
	'creation_ip',				// 
	'creation_absence',			// 
	'last_modified',			// 
	'modifying_ip',				// 
	'modifying_absence',			// 

	// Denormalized Values
	'absence_status',			// 
	'absence_type',				// 
	'vacation_replacement',			// Who should takover workflow tasks etc?

	{ name: 'name',			        // 
	  convert: function(value, record) {
	      var fullName = record.get('absence_name');
	      return fullName;
	  }
	}
    ],

    proxy: {
	type:			'rest',				// Use the standard ]po[ REST interface for loading/saving
	url:			'/intranet-rest/im_user_absence',	// Standard URL for absences
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
