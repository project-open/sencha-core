/*
 * PO.js
 *
 * Copyright (c) 2011 - 2015 ]project-open[ Business Solutions, S.L.
 * This file may be used under the terms of the GNU General Public
 * License version 3.0 or alternatively unter the terms of the ]po[
 * FL or CL license as specified in www.project-open.com/en/license.
 */

/**
 * Main ExtJS PO object with a number of convenience functions.
 */
Ext.define('PO.Utilities', {
    debug: false,

    statics: {
	/**
	 * Convert a date to PostgreSQL "time stamp with timezone" string
	 */
	dateToPg: function(d){
            var YYYY,YY,MM,M,DD,D,hh,h,mm,m,ss,s,dMod,th,tzSign,tzo,tzAbs,tz;
            YY = ((YYYY = d.getFullYear())+"").substr(2,2);
            MM = (M = d.getMonth()+1) < 10 ? ('0'+M) : M;
            DD = (D = d.getDate()) < 10 ? ('0'+D) : D;
            th = (D >= 10&&D <= 20) ? 'th' : ((dMod = D%10) == 1) ? 'st' : (dMod == 2) ? 'nd' : (dMod == 3) ? 'rd' : 'th';
	    
            hh = (h = d.getHours()) < 10 ? ('0'+h) : h;
            mm = (m = d.getMinutes()) < 10 ? ('0'+m) : m;
            ss = (s = d.getSeconds()) < 10 ? ('0'+s) : s;
	    
            tzSign = (tzo = d.getTimezoneOffset()/-60) < 0 ? '-' : '+';
            tz = (tzAbs = Math.abs(tzo)) < 10 ? ('0'+tzAbs) : ''+tzAbs;
	    
            return YYYY+'-'+MM+'-'+DD+' '+hh+':'+mm+':'+ss+tzSign+tz;
	},

	/**
	 * Convert a PostgreSQL "time stamp with timezone" string to Date
	 */
	pgToDate: function(s) {
	    // PostgreSQL Timestamp: "2015-06-31 15:33:59+02"
            var rx = /^(\d{4})\-(\d\d)\-(\d\d) (\d\d):(\d\d):(\d\d)([\+\-]\d\d)$/;
	    var p;
            if ((p = rx.exec(s)) !== null) {
		var date = new Date(parseInt(p[1]), parseInt(p[2])-1, parseInt(p[3]), parseInt(p[4]), parseInt(p[5]), parseInt(p[6]));
		var time = date.getTime();
		var tzo = parseInt(p[7]) * 60 * 60 * 1000;
		var localTzo = date.getTimezoneOffset() * -1 * 60 * 1000;
		return new Date(time - tzo + localTzo);
            }

	    // Fallback: PostgreSQL Date + Time, ignoring the rest: "2015-06-31 15:33"
            rx = /^(\d{4})\-(\d\d)\-(\d\d) (\d\d):(\d\d)/;
            if ((p = rx.exec(s)) !== null) {
		return new Date(parseInt(p[1]), parseInt(p[2])-1, parseInt(p[3]), parseInt(p[4]), parseInt(p[5]), 0);
            }

	    // PostgreSQL Date, ignoring the rest: "2015-06-31"
            rx = /^(\d{4})\-(\d\d)\-(\d\d)/;
            if ((p = rx.exec(s)) !== null) {
		return new Date(parseInt(p[1]), parseInt(p[2])-1, parseInt(p[3]));
            }

	    // Didn't find any matching format
            return NaN;
	}
    }
});

