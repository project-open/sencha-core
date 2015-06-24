/*
 * PODateField.js
 *
 * Copyright (c) 2011 - 2014 ]project-open[ Business Solutions, S.L.
 * This file may be used under the terms of the GNU General Public
 * License version 3.0 or alternatively unter the terms of the ]po[
 * FL or CL license as specified in www.project-open.com/en/license.
 */

Ext.define('PO.view.field.PODateField', {
    extend: 'Ext.form.field.Date',
    alias: 'widget.podatefield',

    format : "Y-m-d",
    altFormats : "m/d/Y|n/j/Y|n/j/y|m/j/y|n/d/y|m/j/Y|n/d/Y|m-d-y|m-d-Y|m/d|m-d|md|mdy|mdY|d|Y-m-d|n-j|n/j",
    disabledDaysText : "Disabled",
    disabledDatesText : "Disabled",
    minText : "The date in this field must be equal to or after {0}",
    maxText : "The date in this field must be equal to or before {0}",
    invalidText : "{0} is not a valid date - it must be in the format {1}",
    triggerCls : Ext.baseCSSPrefix + 'form-date-trigger',
    showToday : true,
    initTime: '12', // 24 hour format
    initTimeFormat: 'H',
    matchFieldWidth: false,
    startDay: 0,

    /**
     * Returns an array of errors if string value is not an ISO date.
     */
    getErrors: function(value) {
        var me = this;
	var errors = [];
        return errors;
    },


    rawToValue: function(rawValue) {
        return this.parseDate(rawValue) || rawValue || null;
    },

    valueToRaw: function(value) {
        return this.formatDate(this.parseDate(value));
    },

    getSubmitValue: function() {
        var format = this.submitFormat || this.format,
            value = this.getValue();

        return value ? Ext.Date.format(value, format) : '';
    },

    /**
     * Takes something and returns an ISO string
     */
    parseDate : function(value) {
        if(!value) { return value; }
        if(Ext.isDate(value)){ return Ext.Date.format(value, 'Y-m-d'); }
        if(Ext.isString(value)){ return value.substring(0,10); }
        return value;
    },

    /**
     * Takes a date and returns an ISO string
     */
    formatDate : function(date){
        if(!date) { return date; }
	if(Ext.isDate(date)){ return Ext.Date.format(date, 'Y-m-d'); }
        if(Ext.isString(date)){ return date.substring(0,10); }
        return date;
    },

    createPicker: function() {
        var me = this,
            format = Ext.String.format;

        var picker = new Ext.picker.Date({
            pickerField: me,
            ownerCt: me.ownerCt,
            renderTo: document.body,
            floating: true,
            hidden: true,
            focusOnShow: true,
            minDate: new Date('2000-01-01'),
            maxDate: new Date('2099-12-31'),
            disabledDatesRE: me.disabledDatesRE,
            disabledDatesText: me.disabledDatesText,
            disabledDays: me.disabledDays,
            disabledDaysText: me.disabledDaysText,
            format: me.format,
            showToday: me.showToday,
            startDay: me.startDay,
            minText: format(me.minText, me.formatDate(me.minValue)),
            maxText: format(me.maxText, me.formatDate(me.maxValue)),
            listeners: {
                scope: me,
                select: me.onSelect
            },
            keyNavConfig: {
                esc: function() {
                    me.collapse();
                }
            }
        });
	
	// ToDo: Picker doesn't show the current value in the field
	var defaultValue = me.getValue();
	picker.setValue(new Date(defaultValue));

	return picker;
    },
    
    onDownArrow: function(e) {
        this.callParent(arguments);
        if (this.isExpanded) {
            this.getPicker().focus();
        }
    },

    onSelect: function(m, d) {
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
        var value = new Date(this.getValue());
        this.picker.setValue(Ext.isDate(value) ? value : new Date());
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
            v = me.parseDate(me.getRawValue()),
            focusTask = me.focusTask;

        if (focusTask) {
            focusTask.cancel();
        }

        if (v) {
            me.setValue(v);
        }
    }


});

