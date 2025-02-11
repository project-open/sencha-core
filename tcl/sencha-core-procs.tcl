# /packages/sencha-core/tcl/sencha-core-procs.tcl
#
# Copyright (C) 2003-2015 ]project-open[
#
# All rights reserved. Please check
# https://www.project-open.com/license/ for details.

ad_library {
    @author frank.bergmann@project-open.com
}


# ----------------------------------------------------------------------
# Constants
# ----------------------------------------------------------------------

ad_proc -public im_sencha_preference_status_active {} { return 86000 }
ad_proc -public im_sencha_preference_status_deleted {} { return 86002 }
ad_proc -public im_sencha_preference_type_default {} { return 86100 }

ad_proc -public im_sencha_column_config_status_active {} { return 86200 }
ad_proc -public im_sencha_column_config_status_deleted {} { return 86202 }
ad_proc -public im_sencha_column_config_type_default {} { return 86300 }


# ----------------------------------------------------------------------
# Permissions
# ---------------------------------------------------------------------

ad_proc -public im_sencha_preference_permissions {user_id preference_id view_var read_var write_var admin_var} {
    Fill the "by-reference" variables read, write and admin
    with the permissions of $user_id on $preference_id.
} {
    upvar $view_var view
    upvar $read_var read
    upvar $write_var write
    upvar $admin_var admin

    set view 0
    set read 0
    set write 0
    set admin 0

    set breach_p [im_security_alert_check_integer -location "im_sencha_preference_permissions: preference_id" -value $preference_id]
    if {$breach_p} { return }

    # -----------------------------------------------------
    # Get preference information
    #
    set admin_p [im_is_user_site_wide_or_intranet_admin $user_id]
    set preference_object_id [util_memoize [list db_string pref_oid "select preference_object_id from im_sencha_preferences where preference_id = $preference_id" -default 0]]

    # Fraber 2019-10-21: Granting all permissions on a non-existing preference.
    # This should be harmless, but may eliminate strange error messages
    if {0 == $preference_object_id || $user_id == $preference_object_id || $admin_p} {
	set view 1
	set read 1
	set write 1
	set admin 1
    }
}


# ----------------------------------------------------------------------
# Nuke
# ---------------------------------------------------------------------

ad_proc -public im_sencha_preference_nuke {
    {-current_user_id 0}
    preference_id
} {
    Nuke a preference object
} {
    db_string im_sencha_preference_nuke "SELECT im_sencha_preference__delete(:preference_id) from dual"
}


ad_proc -public im_sencha_column_config_nuke {
    {-current_user_id 0}
    column_config_id
} {
    Nuke a column_config object
} {
    db_string im_sencha_column_config_nuke "SELECT im_sencha_column_config__delete(:column_config_id) from dual"
}



# ----------------------------------------------------------------------
# 
# ---------------------------------------------------------------------

ad_proc -public im_sencha_sql_to_store {
    {-include_empty_p 0}
    {-data_source_p 0}
    -sql:required
} {
    Takes a SQL and returns the JSON code for an inline store
    plus the list of column names.
    This code comes in handy for small Sencha indicators etc.
    Empty values from the DB are stored in the JSON as "NULL",
    because this function doesn't know how to interpret them
    depending on the data type (empty string, null date or null
    integer).
} {
    # Execute the sql and create inline store code.
    set json_list [list]
    db_with_handle db {
	# Execute SQL and get the list of rows returned
	set selection [db_exec select $db query $sql 1]
	set col_names [ad_ns_set_keys $selection]

	# Set the value for all variables to the empty string
	if {$include_empty_p} {
	    set json_entry [list]
	    foreach col $col_names { lappend json_entry "$col: ''" }
	    lappend json_list [join $json_entry ", "]
	}

	# Loop through the list of rows returned
	while {[db_getrow $db $selection]} {
	    set json_entry {}
	    for {set i 0 } { $i < [ns_set size $selection] } { incr i } {
		set var [lindex $col_names $i]
		set val [ns_set value $selection $i]
		if {"" eq $val} {
		    lappend json_entry "'$var': null"
		} elseif {[string is double $val]} {
		    lappend json_entry "'$var': $val"
		} else {
		    set val_quoted [im_quotejson $val]
		    lappend json_entry "\"$var\": \"$val_quoted\""
		}
	    }
	    lappend json_list [join $json_entry ", "]
	}
    }
    db_release_unused_handles
    set cols_json "'[join $col_names "', '"]'"
    set data_json [join $json_list "\},\n\t\t\{"]

    set store_json "Ext.create('Ext.data.Store', {
	fields: \[$cols_json\],
        data: \[
		\{$data_json\}
	]
	})
    "

    if {$data_source_p} {
	# Return the JSON structure suitable as a data-source
	return "{\"success\": true, \"message\": \"Data loaded\", \"data\": \[\n\t\t{$data_json } \]}"

    } else {
	# Return two values: 1. the store JSON, 2. the list of columns used
	return [list $store_json $col_names]
    }
}




# ----------------------------------------------------------------------
# 
# ---------------------------------------------------------------------


ad_proc -public im_sencha_category_type_to_store {
    {-include_empty_p 0}
    {-package_key "intranet-core" }
    {-locale "" }
    -category_type:required
} {
    Takes a category type and returns the JSON code for an inline 
    store plus the list of column names.
    This code comes in handy for small Sencha indicators etc.
} {
    # Execute the sql and create inline store code.
    set col_names [list "category_id" "category"]
    set json_list [list]

    # Set the value for all variables to the empty string
    if {$include_empty_p} {
	set json_entry [list]
	lappend json_list "category_id: '', category: ''"
    }

    db_foreach cat "
	select	category_id,
		category
	from	im_categories
	where	category_type = :category_type and
		(enabled_p is null or enabled_p = 't')
	order by
		coalesce(sort_order, category_id)
    " {
	set category_key "$package_key.[lang::util::suggest_key $category]"
	set category_l10n [lang::message::lookup $locale $category_key $category]
	lappend json_list "category_id: '$category_id', category: '$category_l10n'"
    }

    set cols_json "'[join $col_names "', '"]'"
    set data_json [join $json_list "\},\n\t\t\{"]

    set store_json "Ext.create('Ext.data.Store', {
	fields: \[$cols_json\],
        data: \[
		\{$data_json\}
	]
	})
    "

    # Return two values: 1. the store JSON, 2. the list of columns used
    return [list $store_json $col_names]
}




# ----------------------------------------------------------------------
# List of add-on dynfields
# ---------------------------------------------------------------------

ad_proc -public im_sencha_dynfields {
    -object_type:required
    {-exclude_fields {} }
} {
    Returns a cached list of DynFields for each object type
} {
    lappend exclude_fields "ttt"
    set dynfield_sql "
    	select	aa.attribute_name,
		aa.pretty_name,
		dw.widget_name
	from	acs_attributes aa,
		im_dynfield_attributes da,
		im_dynfield_widgets dw
	where	aa.attribute_id = da.acs_attribute_id and
		da.widget_name = dw.widget_name and
		aa.object_type = '$object_type' and
		aa.attribute_name not in ('[join $exclude_fields "', '"]') and
		aa.attribute_name not in (
			'billable_units',
			'company_id',
			'cost_center_id',
			'creation_date',
			'creation_ip',
			'creation_user',
			'deadline_date',
			'description',
			'effort_driven_p',
			'effort_driven_type_id',
			'end_date',
			'expanded',
			'gantt_project_id',
			'icon',
			'invoice_id',
			'last_modified',
			'level',
			'lock_date',
			'lock_ip',
			'lock_user',
			'material_id',
			'milestone_p',
			'modifying_ip',
			'modifying_user',
			'note',
			'object_type',
			'on_track_status_id',
			'parent_id',
			'percent_completed',
			'planned_units',
			'predecessors',
			'priority',
			'project_lead_id',
			'project_name',
			'project_nr',
			'project_wbs',
			'project_status_id',
			'project_type_id',
			'scheduling_constraint_date',
			'scheduling_constraint_id',
			'sort_order',
			'start_date',
			'successors',
			'task_id',
			'tree_sortkey',
			'uom_id'
		)
    "

    set tuples [util_memoize [list db_list_of_lists dynfield $dynfield_sql] 1]
    return $tuples
}




ad_proc im_gantt_editor_generic_sql_editor {
    sql
} {
    Creates an ExtJS editor plus renderer for a DynField 
    defined using a generic_sql TCL widget.
} {
    set store_tuple [im_sencha_sql_to_store -include_empty_p 1 -sql $sql]
    set json_store [lindex $store_tuple 0]
    set col_names [lindex $store_tuple 1]
    set editor "{
             xtype: 'combobox',
             forceSelection: true,
             allowBlank: true,
             editable: false,
             store: $json_store,
             valueField: '[lindex $col_names 0]',
             displayField: '[lindex $col_names 1]'
    }"

    set renderer "function(value, metaData, record, rowIndex, colIndex, nodeStore, treeView) {
    	if ('' == value || !value) return value;
        var col = metaData.column; if (!col) return value;
        var ed = col.getEditor(); if (!ed) return value;
        var store = ed.store; if (!store) return value;
	var pos = store.find('[lindex $col_names 0]', value);
	var model = store.getAt(pos); if (!model) return value;
	var result = model.get('[lindex $col_names 1]'); if (!result) return value;
	return result;
    }"

    return ",\n\teditor: $editor,\n\trenderer: $renderer"
}



ad_proc im_gantt_editor_im_category_tree_editor {
    category_type
} {
    Creates an ExtJS editor plus renderer for a DynField 
    defined using a im_category_tree TCL widget.
} {
    set store_tuple [im_sencha_category_type_to_store -include_empty_p 1 -category_type $category_type]
    set json_store [lindex $store_tuple 0]
    set col_names [lindex $store_tuple 1]
    set editor "{
             xtype: 'combobox',
             forceSelection: true,
             allowBlank: true,
             editable: false,
             store: $json_store,
             valueField: '[lindex $col_names 0]',
             displayField: '[lindex $col_names 1]'
    }"

    set renderer "function(value, metaData, record, rowIndex, colIndex, nodeStore, treeView) {
    	if ('' == value || !value) return value;
        var col = metaData.column; if (!col) return value;
        var ed = col.getEditor(); if (!ed) return value;
        var store = ed.store; if (!store) return value;
	var pos = store.find('[lindex $col_names 0]', value);
	var model = store.getAt(pos); if (!model) return value;
	var result = model.get('[lindex $col_names 1]'); if (!result) return value;
	return result;
    }"

    return ",\n\teditor: $editor,\n\trenderer: $renderer"
}
