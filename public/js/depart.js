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
var depart_id = '0';
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
var dealer_type = $.cookie('dealer_type');
var login_depart_id = $.cookie('login_depart_id');

function windowResize() {
    var height = $(window).height() - 122;
    $('#customerTree').css({"height": height + "px"});
}

var ChangeParentSuccess = function(json) {
    if(json.status_code == 0){
        $("#divCustomerAssign").dialog("close");
        updateCustomerCount(uid);
        updateCustomerCount(assignUid);
        getAllCustomer(uid);
    }else{
        _alert(i18next.t("customer.err_change_parent"));
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

        $(document).on("click", "#customer_list .icon-retweet", function () {
            cust_id = parseInt($(this).attr("cust_id"));
            cust_name = $(this).attr("cust_name");
            var title = i18next.t("customer.change_parent");
            $("#divCustomerAssign").dialog("option", "title", title);
            $("#divCustomerAssign").dialog("open");
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
                getAllCustomer(depart_id);
                return false;
            }
        });

        $("#addCustomer").click(function () {
            var title = i18next.t("depart.add_depart");
            initFrmDepart(title, 1, "", "");
            _validator.resetForm();
            $("#divDepart").dialog("open");
        });

        var buttons = {};
        buttons[i18next.t("system.save")] = function () {
            $('#frmDepart').submit();
        };
        buttons[i18next.t("system.cancel")] = function () {
            _validator.resetForm();
            $(this).dialog("close");
        };
        $('#divDepart').dialog({
            autoOpen: false,
            width: 550,
            buttons: buttons
        });

        $("#frmDepart").submit(function () {
            if ($('#frmDepart').valid()) {
                if (_flag === 1) {
                    customerAdd();
                } else {
                    customerEdit();
                }
            }
            return false;
        });

        _validator = $('#frmDepart').validate(
            {
                rules: {
                    depart_name: {
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
                                    return 7;
                                },
                                old_value: function () {
                                    return edit_name;
                                },
                                value: function () {
                                    return $('#depart_name').val();
                                }
                            }
                        }
                    }
                },
                messages: {
                    depart_name: {required: i18next.t("depart.depart_name_required"), remote: i18next.t("depart.depart_name_remote")}},
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
        getAllCustomer(dealer_id);

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
        objectId: objectId
    };
    wistorm_api._get('department', query_json, 'objectId,uid,name,isSupportDepart,createdAt,updatedAt', auth_code, true, customerInfoSuccess);
}

var customerInfoSuccess = function(json) {
    //alert(json);
    _validator.resetForm();
    var create_time = new Date(json.data.createdAt);
    create_time = create_time.format("yyyy-MM-dd hh:mm:ss");
    initFrmDepart(i18next.t("depart.edit_depart"), 2, json.data.name, json.data.isSupportDepart || false, create_time);
    $("#divDepart").dialog("open");
};

// 初始化客户信息窗体
var initFrmDepart = function(title, flag, cust_name, is_support_depart, create_time){
    $("#divDepart").dialog("option", "title", title);
    _flag = flag;
    edit_name = cust_name;
    $('#depart_name').val(cust_name);
    $('#create_time').val(create_time);
    $('#is_support_depart').prop("checked", is_support_depart);
    if(_flag === 1){
        $('#create_time_bar').hide();
    }else{
        $('#create_time_bar').show();
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
    }

    var onCustomerSelectClick = function(event, treeId, treeNode){
//        alert(treeNode.tree_path);
        if(treeNode.id !== dealer_id){
            depart_id = treeNode.id;
            selectNode = treeNode;
            $.cookie('depart_id', depart_id);
            cust_name = treeNode.name;
            $('#selCustName').html(cust_name);
            getAllCustomer(depart_id);
        }else{
            depart_id = 0;
            $.cookie('depart_id', depart_id);
            getAllCustomer(depart_id);
        }
    };

    var setting = {
        view: {showIcon: true},
        check: {enable: false, chkStyle: "checkbox"},
        data: {simpleData: {enable: true}},
        callback: {onClick: onCustomerSelectClick}
    };

    var customerArray = [];
    customerArray.push({
        open: false,
        id: dealer_id,
        pId: 0,
        name: dealer_name,
        icon: treeIcon['2']
    });
    // 创建三个分类的根节点
    for (var i = 0; i < json.data.length; i++) {
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
    }
    $.fn.zTree.init($("#customerTree"), setting, customerArray);

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
        if(typeof getAllCustomer != "undefined"){
            getAllCustomer(depart_id);
        }
    }
};

var getAllCustomer = function (uid) {
    var key = '';
    if($('#customerKey').val() !== ''){
        key = $('#customerKey').val().trim();
    }
    var query_json;
    if(key !== ""){
        var searchType = $('#searchType').val();
        query_json = {
            uid: dealer_id,
            parentId: uid
        };
        query_json[searchType] = '^' + key;
    }else{
        query_json = {
            uid: dealer_id,
            parentId: uid
        };
    }
    // wistorm_api._list('customer', query_json, 'objectId,name,treePath,parentId,uid,custType,other', 'custType,name', '-createdAt', 0, 0, 1, -1, auth_code, true, customerQuerySuccess)
    wistorm_api._list('department', query_json, 'objectId,uid,name,isSupportDepart,createdAt,parentId', 'name', 'name', 0, 0, 1, -1, auth_code, true, querySuccess);
};

var querySuccess = function(json) {
    // 更新选中node显示
    // if(json.status_code === 0 && selectNode && selectNode.id !== $.cookie('dealer_id')){
    //     var treeObj = $.fn.zTree.getZTreeObj("customerTree");
    //     selectNode.name = selectNode._name;
    //     treeObj.updateNode(selectNode);
    // }
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
            if(obj.aData.isSupportDepart){
                return "<img style='width:16px;height:16px' src='/img/yes.png'/>";
            }else{
                return "";
            }
        }},
        { "mData":"createdAt", "sClass":"center"},
        { "mData":null, "sClass":"center", "bSortable":false, "fnRender":function (obj) {
            return "<a href='#' title='" + i18next.t("table.edit") + "'><i class='icon-edit' cust_id='" + obj.aData.objectId + "'></i></a>&nbsp&nbsp<a href='#' title='" + i18next.t("table.change_parent") + "'><i class='icon-retweet' cust_id='" + obj.aData.objectId + "' cust_name='" + obj.aData.name + "'></i></a>&nbsp&nbsp<a href='#' title='" + i18next.t("table.delete") + "'><i class='icon-remove' cust_id='" +
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
    var depart_name = $('#depart_name').val(); //用户名称，只有当用户类型为集团用户时有效，需判断用户名是否存在
    var is_support_deport = $('#is_support_depart').prop("checked");

    var create_json = {
        name: depart_name,
        parentId: depart_id.toString(),
        uid: dealer_id,
        isSupportDepart: is_support_deport
    };
    wistorm_api._create('department', create_json, auth_code, true, customerAddSuccess);
};

var customerAddSuccess = function(json) {
    if(json.status_code == 0){
        $("#divDepart").dialog("close");
        customerQuery();
        getAllCustomer(depart_id);
    }else{
        _alert(i18next.t("depart.msg_add_fail"));
    }
    doing = false;
};

// 编辑客户
var customerEdit = function(){
    var auth_code = $.cookie('auth_code');
    var depart_name = $('#depart_name').val(); //用户名称，只有当用户类型为集团用户时有效，需判断用户名是否存在
    var is_support_deport = $('#is_support_depart').prop("checked");

    var query_json = {
        objectId: cust_id
    };
    var update_json = {
        name: depart_name,
        isSupportDepart: is_support_deport
    };
    wistorm_api._update('department', query_json, update_json, auth_code, true, customerEditSuccess);
};

var customerEditSuccess = function(json) {
    if(json.status_code == 0){
        $("#divDepart").dialog("close");
        customerQuery();
        getAllCustomer(depart_id);
    }else{
        _alert(i18next.t("customer.msg_edit_fail"));
    }
};

// 删除客户
var customerDelete = function(cust_id){
    // var auth_code = $.cookie('auth_code');
    // var sendUrl = $.cookie('Host') + "customer/" + cust_id + "?access_token=" + auth_code;
    // var sendData = { tree_path: tree_path };
    // var sendObj = { type:"DELETE", url:sendUrl, data:sendData, success:function (json) {
    //     customerDeleteSuccess(json);
    // }, error:OnError };
    // ajax_function(sendObj);
    //判断下属是否有用户，如果有，不能删除用户
    var query_json = {
        parentId: cust_id
    };
    wistorm_api._count('department', query_json, auth_code, true, function(obj){
       if(obj.count > 0){
           _alert(i18next.t("depart.msg_have_depart"));
       }else{
           //判断下属是否有目标，如果有，不能删除用户
           var query_json = {
               objectId: cust_id
           };
           wistorm_api._count('employee', query_json, auth_code, true, function(obj){
               if(obj.count > 0){
                   _alert(i18next.t("depart.msg_have_employee"));
               }else{
                   wistorm_api._delete('department', query_json, auth_code, true, _deleteSuccess);
               }
           });
       }
    });
};

var _deleteSuccess = function(json) {
    if(json.status_code == 0){
        customerQuery();
        getAllCustomer(depart_id);
    }else if(json.status_code == 7){
        _alert(i18next.t("depart.msg_have_employee"));
    }else{
        _alert(i18next.t("depart.msg_delete_fail"));
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