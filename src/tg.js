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



