/*
 * GanttTaskPropertyPanel.js
 *
 * Copyright (c) 2011 - 2014 ]project-open[ Business Solutions, S.L.
 * This file may be used under the terms of the GNU General Public
 * License version 3.0 or alternatively unter the terms of the ]po[
 * FL or CL license as specified in www.project-open.com/en/license.
 */

/**
 * Free floating singleton TabPanel with several elements 
 * allowing to edit the details of a single task.
 */
Ext.define('PO.view.gantt.GanttTaskPropertyPanel', {
    extend:                             'Ext.Window',
    id:                                 'ganttTaskPropertyPanel',
    alias:                              'ganttTaskPropertyPanel',

    title: 'Task Properties',
    id: 'ganttTaskPropertyPanel',
    width: 500,
    height: 400,

    closable: true,
    resizable: true,
    modal: false,
    layout: 'fit',

    initComponent: function() {
	console.log('PO.view.gantt.GanttTaskPropertyPanel.initialize: Starting');
	var me = this;
	this.callParent(arguments);

	// New store for keeping assignment data
	var assignmentStore = Ext.create('Ext.data.Store', {
	    id: 'taskAssignmentStore',
	    fields: ['id', 'percent', 'name', 'email', 'initials'],
	    data: []                                   // Data will come from setValue()
	});

	var taskPropertyAssignments = Ext.create('Ext.grid.Panel', {
            title: 'Assignments',
	    id: 'taskPropertyAssignments',
            store: assignmentStore,
            width: 200,
            columns: [
		{ text: 'In.', width: 30, dataIndex: 'initials', hidden: true},
		{ text: 'Name', dataIndex: 'name', flex: 1, editor: {
		    xtype: 'combobox',
		    store: Ext.StoreManager.get('userStore'),
		    displayField: 'first_names',
		    valueField: 'user_id'
		}},
		{ text: 'Email', dataIndex: 'email', editor: 'textfield', hidden: true },
		{ text: '%', width: 50, dataIndex: 'percent', editor: 'textfield' }
            ],
            dockedItems: [{
		xtype: 'toolbar',
		dock: 'top',
		items: [
		    {icon: '/intranet/images/navbar_default/add.png', tooltip: 'Add a user', id: 'assigButtonAdd'}, 
		    {icon: '/intranet/images/navbar_default/delete.png', tooltip: 'Delete a user', id: 'assigButtonDelete'}, 
		    '->',
		    {icon: '/intranet/images/navbar_default/help.png', tooltip: 'Help', id: 'assigButtonHelp'},
		    {icon: '/intranet/images/navbar_default/accept.png', tooltip: 'Save', id: 'assigButtonAccept'}, 
		    {icon: '/intranet/images/navbar_default/cross.png', tooltip: 'Cancel', id: 'assigButtonCancel'}
		]
            }],
            plugins: [Ext.create('MyCellEditing', {    // Hack the issue that this is a floating panel without Window around
		clicksToEdit: 1
            })],

	    // Set the value of the picker.
	    // Called by onExpand() below.
            setValue: function(value) {
		console.log('POTaskAssignment.picker.setValue='+value);
		var store = this.store;
		store.removeAll();
		value.forEach(function(v) {
		    store.add(v);
		});
            }
	});

	var taskPropertyAssignmentsController = Ext.create('Ext.app.Controller', {
            init: function() {
		var me = this;
		this.control({
		    //                '#assigButtonAdd': { click: me.onAssigButtonAdd }
		});
		return this;
            },
	    onAssigButtonAdd: function(button, event) {
		console.log('POTaskAssignment.pickerController.onAssigButtonAdd');
		assignmentStore.add({});
	    }
	}).init();

	var taskPropertyFormNotes = Ext.create('Ext.form.Panel', {
	    title: 'Notes',
	    id: 'taskPropertyFormNotes',
	    layout: 'fit',
	    items: [{
		xtype: 'htmleditor',
		enableColors: false,
		enableAlignments: true,
		name: 'description'
	    }]
	});
	
	var taskPropertyFormGeneral = Ext.create('Ext.form.Panel', {
	    title: 'General',
	    id: 'taskPropertyFormGeneral',
	    layout: 'anchor',
	    fieldDefaults: {
		labelAlign: 'right',
		labelWidth: 90,
		msgTarget: 'qtip',
		margins: '5 5 5 5',
	    },
            items: [{
		xtype: 'fieldset',
		title: 'General Information',
		defaultType: 'textfield',
		layout: 'anchor',
		items: [{
		    fieldLabel: 'Name',
		    name: 'project_name',
		    allowBlank: false
		}, {
		    xtype: 'fieldcontainer',
		    fieldLabel: 'Duration',
		    layout: 'hbox',
		    items: [{
			xtype: 'numberfield',
			name: 'duration_units',
			hideLabel: true,
			width: 70,
			value: '1',
			minValue: 0,
			allowBlank: false
		    }, {
			xtype: 'combobox',
			name: 'duration_uom',
			displayField: 'category',
			valueField: 'category_id',
			queryMode: 'local',
			emptyText: 'Day',
			hideLabel: true,
			width: 50,
			margins: '0 6 0 0',
			store: Ext.create('Ext.data.Store', { fields: ['category_id', 'category'], data: [
			    {category_id: 321, category: 'Day'},
			    {category_id: 320, category: 'Hour'}
			]}),
			allowBlank: false,
			forceSelection: true
		    }, {
			xtype: 'checkbox',
			name: 'estimated_p',
			boxLabel: 'Estimated',
			hideLabel: true,
			checked: false,
			margin: '0 0 10 0'
		    }]
		}, {
		    xtype: 'numberfield',
		    fieldLabel: '% Done',
		    name: 'percent_complete',
		    width: 140,
		    value: '0',
		    minValue: 0,
		    maxValue: 100,
		    allowBlank: false
		}, {
		    xtype: 'numberfield',
		    fieldLabel: 'Priority',
		    name: 'task_priority',
		    width: 150,
		    value: '500',
		    minValue: 0,
		    maxValue: 1000,
		    allowBlank: false
		}]
	    }, {
		xtype: 'fieldset',
		title: 'Dates',
		defaultType: 'datefield',
		layout: 'anchor',
		items: [{
		    xtype: 'datefield',
		    fieldLabel: 'Start',
		    name: 'start_date',
		    allowBlank: false,
		    format: 'Y-m-d',
		    value: new Date()
		}, {
		    xtype: 'datefield',
		    fieldLabel: 'End',
		    name: 'ebd_date',
		    allowBlank: false,
		    format: 'Y-m-d',
		    value: new Date()
		}]
	    }]
	});
	
	var taskPropertyTabpanel = Ext.create("Ext.tab.Panel",{
	    id: 'taskPropertyTabpanel',
	    border: false,
	    items: [
		taskPropertyFormGeneral,
		taskPropertyAssignments,
		taskPropertyFormNotes
	    ],
	    buttons: [{
		text: 'OK',
		scope: this,
		handler: this.onOk
	    }, {
		text: 'Cancel',
		scope: this,
		handler: this.onCancel
	    }]    
	});

	me.add(taskPropertyTabpanel);
	console.log('PO.view.gantt.GanttTaskPropertyPanel.initialize: Finished');
    },

    /**
     * Show the properties of the specified task model.
     * Write changes back to the task immediately (at the moment).
     */
    setValue: function(task) {
	console.log('PO.view.gantt.GanttTaskPropertyPanel.setValue: Starting');
	var me = this;
	var form = me.getForm();
	form.loadRecord(task);
	console.log('PO.view.gantt.GanttTaskPropertyPanel.setValue: Finished');
    }
}); 

