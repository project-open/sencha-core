/*
 * Categories are used everywhere in the system
 * to represent states and types of objects and
 * any finite list of options.
 *
 * Categories are used as stores for form fields,
 * so we need "text" and "value" fields for those.
 *
 * Categories are hierarchical.
 * Categories are read-only.
 */
Ext.define('PO.model.category.Category', {
    extend: 'Ext.data.Model',
    idProperty: 'category_id',          // The primary key of the category
    valueProperty: 'category_translated',
    fields: [
	    'id',					// same as category_id
	    'category_id',				// primary key - constant
	    'category',					// Name of the category
	    'category_type',                            // type of category
	    'category_translated',			// Name of the category in the user locale
	    'category_description',			// Lengthy description in English
	    'enabled_p',				// 't' = enabled, 'f' = disabled
	    'sort_order',				// Order to show on screen
	    'aux_int1',					// 
	    'aux_int2',					// 
	    'aux_string1',				// 
	    'aux_string2'
    ]
    // Categories don't need a separate proxy 
    // because they are alway used as part of a store.
});



/*
	    {type: 'string', name: 'indent_class',      // Determine the indentation level for each element in the tree
                convert: function(value, record) {
                    var category = record.get('category_translated');
                    var indent = (record.get('tree_sortkey').length / 8) - 1;
                    return 'extjs-indent-level-' + indent;
                }
            }



            {   name: 'text',				// 'text' is used by Select field as pretty name
                convert: function(value, record) { return record.get('category'); }
            },
            {   name: 'value',				// 'value' is used by Select field as value
                convert: function(value, record) { return record.get('category_id'); }
            }
*/

