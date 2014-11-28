/*
 * GanttTreePanel.js
 *
 * Copyright (c) 2011 - 2014 ]project-open[ Business Solutions, S.L.
 * This file may be used under the terms of the GNU General Public
 * License version 3.0 or alternatively unter the terms of the ]po[
 * FL or CL license as specified in www.project-open.org/en/license.
 */

/**
 * TreePanel with the list of tasks of a specific project.
 * This panel can be use stand alone for task editing or as
 * the left-hand side of a Gantt editor.
 */
Ext.define('PO.view.gantt.GanttTreePanel', {
    extend:				'Ext.tree.Panel',
    id:                                 'ganttTreePanel',
    alias:				'ganttTreePanel',
    title:				false,
    shrinkWrap:				true,
    animate:				false,		// Animation messes up bars on the right side
    collapsible:			false,
    useArrows:				true,
    rootVisible:			false,
    store:				'taskTreeStore',
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
    columns: [{
        text:				'Id',
        flex:				1,
        dataIndex:			'id',
        hidden:				true,
        editor: {
            allowBlank:			false
        }
    }, {
        xtype:				'treecolumn',			// This will show the tree
        text:				'Task',
        flex:				2,
        sortable:			true,
        dataIndex:			'project_name',
        editor: {
            allowBlank:			false
        }
    },{
        text:				'Parent',
        flex:				1,
        hidden:				true,
        dataIndex:			'parent_id',
        editor: {
            allowBlank:			false
        }
    },{
        text:				'SortOrder',
        flex:				1,
        hidden:				true,
        dataIndex:			'sort_order',
        hidden:				true,
        editor: {
            allowBlank:			false
        }
    },{
        text:				'Assigned To',
        flex:				1,
        hidden:				true,
        dataIndex:			'user',
        sortable:			true,
        editor: {
            allowBlank:			true
        }
    },{
        text:				'Start',
        xtype:				'datecolumn',
        format:				'Y-m-d',
        // format:			'Y-m-d H:i:s',				// 2000-01-01 00:00:00+01
        flex:				1,
        hidden:				false,
        dataIndex:			'start_date_date',
        sortable:			true,
        editor: {
            allowBlank:			false
        }
    },{
        text:				'End',
        xtype:				'datecolumn',
        format:				'Y-m-d',
        flex:				1,
        hidden:				false,
        dataIndex:			'end_date_date',
        sortable:			true,
        editor:	{
            allowBlank:			false
        }
    },{
        text:				'Status',
        flex:				1,
        hidden:				true,
        dataIndex:			'project_status_id',
        sortable:			true,
        renderer: function(value){
            var statusStore = Ext.StoreManager.get('projectStatusStore');
            var model = statusStore.getById(value);
            var result = model.get('category');
            return result;
        },
        editor: {
            xtype:			'combo',
            store:			'projectStatusStore',
            displayField:		'category',
            valueField:			'category_id',
        }
    }, {
        xtype:				'checkcolumn',
        header:				'Done',
        hidden:				true,
        dataIndex:			'done',
        width:				40,
        stopSelection:			false,
        editor: {
            xtype:			'checkbox',
            cls:			'x-grid-checkheader-editor'
        }
    }],

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

