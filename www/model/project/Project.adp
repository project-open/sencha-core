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
	'project_type_id',			// 100=Task, 101=Ticket, 2501=Gantt Project, ...
	
	'start_date',				// '2001-01-01 00:00:00+01'
	'end_date',
	'project_lead_id',			// Project manager
	'percent_completed',			// 0 - 100: Defines what has already been done.
	'on_track_status_id',			// 66=green, 67=yellow, 68=red
	'description',		
	'note',

	'project_budget',			// Budget
	'project_budget_hours',

	'program_id',				// Is this project part of a program or portfolio?
	'percent_completed',			// Percentage of work done
	'on_track_status_id',			// Green, yellow or red

	'template_p',				// Use this project as a template?
	'release_item_p',			// Use this project as something to be released?
	'milestone_p',				// Show this project in the milestone view?

	'company_contact_id',			// Customer contact
	'sort_order',				// Used for portfolio views
	'company_project_nr',			// The order ID of the customer
	'project_cost_center_id',		// Assign this project to some cost/profit center?

	'presales_probability',			// Presales tracking
	'presales_value',
	'presales_value_currency',
	'presales_priority_id',
	'presales_sales_stage_id',
	'presales_campaign_id',
	'presales_close_probability',


	// Financial cache
	'cost_cache_dirty',			// Set to NULL (empty) if dirty.
	'cost_bills_cache',			// 
	'cost_bills_planned',			// 
	'cost_expense_logged_cache',		// 
	'cost_expense_planned_cache',		// 
	'cost_expenses_planned',		// 
	'cost_delivery_notes_cache',		// 
	'cost_invoices_cache',			// 
	'cost_purchase_orders_cache',		// 
	'cost_quotes_cache',			// 
	'cost_timesheet_logged_cache',		// 
	'cost_timesheet_planned_cache',		// 
	'reported_hours_cache',			// 
	'reported_days_cache',			// 

	'project_budget',			// 
	'project_budget_hours',			// 

	'level',				// 0 for a main project, 1 for a sub-project etc.

	// ------------				// Denormalized fields from suitable queries
	'project_status',			// denormalized project_status_id (English), may not be set depending on query
	'project_type',				// denormalized project_type_id (English), may not be set depending on query
	'company_name',				// denormalized company_id
	'project_lead_name',			// Project manager

	// ------------				// Denormalized fields used by Portfolio Planner
        'start_j',				// Julian start date of the project
        'end_j',				// Julian end date of the project
	'on_track_status_name',			// Denormalized on_track_status_id (English)
        'assigned_days',			// Array with J -> % assignments per day, starting with start_date
        'max_assigned_days',			// Maximum of assignment for a single unit (day or week)
        'projectGridSelected',			// Did the user check the project in the ProjectGrid?
	'assigned_resources_planned',		// 

	// ------------				// Special fields only used by certain quieres. ToDo: Different model?
	'hours_total',				// may not be set depending on query
	'hours_for_user',			// may not be set depending on query
	'hours_for_user_date',			// may not be set depending on query

        // Add dynfields
<multiple name=dynfields>
        '@dynfields.name@',</multiple>


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

