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


# ----------------------------------------------------------------------
# Nuke a preference
# ---------------------------------------------------------------------

ad_proc -public im_sencha_preference_nuke {
    {-current_user_id 0}
    preference_id
} {
    Nuke a preference object
} {
    db_string im_sencha_preference_nuke "SELECT im_sencha_preference__delete(:preference_id) from dual"
}
