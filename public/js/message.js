/**
 * Created with JetBrains WebStorm.
 * User: 1
 * Date: 13-8-26
 * Time: 下午11:33
 * To change this template use File | Settings | File Templates.
 */

//http://api.wisegps.cn/customer/177/send_chat?auth_code=bba2204bcd4c1f87a19ef792f1f68404
//var data = {
//    cust_name:encodeURIComponent("贵州左邻右里汽车服务有限公司"),   //发送用户名称
//    friend_id: 174,                                             //好友id
//    type: 0,                                                    //私信类型
//    url: "",                                                    //如果type为图片或者视频，url为完整访问路径
//    voice_len: 0,                                               //语音长度
//    lon: 0,
//    lat: 0,
//    address: encodeURIComponent("广东深圳"),
//    content: encodeURIComponent("通知测试4")                    //文本内容
//};
function messageSend(parent_cust_id, parent_cust_name, friend_id, content){
    var auth_code = $.cookie('auth_code');
    var searchUrl = $.cookie('Host') + "customer/" + parent_cust_id + "/send_chat?auth_code=" + auth_code;
    var searchData = { cust_name:parent_cust_name, friend_id:friend_id, type:0, url: "", voice_len:0, lon:0, lat:0, address: "", content:content};
    var searchObj = { type:"POST", url:searchUrl, data:searchData, success:function (json) {
        sendSuccess(json);
    }, error:OnError };
    ajax_function(searchObj);
}

function messageBroadCast(parent_cust_id, parent_cust_name, content){
    var friend_ids = [];
    for (var i = 0; i < customers.length; i++) {
        if(customers[i].parent_cust_id == parent_cust_id){
            friend_ids.push(customers[i].cust_id);
        }
    }
    var auth_code = $.cookie('auth_code');
    var searchUrl = $.cookie('Host') + "customer/" + parent_cust_id + "/broadcast?auth_code=" + auth_code;
    var searchData = { cust_name:parent_cust_name, friend_ids:friend_ids, type:0, url: "", voice_len:0, lon:0, lat:0, address: "", content:content};
    var searchObj = { type:"POST", url:searchUrl, data:searchData, success:function (json) {
        sendSuccess(json);
    }, error:OnError };
    ajax_function(searchObj);
}

var sendSuccess = function(json) {
    //alert(json);
    if(json.status_code == 0){
        alert("发送消息成功");
    }else{
        alert("发送消息失败");
    }
    if(parent_cust_id != 1){
        createMessageTable();
    }
};

// 数据查询
//http://admin.wisegps.cn/open/customer/174/get_chats?auth_code=f3b904271c555534f74746a998eecb0e&friend_id=177
function messageQuery(cust_id, parent_cust_id) {
    var auth_code = $.cookie('auth_code');
    var searchUrl = $.cookie('Host') + "customer/" + cust_id + "/get_chats";
    var searchData = {auth_code: auth_code, friend_id: parent_cust_id, min_id: min_id};
    var searchObj = {
        type: "GET", url: searchUrl, data: searchData, success: function (json) {
            dataQuerySuccess(json);
        }, error: OnError
    };
    ajax_function(searchObj);
}

function dateDiff(sDate1, sDate2, mode) {     //sDate1和sDate2是2004-10-18格式
    var iDays;
    if (mode == "dd") {
        iDays = parseInt(Math.abs(sDate1 - sDate2) / 1000 / 60 / 60 / 24);    //把相差的毫秒数转换为天数
    } else if (mode == "mm") {
        iDays = parseInt(Math.abs(sDate1 - sDate2) / 1000 / 60);    //把相差的毫秒数转换为分钟
    }
    return iDays;
}

// 目标查询
function getMessageQuery() {
    var auth_code = $.cookie('auth_code');
    var searchUrl = $.cookie('Host') + "customer/" + cust_id + "/get_chats?auth_code=" + auth_code + "&friend_id=" + parent_cust_id;
    return searchUrl;
}

//var dataQuerySuccess = function(json) {
//    var j, _j, UnContacter, Uncontacter_tel;
//    for (var i = 0; i < json.length; i++) {
//        if(json[i].send_time != undefined){
//            json[i].send_time = NewDate(json[i].send_time);
//            json[i].send_time = json[i].send_time.format("yyyy-MM-dd hh:mm:ss");
//        }
//    }
//
//    var _columns = [
//        { "mData":null, "sClass":"left", "fnRender":function (obj) {
//            var customer = getLocalCustomerInfo(obj.aData.sender_id);
//            return customer.cust_name;
//        }},
//        { "mData":null, "sClass":"left", "fnRender":function (obj) {
//            var customer = getLocalCustomerInfo(obj.aData.receiver_id);
//            return customer.cust_name;
//        }},
//        { "mData":"content", "sClass":"left" },
//        { "mData":"send_time", "sClass":"center"}
//    ];
//    var objTable = {
//        "bInfo":true,
//        "bLengthChange":true,
//        "bProcessing":true,
//        "bServerSide":false,
//        "bFilter":true,
//        "bSort": false,
//        "aaData":json,
//        "aoColumns":_columns,
//        //"sDom":"<'row'r>t<'row'<'pull-right'p>>",
//        "sPaginationType":"bootstrap",
//        "oLanguage":{"sUrl":'css/lang.txt'}
//    };
//
//    if (vehicle_table) {
//        vehicle_table.fnClearTable();
//        vehicle_table.fnAddData(json);
//    } else {
//        vehicle_table = $("#vehicle_list").dataTable(objTable);
//        windowResize();
//    }
//};

var oTable = null;
var createMessageTable = function () {
    var _columns = [
        {
            "mData": null, "sClass": "ms_left", "fnRender": function (obj) {
            var customer = getLocalCustomerInfo(obj.aData.sender_id);
            return customer.cust_name;
        }
        },
        {
            "mData": null, "sClass": "ms_left", "fnRender": function (obj) {
            var customer = getLocalCustomerInfo(obj.aData.receiver_id);
            return customer.cust_name;
        }
        },
        {"mData": "content", "sClass": "ms_left"},
        {
            "mData": null, "sClass": "ms_left", "fnRender": function (obj) {
            var send_time = NewDate(obj.aData.send_time);
            send_time = send_time.format("yyyy-MM-dd hh:mm:ss");
            return send_time;
        }
        }
    ];
    var objTable = {
        "bDestroy": true,
        "bInfo": true,
        //"iDisplayLength": 10,
        "bLengthChange": true,
        "bProcessing": true,
        "bServerSide": true,
        "bFilter": true,
        //"aaData":json,
        "aoColumns": _columns,
        //"sDom": "<'row'r>t<'row'<'pull-right'p>>",
        "sPaginationType": "bootstrap",
        "oLanguage": {"sUrl": 'css/lang.txt'},
        "sAjaxSource": getMessageQuery()
    };

    oTable = $("#vehicle_list").dataTable(objTable);
};

var setVehicleTable = function (is_simple) {
    if (vehicle_table) {
        if (is_simple) {
            vehicle_table.fnSetColumnVis(1, false);
            vehicle_table.fnSetColumnVis(2, false);
            vehicle_table.fnSetColumnVis(3, false);
            vehicle_table.fnSetColumnVis(4, false);
        } else {
            vehicle_table.fnSetColumnVis(1, true);
            vehicle_table.fnSetColumnVis(2, true);
            vehicle_table.fnSetColumnVis(3, true);
            vehicle_table.fnSetColumnVis(4, true);
        }
    }
};


