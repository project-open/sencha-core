Ext.define('PO.model.user.SenchaPreference', {
    extend: 'Ext.data.Model',
    fields: [
	'id',
	'preference_id',    
	'preference_status_id',
	'preference_type_id',
	'preference_object_id',
	'preference_key',
	'preference_value'
    ],
    proxy: {
	type:		'rest',
	url:		'/intranet-rest/im_sencha_preference',
	appendId:	true,			// Append the object_id: ../im_ticket/<object_id>
	timeout:	300000,
	
	extraParams: {
	    format:		'json',		// Tell the ]po[ REST to return JSON data.
	    deref_p:	'1',
	    columns:	'preference_object_id,preference_key,preference_value'
	},
	reader: {
	    type:		'json',		// Tell the Proxy Reader to parse JSON
	    root:		'data',		// Where do the data start in the JSON file?
	    totalProperty:  'total'		// Total number of tickets for pagination
	},
	writer: {
	    type:		'json'		// Allow Sencha to write ticket changes
	}
    }
});

