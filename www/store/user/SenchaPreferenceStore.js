/* 
 * /sencha-core/www/store/user/SenchaPreferenceStore.js
 *
 * Copyright (C) 2014 ]project-open[
 * All rights reserved. Please see
 * http://www.project-open.com/license/sencha/ for details.
 *
 * <ul>
 * <li>A store for key-value data per URL/page.
 * <li>All values are converted to string on the database
 *     level. However, we provide access functions for 
 *     integer and boolean if the values are know to belong
 *     to these types.
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
    setPreference: function(preferenceKey, preferenceValue) {
	var preferenceUrl = window.location.pathname;
        var prefModel = this.findRecord('preference_key',preferenceKey);
        if (null == prefModel) {
            // We need to create a new preference
            prefModel = Ext.create('PO.model.user.SenchaPreference', {
                preference_url: preferenceUrl,         		// URL = "section" of parameters
                preference_key: preferenceKey,         		// Use the element's ID as key for the true/false preference
                preference_value: ''+preferenceValue   		// The REST Back-end only works with strings
            });
            prefModel.save();                               	// POST the object to the REST API, creating a new object
            this.add(prefModel);
        } else {
            // The preference already exists
            prefModel.set('preference_value', ''+preferenceValue);
            prefModel.save();                               	// POST the object to the REST API, performing an update
        }
    },

    /**
     * Returns the specified preference as a boolean.
     */
    getPreference: function(preferenceKey, defaultValue) {
	var preferenceUrl = window.location.pathname;

	// ToDo: deal with preferenceUrl!!!

        var prefModel = this.findRecord('preference_key',preferenceKey);
        if (null == prefModel) { return defaultValue; }
        var prefValue = prefModel.get('preference_value');
        if (null == prefValue) { return defaultValue; }
        return prefValue;
    },

    /**
     * Shortcut for getPreferece
     */
    getPreferenceString: function(preferenceKey, defaultValue) {
        return this.getPreference(preferenceKey, defaultValue);
    },

    /**
     * Returns the specified preference as a boolean.
     * False is the default value for the default value.
     */
    getPreferenceBoolean: function(preferenceKey, defaultValue) {
        if (null == defaultValue) { defaultValue = false; }
	var prefValue = this.getPreferenceString(preferenceKey, defaultValue);
        var prefResult = prefValue == 'true' ? true : false;
        return prefResult;
    },

    /**
     * Returns the specified preference as an integer.
     */
    getPreferenceInt: function(preferenceKey, defaultValue) {
	var prefValue = this.getPreferenceString(preferenceKey, defaultValue);
        return parseInt(prefValue);
    },

    /**
     * Check if a key exists
     */
    existsPreference: function(preferenceKey) {
	var preferenceUrl = window.location.pathname;

	// ToDo: deal with preferenceUrl!!!

        var prefModel = this.findRecord('preference_key',preferenceKey);
        return (null != prefModel);
    }

});

