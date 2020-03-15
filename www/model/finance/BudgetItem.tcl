# Get DynFields for Budget Item

# These fields are already included in the hard-coded part of the page
set exclude_fields {
	budget_item_alarm_value
	budget_item_id
	budget_item_max_value
	budget_item_name
	budget_item_nr
	budget_item_owner_id
	budget_item_parent_id
	budget_item_project_id
	budget_item_status_id
	budget_item_type_id
	sort_order
	description
	note

	tree_sortkey
	max_child_sortkey

	object_type
	creation_date
	creation_ip
	creation_user
	modifying_ip
	modifying_user
	last_modified
}
set names [im_sencha_dynfields -object_type "im_budget_item" -exclude_fields $exclude_fields]
multirow create dynfields name pretty_name widget
foreach tuple $names {
    multirow append dynfields [lindex $tuple 0] [lindex $tuple 1] [lindex $tuple 2]
}
