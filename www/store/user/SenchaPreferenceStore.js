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
    debug:              false,
    pageSize:		100000,					// Load all projects, no matter what size(?)
    proxy: {
        type:		'rest',					// Standard ]po[ REST interface for loading
        url:		'/intranet-rest/im_sencha_preference',
        appendId:	true,
        timeout:	300000,
        extraParams: {format: 'json'},				// Overwritten during load()
        reader: {
            type:		'json',				// Tell the Proxy Reader to parse JSON
            root:		'data',				// Where do the data start in the JSON file?
            totalProperty:	'total'				// Total number of tickets for pagination
        },
        writer: {
            type:		'json'				// Allow Sencha to write ticket changes
        }
    },
    deferredSync: null,

    constructor: function(config) {
        var me = this;
        if (me.debug) console.log('SenchaPreferenceStore.constructor: Started');
        me.callParent([config]);
        // POST the object to the REST API, performing an update
        me.deferredSync = Ext.Function.createBuffered(me.sync, 1000, me);
        if (me.debug) console.log('SenchaPreferenceStore.constructor: Finished');
    },

    /**
     * Normal load(), but adds preferenceUrl parameter to load
     * only the key-value pairs for this page.
     */
    load: function(options) {
        var me = this;
        if (me.debug) console.log('SenchaPreferenceStore.load: Started');
        
        var preferenceUrl = "'" + me.myUrl() + "'";
	var myUserId = PO.Utilities.userId();
	var authToken = PO.Utilities.authToken();

        me.getProxy().extraParams = {
            format: 'json',
            preference_url: preferenceUrl,
	    preference_object_id: myUserId,
	    user_id: myUserId,
	    auth_token: authToken
        };
        me.callParent([options]);
        if (me.debug) console.log('SenchaPreferenceStore.load: Finished');
    },

    /**
     * Normal sync(), but server error messages are automatically
     * displayed on screen.
     */
    sync: function(options) {
        var me = this;
        if (me.debug) console.log('SenchaPreferenceStore.sync: Started');

        // Call parent.sync() with options plus additional success/failure callbacks
        options = Ext.apply({
            success: function() { },
            failure: function(batch, eOpts) {
                  var msg = batch.proxy.reader.jsonData.message;
                  if (!msg) msg = 'undefined error';
                  PO.Utilities.reportError('Server error while saving preferences', msg);
            }
        }, options);
        me.callParent([options]);

        if (me.debug) console.log('SenchaPreferenceStore.sync: Finished');
    },

    /**
     * Store a preference into the store, either updating
     * an already existing preference or creating a new one.
     * The preference is written to the server REST back-end.
     */
    setPreference: function(preferenceKey, preferenceValue) {
        var me = this;
        if (me.debug) console.log('SenchaPreferenceStore.setPreference('+preferenceKey+','+preferenceValue+'): Started');
        var preferenceUrl = me.myUrl();
        var prefModel = this.findRecord('preference_key',preferenceKey);
        if (null == prefModel) {
            // We need to create a new preference
            prefModel = Ext.create('PO.model.user.SenchaPreference', {
                preference_url: preferenceUrl,	 		// URL = "section" of parameters
                preference_key: preferenceKey,	 		// Use the element's ID as key for the true/false preference
                preference_value: ''+preferenceValue   		// The REST Back-end only works with strings
            });
            prefModel.save({					// POST the object to the REST API, creating a new object
                  success: function(batch, operation) { 
                      // we need to extract the rest_oid returned by the REST back-end
                      if (me.debug) console.log('SenchaPreferenceStore.setPreference.save().success:');
                      responseJson = JSON.parse(operation.response.responseText);
                      console.log(responseJson);
                      var restOid = responseJson.data[0].rest_oid;
                      prefModel.setId(restOid);
                      prefModel.set('preference_id', restOid);
                  },
                  failure: function(batch, eOpts, a, b, c, d) {
                      if (me.debug) console.log('SenchaPreferenceStore.setPreference.save().failure:');
                      var msg = batch.proxy.reader.jsonData.message;
                      if (!msg) msg = 'undefined error';
                      PO.Utilities.reportError('Server error while saving preferences', msg);
                  }
            });
            this.add(prefModel);
        } else {
            // The preference already exists
            prefModel.set('preference_value', ''+preferenceValue);
            me.deferredSync();					// POST the changes, but only after a waiting a second for more.
        }
        if (me.debug) console.log('SenchaPreferenceStore.setPreference: finished');
    },

    /**
     * Returns the specified preference as a boolean.
     * We don't have to look a the preferenceUrl, because
     * this has been checked during load already.
     */
    getPreference: function(preferenceKey, defaultValue) {
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
        return this.getPreference(preferenceKey, ''+defaultValue);
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
        var prefModel = this.findRecord('preference_key',preferenceKey);
        return (null != prefModel);
    },

    /**
     * Returns the URL of the current page
     */
    myUrl: function() {
        return window.location.pathname + window.location.search;
    }

});

