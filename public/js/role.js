/**
 * Created with JetBrains WebStorm.
 * User: 1
 * Date: 13-8-26
 * Time: 下午11:33
 * To change this template use File | Settings | File Templates.
 */

var _flag = 1;   //1: 新增  2: 修改
var _validator;
var _table;
var _id = "";
var auth_code = $.cookie('auth_code');
var allPage = [];
var allFeature = [];

// 获取登陆用户的权限
function getPage() {
    var searchUrl = "/getPage";
    var searchData = {};
    var searchObj = { type:"GET", url:searchUrl, data:searchData, success:function (json) {
        var setting = {
            view: {showIcon: true},
            check: {enable: true, chkStyle: "checkbox"},
            data: {simpleData: {enable: true}},
            callback: {}
        };

        var groups = json.groups;
        var features = json.features;
        var pageArray = [];
        pageArray.push({
            open: true,
            id: -1,
            pId: -2,
            name: i18next.t("role.all_priviledge"),
            icon: '/img/group.png'
        });

        // 创建三个分类的根节点
        for (var i = 0; i < groups.length; i++) {
            pageArray.push({
                open: true,
                id: i,
                pId: -1,
                type: 0,
                name: groups[i]['name'],
                icon: '/img/group.png'
            });
            for(var j = 0; j < groups[i].pages.length; j++){
                pageArray.push({
                    open: true,
                    pId: i,
                    type: 1,
                    id: groups[i].pages[j]['id'],
                    name: groups[i].pages[j]['name'],
                    icon: '/img/right.png'
                });
                allPage.push(groups[i].pages[j]['id']);
            }
        }
        for (var i = 0; i < features.length; i++){
            pageArray.push({
                open: false,
                pId: features[i]['pageId'],
                type: 2,
                id: features[i]['objectId'],
                name: features[i]['name'],
                icon: '/img/right.png'
            });
            allFeature.push(features[i]['objectId']);
        }
        $.fn.zTree.init($("#pageTree"), setting, pageArray);
    }, error:OnError };
    ajax_function(searchObj);
}

// 详细信息
function info(id) {
    var query_json = {
        objectId: id
    };
    wistorm_api._get('role', query_json, 'objectId,name,remark,createdAt', auth_code, false, infoSuccess);
}

var infoSuccess = function (json) {
    //alert(json);
    _validator.resetForm();
    if (json.data.createdAt) {
        json.data.createdAt = NewDate(json.data.createdAt);
        json.data.createdAt = json.data.createdAt.format("yyyy-MM-dd hh:mm:ss");
    }
    initFrm(i18next.t("role.edit_role"), 2, json.data.name, json.data.remark, json.data.createdAt);
    var query_json = {
        ACL: 'role:' + json.data.objectId
    };

    wistorm_api._list('page', query_json, 'objectId', 'name', 'name', 0, 0, 1, -1, auth_code, false, function(json){
        var pageTree = $.fn.zTree.getZTreeObj("pageTree");
        for(var i = 0; i < json.total; i++){
            var node = pageTree.getNodeByParam("id", json.data[i].objectId, null);
            if(!node.children){
                pageTree.checkNode(node, true, true);
            }
        }
        wistorm_api._list('feature', query_json, 'objectId', 'name', 'name', 0, 0, 1, -1, auth_code, false, function(json) {
            for(var i = 0; i < json.total; i++){
                var node = pageTree.getNodeByParam("id", json.data[i].objectId, null);
                pageTree.checkNode(node, true, true);
            }
        });
        $("#divRole").dialog("open");
    });
};

// 初始化目标信息窗体
var initFrm = function (title, flag, name, remark, createdAt) {
    var pageTree = $.fn.zTree.getZTreeObj("pageTree");
    pageTree.checkAllNodes(false);
    $("#divRole").dialog("option", "title", title);
    _flag = flag;
    $('#name').val(name);
    $('#remark').val(remark);
    if (_flag == 1) {
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
var querySuccess = function (json) {
    for (var i = 0; i < json.data.length; i++) {
        if (json.data[i].createdAt != undefined) {
            json.data[i].createdAt = NewDate(json.data[i].createdAt);
            json.data[i].createdAt = json.data[i].createdAt.format("yyyy-MM-dd hh:mm:ss");
        }
        names.push(json.data[i].name);
    }

    var _columns = [
        {"mData": "name", "sClass": "ms_left"},
        {"mData": "remark", "sClass": "ms_left"},
        {"mData": "createdAt", "sClass": "center"},
        {
            "mData": null, "sClass": "center", "bSortable": false, "fnRender": function (obj) {
            return "<a href='#' title='" + i18next.t("table.edit") + "'><i class='icon-edit' _id='" + obj.aData.objectId + "'></i></a>&nbsp&nbsp<a href='#' title='" + i18next.t("table.delete") + "'><i class='icon-remove' _id='" + obj.aData.objectId + "'></i></a>";
        }
        }
    ];

    var lang = i18next.language || 'en';
    var objTable = {
        "bInfo": true,
        "bLengthChange": false,
        "bProcessing": false,
        "bServerSide": false,
        "bFilter": false,
        "bSort": false,
        "aaData": json.data,
        "aoColumns": _columns,
        //"sDom":"<'row'r>t<'row'<'pull-right'p>>",
        "sPaginationType": "bootstrap",
        "oLanguage": {"sUrl": 'css/' + lang + '.txt'}
    };

    $('#roleKey').typeahead({
        source: function (query, process) {
            process(names);
        }
    });

    if (_table) {
        _table.fnClearTable();
        _table.fnAddData(json.data);
    } else {
        _table = $("#role_list").dataTable(objTable);
        windowResize();
    }
};

var _query = function () {
    var dealerId = $.cookie('dealer_id');
    // var wistorm_api = new WiStormAPI(app_key, app_secret, 'json', '2.0', 'md5', dev_key);
    var key = '';
    var auth_code = $.cookie('auth_code');
    if ($("#roleKey").val() !== '') {
        key = $("#roleKey").val();
    }
    var query_json;
    if (key != "") {
        query_json = {
            uid: dealerId,
            name: '^' + key
        };
    } else {
        query_json = {
            uid: dealerId
        };
    }
    setLoading("role_list");
    wistorm_api._list('role', query_json, 'objectId,name,remark,createdAt', '-createdAt', '-createdAt', 0, 0, 1, -1, auth_code, false, querySuccess)
};

// 新增
var _add = function () {
    var dealerId = $.cookie('dealer_id');
    var name = $("#name").val();
    var remark = $("#remark").val();
    var create_json = {
        uid: dealerId,
        name: name,
        remark: remark
    };
    wistorm_api._create('role', create_json, auth_code, false, function(json){
        if(json.status_code == 0){
            // 更新角色权限
            var pageTree = $.fn.zTree.getZTreeObj("pageTree");
            var nodes = pageTree.getCheckedNodes(true);
            var pages = [];
            var features = [];
            for( var i = 0; i < nodes.length; i++){
                if(nodes[i].type === 1){
                    pages.push(nodes[i].id);
                }else if(nodes[i].type === 2){
                    features.push(nodes[i].id);
                }
            }
            if(pages.length > 0){
                var query_json = {
                    objectId: pages.join("|")
                };
                var update_json = {
                    ACL: '%2Brole:' + json.objectId
                };
                wistorm_api._update('page', query_json, update_json, auth_code, false, function(json){
                    if(json.status_code === 0){
                        if(features.length > 0){
                            query_json = {
                                objectId: features.join("|")
                            };
                            wistorm_api._update('feature', query_json, update_json, auth_code, false, addSuccess);
                        }else{
                            $("#divRole").dialog("close");
                            _query();
                        }
                    }else{
                        _alert(i18next.t("role.msg_add_fail"));
                    }
                });
            }else{
                $("#divRole").dialog("close");
                _query();
            }
        }
    });
};

var addSuccess = function (json) {
    if (json.status_code == 0) {
        $("#divRole").dialog("close");
        _query();
    } else {
        _alert(i18next.t("role.msg_add_fail"));
    }
};

// 修改目标
var _edit = function () {
    var name = $("#name").val();
    var remark = $("#remark").val();
    var query_json = {
        objectId: _id
    };
    var update_json = {
        name: name,
        remark: remark
    };
    wistorm_api._update('role', query_json, update_json, auth_code, false, function (json) {
        if(json.status_code == 0){
            // 更新角色权限
            var pageTree = $.fn.zTree.getZTreeObj("pageTree");
            var nodes = pageTree.getCheckedNodes(true);
            var pages = [];
            var features = [];
            for( var i = 0; i < nodes.length; i++){
                if(nodes[i].type === 1){
                    pages.push(nodes[i].id);
                }else if(nodes[i].type === 2){
                    features.push(nodes[i].id);
                }
            }

            var query_json = {
                objectId: allPage.join("|")
            };

            var update_json = {
                ACL: '-role:' + _id
            };
            wistorm_api._update('page', query_json, update_json, auth_code, false, function(obj){
                if(pages.length > 0){
                    query_json = {
                        objectId: pages.join("|")
                    };
                    update_json = {
                        ACL: '%2Brole:' + _id
                    };
                    wistorm_api._update('page', query_json, update_json, auth_code, false, function(json){
                        if(json.status_code === 0){
                            var query_json = {
                                objectId: allFeature.join("|")
                            };

                            var update_json = {
                                ACL: '-role:' + _id
                            };
                            wistorm_api._update('feature', query_json, update_json, auth_code, false, function(obj) {
                                if(features.length > 0){
                                    query_json = {
                                        objectId: features.join("|")
                                    };
                                    update_json = {
                                        ACL: '%2Brole:' + _id
                                    };
                                    wistorm_api._update('feature', query_json, update_json, auth_code, false, editSuccess);
                                }else{
                                    $("#divRole").dialog("close");
                                    _query();
                                }
                            });
                        }else{
                            _alert(i18next.t("role.msg_edit_fail"));
                        }
                    });
                }else{
                    $("#divRole").dialog("close");
                    _query();
                }
            });
        }
    });
};

var editSuccess = function (json) {
    if (json.status_code == 0) {
        $("#divRole").dialog("close");
        _query();
    } else {
        _alert(i18next.t("role.msg_edit_fail"));
    }
};

// 新增目标
var _delete = function (id) {
    var query_json = {
        objectId: id
    };
    wistorm_api._delete('role', query_json, auth_code, false, deleteSuccess);
};

var deleteSuccess = function (json) {
    if (json.status_code == 0) {
        _query();
    } else {
        _alert(i18next.t("role.msg_delete_fail"));
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

    windowResize();

    var roId = setInterval(function () {
        if(!i18nextLoaded){
            return;
        }

        $("#addRole").click(function () {
            initFrm(i18next.t("role.add_role"), 1, "", "");
            _validator.resetForm();
            $("#divRole").dialog("open");
        });

        var buttons = {};
        buttons[i18next.t("system.save")] = function () {
            $('#frmRole').submit();
        };
        buttons[i18next.t("system.cancel")] = function () {
            _validator.resetForm();
            $(this).dialog("close");
        };
        $('#divRole').dialog({
            autoOpen: false,
            width: 480,
            buttons: buttons
        });

        $('#frmRole').submit(function () {
            if ($('#frmRole').valid()) {
                if (_flag == 1) {
                    _add();
                } else {
                    _edit();
                }
            }
            return false;
        });

        _validator = $('#frmRole').validate(
            {
                rules: {
                    name: {
                        required: true
                    }
                },
                messages: {
                    name: {required: i18next.t("role.role_name_required")}
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

        $(document).on("click", "#role_list .icon-remove", function () {
            _id = $(this).attr("_id");
            if (CloseConfirm(i18next.t("role.confirm_delete"))) {
                _delete(_id);
            }
        });

        $(document).on("click", "#role_list .icon-edit", function () {
            _id = $(this).attr("_id");
            info(_id);
        });

        $('#roleKey').keydown(function (e) {
            var curKey = e.which;
            if (curKey == 13) {
                _query();
                return false;
            }
        });

        // 加载数据
        _query();

        // 加载角色
        getPage();

        clearInterval(roId);
    }, 100);
});


