Ext.define('PO.model.timesheet.HourInterval', {
    extend: 'Ext.data.Model',
	fields: [
	    'id',					// Same as interval_id
	    'interval_id',				// Unique ID taken from im_hours_seq
	    'user_id',					// Who logged the hours?
	    'project_id',				// On which project or task?
	    'interval_start',				// Start of time interval (PostgreSQL timestamp format)
	    'interval_end',				// End od time interval (PostgreSQL timestamp format)
	    'note',					// Comment for the logged hours
	    'internal_note',				// Comment hidden from customers (rarely used)
	    'activity_type_id',				// Type of activity (meeting, work, ... (customer definable))
	    'material_id'				// Type of service provided during hours (rarely used)
	],
	proxy: {
	    type:		'rest',
	    url:		'/intranet-rest/im_hour_interval',
	    appendId:		true,			// Append the object_id: ../im_ticket/<object_id>
	    timeout:		300000,
	    extraParams: { format: 'json' },		// Tell the ]po[ REST to return JSON data.
	    reader: { type: 'json', root: 'data' },	// Tell the Proxy Reader to parse JSON
	    writer: { type: 'json' }			// Allow Sencha to write ticket changes
	}
});

