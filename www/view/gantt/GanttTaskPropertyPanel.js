/*
 * GanttTaskPropertyPanel.js
 *
 * Copyright (c) 2011 - 2014 ]project-open[ Business Solutions, S.L.
 * This file may be used under the terms of the GNU General Public
 * License version 3.0 or alternatively unter the terms of the ]po[
 * FL or CL license as specified in www.project-open.com/en/license.
 */

/**
 * A free floating singleton TabPanel with several elements 
 * allowing to edit the details of a single task.
 */
Ext.define('PO.view.gantt.GanttTaskPropertyPanel', {
    extend:                             'Ext.Window',
    id:                                 'ganttTaskPropertyPanel',
    alias:                              'ganttTaskPropertyPanel',

    title: 'Task Properties',
    id: 'ganttTaskPropertyPanel',
    senchaPreferenceStore: null,

    debug: false,
    width: 500,
    height: 400,

    closable: true,
    closeAction: 'hide',
    resizable: true,
    modal: false,
    layout: 'fit',

    taskModel: null,								// Set by setValue() before show()
    
    initComponent: function() {
        var me = this;
        if (me.debug) console.log('PO.view.gantt.GanttTaskPropertyPanel.initialize: Starting');
        this.callParent(arguments);

        // Define a model for assignments
        Ext.define("PO.model.gantt.GanttAssignmentModel", {
            extend: "PO.model.user.User",
            fields: [
                {name: 'user_initials', type: 'string'},
                {name: 'percent', type: 'float'}
            ]
        });
        
        // New store for keeping assignment data, setValue() adds the data.
        var taskAssignmentStore = Ext.create('Ext.data.Store', {
            id: 'taskAssignmentStore',
            model: 'PO.model.gantt.GanttAssignmentModel'
        });

        // Row editor for the TaskAssignmentsPanel.
        var taskAssignmentRowEditing = Ext.create('Ext.grid.plugin.RowEditing', {
            clicksToEdit: 1,
            clicksToMoveEditor: 1,
            autoCancel: true,
            valueModels: null,                                                 // set by "select" event of combobox
            listeners: {
                // The user_id or percent have changed. Write the changes back into the taskAssignmentStore.
                edit: function(rowEditing, context, eOpts) {
                    if ("name" != context.field && "id" != context.field) { return; }
                    var userModels = this.valueModels;
                    if (!userModels) { return; }                                // Nothing selected?
                    var userModel = this.valueModels[0];
                    if (!userModel) { return; }                                 // ??

                    var assigModel = context.record;			        // get the recored to be edited
                    assigModel.set(userModel.data);
                }
            }
        });
        
        // Grid with assigned users
        var taskPropertyAssignments = Ext.create('Ext.grid.Panel', {
            title: 'Assignments',
            id: 'taskPropertyAssignments',
            store: taskAssignmentStore,
            width: 200,
            debug: me.debug,
            stateful: true,
            stateId: 'taskPropertyAssignments',
            selType: 'rowmodel',
            plugins: taskAssignmentRowEditing,
            columns: [
                { text: 'Id', width: 30, dataIndex: 'id', hidden: false},
                { text: 'Dept', width: 30, dataIndex: 'department_id', hidden: false},
                { text: 'Initials', width: 60, dataIndex: 'initials', hidden: false},
                { text: 'Name', dataIndex: 'name', flex: 1, editor: {
                    xtype: 'combobox',
                    store: Ext.StoreManager.get('projectMemberStore'),
                    displayField: 'name',
                    valueField: 'name',
                    queryMode: 'local',
                    forceSelection: false,
                    triggerAction: 'all',
                    allowBlank: false,
                    editable: true,
                    listeners: {select: function(combo, records) {
                        combo.valueModels = records;
                        taskAssignmentRowEditing.valueModels = records;
                    }}  // remember selected user
                }},
                { text: 'Email', dataIndex: 'email', flex: 1, hidden: false },
                { text: '%', width: 50, dataIndex: 'percent', editor: 'textfield' }
            ],
            dockedItems: [{
                xtype: 'toolbar',
                dock: 'top',
                items: [
                    {icon: '/intranet/images/navbar_default/add.png', tooltip: 'Add a user', id: 'assigButtonAdd'}, 
                    {icon: '/intranet/images/navbar_default/delete.png', tooltip: 'Delete a user', id: 'assigButtonDel'}
                ]
            }]
        });

        // Small controller in order to handle the (+) / (-) buttons for
        // adding and removing users.
        var taskPropertyAssignmentsController = Ext.create('Ext.app.Controller', {
            taskAssignmentStore: taskAssignmentStore,
            taskPropertyAssignments: taskPropertyAssignments,    
            init: function() {
                var me = this;
                this.control({
                    '#assigButtonAdd': { click: me.onAssigButtonAdd },
                    '#assigButtonDel': { click: me.onAssigButtonDel }
                });
                return this;
            },
            onAssigButtonAdd: function(button, event) {
                var me = this;
                if (me.debug) console.log('GanttTaskPropertyPanel.taskPropertyAssignmentsController.onAssigButtonAdd');
                var newRecord = me.taskAssignmentStore.add({percent:100})[0];

                // Cancel editing
                var editing = me.taskPropertyAssignments.editingPlugin;
                editing.cancelEdit();
                editing.startEdit(newRecord, 0);                       		// Start editing the first row
            },
            onAssigButtonDel: function(button, event) {
                var me = this;
                if (me.debug) console.log('GanttTaskPropertyPanel.taskPropertyAssignmentsController.onAssigButtonDel');

                // Cancel editing
                var editing = me.taskPropertyAssignments.editingPlugin;
                editing.cancelEdit();

                var lastSelected = me.taskPropertyAssignments.getSelectionModel().getLastSelected();
                if (lastSelected) {
                    me.taskAssignmentStore.remove(lastSelected);
                } else {
                    // Apparently no row selected yet. Never mind, use the last one...
                    var last = me.taskAssignmentStore.last();
                    if (last)
                        me.taskAssignmentStore.remove(last);
                }
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
                title: 'General',
                defaultType: 'textfield',
                layout: 'anchor',
                items: [{
                    fieldLabel: 'Name',
                    name: 'project_name',
                    width: 450,
                    allowBlank: false
/*
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
*/
                }, {
                    xtype: 'numberfield',
                    fieldLabel: 'Work',
                    name: 'planned_units',
                    width: 140,
                    value: '0',
                    minValue: 0,
                    allowBlank: true
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
                }, {
                    xtype: 'checkbox',
                    fieldLabel: 'Milestone',
                    name: 'milestone_p',
                    uncheckedValue: 'f',
                    inputValue: 't'
                }, {
		    xtype: 'combobox',
                    fieldLabel: 'Material',
                    name: 'material_id',
                    displayField: 'material_name',
                    valueField: 'material_id',
                    queryMode: 'local',
		    typeAhead: true,
                    emptyText: 'Material',
                    width: 450,
 		    matchFieldWidth: false,
                    store: Ext.StoreManager.get('taskMaterialStore'),
                    allowBlank: false,
                    forceSelection: true
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

        if (me.debug) console.log('PO.view.gantt.GanttTaskPropertyPanel.initialize: Finished');
    },

    /**
     * Save the modified form values into the model.
     */
    onButtonOK: function(button, event) {
        var me = this;
        if (me.debug) console.log('PO.view.gantt.GanttTaskPropertyPanel.onButtonOK');

	// Check if read-only
	var readOnly = me.senchaPreferenceStore.getPreferenceBoolean('read_only',true);
	var dirty = me.taskModel.dirty;
	if (readOnly && dirty) { 
	    me.ganttTreePanelController.readOnlyWarning(); 
	    me.hide();
	    return; 
	}

	// Finish the editor of the TaskASsigments list in case the user didn't press "Update" yet.
	var editing = me.taskPropertyAssignments.editingPlugin;
	editing.completeEdit();


        // Write timestamp to make sure that data are modified and redrawn.
        me.taskModel.set('last_modified', Ext.Date.format(new Date(), 'Y-m-d H:i:s'));
        
        // ---------------------------------------------------------------
        // "General" form panel with start- and end date, %done, work etc.
        var fields = me.taskPropertyFormGeneral.getValues(false, true, true, true);	// get all fields into object

        var oldStartDate = me.taskModel.get('start_date');
        var oldEndDate = me.taskModel.get('end_date');
        var newStartDate = fields['start_date'];
        var newEndDate = fields['end_date'];
        if (oldStartDate.substring(0,10) == newStartDate) { fields['start_date'] = oldStartDate; }	// start has no time
        if (oldEndDate.substring(0,10) == newEndDate) { fields['end_date'] = oldEndDate; }	 	// start has no time

        var plannedUnits = fields['planned_units'];
        if (undefined == plannedUnits) { plannedUnits = 0; }

        // fix boolean vs. 't'/'f' checkbox for milestone_p
        switch (fields['milestone_p']) {
        case true: 
            fields['milestone_p'] = 't';						// use 't' and 'f', not true and false!
            fields['iconCls'] = 'icon-milestone';					// special icon for milestones
            fields['end_date'] = fields['start_date'];					// Milestones have end_date = start_date
            fields['planned_units'] = "0";             			                // Milestones don't have planned_units
            break;
        default: 
            fields['milestone_p'] = 'f'; 
            fields['iconCls'] = 'icon-task';						// special icon for non-milestones
            fields['planned_units'] = ""+plannedUnits;              			// Convert the numberfield integer to string used in model.
            break;	      								// '' is database "null" value in ]po[
        }

        me.taskModel.set(fields); 							// write all fields into model
        
        // ---------------------------------------------------------------
        // Notes form
        fields = me.taskPropertyFormNotes.getValues(false, true, true, true);
        me.taskModel.set(fields);

        // ---------------------------------------------------------------
        // Deal with Assignations
        var oldAssignees = me.taskModel.get('assignees');
        var newAssignees = [];
        me.taskAssignmentStore.each(function(assig) {
            var user_id = assig.get('user_id');
	    if ("" == user_id) return;
            if (me.debug) console.log('PO.view.gantt.GanttTaskPropertyPanel.onButtonOK: user_id='+user_id);
            var rel_id = parseInt(assig.get('rel_id'));
            if (!rel_id) { rel_id = null; }
            newAssignees.push({
                id: rel_id,
                user_id: parseInt(assig.get('user_id')),
                percent: parseFloat(assig.get('percent'))
            });
        });

        // Compare old with new assignees
        var oldAssigneesNorm = {};
        var newAssigneesNorm = {};
        oldAssignees.forEach(function(v) { oldAssigneesNorm[v.user_id] = v.percent; });
        newAssignees.forEach(function(v) { newAssigneesNorm[v.user_id] = v.percent; });
        if (JSON.stringify(oldAssigneesNorm) !== JSON.stringify(newAssigneesNorm)) {
            me.taskModel.set('assignees', newAssignees);
        }

        me.hide();									// hide the TaskProperty panel
    },

    /**
     * Simply hide the windows.
     * This automatically discards any changes.
     */
    onButtonCancel: function(button, event) {
        var me = this;
        if (me.debug) console.log('PO.view.gantt.GanttTaskPropertyPanel.onButtonCancel');
        me.hide();									// hide the TaskProperty panel
    },

    setActiveTab: function(tab) {
        var me = this;
        me.taskPropertyTabpanel.setActiveTab(tab);
    },

    /**
     * Try to hide the list of tabs and the outer frame
     */
    hideTabs: function() {
        var me = this;
        if (me.debug) console.log('PO.view.gantt.GanttTaskPropertyPanel.hideTabs: Starting');
        var tabPanel = me.taskPropertyTabpanel;
        var tabBar = tabPanel.tabBar;
        tabBar.hide();
    },

    /**
     * Show the properties of the specified task model.
     * Write changes back to the task immediately (at the moment).
     */
    setValue: function(task) {
        var me = this;
        if (me.debug) console.log('PO.view.gantt.GanttTaskPropertyPanel.setValue: Starting');
        var projectMemberStore = Ext.StoreManager.get('projectMemberStore');

        // Default values for task if not defined yet by ]po[
        // ToDo: Unify with default values in onButtonAdd
        if ("" == task.get('planned_units')) { task.set('planned_units', '0'); }
        if ("" == task.get('uom_id')) { task.set('uom_id', ""+default_uom_id); } 		// "Day" as UoM
        if ("" == task.get('material_id')) { task.set('material_id', ""+default_material_id); }	// "Default" material
        if ("" == task.get('priority')) { task.set('priority', '500'); }
        if ("" == task.get('start_date')) { task.set('start_date',  Ext.Date.format(new Date(), 'Y-m-d')); }
        if ("" == task.get('end_date')) { task.set('end_date',  Ext.Date.format(new Date(), 'Y-m-d')); }
        if ("" == task.get('percent_completed')) { task.set('percent_completed', '0'); }

        // fix boolean vs. 't'/'f' checkbox for milestone_p
/*
        switch (task.get('milestone_p')) {
            case 't': task.set('milestone_p', true); break;
            case 'true': task.set('milestone_p', true); break;
            default: task.set('milestone_p', false); break;
        }
*/      
        // Load the data into the various forms
        me.taskPropertyFormGeneral.getForm().loadRecord(task);
        me.taskPropertyFormNotes.getForm().loadRecord(task);

        // Load assignment information into the assignmentStore
        me.taskAssignmentStore.removeAll();
        var assignments = task.get('assignees');
        if (assignments.constructor !== Array) { assignments = []; }         		// Newly created task...
        assignments.forEach(function(v) {
            var userId = ""+v.user_id;
            var userModel = projectMemberStore.getById(userId);
            if (!userModel) { return; }                                      		// User not set in assignment row
            var assigModel = new PO.model.gantt.GanttAssignmentModel(userModel.data);
            assigModel.set('percent', v.percent);
            me.taskAssignmentStore.add(assigModel);
        });

        me.taskModel = task;								// Save the model for reference
        if (me.debug) console.log('PO.view.gantt.GanttTaskPropertyPanel.setValue: Finished');
    }
}); 

