/*
 * TaskStatusTheme.js
 *
 * Copyright (c) 2011 - 2014 ]project-open[ Business Solutions, S.L.
 * This file may be used under the terms of the GNU General Public
 * License version 3.0 or alternatively unter the terms of the ]po[
 * FL or CL license as specified in www.project-open.com/en/license.
 */


// Fake theme class to satisfy the loader
Ext.define('PO.view.theme.TaskStatusTheme', {extend: 'Ext.chart.theme.Base'});


/**
 * Custom theme for tasks status colors.
 * Must be defined as Ext.chart.theme.*.
 */

Ext.define('Ext.chart.theme.TaskStatusTheme', {
    extend: 'Ext.chart.theme.Base',
    requires: ['Ext.chart.theme.Base'],

    constructor: function(config) {
        this.callParent([Ext.apply({ 
            // Colors for the various states of a status (blue, green, yellow, red, white, ...)
            colors: [ 
                "#51afc6",		// blue - not started yet
                "#94Ce0a",		// green - ongoing green
                "#ffd13e",		// yellow - ongoing yellow
                "#F61120",		// red
                "#E0E0E0",		// white - done
                "#cc5ab8",		// purple - undefined
                "#a61187",		// purple
                "#24ad9a",		// turquise - done
                "#7c7474",		// grey
                "#566e34",            // dark green
                "#dfe8f6",		// Sencha light blue
            ],
            // Colors for the outer "strokes" of states when using gradients
	    strokeColors: [
		'#004080', 
		'#008080', 
		'#808000', 
		'#800000', 
		'#000000', 
		'#000000', 
		'#000000', 
		'#000000', 
		'#000000', 
		'#000000', 
		'#0000FF'
	    ]
        }, config)]);
    }
});


