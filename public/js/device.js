/**
 * Created with JetBrains WebStorm.
 * User: 1
 * Date: 13-8-26
 * Time: 下午11:33
 * To change this template use File | Settings | File Templates.
 */
var auth_code = $.cookie('auth_code');
var _table;
var _validator;
var cust_id = 0;
var cust_name = '';
var uid = 0;
var assignUid = 0;
var assignName = '';
var assignTreePath = '';
var obj_id = 0;
var did = '';
var dealer_type = $.cookie('dealer_type');
var login_depart_id = $.cookie('depart_id');
var customers = [];
var validator_customer;
var roleIds = [];

function _tableResize() {
    // 修改目标列表高度
    var height = $(window).height() - 150;
    $('.dataTables_wrapper').css({ "height": height + "px" });
}

function windowResize() {
    var height = $(window).height() - 122;
    $('#customerTree').css({ "height": height + "px" });
};

// 获取登陆用户的权限
var initRole = function () {
    var dealerId = $.cookie('dealer_id');
    var query_json = {
        uid: dealerId
    };
    $('#roleId').empty();
    wistorm_api._list('role', query_json, 'objectId,name,remark,createdAt', '-createdAt', '-createdAt', 0, 0, 1, -1, auth_code, false, function (roles) {
        if (roles.status_code === 0 && roles.total > 0) {
            for (var i = 0; i < roles.total; i++) {
                var option = document.createElement('option');;
                option.value =
                    option.value = roles.data[i].objectId;
                roleIds.push(roles.data[i].objectId.toString());
                option.innerText = roles.data[i].name;
                $('#roleId').append(option);
            }
        }
    });
};

var setRole = function (uid, roleId, callback) {
    var query_json = {
        users: uid.toString()
    };
    var update_json = {
        users: "-" + uid.toString()
    };
    wistorm_api._update("role", query_json, update_json, auth_code, false, function (obj) {
        query_json = {
            objectId: parseInt(roleId)
        };
        update_json = {
            users: "%2B" + uid
        };
        wistorm_api._update("role", query_json, update_json, auth_code, false, function (obj) {
            callback(obj);
        });
    });
};

var getRole = function (uid, callback) {
    var query_json = {
        users: uid.toString()
    };
    wistorm_api._get("role", query_json, "objectId,name,uid", auth_code, false, function (obj) {
        if (obj.status_code == 0 && obj.data != null) {
            callback(obj.data);
        } else {
            callback('');
        }
    })
};

var updateCustomerTree = function (cust_id, treePath, callback) {
    wistorm_api.updateTree(cust_id, treePath, auth_code, callback);
};

// 目标更换所属用户
var customerChangeParent = function (obj_id, change_cust_id, changeTreePath) {
    var query_json = {
        uid: obj_id
    };
    var _treePath = changeTreePath + obj_id + ',';
    var update_json = {
        parentId: [change_cust_id],
        treePath: _treePath
    };
    wistorm_api._update('customer', query_json, update_json, auth_code, true, function (json) {
        if (json.status_code === 0) {
            $("#divCustomerAssign").dialog("close");
            updateCustomerCount(uid, tree_path, function () {
                updateCustomerCount(assignUid, assignTreePath, function () {
                    customerQuery();
                    // getAllCustomer(uid);
                    updateCustomerTree(obj_id, _treePath, function (json) {
                        if (json.status_code !== 0) {
                            _alert(i18next.t("customer.err_change_parent"));
                        }
                    })
                });
            });

        } else {
            _alert(i18next.t("customer.err_change_parent"));
        }
    });
};

function customerInfo(objectId) {
    var query_json = {
        uid: objectId
    };
    wistorm_api._get('customer', query_json, 'objectId,uid,name,custType,custTypeId,parentId,contact,tel,createdAt,updatedAt', auth_code, true, function (json) {
        query_json = {
            objectId: json.data.uid
        };
        wistorm_api.get(query_json, 'username,mobile,email,password,userType', auth_code, function (user) {
            json.data.username = user.data.username || user.data.mobile || user.data.email;
            json.data.password = '****************';
            json.data.userType = user.data.userType;
            getRole(objectId, function (roleData) {
                var roleId = roleData ? roleData.objectId : '';
                json.data.roleId = roleId;
                console.log(roleData);
                if (roleId && roleIds.indexOf(roleId.toString()) == -1) {
                    otherCustomer(roleData.uid, function (otherCus) {
                        var option = document.createElement('option');;
                        option.value = roleId;
                        option.innerText = otherCus ? roleData.name + '(' + otherCus.name + ')' : roleData.name;
                        $('#roleId').append(option);
                        customerInfoSuccess(json.data);
                    })
                } else {
                    customerInfoSuccess(json.data);
                }
                // console.log(roleIds.indexOf(roleId.toString()))

            });
        });
    });
}

function otherCustomer(uid, callback) {
    wistorm_api._get('customer', { uid: uid }, 'objectId,uid,name,custType,custTypeId,parentId,contact,tel,createdAt,updatedAt', auth_code, true, function (json) {
        if (json.status_code == 0) {
            callback(json.data)
        }
    })
}



var customerInfoSuccess = function (json) {
    //alert(json);
    validator_customer.resetForm();
    var create_time = new Date(json.createdAt);
    create_time = create_time.format("yyyy-MM-dd hh:mm:ss");
    initFrmCustomer(i18next.t("customer.edit_customer"), 2, json.username, json.password, json.name, json.custType, json.contact, json.tel, create_time, json.roleId);
    $("#divCustomer").dialog("open");
};

// 初始化客户信息窗体
var initFrmCustomer = function (title, flag, username, password, cust_name, cust_type, contacter, contacter_tel, create_time, roleId) {
    $("#divCustomer").dialog("option", "title", title);
    customer_flag = flag;
    $('#username').val(username);
    $('#password').val(password);
    $('#password2').val(password);
    edit_cust_name = cust_name;
    $('#cust_name').val(cust_name);
    $('#cust_type').val(cust_type.toString());
    // console.log(roleIds.indexOf(roleId.toString()))
    $('#roleId').val(roleId.toString());
    $('#contacter').val(contacter);
    $('#contacter_tel').val(contacter_tel);
    $('#create_time').val(create_time);
    if (customer_flag == 1) {
        $('#username').removeAttr("disabled");
        $('#password').removeAttr("disabled");
        $('#password_bar').show();
        $('#password_bar2').show();
        $('#create_time_bar').hide();
        $('#resetPassword').hide();
    } else {
        $('#username').attr("disabled", "disabled");
        $('#password').attr("disabled", "disabled");
        $('#password_bar2').hide();
        $('#create_time_bar').show();
        $('#resetPassword').show();
    }
};


// 编辑客户
var customerEdit = function () {
    var auth_code = $.cookie('auth_code');
    var parent_cust = getLocalCustomerInfo($('#parent_cust_id').val());
    var parent_cust_id = 1;
    var parent_tree_path = ",1,";
    var parent_level = 0;
    if (parent_cust) {
        parent_cust_id = parent_cust.cust_id;
        parent_tree_path = parent_cust.tree_path;
        parent_level = parent_cust.level;
    }
    var cust_name = $('#cust_name').val(); //用户名称，只有当用户类型为集团用户时有效，需判断用户名是否存在
    var cust_type = $('#cust_type').val(); //个人用户为1，集团用户为2
    var contacter = $('#contacter').val(); //姓名
    var contacter_tel = $('#contacter_tel').val();  //手机号码
    var roleId = $('#roleId').val();
    var password = $("#password").val();
    var province = 1;  //从字典表中获取dict_type=province
    var city = 1;     //从字典表中获取dict_type=city
    var reg_rule = {
        fee_type: { price: 120, period: 12 },
        mdt_type: { mdt_name: "WISE", protocol_ver: "1.0", fittings: ",60,61,64,63,65,", channel: 2 },
        card_type: 1,
        first_interval: 12
    };
    var send_type = 0;
    var roles = [1];
    var update_time = new Date();
    var users = [{
        "user_name": $('#username').val(),
        "password": $("#password").val()
    }];

    // var sendUrl = $.cookie('Host') + "customer/" + cust_id + "?access_token=" + auth_code;
    // var sendData = { cust_name: cust_name, cust_type: cust_type, parent_cust_id: parent_cust_id, contacter: contacter, contacter_tel: contacter_tel, province: province, city: city, reg_rule: reg_rule, send_type: send_type, parent_tree_path: parent_tree_path, level: parent_level, roles: roles, users: users };
    // var sendObj = { type:"PUT", url:sendUrl, data:sendData, success:function (json) {
    //     customerEditSuccess(json);
    // }, error:OnError };
    // ajax_function(sendObj);
    var query_json = {
        uid: cust_id
    };
    var update_json = {
        custType: cust_type,
        name: cust_name,
        contact: contacter,
        tel: contacter_tel
    };
    wistorm_api._update('customer', query_json, update_json, auth_code, true, function (json) {
        if (json.status_code === 0) {
            var query_json = {
                objectId: cust_id
            };
            var update_json = {
                userType: cust_type
            };
            if (password !== '****************') {
                update_json.password = password;
            }
            wistorm_api.update(query_json, update_json, auth_code, customerEditSuccess);
        } else {
            _alert(i18next.t("customer.msg_edit_fail"));
        }
    });
    setRole(cust_id, roleId, function (obj) {
    });
};

var customerEditSuccess = function (json) {
    if (json.status_code == 0) {
        $("#divCustomer").dialog("close");
    } else {
        _alert(i18next.t("customer.msg_edit_fail"));
    }
};

// 获取客户信息
var getLocalCustomerInfo = function (cust_id) {
    var customer = {};
    for (var i = 0; i < customers.length; i++) {
        if (customers[i].objectId == cust_id) {
            customer = customers[i];
            return customer;
        }
    }
};




// 客户详细信息
function deviceInfo(did) {
    // var auth_code = $.cookie('auth_code');
    // var searchUrl = $.cookie('Host') + "vehicle/" + obj_id;
    // var searchData = { auth_code:auth_code };
    // var searchObj = { type:"GET", url:searchUrl, data:searchData, success:function (json) {
    //     vehicleInfoSuccess(json);
    // }, error:OnError };
    // ajax_function(searchObj);
    var query_json = {
        did: did
    };
    wistorm_api._get('_iotDevice', query_json, 'objectId,did,model,workType,vehicleId,vehicleName', auth_code, true, function (json) {
        deviceInfoSuccess(json.data);
    });
}

function vehicleDeviceList() {
    $("#divDeviceAssign").dialog("open");
}

// 跳转到日志页面
function logInfo(device_id) {
    var logUrl = "/datalog?device_id=" + device_id;
    window.location.href = logUrl;
}

var deviceInfoSuccess = function (json) {
    //alert(json);
    // validator_vehicle.resetForm();
    var title = i18next.t("device.edit_device", { cust_name: cust_name });
    initFrmDevice(title, 2, json.did, json.model, json.workType, json.vehicleId, json.vehicleName);
    $("#divDeviceEdit").dialog("open");
};

// 初始化目标信息窗体
var initFrmDevice = function (title, flag, did, model, workType, vehicleId, vehicleName) {
    $("#divDeviceEdit").dialog("option", "title", title);
    _flag = flag;
    $('#editDid').val(did);
    $('#editModel').val(model);
    $('#editWorkType').val((workType || 0).toString());
    $('#editVehicleName').val(vehicleName || '');
    $('#unbind').css("display", vehicleName || '' !== '' ? 'inline-block' : 'none');
};

var initFrmCustomerList = function (title, obj_id, obj_name, cust_id) {
    $("#divCustomerList").dialog("option", "title", title);
    $('#change_obj_id').val(obj_id);
    $('#change_obj_name').val(obj_name);
    $('#change_cust_id').html("");
    for (var i = 0; i < customers.length; i++) {
        $('#change_cust_id').append("<option value='" + customers[i].cust_id + "'>" + customers[i].cust_name + "</option>");
    }
    $("#change_cust_id").get(0).value = cust_id;
};

function customerQuery() {
    var dealer_type = $.cookie('dealer_type');
    var dealer_id = $.cookie('dealer_id');
    var tree_path = $.cookie('tree_path');
    var key = '';
    if ($('#searchKey').val() !== '') {
        key = $('#searchKey').val().trim();
    }

    var query_json;
    if (key !== "") {
        query_json = {
            treePath: '^,' + dealer_id + ',',
            name: '^' + key,
            custType: '<>14'
        };
    } else {
        query_json = {
            // parentId: dealer_id
            treePath: '^,' + dealer_id + ',',
            custType: '<>14'
        };
    }
    wistorm_api._list('customer', query_json, 'objectId,name,treePath,parentId,uid,custType,other', 'custType,name', '-createdAt', 0, 0, 1, -1, auth_code, true, customerQuerySuccess)
}

var treeIcon = {
    '1': '/img/dealer_icon.png',
    '2': '/img/dealer_icon.png',
    '7': '/img/person_icon.png',
    '8': '/img/company_icon.png'
};

var customerQuerySuccess = function (json) {
    var names = [];
    customers = json.data;
    if (json.data.length > 0) {
        // user_name = json.data[0].users[0].user_name;
        cust_name = json.data[0].name;
        cust_id = json.data[0].objectId;
        uid = json.data[0].uid;
        tree_path = json.data[0].treePath;
        // level = json.data[0].level;
    }
    if ($.cookie('uid')) {
        uid = $.cookie('uid');
        tree_path = $.cookie('tree_path');
    }

    for (var i = 0; i < json.data.length; i++) {
        names.push(json.data[i].name);
    }

    var onCustomerSelectClick = function (event, treeId, treeNode) {
        //        alert(treeNode.tree_path);
        if (treeNode.pId || treeNode.id == $.cookie('dealer_id')) {
            uid = treeNode.id;
            tree_path = treeNode.treePath;
            cust_id = treeNode.id;
            $.cookie('uid', uid);
            cust_name = treeNode.name;
            $('#selCustName').html(cust_name);
            _query(treeNode.id, '');
        }
    };

    var onCustomerAssignClick = function (event, treeId, treeNode) {
        //        alert(treeNode.tree_path);
        if (treeNode.pId) {
            assignUid = treeNode.id;
            assignTreePath = treeNode.treePath;
            assignName = treeNode._name;
        }
    };

    var onCustomerAssignClickOne = function (event, treeId, treeNode) {
        if (parseInt(treeNode.id) > 100) {
            assignUid = treeNode.id;
            assignTreePath = treeNode.treePath;
            assignName = treeNode._name;
        }
    };

    var onCustomerSelectDblClick = function (event, treeId, treeNode) {
        // var treeObj = $.fn.zTree.getZTreeObj("customerTree");
        // if(treeNode.id !== $.cookie('dealer_id')){
        //     loadSubNode(treeObj, treeNode);
        // }
    };

    var onCustomerAssignDblClick = function (event, treeId, treeNode) {
        // var treeObj = $.fn.zTree.getZTreeObj("customerTreeAssign");
        // loadSubNode(treeObj, treeNode);
    };

    var setting = {
        view: { showIcon: true },
        check: { enable: false, chkStyle: "checkbox" },
        data: { simpleData: { enable: true } },
        callback: { onClick: onCustomerSelectClick, onDblClick: onCustomerSelectDblClick }
    };
    var settingAssign = {
        view: { showIcon: true },
        check: { enable: false, chkStyle: "checkbox" },
        data: { simpleData: { enable: true } },
        callback: { onClick: onCustomerAssignClick, onDblClick: onCustomerAssignDblClick }
    };
    var settingAssignOne = {
        view: { showIcon: true },
        check: { enable: false, chkStyle: "checkbox" },
        data: { simpleData: { enable: true } },
        callback: { onClick: onCustomerAssignClickOne, onDblClick: onCustomerAssignDblClick }
    };

    var customerArray = [];
    var selectArray = [];
    // uid = $.cookie('dealer_id');
    // customerArray.push({
    //     open: false,
    //     id: uid,
    //     pId: 0,
    //     name: '我的终端',
    //     icon: '/img/customer.png'
    // });

    // if($("#__customer").length > 0){
    // if($.cookie('dealer_type') == 1 || $.cookie('dealer_type') == 11 || $.cookie('dealer_type') == 2){
    //     customerArray.push({
    //         open: true,
    //         id: '2',
    //         pId: 0,
    //         name: '运营商(用户/目标)',
    //         icon: '/img/customer.png'
    //     });
    //     selectArray.push({
    //         open: true,
    //         id: '2',
    //         pId: 0,
    //         name: '运营商(用户/目标)',
    //         icon: '/img/customer.png'
    //     });
    // }
    //
    // if($.cookie('dealer_type') == 1 || $.cookie('dealer_type') == 11 || $.cookie('dealer_type') == 2 || $.cookie('dealer_type') == 8) {
    //     customerArray.push({
    //         open: false,
    //         id: '8',
    //         pId: 0,
    //         name: '集团用户(用户/目标)',
    //         icon: '/img/customer.png'
    //     });
    //     selectArray.push({
    //         open: false,
    //         id: '8',
    //         pId: 0,
    //         name: '集团用户(用户/目标)',
    //         icon: '/img/customer.png'
    //     });
    //     customerArray.push({
    //         open: false,
    //         id: '7',
    //         pId: 0,
    //         name: '个人用户(用户/目标)',
    //         icon: '/img/customer.png'
    //     });
    //     selectArray.push({
    //         open: false,
    //         id: '7',
    //         pId: 0,
    //         name: '个人用户(用户/目标)',
    //         icon: '/img/customer.png'
    //     });
    // }
    //
    // if($.cookie('dealer_type') == 7) {
    //     customerArray.push({
    //         open: false,
    //         id: '7',
    //         pId: 0,
    //         name: '个人用户(用户/目标)',
    //         icon: '/img/customer.png'
    //     });
    //     selectArray.push({
    //         open: false,
    //         id: '7',
    //         pId: 0,
    //         name: '个人用户(用户/目标)',
    //         icon: '/img/customer.png'
    //     });
    // }

    // 创建三个分类的根节点
    for (var i = 0; i < json.data.length; i++) {
        var childCount = json.data[i]['other'] ? (json.data[i]['other']['childCount'] || 0) : 0;
        var vehicleCount = json.data[i]['other'] ? (json.data[i]['other']['vehicleCount'] || 0) : 0;
        customerArray.push({
            open: false,
            id: json.data[i]['uid'],
            treePath: json.data[i]['treePath'],
            pId: json.data[i]['parentId'][0],
            name: json.data[i]['name'] + '(' + vehicleCount + ')',
            _name: json.data[i]['name'],
            icon: treeIcon[json.data[i]['custType']]
        });
        selectArray.push({
            open: false,
            id: json.data[i]['uid'],
            treePath: json.data[i]['treePath'],
            pId: json.data[i]['parentId'][0],
            name: json.data[i]['name'] + '(' + vehicleCount + ')',
            _name: json.data[i]['name'],
            icon: treeIcon[json.data[i]['custType']]
        });
    }
    // }

    $.fn.zTree.init($("#customerTree"), setting, customerArray);
    $.fn.zTree.init($("#customerTreeAssign"), settingAssignOne, selectArray);
    $.fn.zTree.init($("#dCustomerTreeAssign"), settingAssign, selectArray);

    $('#customerKey').typeahead({ source: names });
    var MM = new csMenu($("#customerTree"), $("#Menu1"), 'customerTree');

    if (uid > 0) {
        var treeObj = $.fn.zTree.getZTreeObj("customerTree");
        var node = treeObj.getNodeByParam("id", uid, null);
        if (node) {
            tree_path = node.treePath;
            cust_name = node.name;
            $('#selCustName').html(cust_name);
            treeObj.selectNode(node);
        } else {
            uid = $.cookie('dealer_id');
            tree_path = $.cookie('tree_path');
            node = treeObj.getNodeByParam("id", uid, null);
            tree_path = node.treePath;
            cust_name = node.name;
            $('#selCustName').html(cust_name);
            treeObj.selectNode(node);
        }
        if (typeof _query != "undefined") {
            _query(uid, "");
        }
    }
};

// 终端查询
function _query(cust_id) {
    var key = '';
    if ($("#deviceKey").val() !== '') {
        key = $("#deviceKey").val().trim();
    }

    var query_json;
    if (key !== "") {
        query_json = {
            uid: cust_id,
            did: '^' + key
        };
    } else {
        query_json = {
            uid: cust_id
        };
    }
    // setLoading("vehicle_list");
    // var url = wistorm_api._listUrl('_iotDevice', query_json, 'objectId,model,did,params,activeGpsData,createdAt', '-createdAt', '-createdAt', 0, 0, 1, -1, auth_code, true);
    // querySuccess(url);
    querySuccess();
}

var names = [];

function retrieveData(sSource, aoData, fnCallback) {
    var key = $('#deviceKey').val().trim();
    var query_json;
    var page_count = aoData[4].value;
    var page_no = (aoData[3].value / page_count) + 1;
    if (key != "") {
        var searchType = $('#searchType').val();
        if ($('#allNode').is(':checked')) {
            var uids = tree_path.split(",").filter(function (value) {
                return value !== '';
            });
            var _uid = uids && uids.length > 0 ? uids[uids.length - 1] : '';
            query_json = {
                uid: _uid,
                map: 'BAIDU'
            };
            if (searchType === 'params.iccid') {
                query_json[searchType] = '^' + key.toLowerCase();
            } else {
                query_json[searchType] = '^' + key;
            }
            var url = wistorm_api._listUrl('_iotDevice', query_json, '_id,uid,objectId,model,uid,did,vehicleId,vehicleName,params,activeGpsData,createdAt', '-createdAt', '-createdAt', 0, 0, page_no, page_count, auth_code, true);
            $.ajax({
                "type": "GET",
                "contentType": "application/json",
                "url": url,
                "dataType": "json",
                "data": null, //以json格式传递
                "success": function (json) {
                    json.sEcho = aoData[0].value;
                    json.iTotalRecords = json.total;
                    json.iTotalDisplayRecords = json.total;
                    for (var i = 0; i < json.data.length; i++) {
                        json.data[i].index = i;
                    }
                    json.aaData = json.data;
                    if (json.total === 1) {
                        if ($("#deviceKey").val() !== '' && json.data.length === 1) {
                            var treeObj = $.fn.zTree.getZTreeObj("customerTree");
                            var node = treeObj.getNodeByParam("id", json.data[0].uid[json.data[0].uid.length - 1], null);
                            if (node) {
                                cust_name = node.name;
                                $('#selCustName').html(cust_name);
                                treeObj.selectNode(node);
                            }
                        }
                    }
                    setTimeout(function () {
                        debugger;
                        _tableResize();
                    }, 1000);
                    fnCallback(json); //服务器端返回的对象的returnObject部分是要求的格式
                }
            });
        } else {
            query_json = {
                uid: uid,
                map: 'BAIDU'
            };
            query_json[searchType] = '^' + key;
        }
    } else {
        query_json = {
            uid: uid,
            map: 'BAIDU'
        };
    }
    exportCustomer('_iotDevice', query_json)
    $('#export').show()
   
    var url = wistorm_api._listUrl('_iotDevice', query_json, '_id,uid,objectId,model,did,vehicleId,vehicleName,params,activeGpsData,createdAt', '-createdAt', '-createdAt', 0, 0, page_no, page_count, auth_code, true);
    $.ajax({
        "type": "GET",
        "contentType": "application/json",
        "url": url,
        "dataType": "json",
        "data": null, //以json格式传递
        "success": function (json) {
            json.sEcho = aoData[0].value;
            json.iTotalRecords = json.total;
            json.iTotalDisplayRecords = json.total;
            for (var i = 0; i < json.data.length; i++) {
                json.data[i].index = i;
            }
            json.aaData = json.data;
            if (json.total === 1) {
                if ($("#deviceKey").val() !== '' && json.data.length === 1) {
                    var treeObj = $.fn.zTree.getZTreeObj("customerTree");
                    var node = treeObj.getNodeByParam("id", json.data[0].uid[json.data[0].uid.length - 1], null);
                    if (node) {
                        cust_name = node.name;
                        $('#selCustName').html(cust_name);
                        treeObj.selectNode(node);
                    }
                }
            }
            setTimeout(function () {
                _tableResize();
            }, 1000);
            fnCallback(json); //服务器端返回的对象的returnObject部分是要求的格式
        }
    });
}


var exportData;
var exportUrl = '';
var exportCustomer = function (tableName, query_json) {
    var query = query_json;
    delete query.map;
    var workType = {
        "0": i18next.t('device.wired_device'),
        "1": i18next.t('device.wireless_device')
    }
    Object.assign(workType, { 'undefined': '' })
    var workTypeString = 'enum' + JSON.stringify(workType);

    var typeChangeFn = function () {
        if (typeof v == 'undefined') {
            return ''
        } else if (typeof v == 'string' || typeof v == 'number') {
            return v
        }
    }
    var dateFn = function () {
        if (v) {
            return v
        } else {
            return ''
        }
    }
    var ICCIDFn = function () {
        if (v) {
            if (v.iccid)
                return v.iccid + ''
        }
        return ''
    }
    var versionFn = function () {
        if (v) {
            if (v.version)
                return v.version + ''
        }
        return ''
    }
    var exportObj = {
        map: 'BAIDU',
        fields: ["did", "vehicleName", "params", "model", "params", "workType", "createdAt",],
        titles: [i18next.t('device.id'), i18next.t('vehicle.name'), "ICCID", i18next.t('device.model'), i18next.t('device.version'), i18next.t('device.work_type'), i18next.t('device.import_time')],
        displays: [typeChangeFn.toString(), typeChangeFn.toString(), ICCIDFn.toString(), typeChangeFn.toString(), versionFn.toString(), workTypeString, "d"]
    };
    // var exportObj = {
    //     map: 'BAIDU',
    //     fields: ["did", "vehicleName","params", "model", "workType", "createdAt",],
    //     titles: [i18next.t('device.id'), i18next.t('vehicle.name'),"ICCID",  i18next.t('device.model'), i18next.t('device.work_type'), i18next.t('device.import_time')],
    //     displays: [typeChangeFn.toString(), typeChangeFn.toString(), ICCIDFn.toString(),typeChangeFn.toString(), workTypeString, "d"]
    // };

    // debugger;
    // exportUrl = wistorm_api._exportUrl(tableName, query, exportObj.fields.join(','), exportObj.titles.join(','), exportObj.displays.join('#'), '-createdAt', '-createdAt', exportObj.map || 'BAIDU', auth_code);
    // console.log(exportUrl)
    wistorm_api._exportPost(tableName, query, exportObj.fields.join(','), exportObj.titles.join(','), exportObj.displays.join('#'), '-createdAt', '-createdAt', exportObj.map || 'BAIDU', auth_code, function (json) {
        console.log(json, 'exportPost')
        exportData = json;
    });

}

$('#export').on('click', function () {
    var reader = new FileReader();
    reader.readAsDataURL(exportData);
    reader.onload = function (e) {
        // 转换完成，创建一个a标签用于下载
        var a = document.createElement('a');
        a.download = 'data.xlsx';
        a.href = e.target.result;
        $("body").append(a);  // 修复firefox中无法触发click
        a.click();
        $(a).remove();
    }
})

var showLocation = function showLocation(thisID, address) {
    thisID.html('(' + address + ')');
    thisID.attr('title', address);
};

var updateLoc = function () {
    setTimeout(function () {
        $(".locUpdate").each(function (i) {
            console.log(i + ',' + this);
            if (i != 0) {
                var loc = $(this).html().split(",");
                var lon = parseFloat(loc[0]);
                var lat = parseFloat(loc[1].trim());
                setLocation(i, lon, lat, $(this), showLocation);
            }
        });
    }, 100);
};

var querySuccess = function (url) {
    var gpsFlagDesc =
        ['',
            '<div class="offline">' + i18next.t("locate.bad") + '</div>',
            '<div class="online">' + i18next.t("locate.gps") + '</div>',
            '<div class="network">' + i18next.t("locate.lbs") + '</div>',
            '<div class="online">' + i18next.t("locate.bd") + '</div>'
        ];
    // var j, _j, UnContacter, Uncontacter_tel;
    // names = [];
    // for (var i = 0; i < json.data.length; i++) {
    //     json.data[i].version = json.data[i].params? json.data[i].params.version || '' : '';
    //     json.data[i].rcvTime = json.data[i].activeGpsData ? new Date(json.data[i].activeGpsData.rcvTime).format("yyyy-MM-dd hh:mm:ss"): '';
    //     json.data[i].createdAt = new Date(json.data[i].createdAt).format("yyyy-MM-dd hh:mm:ss");
    //     json.data[i].status = json.data[i].activeGpsData && getOnLine(json.data[i]) ? '在线': '离线';
    //     names.push(json.data[i].did);
    // }

    var _columns = [
        {
            "mData": null, "sClass": "center did", "searchable": false, "bSortable": false, "fnRender": function (obj) {
                return "<input type='checkbox' id='" + obj.aData.did + "' value='" + obj.aData.did + "'>";
            }
        },
        { "mData": "did", "sClass": "" },
        {
            "mData": null, "sClass": "", "fnRender": function (obj) {
                return obj.aData.vehicleName ? obj.aData.vehicleName : i18next.t("device.unbinded");
            }
        },
        {
            "mData": null, "sClass": "", "fnRender": function (obj) {
                return obj.aData.params ? obj.aData.params.iccid || '' : '';
            }
        },
        {
            "mData": null, "sClass": "center", "fnRender": function (obj) {
                return obj.aData.model ? obj.aData.model.trim() || '' : '';
            }
        },
        {
            "mData": null, "sClass": "center", "fnRender": function (obj) {
                return obj.aData.params ? obj.aData.params.version || '' : '';
            }
        },
        {
            "mData": null, "sClass": "loc", "fnRender": function (obj) {
                // return obj.aData.activeGpsData ? new Date(obj.aData.activeGpsData.rcvTime).format("MM-dd hh:mm:ss"): ''
                var desc = '';
                if (obj.aData.activeGpsData) {
                    var lon = i18next.language === 'zh' || i18next.language === 'zh-CN' ? obj.aData.activeGpsData.lon || 0 : obj.aData.activeGpsData.glon || 0;
                    var lat = i18next.language === 'zh' || i18next.language === 'zh-CN' ? obj.aData.activeGpsData.lat || 0 : obj.aData.activeGpsData.glat || 0;
                    desc = gpsFlagDesc[obj.aData.activeGpsData.gpsFlag];
                    desc += '<div style="width:260px;overflow:hidden;white-space:nowrap; text-overflow:ellipsis" id="loc' + obj.aData.did + '">(' + lon.toFixed(6) + ', ' + lat.toFixed(6) + ')</div>';
                    var interval = i18next.language === 'zh' || i18next.language === 'zh-CN' ? 300 : obj.aData.index * 300;
                    setTimeout(function () {
                        setLocation(0, lon, lat, $('#loc' + obj.aData.did), showLocation);
                    }, interval);
                }
                return desc;
            }
        },
        {
            "mData": null, "sClass": "", "fnRender": function (obj) {
                var desc = '';
                if (obj.aData.activeGpsData) {
                    desc = getOnLine(obj.aData) ? '<span class="online">' + i18next.t("system.online") + '</span>' : '<span class="offline">' + i18next.t("system.offline") + '</span>';
                    desc += '&nbsp;( <span style="white-space:nowrap" title="' + new Date(obj.aData.activeGpsData.rcvTime||obj.aData.activeGpsData.gpsTime).format("yyyy-MM-dd hh:mm:ss") + '">' + new Date(obj.aData.activeGpsData.rcvTime||obj.aData.activeGpsData.gpsTime).beautify() + '</span>)&nbsp;';
                }
                return desc;
            }
        },
        {
            "mData": null, "sClass": "center", "fnRender": function (obj) {
                return new Date(obj.aData.createdAt).format("MM-dd hh:mm:ss");
            }
        },
        {
            "mData": null, "sClass": "center", "bSortable": false, "fnRender": function (obj) {
                var op = "<a href='#' title='分配终端' data-i18n='[title]device.assign_device'><i class='icon-tag' obj_id='" + obj.aData._id + "' did='" + obj.aData.did + "' cust_id='" + obj.aData.uid + "'></i></a>";
                var delOp = "&nbsp&nbsp<a href='#' title='编辑' data-i18n='[title]table.edit'><i class='icon-edit' obj_id='" + obj.aData._id + "' did='" + obj.aData.did + "'></i></a>&nbsp&nbsp<a href='#' title='删除' data-i18n='[title]table.delete'><i class='icon-remove' obj_id='" + obj.aData.objectId + "' did='" + obj.aData.did + "'></i></a>";
                var dealer_type = parseInt($.cookie('dealer_type'));
                if ($("#__customer").length > 0) {
                    if (dealer_type === 1 || dealer_type === 2) {
                        return op + delOp;
                    } else {
                        return op;
                    }
                } else {
                    return '';
                }
            }
        }
    ];
    var lang = i18next.language || 'en';
    var objTable = {
        "bDestroy": true,
        "bAutoWidth": false,
        "sScrollX": "1430px",
        "bInfo": false,
        "iDisplayLength": 10,
        "bLengthChange": false,
        "bProcessing": true,
        "bScrollCollapse": true,
        "bServerSide": true,
        "bFilter": false,
        "aoColumns": _columns,
        "sDom": "<'row'r>t<'row'<'pull-right'p>>",
        "sPaginationType": "bootstrap",
        "oLanguage": { "sUrl": 'css/' + lang + '.txt' },
        "sAjaxSource": "",
        "fnServerData": retrieveData
    };

    $('#deviceKey').typeahead({
        source: function (query, process) {
            process(names);
        }
    });

    _table = $("#vehicle_list").dataTable(objTable);
};

var getDevices = function () {
    var devices = $("#devices").val().split(/\s+/);
    var data = [];
    for (var i = 0; i < devices.length; i++) {
        if (devices[i].trim() != '') {
            var pid = $.cookie('parent_id');
            var uids = pid === '829909845607059600' || pid === '' ? ['829909845607059600', uid] : ['829909845607059600', pid, uid];
            var create = {
                uid: uids,
                currentId: uid,
                did: devices[i].trim(),
                binded: false,
                model: $('#model').val(),
                workType: $('#workType').val()
            };
            data.push(create);
        }
    }
    return {
        data: JSON.stringify(data)
    };
};

var getAssignDevices = function () {
    var devices = $("#assginDevices").val().split(/\s+/);
    return {
        'did': devices.join('|')
    };
};

// 导入设备
var deviceImport = function () {
    if (uid === 0) {
        _alert(i18next.t("system.select_customer"));
        return;
    }
    var create_json = getDevices();
    wistorm_api._createBatch('_iotDevice', create_json, auth_code, true, addSuccess);
};

var addSuccess = function (json) {
    if (json.status_code == 0) {
        $("#divDevice").dialog("close");
        _query(uid);
    } else {
        _alert(i18next.t("device.msg_import_fail"), 3);
    }
};

// 分配设备
var deviceAssign = function () {
    if (assignUid == 0) {
        _alert(i18next.t("system.select_customer"));
        return;
    }
    var query_json = getAssignDevices();
    var update_json = {
        'uid': '+' + assignUid
    };
    wistorm_api._updatePost('_iotDevice', query_json, update_json, auth_code, true, function (json) {
        if (json.status_code == 0) {
            $("#divDeviceAssign").dialog("close");
        } else {
            _alert(i18next.t("device.msg_assign_fail"), 3);
        }
    });
};

// 修改终端
var _edit = function () {
    var auth_code = $.cookie('auth_code');
    var obj_name = $('#obj_name').val();             //车牌号码
    var annual_inspect_alert = 0;          //只针对手机客户端，是否年检提醒
    var annual_inspect_date = "";  //只针对手机客户端，年检提醒时间
    var insurance_alert = 0;               //只针对手机客户端，是否保险提醒
    var insurance_date = "";       //只针对手机客户端，保险提醒时间
    var maintain_alert = 0;                //只针对手机客户端，是否目标保养提醒
    var maintain_mileage = 0;          //只针对手机客户端，下次保养里程
    var reg_rule = {
        fee_type: { price: 120, period: 12 },
        mdt_type: { mdt_name: "WISE", protocol_ver: "1.0", fittings: ",60,61,64,63,65,", channel: 2 },
        card_type: 1,
        first_interval: 12
    };                    //只针对运营平台，需通过终端条码获取注册规则填入。对于手机客户端，保留
    var service_end_date = $('#service_end_date').val();     //针对运营平台，服务截止日期。对于手机客户端，保留
    var obj_type = $('#obj_type').val();                      //目标类型，保留
    var device_id = $('#device_id').val();     //终端ID
    var serial = $('#serial').val();              //终端条码
    var sim = $('#sim').val();                //SIM卡号
    var workType = $('#workType').val();
    var sim_type = 1;                      //SIM卡类型，保留
    var mobile_operator = "";              //运营商，保留
    var op_mobile = "";                    //主号，当前手机号，保留
    var op_mobile2 = "";                   //副号，当前手机号，保留
    var brand = 1;                         //只针对手机客户端，目标品牌  通过字典表获取dict_type=brand
    var mdt_type = 0;                      //保留
    var call_phones =
        [
            {
                manager: $('#manager').val(),
                driver: $('#driver').val(),
                phone: $('#phone').val(),
                phone1: $("#phone1").val(),
                obj_model: $("#obj_model").val()
            }                   //只针对手机客户端，用于一键呼叫
        ];                //只针对手机客户端，用于一键呼叫
    var sms_phones = "[]";                   //只针对手机客户端，暂时保留

    var obj_model = $("#obj_model").val();
    var query_json = {
        objectId: obj_id
    };
    var update_json = {
        name: obj_name,
        model: obj_model,
        did: device_id,
        sim: sim
    };
    wistorm_api._update('vehicle', query_json, update_json, auth_code, true, editSuccess);
};

var editSuccess = function (json) {
    if (json.status_code == 0) {
        $("#divVehicle").dialog("close");
        _query(uid);
    } else {
        _alert(i18next.t("device.msg_edit_fail"));
    }
};

// 删除设备
var _delete = function (did) {
    // if(uid === $.cookie('dealer_id')){
    //     var query_json = {
    //         did: did
    //     };
    //     wistorm_api._delete('_iotDevice', query_json, auth_code, true, deleteSuccess);
    // }else{
    var query_json = {
        did: did
    };
    var update_json = {
        uid: '-' + uid
    };
    wistorm_api._update('_iotDevice', query_json, update_json, auth_code, true, deleteSuccess);
    // }
};

var deleteSuccess = function (json) {
    if (json.status_code === 0) {
        _query(uid);
    } else {
        _alert(i18next.t("device.msg_delete_fail"));
    }
};

// 修改终端
var deviceEdit = function () {
    var auth_code = $.cookie('auth_code');
    var workType = $('#editWorkType').val();
    var model = $("#editModel").val();
    var query_json = {
        did: did
    };
    var update_json = {
        workType: workType,
        model: model
    };
    wistorm_api._update('_iotDevice', query_json, update_json, auth_code, true, function (json) {
        if (json.status_code == 0) {
            $("#divDeviceEdit").dialog("close");
            _query(uid);
        } else {
            _alert(i18next.t("device.msg_edit_fail"));
        }
    });
};

var updateDevice = function (did, update, callback) {
    var query = {
        did: did
    };
    wistorm_api._update('_iotDevice', query, update, auth_code, true, function (obj) {
        return callback(obj);
    });
};

var count = 0;
var countAssign = 0;

$(document).ready(function () {
    $("#alert").hide();

    $('#assign').css('display', $('#__customer').length > 0 ? 'inline-block' : 'none');

    // Initialize placeholder
    // $.Placeholder.init();
    windowResize();
    $(window).resize(function () {
        windowResize();
        // _tableResize();
    });

    $("#checkAll").click(function () {
        $("[type='checkbox'][id!=allNode]").prop("checked", $('#checkAll').prop("checked"));//全选
    });

    $(document).on("click", "#vehicle_list .icon-tag", function () {
        var obj_id = parseInt($(this).attr("obj_id"));
        var did = $(this).attr("did");
        $('#assginDevices').val(did);
        $("#countAssign").text(i18next.t("device.device_quantity") + 1);
        vehicleDeviceList();
    });

    $(document).on("click", "#vehicle_list .icon-remove", function () {
        var obj_id = parseInt($(this).attr("obj_id"));
        var did = $(this).attr("did");
        if (CloseConfirm(i18next.t("device.msg_confirm_delete", { did: did }))) {
            _delete(did);
        }
    });

    $(document).on("click", "#vehicle_list .icon-edit", function () {
        obj_id = parseInt($(this).attr("obj_id"));
        did = $(this).attr("did");
        deviceInfo(did);
    });

    $(document).on('change', '#devices', function (e) {
        count = 0;
        var data = this.value.split(/\s+/);
        data.forEach(ele => {
            if (ele.trim() != '') {
                count++
            }
        })
        $('#count').text(i18next.t("device.device_quantity") + count);
        // console.log(this.value)
        // console.log(count)
        // console.log(e.target.value,'devicestring')
    })

    $(document).on('change', '#assginDevices', function (e) {
        var data = this.value.split(/\s+/);
        countAssign = 0;
        data.forEach(ele => {
            if (ele.trim() != '') {
                countAssign++
            }
        })
        // countAssign = arr.length;
        $("#countAssign").text(i18next.t("device.device_quantity") + countAssign);

    })


    // $("#searchCustomer").click(function () {
    //     // customerQuery();
    //     var treeObj = $.fn.zTree.getZTreeObj("customerTree");
    //     var node = treeObj.getNodeByParam("name", $('#customerKey').val(), null);
    //     treeObj.selectNode(node);
    //     $('#selCustName').html(node.name);
    //     uid = node.id;
    //     _query(node.id);
    // });

    $('#searchKey').keydown(function (e) {
        var curKey = e.which;
        if (curKey == 13) {
            customerQuery();
            return false;
        }
    });


    var deviceId = setInterval(function () {
        if (!i18nextLoaded) {
            return;
        }
        var buttons = {};
        buttons[i18next.t("device.import")] = function () {
            $('#frmDevice').submit();
        };
        buttons[i18next.t("system.cancel")] = function () {
            _validator.resetForm();
            $(this).dialog("close");
        };
        // Dialog Simple
        $('#divDevice').dialog({
            autoOpen: false,
            width: 480,
            buttons: buttons
        });


        // var buttons = {};
        $('#frmDevice').submit(function () {
            if ($('#frmDevice').valid()) {
                if (CloseConfirm(i18next.t("device.msg_confirm_import", { count: count }))) {
                    deviceImport();
                }
            }
            return false;
        });

        var buttons = {};
        buttons[i18next.t("device.assign")] = function () {
            $('#frmDeviceAssign').submit();
        };
        buttons[i18next.t("system.cancel")] = function () {
            _validator.resetForm();
            $(this).dialog("close");
        };
        $('#divDeviceAssign').dialog({
            autoOpen: false,
            width: 480,
            buttons: buttons
        });

        var buttons = {};
        buttons[i18next.t("system.save")] = function () {
            $('#frmDeviceEdit').submit();
        };
        buttons[i18next.t("system.cancel")] = function () {
            _validator.resetForm();
            $(this).dialog("close");
        };
        $('#divDeviceEdit').dialog({
            autoOpen: false,
            width: 480,
            buttons: buttons
        });
        $('#frmDeviceEdit').submit(function () {
            if ($('#frmDeviceEdit').valid()) {
                deviceEdit();
            }
            return false;
        });

        $('#frmDeviceAssign').submit(function () {
            if ($('#frmDeviceAssign').valid()) {
                var count = $("#assginDevices").val().split(/\s+/).length;
                if (CloseConfirm(i18next.t("device.msg_confirm_assign", { count: count, assignName: assignName }))) {
                    deviceAssign();
                }
            }
            return false;
        });

        buttons = {};
        buttons[i18next.t("system.save")] = function () {
            $('#frmCustomer').submit();
        };
        buttons[i18next.t("system.cancel")] = function () {
            validator_customer.resetForm();
            $(this).dialog("close");
        };
        $('#divCustomer').dialog({
            autoOpen: false,
            width: 550,
            buttons: buttons
        });

        $("#frmCustomer").submit(function () {
            if ($('#frmCustomer').valid()) {
                customerEdit();
            }
            return false;
        });



        buttons[i18next.t("system.save")] = function () {
            $('#frmCustomerAssign').submit();
        };
        buttons[i18next.t("system.cancel")] = function () {
            $(this).dialog("close");
        };
        $('#divCustomerAssign').dialog({
            autoOpen: false,
            width: 480,
            buttons: buttons
        });

        $('#frmCustomerAssign').submit(function () {
            var msg = i18next.t("customer.msg_change_parent", { cust_name: cust_name, assignName: assignName }); //'你确定将用户[' + cust_name + ']的上级用户更换为[' + assignName + ']吗?';
            if (assignUid === $.cookie('parent_id')) {
                msg = i18next.t("customer.msg_restore_parent", { cust_name: cust_name }); //'你确定将用户[' + cust_name + ']恢复到上级用户进行管理吗?';
            }
            if (typeof cust_id === 'object') {

            } else {
                if (cust_id.toString() === assignUid.toString()) {
                    msg = i18next.t("customer.err_assign_me");
                    _alert(msg, 3000);
                    return false;
                }
                if (CloseConfirm(msg)) {
                    customerChangeParent(cust_id, assignUid, assignTreePath);
                }
            }
            return false;
        });

        $(document).on("click", "#Menu1 .mretweet", function () {
            cust_id = $.cookie('rightId')
            cust_name = $.cookie('rightName');
            tree_path = $.cookie('rightTree_path');
            uid = $.cookie('rightPUid');
            var title = i18next.t("customer.change_parent");
            $("#divCustomerAssign").dialog("option", "title", title);
            $("#divCustomerAssign").dialog("open");
        });

        $(document).on("click", "#Menu1 .medit", function () {
            cust_id = $.cookie('rightId')
            customerInfo(cust_id);
            initRole();
        });



        $('#deviceKey').keydown(function (e) {
            var curKey = e.which;
            if (curKey == 13) {
                _query(uid, tree_path);
                return false;
            }
        });

        $("#unbind").click(function () {
            if (!CloseConfirm(i18next.t("device.msg_confirm_unbind"))) {
                return;
            }
            var query_json = {
                did: did
            };
            var update_json = {
                did: ''
            };
            wistorm_api._update('vehicle', query_json, update_json, auth_code, true, function (json) {
                if (json.status_code == 0) {
                    // 更新设置的vehicleId和vehicleName
                    var update = {
                        vehicleId: '',
                        vehicleName: '',
                        binded: false
                    };
                    updateDevice(did, update, function (dev) {
                        if (dev.status_code == 0) {
                            _ok(i18next.t("device.msg_unbind_success"));
                            $('#editVehicleName').val('');
                            $('#unbind').css("display", "none");
                            _query(uid);
                        } else {
                            _alert(i18next.t("device.msg_unbind_fail"), 2);
                        }
                    });
                } else {
                    _alert(i18next.t("device.msg_unbind_fail"), 2);
                }
            });
        });

        _validator = $('#frmDevice').validate(
            {
                rules: {
                    devices: {
                        required: true
                    },
                    model: {
                        required: true
                    }
                },
                messages: {
                    devices: { required: i18next.t("device.devices_required") },
                    model: { required: i18next.t("device.model_required") }
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

        $('#import').click(function () {
            if (uid === 0) {
                _alert(i18next.t("system.select_customer"));
                return;
            }
            _validator.resetForm();
            $("#divDevice").dialog("open");
        });

        $('#assign').click(function () {
            var dids = $("[type='checkbox']:checked:not(#checkAll)");
            var checkDids = [];
            for (var i = 0; i < dids.length; i++) {
                checkDids.push($(dids[i]).val());
            }
            $('#assginDevices').val(checkDids.join('\r'));
            $("#countAssign").text(i18next.t("device.device_quantity") + checkDids.length);
            vehicleDeviceList();
        });

        $('#refresh').click(function () {
            _query(uid);
        });

        $('#csvfile').change(function () {
            $("input[name=csvfile]").csv2arr(function (arr) {
                console.log(arr);
                //something to do here
                var str = '';
                $.each(arr, function (i, line) {
                    str += line.join(',') + '\r';
                });
                $("#devices").val(str);
                count = arr.length;
                $("#count").text(i18next.t("device.device_quantity") + arr.length);
            });
        });
        $('#csvfileAssign').change(function () {
            $("input[name=csvfileAssign]").csv2arr(function (arr) {
                console.log(arr);
                //something to do here
                var str = '';
                $.each(arr, function (i, line) {
                    str += line.join(',') + '\r';
                });
                $("#assginDevices").val(str);
                countAssign = arr.length;
                $("#countAssign").text(i18next.t("device.device_quantity") + arr.length);
            });
        });

        // $("#devices").on('input',function() {

        // })

        validator_customer = $('#frmCustomer').validate(
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
                    cust_name: {
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
                                    return 5;
                                },
                                old_value: function () {
                                    return edit_cust_name;
                                },
                                value: function () {
                                    return $('#cust_name').val();
                                }
                            }
                        }
                    },
                    roleId: {
                        required: true
                    }
                },
                messages: {
                    username: { minlength: i18next.t("customer.username_minlength"), required: i18next.t("customer.username_required"), remote: i18next.t("customer.username_remote") },
                    password: { minlength: i18next.t("customer.password_minlength"), required: i18next.t("customer.password_required") },
                    password2: { required: i18next.t("customer.password2_required"), minlength: i18next.t("customer.password2_minlength"), equalTo: i18next.t("customer.password2_equalTo") },
                    cust_name: { minlength: i18next.t("customer.cust_name_minlength"), required: i18next.t("customer.cust_name_required"), remote: i18next.t("customer.cust_name_remote") },
                    roleId: { required: i18next.t("customer.roleId_required") }
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
        clearInterval(deviceId);
    }, 100);
});