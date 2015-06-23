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
    closeAction: 'hide',
    resizable: true,
    modal: false,
    layout: 'fit',

    initComponent: function() {
	console.log('PO.view.gantt.GanttTaskPropertyPanel.initialize: Starting');
	var me = this;
	this.callParent(arguments);

	// New store for keeping assignment data
	var taskAssignmentStore = Ext.create('Ext.data.Store', {
	    id: 'taskAssignmentStore',
	    fields: ['id', 'percent', 'name', 'email', 'initials'],
	    data: []                                   // Data will come from setValue()
	});

	var taskPropertyAssignments = Ext.create('Ext.grid.Panel', {
            title: 'Assignments',
	    id: 'taskPropertyAssignments',
            store: taskAssignmentStore,
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
            plugins: [Ext.create('Ext.grid.plugin.CellEditing', {    // Hack the issue that this is a floating panel without Window around
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
		taskAssignmentStore.add({});
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
			name: 'planned_units',
			hideLabel: true,
			width: 70,
			value: '1',
			minValue: 0,
			allowBlank: false
		    }, {
			xtype: 'combobox',
			name: 'uom_id',
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
		    name: 'percent_completed',
		    width: 140,
		    value: '0',
		    minValue: 0,
		    maxValue: 100,
		    allowBlank: false
		}, {
		    xtype: 'numberfield',
		    fieldLabel: 'Priority',
		    name: 'priority',
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
		    xtype: 'podatefield',
		    fieldLabel: 'Start',
		    name: 'start_date',
		    allowBlank: false,
		    format: 'Y-m-d',
		    value: new Date()
		}, {
		    xtype: 'podatefield',
		    fieldLabel: 'End',
		    name: 'end_date',
		    allowBlank: false,
		    format: 'Y-m-d',
		    value: new Date()
		}]
	    }]
	});
	
	var taskPropertyTabpanel = Ext.create("Ext.tab.Panel", {
	    id: 'taskPropertyTabpanel',
	    border: false,
	    items: [
		taskPropertyFormGeneral,
		taskPropertyAssignments,
		taskPropertyFormNotes
	    ],
	    buttons: [{
		text: 'OK',
		scope: me,
		handler: me.onButtonOK
	    }, {
		text: 'Cancel',
		scope: me,
		handler: me.onButtonCancel
	    }]    
	});
	me.add(taskPropertyTabpanel);

	// store panels in the main object
	me.taskAssignmentStore = taskAssignmentStore;
	me.taskPropertyFormGeneral = taskPropertyFormGeneral;
	me.taskPropertyAssignments = taskPropertyAssignments;
	me.taskPropertyFormNotes = taskPropertyFormNotes;
	me.taskPropertyTabpanel = taskPropertyTabpanel;

	// me.on('close', this.onClose, this);	// capture the close event
	console.log('PO.view.gantt.GanttTaskPropertyPanel.initialize: Finished');
    },

    /**
     * Save the modified form values into the model.
     */
    onButtonOK: function(button, event) {
	console.log('PO.view.gantt.GanttTaskPropertyPanel.onButtonOK');
	var me = this;

	var fields = me.taskPropertyFormGeneral.getValues(false, true, true, true);
	me.taskModel.set(fields);
	fields = me.taskPropertyFormNotes.getValues(false, true, true, true);
	me.taskModel.set(fields);

	var assignees = [];
	me.taskAssignmentStore.each(function(assig) {
	    assignees.push(assig);
	});
	me.taskModel.data.assignees = assignees;

	me.hide();                              // hide the TaskProperty panel
    },

    /**
     * Simply hide the windows.
     * This automatically discards any changes.
     */
    onButtonCancel: function(button, event) {
	console.log('PO.view.gantt.GanttTaskPropertyPanel.onButtonCancel');
	var me = this;
	me.hide();                              // hide the TaskProperty panel
    },

    setActiveTab: function(tab) {
	var me = this;
	me.taskPropertyTabpanel.setActiveTab(tab);
    },

    /**
     * Try to hide the list of tabs and the outer frame
     */
    hideTabs: function() {
	console.log('PO.view.gantt.GanttTaskPropertyPanel.hideTabs: Starting');
	var me = this;
	var tabPanel = me.taskPropertyTabpanel;
	var tabBar = tabPanel.tabBar;
	tabBar.hide();

    },
    
    /**
     * Show the properties of the specified task model.
     * Write changes back to the task immediately (at the moment).
     */
    setValue: function(task) {
	console.log('PO.view.gantt.GanttTaskPropertyPanel.setValue: Starting');
	var me = this;

	// Default values for task if not defined yet by ]po[
	if ("" == task.get('planned_units')) { task.set('planned_units', '1'); }
	if ("" == task.get('uom_i')) { task.set('uom_id', '320'); } // "Day" as UoM
	if ("" == task.get('priority')) { task.set('priority', '500'); }
	if ("" == task.get('start_date')) { task.set('start_date',  Ext.Date.format(new Date(), 'Y-m-d')); }
	if ("" == task.get('end_date')) { task.set('end_date',  Ext.Date.format(new Date(), 'Y-m-d')); }
	if ("" == task.get('percent_completed')) { task.set('percent_completed', '0'); }
	if ("" == task.get('')) { task.set('', ''); }
	
	// Load the data into the various forms
	me.taskPropertyFormGeneral.getForm().loadRecord(task);
	me.taskPropertyFormNotes.getForm().loadRecord(task);

	// Load assignment information into the assignmentStore
	me.taskAssignmentStore.removeAll();
	var assignments = task.get('assignees');
	assignments.forEach(function(v) {
	    me.taskAssignmentStore.add(v);
	});

	me.taskModel = task;                              // Save the model for reference
	console.log('PO.view.gantt.GanttTaskPropertyPanel.setValue: Finished');
    }
}); 

