# Get DynFields for Timesheet Task

set tuples [im_sencha_dynfields -object_type "im_timesheet_task"]
multirow create dynfields name pretty_name widget editor
foreach tuple $tuples {
    set widget [lindex $tuple 2]
    switch $widget {
	checkbox  { set editor "" }
	date - timestamp { set editor ", editor: 'podatefield'" }
	integer  { set editor ", editor: 'numberfield'" }
	numeric  { set editor ", editor: 'numberfield'" }
	richtext  { set editor ", editor: true" }
	textarea_small - textarea_small_nospell - textbox_large - textbox_medium - textbox_small { set editor ", editor: true" }
	default { 
	    ad_return_complaint 1 $widget
	    set editor "" 
	}
    }

    multirow append dynfields [lindex $tuple 0] [lindex $tuple 1] [lindex $tuple 2] $editor
}
