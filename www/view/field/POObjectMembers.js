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
    
    statics: {
        /**
         * Covert a comma separated list of initials into an 
         * array of members
         */
        parseMembers: function(me, value) {
            if (me.debug) console.log('POObjectMembers.parseMembers: Starting: value='+value);
            if (!Ext.isString(value)) {return value; }

            var result = [];
            // if ("" == value) return null;

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
                return "Value='"+value+"' is not a string but a "+typeof value; 
            }

            value = value.replace(/ /,"");					// Eliminate white spaces, better than trim()
            if (value.length < 2) {
                return "Value='"+value+"' should contain of at least two characters"; 
            }
            var initials = "";
            var roleString = value;

            // Split the value into the "initials" part possibly including
            // numbers and the remaining part hopefully containing "[80%]"
            while (/^[a-zA-Z0-9]/.test(roleString.substr(0,1))) {
                initials = initials + value.substr(0,1);
                roleString = roleString.substring(1,value.length);
            }
            var role = this.parseMembersRole(me, roleString.trim());	        // FullMember = 1300
            if (Ext.isString(role)) { return role; }	     		// Return an error string

            // ToDo: Sort the user store alphabetically in order to create
            // deterministic results
            var result = null;

            // var projectMemberStore = Ext.StoreManager.get('projectMemberStore');
            var projectMemberStore = me.memberStore;
            var letters = value.toUpperCase().split("");
            projectMemberStore.each(function(user) {
                if (null != result) { return; }
                var firstNames = user.get('first_names');
                var lastName = user.get('last_name');
                var firstNamesInitial = firstNames.toUpperCase().substr(0,1);
                var lastNameInitial = lastName.toUpperCase().substr(0,1);
                var found = false;
                if (letters[0] == firstNamesInitial && letters[1] == lastNameInitial) { found = true; }
                
                if (found) {
                    // {id:123456, user_id:8864, role:1300}
                    var user_id = parseInt(user.get('user_id'));
                    var rel_id = Math.floor((Math.random() * 10000000000000.0));
                    result = {id:rel_id, user_id:user_id, role:role};
                }
            });

            if (null == result) {
                me.markInvalid('Unable to parse member expression "'+value+'"');
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
            if (me.debug) console.log('POObjectMembers.formatMembers: Starting: memberExpr='+memberExpr);
            if (Ext.isString(memberExpr)) { return memberExpr; }
            var projectMemberStore = me.memberStore;
            var groupStore = me.groupStore;

            var result = "";
            if (null != memberExpr) {
                memberExpr.forEach(function(member) {
                    if ("" != result) { result = result + ";"; }
                    var userId = ""+member.user_id;
                    var userModel = projectMemberStore.getById(userId);
                    var groupModel = groupStore.getById(userId);
                    if (null == userModel && null == groupModel) { 
                        // This can happen when moving sub-projects around, even though it shouldn't...
                        result = result + '#'+userId;
                    } else {
                        if (null != userModel) {
                            result = result + userModel.get('first_names').substr(0,1) + userModel.get('last_name').substr(0,1);
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
            }
            return result;
        }
    },										// End statics
    
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

        // if (val.constructor === Array) { if (val.length == 0) { val = ""; } }

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
    onTriggerClick: function(a, b, c, d) {
        var me = this;
        if (me.debug) console.log('POObjectMembers.onTriggerClick: Starting');

        alert('ToDo');
        
        var treePanel = Ext.getCmp('ganttTreePanel');
        var value = treePanel.getSelectionModel().getLastSelected();
        var taskPropertyPanel = Ext.getCmp('ganttTaskPropertyPanel');
        taskPropertyPanel.setValue(value);
        taskPropertyPanel.setActiveTab('taskPropertyMembers');
        taskPropertyPanel.show();						// Show handled by picker management
    }
});

