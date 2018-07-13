/**
 * Created with JetBrains WebStorm.
 * User: 1
 * Date: 13-8-26
 * Time: 下午11:33
 * To change this template use File | Settings | File Templates.
 */

var branch_flag = 1;   //1: 新增  2: 修改
var validator_branch;
var table_branch;
var branch_id = "";
var branch;
var lon = 0;
var lat = 0;
var drawingManager;
var auth_code = $.cookie('auth_code');

// 网点详细信息
function branchInfo(_id){
    // var wistorm_api = new WiStormAPI(app_key, app_secret, 'json', '2.0', 'md5', dev_key);
    var query_json = {
        _id: _id
    };
    wistorm_api._get('branch', query_json, '_id,name,contact,tel,mobile,address,city,createdAt', auth_code, true, branchInfoSuccess);
}

var branchInfoSuccess = function(json) {
    //alert(json);
    validator_branch.resetForm();
    if (json.data.createdAt) {
        json.data.createdAt = NewDate(json.data.createdAt);
        json.data.createdAt = json.data.createdAt.format("yyyy-MM-dd hh:mm:ss");
        lon = json.data.lon == undefined ? 0 : json.data.lon;
        lat = json.data.lat == undefined ? 0 : json.data.lat;
    }
    initFrmBranch("编辑网点", 2, json.data.name, json.data.contact, json.data.tel, json.data.mobile, json.data.address, json.data.city, json.data.createdAt);
    $("#divBranch").dialog("open");
};

// 初始化目标信息窗体
var initFrmBranch = function (title, flag, name, contact, tel, mobile, address, city, createdAt) {
    $("#divBranch").dialog("option", "title", title);
    branch_flag = flag;
    $('#name').val(name);
    $('#contact').val(contact);
    $('#tel').val(tel);
    $('#mobile').val(mobile);
    $('#address').val(address);
    $('#city').val(city);
    if (branch_flag == 1) {
        $('#pnlDate').hide();
    } else {
        $('#createdAt').val(createdAt);
        $('#createdAt').attr("disabled", "disabled");
        $('#pnlDate').show();
    }
};

// 数据查询
//http://admin.wisegps.cn/open/customer/active_gps_data?access_token=bba2204bcd4c1f87a19ef792f1f68404&username=gzzlyl&time=0&map_type=BAID
var names = [];

var dataQuerySuccess = function (json) {
    if(current_marker){
        wimap.map.removeOverlay(current_marker);
    }

    for (var i = 0; i < json.data.length; i++) {
        names.push(json.data[i].title);
    }

    var _columns = [
        {"mData": "_id", "sClass": "none"},
        {"mData": "name", "sClass": "ms_left"},
        {
            "mData": null, "sClass": "center", "bSortable": false, "fnRender": function (obj) {
            return "<a href='#' title='编辑'><i class='icon-edit' _id='" + obj.aData._id + "'></i></a>&nbsp&nbsp<a href='#' title='删除'><i class='icon-remove' _id='" + obj.aData._id + "'></i></a>";
        }
        }
    ];
    var objTable = {
        "bInfo": false,
        "bLengthChange": false,
        "bProcessing": true,
        "bServerSide": false,
        "bFilter": false,
        "bSort": false,
        "aaData": json.data,
        "aoColumns": _columns,
        //"sDom":"<'row'r>t<'row'<'pull-right'p>>",
        "sPaginationType": "bootstrap",
        "oLanguage": {"sUrl": 'css/lang.txt'}
    };

    $('#branchKey').typeahead({
        source: function (query, process) {
            process(names);
        }
    });

    if (table_branch) {
        table_branch.fnClearTable();
        table_branch.fnAddData(json.data);
    } else {
        table_branch = $("#branch_list").dataTable(objTable);
        windowResize();
    }

    wimap.addBranches(json.data);
    if(json.data && json.data.length > 0){
        wimap.setCenter(json.data[0].lon, json.data[0].lat);
    }
};

var branchQuery = function() {
    var dealerId = $.cookie('dealer_id');
    // var wistorm_api = new WiStormAPI(app_key, app_secret, 'json', '2.0', 'md5', dev_key);
    var key = '';
    if($("#branchKey").val() != '搜索网点'){
        key = $("#branchKey").val();
    }
    var query_json;
    if(key != ""){
        query_json = {
            uid: dealerId,
            name: '^' + key
        };
    }else{
        query_json = {
            uid: dealerId
        };
    }
    setLoading("branch_list");
    wistorm_api._list('branch', query_json, '_id,name,lon,lat,createdAt', '-createdAt', '-createdAt', 0, 0, 1, -1, auth_code, true, dataQuerySuccess)
};

// 新增文章
var branchAdd = function () {
    var dealerId = $.cookie('dealer_id');
    var name = $("#name").val();
    var contact = $("#contact").val();
    var tel = $("#tel").val();
    var mobile = $("#mobile").val();
    var address = $("#address").val();
    var city = $("#city").val();
    var createdAt = new Date();
    // var wistorm_api = new WiStormAPI(app_key, app_secret, 'json', '2.0', 'md5', dev_key);
    var create_json = {
        uid: dealerId,
        name: name,
        contact: contact,
        tel: tel,
        mobile: mobile,
        address: address,
        lon: lon,
        lat: lat,
        city: city,
        createdAt: createdAt
    };
    wistorm_api._create('branch', create_json, auth_code, true, branchAddSuccess);
};

var branchAddSuccess = function (json) {
    if (json.status_code == 0) {
        $("#divBranch").dialog("close");
        branchQuery();
    } else {
        _alert("新增网点失败，请稍后再试");
    }
};

// 修改目标
var branchEdit = function () {
    var name = $("#name").val();
    var contact = $("#contact").val();
    var tel = $("#tel").val();
    var mobile = $("#mobile").val();
    var address = $("#address").val();
    var city = $("#city").val();
    var updatedAt = new Date();
    // var wistorm_api = new WiStormAPI(app_key, app_secret, 'json', '2.0', 'md5', dev_key);
    var query_json = {
        _id: branch_id
    };
    var update_json = {
        name: name,
        contact: contact,
        tel: tel,
        mobile: mobile,
        address: address,
        lon: lon,
        lat: lat,
        city: city,
        updatedAt: updatedAt
    };
    wistorm_api._update('branch', query_json, update_json, auth_code, true, branchEditSuccess);
};

var branchEditSuccess = function (json) {
    if (json.status_code == 0) {
        $("#divBranch").dialog("close");
        branchQuery();
    } else {
        _alert("修改网点失败，请稍后再试");
    }
};

// 删除网点
var branchDelete = function (_id) {
    // var wistorm_api = new WiStormAPI(app_key, app_secret, 'json', '2.0', 'md5', dev_key);
    var query_json = {
        _id: branch_id
    };
    wistorm_api._delete('branch', query_json, auth_code, true, branchDeleteSuccess);
};

var branchDeleteSuccess = function (json) {
    if (json.status_code == 0) {
        branchQuery();
    } else {
        _alert("删除网点失败，请稍后再试");
    }
};

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

    windowResize();

    var center_point = { lon:113.84714, lat:22.47805 };
    wimap = new wiseMap(MAP_TYPE_BAIDU, document.getElementById('map_canvas'), center_point, 14);

    // 多边形和矩形绘制
    var markercomplete = function (e, overlay) {
        current_marker = overlay;
        lon = overlay.getPosition().lng;
        lat = overlay.getPosition().lat;
        $('#lonAndLat').html(lon.toFixed(6) + ", " + lat.toFixed(6));
        var pt = new BMap.Point(lon, lat);
        var gc = new BMap.Geocoder();
        gc.getLocation(pt, function (rs) {
            if(rs){
                var di = 2000;
                var shortpoint = -1;
                for (i = 0; i < rs.surroundingPois.length; i++) {
                    var baidumap = new BMap.Map("container");
                    var d = baidumap.getDistance(rs.surroundingPois[i].point, pt);
                    if (d < di) {
                        shortpoint = i;
                        di = d;
                    }
                }

                if (shortpoint >= 0) {
                    getAddAddress = rs.address + '，离' + rs.surroundingPois[shortpoint].title + di.toFixed(0) + '米';
                } else {
                    getAddAddress = rs.address;
                }

                $('#city').val(rs.addressComponents.city);
                $('#address').val(getAddAddress);
            }
        }, { "poiRadius": "500", "numPois": "10" });
        drawingManager.close();
    };
    var styleOptions = {
        strokeColor: "red",    //边线颜色。
        fillColor: "red",      //填充颜色。当参数为空时，圆形将没有填充效果。
        strokeWeight: 3,       //边线的宽度，以像素为单位。
        strokeOpacity: 0.8,	   //边线透明度，取值范围0 - 1。
        fillOpacity: 0.6,      //填充的透明度，取值范围0 - 1。
        strokeStyle: 'solid' //边线的样式，solid或dashed。
    };
    //实例化鼠标绘制工具
    drawingManager = new BMapLib.DrawingManager(wimap.map, {
        isOpen: false, //是否开启绘制模式
        enableDrawingTool: false, //是否显示工具栏
        enableCalculate: false,
        drawingToolOptions: {
            anchor: BMAP_ANCHOR_TOP_RIGHT, //位置
            offset: new BMap.Size(5, 5) //偏离值
        },
        circleOptions: styleOptions, //圆的样式
        polylineOptions: styleOptions, //线的样式
        polygonOptions: styleOptions, //多边形的样式
        rectangleOptions: styleOptions //矩形的样式
    });
    //添加鼠标绘制工具监听事件，用于获取绘制结果
    drawingManager.addEventListener('markercomplete', markercomplete);

    //浏览器高度变化菜单栏对应改变
    var map_canvas = $("#map_canvas");
    var canvasHeight;
    canvasHeight = $(window).height() - 80;
    //刷新设置css
    map_canvas.css({"height": canvasHeight + "px"});
    //高度变化改变(要重新计算_browserheight)
    $(window).resize(function () {
        canvasHeight = $(window).height() - 80;
        map_canvas.css({"height": canvasHeight + "px"});
    });

    // 加载网点
    branchQuery();

    $("#addBranch").click(function () {
        initFrmBranch("新增网点", 1, "", "", "", "", "", "", "");
        validator_branch.resetForm();
        $("#divBranch").dialog("open");
    });

    $('#divBranch').dialog({
        position: { my: "right-20 bottom-50", at: "right bottom", of: $('#map_canvas') },
        autoOpen: false,
        width: 420,
        buttons: {
            "保存": function () {
                $('#frmBranch').submit();
            },
            "取消": function () {
                validator_branch.resetForm();
                $(this).dialog("close");
            }
        }
    });

    $('#frmBranch').submit(function () {
        if ($('#frmBranch').valid()) {
            if (branch_flag == 1) {
                branchAdd();
            } else {
                branchEdit();
            }
        }
        return false;
    });

    $('#address').blur(function(){
        // var options = {
        //     onSearchComplete: function(results){
        //         // 判断状态是否正确
        //         if (local.getStatus() == BMAP_STATUS_SUCCESS){
        //             // var s = [];
        //             // for (var i = 0; i < results.getCurrentNumPois(); i ++){
        //             //     s.push(results.getPoi(i).title + ", " + results.getPoi(i).address);
        //             // }
        //             // alert(s);
        //             if(results.getCurrentNumPois() > 0){
        //                 lon = results.getPoi(0).point.lng;
        //                 lat = results.getPoi(0).point.lat;
        //                 $('#city').val(results.getPoi(0).city);
        //                 $('#lonAndLat').html(lon.toFixed(6) + ", " + lat.toFixed(6));
        //                 wimap.addMarker(lon, lat, '');
        //                 wimap.setCenter(lon, lat);
        //             }
        //         }
        //     }
        // };
        // var local = new BMap.LocalSearch(wimap.map, options);
        // local.search();

        // 创建地址解析器实例
        var myGeo = new BMap.Geocoder();
        // 将地址解析结果显示在地图上,并调整地图视野
        myGeo.getPoint($('#address').val(), function(point){
            if (point) {
                lon = point.lng;
                lat = point.lat;
                $('#lonAndLat').html(lon.toFixed(6) + ", " + lat.toFixed(6));
                wimap.addMarker(lon, lat, '');
                wimap.setCenter(lon, lat);
                myGeo.getLocation(point, function(rs){
                    $('#city').val(rs.addressComponents.city);
                });
            }else{
                alert("您选择地址没有找到具体位置!");
            }
        }, "");
    });

    validator_branch = $('#frmBranch').validate(
        {
            rules: {
                name: {
                    required: true
                }
            },
            messages: {
                name: {required: "请输入网点名称"}
            },
            highlight: function (element) {
                $(element).closest('.control-group').removeClass('success').addClass('error');
            },
            success: function (element) {
                element
                    .text('OK!').addClass('valid')
                    .closest('.control-group').removeClass('error').addClass('success');
                //alert('success');
            }
        });

    $(document).on("click", "#branch_list .icon-remove", function () {
        branch_id = $(this).attr("_id");
        if (CloseConfirm('你确认删除选择网点吗？')) {
            branchDelete(branch_id);
        }
    });

    $(document).on("click", "#branch_list .icon-edit", function () {
        branch_id = $(this).attr("_id");
        branchInfo(branch_id);
    });

    $(document).on("click", "#branch_list tr", function () {
        var _id = $(this)[0].childNodes[0].innerText;
        branch_id = _id;
        branch = wimap.findBranch(_id);
    });

    $('#branchKey').keydown(function(e){
        var curKey = e.which;
        if(curKey == 13){
            branchQuery();
            return false;
        }
    });

    $("#setLocation").click(function () {
        if(current_marker){
            wimap.map.removeOverlay(current_marker);
        }
        drawingManager.open();
        drawingManager.setDrawingMode(BMAP_DRAWING_MARKER);
    });
});


