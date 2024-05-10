/*
 * POObjectMembers.js
 *
 * Copyright (c) 2011 - 2014 ]project-open[ Business Solutions, S.L.
 * This file may be used under the terms of the GNU General Public
 * License version 3.0 or alternatively unter the terms of the ]po[
 * FL or CL license as specified in www.project-open.com/en/license.
 */

/**
 * A special editor field used to edit members of a business object.
 * There are normal members and administrative members.
 * This field started off as a copy of the POTaskAssingment field,
 * but there are too many differences to unify the two.
 */
Ext.define('PO.view.field.POObjectMembers', {
    extend: 'Ext.form.field.Trigger',
    requires: ['Ext.grid.Panel'],
    alias: 'widget.poobjectmembers',

    debug: false,
    memberStore: null,							// Config: Store with users as candidates for members
    groupStore: null,
    gridPanelId: null,							// ID of underlying panel that has a selection model

    objectMemberPanel: null,						// Singleton
    
    statics: {
        /**
         * Covert a comma separated list of initials into an 
         * array of members
         */
        parseMembers: function(me, value) {
            if (me.debug) console.log('POObjectMembers.parseMembers: Starting: value='+value);
            if (!Ext.isString(value)) {return value; }

            var result = [];
            var names = value.split(";");
            for(var i = 0; i < names.length; i++) {
                var name = names[i];						// BB[20%]
                var memberObject = this.parseMember(me, name);
                if (!Ext.isString(memberObject) && null != memberObject) {
                    result.push(memberObject);
                }
            }

            if (me.debug) console.log('POObjectMembers.parseMembers: Finished');
            return result;
        },

        /**
         * Returns a member object if it can successfully parse a value like "BB[PM]".
         * Returns a string with an error message if it can't parse the value.
         */
        parseMember: function(me, value) {
            if (me.debug) console.log('POObjectMember.parseMembers: Starting: value='+value);

            if (!Ext.isString(value)) { 
                me.markInvalid("Value='"+value+"' is not a string but a "+typeof value);
                return;
            }

            value = value.replace(/ /,"");					// Eliminate white spaces, better than trim()
            if (value.length == 0) { 
                console.log('parseAssignment('+value+'): value.length == 0');
                return; 
            }
            if (value.length < 2) {
                console.log('parseAssignment('+value+'): value.length < 2');
                me.markInvalid("Value='"+value+"' should contain of at least two characters");
                return;
            }

            // Split the value into the "initialsString" part possibly including
            // numbers and the remaining part hopefully containing "[80%]"
            var initialsString = "";
            var roleString = value;
            while (/^[a-zA-Z0-9]/.test(roleString.substr(0,1))) {
                initialsString = initialsString + roleString.substr(0,1).toUpperCase();
                roleString = roleString.substring(1,value.length);
            }

            var roleString = value;
            var initials = "";
            while (/^[a-zA-Z0-9]/.test(roleString.substr(0,1))) {
                initials = initials + value.substr(0,1);
                roleString = roleString.substring(1,value.length);
            }
            var role = this.parseMembersRole(me, roleString.trim());	        // FullMember = 1300
            if (Ext.isString(role)) { 	     		// Return an error string
                console.log('parseMember('+value+'): '+roleString);
                me.markInvalid(roleString);
                return;
            }

            var result = null;
            me.memberStore.each(function(user) {
                if (null != result) { return; }        // Already found with previous user, skipping loop
                var initialsUser = user.get('initials').toUpperCase();
                if (initialsUser == initialsString) {
                    var user_id = parseInt(user.get('user_id'));
                    var rel_id = Math.floor((Math.random() * 10000000000000.0));
                    result = {id:rel_id, user_id:user_id, role_id:role};
                    console.log(result);
                }
            });

            if (null == result) {
                me.markInvalid('<nobr>Unable to parse "'+value+'"</nobr>');
            }
            return result;
        },

        /**
         * Parse a string like "[M]" into the number 1310 (=Budget Item Manager)
         * Returns 1300 (=Full Member) for an empty string or a string object 
         * with an error message in case of an error.
         */
        parseMembersRole: function(me, roleString) {
            if (me.debug) console.log('POObjectMembers.parseMembersRole: Starting: str='+roleString);
            if (!Ext.isString(roleString) || 0 == roleString.length) { return 1300; }

            var str = roleString;
            if (!/^\[.+\]$/.test(str)) {
                return "Role specification '"+str+"' does not consist of a brackets enclosing a character.";
            }
            var str = str.substr(1,str.length - 2);
            if (!/^[a-zA-Z]$/.test(str)) {
                return "Role specification '"+str+"' does not include in it's brackets a single letter.";
            }

            switch (str.toLowerCase()) {
            case "m": role = 1310; break;
            default: role = 1300; break
            }

            if (me.debug) console.log('POObjectMembers.parseMembersRole: Finished: str='+roleString+' -> '+role);
            return role;
        },
        

        /**
         * Format membership list to a String
         */
        formatMembers: function(me, memberExpr) {
            if (Ext.isString(memberExpr)) { return memberExpr; }
            if (!memberExpr) { return ""; }
            if (memberExpr.constructor === Array) {
                if (memberExpr.length == 0) { return ""; }
            }

            if (me.debug) console.log('POObjectMembers.formatMembers: Starting: memberExpr='+memberExpr);
            var result = "";
            memberExpr.forEach(function(member) {
                if ("" != result) { result = result + ";"; }
                var userId = ""+member.user_id;
                var userModel = me.memberStore.getById(userId);
                var groupModel = me.groupStore.getById(userId);
                if (null == userModel && null == groupModel) { 
                    // This can happen when moving sub-projects around, even though it shouldn't...
                    result = result + '#'+userId;
                } else {
                    if (null != userModel) {
                        result = result + userModel.get('initials');
                    }
                    if (null != groupModel) {
                        result = result + groupModel.get('group_name');
                    }
                }
                if (!!member.role && 1300 != member.role) {
                    var roleString = ""
                    switch (member.role) {
                    case 1310: roleString = "M"; break;
                    default: roleString = "#"+member.role;
                    }
                    result = result + '['+roleString+']';
                }
            });
            return result;
        }
    },									// End statics

    // Add specialkey listener
    initComponent: function() {
        var me = this;
        if (me.debug) console.log('POObjectMembers.initComponent: Starting');
        this.callParent();
        me.gridPanelId = me.initialConfig.gridPanelId;
        if (me.debug) console.log('POObjectMembers.initComponent: Finished');
    },
    
    initValue: function() {
        var me = this;
        if (me.debug) console.log('POObjectMembers.initValue: Starting');
        var value = me.value;
        if (Ext.isString(value)) {
            me.value = me.rawToValue(value);					// If a String value was supplied, try to convert it to a proper Date
        }
        me.callParent();
    },

    getErrors: function(value) {
        var me = this;
        if (me.debug) console.log('POObjectMembers.getErrors: Starting');
        return [];								// Empty list of errors at the moment
    },

    rawToValue: function(rawValue) {
        var me = this;
        if (me.debug) console.log('POObjectMembers.rawToValue: Starting');
        var val = this.statics().parseMembers(me, rawValue) || rawValue || null;
        if (me.debug) console.log('POObjectMembers.rawToValue: '+rawValue+' -> '+val);
        if (me.debug) console.log(val);
        return val;
    },

    valueToRaw: function(value) {
        var me = this;
        if (me.debug) console.log('POObjectMembers.valueToRaw: Starting, value='+value);
        if (!value) return "";
        var raw = this.statics().formatMembers(me, value);
        if (me.debug) console.log('POObjectMembers.valueToRaw: '+value+' -> '+raw);
        return raw;
    },

    getSubmitValue: function() {
        var me = this;
        if (me.debug) console.log('POObjectMembers.getSubmitValue: Starting');
        var value = this.getValue();
        return value;
    },


    /**
     * Open the TaskProperty panel with the Members
     * tab open in order to edit membership.
     */
    onTriggerClick: function(event) {
        var me = this;
        if (me.debug) console.log('POObjectMembers.onTriggerClick: Starting');

        var panel = Ext.getCmp(me.gridPanelId);
        var budgetItem = panel.getSelectionModel().getLastSelected();

        var fieldValue = this.getValue();


        if (0) {
            var objectMemberPanel = Ext.getCmp('objectMemberPanel');
            objectMemberPanel.setField(me);
            objectMemberPanel.setStore(me.memberStore);
            objectMemberPanel.setValue(fieldValue);
            objectMemberPanel.setActiveTab('objectMembers');
            objectMemberPanel.show();						// Show handled by picker management
            
        } else  {

            if (!me.objectMemberPanel) {
                // Create the panel showing properties of a task, but don't show it yet.
                me.objectMemberPanel = Ext.create("PO.view.ObjectMemberPanel", {
                    debug: getDebug('objectMemberPanel'),
                    senchaPreferenceStore: null,
                    memberStore: me.memberStore,
                    potentialMemberStore: me.memberStore
                });
            }

            me.objectMemberPanel.setModelAndField(budgetItem, "members");
            me.objectMemberPanel.setField(me);
            me.objectMemberPanel.setStore(me.memberStore);
            me.objectMemberPanel.setValue(fieldValue);
            me.objectMemberPanel.setActiveTab('objectMembers');
            me.objectMemberPanel.show();						// Show handled by picker management

        }
    }
});



