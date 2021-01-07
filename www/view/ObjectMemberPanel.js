/*
 * ObjectMemberPanel.js
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
Ext.define('PO.view.ObjectMemberPanel', {
    extend:                             'Ext.Window',
    id:                                 'objectMemberPanel',
    alias:                              'objectMemberPanel',

    title: 				'Task Properties',
    id:					'objectMemberPanel',
    senchaPreferenceStore:		null,

    debug:				false,
    width:				500,
    height:				420,

    closable:				true,
    closeAction:			'hide',
    resizable:				true,
    modal:				false,
    layout:				'fit',

    taskModel: 				null,				// Set by setValue() before show()
    
    initComponent: function() {
        var me = this;
        if (me.debug) console.log('PO.view.ObjectMemberPanel.initialize: Starting');
        this.callParent(arguments);

        // Define a model for members
        Ext.define("PO.model.ObjectMemberModel", {
            extend: "PO.model.user.User",
            fields: [
                {name: 'user_initials', type: 'string'},
                {name: 'role_id', type: 'integer'}
            ]
        });

        // New store for keeping member data, setValue() adds the data.
        var objectMemberStore = Ext.create('Ext.data.Store', {
            id: 'objectMemberStore',
            model: 'PO.model.ObjectMemberModel'
        });

        // Row editor for the TaskMembersPanel.
        var taskMemberRowEditing = Ext.create('Ext.grid.plugin.RowEditing', {
            clicksToEdit: 1,
            clicksToMoveEditor: 1,
            autoCancel: true,
            valueModels: null,                                                 // set by "select" event of combobox
            listeners: {
                // The user_id or role_id have changed. Write the changes back into the objectMemberStore.
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
        var taskPropertyMembers = Ext.create('Ext.grid.Panel', {
            title: 'Members',
            id: 'taskPropertyMembers',
            store: objectMemberStore,
            width: 200,
            debug: me.debug,
            stateful: true,
            stateId: 'taskPropertyMembers',
            selType: 'rowmodel',
            plugins: taskMemberRowEditing,
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
                        taskMemberRowEditing.valueModels = records;
                    }}  // remember selected user
                }},
                { text: 'Email', dataIndex: 'email', flex: 1, hidden: false },
                { text: 'Role', width: 50, dataIndex: 'role_id', editor: 'textfield' }
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
        var taskPropertyMembersController = Ext.create('Ext.app.Controller', {
            objectMemberStore: objectMemberStore,
            taskPropertyMembers: taskPropertyMembers,    
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
                if (me.debug) console.log('ObjectMemberPanel.taskPropertyMembersController.onAssigButtonAdd');
                var newRecord = me.objectMemberStore.add({role_id:100})[0];

                // Cancel editing
                var editing = me.taskPropertyMembers.editingPlugin;
                editing.cancelEdit();
                editing.startEdit(newRecord, 0);                       		// Start editing the first row
            },
            onAssigButtonDel: function(button, event) {
                var me = this;
                if (me.debug) console.log('ObjectMemberPanel.taskPropertyMembersController.onAssigButtonDel');

                // Cancel editing
                var editing = me.taskPropertyMembers.editingPlugin;
                editing.cancelEdit();

                var lastSelected = me.taskPropertyMembers.getSelectionModel().getLastSelected();
                if (lastSelected) {
                    me.objectMemberStore.remove(lastSelected);
                } else {
                    // Apparently no row selected yet. Never mind, use the last one...
                    var last = me.objectMemberStore.last();
                    if (last)
                        me.objectMemberStore.remove(last);
                }
            }
        }).init();

        var taskPropertyTabpanel = Ext.create("Ext.tab.Panel", {
            id: 'taskPropertyTabpanel',
            border: false,
            items: [
                taskPropertyMembers
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
        me.objectMemberStore = objectMemberStore;
        me.taskPropertyMembers = taskPropertyMembers;
        me.taskPropertyTabpanel = taskPropertyTabpanel;

        if (me.debug) console.log('PO.view.ObjectMemberPanel.initialize: Finished');
    },

    /**
     * Save the modified form values into the model.
     */
    onButtonOK: function(button, event) {
        var me = this;
        if (me.debug) console.log('PO.view.ObjectMemberPanel.onButtonOK');

	// Finish the editor of the TaskASsigments list in case the user didn't press "Update" yet.
	var editing = me.taskPropertyMembers.editingPlugin;
	editing.completeEdit();


        // Write timestamp to make sure that data are modified and redrawn.
        me.taskModel.set('last_modified', Ext.Date.format(new Date(), 'Y-m-d H:i:s'));
        
        // ---------------------------------------------------------------
        // "General" form panel with start- and end date, %done, work etc.
!!!        var fields = me.taskPropertyFormGeneral.getValues(false, true, true, true);	// get all fields into object

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

        // fix boolean vs. 't'/'f' checkbox for effort_driven_p
        switch (fields['effort_driven_p']) {
        case true: 
            fields['effort_driven_p'] = 't';						// use 't' and 'f', not true and false!
            break;
        default: 
            fields['effort_driven_p'] = 'f'; 
            break;
        }

        me.taskModel.set(fields); 							// write all fields into model
        
        // ---------------------------------------------------------------
        // Notes form
!!!        fields = me.taskPropertyFormNotes.getValues(false, true, true, true);
        me.taskModel.set(fields);

        // ---------------------------------------------------------------
        // Deal with Assignations
        var oldAssignees = me.taskModel.get('assignees');
        var newAssignees = [];
        me.objectMemberStore.each(function(assig) {
            var user_id = assig.get('user_id');
	    if ("" == user_id) return;
            if (me.debug) console.log('PO.view.ObjectMemberPanel.onButtonOK: user_id='+user_id);
            var rel_id = parseInt(assig.get('rel_id'));
            if (!rel_id) { rel_id = null; }
            newAssignees.push({
                id: rel_id,
                user_id: parseInt(assig.get('user_id')),
                role_id: parseFloat(assig.get('role_id'))
            });
        });

        // Compare old with new assignees
        var oldAssigneesNorm = {};
        var newAssigneesNorm = {};
        oldAssignees.forEach(function(v) { oldAssigneesNorm[v.user_id] = v.role_id; });
        newAssignees.forEach(function(v) { newAssigneesNorm[v.user_id] = v.role_id; });
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
        if (me.debug) console.log('PO.view.ObjectMemberPanel.onButtonCancel');
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
        if (me.debug) console.log('PO.view.ObjectMemberPanel.hideTabs: Starting');
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
        if (me.debug) console.log('PO.view.ObjectMemberPanel.setValue: Starting');
        var projectMemberStore = Ext.StoreManager.get('projectMemberStore');

        // Default values for task if not defined yet by ]po[
        // ToDo: Unify with default values in onButtonAdd
        if ("" == task.get('planned_units')) { task.set('planned_units', '0'); }
        if ("" == task.get('uom_id')) { task.set('uom_id', ""+default_uom_id); } 		// "Day" as UoM
        if ("" == task.get('material_id')) { task.set('material_id', ""+default_material_id); }	// "Default" material
        if ("" == task.get('priority')) { task.set('priority', '500'); }
        if ("" == task.get('start_date')) { task.set('start_date',  Ext.Date.format(new Date(), 'Y-m-d')); }
        if ("" == task.get('end_date')) { task.set('end_date',  Ext.Date.format(new Date(), 'Y-m-d')); }
        if ("" == task.get('role_id_completed')) { task.set('role_id_completed', '0'); }

        // Load the data into the various forms
!!!        me.taskPropertyFormGeneral.getForm().loadRecord(task);
!!!        me.taskPropertyFormNotes.getForm().loadRecord(task);

        // Load member information into the memberStore
        me.objectMemberStore.removeAll();
        var members = task.get('assignees');
        if (members.constructor !== Array) { members = []; }         		// Newly created task...
        members.forEach(function(v) {
            var userId = ""+v.user_id;
            var userModel = projectMemberStore.getById(userId);
            if (!userModel) { return; }                                      		// User not set in member row
            var assigModel = new PO.model.ObjectMemberModel(userModel.data);
            assigModel.set('role_id', v.role_id);
            me.objectMemberStore.add(assigModel);
        });

        me.taskModel = task;								// Save the model for reference
        if (me.debug) console.log('PO.view.ObjectMemberPanel.setValue: Finished');
    }
}); 

