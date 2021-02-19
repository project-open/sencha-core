/**
 * sencha-core/www/store/CategoryStore.js
 * Subclass for Categories
 *
 * Copyright (C) 2013, ]project-open[
 * All rights reserved. Please see
 * https://www.project-open.com/license/ for details.
 *
 * @author Frank Bergmann (frank.bergmann@project-open.com)
 * @creation-date 2013-11-29
 * @cvs-id $Id$
 */

/*
 * Create a specific store for categories.
 * The subclass contains a special lookup function.
 */
Ext.define('PO.store.CategoryStore', {
    extend:         'Ext.data.Store',
    model: 	    'PO.model.category.Category',
    storeId:	    'categoryStore',
    pageSize:       100000,				// Get all available categories
    proxy: {
        type:       'rest',
        url:        '/intranet-rest/im_category',
        appendId:   true,
        extraParams: {
            format: 'json',
            include_disabled_p: '1', // Make sure to include "Open" and "Closed" even if disabled
	    // don't specify category_type here, we want to get all categories
        },
        reader: { type: 'json', root: 'data' }
    },

    /**
     * Standard lookup function
     */
    category_from_id: function(category_id) {
        if (null == category_id || '' == category_id) { return ''; }
        var result = 'Category #' + category_id;
        var rec = this.findRecord('category_id',category_id);
        if (rec == null || typeof rec == "undefined") { return result; }
        return rec.get('category_translated'); 
    },
    cat: function(category_id) { return this.category_from_id(category_id); },
    fill_tree_category_translated: function(store) {	// Concat the tree category names. It is useful to order by name and level
        store.each(function(record){
            var tree_sortkey = record.get('tree_sortkey');
            var lon = record.get('tree_sortkey').length;
            var tree_category = '';
            while (lon > 0) {
                lon = lon - 8;
                tree_category = store.findRecord('category_id','' + parseInt(tree_sortkey.substr(lon,8),10)).get('category_translated') +  tree_category;
            }                                                
            record.set('tree_category_translated', tree_category);                                        
        });
    },
    validateLevel: function(value,nullvalid) {		//Validate the combo value. No level with sublevel is permitted. 
        if (nullvalid && Ext.isEmpty(value)) {
            return true;
        }
        if (!nullvalid && Ext.isEmpty(value)) {
            return 'Obligatorio';
        }

        try {
            var validate = true;
            var record = this.getById(value);
            var record_field_value = record.get('tree_sortkey');
            var record_field_length = record_field_value.length;                
            this.clearFilter()
            this.each(function(record) {
                var store_field_value = record.get('tree_sortkey');
                var store_field_length = store_field_value.length;
                if (store_field_length > record_field_length && store_field_value.substring(0,record_field_length) == record_field_value) {
                    validate = 'No permitido';
                    return validate;
                }
            });
            return validate;        
        } catch(err) {        
            return 'Obligatorio'; 
        }
    },
    addBlank:  function() {				// Add blank value to the store. It is used to white selecction in comboboxes
        var categoryVars = {category_id: '', category_translated: null, sort_order: '0'};
        var category = Ext.ModelManager.create(categoryVars, 'TicketBrowser.Category');
        this.add(category);        
    },
    getParent: function(value) {			// Get category parent ID
        if (!Ext.isEmpty(value)) {
            var record = this.getById(value);
            if (!Ext.isEmpty(record)) {
                var record_field_value = record.get('tree_sortkey');
                var record_field_length = record_field_value.length;        
                this.clearFilter();
                var parent_id = this.findRecord('tree_sortkey','' + parseInt(record_field_value.substr(0,record_field_length - 8),10)).get('category_id');
                return parent_id;
            }
        }
        return '';
    }
});

