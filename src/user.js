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
                        data = {State : -1, Msg:'登录超时，请重试。'}; break
                    default :
                        data = { State: -2, Msg: '登录数据异常，请重试。' };
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
                        data = {State : -1, Msg:'注销超时'}; break
                    default :
                        data = { State: -2, Msg: '注销失败，请重试。' };
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
        // 不是对象的时候，将其值为空对象
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
            // 先备份一下，以免被误改
            else return $.extend({}, _list);
        },
        init: function(){
            //Chrome下(14.0.794.0)重写了document.domain之后会导致onstorage不触发
            //支持localStorage的情况
            var callback = this._callback.bind(this);
            if ('onstorage' in document) {
                // IE绑到document;
                document.attachEvent("onstorage", callback)
            } else if ($.support.localStorage) {
                // 标准浏览器绑到window;
                window.addEventListener("storage", callback)
            } else if (this.userTicker) {
                // 先刨个坑
            } else {
                // IE678
                window.attachEvent('onfocus', callback)
            }
            this.init = $.noop;
        },
        _callback: function(e){
            var that = this;
            //IE下不使用setTimeout竟然获取不到改变后的值?!
            $.nextTick(function(){
                e = e || window.storageEvent
                //若变化的key不是绑定的key，则过滤掉
                //IE下不支持key属性,因此需要根据storage中的数据判断key中的数据是否变化
                if (e.key && _key != e.key) return
                //获取新的值
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
                // 如果不是这个hash传递的话，只修改某个字段
            }
            var result = this._testAndSet(hash, isNew);
            if (this._isChange(result)) {
                this.trigger('change', result)
                // 延迟渲染，以免阻塞
                $.nextTick(function () {
                    localStorage.setItem(_key, serialize(result[2]))
                })
            }
        },
        _isChange: function(result){
            return !$.isEmptyObject(result[0]) || !$.isEmptyObject(result[1])
        },
        // 比较新旧数据的差异
        _testAndSet: function(valueHash, isNew){
            var i, newValue = {}, oldValue = {}, mix
            if (isNew) mix = $.mix({}, valueHash, _list)
            else mix = valueHash
            for (i in mix) {
                //alert(i + ' : ' + _list[i] + ' ' + valueHash[i])
                //alert($.isEqual(_list[i], valueHash[i]))
                if (mix.hasOwnProperty(i) && !$.isEqual(_list[i], valueHash[i])) {
                    // 如果不相等则赋值
                    oldValue[i] = _list[i];
                    if (valueHash.hasOwnProperty(i)) _list[i] = newValue[i] = valueHash[i]
                    else delete _list[i]
                }
            }
            return [newValue, oldValue, _list]
        }
    }))
})('tguserdata');


TG.User.Data.init();
