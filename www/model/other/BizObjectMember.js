Ext.define('PO.model.other.BizObjectMember', {
    extend: 'Ext.data.Model',
    config: {
	fields: [
		'id',
		'rel_id',
		'rel_type',
		'object_id_one',
		'object_id_two',
		'object_role_id',
		'object_role',
		'percentage',
		'skill_profile_rel_id'
	],
	proxy: {
		type:		'rest',
		url:		'/intranet-rest/im_biz_object_member',
		appendId:	true,			// 
		timeout:	300000,

		extraParams: {
			format:		'json',		// Tell the ]po[ REST to return JSON data.
			deref_p:	'0'
		},
		reader: {
			type:	'json',			// Tell the Proxy Reader to parse JSON
			root:	'data',			// Where do the data start in the JSON file?
			totalProperty:  'total'		// Total number of tickets for pagination
		},
		writer: {
			type:	'json'			// Allow Sencha to write ticket changes
		}
	    }
    }

});

