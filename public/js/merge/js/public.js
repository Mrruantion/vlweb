
function W(select, needAll) {
    if (needAll)
        return document.querySelectorAll(select);
    else
        return document.querySelector(select);
}

W.noop = function () { };
W.setCookie = function (c_name, value, expiredays, path) {
    var exdate = new Date();
    expiredays = expiredays || 1; //默认为1天
    if (expiredays > 1)
        exdate.setDate(exdate.getDate() + expiredays);
    else if (expiredays > 0)
        exdate.setHours(exdate.getHours() + expiredays * 24);
    else
        exdate.setMinutes(exdate.getMinutes() - expiredays);
    var domain = "";
    if (path) {
        domain = "; path=" + path + ";";
    } else {
        domain = "; path=/; domain=" + document.domain;
    }
    var tem = c_name + "=" + encodeURIComponent(value) + ((expiredays == null) ? "" : ";expires=" + exdate.toGMTString()) + domain;
    document.cookie = tem;
}

/**
 * 获取cookie
 * @param {String} c_name
 */
W.getCookie = function (c_name) {
    if (document.cookie.length > 0) {
        c_start = document.cookie.indexOf(c_name + "=");
        if (c_start != -1) {
            c_start = c_start + c_name.length + 1;
            c_end = document.cookie.indexOf(";", c_start);
            if (c_end == -1) c_end = document.cookie.length;
            return decodeURIComponent(document.cookie.substring(c_start, c_end));
        }
    }
}

W.getSearch = function () {
    var url = location.search;
    if (!url) return {};
    url = url.split("?")[1].split("&");
    var json = {};
    var n = url.length;
    for (var i = 0; i < n; i++) {
        json[url[i].split("=")[0]] = decodeURIComponent(url[i].split("=")[1]);
    }
    return json;
};

W.dateToString = function (d) {
    var j = {};
    j.m = d.getMonth() + 1;
    j.d = d.getDate();
    j.h = d.getHours();
    j.mi = d.getMinutes();
    j.s = d.getSeconds();
    for (items in j) {
        if (j[items] < 10)
            j[items] = "0" + j[items];
    }
    return d.getFullYear() + "-" + j.m + "-" + j.d + " " + j.h + ":" + j.mi + ":" + j.s;
}
W.date = function (str) {
    var date = new Date();
    if (!str)
        return date;
    var t = str.split(/[T\s]/);
    if (t.length < 2)
        t = (str + ' 00:00:00').split(/[T\s]/);
    var str_before = t[0]; //获取年月日
    var str_after = t[1]; //获取时分秒
    var years = str_before.split('-')[0]; //分别截取得到年月日
    var months = str_before.split('-')[1] - 1;
    var days = str_before.split('-')[2];
    var hours = str_after.split(':')[0] || 0;
    var mins = str_after.split(':')[1] || 0;
    var seces = str_after.split(':')[2].replace("Z", "");
    var secs = seces.split('.')[0] || 0;
    var smsecs = seces.split('.')[1] || 0;
    if (str.indexOf("T") == -1) {
        date.setFullYear(years, months, days);
        date.setHours(hours, mins, secs, smsecs);
    } else {
        date.setUTCFullYear(years, months, days);
        date.setUTCHours(hours, mins, secs, smsecs);
    }
    return date;
}

W.getBeforeDate = function (n) {
    var now = new Date();
    var aftertime = new Date(n);
    var year = now.getFullYear();
    var mon = now.getMonth() + 1;
    var day = now.getDate();
    var year_after = aftertime.getFullYear();
    var mon_after = aftertime.getMonth() + 1;
    var day_after = aftertime.getDate();
    var chs = 0;
    //获取当月的天数
    function DayNumOfMonth(Year, Month) {
        return 32 - new Date(Year, Month - 1, 32).getDate();
    }
    if (aftertime.getTime() - now.getTime() < 0) {
        var temp1 = day_after;
        var temp2 = mon_after;
        var temp3 = year_after;
        day_after = day;
        mon_after = mon;
        year_after = year;
        day = temp1;
        mon = temp2;
        year = temp3;
    }
    if (year == year_after) {//不跨年
        if (mon == mon_after) {//不跨年不跨月
            chs += day_after - day;
        } else {//不跨年跨月
            chs += DayNumOfMonth(year, mon) - day + 1;//加上第一个不满的
            for (var i = 1; i < mon_after - mon; i++) {
                chs += DayNumOfMonth(year, mon + i);
            }
            chs += day_after - 1;//加上
        }
    } else {//存在跨年
        chs += DayNumOfMonth(year, mon) - day + 1;//加上开始年份不满的一个月
        for (var m = 1; m < 12 - mon; m++) {
            chs += DayNumOfMonth(year, mon + m);
        }
        for (var j = 1; j < year_after - year; j++) {
            if ((year + j) % 400 == 0 || (year + j) % 4 == 0 && (year + j) % 100 != 0) {
                chs += 366;
            } else {
                chs += 365;
            }
        }
        for (var n = 1; n <= mon_after; n++) {
            chs += DayNumOfMonth(year_after, n);
        }
        chs += day_after - 1;
    }
    if (aftertime.getTime() - now.getTime() < 0) {
        return -chs;
    } else {
        return chs;
    }
}

W.ajax = function (url, options) {
    var json = {
        dataType: "json",
        timeout: 10000,
        type: "GET",
        success: W.noop,
        error: W.noop
    }
    var headers = {
        "X-Requested-With": "XMLHttpRequest",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
        "Content-Type": "application/x-www-form-urlencoded"
    };
    json.url = url;
    Object.assign(json, options);
    options.headers ? Object.assign(headers, options.headers) : null;

    json.type = json.type.toUpperCase();
    var data = "";
    if (json.data) {
        for (items in json.data) {
            data += "&" + items + "=" + json.data[items];
        }
        if (json.type == "GET") {
            if (json.url.indexOf('?') == -1)
                json.url += "?" + data.slice(1);
            else
                json.url += data;
        }
    }

    var xmlhttp = new XMLHttpRequest();
    xmlhttp.responseType = json.dataType || 'json';
    if (json.timeout > 0) {
        xmlhttp.timeout = json.timeout;
        xmlhttp.ontimeout = function () {
            json.error(xmlhttp, 'timeout', json);
        }
    }

    xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState === 4) {
            xmlhttp.onreadystatechange = W.noop;
            if ((xmlhttp.status >= 200 && xmlhttp.status < 300) || xmlhttp.status === 304 || xmlhttp.status === 0) {
                var result = xmlhttp.response || { "status_code": -1, "err_msg": "无返回信息" };
                json.success(result, xmlhttp, json);
            } else {
                json.error(xmlhttp, xmlhttp.status ? 'error' : 'abort', json);
            }
        }
    }
    xmlhttp.open(json.type, json.url, true);

    for (var name in json.headers) {
        xmlhttp.setRequestHeader(name, json.headers[name]);
    }
    xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xmlhttp.send(data);

    return xmlhttp;
};

/**
 * 简化的ajax，用get方式
 * @param {String} url
 * @param {Object} data
 * @param {Function} success
 * @param {String} dataType
 */
W.get = function (url, data, success, dataType) {
    var options = {
        data: data,
        dataType: dataType, //服务器返回json格式数据
        type: 'get', //HTTP请求类型
        timeout: 10000, //超时时间设置为10秒；
        success: success,
        error: function (xhr, type, errorThrown) {
            console.log(type + "___url:" + url);
        }
    };
    W.ajax(url, options);
}

/**
 * 简化的ajax，用post方式
 * @param {String} url
 * @param {Object} data
 * @param {Function} success
 * @param {String} dataType
 */
W.post = function (url, data, success, dataType) {
    var options = {
        data: data,
        dataType: dataType, //服务器返回json格式数据
        type: 'post', //HTTP请求类型
        timeout: 10000, //超时时间设置为10秒；
        success: success,
        error: function (xhr, type, errorThrown) {
            console.log(type + "___url:" + url);
        }
    };
    W.ajax(url, options);
}

/**
 * 简化的ajax，用get方式,返回json格式数据
 * @param {String} url
 * @param {Object} data
 * @param {Function} success
 */
W.getJSON = function (url, data, success) {
    var options = {
        data: data,
        dataType: "json",
        type: 'get',
        timeout: 10000,
        success: success,
        error: function (xhr, type, errorThrown) {
            console.log(type + "___url:" + url);
        }
    };
    W.ajax(url, options);
}

W.$ajax = function (url, data, success) {
    var data_s = {
        limit: -1,
        pageno: 1,
        sorts: 'id'
    }
    Object.assign(data_s, data)
    var option = {
        url: url,
        data: data_s,
        dataType: "json",
        type: 'get',
        timeout: 10000,
        success: success,
        error: function (xhr, type, errorThrown) {
            console.log(type + "___url:" + url);
        }
    }
    $.ajax(option)
}

//文本框聚焦光标位置 0开头-1末尾
W.set_text_value_position = function (obj, spos) {
    var tobj = document.getElementById(obj);
    if (spos < 0)
        spos = tobj.value.length;
    if (tobj.setSelectionRange) { //兼容火狐,谷歌  
        setTimeout(function () {
            tobj.setSelectionRange(spos, spos);
            tobj.focus();
        }
            , 0);
    } else if (tobj.createTextRange) { //兼容IE  
        var rng = tobj.createTextRange();
        rng.move('character', spos);
        rng.select();
    }
}