/**
 * Created by 1 on 16/7/13.
 */
var WiStormAPI = require('./wistorm');
var define = require('./define');

//获取设备信息
var dev_key = "59346d400236ab95e95193f35f3df6a4";
var app_key = "3cea92bd76089d5ebea86613c8dbd067";
var app_secret = "000daf0bd5827b47e3fbd861ad4fcbb3";
var test_access_token = "2890222dbcedf92504bb0e13c6d897af9e92c0bee91b0ed198382b531dad692b5d6214103b966e9305ab527620b2ff178616b1528291af0b1ada9bccefcfcfab";

var wistorm_api = new WiStormAPI(app_key, app_secret, 'json', '2.0', 'md5', dev_key);

// wistorm_api.getToken('13316560478', 'e10adc3949ba59abbe56e057f20f883e', 1, function (obj) {
//    console.log(obj);
// });

// var query_json = {
//     serial: '56624831336'
// };
// wistorm_api.getDevice(query_json, "device_id",
//     'f1b3afaf9bbedfcb0ca3f0465a1d2e7e157c1ea55ad8d2dbcaa7083d125d360cb1919fb80a5d1b0b7332fe1237308f8d', function (obj) {
//         console.log(obj);
//     });

//发送文本信息
wistorm_api.createCommand('56621888999', define.IOT_CMD.TEXT_MESSAGE, {flag: 1, message: 'hello world!'}, test_access_token, function(obj){
    console.log(obj);
});