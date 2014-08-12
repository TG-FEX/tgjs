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

// TG.timer 延迟执行
TG.Timer = function(){
    var timerList = [], timerID = 0;
    var Timer = function( interval, num ){
        //if (this == window) return new Timer(interval, num);
        var args = _.argsFormat([function(arg){ return !isNaN(arg); }, "uint"], [20, 0]);
        this.interval = Math.max(20, args[0]);
        this.runNum = 0;
        this.num = args[1];
        this.id = timerID;
        this.timer = null;
        this.running = false;
        timerID++;
    };
    Timer.prototype.bind = function( fn ){
        if ($.isFunction(fn)) {
            var id = this.id;
            if (!timerList[id])
                timerList[id] = [];
            timerList[id].push(fn);
        }
    };
    Timer.prototype.start = function(){
        if (!this.running && (this.num == 0 || this.num > this.runNum)) {
            this.running = true;
            var _this = this;
            function run(){
                _this.runNum++;
                if (_this.num != 0 && _this.num <= _this.runNum)
                    _this.stop();
                var list = timerList[_this.id];
                for (var i = 0; i < list.length; i++) {
                    list[i]();
                }
            }
            this.timer = setInterval(run, this.interval);
        }
    };
    Timer.prototype.reset = function(){
        this.pause();
        this.runNum = 0;
    };
    Timer.prototype.stop = function(){
        this.pause();
        this.runNum = this.num;
    };
    Timer.prototype.pause = function(){
        this.running = false;
        clearInterval(this.timer);
    };
    Timer.prototype.unbind = function(){
        timerList[this.id] = [];
    };
    return function(interval, num){
        var t = new Timer(interval, num);
        return {
            start: function(){ t.start(); },
            bind: function(fn){ t.bind(fn); },
            reset: function(){ t.reset(); },
            stop: function(){ t.stop(); },
            pause: function(){ t.pause(); },
            unbind: function(){ t.unbind(); },
            runNum: function(num){
                if(num === undefined)
                    return t.runNum;
                else
                    t.runNum = Math.max(0, parseInt(num));
            }
        }
    }
}();

(function () {
    window._ = function(){}

    $.extend(_, {
        size: function(obj){
            return $.isArrayLike(obj) ? obj.length: Object.keys(obj).length;
        },
        reduce : function(obj, iterator, memo, context) {
            var initial = arguments.length > 2;
            if (obj == null) obj = [];
            if (obj.reduce) {
                if (context) iterator = iterator.bind(context);
                return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
            }
            $.each(obj, function(index, value) {
                if (!initial) {
                    memo = value;
                    initial = true;
                } else {
                    memo = iterator.call(context, memo, value, index);
                }
            });
            if (!initial) throw new TypeError('Reduce of empty array with no initial value');
            return memo;
        },
        type: $.type,
        argsFormat: function(){
            function inType( type, arg ){
                if(!type)return true;
                if($.isFunction(type))return type(arg);
                switch(type){
                    case "number":
                    case "string":
                    case "boolean":
                    case "object":
                    case "function":
                    case "array": return _.type(arg, type);
                    case "int":  return !isNaN(arg) && parseInt(arg) == arg;
                    case "uint": return !isNaN(arg) && parseInt(arg) >= 0;
                    case "notNull": return arg !== null && arg !== undefined;
                    case "notEmpty": return !!arg;
                    default: return arg instanceof (type);
                }
            }
            function inTypes( types, arg ){
                var r = false;
                if (typeof(types) == "string" && types.indexOf(",") > -1) {
                    types = types.split(",");
                    for (var i = types.length; i--;) {
                        r = inType(types[i], arg);
                        if (r)
                            break;
                    }
                }else{
                    r = inType(types, arg);
                }
                return r;
            }
            return function( types, defaultVals ){
                var args = arguments.callee.caller.arguments,
                    a = {callee: args.callee },
                    len = 0;
                defaultVals = defaultVals || [];
                for(var i = 0, j = 0; i < types.length; i++){
                    var item = types[i];
                    if(inTypes(item, args[j]))
                        a[len++] = args[j++];
                    else
                        a[len++] = defaultVals[i];
                }
                a.length = len;
                return a;
            }
        }()
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
            var wi = [ 7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2, 1 ];// 加权因子
            var valideCode = [ 1, 0, 10, 9, 8, 7, 6, 5, 4, 3, 2 ];// 身份证验证位值.10代表X
            var isValidID = function (idCard) {
                idCard = $.trim(idCard);
                if (idCard.length == 15) {
                    return isValidBrithday_15(idCard);
                } else if (idCard.length == 18) {
                    var a_idCard = idCard.split("");// 得到身份证数组
                    return isValidBrithday_18(idCard) && isValidCheckcode(a_idCard);
                } else {
                    return false;
                }
            };
            var isValidCheckcode = function (a_idCard) {
                var sum = 0; // 声明加权求和变量
                if (a_idCard[17].toLowerCase() == 'x') {
                    a_idCard[17] = 10;// 将最后位为x的验证码替换为10方便后续操作
                }
                for ( var i = 0; i < 17; i++) {
                    sum += wi[i] * a_idCard[i];// 加权求和
                }
                var valCodePosition = sum % 11;// 得到验证码所位置
                return a_idCard[17] == valideCode[valCodePosition];
            };
            var isValidBrithday_18 = function (idCard18){
                var year =  idCard18.substring(6,10);
                var month = idCard18.substring(10,12);
                var day = idCard18.substring(12,14);
                var temp_date = new Date(year,parseFloat(month)-1,parseFloat(day));
                // 这里用getFullYear()获取年份，避免千年虫问题
                return !(temp_date.getFullYear() != parseFloat(year)
                    || temp_date.getMonth() != parseFloat(month) - 1
                    || temp_date.getDate() != parseFloat(day));
            };
            var isValidBrithday_15 = function (idCard15){
                var year =  idCard15.substring(6,8);
                var month = idCard15.substring(8,10);
                var day = idCard15.substring(10,12);
                var temp_date = new Date(year,parseFloat(month)-1,parseFloat(day));
                // 对于老身份证中的你年龄则不需考虑千年虫问题而使用getYear()方法
                return !(temp_date.getYear() != parseFloat(year)
                    || temp_date.getMonth() != parseFloat(month) - 1
                    || temp_date.getDate() != parseFloat(day));
            };
            return isValidID;
        }()]
    };
})();


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
    Flash: function () {
        var UNDEF = "undefined",
            OBJECT = "object",
            SHOCKWAVE_FLASH = "Shockwave Flash",
            SHOCKWAVE_FLASH_AX = "ShockwaveFlash.ShockwaveFlash",
            FLASH_MIME_TYPE = "application/x-shockwave-flash",
            d = null,
            nav = navigator,
            win = window,
            playerVersion = [0, 0, 0];

        if (typeof nav.plugins != UNDEF && typeof nav.plugins[SHOCKWAVE_FLASH] == OBJECT) {
            d = nav.plugins[SHOCKWAVE_FLASH].description;
            if (d && !(typeof nav.mimeTypes != UNDEF && nav.mimeTypes[FLASH_MIME_TYPE] && !nav.mimeTypes[FLASH_MIME_TYPE].enabledPlugin)) { // navigator.mimeTypes["application/x-shockwave-flash"].enabledPlugin indicates whether plug-ins are enabled or disabled in Safari 3+
                d = d.replace(/^.*\s+(\S+\s+\S+$)/, "$1");
                playerVersion[0] = parseInt(d.replace(/^(.*)\..*$/, "$1"), 10);
                playerVersion[1] = parseInt(d.replace(/^.*\.(.*)\s.*$/, "$1"), 10);
                playerVersion[2] = /[a-zA-Z]/.test(d) ? parseInt(d.replace(/^.*[a-zA-Z]+(.*)$/, "$1"), 10) : 0;
            }
        } else if (typeof win.ActiveXObject != UNDEF) {
            try {
                var a = new ActiveXObject(SHOCKWAVE_FLASH_AX);
                if (a) { // a will return null when ActiveX is disabled
                    d = a.GetVariable("$version");
                    if (d) {
                        d = d.split(" ")[1].split(",");
                        playerVersion = [parseInt(d[0], 10), parseInt(d[1], 10), parseInt(d[2], 10)];
                    }
                }
            }
            catch (e) { }
        }
        return $.extend(function(){
        }, {
            version: playerVersion,
            append: function(parent, src, width, height, options){
                var $e = $(TG.UI.Flash.getHTML(src, width, height, options))
                $(parent).append($e);
                return $e;
            },
            getHTML: function (src, width, height, options) {
                if (typeof height == 'object') {
                    options = height;
                    height = null;
                }
                if (typeof width == 'object') {
                    options = width;
                    width = null;
                }
                var size = (width ? (' width="' + width + '" ') : '') + (height ? (' height="' + height + '"'): '')
                options = $.extend({
                    wmode: "transparent",
                    quality: "high"
                }, options || {});
                var obj = '<object' + (options.id ? ' id="' + options.id + '"' : '') + ' classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" codebase="http://download.macromedia.com/pub/shockwave/cabs/flash/swflash.cab"' + size + '>',
                    embed = '<embed pluginspage="http://www.macromedia.com/go/getflashplayer" type="application/x-shockwave-flash"' + size;
                obj += '<param name="movie" value="' + src + '" />';
                embed += ' src="' + src + '"';
                for (var n in options) {
                    if (n.toLowerCase() != "id") {
                        obj += '<param name="' + n + '" value="' + options[n] + '" />';
                        embed += ' ' + n + '="' + options[n] + '"';
                    } else {
                        embed += ' name="' + options[n] + '"';
                    }
                }
                embed += '></embed>';
                obj += embed + '</object>';
                return obj;
            }
        });
    }()
};

$.extend(TG, {'loadScript' : function(src, success, error){
    return $.ajax({url:src, success:success, error:error})}
});

(function($){
    var loadList = {};
    /**
     * 加载单个js文件或多个有依赖关系的js文件，同时对不同加载情况分别处理
     * @param {string|array} src   单个js文件url或者多个有依赖关系的js文件url数组
     * @param {function} [success]   处理加载成功情况的函数
     * @param {function} [fail]      处理加载失败情况的函数
     * @param {boolean} [cache]      是否需要缓存js文件，默认缓存
     * @param {object} [deferred]    deferred对象，依据js加载情况来对外部deferred对象进行处理
     * @returns {object}    返回js加载过程生成的deferred对象，提供给外部操作的API
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
                    }, fail);/*.done(function(){
                     TG.jsLoader(src[num], success, fail, _cache, _d)
                     }).fail(fail);*/
                    return arguments.callee(num + 1, _d);
                }
                return d;
            })(1, d);
            rDeferred.then(success, fail);/*.done(success).fail(fail);*/
            arguments.callee(src[0], success, fail, cache, d);
            return rDeferred;
        }
    }
    $.extend(TG, {'jsLoader' : jsLoader});
    $.fn.popup = function(){
        this.modal();

        var m = this.modal();
        var that = this;

        m.$element.on('open', function(){
            that.trigger('mask-open')
        });

        this.modal();

        this.find('.btn-close').click(function(){
            m.close();
        })
        m.open();
    }
    $.fn.unmask = function(){
        var m = this.data('ui-modal');
        if (m) {
            m.close();
        }
        return this;
    }

})(jQuery);

$.fn.bgiframe = function(left, top, parent, iframePop) {
    var ifPop = iframePop === undefined ? true : iframePop;
    return $(this).each(function() {
        var e = $(this);
        if (left !== undefined)
            e.css({ top: top, left: left }).appendTo(parent ? parent : "body");
        if (ifPop) {
            var iframe = $("iframe.popIframe", e), iframeMask = $("div.popIframeMask", e); //兼容document事件
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
                    var data = {},
                        inputs = filterInput(form);
                    if(except)
                        inputs = inputs.not(except);
                    if(inputs.length == 0)
                        return null;
                    else{
                        inputs.filter(":text,textarea,select,:checked,:password,input:hidden").each(function(){
                            var $this = $(this), name = $this.attr("name"), val = $.trim($this.val());
                            if (data[name]) {
                                if (!(data[name] instanceof Array))
                                    data[name] = [data[name]];
                                data[name].push(val);
                            }else{
                                data[name] = val;
                            }
                        });
                        return data;
                    }
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