/*!
 * tg - v0.1.0 - 2014-08-12 
* http://tgnet.com
 * Copyright (c) 2014 tg front-end team; Licensed MIT(http://tgnet.com/) 
 */
TG = {};
TG.HOST = location.hostname == 'localhost' ? {
    USER: 'localhost:8064',
    WENDA: 'localhost:8175'
} : {
    USER: 'user.tgnet.com',
    WENDA: 'wd.tgnet.com'
};
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
$.extend(TG, {
    check: function (target, mode) {
        if (arguments.callee.condition[mode])
            return checkTest.apply(this, arguments.callee.condition[mode].concat([target]));
        else
            return !!target.match(mode);

    }
});

TG.check.condition = {
    'mobile' : [/^\d{8,20}$/],
    'email' : [/^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/i],
    'url' : [/^(http(s)?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w\- .\/?%&=]*)?$/],
    'tel' : [/^[\d\-()]{6,20}$/],
    'qq' : [/^\d{5,16}$/],
    'cin' : [function(){
        var wi = [ 7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2, 1 ];// ��Ȩ����
        var valideCode = [ 1, 0, 10, 9, 8, 7, 6, 5, 4, 3, 2 ];// ���֤��֤λֵ.10����X
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
                a_idCard[17] = 10;// �����λΪx����֤���滻Ϊ10�����������
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




TG.Page = {};


(function () {
    function oldAjaxDataConventer(data, sep) {
        if ($.isString(data))
            data = data.split(sep)
        var s = data.shift();
        s = s == 1 ? 0 : s == 0 ? 999 : s;
        if (s != 0 && data[0].indexOf('��¼') >= 0)
            s = 1
        if (s == 0) {
            return { Data: data, State: s}
        } else
            return { Msg: data[0], State: s}
    }
    function createDefaultRetune(retry) {
        if (retry === true) retry = Infinity;
        return function defaultRetryment (dataArray){
            var state = dataArray.State, dfd = $.Deferred();
            if (state == 1 && this._retry < retry) {
                if (TG.Page.login)
                    TG.Page.login(dataArray).done(function(){
                        dfd.resolve()
                    })
                else dfd.resolve();
            } else {
                dfd.reject();
            }
            return dfd
        }
    }

    /**
     * ��ȡJSON��
     * @param {string|object} url ��ַ��������
     * @param {object} [settings] ����
     * @returns {JSONGetter}
     * @constructor
     */
    var JSONGetter = function JSONGetter(url, settings) {
        if (!(this instanceof JSONGetter)) return new JSONGetter(url, settings);
        this.settings = $.extend({}, JSONGetter.defaults)
        if (typeof url == 'object') {
            $.extend(this.settings, url)
        } else
            this.settings.url = url

        if (typeof settings == 'boolean')
            settings = { obstruction: settings }

        $.extend(this.settings, settings)

        if (this.settings.retune === true || typeof this.settings.retune == 'number')
            this.settings.retune = createDefaultRetune(this.settings.retune)

        this._ajax = null
        this.url = this.settings.url;
    }

    /**
     * JSONGetter�ļ���������ȥ����
     * @param {string} url
     * @param {function|*} dataFactory
     * @param {number} [delay]
     * @returns {JSONGetter.Spy}
     * @constructor
     */
    JSONGetter.Spy = function(url, dataFactory, delay){
        if (typeof dataFactory == 'number') {
            delay = dataFactory;
            dataFactory = null;
        }
        if (!(this instanceof JSONGetter.Spy)) return new JSONGetter.Spy(url, dataFactory, delay);
        var s, a;
        if ((a = dataFactory == null) || typeof dataFactory != 'function') {
            s = dataFactory
            dataFactory = function(){
                var dfd = $.Deferred();
                setTimeout(function(){
                    a ? dfd.reject(s) : dfd.resolve(s);
                }, delay || JSONGetter.Spy.defaults.delay)
                return dfd;
            }
        }
        this.dataFactory = dataFactory;
        JSONGetter.spies[url] = this;
    }
    JSONGetter.Spy.prototype = {
        ajax: function(ajaxOptions){
            var data = ajaxOptions.data;
            if ($.isArrayLike(data)) data = $.serializeNodes(data, ',');
            var start = $.now();
            console.groupCollapsed('%c������һ��TG.JSONGetter.Spy������ %s', 'color:#00F', ajaxOptions.url)
            console.log('�������� %O', data);
            console.groupEnd();
            return $.when(this.dataFactory(data, ajaxOptions)).done(function(s){
                console.groupCollapsed('%c������һ��TG.JSONGetter.Spy��Ӧ�� %s', 'color:#00F', ajaxOptions.url)
                console.log('��ʱԼ %i ms', $.now() - start);
                console.log('��Ӧ���� %O', s);
                console.groupEnd();
            }).fail(function(){
                console.groupCollapsed('%c������һ��TG.JSONGetter.Spy��Ӧ�� %s', 'color:#F00', ajaxOptions.url)
                console.log('��ʱԼ %i ms', $.now() - start);
                console.groupEnd();
            }).done(ajaxOptions.success).fail(ajaxOptions.error).promise();
        },
        destroy: function(){
            delete JSONGetter.spies[this.url]
        }
    }

    JSONGetter.spies = {}

    JSONGetter.Spy.defaults = {
        delay: 1000
    }
    JSONGetter.debug = true;
    JSONGetter.defaults = {
        spy: {},
        obstruction: true,
        retune: false,
        success: $.noop,
        error: $.noop,
        complete: $.noop
    }
    JSONGetter.config = function(options){
        $.extend(JSONGetter.defaults, options);
    }

    JSONGetter.prototype = {
        send: function (sendData) {
            var request = this, ajaxOptions;
            var dfd = $.Deferred();

            if (this.retry) {
                this._retry ++;
            }
            else {
                dfd.fail(this.settings.error).done(this.settings.success).always(this.settings.complete);
                this._retry = 0;
            }

            if (this.retry || !this.settings.obstruction || !this._ajax || this._ajax.state() != 'pending') {
                var s = {}
                if (this.settings.beforeSend && (false === this.settings.beforeSend(sendData, s))) {
                    $.extend(s, {State: -500, Msg:'�������������ж�'});
                    request.branchAjaxResult(dfd, s);
                }  else {
                    ajaxOptions = {
                        url: request.settings.url,
                        type: 'post',
                        dataType: 'text',
                        data: request._sendData = sendData,
                        contentType: "application/x-www-form-urlencoded;charset=utf-8",
                        error: function (__, eType) {
                            request.branchAjaxResult(dfd, { State: request.handleError(eType) });
                        },
                        success: function (data) {
                            var err = 0;
                            //���û��data
                            data = data || { State: -201 };
                            if (typeof data == 'string')
                                try {
                                    data = $.parseJSON(data);
                                } catch (e) {
                                    err = 1;
                                }
                            if (err || typeof data != 'object' || !('State' in data) && !('Data' in data)) {
                                // ���ת�����������ַ�������
                                if (err && data.charAt(1) == ':' || $.isArray(data) && typeof data[0] == 'number')
                                    data = oldAjaxDataConventer(data, ':');
                                else
                                    data = {
                                        State: 0,
                                        Data: data
                                    }
                            }
                            request.branchAjaxResult(dfd, $.extend(s, data));
                        },
                        timeout: this.settings.timeout
                    }

                    if (JSONGetter.debug && JSONGetter.spies[request.url])
                        this._ajax = JSONGetter.spies[request.url].ajax(ajaxOptions);
                    else
                        this._ajax = $.ajax(ajaxOptions);
                }
            } else request.branchAjaxResult(dfd, { State: -1000 });

            return dfd.promise();
        },
        branchAjaxResult: function (dfd, originData) {
            var request = this;
            var state = originData.State;
            var dataArray = [this._originData = originData, this._data = originData.Data, this._state = originData.State, this._msg = originData.Msg];
            // 0 , undefined, null, ''����Ϊ��ȷ
            if (!state)
                dfd.resolveWith(this, dataArray);
            else if (state < -999)
                dfd.notifyWith(this, dataArray);
            else {
                //try {
                dataArray[3] = dataArray[3] || 'ϵͳ����';
                if (this.settings.retune) {
                    dataArray[0].retry = true;
                    dfd.notifyWith(this, dataArray);
                    $.when(this.settings.retune.apply(this, dataArray)).done(function(){
                        request.retry = true;
                        request.send(request._sendData).done(function(){
                            dfd.resolveWith(request, arguments);
                        }).fail(function(){
                            //alert(11);
                            dfd.rejectWith(request, arguments);
                        }).progress(function(){
                            dfd.notifyWith(request, arguments);
                        });
                    }).fail(function(){
                        request.retry = false;
                        dfd.rejectWith(this, dataArray);
                    });
                } else  dfd.rejectWith(this, dataArray);

                //} catch(e){
                //dataArray[0].State = dataArray[2] = -109;
                //dataArray[0].Msg = dataArray[3] = 'ϵͳ�쳣'
                //dfd.rejectWith(this, dataArray);
                //}
            }
        },
        handleError: function (eType) {
            var state = 0;
            switch (eType) {
                // 404
                case 'error':
                    state = -100;
                    break;
                case 'parseerror':
                    state = -200;
                case 'abort':
                    state = -101;
                    break;
                case 'timeout':
                    state = -102;
                    break;
                default:
                    state = -999;
            }
            return state;
        },
        spy: function(dataFactory, delay){
            JSONGetter.Spy(this.url, dataFactory, delay);
            return this;
        }
    };

    JSONGetter.defaultErrHandler = function(D){
        var msg = D.Msg || 'ϵͳ����';
        if (D.State > 0 || D.State < -499) alert(msg);
        else alert('(�����룺'+ D.State + ")" + msg + '\n' + '���Ժ����Ի���ϵ�ͷ�!');
    };

    TG.JSONGetter = JSONGetter;
})();

$.fn.ajaxBind = function(selector, request, data, settings){

    if (!(request instanceof TG.JSONGetter) && !(typeof request == 'string')) {
        settings = data;
        data = request;
        request = selector;
        selector = null;
    }

    var options = $.extend({
        data: data
    }, $.fn.ajaxBind.defaults)
    if (typeof request == 'string')
        options.request = TG.JSONGetter(request, {
            error: $.noop
        });
    else if (!(request instanceof TG.JSONGetter))
        $.extend(options, request)
    else
        options.request = request;

    if (typeof settings == 'function')
        settings = { success: settings }

    $.extend(options, settings)

    var ajax;
    var args = ['click']
    if (selector) args.push(selector);
    args.push(function(event){
        var fn = this.tagName == 'INPUT' ? 'val' : 'html';
        var that = this, $this = $(this);
        var e, t, h;
        var D;
        var dataSend = (typeof options.data == 'function') ? options.data.call(that, options.request) : options.data;
        if ($.isArrayLike(dataSend))
            dataSend = $.serializeNodes(dataSend, ',');
        if (dataSend != null) {
            h = $this[fn]();
            e = $this.children();
            t = $this.text();
            D = {State: -501};
            if (options.beforeSend.call(this, event, dataSend, D, e, t) === false) {
                options.complete.call(that, D, dataSend, options.request, h, e, t);
                if (!D.State)
                    options.success.call(that, D, dataSend, options.request);
                else if (D.State >= -999) options.error.call(that, D, options.request);
                return
            }
            ajax = options.request.send(dataSend);
            ajax.always(function(){
                $.extend(D, arguments[0]);
                options.complete.call(that, D, dataSend, options.request, h, e, t);
            }).done(function(){
                options.success.call(that, D, dataSend, options.request)
            }).fail(function () {
                options.error.call(that, D, dataSend, options.request);
            });
        }
    });

    return this.on.apply(this, args);
};
$.fn.ajaxBind.defaults = {
    complete : function(){
        $(this).removeClass('disabled').removeAttr('disbaled').removeAttr('disabled');
    },
    beforeSend :  function(){
        $(this).addClass('disabled').prop('disabled', true);
    },
    error: TG.JSONGetter.defaultErrHandler,
    success: $.noop
};

TG.User = {
    login: function (name, pwd, rb, options) {
        var dfd = $.Deferred();
        $.ajax($.extend({
            data : {u : name, p : pwd, r: rb == null ? 0 : 1},
            url: 'http://' + TG.HOST.USER + '/AjaxHandler.ashx?op=login',
            type : 'post',
            dataType : 'jsonp',
            timeout : 5000,
            error : function(__, error){
                var data;
                switch(error){
                    case 'timeout' :
                        data = {State : -1, Msg:'��¼��ʱ�������ԡ�'}; break
                    default :
                        data = { State: -2, Msg: '��¼�����쳣�������ԡ�' };
                }
                dfd.reject(data);
            }
        }, options)).done(function(data){
            if (!data) {
                data = {'State' : -2, Msg: ''};
                dfd.reject(data);
            } else
                dfd.resolve(data);
        });
        return dfd.always(function(data){
            data.State == 0 && TG.User.Data.set($.extend({'LoginState' : 1}, data.Data));
        });
    },
    logout : function(options){
        var dfd = $.Deferred();
        $.ajax($.extend({
            url: 'http://' + TG.HOST.USER + '/System/AjaxHandler.ashx?op=logout',
            dataType : 'jsonp',
            timeout : 5000,
            error : function(__, error){
                var data;
                switch(error){
                    case 'timeout' :
                        data = {State : -1, Msg:'ע����ʱ'}; break
                    default :
                        data = { State: -2, Msg: 'ע��ʧ�ܣ������ԡ�' };
                }
                dfd.resolve(data);
            }
        }, options)).done(function(data){
            if (!data) {
                data = {State : -2, Msg: ''};
            }
            dfd.resolve(data);
        });
        dfd.always(function(data){
            data.State == 0 && TG.User.Data.set($.extend({LoginState : 0}, data.Data));
        });
        return dfd;
    }

}

;(function(_key){
    function serialize(value){
        return JSON.stringify(value)
    }
    function deserialize(value){
        var result;
        if (typeof value != 'string') result = value;
        try {
            result = JSON.parse(value)
        } catch(e) {}
        // ���Ƕ����ʱ�򣬽���ֵΪ�ն���
        if (!$.isPlainObject(result)) result = {}
        return result
    }
    var _list = deserialize(localStorage.getItem(_key))
    TG.User.Data = $.EventEmitter($.mix(function(extend){
        return $.mix(extend, _list)
    }, {
        userTicker: false,
        get: function(key){
            if (key) return _list[key]
            // �ȱ���һ�£����ⱻ���
            else return $.extend({}, _list);
        },
        init: function(){
            //Chrome��(14.0.794.0)��д��document.domain֮��ᵼ��onstorage������
            //֧��localStorage�����
            var callback = this._callback.bind(this);
            if ('onstorage' in document) {
                // IE��document;
                document.attachEvent("onstorage", callback)
            } else if ($.support.localStorage) {
                // ��׼�������window;
                window.addEventListener("storage", callback)
            } else if (this.userTicker) {
                // ���ٸ���
            } else {
                // IE678
                window.attachEvent('onfocus', callback)
            }
            this.init = $.noop;
        },
        _callback: function(e){
            var that = this;
            //IE�²�ʹ��setTimeout��Ȼ��ȡ�����ı���ֵ?!
            $.nextTick(function(){
                e = e || window.storageEvent
                //���仯��key���ǰ󶨵�key������˵�
                //IE�²�֧��key����,�����Ҫ����storage�е������ж�key�е������Ƿ�仯
                if (e.key && _key != e.key) return
                //��ȡ�µ�ֵ
                var result = that._testAndSet(deserialize(e.newValue || localStorage.getItem(_key)));
                if (that._isChange(result)) {
                    that.trigger('change', result)
                }
            });
        },
        set: function(hash, value){
            var key, isNew = true;
            if ($.type(hash) == 'string') {
                key = hash
                hash = {}
                hash[key] = value
                isNew = false
                // ����������hash���ݵĻ���ֻ�޸�ĳ���ֶ�
            }
            var result = this._testAndSet(hash, isNew);
            if (this._isChange(result)) {
                this.trigger('change', result)
                // �ӳ���Ⱦ����������
                $.nextTick(function () {
                    localStorage.setItem(_key, serialize(result[2]))
                })
            }
        },
        _isChange: function(result){
            return !$.isEmptyObject(result[0]) || !$.isEmptyObject(result[1])
        },
        // �Ƚ��¾����ݵĲ���
        _testAndSet: function(valueHash, isNew){
            var i, newValue = {}, oldValue = {}, mix
            if (isNew) mix = $.mix({}, valueHash, _list)
            else mix = valueHash
            for (i in mix) {
                //alert(i + ' : ' + _list[i] + ' ' + valueHash[i])
                //alert($.isEqual(_list[i], valueHash[i]))
                if (mix.hasOwnProperty(i) && !$.isEqual(_list[i], valueHash[i])) {
                    // ����������ֵ
                    oldValue[i] = _list[i]
                    if (valueHash.hasOwnProperty(i)) _list[i] = newValue[i] = valueHash[i]
                    else delete _list[i]
                }
            }
            return [newValue, oldValue, _list]
        }
    }))
})('tguserdata');


TG.User.Data.init();

$.fn.ellipsis = function() {
    function loop ($container, maxHeight, str) {
        if ($container.height() <= maxHeight) return;
        var init = false;
        var nodes = this.contents();
        var i = nodes.length - 2, item
        for (; i > -1 && $container.height() > maxHeight; i--) {
            item = nodes[i];
            if (item.nodeType == '3') {
                if (!init) init = !!$(item).after(str)
                var text = item.nodeValue.replace(/ {2,}/, ' ');
                while (item.nodeValue && $container.height() > maxHeight ){
                    text = text.substr(0, text.length - 1);
                    item.nodeValue = text;
                }
            }
        }
    }
    return function(str, container){
        return this.each(function(){
            // �������������ַ
            var container = container;
            var oldH, str = str || '<span class="ellipsis">...</span>'
            container = container || this;
            // ��ȡmax-height������������
            var maxHeight = window.getComputedStyle ? (getComputedStyle(container)['max-height'] || getComputedStyle(container)['maxHeight']) : container.currentStyle['max-height'];
            var match = maxHeight.match(/(0?\.?\d*)px$/);
            if (match) maxHeight = oldH = match[1];
            else return;
            // ��һ����Ԫ�ز���һ���иߣ�Ȼ��ȥ��
            var s = $('<span></span>', {
                html: 'o',
                css: {
                    position: 'absolute',
                    whiteSpace: 'nowrap',
                    left: '-999em'
                }
            }).appendTo(this);
            var lineHeight = s.height();
            s.remove();


            var line = Math.floor(maxHeight / lineHeight);
            maxHeight = line * lineHeight;

            // ȥ��һЩ��ʽ�����䳬����Χ
            container.style.maxHeight = 'none';
            container.style.overflowY = 'auto';
            container.style.height = 'auto';


            if ('webkitLineClamp' in this.style) {
                container.style.textOverflow = 'ellipsis';
                container.style.display = '-webkit-box';
                container.style.webkitBoxOrient = 'vertical';
                container.style.webkitLineClamp = line;
            } else loop.call($(this), $(container), maxHeight, str);


            // ������ʽ
            container.style.overflowY = 'hidden';
            container.style.maxHeight = oldH + 'px';
        })
    }
}();