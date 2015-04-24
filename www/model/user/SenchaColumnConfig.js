/*
 * User Column Configs for grid.Panels.
 * Stores preferences of users related order and enable/disable of columns
 */
Ext.define('PO.model.user.SenchaColumnConfig', {
    extend: 'Ext.data.Model',
    fields: [
	'id',
	'column_config_id',
	'column_config_status_id',
	'column_config_type_id',
	'column_config_object_id',
	'column_config_url',
	'column_config_name',
	'column_config_sort_order',
	'column_config_hidden',
	'column_config_width'
    ],
    proxy: {
	type:			'rest',
	url:			'/intranet-rest/im_sencha_column_config',
	appendId:		true,			// Append the object_id: ../im_ticket/<object_id>
	timeout:		300000,
	
	extraParams: {
	    format:		'json',			// Tell the ]po[ REST to return JSON data.
	    deref_p:		'1'
	},
	reader: {
	    type:		'json',			// Tell the Proxy Reader to parse JSON
	    root:		'data',			// Where do the data start in the JSON file?
	    totalProperty:	'total'			// Total number of tickets for pagination
	},
	writer: {
	    type:		'json'			// Allow Sencha to write ticket changes
	}
    }
});

