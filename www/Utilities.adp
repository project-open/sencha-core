/*
 * PO.Utilities.js.adp
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

            if (!msg) msg = "error message not available (returned from server side)";

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
                    "Please see our <a href='https://www.project-open.com/en/company/project-open-privacy.html' target='_'>privacy statementy</a> "+
                    "for details.<br><pre>" + msgLimited+"</pre>",
                minWidth: 600,
                buttonText: { yes: "Report this Error" },
                icon: Ext.Msg.QUESTION,
                fn: function(text) {
                    if (text == 'yes') {
                        Ext.Ajax.request({
                            url: "https://www.project-open.net/intranet-forum/new-system-incident",
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
         * Write out a message
         */
        reportMessage : function(title, msg) {
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
                msg: msgLimited,
                minWidth: 600,
                buttonText: { yes: "OK" },
                icon: Ext.Msg.OK,
                fn: function(text) { }
            });
            msgBox.setOverflowXY('auto', 'auto');
        },

        /**
         * Handle errors while trying to load a store
         */
        reportStoreError : function(storeName, operation) {
            var me = this;

            var errorObject = operation.getError();
            var errorMsg = typeof errorObject;
            if ("object" == typeof errorObject) { 
                errorMsg = errorObject.statusText; 
            } else { 
                errorMsg = errorObject; 
            }

            if (!errorMsg) {
                var request = operation.request;
                if (request) {
                    var reader = request.proxy.reader;
                    if (reader) {
                        errorMsg = reader.rawData.message;
                    }
                }
            }

            if (!errorMsg) { errorMsg = 'Unable to find error message'; }

            PO.Utilities.reportError("Error loading "+storeName, errorMsg)
        },

        /**
         * Determine if debug is switched on for certain IDs.
         * Check Admin -> Parameters -> intranet-timesheet2-weekly -> DebugHash
         */
        getDebug: function(id) {
            // Extract debugHash from ]po[ parameters
            var debugHash = @debug_json;noquote@;

            // Check for a debug setting for the specific Id
            var debug = parseInt(debugHash[id]);
            if (!isNaN(debug)) return debug;
            
            // Use the default debug
            debug = parseInt(debugHash['default']);
            if (!isNaN(debug)) return debug;
            
            // invalid configuration - enable debug
            return 1;
        },

        /**
         * Extract the current userId from the OpenACS session cookie
         */
        userId : function() { return parseInt('@user_id@'); },
        authToken : function() { return '<%= [im_generate_auto_login -user_id $user_id] %>' },
        systemId : function() { return '@system_id@'; },
        
        /**
         * Which version of Sencha is installed?
         * This function relies on the TCL im_sencha_extjs_version function.
         */
        senchaVersion: function() { return '@sencha_version@'; },

        /**
         * Production or development version of Sencha?
         * Returns true if development version.
         */
        senchaDevP: function() { return ("dev" == '@sencha_version_prod_dev@'); },

        /**
         * Production or development version of Sencha?
         * Returns true if production version.
         */
        senchaProdP: function() { return ("prod" == '@sencha_version_prod_dev@'); },

        /**
         * Convert a date to PostgreSQL "time stamp with timezone" string
         */
        dateToPg: function(d){
            var YYYY,YY,MM,M,DD,D,hh,h,mm,m,ss,s,dMod,th,tzSign,tzo,tzAbs,tz;
            YY = ((YYYY = d.getFullYear())+"").substr(2,2);
            MM = (M = d.getMonth()+1) < 10 ? ('0'+M) : M;
            DD = (D = d.getDate()) < 10 ? ('0'+D) : D;
            // th = (D >= 10 && D <= 20) ? 'th' : ((dMod = D % 10) == 1) ? 'st' : (dMod == 2) ? 'nd' : (dMod == 3) ? 'rd' : 'th';
            
            hh = (h = d.getHours()) < 10 ? ('0'+h) : h;
            mm = (m = d.getMinutes()) < 10 ? ('0'+m) : m;
            ss = (s = d.getSeconds()) < 10 ? ('0'+s) : s;

            // Handle time zone. Time zones with fractions of an hour need to be added with ':30'
            tzSign = (tzo = d.getTimezoneOffset()/-60) < 0 ? '-' : '+';
            tzAbs = Math.abs(tzo);
            if (Math.floor(tzAbs) != tzAbs) {
               tzAbsFrac = ':30';
               tzAbs = Math.floor(tzAbs);
            } else {
               tzAbsFrac = '';
            }
            tz = tzAbs < 10 ? ('0'+tzAbs) : ''+tzAbs;

            return YYYY+'-'+MM+'-'+DD+' '+hh+':'+mm+':'+ss;
            // return YYYY+'-'+MM+'-'+DD+' '+hh+':'+mm+':'+ss+tzSign+tz+tzAbsFrac;
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
        },

        /**
         * Setup the Ext.util.Format class
         */
        currencySign: function(currency) { 
            var currencySignHash = {
                'USD': '$',	'EUR': '€',	'AED': 'د.إ',	'AFN': 'Af',	'ALL': 'L',
                'AMD': 'Դ',	'AOA': 'Kz',	'ARS': '$',	'AUD': '$',	'AWG': 'ƒ',
                'AZN': 'ман',	'BAM': 'КМ',	'BBD': '$',	'BDT': '৳',	'BGN': 'лв',
                'BHD': 'ب.د',	'BIF': '₣',	'BMD': '$',	'BND': '$',	'BOB': 'Bs.',
                'BRL': 'R$',	'BSD': '$',	'BWP': 'P',	'BYN': 'Br',	'BZD': '$',
                'CAD': '$',	'CDF': '₣',	'CHF': '₣',	'CLP': '$',	'CNY': '¥',
                'COP': '$',	'CRC': '₡',	'CUP': '$',	'CVE': '$',	'CZK': 'Kč',
                'DJF': '₣',	'DKK': 'kr',	'DOP': '$',	'DZD': 'د.ج',	'EGP': '£',
                'ERN': 'Nfk',	'FJD': '$',	'FKP': '£',	'GBP': '£',	'GEL': 'ლ',
                'GHS': '₵',	'GIP': '£',	'GMD': 'D',	'GNF': '₣',	'GTQ': 'Q',
                'GYD': '$',	'HKD': '$',	'HNL': 'L',	'HRK': 'Kn',	'HTG': 'G',
                'HUF': 'Ft',	'IDR': 'Rp',	'ILS': '₪',	'INR': '₹',	'IQD': 'ع.د',
                'IRR': '﷼',	'ISK': 'Kr',	'JMD': '$',	'JOD': 'د.ا',	'JPY': '¥',
                'KES': 'Sh',	'KHR': '៛',	'KPW': '₩',	'KRW': '₩',	'KWD': 'د.ك',
                'KYD': '$',	'KZT': '〒',	'LAK': '₭',	'LBP': 'ل.ل',	'LKR': 'Rs',
                'LRD': '$',	'LSL': 'L',	'LYD': 'ل.د',	'MAD': 'د.م.',	'MDL': 'L',
                'MKD': 'ден',	'MMK': 'K',	'MNT': '₮',	'MOP': 'P',	'MRU': 'UM',
                'MUR': '₨',	'MVR': 'ރ.',	'MWK': 'MK',	'MXN': '$',	'MYR': 'RM',
                'MZN': 'MTn',	'NAD': '$',	'NGN': '₦',	'NIO': 'C$',	'NOK': 'kr',
                'NPR': '₨',	'NZD': '$',	'OMR': 'ر.ع.',	'PAB': 'B/.',	'PEN': 'S/.',
                'PGK': 'K',	'PHP': '₱',	'PKR': '₨',	'PLN': 'zł',	'PYG': '₲',
                'QAR': 'ر.ق',	'RON': 'L',	'RSD': 'din',	'RUB': 'р.',	'RWF': '₣',
                'SAR': 'ر.س',	'SBD': '$',	'SCR': '₨',	'SDG': '£',	'SEK': 'kr',
                'SGD': '$',	'SHP': '£',	'SLL': 'Le',	'SOS': 'Sh',	'SRD': '$',
                'STN': 'Db',	'SYP': 'ل.س',	'SZL': 'L',	'THB': '฿',	'TJS': 'ЅМ',
                'TMT': 'm',	'TND': 'د.ت',	'TOP': 'T$',	'TRY': '₤',	'TTD': '$',
                'TWD': '$',	'TZS': 'Sh',	'UAH': '₴',	'UGX': 'Sh',	'UYU': '$',
                'VEF': 'Bs F',	'VND': '₫',	'VUV': 'Vt',	'WST': 'T',	'XAF': '₣',
                'XCD': '$',	'XPF': '₣',	'YER': '﷼',	'ZAR': 'R',	'ZMW': 'ZK',
                'ZWL': '$'
            };
	    var sign = currencySignHash[currency];
	    if (!sign) sign = '€';
	    return sign;
        }

    }

});

