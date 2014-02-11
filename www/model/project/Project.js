/* 
 * /sencha-core/www/model/project/Project.js
 *
 * Copyright (C) 2014 ]project-open[
 * All rights reserved. Please see
 * http://www.project-open.com/license/sencha/ for details.
 *
 * This is the default Sencha model for projects with all
 * important fields available from the ]po[ data-model.
 * Notes:
 * <ul>
 * <li>The model already includes a number of "denormalized" fields
 *     (project_status, company_name, ...) that are filled ONLY
 *     if deref_p=1 during loading.
 * </ul>
 */

Ext.define('PO.model.project.Project', {
    extend: 'Ext.data.Model',
    fields: [
	'id',
	'project_id',				// The primary key or object_id of the project
	'project_name',				// The name of the project

	'creation_user',			// User_id of the guy creating the project
	'project_nr',				// The short name of the project.
	'project_path',				// The short name of the project.
	'parent_id',				// The parent of the project or NULL for a main project
	'tree_sortkey',				// A strange bitstring that determines the hierarchical position
	'company_id',				// Company for whom the project has been created

	'project_status_id',			// 76=open, 81=closed, ...
	'project_type_id',			// 100=Task, 101=Ticket, 2501=Consulting Project, ...
	
	'start_date',				// '2001-01-01 00:00:00+01'
	'end_date',
	'project_lead_id',			// Project manager
	'percent_completed',			// 0 - 100: Defines what has already been done.
	'on_track_status_id',			// 66=green, 67=yellow, 68=red
	'description',		
	'note',

	'level',				// 0 for a main project, 1 for a sub-project etc.

	// ------------				// Denormalized fields from suitable queries
	'project_status',			// denormalized project_status_id (English), may not be set depending on query
	'project_type',				// denormalized project_type_id (English), may not be set depending on query
	'company_name',				// denormalized company_id
	'project_lead_name',			// Project manager

	// ------------				// Special fields only used by certain quieres. ToDo: Different model?
	'hours_total',				// may not be set depending on query
	'hours_for_user',			// may not be set depending on query
	'hours_for_user_date',			// may not be set depending on query

	{ name: 'indent',			// A &nbsp; sequence representing the project indentation
	  convert: function(value, record) {
	      var level = record.get('level');
	      var result = '';
	      while (level > 0) {
		  result = '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' + result;
		  level = level - 1;
	      }
	      return result;
	  }
	},
	{ name: 'end_date_date',				// end_date as Date, required by Chart
	  convert: function(value, record) {
	      var end_date = record.get('end_date');
	      return new Date(end_date);
	  }
	}
    ],

    proxy: {
	type:			'rest',				// Use the standard ]po[ REST interface for loading/saving
	url:			'/intranet-rest/im_project',	// Standard URL for projects
	appendId:		true,				// Append the object_id: ../im_ticket/<object_id>
	timeout:		300000,
	
	extraParams: {
	    format:		'json',				// Tell the ]po[ REST to return JSON data.
	    deref_p:		'1'				// By default also load denormalized fields 
	    							// (may be different when loaded from stores)
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

