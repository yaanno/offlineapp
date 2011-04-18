/*global document, window, console, $, db */

var App = {
    
    api : 'stuff.json',
    cache : window.applicationCache,
    body : document.body,
    presence : null,
    navigation : $('#navigation ul'),
    contentTitle : $('#content-title'),
    contentButton : $('#content-action'),
    contentPanel : $('#content-main .content'),
    loader : $('#loading'),
    stuff : null,
    version : '0.1',
    appversion : $('#appversion'),
    feedback : $('#feedback'),
    feedbackTpl : $('#feedback-tpl'),
    
    init : function () {
        
        // prevent background to move
        $(this.body).bind('touchmove', function (event) {
            event.preventDefault();
        }, false);
        
        // set up user feedback
        var timeout = 600;
        $(window).bind('ajaxStart', function (event) {
            // trigger feedback message handler
            
            //$(this).show();
        }).bind('ajaxComplete', function (event, xhr, opts) {
            // trigger feedback message handler
            
            // trigger panel loaded handler
            var that = $(this);
            if (opts.url === '_stuff.html') {
                $(window).trigger('panelloaded', { 'page': opts.url })
            }
            
            /*
            window.setTimeout(function () {
                $(that).hide();
            }, timeout);*/
        }).bind('ajaxError', function (event, xhr, opts, error) {
            // trigger error message handler
            console.log(event, xhr, opts, error)
            
        });
        
        // set up custom events
        this.setCustomEvents();
        
        // set up cache listeners
        this.setCacheListeners();
        
        // set up online/offline listeners
        this.setPresenceListeners();
        
        // check online/offline initial state
        this.checkPresence();
        
        // watch navigation events
        $(this.navigation).bind('click', this.handleNavigation);
        
        // watch button
        $(this.contentButton).bind('click', this.handleContentButton);
        
        // show app version
        $(this.appversion).text(this.version);
        
    },
    
    log : function (log) {
        //console.log('logger')
        if (log.type) {
            log = log.type;
        }
        console.log(log);
    },
    
    // online/offline
    
    setPresenceListeners : function () {
        $(window).bind('online', this.checkPresence).bind('offline', this.checkPresence);
    },
    
    checkPresence : function () {
        var state = window.navigator.onLine ? 'online' : 'offline';
        App.setPresence(state);
    },
    
    setPresence : function (state) {
        this.log(state);
        this.presence = state;
    },
    
    // cache
    
    setCacheListeners : function () {
        $(this.cache).bind('checking', this.log);
        $(this.cache).bind('cached', this.log);
        $(this.cache).bind('progress', this.log);
        $(this.cache).bind('downloading', this.log);
        $(this.cache).bind('noupdate', this.log);
        $(this.cache).bind('obsolete', this.log);
        $(this.cache).bind('error', this.log);
        $(this.cache).bind('updateready', this.swapCache);
    },
    
    swapCache : function () {
        App.log('swapping cache');
        App.cache.swapCache();
    },
    
    updateCache : function () {
        if (!this.cache) {
            this.cache = window.applicationCache;
            this.cache.update();
        }
    },
    
    // navigation
    
    handleNavigation : function (event) {
        event.preventDefault();
        var prevElement = $('.active'),
            currElement = $(event.target),
            tab = $(currElement)[0].id;
        
        $(prevElement).removeClass('active');
        $(currElement).parents('li').addClass('active');
        
        App.loadPanel(tab);
    },
    
    // content
    
    handleContentButton : function (event) {
        //event.preventDefault();
        
        if (App.presence === 'online') {
            App.getStuff();
        } else {
            alert('Cannot synchronize while offline.');
        }
    },
    
    loadPanel : function (tab) {
        
        if (tab === 'nav-account') {
            // load account template to panel
            $(this.contentTitle).text(message.ACC_TITLE);
            $(this.contentButton).hide();
            $(this.contentPanel).load('_account.html');
            
        } else if (tab === 'nav-stuff') {
            // load stuff template to panel
            $(this.contentTitle).text(message.STUFF_TITLE);
            $(this.contentButton).text(message.SYNC_BTN).show();
            $(this.contentPanel).load('_stuff.html');
            
            // load stuffz from database
            this.loadStuff();
        }
    },
    
    renderStuff : function () {
        
        if (!this.stuff) {
            this.log('no stuff to render');
            return;
        }
        //$(this.contentPanel).empty();
        //$(this.contentPanel).append("<ul class='presentations'></ul>");
        
        var container = $('.stuff-list'),
            tpl = $("#stuff-tpl").val(),
            t = $.template(tpl);
            
        var i = 0, data = {};
        //console.log(container, tpl, t, this.presentations)
        for ( ; i < this.stuff.length; i += 1) {
            data = this.stuff[i];
            $(container).append(t, data);
        }
    },
    
    renderFeedback : function (message) {
        console.log(message)
        $(this.contentPanel).empty();
        var container = $(this.feedback),
            tpl = $(this.feedbackTpl).val(),
            t = $.template(tpl),
            data = { "message" : message };
        
        $(container).empty();
        $(container).append(t, data);
        
        $(container).show();
        window.setTimeout(function () {
            $(container).hide();
        }, 3600);
        
    },
    
    // database
    
    resultSetToArray : function (resultset) {
        
        var objArray = [];
        for (var i = 0; i < resultset.rows.length; i++) {
            objArray.push(resultset.rows.item(i));
        }
        return objArray;
    },
    
    loadStuff : function () {
        
        if (!Db.db) {
            // TODO: feedback
            console.log('no database...')
            return;
        }
        
        var that = this;
        
        Db.getAll(null, function (transaction, resultset) {
            if (resultset.rows.length > 0) {
                that.stuff = that.resultSetToArray(resultset);
                that.renderStuff();
            } else {
                // TODO: feedback to user to sync her stuffz
                that.renderFeedback(message.SYNC);
            }
        });
    },
    
    saveStuff : function () {
        
        if (!Db.db) {
            // TODO: feedback
            return;
        }
        
        for (var item in this.stuff) {
            Db.add(this.stuff[item]);
        }
        this.loadStuff();
    },
    
    // ajax
    
    setCustomEvents : function () {
        
        // panel loaded, trigger content load
        $(window).bind('panelloaded', function (event, params) {
            if (params.page === '_stuff.html') {
                App.loadStuff();
            }
        });
    },
    
    getStuff : function () {
        
        if (this.presence === 'offline') {
            // load data from database
            this.loadStuff();
        } else {
            // get data from api
            var data = "",
                that = this;
            $.ajax({
                url: this.api,
                data: data,
                cache: false,
                withCredentials: true,
                dataType: 'json',
                success: function (result) {
                    if (result && result.length > 0) {
                        // TODO: update database and render data
                        that.stuff = result;
                        that.saveStuff();
                    }
                },
                error: function (x, t, error) {
                    // TODO: trigger local ajax error message and handle stuff render
                    that.log(error);
                    that.loadStuff();
                }
            });
        }
    }
    
};