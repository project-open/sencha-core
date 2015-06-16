/*
 * POComboGrid.js
 *
 * Copyright (c) 2011 - 2014 ]project-open[ Business Solutions, S.L.
 * This file may be used under the terms of the GNU General Public
 * License version 3.0 or alternatively unter the terms of the ]po[
 * FL or CL license as specified in www.project-open.com/en/license.
 */

/**
 * A ComboBox that takes a grid definition for the picker.
 * Here is a configuration example using the POComboGrid
 * as an Editor:
 *
 * editor: {
 *     xtype: 'pocombogrid',
 *     store: Ext.data.StoreManager.lookup('taskStatusStore'),
 *     queryMode: 'local',
 *     matchFieldWidth: false,                   // Allow the picker to be larger than the field width
 *     displayField: 'category',
 *     valueField: 'category_id',
 *     listConfig: {
 *         columns: [
 *             {header: 'ID', dataIndex: 'category_id'},
 *             {header: 'Category', dataIndex: 'category'}
 *                     ]
 *     }
 * }
 */
Ext.define('PO.view.field.POComboGrid', {
    extend: 'Ext.form.field.ComboBox',
    requires: ['Ext.grid.Panel'],
    alias: 'widget.pocombogrid',

    // copied from ComboBox 
    createPicker: function() {
        var me = this,
        picker,
        menuCls = Ext.baseCSSPrefix + 'menu',
        opts = Ext.apply({
            selModel: {
                mode: me.multiSelect ? 'SIMPLE' : 'SINGLE'
            },
            floating: true,
            ownerCt: me.ownerCt,
            cls: me.el.up('.' + menuCls) ? menuCls : '',
            store: me.store,
            displayField: me.displayField,
            focusOnToFront: false,
            pageSize: me.pageSize
        }, me.listConfig, me.defaultListConfig);

	// NOTE: we simply use a grid panel
        //picker = me.picker = Ext.create('Ext.view.BoundList', opts);
	picker = me.picker = Ext.create('Ext.grid.Panel', opts);

	// hack: pass getNode() to the view
	picker.getNode = function() {
	    picker.getView().getNode(arguments);
	};

        me.mon(picker, {
            itemclick: me.onItemClick,
            refresh: me.onListRefresh,
            scope: me
        });

        me.mon(picker.getSelectionModel(), {
            selectionChange: me.onListSelectionChange,
            scope: me
        });

        return picker;
    }

});

