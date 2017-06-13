# Get DynFields for Timesheet Task

set names [im_sencha_dynfields -object_type "im_timesheet_task"]
multirow create dynfields name pretty_name widget
foreach tuple $names {
    multirow append dynfields [lindex $tuple 0] [lindex $tuple 1] [lindex $tuple 2]
}
