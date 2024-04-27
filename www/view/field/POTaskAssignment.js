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
         * Parse a single assignment value like "BB[80%]".
         * Returns an assignment object if successful.
         * Returns null plus executes a me.markInvalid(...) if it can't parse the value.
         */
        parseAssignment: function(me, value) {
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
            var percentString = value;
            while (/^[a-zA-Z0-9]/.test(percentString.substr(0,1))) {
                initialsString = initialsString + percentString.substr(0,1).toUpperCase();
                percentString = percentString.substring(1,value.length);
            }
            var percent = this.parseAssignmentPercent(me, percentString.trim());	// Number indicating percent or an error
            if (Ext.isString(percent)) { 	     					// Returned string is an error
                console.log('parseAssignment('+value+'): percent="'+percent+'" is a string indicating an error');
                me.markInvalid(percent);
                return;
            }

            // Loop through all users and check if the initials 
            var result = null;
            var projectMemberStore = Ext.StoreManager.get('projectMemberStore');
            projectMemberStore.each(function(user) {
                if (null != result) { return; } // Already found with previous user, skipping loop
                var initialsUser = user.get('initials').toUpperCase();
                if (initialsUser == initialsString) {
                    var user_id = parseInt(user.get('user_id'));
                    var rel_id = Math.floor((Math.random() * 10000000000000.0));
                    result = {id:rel_id, user_id:user_id, percent:percent};
                    console.log(result);
                }
            });

            if (null == result) {
                me.markInvalid('<nobr>Unable to parse "'+value+'"</nobr>');
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
                            result = result + userModel.get('initials');
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
        // console.log('POTaskAssignment.rawToValue: '+rawValue+' -> '+val);
        // console.log(val);
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
