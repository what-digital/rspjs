// Adds classes to the html element that can be used to style the page
// based on the window width (default values are compatible with Twitter Bootstrap)
// this can live in the head as first javascript executed
// doesn't depend on any library

// TODO: transform this into a jQuery plugin or similar or at least allow configuration through options.

// this script has to be inlined so not to block rendering.

var rspjs = {
    main_el: document.documentElement,
    breakpoints: {
        verysmall: {
            cls: 'rsp-very-small',
            media_query: '(max-width: 420px)',
            order: 1
        },
        small: {
            cls: 'rsp-small',
            media_query: '(min-width: 421px) and (max-width: 768px)',
            order: 2

        },
        medium: {
            cls: 'rsp-medium',
            media_query: '(min-width: 769px) and (max-width: 992px)',
            order: 3
        },
        large: {
            cls: 'rsp-large',
            media_query: '(min-width: 993px) and (max-width: 1200px)',
            order: 4
        },
        verylarge: {
            cls: 'rsp-very-large',
            media_query: '(min-width: 1201px)',
            order: 5
        }
    },
    get_breakpoint_by_order: function(order) {
        for (var breakpoint in this.breakpoints) {
            if (this.breakpoints[breakpoint].order == order) {
                return this.breakpoints[breakpoint];
            }
        }
    },

    // from http://jaketrent.com/post/addremove-classes-raw-javascript/
    hasClass: function (el, className) {
        if (el.classList)
            return el.classList.contains(className);
        else
            return !!el.className.match(new RegExp('(\\s|^)' + className + '(\\s|$)'))
            },

    addClass: function (el, className) {
        if (el.classList)
            el.classList.add(className);
        else if (!hasClass(el, className)) el.className += " " + className
            },

    removeClass: function (el, className) {
        if (el.classList)
            el.classList.remove(className);
        else if (hasClass(el, className)) {
            var reg = new RegExp('(\\s|^)' + className + '(\\s|$)');
            el.className = el.className.replace(reg, ' ')
        }
    },

    send_event: function (cls) {
        //console.log("sending event: " + cls);
        var event = new Event(cls);
        document.dispatchEvent(event);
    },

    main: function () {
        for (var breakpoint in this.breakpoints) {
            var obj = this.breakpoints[breakpoint];

            // switch classes if the class really changed
            if (window.matchMedia(obj.media_query).matches && obj.cls !== this.current_bkp.cls) {
                this.addClass(this.main_el, obj.cls);
                this.removeClass(this.main_el, this.current_bkp.cls);

                this.previous_bkp = this.current_bkp;
                this.current_bkp = obj;

                // send out events
                this.send_event(this.current_bkp.cls);
                if (this.previous_bkp) {
                    // trigger transitional events
                    // this is necessary because a state can jump from the smallest to the largest if the user resizes vey fast.
                    // how many steps are breakpoints apart?
                    // Example: current: 4, prev: 2
                    var order_diff = this.current_bkp.order - this.previous_bkp.order; // 2
                    // for each point of difference between the two states send an event
                    for (var bkp = 0; bkp < Math.abs(order_diff); bkp++) { // 0
                        // screen got smaller
                        var sign = Math.sign(order_diff);
                        var prev_subsequent_bkp = this.get_breakpoint_by_order(this.previous_bkp.order + (sign * bkp));
                        var cur_subsequent_bkp = this.get_breakpoint_by_order(this.previous_bkp.order + (sign * (bkp + 1)));
                        this.send_event(prev_subsequent_bkp.cls + ">" + cur_subsequent_bkp.cls);
                    }
                }
            }
        }
    },

    previous_bkp: false,
    current_bkp: false,
    app_is_locked: false,
    queued: false,


    init: function () {
        var that = this;
        that.main();

        // set trigger for resize
        // this is to prevent concurrency as onresize is triggered
        // asynchronously
        window.onresize = function () {
            if (that.app_is_locked) {
                that.queued = true;
                // console.log('hit locked state');

                window.setTimeout(function () {
                    that.app_is_locked = false;
                    // console.log('removed lock!');
                    if (that.queued) {
                        // console.log('a resize is queued, execute!');
                        that.main();
                        that.queued = false;
                    }
                }, 500);
            } else {
                that.app_is_locked = true;
                that.main();
            }
        }
    },
    destroy: function() {
        window.onresize = null;
    }
};

rspjs.init();
