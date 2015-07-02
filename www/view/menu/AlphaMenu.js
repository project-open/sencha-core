/*
 * AlphaMenu.js
 *
 * Copyright (c) 2011 - 2014 ]project-open[ Business Solutions, S.L.
 * This file may be used under the terms of the GNU General Public
 * License version 3.0 or alternatively unter the terms of the ]po[
 * FL or CL license as specified in www.project-open.com/en/license.
 */

/**
 * Menu subclass that checks the ]project-open[ server for tickets
 * related to a certain configuration item of SLA.
 */

Ext.define('PO.view.menu.AlphaMenu', {
    extend: 'Ext.menu.Menu',
    requires: [
        'Ext.menu.Menu',
	'PO.model.helpdesk.Ticket',
	'PO.store.helpdesk.TicketStore'
    ],
    debug: false,
    slaId: null,
    confItemId: null,

    initComponent: function() {
	var me = this;
	if (me.debug) console.log('PO.view.menu.AlphaMenu.initComponent: Starting')
        var me = this;
        this.callParent(arguments);

	var sla_id = me.slaId;
	var conf_item_id = me.confItemId;
	var ticketStore = Ext.create('PO.store.helpdesk.TicketStore');
	var serverUrl = "http://www.project-open.net";

	var item = Ext.create('Ext.menu.Item', {
	    text: "Create a new ticket",
	    href: serverUrl+"/intranet-helpdesk/new?ticket_sla_id="+sla_id,
	    hrefTarget: '_blank'
	});
	me.add(item);
	

	// Use the REST server-side "proxy" to get data from www.project-open.net
	ticketStore.getProxy().url = "/intranet-rest/data-source/domain-proxy";

	if (null != sla_id) {
	    ticketStore.getProxy().extraParams = { url: serverUrl+"/intranet-rest/im_ticket?format=json&parent_id=1478943&deref_p=1&user_id=0&auth_token=0" };
	}
	ticketStore.load({
            callback: function(a,b,c,d,e,f) {
		if (me.debug) console.log('PO.view.menu.AlphaMenu.initComponent: ticketStore.load.callback: Starting');
		ticketStore.each(function(model) {
		    var ticketId = model.get('ticket_id');
		    var ticketNr = model.get('project_nr');
		    var ticketName = model.get('project_name');
		    var ticketText = model.get('description');
		    var ticketType = model.get('ticket_type_id_deref');
		    var item = Ext.create('Ext.menu.Item', {
			text: ticketType+": #"+ticketNr+" - "+ticketName,
			href: serverUrl+"/intranet-helpdesk/new?form_mode=display&ticket_id="+ticketId,
			hrefTarget: '_blank',
			tooltip: ticketText
		    });
		    me.add(item);
		});
		if (me.debug) console.log('PO.view.menu.AlphaMenu.initComponent: ticketStore.load.callback: Finished');
	    }
	});
	if (me.debug) console.log('PO.view.menu.AlphaMenu.initComponent: Finished')
    }
});

