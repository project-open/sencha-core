// /sencha-core/www/model/TimesheetTask.js
//
// Copyright (C) 2013 ]project-open[
//
// All rights reserved. Please see
// http://www.project-open.com/license/ for details.

/**
 A "TimesheetTask" (there also other types of tasks in ]po[)
 represents a single Gantt bar in a Gantt diagram. The gantt
 bar represents a single project activity or a group of activities.
 
 TimesheetTask is a sub-type of "Project", so it inherits all
 fields and characteristics of a project, but not all of them
 are actively used.
**/

Ext.define('PO.model.timesheet.TimesheetTask', {
    extend: 'Ext.data.Model',
    xtype: 'timesheetTask',
    fields: [

        // Identity
        'id',					// The system wide unique ID for this object (-> acs_objects)
        'task_id',				// The primary key or object_id of the project (-> im_timesheet_tasks)
        'project_name',				// The name of the task (inherited from Project)
        'project_nr',				// The short name of the task (inherited from Project)
        'company_id',				// Customer for whom the task has been created (-> im_companies)
        'parent_id',				// The parent of the task or NULL for a main project (-> im_projects)
        'tree_sortkey',				// A strange "bit string" that determines the hierarchical position of the task.
                                                // Contains the same information as "parent_id", maintained automatically by 
                                                // triggers in the database

        // Main properties of a task
        'start_date',				// Start of task as ISO timestamp ('2001-01-01 00:00:00+01')
        'end_date',				// End of task as ISO timestamp ('2099-12-31 00:00:00+01')
        'percent_completed',			// 0 - 100: Defines what has already been done.
	// milestone_p gives a lot of trouble, because this field is stored as a char(1) on the server-side.
	// A boolean "true" or "false" value breaks the database, so we make sure it's "t" or "f".
	'milestone_p',
//	{name: 'milestone_p',			// 't' for Milestone, 'f' or '' for normal task
//	 convert: function(value, record) {	// fix boolean vs. 't'/'f' checkbox for milestone_p
//	     var result = record.get('milestone_p');
//	     if ("t" == result || "true" == result || true == result) return "t";
//	     return "f";
//	 }
//	},

        'description',				// Description of the task activity
        'note',					// Notes about the task activity

	// Advanced properties of a task
        'material_id',				// The type of activity (-> im_materials)
        'uom_id',				// Unit or Measure, should nearly always be 320="Hour" (-> im_categories)
        'planned_units',			// Planned duration of the activity
        'billable_units',			// Units that can be billed to the customer (company_id)
        'cost_center_id',			// Optional department/cost center of who executes this activity.
                                                // Only used in specific ]po[ installations (-> im_cost_centers)
        'priority',				// Priority of the task (-> im_categories)
        'sort_order',				// Order of the task, with respect to other tasks on the same level

        // MS-Project: These fields are used to contain information imported from MS-Project
        // This information determines how tasks are scheduled by the task scheduler.
        'scheduling_constraint_id',		// MS-Project: Type of scheduling constraint (-> im_cost_centers)
        'scheduling_constraint_date',		// MS-Project: Field for "should not start before" constraint or similar
        { name: 'effort_driven_p',			// MS-Project: Effort driven?
	 convert: function(value, record) {	// fix boolean vs. 't'/'f' issues in the DB
	     var result = record.get('effort_driven_p');
	     if ("t" == result || "true" == result || true == result) return "t";
	     return "f";
	 }
	},
        'effort_driven_type_id',		// MS-Project: Specific way to to determine effort driven
        'deadline_date',			// MS-Project: Deadline for this activitiy

        // Gantt-Project: This is an open-source clone of MS-Project
        'gantt_project_id',		 	// ID of the task when imported from Gantt-project

        // Project Billing: These fields are used when using ]po[ to automatically create invoices from tasks.
        'invoice_id',				// ID of the invoice that contains this task (-> im_invoices)

        // Fields inherited from im_projects that don't really make sense for tasks
        'project_status_id',			// Projects may have many states, but tasks should be either 76=open or 81=closed.
        'project_type_id',			// Type of the project. This value should be 100=Task always.
        'project_lead_id',			// Single person responsible for the success of the task.
        // This field is used in ]po[ only for "main projects", so this
        // should be always NULL for tasks.
        'on_track_status_id',			// Is the task on-track? Normally not used for tasks. 66=green, 67=yellow, 68=red
        'level',				// 0 for a main project, 1 for a first level task etc.

        // Locking: This is is not supported at the moment (2013-11-26) but might be in the future
        'lock_user',				// ID of the user who locked the task
        'lock_date',				// When was the task locked (ISO timestamp)
        'lock_ip',				// IP address of the user who locked

        // Object audit information
        'object_type',				// This should always be 'im_timesheet_task'.
        'creation_date',			// When was the task created initially?
        'creation_user',			// User_id of the guy who creating the task
        'creation_ip',				// IP address of the user who created the task
        'last_modified',			// When was the task last modified?
        'modifying_user',			// Who modified the task?
        'modifying_ip',				// IP address of the last modification

        // Dereferenced fields contain pretty names (English) for the corresponding *_id fields.
        // These fields only have a value if you have specified the parameter deref_p=1 in
        // the REST interface URL
        'project_status_id_deref',		// Project Status ("Open" or "Closed")
        'project_type_id_deref',		// Project Type (always "Task")
        'company_id_deref',			// Customer name
        'parent_id_deref',			// Name of parent project or task
        'project_lead_id_deref',		// Project manager name
        'material_id_deref',			// Name of material (service type)
        'uom_id_deref',				// Unit of measure (should alsways be "Hour")
        'on_track_status_id_deref',		// Is the task on-track? "Green", "Yellow" or "Red"

        'icon', 				// Used by ExtJS for the icon in the tree (2015-08-04 doesn't seem to work...)
        'iconCls',                              // Used by ExtJS for the icon, seems to work

        'successors',				// List of tasks that depend on the current tasks
        'predecessors',				// List of tasks on which this task depends
        'assignees',				// List of users assigned to the task with {id,user_id,percent}

        'expanded',                             // true or false (without quotes), default state for tree

        // Add dynfields
<multiple name=dynfields>
        '@dynfields.name@',</multiple>


        {   name: 'icon',			// A &nbsp; sequence representing the project indentation
            convert: function(value, record) {
                var typeId = parseInt(record.get('project_type_id'));
                // console.log('PO.model.timesheet.TimesheetTask.icon: Type='+typeId);
                switch (typeId) {
                case 101: return '/intranet/images/navbar_default/tag_blue.png'; break;		// Ticket
                case 2502: return '/intranet/images/navbar_default/table.png'; break;		// SLA
                default:
                    return '';			// Empty string - enables default behavior
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
        url:			'/intranet-rest/im_timesheet_task',
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
    },

    /**
     * Is this task a milestone?
     */
    isMilestone: function() {
        var me = this;
        var milestoneString = me.get('milestone_p');
        if ("t" == milestoneString) return true;

/* Fraber 161229: Doesn't work, because of date vs. timestamptz.

        var startDate = PO.Utilities.pgToDate(me.get('start_date'));
        var endDate = PO.Utilities.pgToDate(me.get('end_date'));

        if (startDate && endDate) {
            var startTime = startDate.getTime();
            var endTime = endDate.getTime();
            if (startTime == endTime) {
		return true;
	    }
        }
*/

        return false;
    }

});

