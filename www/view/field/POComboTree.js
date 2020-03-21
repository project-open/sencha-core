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

    matchFieldWidth: false,
    editable: false,

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
	    ],
	    listeners: {
                scope: me,
                itemclick: me.onItemClick
            },
            viewConfig: {
                listeners: {
                    scope: me,
                    render: me.onViewRender
                }
            }
        }, me.columnConfig);

	// NOTE: we simply use a tree panel
        //picker = me.picker = Ext.create('Ext.view.BoundList', opts);
	var picker = me.picker = Ext.create('Ext.tree.Panel', opts);

	// hack: pass getNode() to the view
	picker.getNode = function() {
	    picker.getView().getNode(arguments);
	};

        return picker;
    },

    initComponent: function() {
        var me = this;
        me.callParent(arguments);

        me.addEvents(
            /**
             * @event select
             * Fires when a tree node is selected
             * @param {Ext.ux.TreePicker} picker        This tree picker
             * @param {Ext.data.Model} record           The selected record
             */
            'select'
        );

        me.mon(me.store, {
            scope: me,
            load: me.onLoad,
            update: me.onUpdate
        });
    },

    onViewRender: function(view){
        view.getEl().on('keypress', this.onPickerKeypress, this);
    },

    /**
     * repaints the tree view
     */
    repaintPickerView: function() {
        var style = this.picker.getView().getEl().dom.style;
        // can't use Element.repaint because it contains a setTimeout, which results in a flicker effect
        style.display = style.display;
    },

    onItemClick: function(view, record, node, rowIndex, e) {
        this.selectItem(record);
    },

    onPickerKeypress: function(e, el) {
        var key = e.getKey();

        if(key === e.ENTER || (key === e.TAB && this.selectOnTab)) {
            this.selectItem(this.picker.getSelectionModel().getSelection()[0]);
        }
    },

    selectItem: function(record) {
        var me = this;
        me.setValue(record.getId());
        me.picker.hide();
        me.inputEl.focus();
        me.fireEvent('select', me, record)
    },

   onExpand: function() {
        var me = this,
            picker = me.picker,
            store = picker.store,
            value = me.value,
            node;

        
        if (value) {
            node = store.getNodeById(value);
        }
        
        if (!node) {
            node = store.getRootNode();
        }
        
        picker.selectPath(node.getPath());

        Ext.defer(function() {
            picker.getView().focus();
        }, 1);
    },


   setValue: function(value) {
        var me = this,
            record;

        me.value = value;

        if (me.store.loading) {
            // Called while the Store is loading. Ensure it is processed by the onLoad method.
            return me;
        }
            
        // try to find a record in the store that matches the value
        record = value ? me.store.getNodeById(value) : me.store.getRootNode();
        if (value === undefined) {
            record = me.store.getRootNode();
            me.value = record.getId();
        } else {
            record = me.store.getNodeById(value);
        }

        // set the raw value to the record's display field if a record was found
        me.setRawValue(record ? record.get(me.displayField) : '');

        return me;
    },

    getSubmitValue: function() { return this.value; },
    getValue: function() { return this.value; },
    onLoad: function() {
        var value = this.value;
        if (value) { this.setValue(value); }
    },

    onUpdate: function(store, rec, type, modifiedFieldNames){
        var display = this.displayField;
        
        if (type === 'edit' && modifiedFieldNames && Ext.Array.contains(modifiedFieldNames, display) && this.value === rec.getId()) {
            this.setRawValue(rec.get(display));
        }
    }

});

