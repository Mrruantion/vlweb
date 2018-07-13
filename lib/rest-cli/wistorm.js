/**
 * Created with JetBrains WebStorm.
 * User: 1
 * Date: 14-1-2
 * Time: 下午4:38
 * test wistorm rest api
 *
 * 除了customer表有一些比较特殊的操作,比如登陆,注册,重置密码之外,
 * 大部分的数据表都具有create,update,delete,list,get五个通用操作, 根据数据表, 传入字段名key及字段值value即可实现相应操作.
 * create接口参数格式:
 *      新增参数: key=value, 比如cust_name=测试&address=测试
 * update接口参数格式:
 *      条件参数: _key=value, 比如_obj_id=1, 如果value为json对象,则 _key.field=value
 *      更新参数: 如果key的值为json对象,则更新对象中某字段的格式为: key.$.field=value
 *          一般更新: key=value, 比如obj_name=修改
 *          计数更新: key=+n或者-n, 比如read_count=+1, 计数加1;  read_count=-1, 计数减1,  由于转移的问题+号需传%2B
 *          数组更新: key=+value/json或者-value/json, 比如seller_ids=+1286, 新增1286, seller_id=-1286, 删除1286, 由于转移的问题+号需传%2B
 * delete接口参数格式:
 *      条件参数: key=value, 比如obj_id=1
 * get接口参数格式:
 *      条件参数: key=value, 比如obj_id=1
 *      fields: 返回字段, 格式为key1,key2,key3, 比如cust_id,cust_name
 * list接口参数格式:
 *      查询参数:
 *          一般格式: key=value
 *          模糊搜索: key=^value, 比如obj_name=^粤B1234
 *          比较搜索: key=>value, <value, <=value, >=value, <>value(不等于)
 *          时间段: key=begin_time@end_time, 比如create_time=2015-11-01@2015-12-01
 *          数组搜索: key=~[value]
 *          或搜索: key=value1|value2|value3|...|value, 每个值都支持以上各种搜索方式
 *      fields: 返回字段, 格式为key1,key2,key3, 比如cust_id,cust_name
 *      sorts: 排序字段, 格式为key1,key2,key3, 如果为倒序在字段名称前加-, 比如-key1,key2
 *      page: 分页字段, 一般为数据表的唯一ID
 *      min_id: 本页最小分页ID, 0表示不起作用
 *      max_id: 本页最大分页ID, 0表示不起作用
 *      limit: 返回数量, -1表示不限制返回数量, 开放接口limit最大值为100
 *
 * 访问信令access_token:
 *      除了个别接口, 大部分的接口是需要传入access_token, 开发者需要在登录之后保存access_token,
 *      之后在调用其他接口的时候传入, access_token的有效期为24小时, 过期之后需要重新获取.
 *
 * 开发者访问自定义表时需传入开发者devKey, 该key在注册成开发者的时候自动生成
 */

var url = require("url");
var define = require("./define.js");
var http = require("http");
var util = require('./util.js');

Date.prototype.format = function (format) {
    var o = {
        "M+": this.getMonth() + 1, //month
        "d+": this.getDate(), //day
        "h+": this.getHours(), //hour
        "m+": this.getMinutes(), //minute
        "s+": this.getSeconds(), //second
        "q+": Math.floor((this.getMonth() + 3) / 3), //quarter
        "S": this.getMilliseconds() //millisecond
    };
    if (/(y+)/.test(format)) format = format.replace(RegExp.$1,
        (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)if (new RegExp("(" + k + ")").test(format))
        format = format.replace(RegExp.$1,
            RegExp.$1.length == 1 ? o[k] :
                ("00" + o[k]).substr(("" + o[k]).length));
    return format;
};

var raw = function (args) {
    var keys = Object.keys(args);
    keys = keys.sort();
    var newArgs = {};
    keys.forEach(function (key) {
        newArgs[key] = args[key];
    });

    var string = '';
    for (var k in newArgs) {
        if (k != 'sign') {
            if(typeof(args[k]) == 'object'){
                string += k + JSON.stringify(newArgs[k]);
            }else{
                string += k + newArgs[k];
            }
        }
    }
    return string;
};

// 产生url后面的拼接字符串
var raw2 = function (args) {
    var string = '';
    for (var k in args) {
        if(typeof(args[k]) == 'object'){
            string += '&' + k + '=' + encodeURIComponent(JSON.stringify(args[k]));
        }else{
            string += '&' + k + '=' + encodeURIComponent(args[k]);
        }
    }
    string = string.substr(1);
    return string;
};

// 调用API基础数据
function WiStormAPI(app_key, app_secret, format, v, sign_method, dev_key) {
    this.app_key = app_key;
    this.app_secret = app_secret;
    this.dev_key = dev_key;
    var timestamp = new Date();
    timestamp = timestamp.format("yyyy-MM-dd hh:mm:ss");
    this.timestamp = timestamp;
    this.format = format;
    this.v = v;
    this.sign_method = sign_method;
    this.method = "";
    this.sign_obj = {
        timestamp: timestamp,            //时间戳yyyy-mm-dd hh:nn:ss
        format: format,                  //返回数据格式
        app_key: app_key,                //app key
        v: v,                            //接口版本
        sign_method: sign_method         //签名方式
    };
}

WiStormAPI.prototype.init = function(){
    var timestamp = new Date();
    timestamp = timestamp.format("yyyy-MM-dd hh:mm:00");
    this.timestamp = timestamp;
    this.sign_obj = {
        timestamp: timestamp,            	  //时间戳yyyy-mm-dd hh:nn:ss
        format: this.format,                  //返回数据格式
        app_key: this.app_key,                //app key
        v: this.v,                            //接口版本
        sign_method: this.sign_method         //签名方式
    };
};

WiStormAPI.prototype.sign = function () {
    var s = raw(this.sign_obj);
    var sign = util.md5(encodeURI(this.app_secret + s + this.app_secret));
    sign = sign.toUpperCase();
    return sign;
};

// 注册
// 参数:
//    mobile: 手机(手机或者邮箱选其一)
//    email: 邮箱(手机或者邮箱选其一)
//    login_id: 微信登陆id
//    password: 加密密码(md5加密)
// 返回：
//    cust_id: 用户id
WiStormAPI.prototype.register = function (mobile, email, login_id, password, user_type, valid_code, callback) {
    this.init();
    this.sign_obj.method = 'wicare.user.register';
    this.sign_obj.mobile = mobile;
    this.sign_obj.email = email;
    this.sign_obj.login_id = login_id;
    this.sign_obj.password = password;
    this.sign_obj.user_type = user_type;
    this.sign_obj.valid_code = valid_code;
    this.sign_obj.sign = this.sign();
    var params = raw2(this.sign_obj);
    var path = define.API_URL + "/router/rest?" + params;
    util._get(path, function (obj) {
        callback(obj);
    });
};

// WiStormAPI.prototype.getPlanId = function(path,callback){
//     util._get(path, function (obj) {
//         callback(obj);
//     });
// }

// 获取令牌
// 参数：account: 手机号码或者邮箱地址
//      passsword: md5(登陆密码)
//      auth_type: 1 个人令牌, 2 企业令牌
// 返回：access_token: 访问令牌
//      valid_time: 有效时间
WiStormAPI.prototype.getToken = function (account, password, type, callback) {
    this.init();
    this.sign_obj.method = 'wicare.user.access_token';
    this.sign_obj.account = account;
    this.sign_obj.password = password;
    this.sign_obj.type = type;
    this.sign_obj.sign = this.sign();
    var params = raw2(this.sign_obj);
    var path = define.API_URL + "/router/rest?" + params;
    util._get(path, function (obj) {
        callback(obj);
    });
};

// 登陆测试
// 参数：account: 手机号码或者邮箱地址
//      passsword: md5(登陆密码)
// 返回：auth_code: api调用验证码
//      cust_id: 用户id
WiStormAPI.prototype.login = function (account, password, callback) {
    this.init();
    this.sign_obj.method = 'wicare.user.login';
    this.sign_obj.account = account;
    this.sign_obj.password = password;
    this.sign_obj.sign = this.sign();
    var params = raw2(this.sign_obj);
    var path = define.API_URL + "/router/rest?" + params;
    util._get(path, function (obj) {
        callback(obj);
    });
};

// 重置密码
// 参数：account: 手机号码或者邮箱地址
//      passsword: md5(登陆密码)
// 返回：
//      status_code: 调用状态
WiStormAPI.prototype.resetPassword = function (account, password, valid_type, valid_code, callback) {
    this.init();
    this.sign_obj.method = 'wicare.user.password.reset';
    this.sign_obj.account = account;
    this.sign_obj.password = password;
    this.sign_obj.valid_type = valid_type;
    this.sign_obj.valid_code = valid_code;
    this.sign_obj.sign = this.sign();
    var params = raw2(this.sign_obj);
    var path = define.API_URL + "/router/rest?" + params;
    util._get(path, function (obj) {
        callback(obj);
    });
};

// 获取用户列表
// 参数:
//    query_json: 查询json;
//    fields: 返回字段
//    sorts: 排序字段,如果倒序,在字段前面加-
//    page: 分页字段
//    min_id: 分页字段的本页最小值
//    max_id: 分页字段的本页最小值
//    limit: 返回数量
// 返回：
//    按fields返回数据列表
WiStormAPI.prototype.getUserList = function (query_json, fields, sorts, page, min_id, max_id, limit, access_token, callback) {
    this.init();
    this.sign_obj.method = 'wicare.users.list';
    this.sign_obj.access_token = access_token;
    for (var key in query_json) {
        this.sign_obj[key] = query_json[key];
    }
    this.sign_obj.fields = fields;
    this.sign_obj.sorts = sorts;
    this.sign_obj.page = page;
    this.sign_obj.max_id = max_id;
    this.sign_obj.min_id = min_id;
    this.sign_obj.limit = limit;
    this.sign_obj.sign = this.sign();
    var params = raw2(this.sign_obj);
    var path = define.API_URL + "/router/rest?" + params;
    util._get(path, function (obj) {
        callback(obj);
    });
};

// 更新客户信息
// 参数:
//    cust_id: 用户ID
//    customer表里面的除了cust_id, create_time, update_time之外的所有字段
// 返回：
//    status_code: 状态码
WiStormAPI.prototype.update = function (query_json, update_json, access_token, callback) {
    this.init();
    this.sign_obj.method = 'wicare.user.update';
    this.sign_obj.access_token = access_token;
    //this.sign_obj.cust_id = cust_id;
    for (var key in query_json) {
        this.sign_obj["_" + key] = query_json[key];
    }
    for (var key in update_json) {
        this.sign_obj[key] = update_json[key];
    }
    this.sign_obj.sign = this.sign();
    var params = raw2(this.sign_obj);
    var path = define.API_URL + "/router/rest?" + params;
    util._get(path, function (obj) {
        callback(obj);
    });
};


// 更新客户信息
// 参数:
//    cust_id: 用户ID
//    customer表里面的除了cust_id, create_time, update_time之外的所有字段
// 返回：
//    status_code: 状态码
WiStormAPI.prototype.updateMe = function (query_json, update_json, access_token, callback) {
    this.init();
    this.sign_obj.method = 'wicare.user.updateMe';
    this.sign_obj.access_token = access_token;
    //this.sign_obj.cust_id = cust_id;
    for (var key in query_json) {
        this.sign_obj["_" + key] = query_json[key];
    }
    for (var key in update_json) {
        this.sign_obj[key] = update_json[key];
    }
    this.sign_obj.sign = this.sign();
    var params = raw2(this.sign_obj);
    var path = define.API_URL + "/router/rest?" + params;
    util._get(path, function (obj) {
        callback(obj);
    });
};

// 获取客户信息
// 参数:
//    cust_id: 用户ID
//    fields: 需要返回的字段
// 返回：
//    返回fields指定的字段
WiStormAPI.prototype.get = function (query_json, fields, access_token, callback) {
    this.init();
    this.sign_obj.method = 'wicare.user.get';
    this.sign_obj.access_token = access_token;
    //this.sign_obj.cust_id = cust_id;
    for (var key in query_json) {
        this.sign_obj[key] = query_json[key];
    }
    this.sign_obj.fields = fields;
    this.sign_obj.sign = this.sign();
    var params = raw2(this.sign_obj);
    var path = define.API_URL + "/router/rest?" + params;
    util._get(path, function (obj) {
        callback(obj);
    });
};

// 判断用户是否存在
// 参数:
//    mobile: 手机号
//    cust_name: 用户名
// 返回：
//    返回是否存在
WiStormAPI.prototype.exists = function (query_json, fields, callback) {
    this.init();
    this.sign_obj.method = 'wicare.user.exists';
    for (var key in query_json) {
        this.sign_obj[key] = query_json[key];
    }
    this.sign_obj.fields = fields;
    this.sign_obj.sign = this.sign();
    var params = raw2(this.sign_obj);
    var path = define.API_URL + "/router/rest?" + params;
    util._get(path, function (obj) {
        callback(obj);
    });
};

// 发送短信
// 参数:
//    mobile: 手机号码
//    type: 发送短信类型
//      0: 普通短信
//      1: 普通校验码信息
//      2: 忘记密码校验信息
//    content: 短信消息, type为0时需要设置
// 返回：
//    status_code: 状态码
WiStormAPI.prototype.sendSMS = function (mobile, type, content, callback) {
    this.init();
    this.sign_obj.method = 'wicare.comm.sms.send';
    this.sign_obj.mobile = mobile;
    this.sign_obj.type = type;
    this.sign_obj.content = content;
    this.sign_obj.sign = this.sign();
    var params = raw2(this.sign_obj);
    var path = define.API_URL + "/router/rest?" + params;
    util._get(path, function (obj) {
        callback(obj);
    });
};

// 发送推送
// 参数:
//    cid: clientId
//    title: 推送标题
//    content: 推送内容
//    img: 推送图片
//    data: 自定义内容
// 返回：
//    status_code: 状态码
WiStormAPI.prototype.sendPush = function (cid, title, content, img, data, callback) {
    this.sign_obj.method = 'wicare.comm.push.send';
    this.sign_obj.dev_key = this.dev_key;
    this.sign_obj.cid = cid;
    this.sign_obj.title = title;
    this.sign_obj.content = content;
    this.sign_obj.img = img;
    this.sign_obj.data = data;
    this.sign_obj.sign = this.sign();
    var params = raw2(this.sign_obj);
    var path = define.API_URL + "/router/rest?" + params;
    util._get(path, function (obj) {
        callback(obj);
    });
};

// 验证校验码
// 参数:
//    valid_type: 1: 通过手机号  2:通过邮箱
//    valid_code: 收到的验证码
//    mobile: 手机
//    email: 邮箱
// 返回:
//    valid: true 有效 false 无效
WiStormAPI.prototype.validCode = function (mobile, email, valid_type, valid_code, callback) {
    this.init();
    this.sign_obj.method = 'wicare.comm.validCode';
    this.sign_obj.mobile = mobile;
    this.sign_obj.email = email;
    this.sign_obj.valid_type = valid_type;
    this.sign_obj.valid_code = valid_code;
    this.sign_obj.sign = this.sign();
    var params = raw2(this.sign_obj);
    var path = define.API_URL + "/router/rest?" + params;
    util._get(path, function (obj) {
        callback(obj);
    });
};

// 创建发送设备指令
// 参数:
//   device_id: 设备ID;
//   cmd_type: 指令类型;
//   params: 对应参数;
// 返回：
//    status_code: 状态码
WiStormAPI.prototype.createCommand = function (did, cmd_type, params, access_token, callback) {
    this.init();
    this.sign_obj.method = 'wicare._iotCommand.create';
    this.sign_obj.access_token = access_token;
    this.sign_obj.did = did;
    this.sign_obj.cmd_type = cmd_type;
    this.sign_obj.params = params;
    this.sign_obj.sign = this.sign();
    var params = raw2(this.sign_obj);
    var path = define.API_URL + "/router/rest?" + params;
    util._get(path, function (obj) {
        callback(obj);
    });
};

// 产生订单并获取微信支付参数
// 参数:
//    cust_id: 商户Id;
//    open_id: 微信用户OpenID;
//    order_type: 订单类型 1:设备 2:服务费
//    trade_type: 交易类型: JSAPI - 网页支付, APP - APP支付
//    pay_key: String,    //付费对象, 如果为终端,则为终端序列号, 如果为SIM卡费,则为sim卡号
//    product_id: 产品ID
//    product_name: 产品名称;
//    color: 颜色
//    model: 型号
//    remark: 产品描述;
//    unit_price: 单价;
//    quantity: 数量;
//    total_price: 总价;
//    wi_dou: 使用抵扣微豆数
//    voucher: 代金券码
//    act_pay: 实际支付金额
// 返回：
//    微信JSAPI支付参数
WiStormAPI.prototype.createOrderAndPay = function (cust_id, open_id, trade_type, order_type, pay_key, product_id, product_name, color, model, remark, unit_price, quantity, total_price, wi_dou, voucher, act_pay, callback) {
    this.init();
    this.sign_obj.method = 'wicare.pay.buy';
    this.sign_obj.cust_id = cust_id;
    if(trade_type == "JSAPI"){
        this.sign_obj.open_id = open_id;
    }
    this.sign_obj.trade_type = trade_type;
    this.sign_obj.order_type = order_type;
    this.sign_obj.pay_key = pay_key;
    this.sign_obj.product_id = product_id;
    this.sign_obj.product_name = product_name;
    this.sign_obj.color = color;
    this.sign_obj.model = model;
    this.sign_obj.remark = remark;
    this.sign_obj.unit_price = unit_price;
    this.sign_obj.quantity = quantity;
    this.sign_obj.total_price = total_price;
    this.sign_obj.wi_dou = wi_dou;
    this.sign_obj.voucher = voucher;
    this.sign_obj.act_pay = act_pay;
    this.sign_obj.sign = this.sign();
    var params = raw2(this.sign_obj);
    var path = define.API_URL + "/router/rest?" + params;
    util._get(path, function (obj) {
        callback(obj);
    });
};

// 获取微信支付参数
// 参数:
//    open_id: 微信用户OpenID;
//    trade_type: 交易类型: JSAPI - 网页支付, APP - APP支付
//    product_name: 产品名称;
//    remark: 产品描述;
//    total_price: 总价;
// 返回：
//    微信JSAPI支付参数
WiStormAPI.prototype.payWeixin = function (open_id, order_id, trade_type, product_name, remark, total_price, callback) {
    this.init();
    this.sign_obj.method = 'wicare.pay.weixin';
    if(trade_type == "JSAPI"){
        this.sign_obj.open_id = open_id;
    }
    this.sign_obj.order_id = order_id;
    this.sign_obj.trade_type = trade_type;
    this.sign_obj.product_name = product_name;
    this.sign_obj.remark = remark;
    this.sign_obj.total_price = total_price;
    this.sign_obj.sign = this.sign();
    var params = raw2(this.sign_obj);
    var path = define.API_URL + "/router/rest?" + params;
    util._get(path, function (obj) {
        callback(obj);
    });
};

// 创建对象
// 参数:
//    vehicle表的所有字段
// 返回：
//    status_code: 状态码
WiStormAPI.prototype._create = function (table, create_json, access_token, is_dev_key, callback) {
    this.init();
    this.sign_obj.method = 'wicare.' + table + '.create';
    if(is_dev_key){
        this.sign_obj.dev_key = this.dev_key;
    }
    this.sign_obj.access_token = access_token;
    for (var key in create_json) {
        this.sign_obj[key] = create_json[key];
    }
    this.sign_obj.sign = this.sign();
    var params = raw2(this.sign_obj);
    var path = define.API_URL + "/router/rest?" + params;
    util._get(path, function (obj) {
        callback(obj);
    });
};

// 创建对象
// 参数:
//    vehicle表的所有字段
// 返回：
//    status_code: 状态码
WiStormAPI.prototype._createBatch = function (table, create_json, access_token, is_dev_key, callback) {
    this.init();
    this.sign_obj.method = 'wicare.' + table + '.createBatch';
    if(is_dev_key){
        this.sign_obj.dev_key = this.dev_key;
    }
    this.sign_obj.access_token = access_token;
    this.sign_obj.sign = this.sign();
    var params = raw2(this.sign_obj);
    var path = define.API_URL + "/router/rest?" + params;
    util._post(path, function (obj) {
        callback(obj);
    });
};

// 更新对象
// 参数:
//    business表里面的除了business_id, arrive_time之外的所有字段
// 返回：
//    status_code: 状态码
WiStormAPI.prototype._update = function (table, query_json, update_json, access_token, is_dev_key, callback) {
    this.init();
    this.sign_obj.method = 'wicare.' + table + '.update';
    if(is_dev_key){
        this.sign_obj.dev_key = this.dev_key;
    }
    this.sign_obj.access_token = access_token;
    //this.sign_obj.obj_id = obj_id;
    for (var key in query_json) {
        this.sign_obj["_" + key] = query_json[key];
    }
    for (var key in update_json) {
        this.sign_obj[key] = update_json[key];
    }
    this.sign_obj.sign = this.sign();
    var params = raw2(this.sign_obj);
    var path = define.API_URL + "/router/rest?" + params;
    util._get(path, function (obj) {
        callback(obj);
    });
};

// 更新对象
// 参数:
//    business表里面的除了business_id, arrive_time之外的所有字段
// 返回：
//    status_code: 状态码
WiStormAPI.prototype._updatePost = function (table, query_json, update_json, access_token, is_dev_key, callback) {
    this.init();
    this.sign_obj.method = 'wicare.' + table + '.update';
    if(is_dev_key){
        this.sign_obj.dev_key = this.dev_key;
    }
    this.sign_obj.access_token = access_token;
    //this.sign_obj.obj_id = obj_id;
    // for (var key in query_json) {
    //     this.sign_obj["_" + key] = query_json[key];
    // }
    // for (var key in update_json) {
    //     this.sign_obj[key] = update_json[key];
    // }
    var data = {};
    for (var key in query_json) {
        data["_" + key] = query_json[key];
    }
    for (var key in update_json) {
        data[key] = update_json[key];
    }
    this.sign_obj.sign = this.sign();
    var params = raw2(this.sign_obj);
    var path = define.API_URL + "/router/rest?" + params;
    util._post(path, data, function (obj) {
        callback(obj);
    });
};

// 更新对象
// 参数:
//    business表里面的除了business_id, arrive_time之外的所有字段
// 返回：
//    status_code: 状态码
WiStormAPI.prototype._refreshTable = function (access_token, callback) {
    this.init();
    this.sign_obj.method = 'wicare.table.refresh';
    this.sign_obj.dev_key = this.dev_key;
    this.sign_obj.access_token = access_token;
    this.sign_obj.sign = this.sign();
    var params = raw2(this.sign_obj);
    var path = define.API_URL + "/router/rest?" + params;
    util._get(path, function (obj) {
        callback(obj);
    });
};

// 获取对象
// 参数:
//
// 返回:
//    status_code: 状态码
WiStormAPI.prototype._get = function (table, query_json, fields, access_token, is_dev_key, callback) {
    this.init();
    this.sign_obj.method = 'wicare.' + table + '.get';
    if(is_dev_key){
        this.sign_obj.dev_key = this.dev_key;
    }
    this.sign_obj.access_token = access_token;
    for (var key in query_json) {
        this.sign_obj[key] = query_json[key];
    }
    this.sign_obj.fields = fields;
    this.sign_obj.sign = this.sign();
    var params = raw2(this.sign_obj);
    var path = define.API_URL + "/router/rest?" + params;
    console.log(path);
    util._get(path, function (obj) {
        obj.path = path;
        callback(obj);
    });
};

// 删除对象
// 参数:
//    obj_id: 目标ID
// 返回:
//    status_code: 状态码
WiStormAPI.prototype._delete = function (table, query_json, access_token, is_dev_key, callback) {
    this.init();
    this.sign_obj.method = 'wicare.' + table + '.delete';
    if(is_dev_key){
        this.sign_obj.dev_key = this.dev_key;
    }
    this.sign_obj.access_token = access_token;
    for (var key in query_json) {
        this.sign_obj[key] = query_json[key];
    }
    this.sign_obj.sign = this.sign();
    var params = raw2(this.sign_obj);
    var path = define.API_URL + "/router/rest?" + params;
    util._get(path, function (obj) {
        callback(obj);
    });
};

// 获取统计计数
// 参数:
//    query_json: 查询结构体
// 返回:
//    status_code: 状态码
WiStormAPI.prototype._count = function (table, query_json, access_token, is_dev_key, callback) {
    this.init();
    this.sign_obj.method = 'wicare.' + table + '.count';
    if(is_dev_key){
        this.sign_obj.dev_key = this.dev_key;
    }
    this.sign_obj.access_token = access_token;
    for (var key in query_json) {
        this.sign_obj[key] = query_json[key];
    }
    this.sign_obj.sign = this.sign();
    var params = raw2(this.sign_obj);
    var path = define.API_URL + "/router/rest?" + params;
    util._get(path, function (obj) {
        callback(obj);
    });
};

// 获取对象列表
// 参数:
//    query_json: 查询json;
//    fields: 返回字段
//    sorts: 排序字段,如果倒序,在字段前面加-
//    page: 分页字段
//    min_id: 分页字段的本页最小值
//    max_id: 分页字段的本页最小值
//    limit: 返回条数;
// 返回：
//    按fields返回数据列表
WiStormAPI.prototype._list = function (table, query_json, fields, sorts, page, min_id, max_id, page_no, limit, access_token, is_dev_key, callback) {
    this.init();
    this.sign_obj.method = 'wicare.' + table + '.list';
    if(is_dev_key){
        this.sign_obj.dev_key = this.dev_key;
    }
    this.sign_obj.access_token = access_token;
    for (var key in query_json) {
        this.sign_obj[key] = query_json[key];
    }
    this.sign_obj.fields = fields;
    this.sign_obj.sorts = sorts;
    this.sign_obj.page = page;
    this.sign_obj.max_id = max_id;
    this.sign_obj.min_id = min_id;
    this.sign_obj.limit = limit;
    this.sign_obj.sign = this.sign();
    var params = raw2(this.sign_obj);
    var path = define.API_URL + "/router/rest?" + params;
    util._get(path, function (obj) {
        callback(obj);
    });
};

// 获取对象列表
// 参数:
//    query_json: 查询json;
//    fields: 返回字段
//    sorts: 排序字段,如果倒序,在字段前面加-
//    page: 分页字段
//    min_id: 分页字段的本页最小值
//    max_id: 分页字段的本页最小值
//    limit: 返回条数;
// 返回：
//    按fields返回数据列表
WiStormAPI.prototype._list2 = function (table, query_json, fields, sorts, page, min_id, max_id, page_no, limit, access_token, callback) {
    this.init();
    this.sign_obj.method = 'wicare.' + table + '.list';
    // this.sign_obj.dev_key = this.dev_key;
    this.sign_obj.access_token = access_token;
    for (var key in query_json) {
        this.sign_obj[key] = query_json[key];
    }
    this.sign_obj.fields = fields;
    this.sign_obj.sorts = sorts;
    this.sign_obj.page = page;
    this.sign_obj.max_id = max_id;
    this.sign_obj.min_id = min_id;
    this.sign_obj.limit = limit;
    this.sign_obj.sign = this.sign();
    var params = raw2(this.sign_obj);
    var path = define.API_URL + "/router/rest?" + params;
    util._get(path, function (obj) {
        callback(obj);
    });
};

// 删除对象
// 参数:
//    obj_id: 目标ID
// 返回:
//    status_code: 状态码
WiStormAPI.prototype.setCache = function (key, value, callback) {
    this.init();
    this.sign_obj.method = 'wicare.cache.setObj';
    // this.sign_obj.dev_key = this.dev_key;
    this.sign_obj.key = key;
    this.sign_obj.value = value;
    this.sign_obj.sign = this.sign();
    var params = raw2(this.sign_obj);
    var path = define.API_URL + "/router/rest?" + params;
    util._get(path, function (obj) {
        callback(obj);
    });
};

WiStormAPI.prototype.getCache = function (key, callback) {
    this.init();
    this.sign_obj.method = 'wicare.cache.getObj';
    // this.sign_obj.dev_key = this.dev_key;
    this.sign_obj.key = key;
    this.sign_obj.sign = this.sign();
    var params = raw2(this.sign_obj);
    var path = define.API_URL + "/router/rest?" + params;
    util._get(path, function (obj) {
        callback(obj);
    });
};

WiStormAPI.prototype.validDevice = function (did, access_token, callback) {
    this.init();
    this.sign_obj.method = 'wicare.device.valid';
    this.sign_obj.dev_key = this.dev_key;
    this.sign_obj.access_token = access_token;
    this.sign_obj.did = did;
    this.sign_obj.sign = this.sign();
    var params = raw2(this.sign_obj);
    var path = define.API_URL + "/router/rest?" + params;
    util._get(path, function (obj) {
        callback(obj);
    });
};
module.exports = WiStormAPI;