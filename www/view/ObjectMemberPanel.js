/*
 * ObjectMemberPanel.js
 *
 * Copyright (c) 2011 - 2021 ]project-open[ Business Solutions, S.L.
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

    title: 				'Members',
    id:					'objectMemberPanel',
    debug:				false,
    width:				500,
    height:				420,

    closable:				true,
    closeAction:			'hide',
    resizable:				true,
    modal:				false,
    layout:				'fit',

    objectMemberField: 			null,				// Field to which this panel is attached
    potentialMemberStore:		null,				// List of all potential members
    actualMemberStore: 			null,				// List of actual members selected
    
    initComponent: function() {
        var me = this;
        if (me.debug) console.log('PO.view.ObjectMemberPanel.initialize: Starting');
        this.callParent(arguments);

        // Members are an extension of the User model with role
        Ext.define("PO.model.ObjectMemberModel", {
            extend: "PO.model.user.User",
            fields: [
                {name: 'user_initials', type: 'string'},
                {name: 'role_id', type: 'integer'}
            ]
        });

        // New store for keeping member data, setValue() adds the data.
        var actualMemberStore = Ext.create('Ext.data.Store', {
            id: 'actualMemberStore',
            model: 'PO.model.ObjectMemberModel'
        });
	me.actualMemberStore = actualMemberStore;

        // Row editor for the TaskMembersPanel.
        var taskMemberRowEditing = Ext.create('Ext.grid.plugin.RowEditing', {
            clicksToEdit: 1,
            clicksToMoveEditor: 1,
            autoCancel: true,
            valueModels: null,                                                 // set by "select" event of combobox
            listeners: {
                // The user_id or role_id have changed. Write the changes back into the actualMemberStore.
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
        var objectMembersPanel = Ext.create('Ext.grid.Panel', {
            title: 'Members',
            id: 'objectMembers',
            store: actualMemberStore,
            width: 200,
            debug: me.debug,
            stateful: true,
            stateId: 'objectMembers',
            selType: 'rowmodel',
            plugins: taskMemberRowEditing,
            columns: [
                { text: 'Id', width: 30, dataIndex: 'id', hidden: false},
                { text: 'Dept', width: 30, dataIndex: 'department_id', hidden: false},
                { text: 'Initials', width: 60, dataIndex: 'initials', hidden: false},
                { text: 'Name', dataIndex: 'name', flex: 1, editor: {
                    xtype: 'combobox',
                    store: me.potentialMemberStore,
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
        var objectMembersController = Ext.create('Ext.app.Controller', {
            actualMemberStore: actualMemberStore,
            objectMembersPanel: objectMembersPanel,    
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
                if (me.debug) console.log('ObjectMemberPanel.objectMembersController.onAssigButtonAdd');
                var newRecord = me.actualMemberStore.add({role_id:1300})[0];

                var editing = me.objectMembersPanel.editingPlugin;
                editing.cancelEdit();
                editing.startEdit(newRecord, 0);                       		// Start editing the first row
            },
            onAssigButtonDel: function(button, event) {
                var me = this;
                if (me.debug) console.log('ObjectMemberPanel.objectMembersController.onAssigButtonDel');

                // Cancel editing
                var editing = me.objectMembersPanel.editingPlugin;
                editing.cancelEdit();

                var lastSelected = me.objectMembersPanel.getSelectionModel().getLastSelected();
                if (lastSelected) {
                    me.actualMemberStore.remove(lastSelected);
                } else {
                    // Apparently no row selected yet. Never mind, use the last one...
                    var last = me.actualMemberStore.last();
                    if (last)
                        me.actualMemberStore.remove(last);
                }
            }
        }).init();

        var taskPropertyTabpanel = Ext.create("Ext.tab.Panel", {
            id: 'taskPropertyTabpanel',
            border: false,
            items: [
                objectMembersPanel
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
        me.objectMembersPanel = objectMembersPanel;
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
        var editing = me.objectMembersPanel.editingPlugin;
        editing.completeEdit();
        
        // ---------------------------------------------------------------
        // Store Assignations
        var newAssignees = [];
        me.actualMemberStore.each(function(assig) {
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
        me.oldValue.forEach(function(v) { oldAssigneesNorm[v.user_id] = v.role_id; });
        newAssignees.forEach(function(v) { newAssigneesNorm[v.user_id] = v.role_id; });
        if (JSON.stringify(oldAssigneesNorm) !== JSON.stringify(newAssigneesNorm)) {
            // Write new value to field
            me.objectMemberField.setValue(newAssignees);
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
     * Where should we write the results when finished?
     * Used by onButtonOk to save values.
     */
    setField: function(formField) {
        var me = this;
        me.objectMemberField = formField;
    },
    
    setStore: function(store) {
        var me = this;
        me.potentialMemberStore = store;
    },

    /**
     * Show the properties of the specified task model.
     * Write changes back to the task immediately (at the moment).
     */
    setValue: function(memberArray) {
        var me = this;
        if (me.debug) console.log('PO.view.ObjectMemberPanel.setValue: Starting');

        // Remember old value for comparison
        me.oldValue = memberArray;

        // Load member information into the potentialMemberStore
        var actualMemberStore = Ext.StoreManager.get('actualMemberStore');
        me.actualMemberStore.removeAll();
        if (memberArray.constructor !== Array) { memberArray = []; }         		// Newly created?
        memberArray.forEach(function(v) {
            var userId = ""+v.user_id;
            var userModel = me.potentialMemberStore.getById(userId);
            if (!userModel) { return; }                                      		// User not set in member row
            var assigModel = new PO.model.ObjectMemberModel(userModel.data);
            assigModel.set('role_id', v.role_id);
            me.actualMemberStore.add(assigModel);
        });

        if (me.debug) console.log('PO.view.ObjectMemberPanel.setValue: Finished');
    }
}); 

