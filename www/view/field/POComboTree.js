/*
 * POComboTree.js
 *
 * Copyright (c) 2011 - 2020 ]project-open[ Business Solutions, S.L.
 * This file may be used under the terms of the GNU General Public
 * License version 3.0 or alternatively unter the terms of the ]po[
 * FL or CL license as specified in www.project-open.com/en/license.
 */

/**
 * A ComboBox that takes a tree definition for the picker.
 * Here is a configuration example using the POComboTree
 * as an Editor:
 *
 * editor: {
 *     xtype: 'pocombotree',
 *     store: Ext.data.StoreManager.lookup('taskStatusStore'),
 *     queryMode: 'local',
 *     matchFieldWidth: false,                   // Allow the picker to be larger than the field width
 *     displayField: 'project_name',
 *     valueField: 'id'
 * }
 */
Ext.define('PO.view.field.POComboTree', {
    extend: 'Ext.form.field.Picker',
    requires: ['Ext.tree.Panel'],
    alias: 'widget.pocombotree',

    // copied from ComboBox 
    createPicker: function() {
        var me = this;
        var menuCls = Ext.baseCSSPrefix + 'menu';
        var opts = Ext.apply({
            floating: true,
            ownerCt: me.ownerCt,
            cls: me.el.up('.' + menuCls) ? menuCls : '',
            store: me.store,
	    columns: [
		{xtype: 'treecolumn', flex: 1, dataIndex: me.displayField}
	    ]
        }, me.columnConfig);

	// NOTE: we simply use a tree panel
        //picker = me.picker = Ext.create('Ext.view.BoundList', opts);
	var picker = me.picker = Ext.create('Ext.tree.Panel', opts);

	// hack: pass getNode() to the view
	picker.getNode = function() {
	    picker.getView().getNode(arguments);
	};

        return picker;
    }

});

