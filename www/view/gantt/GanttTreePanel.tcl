# Get DynFields for Timesheet Task

# Build a JavaScript array with the list of all colums enabled by default
set default_columns "planned_units logged_hours percent_completed assignees"
set default_columns [parameter::get_from_package_key -package_key "intranet-gantt-editor" -parameter DefaultEnabledColumns -default $default_columns]

set default_columns_list {}
foreach col $default_columns {
    lappend default_columns_list "'$col': true"
}

set default_columns_json "{\n\t\t[join $default_columns_list ",\n\t\t"]\n\t}"


# Extract all task attributes, except for a few ones that are
# already handled hard-coded by the GanttTreePanel.
set attributes_sql "
	select	aa.attribute_name,
		dw.widget_name,
		aa.pretty_name,
		dw.widget as tcl_widget,
		dw.parameters
	from	im_dynfield_attributes da,
		acs_attributes aa,
		im_dynfield_widgets dw
	where	da.acs_attribute_id = aa.attribute_id and
		da.widget_name = dw.widget_name and
		aa.object_type = 'im_timesheet_task' and
		da.also_hard_coded_p = 'f' and
		aa.attribute_name not in ( -- handled by GanttEditor JS
			  'creation_date', 'creation_ip', 'creation_user',
			  'lock_date', 'lock_ip', 'lock_user',
			  'modifying_ip', 'modifying_user', 'last_modified',
			  'company_id',
			  'cost_center_id',
			  'deadline_date',
			  'description',
			  'effort_driven_p', 'effort_driven_type_id',
			  'end_date',
			  'expanded',
			  'gantt_project_id',
			  'icon',
			  'invoice_id',
			  'level',
			  'material_id',
			  'milestone_p',
			  'note',
			  'object_type',
			  'on_track_status_id',
			  'percent_completed',
			  'planned_units', 'billable_units',
			  'predecessors',
			  'priority',
			  'parent_id', 'project_lead_id', 'project_name', 'project_nr', 'project_wbs', 'project_status_id', 'project_type_id',
			  'scheduling_constraint_date', 'scheduling_constraint_id',
			  'sort_order',
			  'start_date',
			  'successors',
			  'task_id',
			  'tree_sortkey',
			  'uom_id'
		)
"
# ad_return_complaint 1 [im_ad_hoc_query -format html $attributes_sql]

set errors {}
multirow create dynfields name pretty_name widget editor

db_foreach attributes $attributes_sql {
    set editor "undefined"

    # Handle specific ]po[ widgets.
    # For example, both "numeric" and textarea_small are of TCL widget "text",
    # but we want to choose different JavaScript editors ("numberfield" vs. generic)
    switch $widget_name {
	checkbox  { set editor "" }
	date - timestamp { set editor ", editor: 'podatefield'" }
	integer  { set editor ", editor: 'numberfield'" }
	numeric  { set editor ", editor: 'numberfield'" }
	richtext  { set editor ", editor: true" }
	textarea_small - textarea_small_nospell - textbox_large - textbox_medium - textbox_small { set editor ", editor: true" }
    }

    # Generic editors for certain TCL widgets
    if {"undefined" eq $editor} {

	switch $tcl_widget {

	    generic_sql {
		set parameters [lindex $parameters 0]
		# ad_return_complaint 1 "GanttTreePanel.tcl: generic_sql: parameters=$parameters"

		# A generic SQL statement defines the list of values. Example:
		# {custom {sql { select p.project_id, p.project_name from im_projects p where project_type_id = 2510 order by lower(project_name) }}}
		array unset parameter_hash
		array set parameter_hash $parameters
		foreach token [array names parameter_hash] {
		    set value $parameter_hash($token)
		    switch $token {
			custom {
			    array set generic_sql_hash $value
			    foreach generic_sql_token [array names generic_sql_hash] {
				set generic_sql_value $generic_sql_hash($generic_sql_token)
				switch $generic_sql_token {
				    sql {
					set editor [im_gantt_editor_generic_sql_editor $generic_sql_value]
				    }
				    default {
					lappend errors "GanttTreePanel.tcl: generic_sql: unknown param=$generic_sql_token, expecting sql."
				    }
				}
			    }
			}
			after_html {
			    # Ignore: after_html is for "classic" screens
			}
			default {
			    lappend errors "GanttTreePanel.tcl: generic_sql with unknown parameter=$token"
			}
		    }
		}
	    }
	    im_category_tree {
		set parameters [lindex $parameters 0]
		# {custom {category_type "Intranet Project Type" translate_p 1}}
		array unset parameter_hash
		array set parameter_hash $parameters
		foreach token [array names parameter_hash] {
		    set value $parameter_hash($token)
		    switch $token {
			custom {
			    array set im_category_tree_hash $value
			    foreach im_category_tree_token [array names im_category_tree_hash] {
				set im_category_tree_value $im_category_tree_hash($im_category_tree_token)
				switch $im_category_tree_token {
				    category_type {
					set editor [im_gantt_editor_im_category_tree_editor $im_category_tree_value]
				    }
				    translate_p {
					set translate_p $im_category_tree_value]
				    }
				    default {
					lappend errors "GanttTreePanel.tcl: im_category_tree: unknown param=$im_category_tree_token, expecting category_type or translate_p."
				    }
				}
			    }
			}
			after_html {
			    # Ignore: after_html is for "classic" screens
			}
			default {
			    lappend errors "GanttTreePanel.tcl: im_category_tree with unknown parameter=$token"
			}
		    }
		}
	    }
	    # Add additional TCL widgets here
	}
    }

    # Still undefined - Return an error
    if {"undefined" eq $editor} {
	lappend errors "<b>GanttTreePanel.tcl: Unknown widget</b><br> \
                               <ul> \
                               <li>attribute_name=$attribute_name \
                               <li>widget=$widget_name \
                               <li>tcl_widget=$tcl_widget \
                               <li>parameters=$parameters \
                               </ul><br> \
                               Tell your SysAdmin to remove attribute=$attribute_name"
    }

    multirow append dynfields $attribute_name $pretty_name $widget_name $editor
}


set error_tbar ""
if {"" ne $errors} {
    set error_tbar "tbar: \[\{ xtype: 'panel', html: '<font color=red>Errors:<br>[join $errors "<br>"]</font>' \}\],"

}

