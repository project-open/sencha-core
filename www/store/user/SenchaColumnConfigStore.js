/* 
 * /sencha-core/www/store/user/SenchaColumnConfigStore.js
 *
 * Copyright (C) 2014 ]project-open[
 * All rights reserved. Please see
 * http://www.project-open.com/license/sencha/ for details.
 *
 * <ul>
 * <li>A store with the list of all active main projects in the system.
 * <li>The store needs explicit sync() in order to store changes.
 * <li>The store does not explicitely exclude tasks and tickets
 *     with parent_id=NULL, which may occur accidentally in ]po[.
 * </ul>
 */

Ext.define('PO.store.user.SenchaColumnConfigStore', {
    storeId:		'senchaColumnConfigStore',
    extend:		'Ext.data.Store',
    requires:		['PO.model.user.SenchaColumnConfig'],
    model: 		'PO.model.user.SenchaColumnConfig',	// Uses standard User as model
    autoLoad:		false,
    remoteFilter:	true,					// Do not filter on the Sencha side
    pageSize:		100000,					// Load all projects, no matter what size(?)
    proxy: {
	type:		'rest',					// Standard ]po[ REST interface for loading
	url:		'/intranet-rest/im_sencha_column_config',
	appendId:	true,
	timeout:	300000,
	extraParams: { 
	    format: 'json',
	    column_config_object_id: 0,
	    column_config_url: 'undefined'
	},
	reader: {
	    type:		'json',				// Tell the Proxy Reader to parse JSON
	    root:		'data',				// Where do the data start in the JSON file?
	    totalProperty:	'total'				// Total number of tickets for pagination
	},
	writer: {
	    type:		'json'				// Allow Sencha to write changes
	}
    },

    /**
     * Constructor
     * Takes the store configuration (URL, user ...)
     */
    constructor: function(config) {
	console.log('PO.store.user.SenchaColumnConfigStore: constructor:'); console.log(config);
	this.callParent(arguments);

	Ext.apply(this, config || {});
	if (undefined == this.url) { console.log('PO.store.user.SenchaColumnConfigStore: constructor: Requires a "url" parameter'); }
	if (undefined == this.grid) { console.log('PO.store.user.SenchaColumnConfigStore: constructor: Requires a "grid" parameter'); }
	if (undefined == this.user) { console.log('PO.store.user.SenchaColumnConfigStore: constructor: Requires a "user" parameter'); }
	if (undefined == this.columns) { console.log('PO.store.user.SenchaColumnConfigStore: constructor: Requires a "columns" parameter'); }

	// Receive information about changed columns
	// in order to save the changes to DB
	this.grid.on('columnschanged', this.onGridColumnsChanged, this);
	this.grid.on('columnresize', this.onGridColumnResize, this);
    },

    /**
     * Reconfigure the referenced grid with the column definition
     */
    reconfigure: function(config) {
	console.log('PO.store.user.SenchaColumnConfigStore: reconfigure:'); console.log(config);
	var proxy = this.getProxy();
	proxy.extraParams.column_config_url = "'"+this.url+"'";
	proxy.extraParams.column_config_object_id = this.user;

	// Load the last user's configuration from DB 
	// and reconfigure the grid with the modified columns
	this.load({
	    callback: function(records, operation, success) {
		console.log('PO.store.user.SenchaColumnConfigStore: constructor: load(): callback:');

		var columns = config.columns;

		// Initialize sortOrder
		for (var i = 0, len = columns.length; i < len; i++) {
		    if (!sortOrder in columns[i]) {
			columns[i].sortOrder = 0;
		    }
		}

		// Set parameters according to database values
		for (var i = 0, len = records.length; i < len; i++) {
		    var record = records[i];
		    var sortOrderString = record.get('column_config_sort_order');
		    if (undefined == sortOrder || "" == sortOrder) { sortOrder = "0"; }
		    var sortOrder = parseInt(sortOrderString);
		    var filteredColumns = columns.filter(function(col) {return col.dataIndex == record.get('column_config_name'); });
		    if (filteredColumns.length != 1) { continue; }
		    var column = filteredColumns[0];
		    column.sortOrder = sortOrder;
		    column.hidden = (record.get('column_config_hidden') == 'true');
		    column.width = parseInt(record.get('column_config_width'));
		}

		// Sort columns by sortOrder
		columns.sort(function(a,b) { return a.sortOrder - b.sortOrder } );

		var grid = this.grid;
		grid.suspendEvent('columnschanged');
		grid.suspendEvent('columnresize');
		grid.reconfigure(grid.store, columns);
		grid.resumeEvent('columnschanged');
		grid.resumeEvent('columnresize');

	    },
	    scope: this
	});
	return this;
    },

    /**
     * Triggered onColumnsChanged when a user enabled/disabled
     * columns, changes order or resizes.
     * Store this configuration into the DB.
     */
    saveColumns: function(headerContainer) {
	console.log('PO.store.user.SenchaColumnConfigStore: onGridColumnsChanged: '); console.log(headerContainer);

	var columns = headerContainer.getGridColumns();
	console.log(columns);
	for (var i = 0, len = columns.length; i < len; i++) {
	    var column = columns[i];
	    var hidden = column.hidden; if (undefined == hidden) { hidden = false; }
	    var name = column.dataIndex; if ("" == name) { continue; }
	    var colModel = Ext.create('PO.model.user.SenchaColumnConfig', {
		column_config_object_id: report_user_id,
		column_config_url: this.url,
		column_config_name: column.dataIndex,
		column_config_sort_order: i,
		column_config_hidden: hidden,
		column_config_width: column.width
	    });
	    colModel.save({
		success: function(colConfigModel, operation) {
                    console.log('PO.store.user.SenchaColumnConfigStore: onGridColumnsChanged: colModel.save(): success');

		    // Pull out the new ID of the object from the reply message and store into the model.
		    // We will need this ID for DELETE operation on the preference.
		    var object_id = operation.request.proxy.reader.jsonData.data[0].rest_oid;
		    colConfigModel.set('column_config_id', object_id);
		    colConfigModel.set('id', object_id);

		    // Add this columnConfig model to the current store
		    this.add(colConfigModel);
                },
                failure: function(colConfigModel, operation) {
		    var message = operation.request.scope.reader.jsonData.message;
                    Ext.Msg.alert('Error saving column configuration', "<pre>"+message+"</pre>");
                },
		scope: this
	    });
	};
    },

    onGridColumnsChanged: function(headerContainer, column, width, eOpts) { 
	this.saveColumns(headerContainer); 
    },
    onGridColumnResize: function(headerContainer, eOpts) { 
	this.saveColumns(headerContainer); 
    },

});
