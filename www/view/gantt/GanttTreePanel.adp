/*
 * GanttTreePanel.js
 *
 * Copyright (c) 2011 - 2014 ]project-open[ Business Solutions, S.L.
 * This file may be used under the terms of the GNU General Public
 * License version 3.0 or alternatively unter the terms of the ]po[
 * FL or CL license as specified in www.project-open.com/en/license.
 */


/**
 * Auxillary function to render the "predecessors" field of a Gantt Task
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
    rootVisible:			@project_root_visible_truefalse@,
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

    @error_tbar;noquote@						// Show error messages from TCL: Is there a better way??

    // Enable in-line row editing.
    plugins: [Ext.create('Ext.grid.plugin.CellEditing', {
        clicksToEdit: 1,
        listeners: {
            // Veto editing for certain columns and rows
            beforeedit: function(editor, context, eOpts) {
                var me = this;
                if (me.debug) console.log('PO.view.gantt.GanttTreePanel.cellediting.beforeedit');

		if (me.disabled) {
                    if (me.debug) console.log('PO.view.gantt.GanttTreePanel.cellediting.beforeedit: CellEditing is disabled, skipping...');
		    return false;
		}
		
                // switch all columns to read-only mode if the user doesn't have to right to edit the project...
                if (!write_project_p) return false;

                var model = context.record;
                var field = context.field;

                // Veto editing planned_units of parent objects except for the name.
                if (model.childNodes.length > 0) {                    // If this is a parent object with children
		    if (@non_editable_summary_activities_json;noquote@.includes(field)) { return false; }
                }
                return true;
            },
            // Invalid values values from the editor may cause "save" operations to fail.
            validateedit: function(editor, context, eOpts) {
                var me = this;
                if (me.debug) console.log('PO.view.gantt.GanttTreePanel.cellediting.validateedit');
                var field = context.field;
                var value = context.value;

                // Veto any null values.
                if (value == null) { return false; }

                // project_name should not be an empty string.
                if ("project_name" == field && "" == value.trim()) { return false; }

                // Check date fields. JS converts funky input into invalid dates...
                if ("start_date" == field || "end_date" == field) {
                    var d = value.split('-');
                    var year = parseInt(d[0]), month = parseInt(d[1])-1, day = parseInt(d[2]);
                    var date = new Date(year, month, day, 0, 0, 0, 0);
                    
                    if (!date) return false;
                    if (date.getFullYear() != year) return false;
                    if (date.getMonth() != month) return false;
                    if (date.getDate() != day) return false;
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
*/

        {text: 'System Id', flex: 0, width: 40, dataIndex: 'id', hidden: true, debug: true }, 
        {text: 'System Parent', flex: 0, width: 40, dataIndex: 'parent_id', hidden: true, debug: true},
        {text: 'SortOrder', flex: 0, width: 40, dataIndex: 'sort_order', hidden: true, editor: {
            xtype: 'numberfield',
            minValue: 0
        }, debug: true},
        {text: 'tPreds', dataIndex: 'transPreds', width: 60, hidden: true, editor: false,
         renderer: function(v, context, model, d, e) {
             var preds = "";
             for (var predId in model.transPreds) {
                var predModel = model.transPreds[predId];
                var predSortOrder = predModel.get('sort_order');
                if ("" != preds) preds = preds+";";
                preds = preds+(predSortOrder || predId);
             }
             return preds;
        }, debug: true},
        {text: 'tSuccs', dataIndex: 'transSuccs', width: 60, hidden: true, editor: false,
         renderer: function(v, context, model, d, e) {
             var succs = "";
             for (var succId in model.transSuccs) {
                 var succModel = model.transSuccs[succId];
                 var succSortOrder = succModel.get('sort_order');
                 if ("" != succs) succs = succs+";";
                 succs = succs+(succSortOrder || succId);
             }
             return succs;
        }, debug: true},
        {text: 'tParents', dataIndex: 'transParents', width: 60, hidden: true, editor: false,
         renderer: function(v, context, model, d, e) {
             var parents = "";
             for (var parentId in model.transParents) {
                 var parentModel = model.transParents[parentId];
                 if ("" != parents) parents = parents+";";
                 parents = parents+(parentModel.get('sort_order') || parentId);
             }
             return parents;
        }, debug: true},

        {text: 'Task', stateId: 'treegrid-task', xtype: 'treecolumn', flex: 2, sortable: true, dataIndex: 'project_name', 
         editor: true, 
         getSortParam: function() {
             return 'sort_order';
         },
         renderer: function(v, context, model, d, e) {
            context.style = 'cursor: pointer;'; 
            var children = model.childNodes;
            if (0 == children.length) { return model.get('project_name'); } else { return "<b>"+model.get('project_name')+"</b>"; }
        }},
        {text: 'Work', stateId: 'treegrid-work', width: 55, align: 'right', dataIndex: 'planned_units', hidden: true,
         editor: { xtype: 'numberfield', minValue: 0 }, 
         renderer: function(value, context, model) {			// Calculate the UoM unit
            var planned_units = model.get('planned_units');
            if (0 == model.childNodes.length) {				// A leaf task - just show the units
                if ("" == planned_units) return "";
                var pu = parseFloat(planned_units);
                if ("number" == typeof pu) { planned_units = Math.round(100.0 * pu) / 100.0 }
                if ("" != planned_units) { planned_units = planned_units + "h"; }
                return planned_units;
            } else {							// A parent node - sum up the planned units of all leafs.
                var plannedUnits = 0.0;
                model.cascadeBy(function(child) {
                    if (0 == child.childNodes.length) {                 // Only consider leaf tasks
                        var puString = child.get('planned_units');
                        if ("" == puString) return;
                        var pu = parseFloat(puString);
                        if ("number" == typeof pu) plannedUnits = plannedUnits + pu;
                    }
                });
                var pu = parseFloat(plannedUnits);
                if ("number" == typeof pu) { plannedUnits = Math.round(100.0 * pu) / 100.0 }
                return "<b>"+plannedUnits+"h</b>";
            }
        }},
        {text: 'Billable Hours', stateId: 'treegrid-work', width: 55, align: 'right', dataIndex: 'billable_units', hidden: true,
         editor: { xtype: 'numberfield', minValue: 0 }, 
         renderer: function(value, context, model) {
            // Calculate the UoM unit
            var billable_units = model.get('billable_units');
            if (0 == model.childNodes.length) {                         // A leaf task - just show the units
                if ("" != billable_units) { billable_units = billable_units + "h"; }
                return billable_units;
            } else {                                                    // A parent node - sum up the billable units of all leafs.
                var billableUnits = 0.0;
                model.cascadeBy(function(child) {
                    if (0 == child.childNodes.length) {                 // Only consider leaf tasks
                        var puString = child.get('billable_units');
                        if ("" == puString) return;
                        var pu = parseFloat(puString);
                        if ("number" == typeof pu) billableUnits = billableUnits + pu; 
                    }
                });
                return "<b>"+billableUnits+"h</b>";
            }
        }},
        {text: 'Logged Hours', stateId: 'treegrid-logged-hours', width: 55, align: 'right', dataIndex: 'logged_hours', hidden: true, sortable: false},
        {text: 'Done %', stateId: 'treegrid-done', width: 50, align: 'right', dataIndex: 'percent_completed', hidden: true,
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
        {text: 'Start', stateId: 'treegrid-start', width: 80, hidden: true, dataIndex: 'start_date',
         editor: 'podatefield', 
         renderer: function(value, context, model) {
            var isLeaf = (0 == model.childNodes.length);
            if (isLeaf) { return value.substring(0,10); } else { return "<b>"+value.substring(0,10)+"</b>"; }
        }},
        {text: 'End', stateId: 'treegrid-end', width: 80, hidden: true, dataIndex: 'end_date',
         editor: 'podatefield', 
         renderer: function(value, context, model) {
            var isLeaf = (0 == model.childNodes.length);
            if (isLeaf) { return value.substring(0,10); } else { return "<b>"+value.substring(0,10)+"</b>"; }
        }},
        {text: 'Resources', stateId: 'treegrid-resources', flex: 1, hidden: true, dataIndex: 'assignees', 
         editor: 'potaskassignment', 
         renderer: function(value, context, model) {
            var isLeaf = (0 == model.childNodes.length);
            var result = PO.view.field.POTaskAssignment.formatAssignments(value);
            if (isLeaf) { return result; } else { return "<b>"+result+"</b>"; }
        }},

        {text: 'Predecessors', dataIndex: 'predecessors', width: 60, hidden: true, editor: false,
         renderer: function(v, context, model, d, e) {
             var preds = "";
             var rootNode = model.store.tree.root;
             var predecessors = model.get('predecessors');
             if (!predecessors instanceof Array) return "invalid";

             for (var i = 0, len = predecessors.length; i < len; i++) {
                 var dependencyModel = predecessors[i];
                 var predId = ''+dependencyModel.pred_id;		// a string!
                 var predModel = rootNode.findChild('id', predId, true);
                 if (!predModel) return "invalid predMode for id="+predId;
                 if (predModel) predId = predModel.get('sort_order');
                 if (i > 0) preds = preds+';';
                 preds = preds+predId;
             }
             return preds;
        }},


/*
        {text: 'Predecessors', stateId: 'treegrid-predecessors', flex: 1, hidden: true, dataIndex: 'predecessors', 
         renderer: ganttTreePanelPredecessorRenderer
        },
*/
        {text: 'CostCenter', stateId: 'treegrid-costcenter', flex: 1, hidden: true, dataIndex: 'cost_center_id', sortable: false,
         editor: {
             xtype: 'combobox',
             forceSelection: true,
             allowBlank: false,
             editable: false,
             store: 'taskCostCenterStore',
             displayField: 'cost_center_name', 
             valueField: 'cost_center_id',
             matchFieldWidth: false
         },
         renderer: function(value) {
             if ("" == value) return "";
             var ccStore = Ext.StoreManager.get('taskCostCenterStore');
             var model = ccStore.getById(value);
             if (!model) return "Cost Center #"+value;
             return model.get('cost_center_name');
        }},
        {text: 'Description', stateId: 'treegrid-description', flex: 1, hidden: true, dataIndex: 'description', editor: {allowBlank: true}},
        {text: 'Material', stateId: 'treegrid-material', flex: 1, hidden: true, dataIndex: 'material_id', sortable: false,
         editor: {
             xtype: 'combobox',
             forceSelection: true,
             allowBlank: false,
             editable: false,
             store: 'taskMaterialStore',
             displayField: 'material_name', 
             valueField: 'id',
             typeAhead: true,
             matchFieldWidth: false
         },
         renderer: function(value) {
             if ("" == value) return "";
             var materialStore = Ext.StoreManager.get('taskMaterialStore');
             var model = materialStore.getById(value);
             if (!model) return "Material #"+value;
             return model.get('material_name');
        }},
        {text: 'Prio', stateId: 'treegrid-prio', flex: 0, width: 40, dataIndex: 'priority', hidden: true, 
         editor: { xtype: 'numberfield', minValue: 0, maxValue: 1000 }
        },
        {
            text: 'Status',
            stateId: 'treegrid-status',
            flex: 1,
            hidden: true,
            dataIndex: 'project_status_id',
            sortable: false,
            editor: {
                xtype: 'combobox',
                forceSelection: true,
                allowBlank: false,
                editable: false,
                store: Ext.create('Ext.data.Store', {
                    fields: ['id', 'category'],
                    data: [{id: "76", category: "Open"},{id: "81", category: "Closed"}]
                }),
                displayField: 'category', 
                valueField: 'id'
            }, 
            renderer: function(value) {
                if ("" == value) return "";
                var statusStore = Ext.StoreManager.get('taskStatusStore');
                var model = statusStore.getById(value);
                if (!model) return "Status #"+value;
                return model.get('category');
            }
        },
        {text: 'Project Nr', stateId: 'treegrid-nr', flex: 1, dataIndex: 'project_nr', hidden: true, sortable: false, editor: true},
        {text: 'WBS', stateId: 'treegrid-wbs', flex: 1, dataIndex: 'project_wbs', hidden: true, sortable: false, editor: true},
        {header: 'Effort Driven?', stateId: 'treegrid-effort-driven-p', flex: 0, width: 40, 
         dataIndex: 'effort_driven_p', 
         hidden: true, sortable: false
//         ,editor: { xtype: 'checkbox', uncheckedValue: 'f', inputValue: 't'}
        },
        {text: 'Scheduling Type', stateId: 'treegrid-effort-driven-type', flex: 1, hidden: true, dataIndex: 'effort_driven_type_id', sortable: false,
         editor: {
             xtype: 'combobox',
             forceSelection: true,
             allowBlank: false,
             editable: false,
             store: Ext.create('Ext.data.Store', {
                 fields: ['id', 'category'],
                 data: [{id: "9720", category: "Fixed Units"}, {id: "9721", category: "Fixed Duration"}, {id: "9722", category: "Fixed Work"}]
             }),
             displayField: 'category', 
             valueField: 'id'
         }, 
         renderer: function(value) {
             switch (value) {
                 case '9720': return "Fixed Units";
                 case '9721': return "Fixed Duration";
                 case '9722': return "Fixed Work";
                 default: return value;
             }
        }}

        // DynFields
<multiple name=dynfields>
        ,{text: '@dynfields.pretty_name@', stateId: 'treegrid-@dynfields.name@', flex: 1, dataIndex: '@dynfields.name@', hidden: true, sortable: false @dynfields.editor;noquote@ @dynfields.renderer;noquote@}
</multiple>

    ],

    listeners: {
        // Open task property panel on double-click
        beforeitemdblclick: function(view, record, item, index, e, eOpts) { 
            var me = this;
            if (me.debug) console.log('PO.view.gantt.GanttTreePanel.beforeItemDblClick');
            var taskPropertyPanel = Ext.getCmp('ganttTaskPropertyPanel');
	    if (!taskPropertyPanel) {
		console.log('PO.view.gantt.GanttTreePanel.beforeItemDblClick: No ganttTaskPropertyPanel found - skipping');
		return;
	    }
            taskPropertyPanel.setValue(record);
            taskPropertyPanel.setActiveTab('taskPropertyFormGeneral');
            taskPropertyPanel.show();
            return false;                                            // Cancel default action
        }, 

        // Workaround a bug in Sencha ExtJS 4.2, where columns don't get an editor
        // when being shown after the initial setup. Sencha forgets to add editors
        // after enabling the columns...
        columnshow: function(ct, column, eOpts) {
            var me = this;
            if (me.debug) console.log('PO.view.gantt.GanttTreePanel.columnshow: Starting');

            var cellEditor = me.findPlugin('cellediting');

            if (!column.getEditor) {
                column.getEditor = function(record, defaultField) { 
                    return cellEditor.getColumnField(this, defaultField); 
                };
            }

            if (!column.hasEditor) {
                column.hasEditor = function() { 
                    return cellEditor.hasColumnField(this); 
                };
            }

            if (!column.setEditor) {
                column.setEditor = function(field) { 
                    cellEditor.setColumnField(this, field); 
                };
            }

            if (me.debug) console.log('PO.view.gantt.GanttTreePanel.columnshow: Finished');
        }
    },

    initComponent: function() {
        var me = this;
        if (me.debug) console.log('PO.view.gantt.GantTreePanel.initComponent: Starting');

        // Completely remove columns marked with debug=true, unless in debug mode.
        if (!me.debug) {
            for (var i = me.columns.length-1; i >= 0; i--) { if ( me.columns[i].debug) me.columns.splice(i,1); }
        }

        // un-hide those columns that are enabled by system parameter
        var defaultColumns = @default_columns_json;noquote@;
        for (var i = me.columns.length-1; i >= 0; i--) { 
            var dataIndex = me.columns[i].dataIndex;
            if (defaultColumns[dataIndex]) 
                me.columns[i].hidden = false;
        }

        this.callParent(arguments);

        if (me.debug) console.log('PO.view.gantt.GantTreePanel.initComponent: Finished');
    }

});

