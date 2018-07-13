/**
 * Created with JetBrains WebStorm.
 * User: 1
 * Date: 13-8-26
 * Time: 下午11:33
 * To change this template use File | Settings | File Templates.
 */
// 客户详细信息
var customers = [];
var auth_code = $.cookie('auth_code');
var uid = 0;
var _table;
var _flag;
var _validator;

// 获取登陆用户的权限
var initRole = function () {
    var dealerId = $.cookie('dealer_id');
    query_json = {
        uid: dealerId
    };
    $('#roleId').innerHTML = '';
    wistorm_api._list('role', query_json, 'objectId,name,remark,createdAt', '-createdAt', '-createdAt', 0, 0, 1, -1, auth_code, false, function(roles){
        if(roles.status_code == 0 && roles.total > 0){
            for(var i = 0; i < roles.total; i++){
                var option = document.createElement('option');
                option.value = roles.data[i].objectId;
                option.innerText = roles.data[i].name;
                $('#roleId').append(option);
            }
        }
    });
};

var setRole = function(uid, roleId, callback){
    var query_json = {
        users: uid.toString()
    };
    var update_json = {
        users: "-" + uid.toString()
    };
    wistorm_api._update("role", query_json, update_json, auth_code, false, function(obj) {
        query_json = {
            objectId: parseInt(roleId)
        };
        update_json = {
            users: "%2B" + uid
        };
        wistorm_api._update("role", query_json, update_json, auth_code, false, function(obj) {
            callback(obj);
        });
    });
};

var getRole = function(uid, callback){
    var query_json = {
        users: uid.toString()
    };
    wistorm_api._get("role", query_json, "objectId", auth_code, false, function (obj) {
        if(obj.status_code == 0 && obj.data != null){
            callback(obj.data.objectId);
        }else{
            callback('');
        }
    })
};

$(document).ready(function () {

    var usId = setInterval(function () {
        if(!i18nextLoaded){
            return;
        }

        $(document).on("click", "#user_list .icon-remove", function () {
            cust_id = parseInt($(this).attr("uid"));
            cust_name = $(this).attr("username");
            if (CloseConfirm(i18next.t("user.confirm_delete", {cust_name: cust_name}))) {
                _delete(cust_id, '');
            }
        });

        $(document).on("click", "#user_list .icon-edit", function () {
            cust_id = parseInt($(this).attr("uid"));
            _info(cust_id);
        });

        $("#searchcustomer").click(function () {
            _query();
        });

        $('#userkey').keydown(function(e){
            var curKey = e.which;
            if(curKey == 13){
                _query();
                return false;
            }
        });
        $("#addUser").click(function () {
            var title = i18next.t("user.add_user");
            initFrmCustomer(title, 1, "", "", "", 11, "", "", "1", 0, "");
            _validator.resetForm();
            $("#divUser").dialog("open");
        });

        $("#addRole").click(function(){
            window.open('/role');
        });

        $("#resetPassword").click(function () {
            var new_password = "123456";
            $('#password').val(new_password);
            $('#password2').val(new_password);
            _alert(i18next.t("customer.msg_restore_password"));
        });

        var buttons = {};
        buttons[i18next.t("system.save")] = function () {
            $('#frmUser').submit();
        };
        buttons[i18next.t("system.cancel")] = function () {
            _validator.resetForm();
            $(this).dialog("close");
        };
        $('#divUser').dialog({
            autoOpen:false,
            width:520,
            buttons:buttons
        });

        $("#frmUser").submit(function () {
            if ($('#frmUser').valid()) {
                if (_flag == 1) {
                    _add();
                } else {
                    _edit();
                }
            }
            return false;
        });

        _validator = $('#frmUser').validate(
            {
                rules:{
                    username:{
                        minlength:4,
                        required:true,
                        remote:{
                            url:"/exists", //后台处理程序
                            type:"get", //数据发送方式
                            dataType:"json", //接受数据格式
                            data:{
                                auth_code:function () {
                                    return $.cookie('auth_code');
                                },
                                query_type:function () {
                                    return 6;
                                },
                                value:function () {
                                    return $('#username').val();
                                }
                            }
                        }
                    },
                    password:{
                        minlength:6,
                        required:true
                    },
                    password2:{
                        minlength:6,
                        required:true,
                        equalTo:"#password"
                    },
                    roleId: {
                        required:true
                    }
                },
                messages:{
                    username: {minlength: i18next.t("customer.username_minlength"), required: i18next.t("customer.username_required"), remote: i18next.t("customer.username_remote")},
                    password: {minlength: i18next.t("customer.password_minlength"), required: i18next.t("customer.password_required")},
                    password2: {required: i18next.t("customer.password2_required"), minlength: i18next.t("customer.password2_minlength"), equalTo: i18next.t("customer.password2_equalTo")},
                    roleId: {required: i18next.t("customer.roleId_required")}
                },
                highlight:function (element) {
                    $(element).closest('.control-group').removeClass('success').addClass('error');
                },
                success:function (element) {
                    element
                        .text('OK!').addClass('valid')
                        .closest('.control-group').removeClass('error').addClass('success');
                    //alert('success');
                }
            });

        _query();

        initRole();

        clearInterval(usId);
    }, 100);
});

function _info(objectId){
    var query_json = {
        objectId: objectId
    };
    wistorm_api.get(query_json, 'username,userType,createdAt,authData', auth_code, function (user) {
        user.data.password = "****************";
        getRole(objectId, function (roleId) {
            user.data.roleId = roleId;
            infoSuccess(user.data);
        });
    });
}

var infoSuccess = function(json) {
    //alert(json);
    _validator.resetForm();
    var create_time = new Date(json.createdAt);
    create_time = create_time.format("yyyy-MM-dd hh:mm:ss");
    initFrmCustomer(i18next.t("user.edit_user"), 2, json.username, json.password, create_time, json.roleId, json.authData.remark);
    $("#divUser").dialog("open");
};

// 初始化客户信息窗体
var initFrmCustomer = function(title, flag, username, password, create_time, roleId, remark){
    $("#divUser").dialog("option", "title", title);
    _flag = flag;
    $('#username').val(username);
    $('#password').val(password);
    $('#password2').val(password);
    $('#remark').val(remark);
    $('#roleId').val(roleId.toString());
    $('#create_time').val(create_time);
    if(_flag == 1){
        $('#username').removeAttr("disabled");
        $('#password').removeAttr("disabled");
        $('#password_bar').show();
        $('#password_bar2').show();
        $('#create_time_bar').hide();
        $('#resetPassword').hide();
    }else{
        $('#username').attr("disabled","disabled");
        $('#password').attr("disabled","disabled");
        $('#password_bar2').hide();
        $('#create_time_bar').show();
        $('#resetPassword').show();
    }
    // $('#parent_cust_id').html("");
    // $('#parent_cust_id').append("<option value='1'>无</option>");
    // for(var i = 0; i < customers.length; i++){
    //     $('#parent_cust_id').append("<option value='"+customers[i].cust_id+"'>"+customers[i].cust_name+"</option>");
    // }
    // $("#parent_cust_id").get(0).value = parent_cust_id;
};


// node = {label: "", id: 0, children: []};
// 客户查询
function _query() {
    var dealer_type = $.cookie('dealer_type');
    var dealer_id = $.cookie('dealer_id');
    var tree_path = $.cookie('tree_path');
    var key = '';
    if($('#userKey').val() !== ''){
        key = $('#userKey').val();
    }
    var page_no = 1;
    var page_count = 1000;

    var query_json;
    if(key != ""){
        query_json = {
            parentId: dealer_id,
            userType: 11,
            name: '^' + key
        };
    }else{
        query_json = {
            parentId: dealer_id,
            userType: 11
        };
    }
    setLoading("user_list");
    wistorm_api.getUserList(query_json, 'objectId,username,authData,createdAt', '-createdAt', '-createdAt', 0, 0, -1, auth_code, querySuccess)
}

var querySuccess = function(json) {
    var j, _j, UnContacter, Uncontacter_tel;
    names = [];
    for (var i = 0; i < json.data.length; i++) {
        json.data[i].createdAt = NewDate(json.data[i].createdAt);
        json.data[i].createdAt = json.data[i].createdAt.format("yyyy-MM-dd");
        names.push(json.data[i].username);
    }

    var _columns = [
        { "mData":"username", "sClass":"ms_left" },
        { "mData":"authData.remark", "sClass":"ms_left" },
        { "mData":"createdAt", "sClass":"center"},
        { "mData":null, "sClass":"center", "bSortable":false, "fnRender":function (obj) {
            return "<a href='#' title='" + i18next.t("table.edit") + "'><i class='icon-edit' uid='" + obj.aData.objectId + "'></i></a>&nbsp&nbsp<a href='#' title='" + i18next.t("table.delete") + "'><i class='icon-remove' uid='" +
                obj.aData.objectId + "' username='" + obj.aData.username + "'></i></a>";
        }
        }
    ];

    var lang = i18next.language || 'en';
    var objTable = {
        "bInfo":false,
        "bLengthChange":false,
        "bProcessing":true,
        "bServerSide":false,
        "bFilter":false,
        "aaData":json.data,
        "aoColumns":_columns,
        "sDom":"<'row'r>t<'row'<'pull-right'p>>",
        "sPaginationType":"bootstrap",
        "oLanguage":{"sUrl":'css/' + lang + '.txt'}
    };
    //$('#vehicleKey').typeahead({source:names});

    $('#userKey').typeahead({
        source: function (query, process) {
            process(names);
        }
    });

    if (_table) {
        _table.fnClearTable();
        _table.fnAddData(json.data);
    } else {
        _table = $("#user_list").dataTable(objTable);
    }
};

var getStyle = function(level){
    var style = "padding-left: " + (level - 1) * 10 + "px";
    return style;
};

// 新增客户
var _add = function(){
    var dealer_id = $.cookie('dealer_id');
    var username = $('#username').val();
    var roleId = $('#roleId').val();
    var password = hex_md5($("#password").val());
    var authData = {
        remark: $('#remark').val()
    };

    wistorm_api.create(username, '', '', password, 11, 2, dealer_id, authData, auth_code, function (obj) {
        if(obj.status_code == 0 && obj.uid){
            setRole(obj.uid, roleId, function(obj){
                addSuccess(obj);
            });
        }else{
            addSuccess(obj);
        }
    });
};

var addSuccess = function(json) {
    if(json.status_code == 0){
        $("#divUser").dialog("close");
        _query();
    }else{
        _alert(i18next.t("user.msg_add_fail"));
    }
};

// 编辑客户
var _edit = function(){
    var auth_code = $.cookie('auth_code');
    var username = $('#username').val();
    var roleId = $('#roleId').val();
    var password = hex_md5($("#password").val());
    var authData = {
        remark: $('#remark').val()
    };

    var query_json = {
        objectId: cust_id
    };
    var update_json = {
        username: username,
        password: password,
        authData: authData
    };
    wistorm_api.update(query_json, update_json, auth_code, editSuccess);
    setRole(cust_id, roleId, function(obj){
    });
};

var editSuccess = function(json) {
    if(json.status_code == 0){
        $("#divUser").dialog("close");
        _query();
    }else{
        _alert(i18next.t("user.msg_edit_fail"));
    }
};

// 删除客户
var _delete = function(cust_id, tree_path){
    var query_json = {
        objectId: cust_id
    };
    wistorm_api.delete(query_json, auth_code, deleteSuccess);
};

var deleteSuccess = function(json) {
    if(json.status_code == 0){
        _query();
    }else{
        _alert(i18next.t("user.msg_delete_fail"));
    }
};