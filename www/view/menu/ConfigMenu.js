/*
 * ConfigMenu.js
 *
 * Copyright (c) 2011 - 2014 ]project-open[ Business Solutions, S.L.
 * This file may be used under the terms of the GNU General Public
 * License version 3.0 or alternatively unter the terms of the ]po[
 * FL or CL license as specified in www.project-open.com/en/license.
 */

/**
 * Menu subclass that stores preferences for the current page
 * or component.
 * Expects additional "key" and "default" values for each 
 * MenuItem in the config.
 */

Ext.define('PO.view.menu.ConfigMenu', {
    extend: 'Ext.menu.Menu',
    requires: [
        'PO.Utilities', 
        'Ext.menu.Menu', 
        'PO.model.user.SenchaPreference',
        'PO.store.user.SenchaPreferenceStore'
    ],
    debug: false,
    style: {overflow: 'visible'},						// For the Combo popup
    senchaPreferenceStore: null,

    initComponent: function() {
        var me = this;
        if (me.debug) console.log('PO.view.menu.ConfigMenu.initComponent: Starting')
        this.callParent(arguments);

        // Check if SenchaPreference entries exist for the menu items and create if needed
        me.items.each(function(item) {
            if (me.debug) console.log('PO.view.menu.ConfigMenu.initComponent:'+item.id);

            // Make sure the "key" has been provided in the configurtion.
            if (!item.key) {
                alert('PO.view.menu.ConfigMenu.initComponent: item='+item.text+": No 'key' found for SenchaPreferenceStore"); 
                return;
            };

            // Initialize the DB state if not already set from using the page the last time
            var exists = me.senchaPreferenceStore.existsPreference(item.key);
            if (exists) {
		// Pull the value from preference store and write into default state
		item.checked = me.senchaPreferenceStore.getPreferenceBoolean(item.key, item.checked);
	    } else {
		me.senchaPreferenceStore.setPreference(item.key, item.checked);
	    }

            // Handle a click: Update the DB status via REST interface
            item.setHandler(
                function(item){
                    if (me.debug) console.log('configMenuOnItemCheck: item.key='+item.key+', checked='+item.checked);
                    me.senchaPreferenceStore.setPreference(item.key, item.checked);
                }
            );
        });

        // Create a "Reset Configuration" entry
        var item = Ext.create('Ext.menu.Item', {
            key: 'reset_configuration',
            text: 'Reset Configuration',
            handler: function() {
                var me = this;
                var menu = me.ownerCt;
                if (menu.debug) console.log('configMenu.OnResetConfiguration');
                me.senchaPreferenceStore.each(function(model) {
                    model.destroy();
                });
            }
        });
        me.insert(0,item);
        me.insert(1,'-');

        
        if (me.debug) console.log('PO.view.menu.ConfigMenu.initComponent: Finished')
    }
});

