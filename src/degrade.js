TG.Event = function(obj){
    var rt = $.EventEmitter(obj);
    rt.bind = rt.on;
    rt.unbind = rt.off;
    return rt;
};

TG.JSON = {
    parse: function(str){
        if (typeof str != 'string') return str;
        try{
            return jQuery.parseJSON(str);
        }catch(e){
            return undefined;
        }
    },
    stringify: JSON.stringify
};

TG.Timer = function(interval, num){
    num = num || 1;
    var t = $.Timer(true, interval, num);
    return {
        start: function(){ t.start(); },
        bind: function(fn){ t.on('tick', fn); },
        reset: function(){ t.reset(); },
        stop: function(){ t.stop(); },
        pause: function(){ t.pause(); },
        unbind: function(){ t.off('tick'); },
        runNum: function(num){
            if(num === undefined)
                return t.tickNum;
            else
                t.tickNum = Math.max(0, parseInt(num));
        }
    }
};

(function () {
    window._ = function(){}

    $.extend(_, {
        size: $.Object.size,
        reduce : $.Object.reduce,
        type: $.type,
        argsFormat: function(conditions, defaults){
            var args = arguments.callee.caller.arguments;
            args = $.argsArrange(args, conditions, defaults);
            args.callee = arguments.callee;
            return args;
        }
    });

    var checkTest = function(){
        var len = arguments.length - 1, val = $.trim(arguments[len]), re = true;
        for(var i = 0; i < len; i++){
            if ($.type(arguments[i]) == 'regexp') {
                re = arguments[i].test(val);
            } else if ($.isFunction(arguments[i])){
                re = arguments[i](val);
            }
            if(!re) break;
        }
        return re;
    };

    $.extend(_, {
        check: function (target, mode) {
            if (arguments.callee.condition[mode])
                return checkTest.apply(this, arguments.callee.condition[mode].concat([target]));
            else
                return !!target.match(mode);

        }
    })

    _.check.condition = {
        'mobile' : [/^\d{8,20}$/],
        'email' : [/^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/i],
        'url' : [/^(http(s)?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w\- .\/?%&=]*)?$/],
        'tel' : [/^[\d\-()]{6,20}$/],
        'qq' : [/^\d{5,16}$/],
        'cin' : [function(){
            var wi = [ 7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2, 1 ];// ��Ȩ����
            var valideCode = [ 1, 0, 10, 9, 8, 7, 6, 5, 4, 3, 2 ];// ���֤��֤λֵ.10���X
            var isValidID = function (idCard) {
                idCard = $.trim(idCard);
                if (idCard.length == 15) {
                    return isValidBrithday_15(idCard);
                } else if (idCard.length == 18) {
                    var a_idCard = idCard.split("");// �õ����֤����
                    return isValidBrithday_18(idCard) && isValidCheckcode(a_idCard);
                } else {
                    return false;
                }
            };
            var isValidCheckcode = function (a_idCard) {
                var sum = 0; // ������Ȩ��ͱ���
                if (a_idCard[17].toLowerCase() == 'x') {
                    a_idCard[17] = 10;// �����λΪx����֤���滻Ϊ10����������
                }
                for ( var i = 0; i < 17; i++) {
                    sum += wi[i] * a_idCard[i];// ��Ȩ���
                }
                var valCodePosition = sum % 11;// �õ���֤����λ��
                return a_idCard[17] == valideCode[valCodePosition];
            };
            var isValidBrithday_18 = function (idCard18){
                var year =  idCard18.substring(6,10);
                var month = idCard18.substring(10,12);
                var day = idCard18.substring(12,14);
                var temp_date = new Date(year,parseFloat(month)-1,parseFloat(day));
                // ������getFullYear()��ȡ��ݣ�����ǧ�������
                return !(temp_date.getFullYear() != parseFloat(year)
                    || temp_date.getMonth() != parseFloat(month) - 1
                    || temp_date.getDate() != parseFloat(day));
            };
            var isValidBrithday_15 = function (idCard15){
                var year =  idCard15.substring(6,8);
                var month = idCard15.substring(8,10);
                var day = idCard15.substring(10,12);
                var temp_date = new Date(year,parseFloat(month)-1,parseFloat(day));
                // ���������֤�е����������迼��ǧ��������ʹ��getYear()����
                return !(temp_date.getYear() != parseFloat(year)
                    || temp_date.getMonth() != parseFloat(month) - 1
                    || temp_date.getDate() != parseFloat(day));
            };
            return isValidID;
        }()]
    };
})();

$.fn.popup = function(){
    this.modal();

    var m = this.modal();
    var that = this;

    m.on('open', function(){
        that.trigger('mask-open')
    }).on('opened', function(){
        that.trigger('mask-complete')
    }).on('close', function(){
        that.trigger('mask-exit')
    }).on('closed', function(){
        that.trigger('mask-close')
    });

    this.find('.btn-close').click(function(){
        m.trigger('close');
    });
    m.open();
    that.trigger('mask-open')
};

$.fn.unmask = function(){
    var m = this.data('ui-modal');
    if (m) {
        m.trigger('close');
    }
    return this;
};

(function () {
    var regURL = /http:/;
    var regSlash = /[\\/]/;
    var options = {
        base: 'http://js.tgimg.cn/jquery/base/',
        version : 'newest',
        perfix : 'jQuery.',
        suffix : 'js',
        subfix : ''
    }
    require.defaults.plusin.tg = {
        config: function(){
            /*this.id = this.id.split('!');
             this.id = this.id[this.id.length - 1];*/
            var modelName =  this.url.substr(this.url.lastIndexOf('/') + 1);
            if (new RegExp("(.)*\\." + options.suffix + "$").test(modelName))
                modelName = this.url.substring(0, this.url.lastIndexOf('.') - 1);
            var pathName = this.url;
            if (!regURL.test(this.url)) {
                var _a = this.url.replace(regSlash, '/').substring(0, this.url.lastIndexOf('/')) + '/',
                    _v = $.type(options.version) == 'string' ? options.version : options.version[pathName];
                _v = _v ? "?v=" + _v : "";
                this.url = options.base + _a + options.perfix + modelName + options.subfix + '.' + options.suffix + _v;
            }
            this.name = modelName;
        },
        callback: require.defaults.plusin.auto.callback
    }
    TG.require = function(deps, callback){
        deps = deps.map(function(item){
            if ($.type(item) == 'string') return 'tg!' + item;
            return item;
        })
        return require(deps, callback);
    }
    TG.require.config = function(config){
        $.extend(defaults, config);
    }
    var defaults = TG.require.defaults = {
        perfix : 'jQuery.',
        suffix : 'js',
        subfix : '',
        paths : {}
    }
    TG.define = function(id, deps, factory){
        if (typeof id != 'string') {
            factory = deps;
            deps = id;
            id = null;
        }
        if (factory === undefined) {
            factory = deps;
            deps = [];
        }
        if (!$.isArray(deps)) deps = [deps];
        deps = deps.map(function(item){
            if ($.type(item) == 'string') return 'tg!' + item;
            return item;
        })
        return define(deps, factory);
    };
})();
TG.UI = {
    Flash: {
        version: $.support.flash,
        append: function(parent, src, width, height, options) {
            return $(TG.UI.Flash.getHTML(src, width, height, options)).appendTo(parent);
        },
        getHTML: function(src, width, height, options){
            if (typeof height == 'object') {
                options = height;
                height = null;
            }
            if (typeof width == 'object') {
                options = width;
                width = null;
            }
            return $.Flash(src, $.extend(options, {
                width: width,
                height: height
            })).toString();
        }
    }
};

(function($){
    var loadList = {};
    /**
     * ���ص���js�ļ�������������ϵ��js�ļ���ͬʱ�Բ�ͬ��������ֱ���
     * @param {string|array} src   ����js�ļ�url���߶����������ϵ��js�ļ�url����
     * @param {function} [success]   ������سɹ�����ĺ���
     * @param {function} [fail]      �������ʧ������ĺ���
     * @param {boolean} [cache]      �Ƿ���Ҫ����js�ļ���Ĭ�ϻ���
     * @param {object} [deferred]    deferred��������js������������ⲿdeferred������д���
     * @returns {object}    ����js���ع����ɵ�deferred�����ṩ���ⲿ������API
     */
    var jsLoader = function (src, success, fail, cache, deferred) {
        var d, rDeferred, args = _.argsFormat(["string,array", "function", "function", "boolean", function(arg){ return !!(arg && arg.done)}], [ undefined, function(){}, function(){}, true, undefined]);
        src = args[0], success = args[1], fail = args[2], cache = args[3], deferred = args[4];
        if(typeof src == "string"){
            if( !cache ) {
                src = src + "?v=" + new Date().getTime();
            }
            if(loadList[src] === undefined) {
                d = loadList[src] = TG.loadScript(src);
            } else {
                d = loadList[src];
            }
            d.then(success, fail);
            if (deferred) {
                d.then(deferred.resolve, deferred.reject);
            }
            return d;
        } else if (src instanceof Array) {
            d = $.Deferred();
            rDeferred = (function(num, d){
                if (num < src.length) {
                    var _d = $.Deferred(),
                        _cache = cache;
                    d.then(function(){
                        TG.jsLoader(src[num], success, fail, _cache, _d)
                    }, fail);
                    return arguments.callee(num + 1, _d);
                }
                return d;
            })(1, d);
            rDeferred.then(success, fail);
            arguments.callee(src[0], success, fail, cache, d);
            return rDeferred;
        }
    }
    $.extend(TG, {
        loadScript : function(src, success, error){
            return $.ajax({url:src, success:success, error:error})},
        jsLoader : jsLoader
    });
})(jQuery);

$.fn.bgiframe = function(left, top, parent, iframePop) {
    var ifPop = iframePop === undefined ? true : iframePop;
    return $(this).each(function() {
        var e = $(this);
        if (left !== undefined)
            e.css({ top: top, left: left }).appendTo(parent ? parent : "body");
        if (ifPop) {
            var iframe = $("iframe.popIframe", e), iframeMask = $("div.popIframeMask", e); //����document�¼�
            if (iframeMask.length == 0) {
                iframeMask = $("<div/>").css({
                    "position": "absolute",
                    "top": 0,
                    "left": 0,
                    "z-index": "-1"
                }).prependTo(e).addClass("popIframeMask");
            } else {
                iframeMask.prependTo(e);
            }
            if (iframe.length == 0) {
                iframe = $("<iframe scrolling='no' frameborder='0'/>").css({
                    "position": "absolute",
                    "top": 0,
                    "left": 0,
                    "z-index": "-2",
                    "opacity": 0
                }).addClass("popIframe").prependTo(e);
            }
            iframe.width(e[0].offsetWidth || e.width()).height(e[0].offsetHeight || e.height());
            iframeMask.width(e[0].offsetWidth || e.width()).height(e[0].offsetHeight || e.height());
        }
    });
};

(function(){
    function getOptions(action, data, method, target, enctype, accept, acceptCharset){
        return {
            action: action,
            method: method || "post",
            target: target,
            enctype: enctype || "application/x-www-form-urlencoded",
            accept: accept,
            "accept-charset": acceptCharset
        };
    }
    function createForm(options, data){
        $("#ajaxFrom").remove();
        var f = $("<form id='ajaxFrom'/>").toggle(false).attr(options), input = $("<input type='hidden'/>");
        if(data instanceof $)
            f.append(data.clone());
        else if(data)
            for(var n in data){
                f.append(input.clone().attr("name", n).val(data[n] ? data[n] : ""));
            }
        return f;
    }
    function createIframe( form ){
        form.attr("target", "ajaxIframe");
        var iframe = $("#ajaxIframe").unbind("load");
        if(iframe.length == 0){
            iframe = $("<iframe scrolling='no' frameborder='0' id='ajaxIframe' name='ajaxIframe' />").toggle(false);
        }
        $("body").append(iframe);
        return iframe;
    }
    function filterInput( form ){
        var inputs = $();
        form.each(function(){
            var $this = $(this),
                input = $this.is(":input") ? $this.not(":button") : $this.find(":input").not(":button");
            if(input.length)
                $.merge(inputs, input);
        });
        return inputs.filter("[name]");
    }
    $.extend(TG, {
        form:{
            ajax: function( form, data, success){
                if(typeof form == "string" && typeof data == "object"){
                    form = createForm(getOptions(form), data);
                }else if( $.isFunction(data) ){
                    form = $(form);
                    success = data;
                }else{
                    return;
                }
                form.attr("enctype", "multipart/form-data");
                form.attr("method", "post");
                var iframe = createIframe(form);
                form.submit();
                iframe.bind("load", function(event){
                    var target = event.target;
                    var	doc = (target.contentWindow || target.contentDocument).document,
                        text = doc.body ? $(doc.body).text() : null,
                        xml = doc.XMLDocument || doc;
                    $.isFunction(success) && success(text, xml);
                });
            },
            send: function(action, data, method, target, enctype, accept, acceptCharset){
                if(typeof action == "string"){
                    action = getOptions.apply(this, arguments);
                }
                var form = createForm(action, data);
                form.appendTo("body");
                form.submit();
                //form.remove();
            },
            get: function(action, data, target, enctype, accept, acceptCharset){
                TG.form.send(action, data, "get", target, enctype, accept, acceptCharset);
            },
            post: function(action, data, target, enctype, accept, acceptCharset){
                TG.form.send(action, data, "post", target, enctype, accept, acceptCharset);
            },
            getVal: function( free, except ){
                var form = $();
                if(!(free instanceof Array))
                    free = [free];
                for(var i = 0; i < free.length; i++){
                    $.merge(form, $(free[i]));
                }
                if(form.length == 0)return undefined;
                else{
                    var $input = $('textarea,select,input', form).not(":button,input:not(:checked)");
                    $input = except ? $input.not(except) : $input;
                    return $.serializeNodes($input, function(a){
                        if (a.length == 1) return a[0];
                    });
                }
            },
            encode: function( free ){
                var type = typeof free, _this = arguments.callee;
                if(!free || !isNaN(free) || type == "boolean")return free;
                if (type == "string") {
                    return encodeURIComponent(free);
                }else if($.isFunction(free)){
                    return _this.call(this, free());
                }else if (free instanceof Array){
                    for (var i = 0; i < free.length; i++) {
                        free[i] = _this.call(this, free[i]);
                    }
                }else if(type == "object"){
                    for(var n in free){
                        free[n] = _this.call(this, free[n]);
                    }
                }
                return free;
            }
        }
    });
    $.ajaxForm = TG.form.ajax;
})();