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
	 * Write out an error message typically received from
	 * the back-end REST interface.
	 */
	reportError : function(title, msg) {
            var me = this;

	    // Split lines with length > maxLen into multiple lines
	    var maxLen = 75;
	    var msgLimited = "";
	    var msgLines = msg.split("\n");
	    for (var i = 0; i < msgLines.length; i++) {
		var line = msgLines[i];
		while (line.length > maxLen) {
		    msgLimited = msgLimited + line.substr(0,maxLen) + "\n";
		    line = line.substr(maxLen);
		    
		}
		msgLimited = msgLimited + line + "\n";
	    }


	    var msgBox = Ext.create('Ext.window.MessageBox', {  });
	    msgBox.show({
		title: title,
		msg: "Error saving data on the server side.<br>&nbsp;<br>"+
		    "Send error message to ]project-open[ for incident reporting?<br>"+
		    "Please see our <a href='http://www.project-open.com/en/company/project-open-privacy.html'>privacy statementy</a> "+
		    "for details.<br><pre>" + msgLimited+"</pre>",
		minWidth: 600,
		buttonText: { yes: "Report this Error" },
		icon: Ext.Msg.QUESTION,
		fn: function(text) {
		    if (text == 'yes') {
			Ext.Ajax.request({
			    url: "http://www.project-open.net/intranet-forum/new-system-incident",
			    method: 'POST',
			    headers: { 
				'Content-Type': 'multipart/form-data',
				'Access-Control-Allow-Origin': '*'
			    },
			    params : {
				privacy_statement_p: 't', no_master_p: '1', error_info: msg,
				error_url: window.location.pathname + window.location.search, error_location: '@error_location@',
				error_type: '@error_type@', report_url: '@report_url@',system_url: '@system_url@',
				error_first_names: '@first_names@', error_last_name: '@last_name@',  error_email: '@email@',
				username: '@username@',
				publisher_name: '@publisher_name@',
				package_versions: '@package_versions@',
				system_id: '@system_id@', hardware_id: '@hardware_id@',
				platform: '@platform@', os: '@os@', os_version: '@os_version@'
			    },
			    success: function(response) {
				var text = response.responseText;
				Ext.Msg.alert('Successfully reported', text);
			    },
			    failure: function(response) {
				var text = response.responseText;
				Ext.Msg.alert('Error reporting incident', 'Error reporting incident.<br>'+text);
			    },
			});
		    }
		}
	    });    // msgBox.show()
	    msgBox.setOverflowXY('auto', 'auto');
	},

	/**
	 * Extract the current userId from the OpenACS session cookie
	 */
	currentUserId : function(){
	    return parseInt('@user_id@');

            var me = this;
            var userId = 0;							// user_id=0 represents "anonymous visitor"
            var c = document.cookie + ";";
            var re = /\s?(.*?)=(.*?);/g;
            var prefix = 'ad_';
            var prefixLen = prefix.length;

            while((matches = re.exec(c)) != null){
		var key = matches[1];
		var valueUndecoded = matches[2];
		if (key == 'ad_user_login') {
                    var userIdString = valueUndecoded.substr(0, valueUndecoded.indexOf('%')); 
                    userId = parseInt(userIdString);
		}
            }
            return userId;
	},


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

