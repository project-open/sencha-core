

Ext.define('PO.view.task.TaskManagementMixin', {

    /**
     * Constructor is required for Mixin
     */
    constructor: function() {  },


    /**
     * Draw a task box
     */
    drawTaskBox: function(surface, fillColor, model, x, y, w, h) {
	var colorCode = model.get('color_code');
	var nameL10n = "Name", startL10n = "Start", endL10n = "End", doneL10n = "Done";

	// Build a HTML table with information about the task/ticket/project
        var html = "<table cellpadding=0 cellspacing=2>";
	html = html + "<tr><td>" + nameL10n + ":</td><td><nobr>" + model.get('project_name') + "</nobr></td></tr>";
	var startDate = model.get('start_date'); 
	if (startDate) html = html + "<tr><td>" + startL10n + ":</td><td>" + startDate.substring(0,10) + "</td></tr>";
	var endDate = model.get('end_date');
	if (endDate) html = html + "<tr><td>" + endL10n + ":</td><td>" + endDate.substring(0,10) + "</td></tr>";
	var percentCompleted = model.get('percent_completed');
	if (100 == model.get('type_id') && ("" == percentCompleted || !percentCompleted)) { percentCompleted = 0 };
	if (null != percentCompleted) html = html + "<tr><td>" + doneL10n + ":</td><td>" + percentCompleted + "%</td></tr>";
	html = html + "</table>";

        var box = surface.add({
            type: 'rect', x: x, y: y, width: w, height: h, 
            fill: fillColor,
            stroke: 'black', 'stroke-width': 0.0
        }).show(true);
        box.project_id = model.get('project_id');                                    // set project_id for onclick event
        Ext.create("Ext.tip.ToolTip", { target: box.el, html: html, hideDelay: 1000 });
        box.on({
            click: function(sprite, event, fn) {
                var pid = this.project_id;                                           // this is the project_id added above
                var url = '/intranet/projects/view?project_id='+pid;
                window.open(url);                       // Open project in new browser tab
            },
            mouseover: function() { this.animate({duration: 500, to: {'stroke-width': 1.0}}); },
            mouseout: function()  { this.animate({duration: 500, to: {'stroke-width': 0.0}}); }
        });

    }, 

    /**
     * Shared helper function for drawing 
     */
    drawTaskBackground: function(surface, fillColor, oid, url, y1, y2) {
        var me = this;
        var surfaceWidth = surface.width;
        var lastUserBackground = surface.add({
            type: 'rect', x: 0, y: y1, width: surfaceWidth, height: (y2 - y1),
            zIndex: -1000,
	    opacity: 0.0,
            fill: fillColor
        }).show(true);
        lastUserBackground.object_id = oid;
        if (0 != oid) {
            lastUserBackground.on({
                click: function(sprite, event, fn) { window.open(url+this.object_id); },         // Open in new tab
                mouseover: function() { this.animate({duration: 500, to: {'opacity': 1.0}}); },
                mouseout: function()  { this.animate({duration: 500, to: {'opacity': 0.2}}); }
            });
        }
    }

});


