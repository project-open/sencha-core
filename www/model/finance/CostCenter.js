/* 
 * /sencha-core/www/model/finance/CostCenter.js
 *
 * Copyright (C) 2014 ]project-open[
 * All rights reserved. Please see
 * http://www.project-open.com/license/sencha/ for details.
 *
 * This is the default Sencha model for cost centers with 
 * all important fields available from the ]po[ data-model.
 * Note:
 * <ul>
 * <li>The model already includes a number of "denormalized" fields
 *     (cost_center_status, company_name, ...) that are filled ONLY
 *     if deref_p=1 during loading.
 * </ul>
 */

Ext.define('PO.model.finance.CostCenter', {
    extend: 'Ext.data.Model',

    fields: [
        'id',
	'cost_center_id',					// The primary key or object_id of the cost center
	'cost_center_name',					// The name of the cost center
	'cost_center_label',					// The short name of the cost center.
	'cost_center_code',					// The short name of the cost center.

	'cost_center_status_id',				// 76=open, 81=closed, ...
	'cost_center_type_id',					// 100=Task, 101=Ticket, 2501=Gantt CostCenter, ...
	'parent_id',						// Parent cost center or NULL for a top.
	'manager_id',						// CostCenter manager
	'tree_sortkey',						// hierchical tree index
	'max_child_sortkey',					// auxilary field for hierarchical tree index
	'description',						// Description
	'note',							// Note
	'department_planner_days_per_year',			// sum of available employee time per dept

	// ------------						// Denormalized fields from suitable queries
	'cost_center_status',					// status (English), may not be set depending on query
	'cost_center_type',					// type (English), may not be set depending on query
	'manager_name',						// denormalized manager name

	// ------------						// Fields for portfolio planner. ToDo: Move to subclass?
	'assigned_resources',					// Number of full-time resources being a member of this CC
        'available_days',					// Array with J -> available days, starting with start_date
        'assigned_days',					// Array with J -> assigned days, starting with start_date

	{ name: 'level',					// 0 for the top-level company", 1 for a sub-cost center etc.
	  convert: function(value, record) {
	      var sortKey = record.get('tree_sortkey');
	      return sortKey.length / 8 - 5;
	  }
	},

	{ name: 'indent',					// A &nbsp; sequence representing the cost center indentation
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
	url:			'/intranet-rest/im_cost_center',// Standard URL for cost centers
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
