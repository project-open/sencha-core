# Get DynFields for Tickets

set names [im_sencha_dynfields -object_type "im_ticket" -exclude_fields {
	"company_id"				
	"creation_date"			
	"creation_user"			
	"description"		
	"note"
	"on_track_status_id"			
	"parent_id"				
	"percent_completed"			
	"project_name"				
	"project_nr"				
	"project_path"				
	"release_item_p"			
	"sort_order"				
	"ticket_alarm_action"			
	"ticket_alarm_date"			
	"ticket_assignee_id"			
	"ticket_component_id"			
	"ticket_conf_item_id"			
	"ticket_confirmation_date"		
	"ticket_creation_date"			
	"ticket_customer_contact_id"		
	"ticket_customer_deadline"		
	"ticket_dept_id"			
	"ticket_description"			
	"ticket_done_date"			
	"ticket_email_id"			
	"ticket_id"				
	"ticket_in_reply_to_email_id"		
	"ticket_note"				
	"ticket_po_package_id"			
	"ticket_po_version"			
	"ticket_prio_id"			
	"ticket_queue_id"			
	"ticket_quote_comment"			
	"ticket_quoted_days"			
	"ticket_quoted_days_comment"		
	"ticket_reaction_date"			
	"ticket_resolution_time"		
	"ticket_resolution_time_dirty"		
	"ticket_resolution_time_per_queue"	
	"ticket_service_id"			
	"ticket_signoff_date"			
	"ticket_sla_id"			
	"ticket_status_id"			
	"ticket_telephony_new_number"		
	"ticket_telephony_old_number"		
	"ticket_telephony_request_type_id"	
	"ticket_thumbs_up_count"		
	"ticket_type_id"			
	"ticket_url"				
    	"id"
}]
multirow create dynfields name pretty_name widget
foreach tuple $names {
    multirow append dynfields [lindex $tuple 0] [lindex $tuple 1] [lindex $tuple 2]
}


set score_sql "
	select	lower(column_name) as column_name
	from	user_tab_columns
	where	table_name = 'IM_PROJECTS' and
		lower(column_name) like 'score_%';      
"
db_foreach score $score_sql {
    multirow append dynfields $column_name
}
