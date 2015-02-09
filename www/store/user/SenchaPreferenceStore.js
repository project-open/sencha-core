/* 
 * /sencha-core/www/store/user/SenchaPreferenceStore.js
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

Ext.define('PO.store.user.SenchaPreferenceStore', {
    storeId:		'senchaPreferenceStore',
    extend:		'Ext.data.Store',
    requires:		['PO.model.user.SenchaPreference'],
    model: 		'PO.model.user.SenchaPreference',	// Uses standard User as model
    autoLoad:		false,
    remoteFilter:	true,					// Do not filter on the Sencha side
    pageSize:		100000,					// Load all projects, no matter what size(?)
    proxy: {
	type:		'rest',					// Standard ]po[ REST interface for loading
	url:		'/intranet-rest/im_sencha_preference',
	appendId:	true,
	timeout:	300000,
	extraParams: {
	    format:		'json'
	    // deref_p:		'1'				// We don't need company_name etc.
	    // This should be overwrittten during load.
	},
	reader: {
	    type:		'json',				// Tell the Proxy Reader to parse JSON
	    root:		'data',				// Where do the data start in the JSON file?
	    totalProperty:	'total'				// Total number of tickets for pagination
	},
	writer: {
	    type:		'json'				// Allow Sencha to write ticket changes
	}
    },

    /**
     * Store a preference into the store, either updating
     * an already existing preference or creating a new one.
     * The preference is written to the server REST back-end.
     */
    setPreference: function(preferenceUrl, preferenceKey, preferenceValue) {
	var prefModel = this.findRecord('preference_key',preferenceKey);
	if (null == prefModel) {
	    // We need to create a new preference
            prefModel = Ext.create('PO.model.user.SenchaPreference', {
		preference_url: preferenceUrl,                 // URL = "section" of parameters
		preference_key: preferenceKey,                 // Use the element's ID as key for the true/false preference
		preference_value: ''+preferenceValue           // The REST Back-end only works with strings
            });
            prefModel.save();                                       // POST the object to the REST API, creating a new object
	    this.add(prefModel);
	} else {
	    // The preference already exists
	    prefModel.set('preference_value', ''+preferenceValue);
            prefModel.save();                                       // POST the object to the REST API, performing an update
	}
    },

    /**
     * Shortcut for getPrefereceString
     */
    getPreference: function(preferenceKey, defaultValue) {
	return this.getPreferenceString(preferenceKey, defaultValue);
    },

    /**
     * Returns the specified preference as a boolean.
     */
    getPreferenceString: function(preferenceKey, defaultValue) {
	var prefModel = this.findRecord('preference_key',preferenceKey);
	if (null == prefModel) { return defaultValue; }
	var prefValue = prefModel.get('preference_value');
	if (null == prefValue) { return defaultValue; }
	return prefValue;
    },

    /**
     * Returns the specified preference as a boolean.
     * False is the default value for the default value.
     */
    getPreferenceBoolean: function(preferenceKey, defaultValue) {
	if (null == defaultValue) { defaultValue = false; }
	var prefModel = this.findRecord('preference_key',preferenceKey);
	if (null == prefModel) { return defaultValue; }
	var prefValue = prefModel.get('preference_value');
	if (null == prefValue) { return defaultValue; }
	var prefResult = prefValue == 'true' ? true : false;
	return prefResult;
    },

    /**
     * Check if a key exists
     */
    existsPreference: function(preferenceKey) {
	var prefModel = this.findRecord('preference_key',preferenceKey);
	return (null != prefModel);
    },

});

