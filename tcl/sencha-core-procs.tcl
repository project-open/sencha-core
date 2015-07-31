# /packages/sencha-core/tcl/sencha-core-procs.tcl
#
# Copyright (C) 2003-2015 ]project-open[
#
# All rights reserved. Please check
# http://www.project-open.com/license/ for details.

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

    if {$user_id == $preference_object_id || $admin_p} {
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
