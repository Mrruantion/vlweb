/**
 * Created with JetBrains WebStorm.
 * User: Administrator
 * Date: 12-9-28
 * Time: 下午4:55
 * To change this template use File | Settings | File Templates.
 */

//WiStrom API地址
// var API_URL = "http://localhost:8089"; //develop
var API_URL = "http://wop-api.chease.cn"; //test
// exports.API_URL = "http://o.bibibaba.cn/2.0"; //deploy
// exports.API_URL = 'http://' + process.env.API_URL + ':8089';

// 标准命令字
var IOT_CMD = {};
IOT_CMD.DEVICE_RESP = 0x0001;   //通用终端回复
IOT_CMD.SYSTEM_RESP = 0x8001;   //通用平台回复
IOT_CMD.HEART_BEAT = 0x0002;    //终端心跳
IOT_CMD.REISSUE = 0x8003;       //补传分包请求
IOT_CMD.REGISTER = 0x0100;      //终端注册
IOT_CMD.REGISTER_RESP = 0x8100; //终端注册应答
IOT_CMD.UNREGISTER = 0x0003;    //终端注销
IOT_CMD.AUTHORIZATION = 0x0102; //终端授权
IOT_CMD.SET_PARAM = 0x8103;     //设置终端参数
IOT_CMD.GET_PARAM = 0x8104;     //查询终端参数
IOT_CMD.GET_SELECT_PARAM = 0x8106;   //查询终端参数
IOT_CMD.GET_PARAM_RESP = 0x0104;     //查询终端参数应答
IOT_CMD.DEVICE_CONTORL = 0x8105;     //终端控制
IOT_CMD.GET_PROP = 0x8107;      //查询终端属性
IOT_CMD.GET_PROP_RESP = 0x0107; //查询终端属性应答
IOT_CMD.UPGRADE = 0x8108;       //下发升级包
IOT_CMD.UPGRADE_RESP = 0x0108;  //终端升级结果通知
IOT_CMD.GPS_REPORT = 0x0200;    //位置信息汇报
IOT_CMD.GET_GPS = 0x8201;       //位置信息查询
IOT_CMD.GET_GPS_RESP = 0x0201;  //位置信息汇报
IOT_CMD.TRACK = 0x8202;         //临时位置跟踪控制
IOT_CMD.MANUAL_CONFIRM_ALERT = 0x8203;  //人工确认报警消息
IOT_CMD.TEXT_MESSAGE = 0x8300;    //文本信息下发
IOT_CMD.SET_EVENT = 0x8301;       //事件设置
IOT_CMD.EVENT_REPORT = 0x0301;    //事件报告
IOT_CMD.QUESTION = 0x8302;        //提问下发
IOT_CMD.QUESTION_RESP = 0x0302;   //提问应答
IOT_CMD.PHONE_CALLBACK = 0x8400;   //电话回拨
IOT_CMD.SET_PHONE_BOOK = 0x8401;   //设置电话本
IOT_CMD.VEHICLE_CONTORL = 0x8500; //目标控制
IOT_CMD.VEHICLE_CONTORL_RESP = 0x0500; //目标控制应答
IOT_CMD.SET_GEOFENCE_CIRCLE = 0x8600; //设置圆形区域
IOT_CMD.DEL_GEOFENCE_CIRCLE = 0x8601; //删除圆形区域
IOT_CMD.SET_GEOFENCE_RECT = 0x8602; //设置矩形区域
IOT_CMD.DEL_GEOFENCE_RECT = 0x8603; //删除矩形区域
IOT_CMD.SET_GEOFENCE_POLY = 0x8604; //设置多边形区域
IOT_CMD.DEL_GEOFENCE_POLY = 0x8605; //删除多边形区域
IOT_CMD.SET_ROAD = 0x8606;    //设置线路
IOT_CMD.DEL_ROAD = 0x8607;    //删除线路
IOT_CMD.GET_VREC = 0x8700;    //行驶记录数据采集
IOT_CMD.VREC_UPLOAD = 0x0700; //行驶记录数据上传
IOT_CMD.SET_VREC = 0x8701;    //行驶记录参数下发
IOT_CMD.ELETRIC_BILL = 0x0701;  //电子运单上报
IOT_CMD.GET_DRIVER_INFO = 0x8702;   //上报司机信息请求
IOT_CMD.DRIVER_INFO_UPLOAD = 0x0702;   //上报司机信息
IOT_CMD.GPS_BATCH_REPORT = 0x0704;   //定位数据批量上传
IOT_CMD.CAN_REPORT = 0x0704;   //CAN总线数据上传
IOT_CMD.MEDIA_EVENT = 0x0800;  //多媒体事件信息上传
IOT_CMD.MEDIA_DATA = 0x0801;   //多媒体数据上传
IOT_CMD.MEDIA_DATA_RESP = 0x8800;   //多媒体数据上传应答
IOT_CMD.TAKE_PICTURE = 0x8801;      //立即拍照
IOT_CMD.TAKE_PICTURE_RESP = 0x0805; //立即拍照命令应答
IOT_CMD.MT_DATA = 0x8900;      //数据下行透传
IOT_CMD.MO_DATA = 0x0900;      //数据上行透传
IOT_CMD.COMPRESS_DATA = 0x0901; //数据压缩上报
IOT_CMD.OBD_DATA = 0x0CAD; //OBD数据上报
IOT_CMD.GET_OBD = 0x8CAD;  //OBD数据获取

//终端报警定义
//紧急报警：
//超速报警：
//震动报警：
//位移报警：
//防盗器报警：
//非法行驶报警：
//进围栏报警：
//出围栏报警：
//剪线报警：
//低电压报警：
//GPS天线断路报警：
//疲劳驾驶报警：
//非法启动：
//非法开车门：
var IOT_ALERT = {};
IOT_ALERT.ALERT_SOS = 0x3001;
IOT_ALERT.ALERT_OVERSPEED = 0x3002;
IOT_ALERT.ALERT_VIRBRATE = 0x3003;
IOT_ALERT.ALERT_MOVE = 0x3004;
IOT_ALERT.ALERT_ALARM = 0x3005;
IOT_ALERT.ALERT_INVALIDRUN = 0x3006;
IOT_ALERT.ALERT_ENTERGEO = 0x3007;
IOT_ALERT.ALERT_EXITGEO = 0x3008;
IOT_ALERT.ALERT_CUTPOWER = 0x3009;
IOT_ALERT.ALERT_LOWPOWER = 0x300A;
IOT_ALERT.ALERT_GPSCUT = 0x300B;
IOT_ALERT.ALERT_OVERDRIVE = 0x300C;
IOT_ALERT.ALERT_INVALIDACC = 0x300D;
IOT_ALERT.ALERT_INVALIDDOOR = 0x300E;
IOT_ALERT.ALERT_ACCESSORY = 0x300F; //附件断开报警
IOT_ALERT.ALERT_ENTERROUTE = 0x3010; //禁入线路报警
IOT_ALERT.ALERT_EXITROUTE = 0x3011; //禁出线路报警
IOT_ALERT.ALERT_INOUTPOINT = 0x3012; //巡更点进出报警
IOT_ALERT.ALERT_OFFLINE = 0x3013; //离线报警
IOT_ALERT.ALERT_SERVICE_TIMEOUT = 0x3014; //服务到期提醒
IOT_ALERT.ALERT_NOTIFY = 0x3015;  //通知公告提醒

var IOT_ALERT_DESC = {};
var IOT_ALERT_STATUS_DESC = {};
var alertType = {};
var defineId = setInterval(function () {
    if ("undefined" === typeof i18nextLoaded || !i18nextLoaded) {
        return;
    }
    IOT_ALERT_DESC[IOT_ALERT.ALERT_SOS.toString()] = i18next.t("alert.sos");
    IOT_ALERT_DESC[IOT_ALERT.ALERT_OVERSPEED.toString()] = i18next.t("alert.overspeed");
    IOT_ALERT_DESC[IOT_ALERT.ALERT_VIRBRATE.toString()] = i18next.t("alert.virbrate");
    IOT_ALERT_DESC[IOT_ALERT.ALERT_MOVE.toString()] = i18next.t("alert.move");
    IOT_ALERT_DESC[IOT_ALERT.ALERT_ALARM.toString()] = i18next.t("alert.alarm");
    // IOT_ALERT_DESC[IOT_ALERT.ALERT_INVALIDRUN.toString()] = '非法行驶报警';
    IOT_ALERT_DESC[IOT_ALERT.ALERT_ENTERGEO.toString()] = i18next.t("alert.entergeo");
    IOT_ALERT_DESC[IOT_ALERT.ALERT_EXITGEO.toString()] = i18next.t("alert.exitgeo");
    IOT_ALERT_DESC[IOT_ALERT.ALERT_CUTPOWER.toString()] = i18next.t("alert.cutpower");
    IOT_ALERT_DESC[IOT_ALERT.ALERT_LOWPOWER.toString()] = i18next.t("alert.lowpower");
    IOT_ALERT_DESC[IOT_ALERT.ALERT_GPSCUT.toString()] = i18next.t("alert.gpscut");
    IOT_ALERT_DESC[IOT_ALERT.ALERT_OVERDRIVE.toString()] = i18next.t("alert.overdrive");
    // IOT_ALERT_DESC[IOT_ALERT.ALERT_INVALIDACC.toString()] = '非法点火报警';
    // IOT_ALERT_DESC[IOT_ALERT.ALERT_INVALIDDOOR.toString()] = '非法开门报警';
    // IOT_ALERT_DESC[IOT_ALERT.ALERT_ACCESSORY.toString()] = '附件报警';
    // IOT_ALERT_DESC[IOT_ALERT.ALERT_ENTERROUTE.toString()] = '进线报警';
    // IOT_ALERT_DESC[IOT_ALERT.ALERT_EXITROUTE.toString()] = '出线报警';
    // IOT_ALERT_DESC[IOT_ALERT.ALERT_INOUTPOINT.toString()] = '巡更点进出报警';
    // IOT_ALERT_DESC[IOT_ALERT.ALERT_OFFLINE.toString()] = '离线报警';
    IOT_ALERT_STATUS_DESC["0"] = i18next.t("table.unprocessed");
    IOT_ALERT_STATUS_DESC["1"] = i18next.t("table.processed");





    alertType[i18next.t("alert.sos") + i18next.t("alert.alert")] = 0x3001;  //紧急报警：
    alertType[i18next.t("alert.overspeed") + i18next.t("alert.alert")] = 0x3002;//超速报警：
    alertType[i18next.t("alert.virbrate") + i18next.t("alert.alert")] = 0x3003;//震动报警：
    alertType[i18next.t("alert.move") + i18next.t("alert.alert")] = 0x3004;//位移报警：
    alertType[i18next.t("alert.alarm") + i18next.t("alert.alert")] = 0x3005;//防盗器报警：
    alertType[i18next.t("alert.entergeo") + i18next.t("alert.alert")] = 0x3007;//进围栏报警：
    alertType[i18next.t("alert.exitgeo") + i18next.t("alert.alert")] = 0x3008;//出围栏报警：
    alertType[i18next.t("alert.cutpower") + i18next.t("alert.alert")] = 0x3009;//断电报警：
    alertType[i18next.t("alert.lowpower") + i18next.t("alert.alert")] = 0x300A;//低电压报警：
    alertType[i18next.t("alert.gpscut") + i18next.t("alert.alert")] = 0x300B;//GPS断路报警：
    alertType[i18next.t("alert.overdrive") + i18next.t("alert.alert")] = 0x300C;//疲劳驾驶报警：
    alertType[i18next.t("alert.enterroute") + i18next.t("alert.alert")] = 0x3010; //进线路报警
    alertType[i18next.t("alert.exitroute") + i18next.t("alert.alert")] = 0x3011; //出线路报警
    clearInterval(defineId);
}, 100);

Date.prototype.beautify = function () {
    var d_minutes, d_hours, d_days;
    var timeNow = parseInt(new Date().getTime() / 1000);
    var d;
    d = timeNow - parseInt(this.getTime() / 1000);
    d_days = parseInt(d / 86400);
    d_hours = parseInt(d / 3600);
    d_minutes = parseInt(d / 60);
    if (d_days > 0 && d_days < 4) {
        return '>' + d_days + "d";
    } else if (d_days <= 0 && d_hours > 0) {
        return '>' + d_hours + "h";
    } else if (d_hours <= 0 && d_minutes > 0) {
        return '>' + d_minutes + "m";
    } else if (d_minutes <= 0 && d >= 0) {
        return "Now";
    } else {
        return this.format("MM-dd hh:mm");
    }
};

/* ------------------------------
 // 字符串模板1，语法严格，不能混用，效率相对较高
 // 使用 {{ }} 作为标记是为了允许在模板中使用 JSON 字符串

 // 用法 1(对象参数，对象可多次调用)：
 var say = "对　象：{{hi}}, {{to}}! {{hello}}, {{world}}!"
 say = say.format({hi:"Hello", to:"World"})
 .format({hello:"你好", world:"世界"})
 console.log(say)

 // 用法 2(数组参数)：
 var say = "数　组：{{0}}, {{1}}! {{0}}!"
 say = say.format(["Hello", "World"])
 console.log(say)

 // 用法 3(字符串参数，最后一个字符串可以重复使用)：
 var say = "字符串：{{.}}, {{.}}! {{.}}!"
 say = say.format("Hello", "World")
 console.log(say)

 // 用法 4(多次调用，字符串和数组不能共用，字符串必须首先处理)：

 // 无数组
 var say = "{{.}}：3 2 1, {{hi}}, {{to}}! {{hello}}, {{world}}!"
 say = say.format("多　次")
 .format({hi: "Hello"})
 .format({to: "World"})
 .format({hello: "你好", world: "世界"})
 console.log(say)

 // 无字符串
 var say = "多　次：{{2}} {{1}} {{0}}, {{hi}}, {{to}}! {{hello}}, {{world}}!"
 say = say.format({hi: "Hello"})
 .format({to: "World"})
 .format([1,2,3])
 .format({hello: "你好", world: "世界"})
 console.log(say)

 // 字符串和数组共用
 var say = "{{.}}：{{2}} {{1}} {{0}}, {{hi}}, {{to}}! {{hello}}, {{world}}!"
 say = say.format("出问题")
 .format({hi: "Hello"})
 .format({to: "World"})
 .format([1,2,3])
 .format({hello: "你好", world: "世界"})
 console.log(say)

 // 没有首先处理字符串
 var say = "出问题：{{.}}, {{hi}}, {{to}}! {{hello}}, {{world}}!"
 say = say.format({hi: "Hello"})
 .format("3 2 1")
 .format({to: "World"})
 .format({hello: "你好", world: "世界"})
 console.log(say)
 ------------------------------ */
String.prototype.format = function (arg) {
    // 安全检查(长度不能小于 {{.}}，为后面下标引用做准备)
    var len = this.length;
    if (len < 5) { return this }

    var start = 0, result = "", argi = 0;

    for (var i = 0; i <= len; i++) {
        // 处理 {{ }} 之外的内容
        if (this[i] === "{" && this[i - 1] === "{") {
            result += this.slice(start, i - 1);
            start = i - 1;
        } else if (this[i] === "}" && this[i - 1] === "}") {
            // 获取 {{ }} 中的索引
            var index = this.slice(start + 2, i - 1);
            if (index === ".") {          // 字符串
                result += arguments[argi];
                // 最后一个字符串会重复使用
                if (argi < (arguments.length - 1)) {
                    argi++;
                }
                start = i + 1;
            } else {                      // 对象或数组
                if (arg[index] != null) {
                    result += arg[index];
                    start = i + 1;
                }
            }
        }
    }
    // 处理最后一个 {{ }} 之后的内容
    result += this.slice(start);
    return result;
};


