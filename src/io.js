(function () {
    function oldAjaxDataConventer(data, sep) {
        if ($.isString(data))
            data = data.split(sep)
        var s = data.shift();
        s = s == 1 ? 0 : s == 0 ? 999 : s;
        if (s != 0 && data[0].indexOf('登录') >= 0)
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
     * 获取JSON器
     * @param {string|object} url 地址或者配置
     * @param {object} [settings] 配置
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
     * JSONGetter的监听器，用去调试
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
            console.groupCollapsed('%c发送了一个TG.JSONGetter.Spy请求至 %s', 'color:#00F', ajaxOptions.url)
            console.log('请求数据 %O', data);
            console.groupEnd();
            return $.when(this.dataFactory(data, ajaxOptions)).done(function(s){
                console.groupCollapsed('%c返回了一个TG.JSONGetter.Spy响应从 %s', 'color:#00F', ajaxOptions.url)
                console.log('耗时约 %i ms', $.now() - start);
                console.log('响应数据 %O', s);
                console.groupEnd();
            }).fail(function(){
                console.groupCollapsed('%c返回了一个TG.JSONGetter.Spy响应从 %s', 'color:#F00', ajaxOptions.url)
                console.log('耗时约 %i ms', $.now() - start);
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
                    $.extend(s, {State: -500, Msg:'由于需求请求被中断'});
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
                            //如果没有data
                            data = data || { State: -201 };
                            if (typeof data == 'string')
                                try {
                                    data = $.parseJSON(data);
                                } catch (e) {
                                    err = 1;
                                }
                            if (!err && typeof data == 'object' && ('state_code' in data || 'message' in data)) {
                                data = {
                                    State: parseInt(data['state_code']),
                                    Data: data.data,
                                    Msg: data.message,
                                    HelpLink: data['help_link']
                                }
                            } else if (err || typeof data != 'object' || !('State' in data) && !('Data' in data)) {
                                // 如果转换错误，则当作字符串类型
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
            // 0 , undefined, null, ''都视为正确
            if (!state)
                dfd.resolveWith(this, dataArray);
            else if (state < -999)
                dfd.notifyWith(this, dataArray);
            else {
                //try {
                dataArray[3] = dataArray[3] || '系统错误';
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
                //dataArray[0].Msg = dataArray[3] = '系统异常'
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
        var msg = D.Msg || '系统错误';
        if (D.State > 0 || D.State < -499) alert(msg);
        else alert('(错误码：'+ D.State + ")" + msg + '\n' + '请稍候重试或联系客服!');
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
