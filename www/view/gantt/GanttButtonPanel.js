/*
 * GanttButtonPanel.js
 *
 * Copyright (c) 2011 - 2014 ]project-open[ Business Solutions, S.L.
 * This file may be used under the terms of the GNU General Public
 * License version 3.0 or alternatively unter the terms of the ]po[
 * FL or CL license as specified in www.project-open.org/en/license.
 */

/**
 * GanttButtonPanel
 */
Ext.define('PO.view.gantt.GanttButtonPanel', {
    extend:				'Ext.panel.Panel',
    alias:				'ganttButtonPanel',
    width: 900,
    height: 500,
    layout: 'border',
    defaults: {
	collapsible: true,
	split: true,
	bodyPadding: 0
    },
    tbar: [
	{
	    text: 'OK',
	    icon: '/intranet/images/navbar_default/disk.png',
	    tooltip: 'Save the project to the ]po[ back-end',
	    id: 'buttonSave'
	}, {
	    icon: '/intranet/images/navbar_default/folder_go.png',
	    tooltip: 'Load a project from he ]po[ back-end',
	    id: 'buttonLoad'
	}, {
	    xtype: 'tbseparator' 
	}, {
	    icon: '/intranet/images/navbar_default/add.png',
	    tooltip: 'Add a new task',
	    id: 'buttonAdd'
	}, {
	    icon: '/intranet/images/navbar_default/delete.png',
	    tooltip: 'Delete a task',
	    id: 'buttonDelete'
	}, {
	    xtype: 'tbseparator' 
	}, {
	    icon: '/intranet/images/navbar_default/arrow_left.png',
	    tooltip: 'Reduce Indent',
	    id: 'buttonReduceIndent'
	}, {
	    icon: '/intranet/images/navbar_default/arrow_right.png',
	    tooltip: 'Increase Indent',
	    id: 'buttonIncreaseIndent'
	}, {
	    xtype: 'tbseparator'
	}, {
	    icon: '/intranet/images/navbar_default/link.png',
	    tooltip: 'Dependencies',
	    id: 'buttonDependencies'
	}, {
	    icon: '/intranet/images/navbar_default/link_add.png',
	    tooltip: 'Add dependency',
	    id: 'buttonAddDependency'
	}, {
	    icon: '/intranet/images/navbar_default/link_break.png',
	    tooltip: 'Break dependency',
	    id: 'buttonBreakDependency'
	}, '->' , {
	    icon: '/intranet/images/navbar_default/zoom_in.png',
	    tooltip: 'Zoom in time axis',
	    id: 'buttonZoomIn'
	}, {
	    icon: '/intranet/images/navbar_default/zoom_out.png',
	    tooltip: 'Zoom out of time axis',
	    id: 'buttonZoomOut'
	}, {
	    icon: '/intranet/images/navbar_default/wrench.png',
	    tooltip: 'Settings',
	    id: 'buttonSettings'
	}
    ],
    renderTo: '@task_editor_id@'

});

