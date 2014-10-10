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
