/* 
 * /sencha-core/www/model/helpdesk/Ticket.js
 *
 * Copyright (C) 2014 ]ticket-open[
 * All rights reserved. Please see
 * http://www.ticket-open.com/license/sencha/ for details.
 *
 * This is the default Sencha model for tickets with all
 * important fields available from the ]po[ data-model.
 * Notes:
 * <ul>
 * <li>The model already includes a number of "denormalized" fields
 *     (ticket_status, company_name, ...) that are filled ONLY
 *     if deref_p=1 during loading.
 * </ul>
 */

Ext.define('PO.model.helpdesk.Ticket', {
    extend: 'Ext.data.Model',
    fields: [
	'id',
	'ticket_id',				// The primary key or object_id of the ticket
	'project_name',				// The name of the ticket
	'project_nr',				// The short name of the ticket.
	'project_path',				// The short name of the ticket.
	'parent_id',				// The parent of the ticket or NULL for a main ticket
	'company_id',				// Company for whom the ticket has been created
	'ticket_status_id',			// 76=open, 81=closed, ...
	'ticket_type_id',			// 100=Task, 101=Ticket, 2501=Gantt Ticket, ...
	'description',		
	'note',
	
	'percent_completed',			// 0 - 100: Defines what has already been done.
	'on_track_status_id',			// 66=green, 67=yellow, 68=red
	'release_item_p',			// Use this ticket as something to be released?
	'sort_order',				// Used for portfolio views

	'creation_user',			// User_id of the guy creating the ticket
	'creation_date',			// 

	'ticket_alarm_action',			// 
	'ticket_alarm_date',			// 
	'ticket_assignee_id',			// 
	'ticket_component_id',			// 
	'ticket_conf_item_id',			// 
	'ticket_confirmation_date',		// 
	'ticket_creation_date',			// 
	'ticket_customer_contact_id',		// 
	'ticket_customer_deadline',		// 
	'ticket_dept_id',			// 
	'ticket_description',			// 
	'ticket_done_date',			// 
	'ticket_email_id',			// 
	'ticket_in_reply_to_email_id',		// 
	'ticket_note',				// 
	'ticket_po_package_id',			// 
	'ticket_po_version',			// 
	'ticket_prio_id',			// 
	'ticket_queue_id',			// 
	'ticket_quote_comment',			// 
	'ticket_quoted_days',			// 
	'ticket_quoted_days_comment',		// 
	'ticket_reaction_date',			// 
	'ticket_resolution_time',		// 
	'ticket_resolution_time_dirty',		// 
	'ticket_resolution_time_per_queue',	// 
	'ticket_service_id',			// 
	'ticket_signoff_date',			// 
	'ticket_sla_id',			// 
	'ticket_status_id',			// 
	'ticket_telephony_new_number',		// 
	'ticket_telephony_old_number',		// 
	'ticket_telephony_request_type_id',	// 
	'ticket_thumbs_up_count',		// 
	'ticket_type_id',			// 
	'ticket_url',				// 

        // Add dynfields
<multiple name=dynfields>
        '@dynfields.name@',</multiple>

	// Important dereferenced field
	'ticket_status_id_deref',		// 76=open, 81=closed, ...
	'ticket_type_id_deref'			// 100=Task, 101=Ticket, 2501=Gantt Ticket, ...
    ],

    proxy: {
	type:			'rest',				// Use the standard ]po[ REST interface for loading/saving
	url:			'/intranet-rest/im_ticket',	// Standard URL for tickets
	appendId:		true,				// Append the object_id: ../im_ticket/<object_id>
	timeout:		300000,
	
	extraParams: {
	    format:		'json',				// Tell the ]po[ REST to return JSON data.
	    deref_p:		'1'				// By default also load denormalized fields 
	    							// (may be different when loaded from stores)
	},
	reader: {
	    type:		'json',				// Tell the Proxy Reader to parse JSON
	    root:		'data',				// Where do the data start in the JSON file?
	    totalProperty:	'total'				// Total number of tickets for pagination
	},
	writer: {
	    type:		'json'				// Allow Sencha to write ticket changes
	}
    }
});
