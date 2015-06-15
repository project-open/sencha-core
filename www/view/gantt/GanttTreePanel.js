/*
 * GanttTreePanel.js
 *
 * Copyright (c) 2011 - 2014 ]project-open[ Business Solutions, S.L.
 * This file may be used under the terms of the GNU General Public
 * License version 3.0 or alternatively unter the terms of the ]po[
 * FL or CL license as specified in www.project-open.com/en/license.
 */

/**
 * TreePanel with the list of tasks of a specific project.
 * This panel can be use stand alone for task editing or as
 * the left-hand side of a Gantt editor.
 */
Ext.define('PO.view.gantt.GanttTreePanel', {
    extend:				'Ext.tree.Panel',
    requires: [
        'PO.view.field.PODateField'				// Custom ]po[ data field for PostgreSQL timestamptz data
    ],
    id:                                 'ganttTreePanel',
    alias:				'ganttTreePanel',
    title:				false,
    shrinkWrap:				true,
    animate:				false,			// Animation messes up bars on the right side
    collapsible:			false,
    useArrows:				true,
    rootVisible:			false,
    multiSelect:			true,
    singleExpand:			false,

    // Enable in-line row editing.
    plugins:				[Ext.create('Ext.grid.plugin.RowEditing', {clicksToMoveEditor: 2})],

    // Enabled drag-and-drop for the tree. Yes, that's all...
    viewConfig: {
        plugins: {
            ptype:			'treeviewdragdrop',
            containerScroll:		true
        }
    },

    // the 'columns' property is now 'headers'
    columns: [
	{text: 'Id', flex: 1, dataIndex: 'id', hidden: true}, 
	{text: 'Task', xtype: 'treecolumn', flex: 2, sortable: true, dataIndex: 'project_name', editor: {allowBlank: false}}, 
/*	{text: 'Link', xtype: 'actioncolumn', dataIndex: 'project_url', width: 30, items: [{
	    icon: '/intranet/images/external.png',
	    tooltip: 'Link',handler: function(grid, rowIndex, colIndex) {
		console.log('GanttTreePanel: column=Link: rowIndex='+rowIndex);
		var rec = grid.getStore().getAt(rowIndex);
		var url = '/intranet/projects/view?project_id='+rec.get('id');
		window.open(url); // Open project in new browser tab
	    }
	}]},
	{text: 'Assigned To', flex: 1, hidden: false, dataIndex: 'user', sortable: true, editor: {allowBlank: true}},
*/
	{
	    text: 'Assignees', flex: 1, hidden: false, dataIndex: 'assignees', 
	    renderer: function(assignees, columnDisplay, model, a,b,c,d,e){
		var result = "";
		if (null != assignees && "" != assignees) {
		    assignees.forEach(function(assignee) {
			if ("" != result) { result = result + ", "; }
			result = result + assignee.initials;
			if (100 != assignee.percent) {
			    result = result + '['+assignee.percent+'%]';
			}
		    });
		}
		return result;
            },
	    editor: { 
		xtype: 'pocombogrid',
		store: 'taskStatusStore',
		queryMode: 'local',
		displayField: 'category',
		valueField: 'category_id',
		renderTo: Ext.getBody()
	    }
	},

	{text: 'Start', flex: 1, hidden: false, dataIndex: 'start_date', renderer: function(value) { return value.substring(0,10); }, editor: 'podatefield' },
	{text: 'End', flex: 1, hidden: false, dataIndex: 'end_date', renderer: function(value) { return value.substring(0,10); }, editor: 'podatefield' },
	{text: 'Description', flex: 1, hidden: false, dataIndex: 'description', editor: {allowBlank: true}},

	{text: 'Status', flex: 1, hidden: false, dataIndex: 'project_status_id', sortable: true, renderer: 
	 function(value){
             var statusStore = Ext.StoreManager.get('taskStatusStore');
	     if (undefined === statusStore) { alert('GanttTreePanel.project_status_id.render: undefined taskStatusStore'); }
             var model = statusStore.getById(value);
             var result = model.get('category');
             return result;
         },
         editor: {xtype: 'combo', store: 'taskStatusStore', displayField: 'category', valueField: 'category_id'}
	}, 
	{xtype: 'checkcolumn', header: 'Done', hidden: false, dataIndex: 'done', width: 40, stopSelection: false, editor: {xtype: 'checkbox', cls: 'x-grid-checkheader-editor'}}
    ],

    initComponent: function() {
        var me = this;
        console.log('PO.view.gantt.GantTreePanel.initComponent: Starting');
        this.callParent(arguments);

        me.store.on({
            'datachanged': me.onDataChanged,
            'scope': this
        });

        console.log('PO.view.gantt.GantTreePanel.initComponent: Finished');
    },

    onDataChanged: function(store, options, c,d,e,f) {
        var me = this;
        console.log('PO.view.gantt.GantTreePanel.onDataChange: Starting');
        console.log('PO.view.gantt.GantTreePanel.onDataChange: Finished');
    },

    /**
     * "Add" (+) button pressed.
     * Insert a new task in the position of the last selection.
     */
    onButtonAdd: function() {
        console.log('PO.view.gantt.GanttTreePanel.onButtonAdd: ');
        var me = this;
        var rowEditing = me.plugins[0];
        var taskTreeStore = me.getStore();
        var root = taskTreeStore.getRootNode();

        rowEditing.cancelEdit();
        taskTreeStore.sync();
        var selectionModel = me.getSelectionModel();
        var lastSelected = selectionModel.getLastSelected();
        var lastSelectedParent = null;

        if (null == lastSelected) {
            lastSelected = root;	 			// Use the root as the last selected node
            lastSelectedParent = root;
        } else {
            lastSelectedParent = lastSelected.parentNode;
        }

	// Create a model instance and decorate with NodeInterface
        var r = Ext.create('PO.model.timesheet.TimesheetTask', {
            project_name: "New Task",
            project_nr: "task_0018",
            parent_id: lastSelected.get('parent_id'),
            company_id: lastSelected.get('company_id'),
            start_date: new Date().toISOString().substring(0,10),
            end_date: new Date().toISOString().substring(0,10),
            percent_completed: '0',
            project_status_id: '76',
            project_type_id: '100'
        });
        var rNode = root.createNode(r);
        rNode.set('leaf', true);					// Leafs show a different icon than folders

        var appendP = false;
        if (!selectionModel.hasSelection()) { appendP = true; }
        if (root == lastSelected) { appendP = true; }
        if (lastSelected.getDepth() <= 1) { appendP = true; }			// Don't allow to add New Task before the root.
        if (appendP) {
            root.appendChild(rNode);	 				// Add the task at the end of the root
        } else {
            lastSelectedParent.insertBefore(rNode, lastSelected);	    // Insert into tree
        }

        // Start the column editor
        selectionModel.deselectAll();
        selectionModel.select([rNode]);
        rowEditing.startEdit(rNode, 0);
    },

    /**
     * "Delete" (-) button pressed.
     * Delete the currently selected task from the tree.
     */
    onButtonDelete: function() {
        console.log('PO.view.gantt.GanttTreePanel.onButtonDelete: ');
        var me = this;
        var rowEditing = me.plugins[0];
        var taskTreeStore = me.getStore();
        var selectionModel = me.getSelectionModel();
        var lastSelected = selectionModel.getLastSelected();
        var lastSelectedParent = lastSelected.parentNode;
        var lastSelectedIndex = lastSelectedParent.indexOf(lastSelected);

        rowEditing.cancelEdit();

        // Remove the selected element
        lastSelected.remove();

        // Select the next node
        var newNode = lastSelectedParent.getChildAt(lastSelectedIndex);
        if (typeof(newNode) == "undefined") {
            lastSelectedIndex = lastSelectedIndex -1;
            if (lastSelectedIndex < 0) { lastSelectedIndex = 0; }
            newNode = lastSelectedParent.getChildAt(lastSelectedIndex);
        }

        if (typeof(newNode) == "undefined") {
            // lastSelected was the last child of it's parent, so select the parent.
            selectionModel.select(lastSelectedParent);
        } else {
            newNode = lastSelectedParent.getChildAt(lastSelectedIndex);
            selectionModel.select(newNode);
        }
        
    },

    /**
     * The user has clicked below the last task.
     * We will interpret this as the request to create a new task at the end.
     */
    onContainerClick: function() {
        console.log('PO.view.gantt.GanttTreePanel.onContainerClick: ');
        var me = this;

        // Clear the selection in order to force adding the task at the bottom
        var selectionModel = me.getSelectionModel();
        selectionModel.deselectAll();

        me.onButtonAdd();
    },

    /**
     * Move the task more to the right if possible.
     *
     * Take the node just above the selected one and 
     * make this node a child of it.
     */
    onButtonIncreaseIndent: function() {
        console.log('GanttTreePanel.onButtonIncreaseIndent');
        var selectionModel = this.getSelectionModel();
        var lastSelected = selectionModel.getLastSelected();
        var lastSelectedParent = lastSelected.parentNode;
        if (null == lastSelectedParent) { return; }					// We can't indent the root element

        var lastSelectedIndex = lastSelectedParent.indexOf(lastSelected);
        var prevNodeIndex = lastSelectedIndex -1;
        if (prevNodeIndex < 0) { return; }						// We can't indent the root element

        var prevNode = lastSelectedParent.getChildAt(prevNodeIndex);

        // Remove the item from the tree
        prevNode.set('leaf', false);
        prevNode.appendChild(lastSelected);			// Add to the previous node as a child
        prevNode.expand();

        // Focus back on the task, so that it will accept the next keyboard commands
        this.getView().focusNode(lastSelected);

	// ToDo: Remove !!!
	prevNode.set('start_date', '2015-10-01');


        // ToDo: It seems the TreePanel looses focus here
        // selectionModel.select(lastSelected);
        // selectionModel.setLastFocused(lastSelected);
    },

    /**
     * Move the task more to the left if possible.
     */
    onButtonReduceIndent: function() {
        console.log('GanttTreePanel.onButtonReduceIndent');

        var selectionModel = this.getSelectionModel();
        var lastSelected = selectionModel.getLastSelected();
        var lastSelectedParent = lastSelected.parentNode;
        if (null == lastSelectedParent) { return; }					// We can't indent the root element

        var lastSelectedParentParent = lastSelectedParent.parentNode;
        if (null == lastSelectedParentParent) { return; }					// We can't indent the root element

        var lastSelectedParentIndex = lastSelectedParentParent.indexOf(lastSelectedParent);
        lastSelectedParentParent.insertChild(lastSelectedParentIndex+1, lastSelected);

        // Check if the parent has now become a leaf
        var parentNumChildren = lastSelectedParent.childNodes.length;
        if (0 == parentNumChildren) {
            lastSelectedParent.set('leaf', true);
        }

        // Focus back on the task, so that it will accept the next keyboard commands
        this.getView().focusNode(lastSelected);
    }

});

