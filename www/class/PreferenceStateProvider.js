/**
 * sencha-core/www/class/PreferenceStateProvider.js
 *
 * Copyright (C) 2016, ]project-open[
 * @author Frank Bergmann (frank.bergmann@project-open.com)
 * @creation-date 2013-11-29
 * @cvs-id $Id$
 */


/*
 * Create a specific store for categories.
 * The subclass contains a special lookup function.
 */
Ext.define('PO.class.PreferenceStateProvider', {
    extend: 'Ext.state.Provider',
    requires: [
        'PO.Utilities',
        'PO.model.user.SenchaPreference',
        'PO.store.user.SenchaPreferenceStore'
    ],

    currentUrl: null,                                    // set during init
    debug: false,
    preferenceStore: null,                               // set during init

    /**
     * Create a new PreferenceStateProvider
     * @param {Object} [config] Config object.
     */
    constructor: function(config){
        var me = this;

        me.preferenceStore = Ext.StoreManager.get('senchaPreferenceStore');
        me.currentUrl = config.url;
        if (typeof me.currentUrl == "undefined" || me.currentUrl === null) {
            me.currenturl = window.location.pathname;
        }

        if (typeof config.debug != "undefined") { 
            me.debug = config.debug; 
        }

        me.callParent(arguments);
    },

    /**
     * Custom encode function
     */
    encode: function(string) {
        var me = this;
//        var result = me.encodeValue(string); 
        var result = JSON.stringify(string);
        if (me.debug) console.log('PreferenceStateProvider.encode: '+string+' -> '+result);
        return result;
    },

    /**
     * Custom decode function
     */
    decode: function(string) {
        var me = this;
//        var result = me.decodeValue(string); 
	var result = JSON.parse(string);
        if (me.debug) console.log('PreferenceStateProvider.decode: '+string+' -> '+result);
        return result;
    },

    get: function(name, defaultValue) { 
        var me = this;
        if (me.debug) console.log('PreferenceStateProvider: get('+name+','+defaultValue+')');

	if ("ganttTreePanel" == name) {
	    var v;
	    // v = '{"columns":[{"id":"treegrid-task"},{"id":"treegrid-work"},{"id":"treegrid-start"},{"id":"treegrid-done"},{"id":"treegrid-end"},{"id":"treegrid-resources"},{"id":"treegrid-costcenter"},{"id":"treegrid-description"},{"id":"treegrid-material","hidden":false},{"id":"treegrid-predecessors"},{"id":"treegrid-prio"},{"id":"treegrid-status"},{"id":"treegrid-nr"},{"id":"treegrid-cosine_deliverable"},{"id":"treegrid-cosine_task_value"}]}';

	    // v = '{"columns":[{"id":"treegrid-task"},{"id":"treegrid-work"},{"id":"treegrid-start"},{"id":"treegrid-done"},{"id":"treegrid-end"},{"id":"treegrid-resources"},{"id":"treegrid-costcenter"},{"id":"treegrid-description"},{"id":"treegrid-material"},{"id":"treegrid-predecessors"},{"id":"treegrid-prio"},{"id":"treegrid-status"},{"id":"treegrid-nr"},{"id":"treegrid-cosine_deliverable"},{"id":"treegrid-cosine_task_value"}]}';

	    v = '{"columns":[{"id":"treegrid-task"},{"id":"treegrid-work"},{"id":"treegrid-start"},{"id":"treegrid-done"},{"id":"treegrid-end"},{"id":"treegrid-resources"},{"id":"treegrid-costcenter"},{"id":"treegrid-description"},{"id":"treegrid-material","hidden":false},{"id":"treegrid-predecessors"},{"id":"treegrid-prio"},{"id":"treegrid-status"},{"id":"treegrid-nr"},{"id":"treegrid-cosine_deliverable"},{"id":"treegrid-cosine_task_value"}]}';

	    return me.decode(v);
	}




        var pos = me.preferenceStore.find('preference_key', name);
        if (pos > -1) { 
            var row = me.preferenceStore.getAt(pos); 
            var value = row.get('preference_value');
            var result = me.decode(value); 
            if (me.debug) console.log('PreferenceStateProvider: get('+name+','+defaultValue+') -> '+result);
            return result;
        } else { 
            if (me.debug) console.log('PreferenceStateProvider: get('+name+','+defaultValue+') -> defaultValue='+defaultValue);
            return defaultValue; 
        } 
    }, 

    set: function(name, value){
        var me = this;
        if (me.debug) console.log('PreferenceStateProvider: set('+name+','+value+')');
        if (typeof value == "undefined" || value === null) {
            me.clear(name);
            return;
        }

        var encodedValue = me.encode(value);
        var prefIndex = me.preferenceStore.findExact('preference_key',name);
        if (prefIndex < 0) {
            // We need to create a new preference
            var pref = Ext.create('PO.model.user.SenchaPreference', {
                preference_url: me.currentUrl,
                preference_key: name,
                preference_value: encodedValue
            });
            me.preferenceStore.add(pref);
            pref.save();	    // Asynchroneously save the value, but don't wait for the confirmation - not necessary.
        } else {
            // The preference is already there - update the value
            pref = me.preferenceStore.getAt(prefIndex);
            pref.set('preference_value', encodedValue);
            pref.save();	    // Asynchroneously save the value, but don't wait for the confirmation - not necessary.	    
        }

        me.callParent(arguments);
    },

    clear: function(name){
        var me = this;
        if (me.debug) console.log('PreferenceStateProvider: clear('+name+')');
        this.clearPreference(name);
        this.callParent(arguments);
    },


    clearPreference: function(name){
        var me = this;
        if (me.debug) console.log('PreferenceStateProvider: clearPreference('+name+')');
        var pref = me.preferenceStore.findExact('preference_key',name);

        if (typeof pref == "undefined" || pref === null) {
            // No preference found - so there is no need to clear the value
        } else {
            // Found the preference - delete it
            // This will send a DELETE HTTP request to the server.
            pref.destroy();
        }
    }
});
