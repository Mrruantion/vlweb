/**
 * Created with JetBrains WebStorm.
 * User: 1
 * Date: 13-8-26
 * Time: 下午11:28
 * To change this template use File | Settings | File Templates.
 */
var customer_selected = null;
var customer_flag = 1;  //1: 新增  2: 修改
var vehicle_flag = 1;   //1: 新增  2: 修改
var edit_cust_name = '';
var edit_obj_name = '';
var edit_sim = '';
var edit_serial = '';
var vehicle_table;
var cust_id = 0;
var cust_name = "";
var obj_id = 0;
var tree_path = '';
var level = 0;
var validator_customer;
var validator_vehicle;

function windowResize() {
//高度变化改变(要重新计算_browserheight)
    windowHeight = $(window).height() - 215;
    // 如果宽度小于390，则设置表格为简易显示模式，并且客户列表高度改为300px
    windowWidth = $(window).width();
}

$(document).ready(function () {
    $("#alert").hide();

    // Initialize placeholder
    $.Placeholder.init();

    $('#startTime').datetimepicker({
        format: 'yyyy-mm-dd hh:ii'
    });
    var now = new Date();
    var start_time = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    $('#startTime').val(start_time.format("yyyy-MM-dd hh:mm"));

    $('#endTime').datetimepicker({
        format: 'yyyy-mm-dd hh:ii'
    });
    var end_time = new Date(now.getFullYear(), now.getMonth(), 30, 23, 59, 59, 0);
    $('#endTime').val(end_time.format("yyyy-MM-dd hh:mm"));

    windowResize();

    $("#searchLog").click(function () {
        //dataLogQuery();
        createDataLogTable();
    });

    if ($("#device_id").val() != '') {
        createDataLogTable();
    }
});

// 退出事件
var exit_success = function exit_success(json) {
    $.cookie("mapType", "");
    $.cookie("msgcount", "");
    $.cookie('Login', null);
    location.href = "/";
};

// 目标查询
function getDataLogQuery() {
    var auth_code = $.cookie('auth_code');
    var page_no = 1;
    var page_count = 20;
    var device_id = "";
    if ($("#device_id").val() != '') {
        device_id = $("#device_id").val();
    } else {
        alert("请输入设备编号");
        return;
    }
    var start_time = $("#startTime").val();
    var end_time = $("#endTime").val();

    var searchUrl = $.cookie('Host') + "data?auth_code=" + auth_code + "&device_id=" + device_id + "&start_time=" + start_time + "&end_time=" + end_time;
    return searchUrl;
}

//var dataLogQuerySuccess = function(json) {
//    var j, _j, UnContacter, Uncontacter_tel;
//    var names = [];
//    for (var i = 0; i < json.length; i++) {
//        json[i].rcv_time = NewDate(json[i].rcv_time);
//        json[i].rcv_time = json[i].rcv_time.format("yyyy-MM-dd hh:mm:ss");
//    }
//
//    var _columns = [
//        { "mData":"device_id", "sClass":"ms_left" },
//        { "mData":"rcv_time", "sClass":"ms_left"},
//        { "mData":"content", "sClass":"ms_left" }
//    ];
//    var objTable = {
//        "bInfo":false,
//        "bLengthChange":false,
//        "bProcessing":true,
//        "bServerSide":true,
//        "bFilter":false,
//        "aaData":json,
//        "aoColumns":_columns,
//        "sDom":"<'row'r>t<'row'<'pull-right'p>>",
//        "sPaginationType":"bootstrap",
//        "oLanguage":{"sUrl":'css/lang.txt'},
//        "ajax": function (data, callback, settings) {
//            alert("hello");
//        }
//    };
//
//    if (vehicle_table) {
//        vehicle_table.fnClearTable();
//        vehicle_table.fnAddData(json);
//    } else {
//        vehicle_table = $("#datalog_list").dataTable(objTable);
//    }
//};
var oTable = null;
var createDataLogTable = function () {
    var _columns = [
        {"mData": "device_id", "sClass": "ms_left"},
        {
            "mData": null, "sClass": "ms_left", "fnRender": function (obj) {
            var rcv_time = NewDate(obj.aData.rcv_time);
            rcv_time = rcv_time.format("yyyy-MM-dd hh:mm:ss");
            return rcv_time;
        }
        },
        {"mData": "content", "sClass": "ms_left"}
    ];
    var objTable = {
        "bDestroy": true,
        "bInfo": false,
        "iDisplayLength": 10,
        "bLengthChange": false,
        "bProcessing": true,
        "bServerSide": true,
        "bFilter": false,
        //"aaData":json,
        "aoColumns": _columns,
        "sDom": "<'row'r>t<'row'<'pull-right'p>>",
        "sPaginationType": "bootstrap",
        "oLanguage": {"sUrl": 'css/lang.txt'},
        "sAjaxSource": getDataLogQuery()
    };

    oTable = $("#datalog_list").dataTable(objTable);
};