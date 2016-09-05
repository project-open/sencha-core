/*
 * HelpMenu.js
 *
 * Copyright (c) 2011 - 2014 ]project-open[ Business Solutions, S.L.
 * This file may be used under the terms of the GNU General Public
 * License version 3.0 or alternatively unter the terms of the ]po[
 * FL or CL license as specified in www.project-open.com/en/license.
 */

/**
 * Menu subclass that takes a store for defining a list
 * of static items.
 */
Ext.define('PO.view.menu.HelpMenu', {
    extend: 'Ext.menu.Menu',
    requires: [
        'Ext.menu.Menu'
    ],

    style: {overflow: 'visible'},     // For the Combo popup

    initComponent: function() {
        var me = this;
        this.callParent(arguments);

	if (undefined === me.store) { alert('PO.view.menu.HelpMenu: Requires a "store" parameter with field "text" and "url"'); return; }

	me.store.each(function(model) {
            var text = model.get('text');
            var url = model.get('url');

	    if ("-" == text) {                                  // Just a separator
		var item = Ext.create('Ext.menu.Separator');
		me.add(item);
		return;
	    };

	    if ("" == url || undefined === url) {               // No URL
		var item = Ext.create('Ext.menu.Item', {text: text});
		me.add(item);
		return;
	    };

            var item = Ext.create('Ext.menu.Item', {	       // Default: Standard item with URL
		text: text,
		href: url,
		hrefTarget: '_blank'
            });
            me.add(item);
	});
    }
});
