/**
 * Created with JetBrains WebStorm.
 * User: 1
 * Date: 13-8-26
 * Time: 下午11:33
 * To change this template use File | Settings | File Templates.
 */

// 跳转到日志页面
function logInfo(device_id){
    var logUrl = "/datalog?device_id=" + device_id;
    window.location.href = logUrl;
}

// 数据查询
//http://admin.wisegps.cn/open/customer/active_gps_data?access_token=bba2204bcd4c1f87a19ef792f1f68404&username=gzzlyl&time=0&map_type=BAIDU
function vehicleQuery(cust_id, tree_path) {
    var auth_code = $.cookie('auth_code');
    var mode = "all";
    var page_no = 1;
    var page_count = 100;
    var key = '';
    if($("#vehicleKey").val() != '搜索目标'){
        key = $("#vehicleKey").val();
    }

    var searchUrl = $.cookie('Host') + "customer/active_gps_data";
    var searchData = { access_token:auth_code, username:user_name, map_type: "BAIDU" };
    var searchObj = { type:"GET", url:searchUrl, data:searchData, success:function (json) {
        dataQuerySuccess(json);
    }, error:OnError };
    ajax_function(searchObj);
}

var names = [];

function getUniStatusDesc(uni_status) {
    var desc = "";
    for (var i = 0; i < uni_status.length; i++) {
        switch (uni_status[i]) {
            case STATUS_ACC: desc += "启动"; break;
        }
    }
    return desc;
}

function getUniAlertsDesc(uni_alerts) {
    var desc = "";
    for (var i = 0; i < uni_alerts.length; i++) {
        switch (uni_alerts[i]) {
            case ALERT_CUTPOWER: desc += "断电"; break;
        }
    }
    return desc;
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

var dataQuerySuccess = function(json) {
    var j, _j, UnContacter, Uncontacter_tel;
    names = [];
    for (var i = 0; i < json.length; i++) {
        if(json[i].active_gps_data.rcv_time != undefined){
            json[i].active_gps_data.rcv_time = NewDate(json[i].active_gps_data.rcv_time);
            var now = new Date();
            var m = dateDiff(now, json[i].active_gps_data.rcv_time, "mm");
            if (m > 60) {
                json[i].online = "<span class='filter'>离线</span>";
            } else {
                json[i].online = "<span class='filter'>在线</span>";
            }
            json[i].active_gps_data.rcv_time = json[i].active_gps_data.rcv_time.format("MM-dd hh:mm:ss");
            json[i].active_gps_data.gps_time = NewDate(json[i].active_gps_data.gps_time);
            json[i].active_gps_data.gps_time = json[i].active_gps_data.gps_time.format("MM-dd hh:mm:ss");
            json[i].uni_status = getUniStatusDesc(json[i].active_gps_data.uni_status);
            if(json[i].uni_status == ""){
                json[i].uni_status = "<span class='filter'>熄火</span>";
            }else{
                json[i].uni_status = "<span class='filter'>" + json[i].uni_status + "</span>";
            }
            json[i].uni_alert = "<span class='filter'>" + getUniAlertsDesc(json[i].active_gps_data.uni_alerts) + "</span>";
            json[i].service_end_date = "未到期";
        }

        names.push(json[i].obj_name);
    }

    var _columns = [
        { "mData":"obj_name", "sClass":"ms_left" },
        { "mData":"device_id", "sClass":"center" },
        { "mData":"sim", "sClass":"center" },
        { "mData":"active_gps_data.rcv_time", "sClass":"center"},
        { "mData":"active_gps_data.gps_time", "sClass":"center"},
        { "mData":"service_end_date", "sClass":"center"},
        { "mData":"online", "sClass":"center"},
        { "mData":"uni_status", "sClass":"center"},
        { "mData":"uni_alert", "sClass":"center"},
        //{ "mData":null, "sClass":"center", "fnRender": function(obj){
        //    var desc = getUniStatusDesc(obj.aData.active_gps_data.uni_status);
        //    if(desc == ""){
        //        desc = "熄火";
        //    }
        //    return desc;
        //}},
        //{ "mData":null, "sClass":"center", "fnRender": function(obj){
        //    var desc = getUniAlertsDesc(obj.aData.active_gps_data.uni_alerts);
        //    return desc;
        //}},
        {
            "mData": null, "sClass": "center", "bSortable": false, "fnRender": function (obj) {
            return "<a href='#' title='日志'><i class='icon-list-alt' device_id='" + obj.aData.device_id + "' obj_name='" + obj.aData.obj_name + "'></i></a>&nbsp;&nbsp;" +
                "<a href='#' title='续费'><i class='icon-shopping-cart' device_id='" + obj.aData.device_id + "' obj_name='" + obj.aData.obj_name + "'></i></a>";
        }
        }
    ];
    var objTable = {
        "bInfo":true,
        "bLengthChange":true,
        "bProcessing":true,
        "bServerSide":false,
        "bFilter":true,
        "bSort": false,
        "aaData":json,
        "aoColumns":_columns,
        //"sDom":"<'row'r>t<'row'<'pull-right'p>>",
        "sPaginationType":"bootstrap",
        "oLanguage":{"sUrl":'css/lang.txt'}
    };

    $('#vehicleKey').typeahead({
        source: function (query, process) {
            process(names);
        }
    });

    if (vehicle_table) {
        vehicle_table.fnClearTable();
        vehicle_table.fnAddData(json);
    } else {
        vehicle_table = $("#vehicle_list").dataTable(objTable);
        windowResize();
    }

    $(document).on("click", "#vehicle_list .filter", function () {
        //alert($(this)[0].innerText);
        $("#vehicle_list_filter input").val($(this)[0].innerText).trigger("keyup");
        //$("#vehicle_list_filter input").trigger("blur", $(this)[0].innerText);
    });
};

var setVehicleTable = function (is_simple) {
    if(vehicle_table){
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


