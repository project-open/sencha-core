Ext.define('PO.model.timesheet.CostCenter', {
    extend: 'Ext.data.Model',
    fields: [
	'id',						// Same as cost_center_id
	'cost_center_id',					// Unique ID taken from im_cost_centers_seq
	'cost_center_name',
	'cost_center_label',
	'cost_center_code',
	'cost_center_status_id',
	'cost_center_type_id',
	'department_p',
	'parent_id',
	'manager_id',
	'tree_sortkey',
	'max_child_sortkey',
	'description',
	'note'
    ],
    proxy: {
	type:			'rest',
	url:			'/intranet-rest/im_cost_center',
	appendId:		true,			// Append the object_id: ../im_cost_center/<object_id>
	timeout:		300000,
	
	extraParams: {
	    format:		'json'			// Tell the ]po[ REST to return JSON data.
	},
	reader: {
	    type:		'json',			// Tell the Proxy Reader to parse JSON
	    root:		'data',			// Where do the data start in the JSON file?
	    totalProperty:  	'total'			// Total number of tickets for pagination
	},
	writer: {
	    type:		'json'			// Allow Sencha to write ticket changes
	}
    }
});

