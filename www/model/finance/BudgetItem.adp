// /sencha-core/www/model/BudgetItem.js
//
// Copyright (C) 2013-2020 ]project-open[
//
// All rights reserved. Please see
// https://www.project-open.com/license/ for details.

/**
 * BudgetItem represents one line of a (project) budget.
**/

Ext.define('PO.model.finance.BudgetItem', {
    extend: 'Ext.data.Model',
    xtype: 'budgetItem',
    fields: [

        // Identity
        'id',					// The system wide unique ID for this object (-> acs_objects)
        'budget_item_id',			// same as id

        // Core attributes
        'budget_item_name',			// The humen readable name
        'budget_item_nr',			// The machine readable nr
        'budget_item_parent_id',		// The parent of the BI of NULL for a main BI
        'budget_item_status_id',		// The status of the BI - active or deleted
        'budget_item_type_id',			// The type of the BI - just default...

        'budget_item_owner_id',			// Who is the responsible for this BI?
        'budget_item_project_id',		// To which project does the BI belong?
        'budget_item_max_value',		// Maximum value of BI - block if exceeding this
        'budget_item_alarm_value',		// Alarm value of BI - notify owner if exceeding this

        {name: 'sort_order', type: 'string', sortType: 'asInt'}, // Order of the BI, with respect to other BIs on the same level
        'description',				// Description of the BI
        'note',					// Notes about the BI
        'tree_sortkey',				// A strange "bit string" that determines the hierarchical position of the task.
                                                // Contains the same information as "parent_id", maintained automatically by 
                                                // triggers in the database
        'max_child_sortkey',			// belongs to the tree_sortkey

        // Object audit information
        'object_type',				// This should always be 'im_timesheet_task'.
        'creation_date',			// When was the task created initially?
        'creation_user',			// User_id of the guy who creating the task
        'creation_ip',				// IP address of the user who created the task
        'last_modified',			// When was the task last modified?
        'modifying_user',			// Who modified the task?
        'modifying_ip',				// IP address of the last modification

        'expanded',                             // true or false (without quotes), default state for tree

        // Start dynfields
<multiple name=dynfields>        '@dynfields.name@',
</multiple>
        // End dynfields

        {   name: 'icon',			// A &nbsp; sequence representing the budget item
            convert: function(value, record) {
                var typeId = parseInt(record.get('project_type_id'));
                // console.log('PO.model.timesheet.BudgetItem.icon: Type='+typeId);
                switch (typeId) {
                case 101: return '/intranet/images/navbar_default/tag_blue.png'; break;		// Ticket
                case 2502: return '/intranet/images/navbar_default/table.png'; break;		// SLA
                default: return '';			// Empty string - enables default behavior
                }
            }
        },
        {   name: 'indent',			// A &nbsp; sequence representing the project indentation
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
        type:			'rest',
        url:			'/intranet-rest/im_budget_item',
        appendId:		true,		// Append the object_id: ../im_ticket/<object_id>
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

