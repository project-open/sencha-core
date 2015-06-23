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
    extend: 'Ext.form.field.Picker',
    requires: ['Ext.grid.Panel'],
    alias: 'widget.potaskassignment',

    initValue: function() {
        var me = this;
        console.log('POTaskAssignment.initValue');
        var value = me.value;
        if (Ext.isString(value)) {
            me.value = me.rawToValue(value);        // If a String value was supplied, try to convert it to a proper Date
        }
        me.callParent();
    },

    getErrors: function(value) {
        var me = this;
        return [];              // Empty list of errors at the moment
    },

    rawToValue: function(rawValue) {
        // console.log('POTaskAssignment.rawToValue: rawValue='+rawValue);
        return this.parseAssignments(rawValue) || rawValue || null;
    },

    valueToRaw: function(value) {
        // console.log('POTaskAssignment.valueToRaw: value='+value);
        return this.formatAssignments(value);
    },


     /**
      * Attempts to parse a given string value into an assignment store.
      * @param {String} value The value to attempt to parse
      * @param {String} format A valid date format (see {@link Ext.Date#parse})
      * @return {Date} The parsed Date object, or null if the value could not be successfully parsed.
      */
    safeParse : function(value, format) {
        var me = this;
        var result = null;
        return result;
    },

    getSubmitValue: function() {
        var value = this.getValue();
        console.log('POTaskAssignment.getSubmitValue: ToDo');
        return value;
    },

    /**
     * Covert a comma separated list of initials into an 
     * array of user assignments
     */
    parseAssignments: function(value) {
        // console.log('POTaskAssignment.parseAssignments: value='+value);
        if (!Ext.isString(value)) {return value; }

        var result = [];
        var names = value.split(";");
        for(var i = 0; i < names.length; i++) {
            var name = names[i];               // BB[20%]
            var assigObject = this.parseAssignment(name);
            // console.log('POTaskAssignment.parseAssignments: i='+i+', name='+name+' -> '+assigObject);
            if (!Ext.isString(assigObject) && null != assigObject) {
                result.push(assigObject);
            }
        }
        return result;
    },

    /**
     * Returns an assignment object if it can successfully parse a value like "BB[80%]".
     * Returns a string with an error message if it can't parse the value.
     */
    parseAssignment: function(value) {
        if (!Ext.isString(value)) { 
            return "Value='"+value+"' is not a string but a "+typeof value; 
        }

        value = value.replace(/ /,"");            // Eliminate white spaces, better than trim()
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
        var percent = this.parseAssignmentPercent(percentString.trim());   // Number indicating percent or an error
	// console.log("POTaskAssignment.parseAssignmentPercent: '"+percentString+"' -> '"+percent+"'");
        if (Ext.isString(percent)) { return percent; }                     // Return an error string

        // ToDo: Sort the user store alphabetically in order to create
        // deterministic results
        var result = null;
        var userStore = Ext.StoreManager.get('userStore');
        var letters = value.toUpperCase().split("");
        userStore.each(function(user) {
            if (null != result) { return; }
            var firstNames = user.get('first_names');
            var lastName = user.get('last_name');
            var firstNamesInitial = firstNames.toUpperCase().substr(0,1);
            var lastNameInitial = lastName.toUpperCase().substr(0,1);
            var found = false;
            if (letters[0] == firstNamesInitial && letters[1] == lastNameInitial) { found = true; }
            
            if (found) {
                // {id:8864, percent:   0.0, name:'Ben Bigboss', email:'bbigboss@tigerpond.com', initials:'BB'}
		var user_id = parseInt(user.get('user_id'));
		var name = firstNames + " " + lastName;
		var email = user.get('email');
		var initials = firstNamesInitial+lastNameInitial;
                result = {id: user_id, percent: percent, name: name, email: email, initials: initials};
            }
        });

	return result;
    },

    /**
     * Parse a string like "[80%]" into the number 80.
     * Returns 100 for an empty or invalid string.
     */
    parseAssignmentPercent: function(percentString) {
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

        var result = "";
        if (null != assig) {
            assig.forEach(function(assignee) {
                if ("" != result) { result = result + ";"; }
                result = result + assignee.initials;
                if (100 != assignee.percent) {
                    result = result + '['+assignee.percent+'%]';
                }
            });
        }
        return result;
    },

    // copied from ComboBox 
    createPicker: function(a, b, c, d) {
        console.log('PO.view.field.POTaskAssignmentField.createPicker');
        var me = this;

	var treePanel = Ext.getCmp('ganttTreePanel');
	var rec = treePanel.getSelectionModel().getLastSelected();

	var taskPropertyPanel = Ext.getCmp('ganttTaskPropertyPanel');
	taskPropertyPanel.setValue(rec);
	taskPropertyPanel.setActiveTab('taskPropertyAssignments');
	// taskPropertyPanel.show();           // Show handled by picker management

	return taskPropertyPanel;
    },
	
    onDownArrow: function(e) {
        console.log('PO.view.field.POTaskAssignmentField.onDownArrow');
        this.callParent(arguments);
        if (this.isExpanded) {
            this.getPicker().focus();
        }
    },

    onSelect: function(m, d) {
        console.log('PO.view.field.POTaskAssignmentField.onSelect');
        var me = this;
        me.setValue(d);
        me.fireEvent('select', me, d);
        me.collapse();
    },

    /**
     * @private
     * Sets the Date picker's value to match the current field value when expanding.
     */
    onExpand: function() {
	var treePanel = Ext.getCmp('ganttTreePanel');
        // var value = this.getValue();
	var value = treePanel.getSelectionModel().getLastSelected();
        this.picker.setValue(value);

	var taskPropertyPanel = Ext.getCmp('ganttTaskPropertyPanel');
	taskPropertyPanel.setActiveTab('taskPropertyAssignments');

	/*
	var taskPropertyPanel = Ext.getCmp('ganttTaskPropertyPanel');
	taskPropertyPanel.hideTabs();
	taskPropertyPanel.title = '';
	taskPropertyPanel.closable = false;
	taskPropertyPanel.header = false;
	taskPropertyPanel.frame = false;
	taskPropertyPanel.frameHeader = false;
	taskPropertyPanel.shadow = false,
	taskPropertyPanel.border = true;
	taskPropertyPanel.preventHeader = true;
	*/
    },

    /**
     * @private
     * Focuses the field when collapsing the Date picker.
     */
    onCollapse: function() {
        this.focus(false, 60);
    },

    // private
    beforeBlur : function(){
        var me = this,
        v = me.parseAssignments(me.getRawValue()),
        focusTask = me.focusTask;
        if (focusTask) { focusTask.cancel(); }
        if (v) { me.setValue(v); }
    }
});

