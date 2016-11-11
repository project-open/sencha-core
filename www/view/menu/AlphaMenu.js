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
	'PO.Utilities',
	'PO.model.helpdesk.Ticket',
	'PO.store.helpdesk.TicketStore'
    ],
    alphaComponent: 'undefined',
    debug: false,
    slaId: null,
    ticketStatusId: 30000,							// "Open"
    confItemId: null,
    style: {overflow: 'visible'},						// For the Combo popup

    initComponent: function() {
	var me = this;
	if (me.debug) console.log('PO.view.menu.AlphaMenu.initComponent: Starting')
        var me = this;
        this.callParent(arguments);

	var sla_id = me.slaId;
	var ticket_status_id = me.ticketStatusId;
	var conf_item_id = me.confItemId;
	var ticketStore = Ext.create('PO.store.helpdesk.TicketStore');
	var serverUrl = "http://www.project-open.net";

	var item = Ext.create('Ext.menu.Item', {
	    text: "Register yourself at ]po[ Server",
	    href: serverUrl+"/register/user-new",
	    hrefTarget: '_blank'
	});
	me.add(item);
	
	var item = Ext.create('Ext.menu.Item', {
	    text: me.alphaComponent + " Ticket Tracker",
	    href: serverUrl+"/intranet-helpdesk/index?mine_p=all&ticket_sla_id="+sla_id,
	    hrefTarget: '_blank'
	});
	me.add(item);
	
	var item = Ext.create('Ext.menu.Item', {
	    text: "Create a new ticket",
	    href: serverUrl+"/intranet-helpdesk/new?ticket_sla_id="+sla_id,
	    hrefTarget: '_blank'
	});
	me.add(item);
	

	// Use the REST server-side "proxy" to get data from www.project-open.net
	ticketStore.getProxy().url = "/intranet-rest/data-source/domain-proxy";

	var systemId = PO.Utilities.systemId();
	var url = serverUrl+"/intranet-rest/im_ticket?format=json&deref_p=1&user_id=0&auth_token=0&system_id="+systemId;
        if (null != sla_id) { url = url + "&parent_id="+sla_id; }
        if (null != ticket_status_id) { url = url + "&ticket_status_id="+ticket_status_id; }
	if (null != conf_item_id) { url = url + "&ticket_conf_item_id="+conf_item_id; }
        ticketStore.getProxy().extraParams = { 'url': url };

	// Load the data
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

