/**
 * Created with JetBrains WebStorm.
 * User: Administrator
 * Date: 12-9-28
 * Time: 下午4:55
 * To change this template use File | Settings | File Templates.
 */

//中心服务器
exports.CENTER_SERVER_HOST = "42.121.109.221";
exports.CENTER_SERVER_PORT = 80;

//短信网关地址
exports.SMS_SERVER_HOST = "v.juhe.cn";
exports.SMS_SERVER_PORT = 80;
exports.SMS_CDKEY = "f6a24dd3398d20d6d8675fda38015509";
exports.SMS_PASSWORD = "512967";

//WiStrom API地址
// exports.API_URL = "http://localhost:8089"; //develop
exports.API_URL = "http://wop-api.chease.cn"; //test
// exports.API_URL = "http://o.bibibaba.cn/2.0"; //deploy
// exports.API_URL = 'http://' + process.env.API_URL + ':8089';

//微信公众号
exports.WEIXIN_APP_SECRET = ["e89542d7376fc479aac35706305fc23f", "5b46bd690a3a740011a0065d43badb24"];

//API返回状态定义
exports.API_STATUS_OK = 0;
exports.API_STATUS_INVALID_USER = 0x0001;       //无效用户
exports.API_STATUS_WRONG_PASSWORD = 0x0002;     //密码错误
exports.API_STATUS_NORIGHT = 0x0003;            //没有权限
exports.API_STATUS_UPLOAD_FAIL = 0x0004;        //上传失败
exports.API_STATUS_WRONG_MAC = 0x0005;          //非法手机登陆
exports.API_STATUS_INVALID_SERIAL = 0x0006;     //非法终端序列号
exports.API_STATUS_EXISTS_VEHICLE = 0x0007;     //本用户存在目标，无法删除
exports.API_STATUS_EXISTS_USER = 0x0008;        //用户已存在
exports.API_STATUS_MOBILE_RECOMMNED = 0x0009;   //手机号已被推荐
exports.API_STATUS_MOBILE_ORDERED = 0x0010;     //手机号已预订业务
exports.API_STATUS_MOBILE_INSTALLED = 0x0011;   //手机号已办理业务
exports.API_STATUS_DATABASE_ERROR = 0x000f;     //数据库操作失败
exports.API_STATUS_CONNECT_FAIL = 0x1001;       //连接服务器失败
exports.API_STATUS_PAY_FAIL = 0x2001;           //支付失败
exports.API_STATUS_EXCEPTION = 0x9002;          //发生异常错误
exports.API_STATUS_INVALID_NODE = 0x9003;       //查询不到有效节点
exports.API_STATUS_INVALID_SIGN = 0x9004;       //无效签名
exports.API_STATUS_INVALID_METHOD = 0x9005;     //无效方法
exports.API_STATUS_INVALID_APPKEY = 0x9006;     //无效的Appkey
exports.API_STATUS_INVALID_VERSION = 0x9007;    //无效的版本
exports.API_STATUS_INVALID_VALIDCODE = 0x9008;  //无效的验证码
exports.API_STATUS_INVALID_PARAM = 0x9009;      //无效的参数
exports.API_STATUS_COMMAND_TIMEOUT = 0x900A;    //指令发送超时
exports.API_STATUS_NO_SELLER_RIGHT = 0x900B;    //没有商户权限
exports.API_STATUS_INVALID_WEIXIN_APPSECRET = 0x900C;  //无效的微信AppSecret
exports.API_STATUS_ALREADY_CHECKIN = 0x900D;    //已签到或者已分享
exports.API_STATUS_INVALID_TIMESTAMP = 0x900E;  //无效的时间戳
exports.API_STATUS_INVALID_TABLE = 0x900E;      //无效表格

//数据访问状态
exports.DB_STATUS_OK = 0;           //操作成功
exports.DB_STATUS_FAIL = 0x0001;    //操作失败
exports.DB_STATUS_EXISTS = 0x0002;  //记录已存在
exports.DB_INVALID_TABLE = 0x0003;  //非法表

//空定义
exports.EMPTY_JSON = {};
exports.EMPTY_ARRAY = [];

//事件定义
//终端自动注册：
//终端副号注册：
//终端获取位置：
//终端事件切换：
//终端报警上传：
//超速报警上传：
//停留记录上传：
//禁行记录上传：
//终端上线离线上传：
//终端图像上传：
//终端设置回复：
//终端参数上传：
//终端转发运营商短信：
//终端发送短信请求（平台模式下）：
//终端发送密码请求：
exports.EVENT_REGISTER = 0x1001;
exports.EVENT_REGISTER2 = 0x1002;
exports.EVENT_GETLOCATION = 0x1003;
exports.EVENT_DEVICEEVENT = 0x1004;
exports.EVENT_ALERT = 0x1005;
exports.EVENT_OVERSPEED = 0x1006;
exports.EVENT_STOP = 0x1007;
exports.EVENT_RESTRICT = 0x1008;
exports.EVENT_GPRS = 0x1009;
exports.EVENT_IMAGE = 0x100A;
exports.EVENT_RESPONSE = 0x100B;
exports.EVENT_PARAM = 0x100C;
exports.EVENT_TELCOSMS = 0x100D;
exports.EVENT_SMSREQUEST = 0x100E;
exports.EVENT_GETPASS = 0x100F;
exports.EVENT_GPSDATA = 0x1010;
exports.EVENT_ONLINE = 0x1011;
exports.EVENT_LINK = 0x1012;
exports.EVENT_DATA = 0x1013;  //透传数据
exports.EVENT_OBD = 0x1016;    //OBD数据

//终端状态定义
//设防：
//锁车：
//基站定位：
//ACC状态：
//省电状态：
//自定义状态1：
//自定义状态2：
//自定义状态3：
exports.STATUS_FORTIFY = 0x2001;
exports.STATUS_LOCK = 0x2002;
exports.STATUS_NETLOC = 0x2003;
exports.STATUS_ACC = 0x2004;
exports.STATUS_SLEEP = 0x2005;
exports.STATUS_ALARM = 0x2006;
exports.STATUS_RELAY = 0x2007;
exports.STATUS_INPUT1 = 0x2008;
exports.STATUS_INPUT2 = 0x2009;
exports.STATUS_INPUT3 = 0x200A;
exports.STATUS_SMS = 0x200B;

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
exports.ALERT_SOS = 0x3001;
exports.ALERT_OVERSPEED = 0x3002;
exports.ALERT_VIRBRATE = 0x3003;
exports.ALERT_MOVE = 0x3004;
exports.ALERT_ALARM = 0x3005;
exports.ALERT_INVALIDRUN = 0x3006;
exports.ALERT_ENTERGEO = 0x3007;
exports.ALERT_EXITGEO = 0x3008;
exports.ALERT_CUTPOWER = 0x3009;
exports.ALERT_LOWPOWER = 0x300A;
exports.ALERT_GPSCUT = 0x300B;
exports.ALERT_OVERDRIVE = 0x300C;
exports.ALERT_INVALIDACC = 0x300D;
exports.ALERT_INVALIDDOOR = 0x300E;
exports.ALERT_ACCESSORY = 0x300F; //附件断开报警
exports.ALERT_ENTERROUTE = 0x3010; //禁入线路报警
exports.ALERT_EXITROUTE = 0x3011; //禁出线路报警
exports.ALERT_INOUTPOINT = 0x3012; //巡更点进出报警

//下发指令定义
exports.COMMAND_VERSION = 0x4001;
exports.COMMAND_GPSINTERVAL = 0x4002;
exports.COMMAND_TRACKINTERVAL = 0x4003;
exports.COMMAND_OVERSPEED = 0x4004;
exports.COMMAND_NETLOC = 0x4005;
exports.COMMAND_SLEEP = 0x4006;
exports.COMMAND_VIBRATEALERT = 0x4007;
exports.COMMAND_RESTARTTIME = 0x4008;
exports.COMMAND_ARMING = 0x4009;
exports.COMMAND_DISARMING = 0x400A;
exports.COMMAND_LOCK = 0x400B;
exports.COMMAND_UNLOCK = 0x400C;
exports.COMMAND_REMOVEALERT = 0x400D;
exports.COMMAND_LISTEN = 0x400E;
exports.COMMAND_RESTART = 0x400F;
exports.COMMAND_RESET = 0x4010;
exports.COMMAND_IP = 0x4011;
exports.COMMAND_GEO = 0x4012;
exports.COMMAND_ROUTE = 0x4013;
exports.COMMAND_MILEAGE = 0x4014;
exports.COMMAND_RESTRICT = 0x4015;
exports.COMMAND_STARTENGINE = 0x4016;   //远程启动
exports.COMMAND_DATA = 0x4017;           //透传数据
exports.COMMAND_SLIENT = 0x4018;        //静音模式
exports.COMMAND_SOUND = 0x4019;         //声光模式
exports.COMMAND_LOCKDOOR = 0x4020;     //锁车
exports.COMMAND_UNLOCKDOOR = 0x4021;  //解锁
exports.COMMAND_AUTOLOCKON = 0x4022;   //行车自动落锁开
exports.COMMAND_AUTOLOCKOFF = 0x4023;  //行车自动落锁关
exports.COMMAND_FINDVEHICLE = 0x4024;  //寻车
exports.COMMAND_STOPENGINE = 0x4025;  //远程熄火
exports.COMMAND_AUTOLOCK = 0x4026;    //模拟行车自动落锁
exports.COMMAND_GPSALERT = 0x4027;    //模拟GPS报警
exports.COMMAND_P20RESTART = 0x4028;  //模拟P20重启
exports.COMMAND_P20STATUS = 0x4029;   //获取P20状态
exports.COMMAND_ACCOFF_AUTOLOCKON = 0x4030;  //熄火自动设防开
exports.COMMAND_ACCOFF_AUTOLOCKOFF = 0x4031; //熄火自动设防关
exports.COMMAND_SLAVE = 0x4033;       //设置副号
exports.COMMAND_OPENTRAIL = 0x4034;   //开启尾箱
exports.COMMAND_OPEN_REPAIR = 0x4035;    //打开修车模式
exports.COMMAND_CLOSE_REPAIR = 0x4036;   //关闭修改模式
exports.COMMAND_SMSMODE = 0x4037;         //设置短信模式
exports.COMMAND_GET_ODBDATA = 0x4038;    //清除OBD故障码
exports.COMMAND_GET_ODBERR = 0x4039;    //清除OBD故障码
exports.COMMAND_CLEAR_ODBERR = 0x4040;    //清除OBD故障码
exports.COMMAND_ODB_INTERVAL = 0x4041;  //清除OBD故障码
exports.COMMAND_UPGRADE = 0x4042;       //发送升级指令
exports.COMMAND_SWITCH = 0x4043;        //开关指令
exports.COMMAND_AIR_MODE = 0x4044;      //设置净化模式指令
exports.COMMAND_AIR_SPEED = 0x4045;     //设置净化速度指令
exports.COMMAND_TRANSFER = 0x404D;         //数据透传

// 发送状态
exports.SENDFLAG_READY = 0x0001;
exports.SENDFLAG_SENDING = 0x0002;
exports.SENDFLAG_SENDED = 0x0003;

//附件类型
//A：油耗传感器 B：ODB附件 C：远程启动附件 D：防拆盒
exports.ACCESSORY_FUEL = 0x5001;
exports.ACCESSORY_ODB = 0x5003;
exports.ACCESSORY_ENGINE = 0x5006;
exports.ACCESSORY_LOCKBOX = 05008;

//号码类型
exports.NUMBERTYPE_MASTER = 1;
exports.NUMBERTYPE_SLAVE = 2;

//查询是否存在
exports.EXIST_SIM = 1;
exports.EXIST_DEVICE_ID = 2;
exports.EXIST_SERIAL = 3;
exports.EXIST_OBJ_NAME = 4;
exports.EXIST_CUST_NAME = 5;
exports.EXIST_USER_NAME = 6;
exports.EXIST_DEALER_NAME = 7;
exports.EXIST_DEALER_USER_NAME = 8;

//订单状态
exports.ORDER_STATUS_WAIT = 0x0000;             //待处理
exports.ORDER_STATUS_CONFIRM = 0x5000;          //销售已确认
exports.ORDER_STATUS_NO_STOCK = 0x5001;         //无法到货
exports.ORDER_STATUS_RESERVED = 0x5002;         //商品预订
exports.ORDER_STATUS_STOCKING = 0x5003;         //商品在途
exports.ORDER_STATUS_LOCK = 0x5004;             //锁定
exports.ORDER_STATUS_CANCEL = 0x5005;           //取消
exports.ORDER_STATUS_WAIT_PAY = 0x5006;         //等待付款
exports.ORDER_STATUS_PAY_CONFIRM = 0x5007;      //等待付款确认
exports.ORDER_STATUS_PAYED = 0x5008;            //付款成功
exports.ORDER_STATUS_PAY_DELAY = 0x5009;        //延迟付款
exports.ORDER_STATUS_PRINTED = 0x500A;          //订单已打印, 正在出库
exports.ORDER_STATUS_STOCK_OUT = 0x500B;        //商品出库
exports.ORDER_STATUS_SENDING = 0x500C;          //正在配送
exports.ORDER_STATUS_WAIT_RECEIVE = 0x500D;     //等待收货
exports.ORDER_STATUS_WAIT_TAKE = 0x500E;        //上门自提
exports.ORDER_STATUS_DONE = 0x500F;             //订单完成
exports.ORDER_STATUS_RETURN = 0x5010;           //商品退库
exports.ORDER_STATUS_REFUND = 0x5011;           //正在退款

//推荐来源
exports.SOURCE_SALE = 1;
exports.SOURCE_NORMALUSER = 2;

//获取验证码短信内容类型
exports.SMSTYPE_BIND_MOBILE = 1;
exports.SMSTYPE_FORGOT_PASSWORD = 2;

//好友权限
exports.RIGHT_LOCATION = 0x6001;    //访问目标实时位置（个人好友及服务商）
exports.RIGHT_TRIP = 0x6002;        //访问目标行程（个人好友及服务商）
exports.RIGHT_OBD_DATA = 0x6003;    //访问OBD标准数据（服务商）
exports.RIGHT_ODB_ERR = 0x6004;     //访问OBD故障码数据（服务商）
exports.RIGHT_EVENT = 0x6005;       //访问车务提醒（服务商）
exports.RIGHT_VIOLATION = 0x6006;   //访问目标违章（服务商）
exports.RIGHT_FUEL = 0x6007;        //访问目标油耗明细（服务商）
exports.RIGHT_DRIVESTAT = 0x6008;   //访问目标驾驶习惯数据（服务商）
exports.RIGHT_QUERY_INFO = 0x6009;  //查询目标信息（服务商）
exports.RIGHT_UPDATE_INFO = 0x6010; //更新目标信息（服务商）

// 账单来源
//0: WiCARE 1: 微信支付 2: 账户余额
exports.BILL_SRC_WICARE = 0;
exports.BILL_SRC_WEIXINPAY = 1;
exports.BILL_SRC_BALANCE = 2;

// 账单类别
//0:收益  1:消费  2:充值  3: 提现  4: 抽奖消费
exports.BILL_TYPE_PROFIT = 0;
exports.BILL_TYPE_PAY = 1;
exports.BILL_TYPE_RECHARGE = 2;
exports.BILL_TYPE_WITHDRAW = 3;
exports.BILL_TYPE_LOTTERY = 4;

// 账单币种
//0: 现金 1:微豆 2: 优惠券
exports.BILL_MTYPE_CASH = 0;
exports.BILL_MTYPE_WIDOU = 1;
exports.BILL_MTYPE_VOUCHER = 2;

// 各种奖励
exports.AWARD_CHECKIN = 10; //签到奖励, 随机产生奖励, 最高50
exports.AWARD_SHARE = 100;  //签到奖励, 随机产生奖励, 最高200

// 基础日志分类
//0:登进 1:登出 2:进入功能 3:退出功能 3:新增操作 4:修改操作 5:删除操作 6:交易 7:分享 8:签到
exports.OP_LOG_LOGIN = 0xA000;
exports.OP_LOG_LOGOUT = 0xA001;
exports.OP_LOG_ENTER = 0xA002;
exports.OP_LOG_EXIT = 0xA003;
exports.OP_LOG_CREATE = 0xA004;
exports.OP_LOG_UPDATE = 0xA005;
exports.OP_LOG_DEL = 0xA006;
exports.OP_LOG_TRANACTION = 0xA007;
exports.OP_LOG_SHARE = 0xA008;
exports.OP_LOG_CHECKIN = 0xA009;

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
exports.IOT_CMD = IOT_CMD;
