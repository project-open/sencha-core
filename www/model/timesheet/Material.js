Ext.define('PO.model.timesheet.Material', {
    extend: 'Ext.data.Model',
    fields: [
	'id',						// Same as material_id
	'material_id',					// Unique ID taken from im_materials_seq
	'material_name',
	'material_nr',
	'material_status_id',
	'material_type_id',
	'material_uom_id',
	'material_billable_t',
	'description'
    ],
    proxy: {
	type:			'rest',
	url:			'/intranet-rest/im_material',
	appendId:		true,			// Append the object_id: ../im_ticket/<object_id>
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

