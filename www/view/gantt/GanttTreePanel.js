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
    title:				'Projects',
    width:				500,
    height:				300,
    region:				'west',
    shrinkWrap:				true,
    animate:				false,		// Animation messes up bars on the right side
    collapsible:			true,
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
        dataIndex:			'start_date',
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

    listeners: {
        'selectionchange': function(view, records) {
            if (1 == records.length) {
                // Exactly one record enabled
                var record = records[0];
                this.down('#removeTask').setDisabled(!record.isLeaf());
            } else {
                // Zero or two or more records enabled
                this.down('#removeTask').setDisabled(true);
            }
        }
    },

    // Toolbar for adding and deleting tasks
    tbar: [{
        text:				'Add Task',
        iconCls:			'task-add',
        handler : function() {
            rowEditing.cancelEdit();

            // Create a model instance 
            var r = Ext.create('PO.model.timesheet.TimesheetTask', {
                project_name: "New Task",
                project_nr: "task_0018",
                parent_id: "709261",
                company_id: "500633",
                start_date: "2013-09-19 12:00:00+02",
                end_date: "2013-09-20 12:00:00+02",
                percent_completed: "0",
                project_status_id: "76",
                project_type_id: "100"
            });

            taskTreeStore.sync();
            var selectionModel = tree.getSelectionModel();
            var lastSelected = selectionModel.getLastSelected();

            // ToDo: Appending the new task at the lastSelected does't work for some reasons.
            // Also, the newly added task should be a "task" and not a folder.
            var root = taskTreeStore.getRootNode();
            // root.appendChild(r);
            lastSelected.appendChild(r);
        }
    }, {
        itemId:				'removeTask',
        text:				'Remove Task',
        iconCls:			'task-remove',
        handler: function() {
            rowEditing.cancelEdit();
            var selectionModel = tree.getSelectionModel();
            var lastSelected = selectionModel.getLastSelected();
            var parent = lastSelected.parentNode;
            var lastSelectedIndex = parent.indexOf(lastSelected);

            // Remove the selected element
            lastSelected.remove();

            var newNode = parent.getChildAt(lastSelectedIndex);
            if (typeof(newNode) == "undefined") {
                lastSelectedIndex = lastSelectedIndex -1;
                if (lastSelectedIndex < 0) { lastSelectedIndex = 0; }
                newNode = parent.getChildAt(lastSelectedIndex);
            }

            if (typeof(newNode) == "undefined") {
                // lastSelected was the last child of it's parent, so select the parent.
                selectionModel.select(parent);
            } else {
                newNode = parent.getChildAt(lastSelectedIndex);
                selectionModel.select(newNode);
            }

        },
        disabled:			true
    }],

    onButtonAdd: function() {
	console.log('PO.view.gantt.GanttTreePanel.onButtonAdd: ');
	var me = this;
	var rowEditing = me.plugins[0];
	var taskTreeStore = me.getStore();

        rowEditing.cancelEdit();

        // Create a model instance 
        var r = Ext.create('PO.model.timesheet.TimesheetTask', {
            project_name: "New Task",
            project_nr: "task_0018",
            parent_id: "709261",
            company_id: "500633",
            start_date: "2013-09-19 12:00:00+02",
            end_date: "2013-09-20 12:00:00+02",
            percent_completed: "0",
            project_status_id: "76",
            project_type_id: "100",
	    iconCls: 'task!!!'
        });

        taskTreeStore.sync();
        var selectionModel = me.getSelectionModel();
        var lastSelected = selectionModel.getLastSelected();
	var lastSelectedParent = lastSelected.parentNode;

        // ToDo: Appending the new task at the lastSelected does't work for some reasons.
        // Also, the newly added task should be a "task" and not a folder.
        var root = taskTreeStore.getRootNode();
	var rNode = root.createNode(r);
	lastSelectedParent.insertBefore(rNode, lastSelected);

	selectionModel.deselectAll();
	selectionModel.select([rNode]);

	rowEditing.startEdit(rNode, 0);

        // root.appendChild(r);
        // lastSelected.appendChild(r);
    }
});

