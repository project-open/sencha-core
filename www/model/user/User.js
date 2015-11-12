/* 
 * /sencha-core/www/model/user/User.js
 *
 * Copyright (C) 2014 ]project-open[
 * All rights reserved. Please see
 * http://www.user-open.com/license/sencha/ for details.
 *
 * This is the default Sencha model for users with all
 * important fields available from the ]po[ data-model.
 * Notes:
 * <ul>
 * <li>The model already includes a number of "denormalized" fields
 *     (user_status, company_name, ...) that are filled ONLY
 *     if deref_p=1 during loading.
 * </ul>
 */

Ext.define('PO.model.user.User', {
    extend: 'Ext.data.Model',
    fields: [
	'id',

	// Basic Information
	'user_id',				// The primary key or object_id of the user
	'email',				// 
	'username',				// System name, frequently the Windows login of the user
	'screen_name',				// 
	'first_names',				// 
	'last_name',				// 
	'note',					// 

	// System Information
	'authority_id',				// 
	'locale',				// 
	'n_sessions',				// 

	// Tel Information
	'url',					// 
	'cell_phone',				// 
	'fax',					// 
	'home_phone',				// 
	'icq_number',				// 
	'msn_screen_name',			// 
	'pager',				// 

	// Object metainformation
	'creation_date',			// 
	'creation_ip',				// 
	'creation_user',			// 
	'last_modified',			// 
	'modifying_ip',				// 
	'modifying_user',			// 

	// Employee Information
	'department_id',			// 
	'supervisor_id',			// 
	'job_description',			// 
	'job_title',				// 
	'employee_status_id',			// 
	'availability',				// 
	'hourly_cost',				// 
	'birthdate',				// 
	'vacation_balance',			// 
	'vacation_days_per_year',		// 

	// Home Address information
	'ha_city',				// 
	'ha_country_code',			// 
	'ha_line1',				// 
	'ha_line2',				// 
	'ha_postal_code',			// 
	'ha_state',				// 

	// Work Address
	'wa_city',				// 
	'wa_country_code',			// 
	'wa_line1',				// 
	'wa_line2',				// 
	'wa_postal_code',			// 
	'wa_state',				// 
	'work_phone',				// 

	{ name: 'name',			        // 
	  convert: function(value, record) {
	      var fullName = record.get('first_names') + ' ' + record.get('last_name');
	      return fullName;
	  }
	},
	{ name: 'initials',			// 
	  convert: function(value, record) {
	      var initials = "" + record.get('first_names').substr(0,1) + record.get('last_name').substr(0,1);
	      return initials;
	  }
	}
    ],

    proxy: {
	type:			'rest',				// Use the standard ]po[ REST interface for loading/saving
	url:			'/intranet-rest/user',	// Standard URL for users
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

