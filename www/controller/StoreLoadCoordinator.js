// /sencha-core/www/controller/StoreLoadCoordinator.js
//
// Copyright (C) 2013 ]project-open[
//
// All rights reserved. Please see
// http://www.project-open.com/license/ for details.
//

/*
 * This coodinator is initiated with:
 * stores: A list of stores that need to be loaded and
 * listeners: {
 *           load: function() {}
 * }
 * It calls the listener function once all stores
 * have been sussessfully loaded.
 *
 * The StoreLoadCoordinator plays it's role after
 * Ext.Loader has finished loading classes and before
 * the start of the actual application.
*/

Ext.define('PO.controller.StoreLoadCoordinator', {
    
    /**
     * Enable console debugging messages
     */
    debug: 0,

    mixins: {
        observable: 'Ext.util.Observable'
    },

    resetStoreLoadStates: function() {
        this.storeLoadStates = {};  
        Ext.each(this.stores, function(storeId) {
            this.storeLoadStates[storeId] = false;
        }, this);   
    },

    isLoadingComplete: function() {
        for (var i=0; i<this.stores.length; i++) {
            var key = this.stores[i];
            if (this.storeLoadStates[key] == false) {
                if (this.debug) { console.log('PO.controller.StoreLoadCoordinator.isLoadingComplete: store='+key+' not loaded yet.'); }
                return false;
            }
        }
        return true;
    },

    onStoreLoad: function(store, records, successful, eOpts, storeName) {
        if (this.debug) { console.log('PO.controller.StoreLoadCoordinator.onStoreLoad: store='+store.storeId); }
        this.storeLoadStates[store.storeId] = true;
        if (this.isLoadingComplete() == true) {
            if (this.debug) { console.log('PO.controller.StoreLoadCoordinator.onStoreLoad: all stores loaded - starting application'); }
            this.fireEvent('load');
        }
    },

    constructor: function (config) {
        this.mixins.observable.constructor.call(this, config);
        this.resetStoreLoadStates();
        Ext.each(this.stores, function(storeId) {
            var store = Ext.StoreManager.lookup(storeId);
            store.on('load', Ext.bind(this.onStoreLoad, this, [storeId], true));
        }, this);
        this.addEvents('load');
    }
});


