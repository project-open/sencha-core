

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
        var box = surface.add({
            type: 'rect', x: x, y: y, width: w, height: h, 
            fill: fillColor,
            stroke: 'black', 'stroke-width': 0.0
        }).show(true);
        box.project_id = model.get('project_id');                                    // set project_id for onclick event
        var tooltip = model.get('project_name') + ' (' + colorCode + ')';
        Ext.create("Ext.tip.ToolTip", { target: box.el, html: tooltip, hideDelay: 1000 });
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


