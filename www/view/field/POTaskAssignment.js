/*
 * POTaskAssignment.js
 *
 * Copyright (c) 2011 - 2014 ]project-open[ Business Solutions, S.L.
 * This file may be used under the terms of the GNU General Public
 * License version 3.0 or alternatively unter the terms of the ]po[
 * FL or CL license as specified in www.project-open.com/en/license.
 */


/**
 * Custom version of CellEditing with a single additional line.
 * I found no better way to inject this single line yet...
 */
Ext.define('MyCellEditing', {
    extend: 'Ext.grid.plugin.Editing',
    lockableScope: 'both',

    init: function(grid) {
        var me = this,
            lockingPartner = me.lockingPartner;

        me.callParent(arguments);

        // Share editor apparatus with lockingPartner becuse columns may move from side to side
        if (lockingPartner) {
            if (lockingPartner.editors) {
                me.editors = lockingPartner.editors;
            } else {
                me.editors = lockingPartner.editors = new Ext.util.MixedCollection(false, function(editor) {
                    return editor.editorId;
                });
            }
        } else {
            me.editors = new Ext.util.MixedCollection(false, function(editor) {
                return editor.editorId;
            });
        }
    },

    onReconfigure: function(grid, store, columns){
        // Only reconfigure editors if passed a new set of columns
        if (columns) {
            this.editors.clear();
        }
        this.callParent();    
    },

    /**
     * @private
     * AbstractComponent calls destroy on all its plugins at destroy time.
     */
    destroy: function() {
        var me = this;
        if (me.editors) {
            me.editors.each(Ext.destroy, Ext);
            me.editors.clear();
        }
        me.callParent(arguments);
    },

    onBodyScroll: function() {
        var me = this,
            ed = me.getActiveEditor(),
            scroll = me.view.el.getScroll();

        // Scroll happened during editing...
        // If editing is on the other side of a lockable, then ignore it
        if (ed && ed.editing && ed.editingPlugin === me) {
            // Terminate editing only on vertical scroll. Horiz scroll can be caused by tabbing between cells.
            if (scroll.top !== me.scroll.top) {
                if (ed.field) {
                    if (ed.field.triggerBlur) {
                        ed.field.triggerBlur();
                    } else {
                        ed.field.blur();
                    }
                }
            }
            // Horiz scroll just requires that the editor be realigned.
            else {
                ed.realign();
            }
        }
        me.scroll = scroll;
    },

    // @private
    // Template method called from base class's initEvents
    initCancelTriggers: function() {
        var me   = this,
            grid = me.grid,
            view = grid.view;

        me.mon(view, 'bodyscroll', me.onBodyScroll, me);
        me.mon(grid, {
            columnresize: me.cancelEdit,
            columnmove: me.cancelEdit,
            scope: me
        });
    },

    isCellEditable: function(record, columnHeader) {
        var me = this,
            context = me.getEditingContext(record, columnHeader);

        if (me.grid.view.isVisible(true) && context) {
            columnHeader = context.column;
            record = context.record;
            if (columnHeader && me.getEditor(record, columnHeader)) {
                return true;
            }
        }
    },

    startEdit: function(record, columnHeader, /* private */ context) {
        var me = this,
            ed;

	me.view.componentLayoutCounter = 1;  // Hack: Simulate LayoutManager: Otherwise no editor will be shown

        if (!context) {
            me.preventBeforeCheck = true;
            context = me.callParent(arguments);
            delete me.preventBeforeCheck;
            if (context === false) {
                return false;
            }
        }

        // Cancel editing if EditingContext could not be found (possibly because record has been deleted by an intervening listener),
        // or if the grid view is not currently visible
        if (context && me.grid.view.isVisible(true)) {

            record = context.record;
            columnHeader = context.column;

            // Complete the edit now, before getting the editor's target cell DOM element.
            // Completing the edit hides the editor, causes a row update and sets up a delayed focus on the row.
            // Also allows any post-edit events to take effect before continuing
            me.completeEdit();

            // See if the field is editable for the requested record
            if (columnHeader && !columnHeader.getEditor(record)) {
                return false;
            }

            // Switch to new context *after* completing the current edit
            me.context = context;

            context.originalValue = context.value = record.get(columnHeader.dataIndex);
            
            if (me.beforeEdit(context) === false || me.fireEvent('beforeedit', me, context) === false || context.cancel) {
                return false;
            }

            ed = me.getEditor(record, columnHeader);

            // Whether we are going to edit or not, ensure the edit cell is scrolled into view
            me.grid.view.cancelFocus();
            me.view.scrollCellIntoView(me.getCell(record, columnHeader));
            if (ed) {
                me.showEditor(ed, context, context.value);
                return true;
            }
            return false;
        }
    },

    showEditor: function(ed, context, value) {
        var me = this,
            record = context.record,
            columnHeader = context.column,
            sm = me.grid.getSelectionModel(),
            selection = sm.getCurrentPosition(),
            otherView = selection && selection.view;

        // Selection is for another view.
        // This can happen in a lockable grid where there are two grids, each with a separate Editing plugin
        if (otherView && otherView !== me.view) {
            return me.lockingPartner.showEditor(ed, me.lockingPartner.getEditingContext(selection.record, selection.columnHeader), value);
        }

        me.setEditingContext(context);
        me.setActiveEditor(ed);
        me.setActiveRecord(record);
        me.setActiveColumn(columnHeader);

        // Select cell on edit only if it's not the currently selected cell
        if (sm.selectByPosition && (!selection || selection.column !== context.colIdx || selection.row !== context.rowIdx)) {
            sm.selectByPosition({
                row: context.rowIdx,
                column: context.colIdx,
                view: me.view
            });
        }

        ed.startEdit(me.getCell(record, columnHeader), value, context);
        me.editing = true;
        me.scroll = me.view.el.getScroll();
    },

    completeEdit: function() {
        var activeEd = this.getActiveEditor();
        if (activeEd) {
            activeEd.completeEdit();
            this.editing = false;
        }
    },

    // internal getters/setters
    setEditingContext: function(context) {
        this.context = context;
        if (this.lockingPartner) {
            this.lockingPartner.context = context;
        }
    },

    setActiveEditor: function(ed) {
        this.activeEditor = ed;
        if (this.lockingPartner) {
            this.lockingPartner.activeEditor = ed;
        }
    },

    getActiveEditor: function() {
        return this.activeEditor;
    },

    setActiveColumn: function(column) {
        this.activeColumn = column;
        if (this.lockingPartner) {
            this.lockingPartner.activeColumn = column;
        }
    },

    getActiveColumn: function() {
        return this.activeColumn;
    },

    setActiveRecord: function(record) {
        this.activeRecord = record;
        if (this.lockingPartner) {
            this.lockingPartner.activeRecord = record;
        }
    },

    getActiveRecord: function() {
        return this.activeRecord;
    },

    getEditor: function(record, column) {
        var me = this,
            editors = me.editors,
            editorId = column.getItemId(),
            editor = editors.getByKey(editorId),
            // Add to top level grid if we are editing one side of a locking system
            editorOwner = me.grid.ownerLockable || me.grid;

        if (!editor) {
            editor = column.getEditor(record);
            if (!editor) {
                return false;
            }

            // Allow them to specify a CellEditor in the Column
            if (editor instanceof Ext.grid.CellEditor) {
                editor.floating = true;
            }
            // But if it's just a Field, wrap it.
            else {
                editor = new Ext.grid.CellEditor({
                    floating: true,
                    editorId: editorId,
                    field: editor
                });
            }
            // Add the Editor as a floating child of the grid
            editorOwner.add(editor);
            editor.on({
                scope: me,
                specialkey: me.onSpecialKey,
                complete: me.onEditComplete,
                canceledit: me.cancelEdit
            });
            column.on('removed', me.cancelActiveEdit, me);
            editors.add(editor);
        }

        if (column.isTreeColumn) {
            editor.isForTree = column.isTreeColumn;
            editor.addCls(Ext.baseCSSPrefix + 'tree-cell-editor')
        }
        editor.grid = me.grid;
        
        // Keep upward pointer correct for each use - editors are shared between locking sides
        editor.editingPlugin = me;
        return editor;
    },
    
    cancelActiveEdit: function(column){
        var context = this.context
        if (context && context.column === column) {
            this.cancelEdit();
        }   
    },
    
    // inherit docs
    setColumnField: function(column, field) {
        var ed = this.editors.getByKey(column.getItemId());
        Ext.destroy(ed, column.field);
        this.editors.removeAtKey(column.getItemId());
        this.callParent(arguments);
    },

    /**
     * Gets the cell (td) for a particular record and column.
     * @param {Ext.data.Model} record
     * @param {Ext.grid.column.Column} column
     * @private
     */
    getCell: function(record, column) {
        return this.grid.getView().getCell(record, column);
    },

    onSpecialKey: function(ed, field, e) {
        var sm;
 
        if (e.getKey() === e.TAB) {
            e.stopEvent();

            if (ed) {
                // Allow the field to act on tabs before onEditorTab, which ends
                // up calling completeEdit. This is useful for picker type fields.
                ed.onEditorTab(e);
            }

            sm = ed.up('tablepanel').getSelectionModel();
            if (sm.onEditorTab) {
                return sm.onEditorTab(ed.editingPlugin, e);
            }
        }
    },

    onEditComplete : function(ed, value, startValue) {
        var me = this,
            activeColumn = me.getActiveColumn(),
            context = me.context,
            record;

        if (activeColumn) {
            record = context.record;

            me.setActiveEditor(null);
            me.setActiveColumn(null);
            me.setActiveRecord(null);
    
            context.value = value;
            if (!me.validateEdit()) {
                return;
            }

            // Only update the record if the new value is different than the
            // startValue. When the view refreshes its el will gain focus
            if (!record.isEqual(value, startValue)) {
                record.set(activeColumn.dataIndex, value);
            }

            // Restore focus back to the view.
            // Use delay so that if we are completing due to tabbing, we can cancel the focus task
            context.view.focus(false, true);
            me.fireEvent('edit', me, context);
            me.editing = false;
        }
    },

    /**
     * Cancels any active editing.
     */
    cancelEdit: function() {
        var me = this,
            activeEd = me.getActiveEditor();

        me.setActiveEditor(null);
        me.setActiveColumn(null);
        me.setActiveRecord(null);
        if (activeEd) {
            activeEd.cancelEdit();
            me.context.view.focus();
            me.callParent(arguments);
            return;
        }
        // If we aren't editing, return true to allow the event to bubble
        return true;
    },

    /**
     * Starts editing by position (row/column)
     * @param {Object} position A position with keys of row and column.
     */
    startEditByPosition: function(position) {

        // If a raw {row:0, column:0} object passed.
        if (!position.isCellContext) {
            position = new Ext.grid.CellContext(this.view).setPosition(position);
        }

        // Coerce the edit column to the closest visible column
        position.setColumn(this.view.getHeaderCt().getVisibleHeaderClosestToIndex(position.column).getIndex());

        return this.startEdit(position.record, position.columnHeader);
    }
});



/**
 * A special editor field used to assign users to a project task.
 */
Ext.define('PO.view.field.POTaskAssignment', {
    extend: 'Ext.form.field.Picker',
    requires: ['Ext.grid.Panel'],
    alias: 'widget.potaskassignment',

    // copied from ComboBox 
    createPicker: function() {
	console.log('PO.view.field.POTaskAssignmentField.createPicker');
        var me = this;
        var menuCls = Ext.baseCSSPrefix + 'menu';

	// New store for keeping assignment data
	var assignmentStore = Ext.create('Ext.data.Store', { 
	    id: 'taskAssignmentStore',
	    fields: ['id', 'percent', 'name', 'email', 'initials'], 
	    data: [
		{id:8864, percent: 100.0, name: 'Ben Bigboss', email:'bbigboss@tigerpond.com', initials:'BB'}, 
		{id:8898, percent: 50.0, name:'Bobby Bizconsult', email:'bbizconsult@tigerpond.com', initials:'BB'}, 
		{id:8892, percent: 50.0, name:'Carlos Codificador', email:'ccodificador@tigerpond.com', initials:'CC'}, 
		{id:8823, percent: 100.0, name:'David Developer', email:'ddeveloper@tigerpond.com', initials:'DD'}, 
		{id:27484, percent: 12.3, name:'Harry Helpdesk', email:'hhelpdesk@tigerpond.com', initials:'HH'}, 
		{id:624, percent: 33.3, name:'System Administrator', email:'sysadmin@tigerpond.com', initials:'SA'}
            ]
	});

	// The picker consists of a grid.Panel
	var picker = me.picker = Ext.create('Ext.grid.Panel', {
	    title: 'Task Assignments',
            store: assignmentStore,
	    floating: true,
	    width: 200,
	    cls: me.el.up('.' + menuCls) ? menuCls : '',
            ownerCt: me.ownerCt,
	    renderto: document.body,
//	    selType: 'cellmodel',
	    columns: [
		{ text: 'In.', width: 30, dataIndex: 'initials' },
		{ text: 'Name', dataIndex: 'name', flex: 1 },
		{ text: 'Email', dataIndex: 'email', editor: 'textfield', hidden: true },
		{ text: '%', width: 50, dataIndex: 'percent', editor: 'textfield' }
	    ],
	    dockedItems: [{
		xtype: 'toolbar',
		dock: 'bottom',
		items: [
		    { xtype: 'button', text: 'Button 1' }
		]
	    }],
	    plugins: [Ext.create('MyCellEditing', {    // Hack the issue that this is a floating panel without Window around
		clicksToEdit: 1,
		listeners: {
                    beforeedit: function(obj) {
			return true;
                    }   
		}
	    })]
	});

	// hack: pass getNode() to the view
	picker.getNode = function() {
	    picker.getView().getNode(arguments);
	};

        return picker;

/*
        me.mon(picker, {
            itemclick: me.onItemClick,
            refresh: me.onListRefresh,
            scope: me
        });

        me.mon(picker.getSelectionModel(), {
            selectionChange: me.onListSelectionChange,
            scope: me
        });
*/
    },

    valueToRaw: function(assignees) {
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

    /**
     * Set the value of the editable field
     */
    applyValues: function() {
        var me = this,
        form = me.picker,
        vals = form.getForm().getValues();    

        me.setValue( Ext.encode( vals ) );
        me.fireEvent( 'blur' );
        me.collapse();        
    }

});

