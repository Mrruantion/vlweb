/**
 * Created with JetBrains WebStorm.
 * User: 1
 * Date: 13-8-26
 * Time: 下午11:33
 * To change this template use File | Settings | File Templates.
 */

var _flag = 1;   //1: 新增  2: 修改
var _table;
var _id = "";
var _validator;

// 客户详细信息
function _Info(_id){
    var auth_code = $.cookie('auth_code');
    var query_json = {
        _id: _id
    };
    wistorm_api._get('booking', query_json, '_id,city,name,sex,mobile,remark,status,updatedAt,createdAt', auth_code, true, _InfoSuccess);
}

var _InfoSuccess = function(json) {
    //alert(json);
    _validator.resetForm();
    if (json.data.createdAt) {
        json.data.status = json.data.status || 0;
        json.data.remark = json.data.remark || '';
        json.data.updatedAt = json.data.updatedAt || '';
        json.data.updatedAt = json.data.updatedAt == ''? '': NewDate(json.data.updatedAt).format("yyyy-MM-dd hh:mm:ss");
        json.data.createdAt = NewDate(json.data.createdAt);
        json.data.createdAt = json.data.createdAt.format("yyyy-MM-dd hh:mm:ss");
    }
    initFrmBooking("处理预约", 2, json.data.name, json.data.mobile, json.data.city, json.data.status, json.data.remark, json.data.updatedAt, json.data.createdAt);
    $("#divBooking").dialog("open");
};

// 初始化目标信息窗体
var initFrmBooking = function (title, flag, name, mobile, city, status, remark, updatedAt, createdAt) {
    $("#divBooking").dialog("option", "title", title);
    _flag = flag;
    $('#name').val(name);
    $('#mobile').val(mobile);
    $('#city').val(city);
    $('#remark').val(remark);
    $('#status').val(status.toString());
    $('#updatedAt').val(updatedAt);
    $('#createdAt').val(createdAt);
    if(_flag == 1){
        $('#pnlDate').hide();
    }else{
        $('#createdAt').val(createdAt);
        $('#createdAt').attr("disabled","disabled");
        $('#pnlDate').show();
    }
};

var status_desc = ['未处理', '已处理', '已取消'];
var sex_desc = ['', '男', '女'];

// 数据查询
//http://admin.wisegps.cn/open/customer/active_gps_data?access_token=bba2204bcd4c1f87a19ef792f1f68404&username=gzzlyl&time=0&map_type=BAID
var names = [];
var dataQuerySuccess = function (json) {
    for (var i = 0; i < json.data.length; i++) {
        if (json.data[i].createdAt != undefined) {
            json.data[i].createdAt = NewDate(json.data[i].createdAt);
            json.data[i].createdAt = json.data[i].createdAt.format("yyyy-MM-dd hh:mm:ss");
        }
        if (json.data[i].updatedAt != undefined) {
            json.data[i].updatedAt = NewDate(json.data[i].updatedAt);
            json.data[i].updatedAt = json.data[i].updatedAt.format("yyyy-MM-dd hh:mm:ss");
        }
        json.data[i].sex = sex_desc[json.data[i].sex || 0];
        json.data[i].status = status_desc[json.data[i].status || 0];
        json.data[i].remark = json.data[i].remark || '';
        names.push(json.data[i].name);
    }

    var _columns = [
        {"mData": "city", "sClass": "ms_left"},
        {"mData": "name", "sClass": "ms_left"},
        {"mData": "mobile", "sClass": "ms_left"},
        {"mData": "sex", "sClass": "center"},
        {"mData": "status", "sClass": "center"},
        {"mData": "remark", "sClass": "ms_left"},
        {"mData": "updatedAt", "sClass": "center"},
        {"mData": "createdAt", "sClass": "center"},
        {
            "mData": null, "sClass": "center", "bSortable": false, "fnRender": function (obj) {
            return "<a href='#' title='处理'><i class='icon-edit' _id='" + obj.aData._id + "'></i></a>&nbsp&nbsp<a href='#' title='删除'><i class='icon-remove' _id='" + obj.aData._id + "'></i></a>";
        }
        }
    ];
    var objTable = {
        "bInfo": true,
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

    $('#bookingKey').typeahead({
        source: function (query, process) {
            process(names);
        }
    });

    if (_table) {
        _table.fnClearTable();
        _table.fnAddData(json.data);
    } else {
        _table = $("#booking_list").dataTable(objTable);
        windowResize();
    }
};

var _query = function() {
    var dealerId = $.cookie('dealer_id');
    // var wistorm_api = new WiStormAPI(app_key, app_secret, 'json', '2.0', 'md5', dev_key);
    var key = '';
    var auth_code = $.cookie('auth_code');
    if($("#bookingKey").val() != '搜索预约'){
        key = $("#bookingKey").val();
    }
    var query_json;
    if(key != ""){
        query_json = {
            objectId: ">0",
            title: '^' + key
        };
    }else{
        query_json = {
            objectId: ">0"
        };
    }
    wistorm_api._list('booking', query_json, '_id,objectId,city,name,mobile,sex,status,remark,updatedAt,createdAt', 'status,-createdAt', '-createdAt', 0, 0, 1, -1, auth_code, true, dataQuerySuccess)
};

// 新增预约
var _add = function () {
    var dealerId = $.cookie('dealer_id');
    var title = $("#title").val();
    var type = $("#type").val();
    var summary = $("#summary").val();
    var img = $("#img").val();
    var author = $("#author").val();
    var content = editor.getValue();
    var createdAt = new Date();
    var auth_code = $.cookie('auth_code');
    // var wistorm_api = new WiStormAPI(app_key, app_secret, 'json', '2.0', 'md5', dev_key);
    var create_json = {
        uid: dealerId,
        title: title,
        type: type,
        summary: summary,
        img: img,
        author: author,
        content: content,
        createdAt: createdAt
    };
    wistorm_api._create('article', create_json, auth_code, true, addSuccess);
};

var addSuccess = function (json) {
    if (json.status_code == 0) {
        $("#divbooking").dialog("close");
        articleQuery();
    } else {
        _alert("新增预约失败，请稍后再试");
    }
};

// 修改预约
var _edit = function () {
    var remark = $("#remark").val();
    var status = $("#status").val();
    var createdAt = new Date();
    var auth_code = $.cookie('auth_code');
    var query_json = {
        _id: _id
    };
    var update_json = {
        remark: remark,
        status: status,
        updatedAt: createdAt
    };
    wistorm_api._update('booking', query_json, update_json, auth_code, true, editSuccess);
};

var editSuccess = function (json) {
    if (json.status_code == 0) {
        $("#divBooking").dialog("close");
        _query();
    } else {
        _alert("修改预约失败，请稍后再试");
    }
};

// 新增目标
var _delete = function (_id) {
    // var wistorm_api = new WiStormAPI(app_key, app_secret, 'json', '2.0', 'md5', dev_key);
    var query_json = {
        _id: _id
    };
    var auth_code = $.cookie('auth_code');
    wistorm_api._delete('booking', query_json, auth_code, true, deleteSuccess);
};

var deleteSuccess = function (json) {
    if (json.status_code == 0) {
        articleQuery();
    } else {
        _alert("删除预约失败，请稍后再试");
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

    // 加载预约
    _query();

    // $("#addArticle").click(function () {
    //     initFrmArticle("新增文章", 1, 0, "", "", "", "/img/no_photo.png", "");
    //     validator_article.resetForm();
    //     $("#divArticle").dialog("open");
    // });

    $('#divBooking').dialog({
        autoOpen: false,
        width: 480,
        buttons: {
            "保存": function () {
                $('#frmBooking').submit();
            },
            "取消": function () {
                _validator.resetForm();
                $(this).dialog("close");
            }
        }
    });

    $('#frmBooking').submit(function () {
        if ($('#frmBooking').valid()) {
            if (_flag == 1) {
                _add();
            } else {
                _edit();
            }
        }
        return false;
    });

    _validator = $('#frmBooking').validate(
        {
            rules: {

            },
            messages: {

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

    $(document).on("click", "#booking_list .icon-remove", function () {
        _id = $(this).attr("_id");
        if (CloseConfirm('你确认删除选择预约吗？')) {
            _delete(_id);
        }
    });

    $(document).on("click", "#booking_list .icon-edit", function () {
        _id = $(this).attr("_id");
        _Info(_id);
    });

    $('#bookingKey').keydown(function(e){
        var curKey = e.which;
        if(curKey == 13){
            articleQuery();
            return false;
        }
    });
});


