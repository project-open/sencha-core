// /sencha-core/www/model/TimesheetTaskDependency.js
//
// Copyright (C) 2015 ]project-open[
//
// All rights reserved. Please see
// http://www.project-open.com/license/ for details.

/**
 * A TimesheetTaskDependency represents a dependency
 * arrow from one task to another task.
**/
Ext.define('PO.model.timesheet.TimesheetTaskDependency', {
    extend: 'Ext.data.Model',
    xtype: 'timesheetTaskDependency',
    fields: [
	// Identity
	'id',						// 

	// Main object fields
	'dependency_id',				// 
	'dependency_status_id',				// 
	'dependency_type_id',				// 
	'task_id_one',					// 
	'task_id_two',					// 
	'hardness_type_id',				// 
	'difference',					// 

	// Optional fields used by Resource Leveling Editor
	// in order to store the start- and end dates of tasks
	'main_project_id_one',				// 
	'main_project_id_two',				// 
	'task_one_start_date',				// 
	'task_one_end_date',				// 
	'task_two_start_date',				// 
	'task_two_end_date',				// 

	// Optional field with dereferenced task and project names
	'main_project_name_one',			// 
	'main_project_name_two',			// 
	'task_one_name',				// 
	'task_two_name'					// 
    ],
    proxy: {
	type:			'rest',
	url:			'/intranet-rest/im_timesheet_task_dependency',
	appendId:		true,		// Append the object_id: ../im_timesheet_task_dependey/<object_id>
	timeout:		300000,
	
	extraParams: {
	    format:		'json',		// Tell the ]po[ REST to return JSON data.
	    deref_p:		'1'
	},
	reader: {
	    type:		'json',		// Tell the Proxy Reader to parse JSON
	    root:		'data',		// Where do the data start in the JSON file?
	    totalProperty:	'total'		// Total number of tickets for pagination
	},
	writer: {
	    type:		'json'		// Allow Sencha to write ticket changes
	}
    }
});
