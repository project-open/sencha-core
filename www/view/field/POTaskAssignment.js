/*
 * POTaskAssignment.js
 *
 * Copyright (c) 2011 - 2014 ]project-open[ Business Solutions, S.L.
 * This file may be used under the terms of the GNU General Public
 * License version 3.0 or alternatively unter the terms of the ]po[
 * FL or CL license as specified in www.project-open.com/en/license.
 */

/**
 * A special editor field used to assign users to a project task.
 */
Ext.define('PO.view.field.POTaskAssignment', {
    extend: 'Ext.form.field.Trigger',
    requires: ['Ext.grid.Panel'],
    alias: 'widget.potaskassignment',

    statics: {
        /**
         * Covert a comma separated list of initials into an 
         * array of user assignments
         */
        parseAssignments: function(me, value) {
            if (!Ext.isString(value)) {return value; }

            var result = [];
	    // if ("" == value) return null;

            var names = value.split(";");
            for(var i = 0; i < names.length; i++) {
                var name = names[i];						// BB[20%]
                var assigObject = this.parseAssignment(me, name);
                if (!Ext.isString(assigObject) && null != assigObject) {
                    result.push(assigObject);
                }
            }

	    // if (0 == result.length) return null;
            return result;
        },

        /**
         * Returns an assignment object if it can successfully parse a value like "BB[80%]".
         * Returns a string with an error message if it can't parse the value.
         */
        parseAssignment: function(me, value) {
            if (!Ext.isString(value)) { 
                return "Value='"+value+"' is not a string but a "+typeof value; 
            }

            value = value.replace(/ /,"");					// Eliminate white spaces, better than trim()
            if (value.length < 2) {
                return "Value='"+value+"' should contain of at least two characters"; 
            }
            var initials = "";
            var percentString = value;

            // Split the value into the "initials" part possibly including
            // numbers and the remaining part hopefully containing "[80%]"
            while (/^[a-zA-Z0-9]/.test(percentString.substr(0,1))) {
                initials = initials + value.substr(0,1);
                percentString = percentString.substring(1,value.length);
            }
            var percent = this.parseAssignmentPercent(me, percentString.trim());	// Number indicating percent or an error
            if (Ext.isString(percent)) { return percent; }	     		// Return an error string

            // ToDo: Sort the user store alphabetically in order to create
            // deterministic results
            var result = null;
            var projectMemberStore = Ext.StoreManager.get('projectMemberStore');
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
                    // {id:123456, user_id:8864, percent:0.0}
                    var user_id = parseInt(user.get('user_id'));
                    var rel_id = Math.floor((Math.random() * 10000000000000.0));
                    result = {id:rel_id, user_id:user_id, percent:percent};
                }
            });

	    if (null == result) {
		me.markInvalid('Unable to parse assignment "'+value+'"');
	    }

            return result;
        },

        /**
         * Parse a string like "[80%]" into the number 80.
         * Returns 100 for an empty or invalid string.
         */
        parseAssignmentPercent: function(me, percentString) {
            if (!Ext.isString(percentString) || 0 == percentString.length) { return 100.0; }

            var str = percentString;
            if (!/^\[.+\]$/.test(str)) {
                return "Percent specification '"+str+"' does not consist of a brackets enclosing a number.";
            }
            var str = str.substr(1,str.length - 2);
            if (!/^[0-9\.]+%$/.test(str)) {
                return "Percent specification '"+str+"' does not include in it's brackets a number followed by '%'.";
            }
            var str = str.substr(0,str.length - 1);
            var number = parseFloat(str);

            if (NaN == number) {
                return "Percent specification '"+str+"' does not include a valid number between it's brackets.";
            }
            return number;
        },

        /**
         * Format assignments to a String
         */
        formatAssignments: function(assig) {
            if (Ext.isString(assig)) { return assig; }
            var projectMemberStore = Ext.StoreManager.get('projectMemberStore');
            var groupStore = Ext.StoreManager.get('groupStore');

            var result = "";
            if (null != assig) {
                assig.forEach(function(assignee) {
                    if ("" != result) { result = result + ";"; }
                    var userId = ""+assignee.user_id;
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
                    if (100 != assignee.percent) {
                        result = result + '['+assignee.percent+'%]';
                    }
                });
            }
            return result;
        }
    },										// End statics
    
    initValue: function() {
        var me = this;
        var value = me.value;
        if (Ext.isString(value)) {
            me.value = me.rawToValue(value);					// If a String value was supplied, try to convert it to a proper Date
        }
        me.callParent();
    },

    getErrors: function(value) {
        var me = this;
        return [];								// Empty list of errors at the moment
    },

    rawToValue: function(rawValue) {
	var me = this;
	var val = this.statics().parseAssignments(me, rawValue) || rawValue || null;

	// if (val.constructor === Array) { if (val.length == 0) { val = ""; } }

	console.log('POTaskAssignment.rawToValue: '+rawValue+' -> '+val);
	console.log(val);

        return val;
    },

    valueToRaw: function(value) {
        var raw = this.statics().formatAssignments(value);
	console.log('POTaskAssignment.valueToRaw: '+value+' -> '+raw);
        return raw;
    },

    getSubmitValue: function() {
        var value = this.getValue();
        return value;
    },


    /**
     * Open the TaskProperty panel with the Assignments
     * tab open in order to edit assignments.
     */
    onTriggerClick: function(a, b, c, d) {
        var me = this;
        var treePanel = Ext.getCmp('ganttTreePanel');
        var value = treePanel.getSelectionModel().getLastSelected();
        var taskPropertyPanel = Ext.getCmp('ganttTaskPropertyPanel');
        taskPropertyPanel.setValue(value);
        taskPropertyPanel.setActiveTab('taskPropertyAssignments');
        taskPropertyPanel.show();						// Show handled by picker management
    }
});

