/*
 * GanttTreePanel.js
 *
 * Copyright (c) 2011 - 2014 ]project-open[ Business Solutions, S.L.
 * This file may be used under the terms of the GNU General Public
 * License version 3.0 or alternatively unter the terms of the ]po[
 * FL or CL license as specified in www.project-open.com/en/license.
 */


var ganttTreePanelPredecessorRenderer =	function(value) {
    console.log('PO.view.gantt.GantTreePanel.predecessors.renderer: value='+value);
    if (!value instanceof Array) return;
    
    var taskTreeStore = Ext.StoreManager.get('taskTreeStore');
    var result = "";
    for (var i = 0; i < value.length; i++) {
        var pred_id = value[i].pred_id;
        var predModel = taskTreeStore.getById(pred_id);
        if (predModel) {
            if (result != "") { result = result + ", "; }
            result = result + predModel.get('project_name');
        }
    }
    console.log('PO.view.gantt.GantTreePanel.predecessors.renderer: result='+result);
    return result;
};


/**
 * TreePanel with the list of tasks of a specific project.
 * This panel can be use stand alone for task editing or as
 * the left-hand side of a Gantt editor.
 */
Ext.define('PO.view.gantt.GanttTreePanel', {
    extend:				'Ext.tree.Panel',
    requires: ['PO.view.field.PODateField'],				// Custom ]po[ data field for PostgreSQL timestamptz data

    alias:				'ganttTreePanel',
    animate:				false,				// Animation messes up bars on the right side
    collapsible:			false,
    multiSelect:			true,
    rootVisible:			false,
    singleExpand:			false,
    shrinkWrap:				false,
    title:				false,
    useArrows:				true,

    // Scrolling
    overflowX: 'scroll',						// Allows for horizontal scrolling, but not vertical...
    scrollFlags: {x: true},						// ... vertical scrolling is handled by the GanttTree
    
    // ToDo: Remove(?)
    projectMembers:    "test",

    // Stateful collapse/expand
    stateful : true,
    stateId : 'ganttTreePanel',
    saveDelay: 0,							// Workaround: Delayed saving doesn't work on Ext.tree.Panel

    // Enable in-line row editing.
    plugins: [Ext.create('Ext.grid.plugin.CellEditing', {
        clicksToEdit: 1,
        listeners: {
            // Veto editing for certain columns and rows
            beforeedit: function(editor, context, eOpts) {
                var me = this;
                if (me.debug) console.log('PO.view.gantt.GanttTreePanel.cellediting.beforeedit');
                var model = context.record;
                var field = context.field;

                // Veto editing planned_units for objects of type "im_project":
                if ("planned_units" == field && "im_project" == model.get('object_type')) { return false; }

                // Veto editing properties of parent objects except for the name.
                if (model.childNodes.length > 0) {                    // If this is a parent object with children
                    if ("project_name" != field) { return false; }    // ONLY the project_name is editable
                }
                return true;
            }
        }
    })],

    // Enabled drag-and-drop for the tree. Yes, that's all...
    viewConfig: {
        plugins: {
            ptype: 'treeviewdragdrop',
            containerScroll: true
        }
    },

    // the 'columns' property is now 'headers'
    columns: [
/*
        {text: 'I', xtype: 'actioncolumn', dataIndex: 'project_id', width: 30, items: [{
            icon: '/intranet/images/navbar_default/information.png',
            // tooltip: 'Link',
            handler: function(grid, rowIndex, colIndex) {
                var me = this;
                if (me.debug) console.log('GanttTreePanel: column=Link: rowIndex='+rowIndex);
                var rec = grid.getStore().getAt(rowIndex);
                var taskPropertyPanel = Ext.getCmp('ganttTaskPropertyPanel');
                taskPropertyPanel.setValue(rec);
                taskPropertyPanel.setActiveTab('taskPropertyFormGeneral');
                taskPropertyPanel.show();
            }
        }]},
        {text: 'Parent', flex: 0, width: 40, dataIndex: 'parent_id', hidden: true, editor: {
            xtype: 'numberfield',
            minValue: 0            
        }}, 
        {text: 'Sort Order', flex: 0, width: 40, dataIndex: 'sort_order', hidden: true, editor: {
            xtype: 'numberfield',
            minValue: 0            
        }},
*/
        {text: 'Task', stateId: 'treegrid-task', xtype: 'treecolumn', flex: 2, sortable: true, dataIndex: 'project_name', 
         editor: true, 
	 renderer: function(v, context, model, d, e) {
            context.style = 'cursor: pointer;'; 
            var children = model.childNodes;
            if (0 == children.length) { return model.get('project_name'); } else { return "<b>"+model.get('project_name')+"</b>"; }
        }},
        {text: 'Work', stateId: 'treegrid-work', width: 55, align: 'right', dataIndex: 'planned_units', 
	 editor: { xtype: 'numberfield', minValue: 0 }, 
	 renderer: function(value, context, model) {
            // Calculate the UoM unit
            var planned_units = model.get('planned_units');
            if (0 == model.childNodes.length) {
                // A leaf task - just show the units
                if ("" != planned_units) { planned_units = planned_units + "h"; }
                return planned_units;
            } else {
                // A parent node - sum up the planned units of all leafs.
                var plannedUnits = 0.0;
                model.cascadeBy(function(child) {
                    if (0 == child.childNodes.length) {                 // Only consider leaf tasks
                        var puString = child.get('planned_units');
                        if ("" != puString) {
                            var pu = parseFloat(puString);
                            if ("number" == typeof pu) { 
				plannedUnits = plannedUnits + pu; 
			    }
                        }
                    }
                });
                return "<b>"+plannedUnits+"h</b>";
            }
        }},
        {text: 'Done %', stateId: 'treegrid-done', width: 50, align: 'right', dataIndex: 'percent_completed', 
	 editor: { xtype: 'numberfield', minValue: 0, maxValue: 100 }, 
	 renderer: function(value, context, model) {
            var percent_completed = model.get('percent_completed');
            var isLeaf = (0 == model.childNodes.length);
            if (0 == model.childNodes.length) {                                // A leaf task - just show the units
                if ("" != percent_completed) { percent_completed = percent_completed + "%"; }
                return percent_completed;
            } else {                                                    // A parent node - sum up the planned units of all leafs.
                var plannedUnits = 0.0
                var completedUnits = 0.0;
                model.cascadeBy(function(child) {
                    if (0 == child.childNodes.length) {                 // Only consider leaf tasks
                        var plannedString = child.get('planned_units');
                        var completedString = child.get('percent_completed');
                        if (!plannedString || !completedString || "" == plannedString || "" == completedString) { return; }
                        plannedUnits = plannedUnits + parseFloat(plannedString);
                        completedUnits = completedUnits + parseFloat(plannedString) * parseFloat(completedString) / 100;
                    }
                });
                var done = "";
                if (0 != plannedUnits) { done = ""+Math.floor(100.0 * completedUnits / plannedUnits); }
                if ("" != done) { done = done + "%"; }
                return "<b>"+done+"</b>";
            }
        }},
        {text: 'Start', stateId: 'treegrid-start', width: 80, hidden: false, dataIndex: 'start_date',
         editor: 'podatefield', 
	 renderer: function(value, context, model) {
            var isLeaf = (0 == model.childNodes.length);
            if (isLeaf) { return value.substring(0,10); } else { return "<b>"+value.substring(0,10)+"</b>"; }
        }},
        {text: 'End', stateId: 'treegrid-end', width: 80, hidden: false, dataIndex: 'end_date',
         editor: 'podatefield', 
	 renderer: function(value, context, model) {
            var isLeaf = (0 == model.childNodes.length);
            if (isLeaf) { return value.substring(0,10); } else { return "<b>"+value.substring(0,10)+"</b>"; }
        }},
        {text: 'Resources', stateId: 'treegrid-resources', flex: 1, hidden: false, dataIndex: 'assignees', 
	 editor: 'potaskassignment', 
	 renderer: function(value, context, model) {
            var isLeaf = (0 == model.childNodes.length);
            var result = PO.view.field.POTaskAssignment.formatAssignments(value);
            if (isLeaf) { return result; } else { return "<b>"+result+"</b>"; }
        }},
	
        {text: '', stateId: 'treegrid-empty', flex: 1, hidden: true},

        {text: 'CostCenter', stateId: 'treegrid-costcenter', flex: 1, hidden: true, dataIndex: 'cost_center_id', sortable: true,
         editor: {
	     xtype: 'combobox',
	     forceSelection: true,
	     allowBlank: false,
	     store: 'taskCostCenterStore',
	     displayField: 'cost_center_name', 
	     valueField: 'cost_center_id'
	 },
	 renderer: function(value) {
             var ccStore = Ext.StoreManager.get('taskCostCenterStore');
             var model = ccStore.getById(value);
             return model.get('cost_center_name');
        }},
        {text: 'Description', stateId: 'treegrid-description', flex: 1, hidden: true, dataIndex: 'description', editor: {allowBlank: true}},
        {text: 'Material', stateId: 'treegrid-material', flex: 1, hidden: true, dataIndex: 'material_id', sortable: true,
         editor: {
	     xtype: 'combobox',
	     forceSelection: true,
	     allowBlank: false,
	     store: 'taskMaterialStore',
	     displayField: 'material_name', 
	     valueField: 'id'
	 },
	 renderer: function(value) {
             var materialStore = Ext.StoreManager.get('taskMaterialStore');
             var model = materialStore.getById(value);
             return model.get('material_name');
        }},
        {text: 'Nr', stateId: 'treegrid-nr', flex: 1, dataIndex: 'project_nr', hidden: true}, 
        {text: 'Predecessors', stateId: 'treegrid-predecessors', flex: 1, hidden: true, dataIndex: 'predecessors', 
	 renderer: ganttTreePanelPredecessorRenderer
	},
        {text: 'Prio', stateId: 'treegrid-prio', flex: 0, width: 40, dataIndex: 'priority', hidden: true, 
	 editor: { xtype: 'numberfield', minValue: 0, maxValue: 1000 }
	},
        {text: 'Status', stateId: 'treegrid-status', flex: 1, hidden: true, dataIndex: 'project_status_id', sortable: true,
         editor: {
	     xtype: 'combobox',
	     forceSelection: true,
	     allowBlank: false,
	     store: Ext.create('Ext.data.Store', {
		 fields: ['id', 'category'],
		 data : [{id: "76", category: "Open"},{id: "81", category: "Closed"}]
	     }),
	     displayField: 'category', 
	     valueField: 'id'
	 }, 
	 renderer: function(value) {
             var statusStore = Ext.StoreManager.get('taskStatusStore');
             var model = statusStore.getById(value);
             return model.get('category');
        }}
    ],

    listeners: {
	// Open up 
        beforeitemdblclick: function(view, record, item, index, e, eOpts) { 
            var me = this;
            if (me.debug) console.log('PO.view.gantt.GanttTreePanel.beforeItemDblClick');
            var taskPropertyPanel = Ext.getCmp('ganttTaskPropertyPanel');
            taskPropertyPanel.setValue(record);
            taskPropertyPanel.setActiveTab('taskPropertyFormGeneral');
            taskPropertyPanel.show();
	    return false;                                            // Cancel default action
	}
    },

    initComponent: function() {
        var me = this;
        if (me.debug) console.log('PO.view.gantt.GantTreePanel.initComponent: Starting');
        this.callParent(arguments);
        if (me.debug) console.log('PO.view.gantt.GantTreePanel.initComponent: Finished');
    }

});

