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
var dealer_id = $.cookie('dealer_id');
var dealer_name = $.cookie('name');
var cust_id = 0;
var depart_id = 0;
var tree_path = '';
var customer_table;
var activeCustType;
var custType = '2';
var doing = false;
var selectNode = null;
var assignUid = 0;
var assignName = '';
var assignTreePath = '';
var _validator;
var _flag;
var edit_name;
var departs = {};
var dealer_type = $.cookie('dealer_type');
var login_depart_id = $.cookie('login_depart_id');

function windowResize() {
    var height = $(window).height() - 122;
    $('#customerTree').css({"height": height + "px"});
}

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

// 目标更换所属用户
var customerChangeParent = function(obj_id, change_cust_id){
    var query_json = {
        objectId: obj_id
    };
    var update_json = {
        departId: change_cust_id
    };
    wistorm_api._update('employee', query_json, update_json, auth_code, true, ChangeParentSuccess);
};

var ChangeParentSuccess = function(json) {
    if(json.status_code === 0){
        $("#divDepartAssign").dialog("close");
        getAllEmployee(depart_id);
    }else{
        _alert(i18next.t("employee.err_change_parent"));
    }
};

$(document).ready(function () {
    // Initialize placeholder
    // $.Placeholder.init();
    windowResize();
    $(window).resize(function () {
        windowResize();
    });

    var id = setInterval(function(){
        if(!i18nextLoaded){
            return;
        }

        $("#checkAll").click(function () {
            $("[type='checkbox']").prop("checked", $('#checkAll').prop("checked"));//全选
        });

        $(document).on("click", "#customer_list .icon-remove", function () {
            cust_id = parseInt($(this).attr("cust_id"));
            cust_name = $(this).attr("cust_name");
            if (CloseConfirm(i18next.t("depart.msg_delete_depart", { name: cust_name }))) {
                customerDelete(cust_id);
            }
        });

        var buttons = {};
        buttons[i18next.t("system.save")] = function () {
            $('#frmDepartAssign').submit();
        };
        buttons[i18next.t("system.cancel")] = function () {
            $(this).dialog("close");
        };
        $('#divDepartAssign').dialog({
            autoOpen: false,
            width: 480,
            buttons: buttons
        });

        $('#frmDepartAssign').submit(function () {
            var msg = i18next.t("employee.msg_change_parent", {cust_name: cust_name, assignName: assignName}); //'你确定将用户[' + cust_name + ']的上级用户更换为[' + assignName + ']吗?';
            if (CloseConfirm(msg)) {
                // customerAssign();
                customerChangeParent(cust_id, assignUid);
            }
            return false;
        });        

        $(document).on("click", "#customer_list .icon-retweet", function () {
            cust_id = parseInt($(this).attr("cust_id"));
            cust_name = $(this).attr("cust_name");
            var title = i18next.t("employee.change_parent");
            $("#divDepartAssign").dialog("option", "title", title);
            $("#divDepartAssign").dialog("open");
        });

        $(document).on("click", "#customer_list .icon-edit", function () {
            cust_id = parseInt($(this).attr("cust_id"));
            customerInfo(cust_id);
        });

        $('#searchKey').keydown(function(e){
            var curKey = e.which;
            if(curKey == 13){
                customerQuery();
                return false;
            }
        });

        $('#customerKey').keydown(function(e){
            var curKey = e.which;
            if(curKey == 13){
                getAllEmployee(depart_id);
                return false;
            }
        });

        $("#addCustomer").click(function () {
            var title = i18next.t("employee.add_employee");
            initFrmEmployee(title, 1, "", "", "", "", "", "", "9", [], false, false, "", 0);
            _validator.resetForm();
            $("#divEmployee").dialog("open");
        });

        var buttons = {};
        buttons[i18next.t("system.save")] = function () {
            $('#frmEmployee').submit();
        };
        buttons[i18next.t("system.cancel")] = function () {
            _validator.resetForm();
            $(this).dialog("close");
        };
        $('#divEmployee').dialog({
            autoOpen: false,
            width: 550,
            buttons: buttons
        });

        $("#frmEmployee").submit(function () {
            if ($('#frmEmployee').valid()) {
                if (_flag === 1) {
                    customerAdd();
                } else {
                    customerEdit();
                }
            }
            return false;
        });

        $("#resetPassword").click(function () {
            var new_password = hex_md5("123456");
            $('#password').val(new_password);
            $('#password2').val(new_password);
            _alert(i18next.t("customer.msg_restore_password"));
        });

        _validator = $('#frmEmployee').validate(
            {
                rules: {
                    username: {
                        minlength: 4,
                        required: true,
                        remote: {
                            url: "/exists", //后台处理程序
                            type: "get", //数据发送方式
                            dataType: "json", //接受数据格式
                            data: {
                                auth_code: function () {
                                    return $.cookie('auth_code');
                                },
                                query_type: function () {
                                    return 6;
                                },
                                value: function () {
                                    return $('#username').val();
                                }
                            }
                        }
                    },
                    password: {
                        minlength: 6,
                        required: true
                    },
                    password2: {
                        minlength: 6,
                        required: true,
                        equalTo: "#password"
                    },
                    employee_name: {
                        minlength: 2,
                        required: true,
                        remote: {
                            url: "/exists", //后台处理程序
                            type: "get", //数据发送方式
                            dataType: "json", //接受数据格式
                            data: {
                                auth_code: function () {
                                    return $.cookie('auth_code');
                                },
                                query_type: function () {
                                    return 8;
                                },
                                old_value: function () {
                                    return edit_name;
                                },
                                value: function () {
                                    return $('#depart_name').val();
                                }
                            }
                        }
                    },
                    roleId: {
                        required: true
                    }
                },
                messages: {
                    username: {minlength: i18next.t("customer.username_minlength"), required: i18next.t("customer.username_required"), remote: i18next.t("customer.username_remote")},
                    password: {minlength: i18next.t("customer.password_minlength"), required: i18next.t("customer.password_required")},
                    password2: {required: i18next.t("customer.password2_required"), minlength: i18next.t("customer.password2_minlength"), equalTo: i18next.t("customer.password2_equalTo")},
                    employee_name: {required: i18next.t("depart.depart_name_required"), remote: i18next.t("depart.depart_name_remote")},
                    roleId: {required: i18next.t("customer.roleId_required")}
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

        customerQuery();
        getAllEmployee(depart_id);

        initRole();

        clearInterval(id);
    }, 100);
});

function customerInfo(objectId){
    // var searchUrl = $.cookie('Host') + "customer/" + cust_id;
    // var searchData = { auth_code:auth_code };
    // var searchObj = { type:"GET", url:searchUrl, data:searchData, success:function (json) {
    //     customerInfoSuccess(json);
    // }, error:OnError };
    // ajax_function(searchObj);
    var query_json = {
        uid: objectId
    };
    wistorm_api._get('employee', query_json, 'objectId,uid,companyId,departId,name,sex,tel,email,cardNo,role,roleId,responsibility,isDriver,isInCharge,createdAt,updatedAt', auth_code, true, function(json){
        query_json = {
            objectId: json.data.uid
        };
        wistorm_api.get(query_json, 'username,mobile,email,password,userType', auth_code, function(user){
            json.data.username = user.data.username || user.data.mobile || user.data.email;
            json.data.password = '****************';
            json.data.userType = user.data.userType;
            getRole(objectId, function(roleId){
                json.data.roleId = roleId;
                customerInfoSuccess(json);
            });
        });
    });
}

var customerInfoSuccess = function(json) {
    //alert(json);
    _validator.resetForm();
    var create_time = new Date(json.data.createdAt);
    create_time = create_time.format("yyyy-MM-dd hh:mm:ss");
    initFrmEmployee(i18next.t("employee.edit_employee"), 2, json.data.username, json.data.password, json.data.name, json.data.sex, json.data.tel, json.data.email, json.data.role, json.data.responsibility, json.data.isDriver, json.data.isInCharge, create_time, json.data.roleId, json.data.cardNo);
    $("#divEmployee").dialog("open");
};

// 初始化客户信息窗体
var initFrmEmployee = function(title, flag, username, password, name, sex, tel, email, role, responsibility, isDriver, isInCharge, create_time, roleId, cardNo){
    $("#divEmployee").dialog("option", "title", title);
    _flag = flag;
    $('#username').val(username);
    $('#password').val(password);
    $('#password2').val(password);
    edit_name = name;
    $('#employee_name').val(name);
    $('#roleId').val(roleId.toString());
    $('#sex').val(sex);
    $('#tel').val(tel);
    $('#email').val(email);
    $('#cardno').val(cardNo);
    $('#identity').val(role);
    $('#use_vehicle').prop("checked", responsibility.indexOf('1') > -1);
    $('#manage_vehicle').prop("checked", responsibility.indexOf('2') > -1);
    $('#dispatch_vehicle').prop("checked", responsibility.indexOf('3') > -1);
    $('#is_driver').prop("checked", isDriver);
    $('#is_in_charge').prop("checked", isInCharge);
    $('#create_time').val(create_time);
    if(_flag === 1){
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
};

function customerQuery() {
    var dealer_type = $.cookie('dealer_type');
    var dealer_id = $.cookie('dealer_id');
    var tree_path = $.cookie('tree_path');
    var key = '';
    if($('#searchKey').val() !== ''){
        key = $('#searchKey').val().trim();
    }

    var query_json;
    if(key !== ""){
        query_json = {
            uid: dealer_id,
            name: '^' + key
        };
    }else{
        query_json = {
            uid: dealer_id
        };
    }
    wistorm_api._list('department', query_json, 'objectId,name,parentId,uid', 'name', 'name', 0, 0, 1, -1, auth_code, true, customerQuerySuccess)
}

var treeIcon = {
    '1': '/img/dealer_icon.png',
    '2': '/img/dealer_icon.png',
    '7': '/img/person_icon.png',
    '8': '/img/company_icon.png',
    '99': '/img/depart_icon.png'
};

var customerQuerySuccess = function(json) {
    var names = [];
    customers = json.data;
    if (json.data.length > 0) {
        depart_id = json.data[0].uid;
    }
    if ($.cookie('depart_id')) {
        depart_id = $.cookie('depart_id');
    }

    for (var i = 0; i < json.data.length; i++) {
        names.push(json.data[i].name);
        departs[json.data[i].objectId.toString()] = json.data[i].name;
    }

    var onCustomerSelectClick = function(event, treeId, treeNode){
        depart_id = treeNode.id;
        selectNode = treeNode;
        $.cookie('depart_id', depart_id);
        cust_name = treeNode.name;
        $('#selCustName').html(cust_name);
        getAllEmployee(depart_id);
    };

    var onCustomerAssignClick = function(event, treeId, treeNode){
        if(parseInt(treeNode.id) > 100){
            assignUid = treeNode.id;
            assignName = treeNode.name;
        }
    };

    var setting = {
        view: {showIcon: true},
        check: {enable: false, chkStyle: "checkbox"},
        data: {simpleData: {enable: true}},
        callback: {onClick: onCustomerSelectClick}
    };
    var settingAssign = {
        view: {showIcon: true},
        check: {enable: false, chkStyle: "checkbox"},
        data: {simpleData: {enable: true}},
        callback: {onClick: onCustomerAssignClick}
    };

    var customerArray = [];
    var selectArray = [];
    customerArray.push({
        open: false,
        id: dealer_id,
        pId: 0,
        name: dealer_name,
        icon: treeIcon['2']
    });
    selectArray.push({
        open: false,
        id: dealer_id,
        pId: 0,
        name: dealer_name,
        icon: treeIcon['2']
    });
    // 创建三个分类的根节点
    for (var i = 0; i < json.data.length; i++) {
        // 如果为成员登陆，则加载本级及下级
        if(['9', '12', '13'].indexOf(dealer_type) > -1){
            if(json.data[i].objectId.toString() !== login_depart_id && json.data[i].parentId.toString() !== login_depart_id){
                continue;
            }
        }
        var pId = dealer_id;
        if(json.data[i]['parentId'] > 0 && ['9', '12'].indexOf(dealer_type) === -1){
            pId = json.data[i]['parentId'];
        }
        customerArray.push({
            open: false,
            id: json.data[i]['objectId'],
            treePath: json.data[i]['treePath'],
            pId: pId,
            name: json.data[i]['name'],
            icon: treeIcon['99']
        });
        selectArray.push({
            open: false,
            id: json.data[i]['objectId'],
            treePath: json.data[i]['treePath'],
            pId: pId,
            name: json.data[i]['name'],
            icon: treeIcon['99']
        });
    }
    $.fn.zTree.init($("#customerTree"), setting, customerArray);
    $.fn.zTree.init($("#departTreeAssign"), settingAssign, selectArray);

    $('#customerKey').typeahead({source:names});

    if(depart_id > 0){
        var treeObj = $.fn.zTree.getZTreeObj("customerTree");
        var node = treeObj.getNodeByParam("id", depart_id, null);
        if(node){
            cust_name = node.name;
            $('#selCustName').html(cust_name);
            treeObj.selectNode(node);
        }else{
            node = treeObj.getNodeByParam("id", dealer_id, null);
            cust_name = node.name;
            $('#selCustName').html(cust_name);
            treeObj.selectNode(node);
        }
        if(typeof getAllEmployee != "undefined"){
            getAllEmployee(depart_id);
        }
    }
};

var getAllEmployee = function (uid) {
    var key = '';
    if($('#customerKey').val() !== ''){
        key = $('#customerKey').val().trim();
    }
    var query_json;
    if(uid === dealer_id){
        if(key !== ""){
            var searchType = $('#searchType').val();
            query_json = {
                companyId: uid
            };
            query_json[searchType] = '^' + key;
        }else{
            query_json = {
                companyId: uid
            };
        }
        if(['9', '12', '13'].indexOf(dealer_type) > -1){
            query_json['departId'] = login_depart_id;
        }
    }else{
        if(key !== ""){
            var searchType = $('#searchType').val();
            query_json = {
                departId: uid
            };
            query_json[searchType] = '^' + key;
        }else{
            query_json = {
                departId: uid
            };
        }
    }
    // wistorm_api._list('customer', query_json, 'objectId,name,treePath,parentId,uid,custType,other', 'custType,name', '-createdAt', 0, 0, 1, -1, auth_code, true, customerQuerySuccess)
    wistorm_api._list('employee', query_json, 'objectId,uid,companyId,departId,name,sex,tel,email,role,roleId,responsibility,isDriver,isInCharge,createdAt,updatedAt', 'name', 'name', 0, 0, 1, -1, auth_code, true, querySuccess);
};

var querySuccess = function(json) {
    var roleDesc = {
        '9': i18next.t("employee.staff_member"),
        '12': i18next.t("employee.depart_leader"),
        '13': i18next.t("employee.company_leader")
    };
    names = [];
    for (var i = 0; i < json.data.length; i++) {
        json.data[i].createdAt = new Date(json.data[i].createdAt);
        json.data[i].createdAt = json.data[i].createdAt.format("yyyy-MM-dd hh:mm:ss");
        names.push(json.data[i].name);
    }

    var _columns = [
        // { "mData":null, "sClass":"center", "bSortable":false, "fnRender": function(obj){
        //     return "<input type='checkbox' value='" + obj.aData.objectId + "'>";
        // }
        // },
        { "mData":"name", "sClass":"ms_left" },
        { "mData":null, "sClass":"center", "bSortable":false, "fnRender":function (obj) {
            return departs[obj.aData.departId];
        }},
        { "mData":null, "sClass":"center", "bSortable":false, "fnRender":function (obj) {
            return roleDesc[obj.aData.role];
        }},
        { "mData":"tel", "sClass":"center" },
        { "mData":"createdAt", "sClass":"center"},
        { "mData":null, "sClass":"center", "bSortable":false, "fnRender":function (obj) {
            return "<a href='#' title='" + i18next.t("table.edit") + "'><i class='icon-edit' cust_id='" + obj.aData.uid + "'></i></a>&nbsp&nbsp<a href='#' title='" + i18next.t("table.change_parent") + "'><i class='icon-retweet' cust_id='" + obj.aData.objectId + "' cust_name='" + obj.aData.name + "'></i></a>&nbsp&nbsp<a href='#' title='" + i18next.t("table.delete") + "'><i class='icon-remove' cust_id='" +
                obj.aData.objectId + "' cust_name='" + obj.aData.name + "'></i></a>";
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

    $('#searchKey').typeahead({
        source: function (query, process) {
            process(names);
        }
    });

    if (customer_table) {
        customer_table.fnClearTable();
        customer_table.fnAddData(json.data);
    } else {
        customer_table = $("#customer_list").dataTable(objTable);
        localize = locI18next.init(i18next);
        localize('.table');
    }

    if($("#customerKey").val() !== '' && json.data.length === 1){
        var treeObj = $.fn.zTree.getZTreeObj("customerTree");
        var node = treeObj.getNodeByParam("id", json.data[0].parentId[0], null);
        if(node){
            cust_name = node.name;
            $('#selCustName').html(cust_name);
            treeObj.selectNode(node);
        }
    }
};

var getStyle = function(level){
    var style = "padding-left: " + (level - 1) * 10 + "px";
    return style;
};

// 新增部门
var customerAdd = function(){
    if(doing){
        return;
    }
    doing = true;
    var username = $('#username').val();
    var roleId = $('#roleId').val();
    var password = hex_md5($("#password").val());
    var employee_name = $('#employee_name').val(); //用户名称，只有当用户类型为集团用户时有效，需判断用户名是否存在
    var sex = $('#sex').val();
    var tel = $('#tel').val();
    var email = $('#email').val();
    var role = $('#identity').val();
    var cardno = $('#cardno').val();
    var responsibility = [];
    if($("#use_vehicle").prop("checked"))responsibility.push("1");
    if($("#manage_vehicle").prop("checked"))responsibility.push("2");
    if($("#dispatch_vehicle").prop("checked"))responsibility.push("3");
    var is_driver = $('#is_driver').prop("checked");
    var is_in_charge = $('#is_in_charge').prop("checked");

    // wistorm_api._create('department', create_json, auth_code, true, customerAddSuccess);
    wistorm_api.create(username, username, '', password, role, 2, dealer_id, {}, auth_code, function (obj) {
        if(obj.status_code === 0 && obj.uid){
            var create_json = {
                name: employee_name,
                companyId: dealer_id,
                departId: depart_id,
                sex: sex,
                tel: tel,
                email: email,
                cardNo: cardno,
                role: role,
                roleId: roleId,
                responsibility: responsibility,
                isDriver: is_driver,
                isInCharge: is_in_charge,
                uid: obj.uid
            };
            wistorm_api._create('employee', create_json, auth_code, true, customerAddSuccess);
            setRole(obj.uid, roleId, function(obj){
            });
        }else{
            _alert(i18next.t("employee.msg_add_fail"));
            doing = false;
        }
    });
};

var customerAddSuccess = function(json) {
    if(json.status_code === 0){
        $("#divEmployee").dialog("close");
        getAllEmployee(depart_id);
    }else{
        _alert(i18next.t("employee.msg_add_fail"));
    }
    doing = false;
};

// 编辑客户
var customerEdit = function(){
    var auth_code = $.cookie('auth_code');
    var username = $('#username').val();
    var roleId = $('#roleId').val();
    var password = $("#password").val();
    var employee_name = $('#employee_name').val(); //用户名称，只有当用户类型为集团用户时有效，需判断用户名是否存在
    var sex = $('#sex').val();
    var tel = $('#tel').val();
    var email = $('#email').val();
    var role = $('#identity').val();
    var cardno = $('#cardno').val();
    var responsibility = [];
    if($("#use_vehicle").prop("checked"))responsibility.push("1");
    if($("#manage_vehicle").prop("checked"))responsibility.push("2");
    if($("#dispatch_vehicle").prop("checked"))responsibility.push("3");
    var is_driver = $('#is_driver').prop("checked");
    var is_in_charge = $('#is_in_charge').prop("checked");

    var query_json = {
        uid: cust_id
    };
    var update_json = {
        name: employee_name,
        sex: sex,
        tel: tel,
        email: email,
        cardNo: cardno,
        role: role,
        roleId: roleId,
        responsibility: responsibility,
        isDriver: is_driver,
        isInCharge: is_in_charge
    };
    wistorm_api._update('employee', query_json, update_json, auth_code, true, function(json){
        if(json.status_code === 0){
            var query_json = {
                objectId: cust_id
            };
            var update_json = {
                userType: role
            };
            if(password !== '****************'){
                update_json.password = password;
            }
            wistorm_api.update(query_json, update_json, auth_code, customerEditSuccess);
        }else{
            _alert(i18next.t("customer.msg_edit_fail"));
        }
    });
    setRole(cust_id, roleId, function(obj){
    });
};

var customerEditSuccess = function(json) {
    if(json.status_code === 0){
        $("#divEmployee").dialog("close");
        getAllEmployee(depart_id);
    }else{
        _alert(i18next.t("employee.msg_edit_fail"));
    }
};

// 删除客户
var customerDelete = function(cust_id){
    var query_json = {
        objectId: cust_id
    };
    wistorm_api._delete('employee', query_json, auth_code, true, _deleteSuccess);
};

var _deleteSuccess = function(json) {
    if(json.status_code === 0){
        getAllEmployee(depart_id);
    }else{
        _alert(i18next.t("employee.msg_delete_fail"));
    }
};

// 获取客户信息
var getLocalCustomerInfo = function(cust_id){
    var customer = {};
    for (var i = 0; i < customers.length; i++) {
        if(customers[i].objectId == cust_id){
            customer = customers[i];
            return customer;
        }
    }
};

var searchLocalCustomerInfoByName = function(cust_name){
    var customer = {};
    for (var i = 0; i < customers.length; i++) {
        if(customers[i].cust_name.indexOf(cust_name) > -1){
            customer = customers[i];
            return customer;
        }
    }
};