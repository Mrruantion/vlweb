/**
 * Created with JetBrains WebStorm.
 * User: 1
 * Date: 13-8-26
 * Time: 下午11:33
 * To change this template use File | Settings | File Templates.
 */
var auth_code = $.cookie('auth_code');
var dealer_name = $.cookie('name');
var doing = false;
var assignUid = 0;
var assignName = '';
var assignTreePath = '';
var vehicle_flag = 1;   //1: 新增  2: 修改
var edit_cust_name = '';
var edit_obj_name = '';
var edit_sim = '';
var edit_serial = '';
var vehicle_table;
var cust_id = 0;
var uid = 0;
var parent_cust_id = 0;
var cust_name = "";
var user_name = "";
var obj_id = 0;
var obj_name = '';
var did = '';
var tree_path = '';
var is_depart = false;
var level = 0;
var validator_vehicle;
var selectNode = null;
var assignDepartId = 0;
var assignDepartName = '';
var departs = {};
var dealer_type = $.cookie('dealer_type');
var login_depart_id = $.cookie('login_depart_id');
var oDepartmentData = {};
var customers = [];
var validator_customer;
var roleIds = [];
var changeType = 2;
var cust_typeObj = {};
var watchBalance;

function windowResize() {
    var height = $(window).height() - 122;
    $('#customerTree').css({ "height": height + "px" });
}



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

function customerInfo(objectId, callback) {
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
                var rolename = roleData ? roleData.name : '';
                json.data.roleId = roleId;
                console.log(roleData);
                if (callback) {
                    json.data.roleName = rolename
                    callback(json.data);
                    return;
                }
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
    wistorm_api._get('customer', { uid: uid }, 'objectId,uid,name,custType,custTypeId,parentId,contact,tel,createdAt,updatedAt,roleId,role', auth_code, true, function (json) {
        if (json.status_code == 0) {
            callback(json.data)
        }
    })
}



var customerInfoSuccess = function (json) {
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
function vehicleInfo(obj_id) {
    // var auth_code = $.cookie('auth_code');
    // var searchUrl = $.cookie('Host') + "vehicle/" + obj_id;
    // var searchData = { auth_code:auth_code };
    // var searchObj = { type:"GET", url:searchUrl, data:searchData, success:function (json) {
    //     vehicleInfoSuccess(json);
    // }, error:OnError };
    // ajax_function(searchObj);
    query_json = {
        objectId: obj_id
    };
    wistorm_api._get('vehicle', query_json, 'objectId,uid,departId,name,model,did,sim,serviceExpireIn,contact,tel,remark,inspectExpireIn,maintainMileage,maintainExpireIn,insuranceExpireIn,objectType,fuelTankCapacity', auth_code, true, function (json) {
        vehicleInfoSuccess(json.data);
    });
}
//报警设置
var deviceInfo = function (did) {
    var ulInner = function (data) {
        var liText = '';
        var isAllSelect = true;
        $('.ulClass').empty();
        for (var i in data) {
            if (typeof data[i] == 'number') {
                liText = `<li><input type="checkbox" name="alert" checked id=${data[i]} value=${data[i]}><label for=${data[i]}>${i}</label> </li>`;
            } else {
                liText = `<li><input type="checkbox" name="alert" ${data[i].check ? 'checked' : ''} id=${data[i].value} value=${data[i].value}><label for=${data[i].value}>${i}</label> </li>`;
                if (!data[i].check) {
                    isAllSelect = false;
                }
            }
            $('.ulClass').append(liText);

        }
        // $('#_selectAll').empty();
        liText = `<li style="width:100%"><input type="checkbox" ${isAllSelect ? 'checked' : ''} id="isAllSelect" value='2'><label for="isAllSelect">${i18next.t('vehicle.all_not')}</label> </li>`;
        $('.ulClass').prepend(liText)

        $('#isAllSelect').on('click', function () {
            $("input[name='alert']").prop("checked", $('#isAllSelect').prop("checked"));//全选
        })
    }
    if (!did) {
        ulInner(alertType)
        return;
    }
    var query_json = {
        did: did
    }
    wistorm_api._get('_iotDevice', query_json, 'params,objectId,did', auth_code, true, function (json) {
        var alertOptions = json.data ? (json.data.params ? json.data.params.alertOptions : null) : null;
        if (!alertOptions) {
            ulInner(alertType);
        } else {
            var _check = {};
            if (!alertOptions.length) {
                for (var o in alertType) {
                    _check[o] = {
                        value: alertType[o],
                        check: false
                    }
                }
                ulInner(_check);
                return;
            }
            alertOptions.forEach((e, i) => {
                for (var o in alertType) {
                    if (_check[o]) {
                        if (!_check[o].check) {
                            if (e == alertType[o]) {
                                _check[o].check = true;
                            }
                        }
                    } else {
                        _check[o] = {
                            value: alertType[o]
                        }
                        if (e == alertType[o]) {
                            _check[o].check = true;
                        }
                    }
                }
            })
            ulInner(_check)
        }
    });
}


function vehicleCustomerList(obj_id, obj_name, cust_id) {
    initFrmCustomerList("更换用户", obj_id, obj_name, cust_id);
    $("#divCustomerList").dialog("open");
}

// 跳转到日志页面
function logInfo(device_id) {
    var logUrl = "/datalog?device_id=" + device_id;
    window.location.href = logUrl;
}

function showCustomerInfo(uid) {
    customerInfo(uid, function (cus) {
        console.log(cus);
        $('#pname').val(cus.name);
        $('#ptel').val(cus.tel || ' ');
        $('#pcontact').val(cus.contact || ' ');
        $('#pcreate_time').val(new Date(cus.createdAt).format('yyyy-MM-dd hh:mm:ss'));
        $('#pcust_type').val(cust_typeObj[cus.custType] || '');
        $('#plogin_username').val(cus.username);
        $('#prole').val(cus.roleName)
    })
}

var vehicleInfoSuccess = function (json) {
    //alert(json);

    deviceInfo(json.did);
    showCustomerInfo(json.uid)

    // otherCustomer(json.uid,function(cu){
    //     // console.log(cu)
    //     debugger;
    //     $('#pname').val(cu.name);
    //     $('#ptel').val(cu.tel || ' ');
    //     $('#pcontact').val(cu.contact || ' ');
    //     $('#pcreate_time').val('')
    // })
    // console.log(json)
    validator_vehicle.resetForm();
    json.serviceExpireIn = NewDate(json.serviceExpireIn);
    json.serviceExpireIn = json.serviceExpireIn.format("yyyy-MM-dd");
    json.maintainExpireIn = json.maintainExpireIn || '';
    json.insuranceExpireIn = json.insuranceExpireIn || '';
    json.inspectExpireIn = json.inspectExpireIn || '';
    json.maintainExpireIn = json.maintainExpireIn.indexOf('T') > -1 ? NewDate(json.maintainExpireIn) : '';
    json.insuranceExpireIn = json.insuranceExpireIn.indexOf('T') > -1 ? NewDate(json.insuranceExpireIn) : '';
    json.inspectExpireIn = json.inspectExpireIn.indexOf('T') > -1 ? NewDate(json.inspectExpireIn) : '';
    // json.serviceExpireIn = json.serviceExpireIn.format("yyyy-MM-dd");
    json.maintainExpireIn = json.maintainExpireIn.format("yyyy-MM-dd");
    json.insuranceExpireIn = json.insuranceExpireIn.format("yyyy-MM-dd");
    json.inspectExpireIn = json.inspectExpireIn.format("yyyy-MM-dd");
    var title = i18next.t("vehicle.edit_vehicle");
    // initFrmVehicle(title, 2, json.name, json.did, json.sim, json.model, json.serviceExpireIn, json.contact, json.tel, json.remark, json.departId);
    initFrmVehicle(title, 2, json.name, json.did, json.sim, json.model, json.maintainMileage, json.maintainExpireIn, json.insuranceExpireIn, json.inspectExpireIn, json.serviceExpireIn, json.contact, json.tel, json.objectType, json.fuelTankCapacity, json.remark, json.departId);
    $("#divVehicle").dialog("open");
};


// 初始化目标信息窗体
var initFrmVehicle = function (title, flag, obj_name, device_id, sim, obj_model, maintainMileage, maintainExpireIn, insuranceExpireIn, inspectExpireIn, service_end_date, contact, tel, objectType, fuelTankCapacity, remark, departId) {
    $("#divVehicle").dialog("option", "title", title);
    vehicle_flag = flag;
    $('#obj_name').val(obj_name);
    $('#depart_name').val(departs[departId] || '');
    edit_obj_name = obj_name;
    $('#device_id').val(device_id);
    $('#sim').val(sim);
    edit_sim = sim;
    assignDepartId = departId;
    $('#obj_model').val(obj_model);
    $('#contact').val(contact);
    $('#tel').val(tel);
    $('#remark').val(remark);
    $('#objectType').val(objectType || 0)
    $('#fuelTankCapacity').val(fuelTankCapacity)
    $('#inspectExpireIn').val(inspectExpireIn);
    $('#maintainMileage').val(maintainMileage);
    $('#maintainExpireIn').val(maintainExpireIn);
    $('#insuranceExpireIn').val(insuranceExpireIn)

    $('#service_end_date').val(service_end_date);
    if (vehicle_flag == 1) {
        $('#device_id').removeAttr("disabled");
        $('#service_panel').show();
        $('#service_end_date_panel').hide();
    } else {
        if (device_id != '') {
            $('#device_id').attr("disabled", "disabled");
            $('#bind').css("display", "none");
            $('#unbind').css("display", "inline-block");
        } else {
            $('#device_id').removeAttr("disabled");
            $('#bind').css("display", "inline-block");
            $('#unbind').css("display", "none");
        }
        $('#service_panel').hide();
        $('#service_end_date_panel').show();
    }
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

function getAllDepart() {
    var dealer_type = $.cookie('dealer_type');
    var dealer_id = $.cookie('dealer_id');

    var query_json = {
        uid: dealer_id
    };
    wistorm_api._list('department', query_json, 'objectId,name,parentId,uid', 'name', 'name', 0, 0, 1, -1, auth_code, true, function (json) {
        var onCustomerAssignClick = function (event, treeId, treeNode) {
            if (parseInt(treeNode.id) > -1) {
                assignDepartId = treeNode.id;
                assignDepartName = treeNode.name;
            }
        };

        var settingAssign = {
            view: { showIcon: true },
            check: { enable: false, chkStyle: "checkbox" },
            data: { simpleData: { enable: true } },
            callback: { onClick: onCustomerAssignClick }
        };

        var selectArray = [];
        var rootArray = [];
        selectArray.push({
            open: false,
            id: dealer_id,
            pId: 0,
            name: dealer_name,
            icon: treeIcon['8']
        });
        // 创建三个分类的根节点
        for (var i = 0; i < json.data.length; i++) {
            // 如果为成员登陆，则加载本级及下级
            if (['9', '12', '13'].indexOf(dealer_type) > -1) {
                if (json.data[i].objectId.toString() !== login_depart_id && json.data[i].parentId.toString() !== login_depart_id) {
                    continue;
                }
            }
            departs[json.data[i].objectId.toString()] = json.data[i].name;
            var pId = dealer_id;
            if (json.data[i]['parentId'] > 0) {
                pId = json.data[i]['parentId'];
            }
            selectArray.push({
                open: false,
                id: json.data[i]['objectId'],
                treePath: json.data[i]['treePath'],
                pId: pId,
                name: json.data[i]['name'],
                icon: treeIcon['99'],
                isDepart: true
            });
            rootArray.push({
                open: false,
                id: json.data[i]['objectId'],
                treePath: json.data[i]['treePath'],
                pId: pId,
                name: json.data[i]['name'],
                icon: treeIcon['99'],
                isDepart: true
            });
        }
        $.fn.zTree.init($("#departTreeAssign"), settingAssign, selectArray);
        var treeObj = $.fn.zTree.getZTreeObj("customerTree");
        if (treeObj) {
            var root = treeObj.getNodeByParam("id", dealer_id, null);
            if (root) {
                treeObj.addNodes(root, rootArray);
            }
        }
    });
}

var z = new Array(); z[0x00A4] = 'A1E8'; z[0x00A7] = 'A1EC'; z[0x00A8] = 'A1A7'; z[0x00B0] = 'A1E3'; z[0x00B1] = 'A1C0'; z[0x00B7] = 'A1A4'; z[0x00D7] = 'A1C1'; z[0x00E0] = 'A8A4'; z[0x00E1] = 'A8A2'; z[0x00E8] = 'A8A8'; z[0x00E9] = 'A8A6'; z[0x00EA] = 'A8BA'; z[0x00EC] = 'A8AC'; z[0x00ED] = 'A8AA'; z[0x00F2] = 'A8B0'; z[0x00F3] = 'A8AE'; z[0x00F7] = 'A1C2'; z[0x00F9] = 'A8B4'; z[0x00FA] = 'A8B2'; z[0x00FC] = 'A8B9'; z[0x0101] = 'A8A1'; z[0x0113] = 'A8A5'; z[0x011B] = 'A8A7'; z[0x012B] = 'A8A9'; z[0x014D] = 'A8AD'; z[0x016B] = 'A8B1'; z[0x01CE] = 'A8A3'; z[0x01D0] = 'A8AB'; z[0x01D2] = 'A8AF'; z[0x01D4] = 'A8B3'; z[0x01D6] = 'A8B5'; z[0x01D8] = 'A8B6'; z[0x01DA] = 'A8B7'; z[0x01DC] = 'A8B8'; z[0x02C7] = 'A1A6'; z[0x02C9] = 'A1A5'; z[0x0391] = 'A6A1'; z[0x0392] = 'A6A2'; z[0x0393] = 'A6A3'; z[0x0394] = 'A6A4'; z[0x0395] = 'A6A5'; z[0x0396] = 'A6A6'; z[0x0397] = 'A6A7'; z[0x0398] = 'A6A8'; z[0x0399] = 'A6A9'; z[0x039A] = 'A6AA'; z[0x039B] = 'A6AB'; z[0x039C] = 'A6AC'; z[0x039D] = 'A6AD'; z[0x039E] = 'A6AE'; z[0x039F] = 'A6AF'; z[0x03A0] = 'A6B0'; z[0x03A1] = 'A6B1'; z[0x03A3] = 'A6B2'; z[0x03A4] = 'A6B3'; z[0x03A5] = 'A6B4'; z[0x03A6] = 'A6B5'; z[0x03A7] = 'A6B6'; z[0x03A8] = 'A6B7'; z[0x03A9] = 'A6B8'; z[0x03B1] = 'A6C1'; z[0x03B2] = 'A6C2'; z[0x03B3] = 'A6C3'; z[0x03B4] = 'A6C4'; z[0x03B5] = 'A6C5'; z[0x03B6] = 'A6C6'; z[0x03B7] = 'A6C7'; z[0x03B8] = 'A6C8'; z[0x03B9] = 'A6C9'; z[0x03BA] = 'A6CA'; z[0x03BB] = 'A6CB'; z[0x03BC] = 'A6CC'; z[0x03BD] = 'A6CD'; z[0x03BE] = 'A6CE'; z[0x03BF] = 'A6CF'; z[0x03C0] = 'A6D0'; z[0x03C1] = 'A6D1'; z[0x03C3] = 'A6D2'; z[0x03C4] = 'A6D3'; z[0x03C5] = 'A6D4'; z[0x03C6] = 'A6D5'; z[0x03C7] = 'A6D6'; z[0x03C8] = 'A6D7'; z[0x03C9] = 'A6D8'; z[0x0401] = 'A7A7'; z[0x0410] = 'A7A1'; z[0x0411] = 'A7A2'; z[0x0412] = 'A7A3'; z[0x0413] = 'A7A4'; z[0x0414] = 'A7A5'; z[0x0415] = 'A7A6'; z[0x0416] = 'A7A8'; z[0x0417] = 'A7A9'; z[0x0418] = 'A7AA'; z[0x0419] = 'A7AB'; z[0x041A] = 'A7AC'; z[0x041B] = 'A7AD'; z[0x041C] = 'A7AE'; z[0x041D] = 'A7AF'; z[0x041E] = 'A7B0'; z[0x041F] = 'A7B1'; z[0x0420] = 'A7B2'; z[0x0421] = 'A7B3'; z[0x0422] = 'A7B4'; z[0x0423] = 'A7B5'; z[0x0424] = 'A7B6'; z[0x0425] = 'A7B7'; z[0x0426] = 'A7B8'; z[0x0427] = 'A7B9'; z[0x0428] = 'A7BA'; z[0x0429] = 'A7BB'; z[0x042A] = 'A7BC'; z[0x042B] = 'A7BD'; z[0x042C] = 'A7BE'; z[0x042D] = 'A7BF'; z[0x042E] = 'A7C0'; z[0x042F] = 'A7C1'; z[0x0430] = 'A7D1'; z[0x0431] = 'A7D2'; z[0x0432] = 'A7D3'; z[0x0433] = 'A7D4'; z[0x0434] = 'A7D5'; z[0x0435] = 'A7D6'; z[0x0436] = 'A7D8'; z[0x0437] = 'A7D9'; z[0x0438] = 'A7DA'; z[0x0439] = 'A7DB'; z[0x043A] = 'A7DC'; z[0x043B] = 'A7DD'; z[0x043C] = 'A7DE'; z[0x043D] = 'A7DF'; z[0x043E] = 'A7E0'; z[0x043F] = 'A7E1'; z[0x0440] = 'A7E2'; z[0x0441] = 'A7E3'; z[0x0442] = 'A7E4'; z[0x0443] = 'A7E5'; z[0x0444] = 'A7E6'; z[0x0445] = 'A7E7'; z[0x0446] = 'A7E8'; z[0x0447] = 'A7E9'; z[0x0448] = 'A7EA'; z[0x0449] = 'A7EB'; z[0x044A] = 'A7EC'; z[0x044B] = 'A7ED'; z[0x044C] = 'A7EE'; z[0x044D] = 'A7EF'; z[0x044E] = 'A7F0'; z[0x044F] = 'A7F1'; z[0x0451] = 'A7D7'; z[0x2014] = 'A1AA'; z[0x2016] = 'A1AC'; z[0x2018] = 'A1AE'; z[0x2019] = 'A1AF'; z[0x201C] = 'A1B0'; z[0x201D] = 'A1B1'; z[0x2026] = 'A1AD'; z[0x2030] = 'A1EB'; z[0x2032] = 'A1E4'; z[0x2033] = 'A1E5'; z[0x203B] = 'A1F9'; z[0x2103] = 'A1E6'; z[0x2116] = 'A1ED'; z[0x2160] = 'A2F1'; z[0x2161] = 'A2F2'; z[0x2162] = 'A2F3'; z[0x2163] = 'A2F4'; z[0x2164] = 'A2F5'; z[0x2165] = 'A2F6'; z[0x2166] = 'A2F7'; z[0x2167] = 'A2F8'; z[0x2168] = 'A2F9'; z[0x2169] = 'A2FA'; z[0x216A] = 'A2FB'; z[0x216B] = 'A2FC'; z[0x2190] = 'A1FB'; z[0x2191] = 'A1FC'; z[0x2192] = 'A1FA'; z[0x2193] = 'A1FD'; z[0x2208] = 'A1CA'; z[0x220F] = 'A1C7'; z[0x2211] = 'A1C6'; z[0x221A] = 'A1CC'; z[0x221D] = 'A1D8'; z[0x221E] = 'A1DE'; z[0x2220] = 'A1CF'; z[0x2225] = 'A1CE'; z[0x2227] = 'A1C4'; z[0x2228] = 'A1C5'; z[0x2229] = 'A1C9'; z[0x222A] = 'A1C8'; z[0x222B] = 'A1D2'; z[0x222E] = 'A1D3'; z[0x2234] = 'A1E0'; z[0x2235] = 'A1DF'; z[0x2236] = 'A1C3'; z[0x2237] = 'A1CB'; z[0x223D] = 'A1D7'; z[0x2248] = 'A1D6'; z[0x224C] = 'A1D5'; z[0x2260] = 'A1D9'; z[0x2261] = 'A1D4'; z[0x2264] = 'A1DC'; z[0x2265] = 'A1DD'; z[0x226E] = 'A1DA'; z[0x226F] = 'A1DB'; z[0x2299] = 'A1D1'; z[0x22A5] = 'A1CD'; z[0x2312] = 'A1D0'; z[0x2460] = 'A2D9'; z[0x2461] = 'A2DA'; z[0x2462] = 'A2DB'; z[0x2463] = 'A2DC'; z[0x2464] = 'A2DD'; z[0x2465] = 'A2DE'; z[0x2466] = 'A2DF'; z[0x2467] = 'A2E0'; z[0x2468] = 'A2E1'; z[0x2469] = 'A2E2'; z[0x2474] = 'A2C5'; z[0x2475] = 'A2C6'; z[0x2476] = 'A2C7'; z[0x2477] = 'A2C8'; z[0x2478] = 'A2C9'; z[0x2479] = 'A2CA'; z[0x247A] = 'A2CB'; z[0x247B] = 'A2CC'; z[0x247C] = 'A2CD'; z[0x247D] = 'A2CE'; z[0x247E] = 'A2CF'; z[0x247F] = 'A2D0'; z[0x2480] = 'A2D1'; z[0x2481] = 'A2D2'; z[0x2482] = 'A2D3'; z[0x2483] = 'A2D4'; z[0x2484] = 'A2D5'; z[0x2485] = 'A2D6'; z[0x2486] = 'A2D7'; z[0x2487] = 'A2D8'; z[0x2488] = 'A2B1'; z[0x2489] = 'A2B2'; z[0x248A] = 'A2B3'; z[0x248B] = 'A2B4'; z[0x248C] = 'A2B5'; z[0x248D] = 'A2B6'; z[0x248E] = 'A2B7'; z[0x248F] = 'A2B8'; z[0x2490] = 'A2B9'; z[0x2491] = 'A2BA'; z[0x2492] = 'A2BB'; z[0x2493] = 'A2BC'; z[0x2494] = 'A2BD'; z[0x2495] = 'A2BE'; z[0x2496] = 'A2BF'; z[0x2497] = 'A2C0'; z[0x2498] = 'A2C1'; z[0x2499] = 'A2C2'; z[0x249A] = 'A2C3'; z[0x249B] = 'A2C4'; z[0x2500] = 'A9A4'; z[0x2501] = 'A9A5'; z[0x2502] = 'A9A6'; z[0x2503] = 'A9A7'; z[0x2504] = 'A9A8'; z[0x2505] = 'A9A9'; z[0x2506] = 'A9AA'; z[0x2507] = 'A9AB'; z[0x2508] = 'A9AC'; z[0x2509] = 'A9AD'; z[0x250A] = 'A9AE'; z[0x250B] = 'A9AF'; z[0x250C] = 'A9B0'; z[0x250D] = 'A9B1'; z[0x250E] = 'A9B2'; z[0x250F] = 'A9B3'; z[0x2510] = 'A9B4'; z[0x2511] = 'A9B5'; z[0x2512] = 'A9B6'; z[0x2513] = 'A9B7'; z[0x2514] = 'A9B8'; z[0x2515] = 'A9B9'; z[0x2516] = 'A9BA'; z[0x2517] = 'A9BB'; z[0x2518] = 'A9BC'; z[0x2519] = 'A9BD'; z[0x251A] = 'A9BE'; z[0x251B] = 'A9BF'; z[0x251C] = 'A9C0'; z[0x251D] = 'A9C1'; z[0x251E] = 'A9C2'; z[0x251F] = 'A9C3'; z[0x2520] = 'A9C4'; z[0x2521] = 'A9C5'; z[0x2522] = 'A9C6'; z[0x2523] = 'A9C7'; z[0x2524] = 'A9C8'; z[0x2525] = 'A9C9'; z[0x2526] = 'A9CA'; z[0x2527] = 'A9CB'; z[0x2528] = 'A9CC'; z[0x2529] = 'A9CD'; z[0x252A] = 'A9CE'; z[0x252B] = 'A9CF'; z[0x252C] = 'A9D0'; z[0x252D] = 'A9D1'; z[0x252E] = 'A9D2'; z[0x252F] = 'A9D3'; z[0x2530] = 'A9D4'; z[0x2531] = 'A9D5'; z[0x2532] = 'A9D6'; z[0x2533] = 'A9D7'; z[0x2534] = 'A9D8'; z[0x2535] = 'A9D9'; z[0x2536] = 'A9DA'; z[0x2537] = 'A9DB'; z[0x2538] = 'A9DC'; z[0x2539] = 'A9DD'; z[0x253A] = 'A9DE'; z[0x253B] = 'A9DF'; z[0x253C] = 'A9E0'; z[0x253D] = 'A9E1'; z[0x253E] = 'A9E2'; z[0x253F] = 'A9E3'; z[0x2540] = 'A9E4'; z[0x2541] = 'A9E5'; z[0x2542] = 'A9E6'; z[0x2543] = 'A9E7'; z[0x2544] = 'A9E8'; z[0x2545] = 'A9E9'; z[0x2546] = 'A9EA'; z[0x2547] = 'A9EB'; z[0x2548] = 'A9EC'; z[0x2549] = 'A9ED'; z[0x254A] = 'A9EE'; z[0x254B] = 'A9EF'; z[0x25A0] = 'A1F6'; z[0x25A1] = 'A1F5'; z[0x25B2] = 'A1F8'; z[0x25B3] = 'A1F7'; z[0x25C6] = 'A1F4'; z[0x25C7] = 'A1F3'; z[0x25CB] = 'A1F0'; z[0x25CE] = 'A1F2'; z[0x25CF] = 'A1F1'; z[0x2605] = 'A1EF'; z[0x2606] = 'A1EE'; z[0x2640] = 'A1E2'; z[0x2642] = 'A1E1'; z[0x3000] = 'A1A1'; z[0x3001] = 'A1A2'; z[0x3002] = 'A1A3'; z[0x3003] = 'A1A8'; z[0x3005] = 'A1A9'; z[0x3008] = 'A1B4'; z[0x3009] = 'A1B5'; z[0x300A] = 'A1B6'; z[0x300B] = 'A1B7'; z[0x300C] = 'A1B8'; z[0x300D] = 'A1B9'; z[0x300E] = 'A1BA'; z[0x300F] = 'A1BB'; z[0x3010] = 'A1BE'; z[0x3011] = 'A1BF'; z[0x3013] = 'A1FE'; z[0x3014] = 'A1B2'; z[0x3015] = 'A1B3'; z[0x3016] = 'A1BC'; z[0x3017] = 'A1BD'; z[0x3041] = 'A4A1'; z[0x3042] = 'A4A2'; z[0x3043] = 'A4A3'; z[0x3044] = 'A4A4'; z[0x3045] = 'A4A5'; z[0x3046] = 'A4A6'; z[0x3047] = 'A4A7'; z[0x3048] = 'A4A8'; z[0x3049] = 'A4A9'; z[0x304A] = 'A4AA'; z[0x304B] = 'A4AB'; z[0x304C] = 'A4AC'; z[0x304D] = 'A4AD'; z[0x304E] = 'A4AE'; z[0x304F] = 'A4AF'; z[0x3050] = 'A4B0'; z[0x3051] = 'A4B1'; z[0x3052] = 'A4B2'; z[0x3053] = 'A4B3'; z[0x3054] = 'A4B4'; z[0x3055] = 'A4B5'; z[0x3056] = 'A4B6'; z[0x3057] = 'A4B7'; z[0x3058] = 'A4B8'; z[0x3059] = 'A4B9'; z[0x305A] = 'A4BA'; z[0x305B] = 'A4BB'; z[0x305C] = 'A4BC'; z[0x305D] = 'A4BD'; z[0x305E] = 'A4BE'; z[0x305F] = 'A4BF'; z[0x3060] = 'A4C0'; z[0x3061] = 'A4C1'; z[0x3062] = 'A4C2'; z[0x3063] = 'A4C3'; z[0x3064] = 'A4C4'; z[0x3065] = 'A4C5'; z[0x3066] = 'A4C6'; z[0x3067] = 'A4C7'; z[0x3068] = 'A4C8'; z[0x3069] = 'A4C9'; z[0x306A] = 'A4CA'; z[0x306B] = 'A4CB'; z[0x306C] = 'A4CC'; z[0x306D] = 'A4CD'; z[0x306E] = 'A4CE'; z[0x306F] = 'A4CF'; z[0x3070] = 'A4D0'; z[0x3071] = 'A4D1'; z[0x3072] = 'A4D2'; z[0x3073] = 'A4D3'; z[0x3074] = 'A4D4'; z[0x3075] = 'A4D5'; z[0x3076] = 'A4D6'; z[0x3077] = 'A4D7'; z[0x3078] = 'A4D8'; z[0x3079] = 'A4D9'; z[0x307A] = 'A4DA'; z[0x307B] = 'A4DB'; z[0x307C] = 'A4DC'; z[0x307D] = 'A4DD'; z[0x307E] = 'A4DE'; z[0x307F] = 'A4DF'; z[0x3080] = 'A4E0'; z[0x3081] = 'A4E1'; z[0x3082] = 'A4E2'; z[0x3083] = 'A4E3'; z[0x3084] = 'A4E4'; z[0x3085] = 'A4E5'; z[0x3086] = 'A4E6'; z[0x3087] = 'A4E7'; z[0x3088] = 'A4E8'; z[0x3089] = 'A4E9'; z[0x308A] = 'A4EA'; z[0x308B] = 'A4EB'; z[0x308C] = 'A4EC'; z[0x308D] = 'A4ED'; z[0x308E] = 'A4EE'; z[0x308F] = 'A4EF'; z[0x3090] = 'A4F0'; z[0x3091] = 'A4F1'; z[0x3092] = 'A4F2'; z[0x3093] = 'A4F3'; z[0x30A1] = 'A5A1'; z[0x30A2] = 'A5A2'; z[0x30A3] = 'A5A3'; z[0x30A4] = 'A5A4'; z[0x30A5] = 'A5A5'; z[0x30A6] = 'A5A6'; z[0x30A7] = 'A5A7'; z[0x30A8] = 'A5A8'; z[0x30A9] = 'A5A9'; z[0x30AA] = 'A5AA'; z[0x30AB] = 'A5AB'; z[0x30AC] = 'A5AC'; z[0x30AD] = 'A5AD'; z[0x30AE] = 'A5AE'; z[0x30AF] = 'A5AF'; z[0x30B0] = 'A5B0'; z[0x30B1] = 'A5B1'; z[0x30B2] = 'A5B2'; z[0x30B3] = 'A5B3'; z[0x30B4] = 'A5B4'; z[0x30B5] = 'A5B5'; z[0x30B6] = 'A5B6'; z[0x30B7] = 'A5B7'; z[0x30B8] = 'A5B8'; z[0x30B9] = 'A5B9'; z[0x30BA] = 'A5BA'; z[0x30BB] = 'A5BB'; z[0x30BC] = 'A5BC'; z[0x30BD] = 'A5BD'; z[0x30BE] = 'A5BE'; z[0x30BF] = 'A5BF'; z[0x30C0] = 'A5C0'; z[0x30C1] = 'A5C1'; z[0x30C2] = 'A5C2'; z[0x30C3] = 'A5C3'; z[0x30C4] = 'A5C4'; z[0x30C5] = 'A5C5'; z[0x30C6] = 'A5C6'; z[0x30C7] = 'A5C7'; z[0x30C8] = 'A5C8'; z[0x30C9] = 'A5C9'; z[0x30CA] = 'A5CA'; z[0x30CB] = 'A5CB'; z[0x30CC] = 'A5CC'; z[0x30CD] = 'A5CD'; z[0x30CE] = 'A5CE'; z[0x30CF] = 'A5CF'; z[0x30D0] = 'A5D0'; z[0x30D1] = 'A5D1'; z[0x30D2] = 'A5D2'; z[0x30D3] = 'A5D3'; z[0x30D4] = 'A5D4'; z[0x30D5] = 'A5D5'; z[0x30D6] = 'A5D6'; z[0x30D7] = 'A5D7'; z[0x30D8] = 'A5D8'; z[0x30D9] = 'A5D9'; z[0x30DA] = 'A5DA'; z[0x30DB] = 'A5DB'; z[0x30DC] = 'A5DC'; z[0x30DD] = 'A5DD'; z[0x30DE] = 'A5DE'; z[0x30DF] = 'A5DF'; z[0x30E0] = 'A5E0'; z[0x30E1] = 'A5E1'; z[0x30E2] = 'A5E2'; z[0x30E3] = 'A5E3'; z[0x30E4] = 'A5E4'; z[0x30E5] = 'A5E5'; z[0x30E6] = 'A5E6'; z[0x30E7] = 'A5E7'; z[0x30E8] = 'A5E8'; z[0x30E9] = 'A5E9'; z[0x30EA] = 'A5EA'; z[0x30EB] = 'A5EB'; z[0x30EC] = 'A5EC'; z[0x30ED] = 'A5ED'; z[0x30EE] = 'A5EE'; z[0x30EF] = 'A5EF'; z[0x30F0] = 'A5F0'; z[0x30F1] = 'A5F1'; z[0x30F2] = 'A5F2'; z[0x30F3] = 'A5F3'; z[0x30F4] = 'A5F4'; z[0x30F5] = 'A5F5'; z[0x30F6] = 'A5F6'; z[0x3105] = 'A8C5'; z[0x3106] = 'A8C6'; z[0x3107] = 'A8C7'; z[0x3108] = 'A8C8'; z[0x3109] = 'A8C9'; z[0x310A] = 'A8CA'; z[0x310B] = 'A8CB'; z[0x310C] = 'A8CC'; z[0x310D] = 'A8CD'; z[0x310E] = 'A8CE'; z[0x310F] = 'A8CF'; z[0x3110] = 'A8D0'; z[0x3111] = 'A8D1'; z[0x3112] = 'A8D2'; z[0x3113] = 'A8D3'; z[0x3114] = 'A8D4'; z[0x3115] = 'A8D5'; z[0x3116] = 'A8D6'; z[0x3117] = 'A8D7'; z[0x3118] = 'A8D8'; z[0x3119] = 'A8D9'; z[0x311A] = 'A8DA'; z[0x311B] = 'A8DB'; z[0x311C] = 'A8DC'; z[0x311D] = 'A8DD'; z[0x311E] = 'A8DE'; z[0x311F] = 'A8DF'; z[0x3120] = 'A8E0'; z[0x3121] = 'A8E1'; z[0x3122] = 'A8E2'; z[0x3123] = 'A8E3'; z[0x3124] = 'A8E4'; z[0x3125] = 'A8E5'; z[0x3126] = 'A8E6'; z[0x3127] = 'A8E7'; z[0x3128] = 'A8E8'; z[0x3129] = 'A8E9'; z[0x3220] = 'A2E5'; z[0x3221] = 'A2E6'; z[0x3222] = 'A2E7'; z[0x3223] = 'A2E8'; z[0x3224] = 'A2E9'; z[0x3225] = 'A2EA'; z[0x3226] = 'A2EB'; z[0x3227] = 'A2EC'; z[0x3228] = 'A2ED'; z[0x3229] = 'A2EE'; z[0x4E00] = 'D2BB'; z[0x4E01] = 'B6A1'; z[0x4E03] = 'C6DF'; z[0x4E07] = 'CDF2'; z[0x4E08] = 'D5C9'; z[0x4E09] = 'C8FD'; z[0x4E0A] = 'C9CF'; z[0x4E0B] = 'CFC2'; z[0x4E0C] = 'D8A2'; z[0x4E0D] = 'B2BB'; z[0x4E0E] = 'D3EB'; z[0x4E10] = 'D8A4'; z[0x4E11] = 'B3F3'; z[0x4E13] = 'D7A8'; z[0x4E14] = 'C7D2'; z[0x4E15] = 'D8A7'; z[0x4E16] = 'CAC0'; z[0x4E18] = 'C7F0'; z[0x4E19] = 'B1FB'; z[0x4E1A] = 'D2B5'; z[0x4E1B] = 'B4D4'; z[0x4E1C] = 'B6AB'; z[0x4E1D] = 'CBBF'; z[0x4E1E] = 'D8A9'; z[0x4E22] = 'B6AA'; z[0x4E24] = 'C1BD'; z[0x4E25] = 'D1CF'; z[0x4E27] = 'C9A5'; z[0x4E28] = 'D8AD'; z[0x4E2A] = 'B8F6'; z[0x4E2B] = 'D1BE'; z[0x4E2C] = 'E3DC'; z[0x4E2D] = 'D6D0'; z[0x4E30] = 'B7E1'; z[0x4E32] = 'B4AE'; z[0x4E34] = 'C1D9'; z[0x4E36] = 'D8BC'; z[0x4E38] = 'CDE8'; z[0x4E39] = 'B5A4'; z[0x4E3A] = 'CEAA'; z[0x4E3B] = 'D6F7'; z[0x4E3D] = 'C0F6'; z[0x4E3E] = 'BED9'; z[0x4E3F] = 'D8AF'; z[0x4E43] = 'C4CB'; z[0x4E45] = 'BEC3'; z[0x4E47] = 'D8B1'; z[0x4E48] = 'C3B4'; z[0x4E49] = 'D2E5'; z[0x4E4B] = 'D6AE'; z[0x4E4C] = 'CEDA'; z[0x4E4D] = 'D5A7'; z[0x4E4E] = 'BAF5'; z[0x4E4F] = 'B7A6'; z[0x4E50] = 'C0D6'; z[0x4E52] = 'C6B9'; z[0x4E53] = 'C5D2'; z[0x4E54] = 'C7C7'; z[0x4E56] = 'B9D4'; z[0x4E58] = 'B3CB'; z[0x4E59] = 'D2D2'; z[0x4E5C] = 'D8BF'; z[0x4E5D] = 'BEC5'; z[0x4E5E] = 'C6F2'; z[0x4E5F] = 'D2B2'; z[0x4E60] = 'CFB0'; z[0x4E61] = 'CFE7'; z[0x4E66] = 'CAE9'; z[0x4E69] = 'D8C0'; z[0x4E70] = 'C2F2'; z[0x4E71] = 'C2D2'; z[0x4E73] = 'C8E9'; z[0x4E7E] = 'C7AC'; z[0x4E86] = 'C1CB'; z[0x4E88] = 'D3E8'; z[0x4E89] = 'D5F9'; z[0x4E8B] = 'CAC2'; z[0x4E8C] = 'B6FE'; z[0x4E8D] = 'D8A1'; z[0x4E8E] = 'D3DA'; z[0x4E8F] = 'BFF7'; z[0x4E91] = 'D4C6'; z[0x4E92] = 'BBA5'; z[0x4E93] = 'D8C1'; z[0x4E94] = 'CEE5'; z[0x4E95] = 'BEAE'; z[0x4E98] = 'D8A8'; z[0x4E9A] = 'D1C7'; z[0x4E9B] = 'D0A9'; z[0x4E9F] = 'D8BD'; z[0x4EA0] = 'D9EF'; z[0x4EA1] = 'CDF6'; z[0x4EA2] = 'BFBA'; z[0x4EA4] = 'BDBB'; z[0x4EA5] = 'BAA5'; z[0x4EA6] = 'D2E0'; z[0x4EA7] = 'B2FA'; z[0x4EA8] = 'BAE0'; z[0x4EA9] = 'C4B6'; z[0x4EAB] = 'CFED'; z[0x4EAC] = 'BEA9'; z[0x4EAD] = 'CDA4'; z[0x4EAE] = 'C1C1'; z[0x4EB2] = 'C7D7'; z[0x4EB3] = 'D9F1'; z[0x4EB5] = 'D9F4'; z[0x4EBA] = 'C8CB'; z[0x4EBB] = 'D8E9'; z[0x4EBF] = 'D2DA'; z[0x4EC0] = 'CAB2'; z[0x4EC1] = 'C8CA'; z[0x4EC2] = 'D8EC'; z[0x4EC3] = 'D8EA'; z[0x4EC4] = 'D8C6'; z[0x4EC5] = 'BDF6'; z[0x4EC6] = 'C6CD'; z[0x4EC7] = 'B3F0'; z[0x4EC9] = 'D8EB'; z[0x4ECA] = 'BDF1'; z[0x4ECB] = 'BDE9'; z[0x4ECD] = 'C8D4'; z[0x4ECE] = 'B4D3'; z[0x4ED1] = 'C2D8'; z[0x4ED3] = 'B2D6'; z[0x4ED4] = 'D7D0'; z[0x4ED5] = 'CACB'; z[0x4ED6] = 'CBFB'; z[0x4ED7] = 'D5CC'; z[0x4ED8] = 'B8B6'; z[0x4ED9] = 'CFC9'; z[0x4EDD] = 'D9DA'; z[0x4EDE] = 'D8F0'; z[0x4EDF] = 'C7AA'; z[0x4EE1] = 'D8EE'; z[0x4EE3] = 'B4FA'; z[0x4EE4] = 'C1EE'; z[0x4EE5] = 'D2D4'; z[0x4EE8] = 'D8ED'; z[0x4EEA] = 'D2C7'; z[0x4EEB] = 'D8EF'; z[0x4EEC] = 'C3C7'; z[0x4EF0] = 'D1F6'; z[0x4EF2] = 'D6D9'; z[0x4EF3] = 'D8F2'; z[0x4EF5] = 'D8F5'; z[0x4EF6] = 'BCFE'; z[0x4EF7] = 'BCDB'; z[0x4EFB] = 'C8CE'; z[0x4EFD] = 'B7DD'; z[0x4EFF] = 'B7C2'; z[0x4F01] = 'C6F3'; z[0x4F09] = 'D8F8'; z[0x4F0A] = 'D2C1'; z[0x4F0D] = 'CEE9'; z[0x4F0E] = 'BCBF'; z[0x4F0F] = 'B7FC'; z[0x4F10] = 'B7A5'; z[0x4F11] = 'D0DD'; z[0x4F17] = 'D6DA'; z[0x4F18] = 'D3C5'; z[0x4F19] = 'BBEF'; z[0x4F1A] = 'BBE1'; z[0x4F1B] = 'D8F1'; z[0x4F1E] = 'C9A1'; z[0x4F1F] = 'CEB0'; z[0x4F20] = 'B4AB'; z[0x4F22] = 'D8F3'; z[0x4F24] = 'C9CB'; z[0x4F25] = 'D8F6'; z[0x4F26] = 'C2D7'; z[0x4F27] = 'D8F7'; z[0x4F2A] = 'CEB1'; z[0x4F2B] = 'D8F9'; z[0x4F2F] = 'B2AE'; z[0x4F30] = 'B9C0'; z[0x4F32] = 'D9A3'; z[0x4F34] = 'B0E9'; z[0x4F36] = 'C1E6'; z[0x4F38] = 'C9EC'; z[0x4F3A] = 'CBC5'; z[0x4F3C] = 'CBC6'; z[0x4F3D] = 'D9A4'; z[0x4F43] = 'B5E8'; z[0x4F46] = 'B5AB'; z[0x4F4D] = 'CEBB'; z[0x4F4E] = 'B5CD'; z[0x4F4F] = 'D7A1'; z[0x4F50] = 'D7F4'; z[0x4F51] = 'D3D3'; z[0x4F53] = 'CCE5'; z[0x4F55] = 'BACE'; z[0x4F57] = 'D9A2'; z[0x4F58] = 'D9DC'; z[0x4F59] = 'D3E0'; z[0x4F5A] = 'D8FD'; z[0x4F5B] = 'B7F0'; z[0x4F5C] = 'D7F7'; z[0x4F5D] = 'D8FE'; z[0x4F5E] = 'D8FA'; z[0x4F5F] = 'D9A1'; z[0x4F60] = 'C4E3'; z[0x4F63] = 'D3B6'; z[0x4F64] = 'D8F4'; z[0x4F65] = 'D9DD'; z[0x4F67] = 'D8FB'; z[0x4F69] = 'C5E5'; z[0x4F6C] = 'C0D0'; z[0x4F6F] = 'D1F0'; z[0x4F70] = 'B0DB'; z[0x4F73] = 'BCD1'; z[0x4F74] = 'D9A6'; z[0x4F76] = 'D9A5'; z[0x4F7B] = 'D9AC'; z[0x4F7C] = 'D9AE'; z[0x4F7E] = 'D9AB'; z[0x4F7F] = 'CAB9'; z[0x4F83] = 'D9A9'; z[0x4F84] = 'D6B6'; z[0x4F88] = 'B3DE'; z[0x4F89] = 'D9A8'; z[0x4F8B] = 'C0FD'; z[0x4F8D] = 'CACC'; z[0x4F8F] = 'D9AA'; z[0x4F91] = 'D9A7'; z[0x4F94] = 'D9B0'; z[0x4F97] = 'B6B1'; z[0x4F9B] = 'B9A9'; z[0x4F9D] = 'D2C0'; z[0x4FA0] = 'CFC0'; z[0x4FA3] = 'C2C2'; z[0x4FA5] = 'BDC4'; z[0x4FA6] = 'D5EC'; z[0x4FA7] = 'B2E0'; z[0x4FA8] = 'C7C8'; z[0x4FA9] = 'BFEB'; z[0x4FAA] = 'D9AD'; z[0x4FAC] = 'D9AF'; z[0x4FAE] = 'CEEA'; z[0x4FAF] = 'BAEE'; z[0x4FB5] = 'C7D6'; z[0x4FBF] = 'B1E3'; z[0x4FC3] = 'B4D9'; z[0x4FC4] = 'B6ED'; z[0x4FC5] = 'D9B4'; z[0x4FCA] = 'BFA1'; z[0x4FCE] = 'D9DE'; z[0x4FCF] = 'C7CE'; z[0x4FD0] = 'C0FE'; z[0x4FD1] = 'D9B8'; z[0x4FD7] = 'CBD7'; z[0x4FD8] = 'B7FD'; z[0x4FDA] = 'D9B5'; z[0x4FDC] = 'D9B7'; z[0x4FDD] = 'B1A3'; z[0x4FDE] = 'D3E1'; z[0x4FDF] = 'D9B9'; z[0x4FE1] = 'D0C5'; z[0x4FE3] = 'D9B6'; z[0x4FE6] = 'D9B1'; z[0x4FE8] = 'D9B2'; z[0x4FE9] = 'C1A9'; z[0x4FEA] = 'D9B3'; z[0x4FED] = 'BCF3'; z[0x4FEE] = 'D0DE'; z[0x4FEF] = 'B8A9'; z[0x4FF1] = 'BEE3'; z[0x4FF3] = 'D9BD'; z[0x4FF8] = 'D9BA'; z[0x4FFA] = 'B0B3'; z[0x4FFE] = 'D9C2'; z[0x500C] = 'D9C4'; z[0x500D] = 'B1B6'; z[0x500F] = 'D9BF'; z[0x5012] = 'B5B9'; z[0x5014] = 'BEF3'; z[0x5018] = 'CCC8'; z[0x5019] = 'BAF2'; z[0x501A] = 'D2D0'; z[0x501C] = 'D9C3'; z[0x501F] = 'BDE8'; z[0x5021] = 'B3AB'; z[0x5025] = 'D9C5'; z[0x5026] = 'BEEB'; z[0x5028] = 'D9C6'; z[0x5029] = 'D9BB'; z[0x502A] = 'C4DF'; z[0x502C] = 'D9BE'; z[0x502D] = 'D9C1'; z[0x502E] = 'D9C0'; z[0x503A] = 'D5AE'; z[0x503C] = 'D6B5'; z[0x503E] = 'C7E3'; z[0x5043] = 'D9C8'; z[0x5047] = 'BCD9'; z[0x5048] = 'D9CA'; z[0x504C] = 'D9BC'; z[0x504E] = 'D9CB'; z[0x504F] = 'C6AB'; z[0x5055] = 'D9C9'; z[0x505A] = 'D7F6'; z[0x505C] = 'CDA3'; z[0x5065] = 'BDA1'; z[0x506C] = 'D9CC'; z[0x5076] = 'C5BC'; z[0x5077] = 'CDB5'; z[0x507B] = 'D9CD'; z[0x507E] = 'D9C7'; z[0x507F] = 'B3A5'; z[0x5080] = 'BFFE'; z[0x5085] = 'B8B5'; z[0x5088] = 'C0FC'; z[0x508D] = 'B0F8'; z[0x50A3] = 'B4F6'; z[0x50A5] = 'D9CE'; z[0x50A7] = 'D9CF'; z[0x50A8] = 'B4A2'; z[0x50A9] = 'D9D0'; z[0x50AC] = 'B4DF'; z[0x50B2] = 'B0C1'; z[0x50BA] = 'D9D1'; z[0x50BB] = 'C9B5'; z[0x50CF] = 'CFF1'; z[0x50D6] = 'D9D2'; z[0x50DA] = 'C1C5'; z[0x50E6] = 'D9D6'; z[0x50E7] = 'C9AE'; z[0x50EC] = 'D9D5'; z[0x50ED] = 'D9D4'; z[0x50EE] = 'D9D7'; z[0x50F3] = 'CBDB'; z[0x50F5] = 'BDA9'; z[0x50FB] = 'C6A7'; z[0x5106] = 'D9D3'; z[0x5107] = 'D9D8'; z[0x510B] = 'D9D9'; z[0x5112] = 'C8E5'; z[0x5121] = 'C0DC'; z[0x513F] = 'B6F9'; z[0x5140] = 'D8A3'; z[0x5141] = 'D4CA'; z[0x5143] = 'D4AA'; z[0x5144] = 'D0D6'; z[0x5145] = 'B3E4'; z[0x5146] = 'D5D7'; z[0x5148] = 'CFC8'; z[0x5149] = 'B9E2'; z[0x514B] = 'BFCB'; z[0x514D] = 'C3E2'; z[0x5151] = 'B6D2'; z[0x5154] = 'CDC3'; z[0x5155] = 'D9EE'; z[0x5156] = 'D9F0'; z[0x515A] = 'B5B3'; z[0x515C] = 'B6B5'; z[0x5162] = 'BEA4'; z[0x5165] = 'C8EB'; z[0x5168] = 'C8AB'; z[0x516B] = 'B0CB'; z[0x516C] = 'B9AB'; z[0x516D] = 'C1F9'; z[0x516E] = 'D9E2'; z[0x5170] = 'C0BC'; z[0x5171] = 'B9B2'; z[0x5173] = 'B9D8'; z[0x5174] = 'D0CB'; z[0x5175] = 'B1F8'; z[0x5176] = 'C6E4'; z[0x5177] = 'BEDF'; z[0x5178] = 'B5E4'; z[0x5179] = 'D7C8'; z[0x517B] = 'D1F8'; z[0x517C] = 'BCE6'; z[0x517D] = 'CADE'; z[0x5180] = 'BCBD'; z[0x5181] = 'D9E6'; z[0x5182] = 'D8E7'; z[0x5185] = 'C4DA'; z[0x5188] = 'B8D4'; z[0x5189] = 'C8BD'; z[0x518C] = 'B2E1'; z[0x518D] = 'D4D9'; z[0x5192] = 'C3B0'; z[0x5195] = 'C3E1'; z[0x5196] = 'DAA2'; z[0x5197] = 'C8DF'; z[0x5199] = 'D0B4'; z[0x519B] = 'BEFC'; z[0x519C] = 'C5A9'; z[0x51A0] = 'B9DA'; z[0x51A2] = 'DAA3'; z[0x51A4] = 'D4A9'; z[0x51A5] = 'DAA4'; z[0x51AB] = 'D9FB'; z[0x51AC] = 'B6AC'; z[0x51AF] = 'B7EB'; z[0x51B0] = 'B1F9'; z[0x51B1] = 'D9FC'; z[0x51B2] = 'B3E5'; z[0x51B3] = 'BEF6'; z[0x51B5] = 'BFF6'; z[0x51B6] = 'D2B1'; z[0x51B7] = 'C0E4'; z[0x51BB] = 'B6B3'; z[0x51BC] = 'D9FE'; z[0x51BD] = 'D9FD'; z[0x51C0] = 'BEBB'; z[0x51C4] = 'C6E0'; z[0x51C6] = 'D7BC'; z[0x51C7] = 'DAA1'; z[0x51C9] = 'C1B9'; z[0x51CB] = 'B5F2'; z[0x51CC] = 'C1E8'; z[0x51CF] = 'BCF5'; z[0x51D1] = 'B4D5'; z[0x51DB] = 'C1DD'; z[0x51DD] = 'C4FD'; z[0x51E0] = 'BCB8'; z[0x51E1] = 'B7B2'; z[0x51E4] = 'B7EF'; z[0x51EB] = 'D9EC'; z[0x51ED] = 'C6BE'; z[0x51EF] = 'BFAD'; z[0x51F0] = 'BBCB'; z[0x51F3] = 'B5CA'; z[0x51F5] = 'DBC9'; z[0x51F6] = 'D0D7'; z[0x51F8] = 'CDB9'; z[0x51F9] = 'B0BC'; z[0x51FA] = 'B3F6'; z[0x51FB] = 'BBF7'; z[0x51FC] = 'DBCA'; z[0x51FD] = 'BAAF'; z[0x51FF] = 'D4E4'; z[0x5200] = 'B5B6'; z[0x5201] = 'B5F3'; z[0x5202] = 'D8D6'; z[0x5203] = 'C8D0'; z[0x5206] = 'B7D6'; z[0x5207] = 'C7D0'; z[0x5208] = 'D8D7'; z[0x520A] = 'BFAF'; z[0x520D] = 'DBBB'; z[0x520E] = 'D8D8'; z[0x5211] = 'D0CC'; z[0x5212] = 'BBAE'; z[0x5216] = 'EBBE'; z[0x5217] = 'C1D0'; z[0x5218] = 'C1F5'; z[0x5219] = 'D4F2'; z[0x521A] = 'B8D5'; z[0x521B] = 'B4B4'; z[0x521D] = 'B3F5'; z[0x5220] = 'C9BE'; z[0x5224] = 'C5D0'; z[0x5228] = 'C5D9'; z[0x5229] = 'C0FB'; z[0x522B] = 'B1F0'; z[0x522D] = 'D8D9'; z[0x522E] = 'B9CE'; z[0x5230] = 'B5BD'; z[0x5233] = 'D8DA'; z[0x5236] = 'D6C6'; z[0x5237] = 'CBA2'; z[0x5238] = 'C8AF'; z[0x5239] = 'C9B2'; z[0x523A] = 'B4CC'; z[0x523B] = 'BFCC'; z[0x523D] = 'B9F4'; z[0x523F] = 'D8DB'; z[0x5240] = 'D8DC'; z[0x5241] = 'B6E7'; z[0x5242] = 'BCC1'; z[0x5243] = 'CCEA'; z[0x524A] = 'CFF7'; z[0x524C] = 'D8DD'; z[0x524D] = 'C7B0'; z[0x5250] = 'B9D0'; z[0x5251] = 'BDA3'; z[0x5254] = 'CCDE'; z[0x5256] = 'C6CA'; z[0x525C] = 'D8E0'; z[0x525E] = 'D8DE'; z[0x5261] = 'D8DF'; z[0x5265] = 'B0FE'; z[0x5267] = 'BEE7'; z[0x5269] = 'CAA3'; z[0x526A] = 'BCF4'; z[0x526F] = 'B8B1'; z[0x5272] = 'B8EE'; z[0x527D] = 'D8E2'; z[0x527F] = 'BDCB'; z[0x5281] = 'D8E4'; z[0x5282] = 'D8E3'; z[0x5288] = 'C5FC'; z[0x5290] = 'D8E5'; z[0x5293] = 'D8E6'; z[0x529B] = 'C1A6'; z[0x529D] = 'C8B0'; z[0x529E] = 'B0EC'; z[0x529F] = 'B9A6'; z[0x52A0] = 'BCD3'; z[0x52A1] = 'CEF1'; z[0x52A2] = 'DBBD'; z[0x52A3] = 'C1D3'; z[0x52A8] = 'B6AF'; z[0x52A9] = 'D6FA'; z[0x52AA] = 'C5AC'; z[0x52AB] = 'BDD9'; z[0x52AC] = 'DBBE'; z[0x52AD] = 'DBBF'; z[0x52B1] = 'C0F8'; z[0x52B2] = 'BEA2'; z[0x52B3] = 'C0CD'; z[0x52BE] = 'DBC0'; z[0x52BF] = 'CAC6'; z[0x52C3] = 'B2AA'; z[0x52C7] = 'D3C2'; z[0x52C9] = 'C3E3'; z[0x52CB] = 'D1AB'; z[0x52D0] = 'DBC2'; z[0x52D2] = 'C0D5'; z[0x52D6] = 'DBC3'; z[0x52D8] = 'BFB1'; z[0x52DF] = 'C4BC'; z[0x52E4] = 'C7DA'; z[0x52F0] = 'DBC4'; z[0x52F9] = 'D9E8'; z[0x52FA] = 'C9D7'; z[0x52FE] = 'B9B4'; z[0x52FF] = 'CEF0'; z[0x5300] = 'D4C8'; z[0x5305] = 'B0FC'; z[0x5306] = 'B4D2'; z[0x5308] = 'D0D9'; z[0x530D] = 'D9E9'; z[0x530F] = 'DECB'; z[0x5310] = 'D9EB'; z[0x5315] = 'D8B0'; z[0x5316] = 'BBAF'; z[0x5317] = 'B1B1'; z[0x5319] = 'B3D7'; z[0x531A] = 'D8CE'; z[0x531D] = 'D4D1'; z[0x5320] = 'BDB3'; z[0x5321] = 'BFEF'; z[0x5323] = 'CFBB'; z[0x5326] = 'D8D0'; z[0x532A] = 'B7CB'; z[0x532E] = 'D8D1'; z[0x5339] = 'C6A5'; z[0x533A] = 'C7F8'; z[0x533B] = 'D2BD'; z[0x533E] = 'D8D2'; z[0x533F] = 'C4E4'; z[0x5341] = 'CAAE'; z[0x5343] = 'C7A7'; z[0x5345] = 'D8A6'; z[0x5347] = 'C9FD'; z[0x5348] = 'CEE7'; z[0x5349] = 'BBDC'; z[0x534A] = 'B0EB'; z[0x534E] = 'BBAA'; z[0x534F] = 'D0AD'; z[0x5351] = 'B1B0'; z[0x5352] = 'D7E4'; z[0x5353] = 'D7BF'; z[0x5355] = 'B5A5'; z[0x5356] = 'C2F4'; z[0x5357] = 'C4CF'; z[0x535A] = 'B2A9'; z[0x535C] = 'B2B7'; z[0x535E] = 'B1E5'; z[0x535F] = 'DFB2'; z[0x5360] = 'D5BC'; z[0x5361] = 'BFA8'; z[0x5362] = 'C2AC'; z[0x5363] = 'D8D5'; z[0x5364] = 'C2B1'; z[0x5366] = 'D8D4'; z[0x5367] = 'CED4'; z[0x5369] = 'DAE0'; z[0x536B] = 'CEC0'; z[0x536E] = 'D8B4'; z[0x536F] = 'C3AE'; z[0x5370] = 'D3A1'; z[0x5371] = 'CEA3'; z[0x5373] = 'BCB4'; z[0x5374] = 'C8B4'; z[0x5375] = 'C2D1'; z[0x5377] = 'BEED'; z[0x5378] = 'D0B6'; z[0x537A] = 'DAE1'; z[0x537F] = 'C7E4'; z[0x5382] = 'B3A7'; z[0x5384] = 'B6F2'; z[0x5385] = 'CCFC'; z[0x5386] = 'C0FA'; z[0x5389] = 'C0F7'; z[0x538B] = 'D1B9'; z[0x538C] = 'D1E1'; z[0x538D] = 'D8C7'; z[0x5395] = 'B2DE'; z[0x5398] = 'C0E5'; z[0x539A] = 'BAF1'; z[0x539D] = 'D8C8'; z[0x539F] = 'D4AD'; z[0x53A2] = 'CFE1'; z[0x53A3] = 'D8C9'; z[0x53A5] = 'D8CA'; z[0x53A6] = 'CFC3'; z[0x53A8] = 'B3F8'; z[0x53A9] = 'BEC7'; z[0x53AE] = 'D8CB'; z[0x53B6] = 'DBCC'; z[0x53BB] = 'C8A5'; z[0x53BF] = 'CFD8'; z[0x53C1] = 'C8FE'; z[0x53C2] = 'B2CE'; z[0x53C8] = 'D3D6'; z[0x53C9] = 'B2E6'; z[0x53CA] = 'BCB0'; z[0x53CB] = 'D3D1'; z[0x53CC] = 'CBAB'; z[0x53CD] = 'B7B4'; z[0x53D1] = 'B7A2'; z[0x53D4] = 'CAE5'; z[0x53D6] = 'C8A1'; z[0x53D7] = 'CADC'; z[0x53D8] = 'B1E4'; z[0x53D9] = 'D0F0'; z[0x53DB] = 'C5D1'; z[0x53DF] = 'DBC5'; z[0x53E0] = 'B5FE'; z[0x53E3] = 'BFDA'; z[0x53E4] = 'B9C5'; z[0x53E5] = 'BEE4'; z[0x53E6] = 'C1ED'; z[0x53E8] = 'DFB6'; z[0x53E9] = 'DFB5'; z[0x53EA] = 'D6BB'; z[0x53EB] = 'BDD0'; z[0x53EC] = 'D5D9'; z[0x53ED] = 'B0C8'; z[0x53EE] = 'B6A3'; z[0x53EF] = 'BFC9'; z[0x53F0] = 'CCA8'; z[0x53F1] = 'DFB3'; z[0x53F2] = 'CAB7'; z[0x53F3] = 'D3D2'; z[0x53F5] = 'D8CF'; z[0x53F6] = 'D2B6'; z[0x53F7] = 'BAC5'; z[0x53F8] = 'CBBE'; z[0x53F9] = 'CCBE'; z[0x53FB] = 'DFB7'; z[0x53FC] = 'B5F0'; z[0x53FD] = 'DFB4'; z[0x5401] = 'D3F5'; z[0x5403] = 'B3D4'; z[0x5404] = 'B8F7'; z[0x5406] = 'DFBA'; z[0x5408] = 'BACF'; z[0x5409] = 'BCAA'; z[0x540A] = 'B5F5'; z[0x540C] = 'CDAC'; z[0x540D] = 'C3FB'; z[0x540E] = 'BAF3'; z[0x540F] = 'C0F4'; z[0x5410] = 'CDC2'; z[0x5411] = 'CFF2'; z[0x5412] = 'DFB8'; z[0x5413] = 'CFC5'; z[0x5415] = 'C2C0'; z[0x5416] = 'DFB9'; z[0x5417] = 'C2F0'; z[0x541B] = 'BEFD'; z[0x541D] = 'C1DF'; z[0x541E] = 'CDCC'; z[0x541F] = 'D2F7'; z[0x5420] = 'B7CD'; z[0x5421] = 'DFC1'; z[0x5423] = 'DFC4'; z[0x5426] = 'B7F1'; z[0x5427] = 'B0C9'; z[0x5428] = 'B6D6'; z[0x5429] = 'B7D4'; z[0x542B] = 'BAAC'; z[0x542C] = 'CCFD'; z[0x542D] = 'BFD4'; z[0x542E] = 'CBB1'; z[0x542F] = 'C6F4'; z[0x5431] = 'D6A8'; z[0x5432] = 'DFC5'; z[0x5434] = 'CEE2'; z[0x5435] = 'B3B3'; z[0x5438] = 'CEFC'; z[0x5439] = 'B4B5'; z[0x543B] = 'CEC7'; z[0x543C] = 'BAF0'; z[0x543E] = 'CEE1'; z[0x5440] = 'D1BD'; z[0x5443] = 'DFC0'; z[0x5446] = 'B4F4'; z[0x5448] = 'B3CA'; z[0x544A] = 'B8E6'; z[0x544B] = 'DFBB'; z[0x5450] = 'C4C5'; z[0x5452] = 'DFBC'; z[0x5453] = 'DFBD'; z[0x5454] = 'DFBE'; z[0x5455] = 'C5BB'; z[0x5456] = 'DFBF'; z[0x5457] = 'DFC2'; z[0x5458] = 'D4B1'; z[0x5459] = 'DFC3'; z[0x545B] = 'C7BA'; z[0x545C] = 'CED8'; z[0x5462] = 'C4D8'; z[0x5464] = 'DFCA'; z[0x5466] = 'DFCF'; z[0x5468] = 'D6DC'; z[0x5471] = 'DFC9'; z[0x5472] = 'DFDA'; z[0x5473] = 'CEB6'; z[0x5475] = 'BAC7'; z[0x5476] = 'DFCE'; z[0x5477] = 'DFC8'; z[0x5478] = 'C5DE'; z[0x547B] = 'C9EB'; z[0x547C] = 'BAF4'; z[0x547D] = 'C3FC'; z[0x5480] = 'BED7'; z[0x5482] = 'DFC6'; z[0x5484] = 'DFCD'; z[0x5486] = 'C5D8'; z[0x548B] = 'D5A6'; z[0x548C] = 'BACD'; z[0x548E] = 'BECC'; z[0x548F] = 'D3BD'; z[0x5490] = 'B8C0'; z[0x5492] = 'D6E4'; z[0x5494] = 'DFC7'; z[0x5495] = 'B9BE'; z[0x5496] = 'BFA7'; z[0x5499] = 'C1FC'; z[0x549A] = 'DFCB'; z[0x549B] = 'DFCC'; z[0x549D] = 'DFD0'; z[0x54A3] = 'DFDB'; z[0x54A4] = 'DFE5'; z[0x54A6] = 'DFD7'; z[0x54A7] = 'DFD6'; z[0x54A8] = 'D7C9'; z[0x54A9] = 'DFE3'; z[0x54AA] = 'DFE4'; z[0x54AB] = 'E5EB'; z[0x54AC] = 'D2A7'; z[0x54AD] = 'DFD2'; z[0x54AF] = 'BFA9'; z[0x54B1] = 'D4DB'; z[0x54B3] = 'BFC8'; z[0x54B4] = 'DFD4'; z[0x54B8] = 'CFCC'; z[0x54BB] = 'DFDD'; z[0x54BD] = 'D1CA'; z[0x54BF] = 'DFDE'; z[0x54C0] = 'B0A7'; z[0x54C1] = 'C6B7'; z[0x54C2] = 'DFD3'; z[0x54C4] = 'BAE5'; z[0x54C6] = 'B6DF'; z[0x54C7] = 'CDDB'; z[0x54C8] = 'B9FE'; z[0x54C9] = 'D4D5'; z[0x54CC] = 'DFDF'; z[0x54CD] = 'CFEC'; z[0x54CE] = 'B0A5'; z[0x54CF] = 'DFE7'; z[0x54D0] = 'DFD1'; z[0x54D1] = 'D1C6'; z[0x54D2] = 'DFD5'; z[0x54D3] = 'DFD8'; z[0x54D4] = 'DFD9'; z[0x54D5] = 'DFDC'; z[0x54D7] = 'BBA9'; z[0x54D9] = 'DFE0'; z[0x54DA] = 'DFE1'; z[0x54DC] = 'DFE2'; z[0x54DD] = 'DFE6'; z[0x54DE] = 'DFE8'; z[0x54DF] = 'D3B4'; z[0x54E5] = 'B8E7'; z[0x54E6] = 'C5B6'; z[0x54E7] = 'DFEA'; z[0x54E8] = 'C9DA'; z[0x54E9] = 'C1A8'; z[0x54EA] = 'C4C4'; z[0x54ED] = 'BFDE'; z[0x54EE] = 'CFF8'; z[0x54F2] = 'D5DC'; z[0x54F3] = 'DFEE'; z[0x54FA] = 'B2B8'; z[0x54FC] = 'BADF'; z[0x54FD] = 'DFEC'; z[0x54FF] = 'DBC1'; z[0x5501] = 'D1E4'; z[0x5506] = 'CBF4'; z[0x5507] = 'B4BD'; z[0x5509] = 'B0A6'; z[0x550F] = 'DFF1'; z[0x5510] = 'CCC6'; z[0x5511] = 'DFF2'; z[0x5514] = 'DFED'; z[0x551B] = 'DFE9'; z[0x5520] = 'DFEB'; z[0x5522] = 'DFEF'; z[0x5523] = 'DFF0'; z[0x5524] = 'BBBD'; z[0x5527] = 'DFF3'; z[0x552A] = 'DFF4'; z[0x552C] = 'BBA3'; z[0x552E] = 'CADB'; z[0x552F] = 'CEA8'; z[0x5530] = 'E0A7'; z[0x5531] = 'B3AA'; z[0x5533] = 'E0A6'; z[0x5537] = 'E0A1'; z[0x553C] = 'DFFE'; z[0x553E] = 'CDD9'; z[0x553F] = 'DFFC'; z[0x5541] = 'DFFA'; z[0x5543] = 'BFD0'; z[0x5544] = 'D7C4'; z[0x5546] = 'C9CC'; z[0x5549] = 'DFF8'; z[0x554A] = 'B0A1'; z[0x5550] = 'DFFD'; z[0x5555] = 'DFFB'; z[0x5556] = 'E0A2'; z[0x555C] = 'E0A8'; z[0x5561] = 'B7C8'; z[0x5564] = 'C6A1'; z[0x5565] = 'C9B6'; z[0x5566] = 'C0B2'; z[0x5567] = 'DFF5'; z[0x556A] = 'C5BE'; z[0x556C] = 'D8C4'; z[0x556D] = 'DFF9'; z[0x556E] = 'C4F6'; z[0x5575] = 'E0A3'; z[0x5576] = 'E0A4'; z[0x5577] = 'E0A5'; z[0x5578] = 'D0A5'; z[0x557B] = 'E0B4'; z[0x557C] = 'CCE4'; z[0x557E] = 'E0B1'; z[0x5580] = 'BFA6'; z[0x5581] = 'E0AF'; z[0x5582] = 'CEB9'; z[0x5583] = 'E0AB'; z[0x5584] = 'C9C6'; z[0x5587] = 'C0AE'; z[0x5588] = 'E0AE'; z[0x5589] = 'BAED'; z[0x558A] = 'BAB0'; z[0x558B] = 'E0A9'; z[0x558F] = 'DFF6'; z[0x5591] = 'E0B3'; z[0x5594] = 'E0B8'; z[0x5598] = 'B4AD'; z[0x5599] = 'E0B9'; z[0x559C] = 'CFB2'; z[0x559D] = 'BAC8'; z[0x559F] = 'E0B0'; z[0x55A7] = 'D0FA'; z[0x55B1] = 'E0AC'; z[0x55B3] = 'D4FB'; z[0x55B5] = 'DFF7'; z[0x55B7] = 'C5E7'; z[0x55B9] = 'E0AD'; z[0x55BB] = 'D3F7'; z[0x55BD] = 'E0B6'; z[0x55BE] = 'E0B7'; z[0x55C4] = 'E0C4'; z[0x55C5] = 'D0E1'; z[0x55C9] = 'E0BC'; z[0x55CC] = 'E0C9'; z[0x55CD] = 'E0CA'; z[0x55D1] = 'E0BE'; z[0x55D2] = 'E0AA'; z[0x55D3] = 'C9A4'; z[0x55D4] = 'E0C1'; z[0x55D6] = 'E0B2'; z[0x55DC] = 'CAC8'; z[0x55DD] = 'E0C3'; z[0x55DF] = 'E0B5'; z[0x55E1] = 'CECB'; z[0x55E3] = 'CBC3'; z[0x55E4] = 'E0CD'; z[0x55E5] = 'E0C6'; z[0x55E6] = 'E0C2'; z[0x55E8] = 'E0CB'; z[0x55EA] = 'E0BA'; z[0x55EB] = 'E0BF'; z[0x55EC] = 'E0C0'; z[0x55EF] = 'E0C5'; z[0x55F2] = 'E0C7'; z[0x55F3] = 'E0C8'; z[0x55F5] = 'E0CC'; z[0x55F7] = 'E0BB'; z[0x55FD] = 'CBD4'; z[0x55FE] = 'E0D5'; z[0x5600] = 'E0D6'; z[0x5601] = 'E0D2'; z[0x5608] = 'E0D0'; z[0x5609] = 'BCCE'; z[0x560C] = 'E0D1'; z[0x560E] = 'B8C2'; z[0x560F] = 'D8C5'; z[0x5618] = 'D0EA'; z[0x561B] = 'C2EF'; z[0x561E] = 'E0CF'; z[0x561F] = 'E0BD'; z[0x5623] = 'E0D4'; z[0x5624] = 'E0D3'; z[0x5627] = 'E0D7'; z[0x562C] = 'E0DC'; z[0x562D] = 'E0D8'; z[0x5631] = 'D6F6'; z[0x5632] = 'B3B0'; z[0x5634] = 'D7EC'; z[0x5636] = 'CBBB'; z[0x5639] = 'E0DA'; z[0x563B] = 'CEFB'; z[0x563F] = 'BAD9'; z[0x564C] = 'E0E1'; z[0x564D] = 'E0DD'; z[0x564E] = 'D2AD'; z[0x5654] = 'E0E2'; z[0x5657] = 'E0DB'; z[0x5658] = 'E0D9'; z[0x5659] = 'E0DF'; z[0x565C] = 'E0E0'; z[0x5662] = 'E0DE'; z[0x5664] = 'E0E4'; z[0x5668] = 'C6F7'; z[0x5669] = 'D8AC'; z[0x566A] = 'D4EB'; z[0x566B] = 'E0E6'; z[0x566C] = 'CAC9'; z[0x5671] = 'E0E5'; z[0x5676] = 'B8C1'; z[0x567B] = 'E0E7'; z[0x567C] = 'E0E8'; z[0x5685] = 'E0E9'; z[0x5686] = 'E0E3'; z[0x568E] = 'BABF'; z[0x568F] = 'CCE7'; z[0x5693] = 'E0EA'; z[0x56A3] = 'CFF9'; z[0x56AF] = 'E0EB'; z[0x56B7] = 'C8C2'; z[0x56BC] = 'BDC0'; z[0x56CA] = 'C4D2'; z[0x56D4] = 'E0EC'; z[0x56D7] = 'E0ED'; z[0x56DA] = 'C7F4'; z[0x56DB] = 'CBC4'; z[0x56DD] = 'E0EE'; z[0x56DE] = 'BBD8'; z[0x56DF] = 'D8B6'; z[0x56E0] = 'D2F2'; z[0x56E1] = 'E0EF'; z[0x56E2] = 'CDC5'; z[0x56E4] = 'B6DA'; z[0x56EB] = 'E0F1'; z[0x56ED] = 'D4B0'; z[0x56F0] = 'C0A7'; z[0x56F1] = 'B4D1'; z[0x56F4] = 'CEA7'; z[0x56F5] = 'E0F0'; z[0x56F9] = 'E0F2'; z[0x56FA] = 'B9CC'; z[0x56FD] = 'B9FA'; z[0x56FE] = 'CDBC'; z[0x56FF] = 'E0F3'; z[0x5703] = 'C6D4'; z[0x5704] = 'E0F4'; z[0x5706] = 'D4B2'; z[0x5708] = 'C8A6'; z[0x5709] = 'E0F6'; z[0x570A] = 'E0F5'; z[0x571C] = 'E0F7'; z[0x571F] = 'CDC1'; z[0x5723] = 'CAA5'; z[0x5728] = 'D4DA'; z[0x5729] = 'DBD7'; z[0x572A] = 'DBD9'; z[0x572C] = 'DBD8'; z[0x572D] = 'B9E7'; z[0x572E] = 'DBDC'; z[0x572F] = 'DBDD'; z[0x5730] = 'B5D8'; z[0x5733] = 'DBDA'; z[0x5739] = 'DBDB'; z[0x573A] = 'B3A1'; z[0x573B] = 'DBDF'; z[0x573E] = 'BBF8'; z[0x5740] = 'D6B7'; z[0x5742] = 'DBE0'; z[0x5747] = 'BEF9'; z[0x574A] = 'B7BB'; z[0x574C] = 'DBD0'; z[0x574D] = 'CCAE'; z[0x574E] = 'BFB2'; z[0x574F] = 'BBB5'; z[0x5750] = 'D7F8'; z[0x5751] = 'BFD3'; z[0x5757] = 'BFE9'; z[0x575A] = 'BCE1'; z[0x575B] = 'CCB3'; z[0x575C] = 'DBDE'; z[0x575D] = 'B0D3'; z[0x575E] = 'CEEB'; z[0x575F] = 'B7D8'; z[0x5760] = 'D7B9'; z[0x5761] = 'C6C2'; z[0x5764] = 'C0A4'; z[0x5766] = 'CCB9'; z[0x5768] = 'DBE7'; z[0x5769] = 'DBE1'; z[0x576A] = 'C6BA'; z[0x576B] = 'DBE3'; z[0x576D] = 'DBE8'; z[0x576F] = 'C5F7'; z[0x5773] = 'DBEA'; z[0x5776] = 'DBE9'; z[0x5777] = 'BFC0'; z[0x577B] = 'DBE6'; z[0x577C] = 'DBE5'; z[0x5782] = 'B4B9'; z[0x5783] = 'C0AC'; z[0x5784] = 'C2A2'; z[0x5785] = 'DBE2'; z[0x5786] = 'DBE4'; z[0x578B] = 'D0CD'; z[0x578C] = 'DBED'; z[0x5792] = 'C0DD'; z[0x5793] = 'DBF2'; z[0x579B] = 'B6E2'; z[0x57A0] = 'DBF3'; z[0x57A1] = 'DBD2'; z[0x57A2] = 'B9B8'; z[0x57A3] = 'D4AB'; z[0x57A4] = 'DBEC'; z[0x57A6] = 'BFD1'; z[0x57A7] = 'DBF0'; z[0x57A9] = 'DBD1'; z[0x57AB] = 'B5E6'; z[0x57AD] = 'DBEB'; z[0x57AE] = 'BFE5'; z[0x57B2] = 'DBEE'; z[0x57B4] = 'DBF1'; z[0x57B8] = 'DBF9'; z[0x57C2] = 'B9A1'; z[0x57C3] = 'B0A3'; z[0x57CB] = 'C2F1'; z[0x57CE] = 'B3C7'; z[0x57CF] = 'DBEF'; z[0x57D2] = 'DBF8'; z[0x57D4] = 'C6D2'; z[0x57D5] = 'DBF4'; z[0x57D8] = 'DBF5'; z[0x57D9] = 'DBF7'; z[0x57DA] = 'DBF6'; z[0x57DD] = 'DBFE'; z[0x57DF] = 'D3F2'; z[0x57E0] = 'B2BA'; z[0x57E4] = 'DBFD'; z[0x57ED] = 'DCA4'; z[0x57EF] = 'DBFB'; z[0x57F4] = 'DBFA'; z[0x57F8] = 'DBFC'; z[0x57F9] = 'C5E0'; z[0x57FA] = 'BBF9'; z[0x57FD] = 'DCA3'; z[0x5800] = 'DCA5'; z[0x5802] = 'CCC3'; z[0x5806] = 'B6D1'; z[0x5807] = 'DDC0'; z[0x580B] = 'DCA1'; z[0x580D] = 'DCA2'; z[0x5811] = 'C7B5'; z[0x5815] = 'B6E9'; z[0x5819] = 'DCA7'; z[0x581E] = 'DCA6'; z[0x5820] = 'DCA9'; z[0x5821] = 'B1A4'; z[0x5824] = 'B5CC'; z[0x582A] = 'BFB0'; z[0x5830] = 'D1DF'; z[0x5835] = 'B6C2'; z[0x5844] = 'DCA8'; z[0x584C] = 'CBFA'; z[0x584D] = 'EBF3'; z[0x5851] = 'CBDC'; z[0x5854] = 'CBFE'; z[0x5858] = 'CCC1'; z[0x585E] = 'C8FB'; z[0x5865] = 'DCAA'; z[0x586B] = 'CCEE'; z[0x586C] = 'DCAB'; z[0x587E] = 'DBD3'; z[0x5880] = 'DCAF'; z[0x5881] = 'DCAC'; z[0x5883] = 'BEB3'; z[0x5885] = 'CAFB'; z[0x5889] = 'DCAD'; z[0x5892] = 'C9CA'; z[0x5893] = 'C4B9'; z[0x5899] = 'C7BD'; z[0x589A] = 'DCAE'; z[0x589E] = 'D4F6'; z[0x589F] = 'D0E6'; z[0x58A8] = 'C4AB'; z[0x58A9] = 'B6D5'; z[0x58BC] = 'DBD4'; z[0x58C1] = 'B1DA'; z[0x58C5] = 'DBD5'; z[0x58D1] = 'DBD6'; z[0x58D5] = 'BABE'; z[0x58E4] = 'C8C0'; z[0x58EB] = 'CABF'; z[0x58EC] = 'C8C9'; z[0x58EE] = 'D7B3'; z[0x58F0] = 'C9F9'; z[0x58F3] = 'BFC7'; z[0x58F6] = 'BAF8'; z[0x58F9] = 'D2BC'; z[0x5902] = 'E2BA'; z[0x5904] = 'B4A6'; z[0x5907] = 'B1B8'; z[0x590D] = 'B8B4'; z[0x590F] = 'CFC4'; z[0x5914] = 'D9E7'; z[0x5915] = 'CFA6'; z[0x5916] = 'CDE2'; z[0x5919] = 'D9ED'; z[0x591A] = 'B6E0'; z[0x591C] = 'D2B9'; z[0x591F] = 'B9BB'; z[0x5924] = 'E2B9'; z[0x5925] = 'E2B7'; z[0x5927] = 'B4F3'; z[0x5929] = 'CCEC'; z[0x592A] = 'CCAB'; z[0x592B] = 'B7F2'; z[0x592D] = 'D8B2'; z[0x592E] = 'D1EB'; z[0x592F] = 'BABB'; z[0x5931] = 'CAA7'; z[0x5934] = 'CDB7'; z[0x5937] = 'D2C4'; z[0x5938] = 'BFE4'; z[0x5939] = 'BCD0'; z[0x593A] = 'B6E1'; z[0x593C] = 'DEC5'; z[0x5941] = 'DEC6'; z[0x5942] = 'DBBC'; z[0x5944] = 'D1D9'; z[0x5947] = 'C6E6'; z[0x5948] = 'C4CE'; z[0x5949] = 'B7EE'; z[0x594B] = 'B7DC'; z[0x594E] = 'BFFC'; z[0x594F] = 'D7E0'; z[0x5951] = 'C6F5'; z[0x5954] = 'B1BC'; z[0x5955] = 'DEC8'; z[0x5956] = 'BDB1'; z[0x5957] = 'CCD7'; z[0x5958] = 'DECA'; z[0x595A] = 'DEC9'; z[0x5960] = 'B5EC'; z[0x5962] = 'C9DD'; z[0x5965] = 'B0C2'; z[0x5973] = 'C5AE'; z[0x5974] = 'C5AB'; z[0x5976] = 'C4CC'; z[0x5978] = 'BCE9'; z[0x5979] = 'CBFD'; z[0x597D] = 'BAC3'; z[0x5981] = 'E5F9'; z[0x5982] = 'C8E7'; z[0x5983] = 'E5FA'; z[0x5984] = 'CDFD'; z[0x5986] = 'D7B1'; z[0x5987] = 'B8BE'; z[0x5988] = 'C2E8'; z[0x598A] = 'C8D1'; z[0x598D] = 'E5FB'; z[0x5992] = 'B6CA'; z[0x5993] = 'BCCB'; z[0x5996] = 'D1FD'; z[0x5997] = 'E6A1'; z[0x5999] = 'C3EE'; z[0x599E] = 'E6A4'; z[0x59A3] = 'E5FE'; z[0x59A4] = 'E6A5'; z[0x59A5] = 'CDD7'; z[0x59A8] = 'B7C1'; z[0x59A9] = 'E5FC'; z[0x59AA] = 'E5FD'; z[0x59AB] = 'E6A3'; z[0x59AE] = 'C4DD'; z[0x59AF] = 'E6A8'; z[0x59B2] = 'E6A7'; z[0x59B9] = 'C3C3'; z[0x59BB] = 'C6DE'; z[0x59BE] = 'E6AA'; z[0x59C6] = 'C4B7'; z[0x59CA] = 'E6A2'; z[0x59CB] = 'CABC'; z[0x59D0] = 'BDE3'; z[0x59D1] = 'B9C3'; z[0x59D2] = 'E6A6'; z[0x59D3] = 'D0D5'; z[0x59D4] = 'CEAF'; z[0x59D7] = 'E6A9'; z[0x59D8] = 'E6B0'; z[0x59DA] = 'D2A6'; z[0x59DC] = 'BDAA'; z[0x59DD] = 'E6AD'; z[0x59E3] = 'E6AF'; z[0x59E5] = 'C0D1'; z[0x59E8] = 'D2CC'; z[0x59EC] = 'BCA7'; z[0x59F9] = 'E6B1'; z[0x59FB] = 'D2F6'; z[0x59FF] = 'D7CB'; z[0x5A01] = 'CDFE'; z[0x5A03] = 'CDDE'; z[0x5A04] = 'C2A6'; z[0x5A05] = 'E6AB'; z[0x5A06] = 'E6AC'; z[0x5A07] = 'BDBF'; z[0x5A08] = 'E6AE'; z[0x5A09] = 'E6B3'; z[0x5A0C] = 'E6B2'; z[0x5A11] = 'E6B6'; z[0x5A13] = 'E6B8'; z[0x5A18] = 'C4EF'; z[0x5A1C] = 'C4C8'; z[0x5A1F] = 'BEEA'; z[0x5A20] = 'C9EF'; z[0x5A23] = 'E6B7'; z[0x5A25] = 'B6F0'; z[0x5A29] = 'C3E4'; z[0x5A31] = 'D3E9'; z[0x5A32] = 'E6B4'; z[0x5A34] = 'E6B5'; z[0x5A36] = 'C8A2'; z[0x5A3C] = 'E6BD'; z[0x5A40] = 'E6B9'; z[0x5A46] = 'C6C5'; z[0x5A49] = 'CDF1'; z[0x5A4A] = 'E6BB'; z[0x5A55] = 'E6BC'; z[0x5A5A] = 'BBE9'; z[0x5A62] = 'E6BE'; z[0x5A67] = 'E6BA'; z[0x5A6A] = 'C0B7'; z[0x5A74] = 'D3A4'; z[0x5A75] = 'E6BF'; z[0x5A76] = 'C9F4'; z[0x5A77] = 'E6C3'; z[0x5A7A] = 'E6C4'; z[0x5A7F] = 'D0F6'; z[0x5A92] = 'C3BD'; z[0x5A9A] = 'C3C4'; z[0x5A9B] = 'E6C2'; z[0x5AAA] = 'E6C1'; z[0x5AB2] = 'E6C7'; z[0x5AB3] = 'CFB1'; z[0x5AB5] = 'EBF4'; z[0x5AB8] = 'E6CA'; z[0x5ABE] = 'E6C5'; z[0x5AC1] = 'BCDE'; z[0x5AC2] = 'C9A9'; z[0x5AC9] = 'BCB5'; z[0x5ACC] = 'CFD3'; z[0x5AD2] = 'E6C8'; z[0x5AD4] = 'E6C9'; z[0x5AD6] = 'E6CE'; z[0x5AD8] = 'E6D0'; z[0x5ADC] = 'E6D1'; z[0x5AE0] = 'E6CB'; z[0x5AE1] = 'B5D5'; z[0x5AE3] = 'E6CC'; z[0x5AE6] = 'E6CF'; z[0x5AE9] = 'C4DB'; z[0x5AEB] = 'E6C6'; z[0x5AF1] = 'E6CD'; z[0x5B09] = 'E6D2'; z[0x5B16] = 'E6D4'; z[0x5B17] = 'E6D3'; z[0x5B32] = 'E6D5'; z[0x5B34] = 'D9F8'; z[0x5B37] = 'E6D6'; z[0x5B40] = 'E6D7'; z[0x5B50] = 'D7D3'; z[0x5B51] = 'E6DD'; z[0x5B53] = 'E6DE'; z[0x5B54] = 'BFD7'; z[0x5B55] = 'D4D0'; z[0x5B57] = 'D7D6'; z[0x5B58] = 'B4E6'; z[0x5B59] = 'CBEF'; z[0x5B5A] = 'E6DA'; z[0x5B5B] = 'D8C3'; z[0x5B5C] = 'D7CE'; z[0x5B5D] = 'D0A2'; z[0x5B5F] = 'C3CF'; z[0x5B62] = 'E6DF'; z[0x5B63] = 'BCBE'; z[0x5B64] = 'B9C2'; z[0x5B65] = 'E6DB'; z[0x5B66] = 'D1A7'; z[0x5B69] = 'BAA2'; z[0x5B6A] = 'C2CF'; z[0x5B6C] = 'D8AB'; z[0x5B70] = 'CAEB'; z[0x5B71] = 'E5EE'; z[0x5B73] = 'E6DC'; z[0x5B75] = 'B7F5'; z[0x5B7A] = 'C8E6'; z[0x5B7D] = 'C4F5'; z[0x5B80] = 'E5B2'; z[0x5B81] = 'C4FE'; z[0x5B83] = 'CBFC'; z[0x5B84] = 'E5B3'; z[0x5B85] = 'D5AC'; z[0x5B87] = 'D3EE'; z[0x5B88] = 'CAD8'; z[0x5B89] = 'B0B2'; z[0x5B8B] = 'CBCE'; z[0x5B8C] = 'CDEA'; z[0x5B8F] = 'BAEA'; z[0x5B93] = 'E5B5'; z[0x5B95] = 'E5B4'; z[0x5B97] = 'D7DA'; z[0x5B98] = 'B9D9'; z[0x5B99] = 'D6E6'; z[0x5B9A] = 'B6A8'; z[0x5B9B] = 'CDF0'; z[0x5B9C] = 'D2CB'; z[0x5B9D] = 'B1A6'; z[0x5B9E] = 'CAB5'; z[0x5BA0] = 'B3E8'; z[0x5BA1] = 'C9F3'; z[0x5BA2] = 'BFCD'; z[0x5BA3] = 'D0FB'; z[0x5BA4] = 'CAD2'; z[0x5BA5] = 'E5B6'; z[0x5BA6] = 'BBC2'; z[0x5BAA] = 'CFDC'; z[0x5BAB] = 'B9AC'; z[0x5BB0] = 'D4D7'; z[0x5BB3] = 'BAA6'; z[0x5BB4] = 'D1E7'; z[0x5BB5] = 'CFFC'; z[0x5BB6] = 'BCD2'; z[0x5BB8] = 'E5B7'; z[0x5BB9] = 'C8DD'; z[0x5BBD] = 'BFED'; z[0x5BBE] = 'B1F6'; z[0x5BBF] = 'CBDE'; z[0x5BC2] = 'BCC5'; z[0x5BC4] = 'BCC4'; z[0x5BC5] = 'D2FA'; z[0x5BC6] = 'C3DC'; z[0x5BC7] = 'BFDC'; z[0x5BCC] = 'B8BB'; z[0x5BD0] = 'C3C2'; z[0x5BD2] = 'BAAE'; z[0x5BD3] = 'D4A2'; z[0x5BDD] = 'C7DE'; z[0x5BDE] = 'C4AF'; z[0x5BDF] = 'B2EC'; z[0x5BE1] = 'B9D1'; z[0x5BE4] = 'E5BB'; z[0x5BE5] = 'C1C8'; z[0x5BE8] = 'D5AF'; z[0x5BEE] = 'E5BC'; z[0x5BF0] = 'E5BE'; z[0x5BF8] = 'B4E7'; z[0x5BF9] = 'B6D4'; z[0x5BFA] = 'CBC2'; z[0x5BFB] = 'D1B0'; z[0x5BFC] = 'B5BC'; z[0x5BFF] = 'CAD9'; z[0x5C01] = 'B7E2'; z[0x5C04] = 'C9E4'; z[0x5C06] = 'BDAB'; z[0x5C09] = 'CEBE'; z[0x5C0A] = 'D7F0'; z[0x5C0F] = 'D0A1'; z[0x5C11] = 'C9D9'; z[0x5C14] = 'B6FB'; z[0x5C15] = 'E6D8'; z[0x5C16] = 'BCE2'; z[0x5C18] = 'B3BE'; z[0x5C1A] = 'C9D0'; z[0x5C1C] = 'E6D9'; z[0x5C1D] = 'B3A2'; z[0x5C22] = 'DECC'; z[0x5C24] = 'D3C8'; z[0x5C25] = 'DECD'; z[0x5C27] = 'D2A2'; z[0x5C2C] = 'DECE'; z[0x5C31] = 'BECD'; z[0x5C34] = 'DECF'; z[0x5C38] = 'CAAC'; z[0x5C39] = 'D2FC'; z[0x5C3A] = 'B3DF'; z[0x5C3B] = 'E5EA'; z[0x5C3C] = 'C4E1'; z[0x5C3D] = 'BEA1'; z[0x5C3E] = 'CEB2'; z[0x5C3F] = 'C4F2'; z[0x5C40] = 'BED6'; z[0x5C41] = 'C6A8'; z[0x5C42] = 'B2E3'; z[0x5C45] = 'BED3'; z[0x5C48] = 'C7FC'; z[0x5C49] = 'CCEB'; z[0x5C4A] = 'BDEC'; z[0x5C4B] = 'CEDD'; z[0x5C4E] = 'CABA'; z[0x5C4F] = 'C6C1'; z[0x5C50] = 'E5EC'; z[0x5C51] = 'D0BC'; z[0x5C55] = 'D5B9'; z[0x5C59] = 'E5ED'; z[0x5C5E] = 'CAF4'; z[0x5C60] = 'CDC0'; z[0x5C61] = 'C2C5'; z[0x5C63] = 'E5EF'; z[0x5C65] = 'C2C4'; z[0x5C66] = 'E5F0'; z[0x5C6E] = 'E5F8'; z[0x5C6F] = 'CDCD'; z[0x5C71] = 'C9BD'; z[0x5C79] = 'D2D9'; z[0x5C7A] = 'E1A8'; z[0x5C7F] = 'D3EC'; z[0x5C81] = 'CBEA'; z[0x5C82] = 'C6F1'; z[0x5C88] = 'E1AC'; z[0x5C8C] = 'E1A7'; z[0x5C8D] = 'E1A9'; z[0x5C90] = 'E1AA'; z[0x5C91] = 'E1AF'; z[0x5C94] = 'B2ED'; z[0x5C96] = 'E1AB'; z[0x5C97] = 'B8DA'; z[0x5C98] = 'E1AD'; z[0x5C99] = 'E1AE'; z[0x5C9A] = 'E1B0'; z[0x5C9B] = 'B5BA'; z[0x5C9C] = 'E1B1'; z[0x5CA2] = 'E1B3'; z[0x5CA3] = 'E1B8'; z[0x5CA9] = 'D1D2'; z[0x5CAB] = 'E1B6'; z[0x5CAC] = 'E1B5'; z[0x5CAD] = 'C1EB'; z[0x5CB1] = 'E1B7'; z[0x5CB3] = 'D4C0'; z[0x5CB5] = 'E1B2'; z[0x5CB7] = 'E1BA'; z[0x5CB8] = 'B0B6'; z[0x5CBD] = 'E1B4'; z[0x5CBF] = 'BFF9'; z[0x5CC1] = 'E1B9'; z[0x5CC4] = 'E1BB'; z[0x5CCB] = 'E1BE'; z[0x5CD2] = 'E1BC'; z[0x5CD9] = 'D6C5'; z[0x5CE1] = 'CFBF'; z[0x5CE4] = 'E1BD'; z[0x5CE5] = 'E1BF'; z[0x5CE6] = 'C2CD'; z[0x5CE8] = 'B6EB'; z[0x5CEA] = 'D3F8'; z[0x5CED] = 'C7CD'; z[0x5CF0] = 'B7E5'; z[0x5CFB] = 'BEFE'; z[0x5D02] = 'E1C0'; z[0x5D03] = 'E1C1'; z[0x5D06] = 'E1C7'; z[0x5D07] = 'B3E7'; z[0x5D0E] = 'C6E9'; z[0x5D14] = 'B4DE'; z[0x5D16] = 'D1C2'; z[0x5D1B] = 'E1C8'; z[0x5D1E] = 'E1C6'; z[0x5D24] = 'E1C5'; z[0x5D26] = 'E1C3'; z[0x5D27] = 'E1C2'; z[0x5D29] = 'B1C0'; z[0x5D2D] = 'D5B8'; z[0x5D2E] = 'E1C4'; z[0x5D34] = 'E1CB'; z[0x5D3D] = 'E1CC'; z[0x5D3E] = 'E1CA'; z[0x5D47] = 'EFFA'; z[0x5D4A] = 'E1D3'; z[0x5D4B] = 'E1D2'; z[0x5D4C] = 'C7B6'; z[0x5D58] = 'E1C9'; z[0x5D5B] = 'E1CE'; z[0x5D5D] = 'E1D0'; z[0x5D69] = 'E1D4'; z[0x5D6B] = 'E1D1'; z[0x5D6C] = 'E1CD'; z[0x5D6F] = 'E1CF'; z[0x5D74] = 'E1D5'; z[0x5D82] = 'E1D6'; z[0x5D99] = 'E1D7'; z[0x5D9D] = 'E1D8'; z[0x5DB7] = 'E1DA'; z[0x5DC5] = 'E1DB'; z[0x5DCD] = 'CEA1'; z[0x5DDB] = 'E7DD'; z[0x5DDD] = 'B4A8'; z[0x5DDE] = 'D6DD'; z[0x5DE1] = 'D1B2'; z[0x5DE2] = 'B3B2'; z[0x5DE5] = 'B9A4'; z[0x5DE6] = 'D7F3'; z[0x5DE7] = 'C7C9'; z[0x5DE8] = 'BEDE'; z[0x5DE9] = 'B9AE'; z[0x5DEB] = 'CED7'; z[0x5DEE] = 'B2EE'; z[0x5DEF] = 'DBCF'; z[0x5DF1] = 'BCBA'; z[0x5DF2] = 'D2D1'; z[0x5DF3] = 'CBC8'; z[0x5DF4] = 'B0CD'; z[0x5DF7] = 'CFEF'; z[0x5DFD] = 'D9E3'; z[0x5DFE] = 'BDED'; z[0x5E01] = 'B1D2'; z[0x5E02] = 'CAD0'; z[0x5E03] = 'B2BC'; z[0x5E05] = 'CBA7'; z[0x5E06] = 'B7AB'; z[0x5E08] = 'CAA6'; z[0x5E0C] = 'CFA3'; z[0x5E0F] = 'E0F8'; z[0x5E10] = 'D5CA'; z[0x5E11] = 'E0FB'; z[0x5E14] = 'E0FA'; z[0x5E15] = 'C5C1'; z[0x5E16] = 'CCFB'; z[0x5E18] = 'C1B1'; z[0x5E19] = 'E0F9'; z[0x5E1A] = 'D6E3'; z[0x5E1B] = 'B2AF'; z[0x5E1C] = 'D6C4'; z[0x5E1D] = 'B5DB'; z[0x5E26] = 'B4F8'; z[0x5E27] = 'D6A1'; z[0x5E2D] = 'CFAF'; z[0x5E2E] = 'B0EF'; z[0x5E31] = 'E0FC'; z[0x5E37] = 'E1A1'; z[0x5E38] = 'B3A3'; z[0x5E3B] = 'E0FD'; z[0x5E3C] = 'E0FE'; z[0x5E3D] = 'C3B1'; z[0x5E42] = 'C3DD'; z[0x5E44] = 'E1A2'; z[0x5E45] = 'B7F9'; z[0x5E4C] = 'BBCF'; z[0x5E54] = 'E1A3'; z[0x5E55] = 'C4BB'; z[0x5E5B] = 'E1A4'; z[0x5E5E] = 'E1A5'; z[0x5E61] = 'E1A6'; z[0x5E62] = 'B4B1'; z[0x5E72] = 'B8C9'; z[0x5E73] = 'C6BD'; z[0x5E74] = 'C4EA'; z[0x5E76] = 'B2A2'; z[0x5E78] = 'D0D2'; z[0x5E7A] = 'E7DB'; z[0x5E7B] = 'BBC3'; z[0x5E7C] = 'D3D7'; z[0x5E7D] = 'D3C4'; z[0x5E7F] = 'B9E3'; z[0x5E80] = 'E2CF'; z[0x5E84] = 'D7AF'; z[0x5E86] = 'C7EC'; z[0x5E87] = 'B1D3'; z[0x5E8A] = 'B4B2'; z[0x5E8B] = 'E2D1'; z[0x5E8F] = 'D0F2'; z[0x5E90] = 'C2AE'; z[0x5E91] = 'E2D0'; z[0x5E93] = 'BFE2'; z[0x5E94] = 'D3A6'; z[0x5E95] = 'B5D7'; z[0x5E96] = 'E2D2'; z[0x5E97] = 'B5EA'; z[0x5E99] = 'C3ED'; z[0x5E9A] = 'B8FD'; z[0x5E9C] = 'B8AE'; z[0x5E9E] = 'C5D3'; z[0x5E9F] = 'B7CF'; z[0x5EA0] = 'E2D4'; z[0x5EA5] = 'E2D3'; z[0x5EA6] = 'B6C8'; z[0x5EA7] = 'D7F9'; z[0x5EAD] = 'CDA5'; z[0x5EB3] = 'E2D8'; z[0x5EB5] = 'E2D6'; z[0x5EB6] = 'CAFC'; z[0x5EB7] = 'BFB5'; z[0x5EB8] = 'D3B9'; z[0x5EB9] = 'E2D5'; z[0x5EBE] = 'E2D7'; z[0x5EC9] = 'C1AE'; z[0x5ECA] = 'C0C8'; z[0x5ED1] = 'E2DB'; z[0x5ED2] = 'E2DA'; z[0x5ED3] = 'C0AA'; z[0x5ED6] = 'C1CE'; z[0x5EDB] = 'E2DC'; z[0x5EE8] = 'E2DD'; z[0x5EEA] = 'E2DE'; z[0x5EF4] = 'DBC8'; z[0x5EF6] = 'D1D3'; z[0x5EF7] = 'CDA2'; z[0x5EFA] = 'BDA8'; z[0x5EFE] = 'DEC3'; z[0x5EFF] = 'D8A5'; z[0x5F00] = 'BFAA'; z[0x5F01] = 'DBCD'; z[0x5F02] = 'D2EC'; z[0x5F03] = 'C6FA'; z[0x5F04] = 'C5AA'; z[0x5F08] = 'DEC4'; z[0x5F0A] = 'B1D7'; z[0x5F0B] = 'DFAE'; z[0x5F0F] = 'CABD'; z[0x5F11] = 'DFB1'; z[0x5F13] = 'B9AD'; z[0x5F15] = 'D2FD'; z[0x5F17] = 'B8A5'; z[0x5F18] = 'BAEB'; z[0x5F1B] = 'B3DA'; z[0x5F1F] = 'B5DC'; z[0x5F20] = 'D5C5'; z[0x5F25] = 'C3D6'; z[0x5F26] = 'CFD2'; z[0x5F27] = 'BBA1'; z[0x5F29] = 'E5F3'; z[0x5F2A] = 'E5F2'; z[0x5F2D] = 'E5F4'; z[0x5F2F] = 'CDE4'; z[0x5F31] = 'C8F5'; z[0x5F39] = 'B5AF'; z[0x5F3A] = 'C7BF'; z[0x5F3C] = 'E5F6'; z[0x5F40] = 'ECB0'; z[0x5F50] = 'E5E6'; z[0x5F52] = 'B9E9'; z[0x5F53] = 'B5B1'; z[0x5F55] = 'C2BC'; z[0x5F56] = 'E5E8'; z[0x5F57] = 'E5E7'; z[0x5F58] = 'E5E9'; z[0x5F5D] = 'D2CD'; z[0x5F61] = 'E1EA'; z[0x5F62] = 'D0CE'; z[0x5F64] = 'CDAE'; z[0x5F66] = 'D1E5'; z[0x5F69] = 'B2CA'; z[0x5F6A] = 'B1EB'; z[0x5F6C] = 'B1F2'; z[0x5F6D] = 'C5ED'; z[0x5F70] = 'D5C3'; z[0x5F71] = 'D3B0'; z[0x5F73] = 'E1DC'; z[0x5F77] = 'E1DD'; z[0x5F79] = 'D2DB'; z[0x5F7B] = 'B3B9'; z[0x5F7C] = 'B1CB'; z[0x5F80] = 'CDF9'; z[0x5F81] = 'D5F7'; z[0x5F82] = 'E1DE'; z[0x5F84] = 'BEB6'; z[0x5F85] = 'B4FD'; z[0x5F87] = 'E1DF'; z[0x5F88] = 'BADC'; z[0x5F89] = 'E1E0'; z[0x5F8A] = 'BBB2'; z[0x5F8B] = 'C2C9'; z[0x5F8C] = 'E1E1'; z[0x5F90] = 'D0EC'; z[0x5F92] = 'CDBD'; z[0x5F95] = 'E1E2'; z[0x5F97] = 'B5C3'; z[0x5F98] = 'C5C7'; z[0x5F99] = 'E1E3'; z[0x5F9C] = 'E1E4'; z[0x5FA1] = 'D3F9'; z[0x5FA8] = 'E1E5'; z[0x5FAA] = 'D1AD'; z[0x5FAD] = 'E1E6'; z[0x5FAE] = 'CEA2'; z[0x5FB5] = 'E1E7'; z[0x5FB7] = 'B5C2'; z[0x5FBC] = 'E1E8'; z[0x5FBD] = 'BBD5'; z[0x5FC3] = 'D0C4'; z[0x5FC4] = 'E2E0'; z[0x5FC5] = 'B1D8'; z[0x5FC6] = 'D2E4'; z[0x5FC9] = 'E2E1'; z[0x5FCC] = 'BCC9'; z[0x5FCD] = 'C8CC'; z[0x5FCF] = 'E2E3'; z[0x5FD0] = 'ECFE'; z[0x5FD1] = 'ECFD'; z[0x5FD2] = 'DFAF'; z[0x5FD6] = 'E2E2'; z[0x5FD7] = 'D6BE'; z[0x5FD8] = 'CDFC'; z[0x5FD9] = 'C3A6'; z[0x5FDD] = 'E3C3'; z[0x5FE0] = 'D6D2'; z[0x5FE1] = 'E2E7'; z[0x5FE4] = 'E2E8'; z[0x5FE7] = 'D3C7'; z[0x5FEA] = 'E2EC'; z[0x5FEB] = 'BFEC'; z[0x5FED] = 'E2ED'; z[0x5FEE] = 'E2E5'; z[0x5FF1] = 'B3C0'; z[0x5FF5] = 'C4EE'; z[0x5FF8] = 'E2EE'; z[0x5FFB] = 'D0C3'; z[0x5FFD] = 'BAF6'; z[0x5FFE] = 'E2E9'; z[0x5FFF] = 'B7DE'; z[0x6000] = 'BBB3'; z[0x6001] = 'CCAC'; z[0x6002] = 'CBCB'; z[0x6003] = 'E2E4'; z[0x6004] = 'E2E6'; z[0x6005] = 'E2EA'; z[0x6006] = 'E2EB'; z[0x600A] = 'E2F7'; z[0x600D] = 'E2F4'; z[0x600E] = 'D4F5'; z[0x600F] = 'E2F3'; z[0x6012] = 'C5AD'; z[0x6014] = 'D5FA'; z[0x6015] = 'C5C2'; z[0x6016] = 'B2C0'; z[0x6019] = 'E2EF'; z[0x601B] = 'E2F2'; z[0x601C] = 'C1AF'; z[0x601D] = 'CBBC'; z[0x6020] = 'B5A1'; z[0x6021] = 'E2F9'; z[0x6025] = 'BCB1'; z[0x6026] = 'E2F1'; z[0x6027] = 'D0D4'; z[0x6028] = 'D4B9'; z[0x6029] = 'E2F5'; z[0x602A] = 'B9D6'; z[0x602B] = 'E2F6'; z[0x602F] = 'C7D3'; z[0x6035] = 'E2F0'; z[0x603B] = 'D7DC'; z[0x603C] = 'EDA1'; z[0x603F] = 'E2F8'; z[0x6041] = 'EDA5'; z[0x6042] = 'E2FE'; z[0x6043] = 'CAD1'; z[0x604B] = 'C1B5'; z[0x604D] = 'BBD0'; z[0x6050] = 'BFD6'; z[0x6052] = 'BAE3'; z[0x6055] = 'CBA1'; z[0x6059] = 'EDA6'; z[0x605A] = 'EDA3'; z[0x605D] = 'EDA2'; z[0x6062] = 'BBD6'; z[0x6063] = 'EDA7'; z[0x6064] = 'D0F4'; z[0x6067] = 'EDA4'; z[0x6068] = 'BADE'; z[0x6069] = 'B6F7'; z[0x606A] = 'E3A1'; z[0x606B] = 'B6B2'; z[0x606C] = 'CCF1'; z[0x606D] = 'B9A7'; z[0x606F] = 'CFA2'; z[0x6070] = 'C7A1'; z[0x6073] = 'BFD2'; z[0x6076] = 'B6F1'; z[0x6078] = 'E2FA'; z[0x6079] = 'E2FB'; z[0x607A] = 'E2FD'; z[0x607B] = 'E2FC'; z[0x607C] = 'C4D5'; z[0x607D] = 'E3A2'; z[0x607F] = 'D3C1'; z[0x6083] = 'E3A7'; z[0x6084] = 'C7C4'; z[0x6089] = 'CFA4'; z[0x608C] = 'E3A9'; z[0x608D] = 'BAB7'; z[0x6092] = 'E3A8'; z[0x6094] = 'BBDA'; z[0x6096] = 'E3A3'; z[0x609A] = 'E3A4'; z[0x609B] = 'E3AA'; z[0x609D] = 'E3A6'; z[0x609F] = 'CEF2'; z[0x60A0] = 'D3C6'; z[0x60A3] = 'BBBC'; z[0x60A6] = 'D4C3'; z[0x60A8] = 'C4FA'; z[0x60AB] = 'EDA8'; z[0x60AC] = 'D0FC'; z[0x60AD] = 'E3A5'; z[0x60AF] = 'C3F5'; z[0x60B1] = 'E3AD'; z[0x60B2] = 'B1AF'; z[0x60B4] = 'E3B2'; z[0x60B8] = 'BCC2'; z[0x60BB] = 'E3AC'; z[0x60BC] = 'B5BF'; z[0x60C5] = 'C7E9'; z[0x60C6] = 'E3B0'; z[0x60CA] = 'BEAA'; z[0x60CB] = 'CDEF'; z[0x60D1] = 'BBF3'; z[0x60D5] = 'CCE8'; z[0x60D8] = 'E3AF'; z[0x60DA] = 'E3B1'; z[0x60DC] = 'CFA7'; z[0x60DD] = 'E3AE'; z[0x60DF] = 'CEA9'; z[0x60E0] = 'BBDD'; z[0x60E6] = 'B5EB'; z[0x60E7] = 'BEE5'; z[0x60E8] = 'B2D2'; z[0x60E9] = 'B3CD'; z[0x60EB] = 'B1B9'; z[0x60EC] = 'E3AB'; z[0x60ED] = 'B2D1'; z[0x60EE] = 'B5AC'; z[0x60EF] = 'B9DF'; z[0x60F0] = 'B6E8'; z[0x60F3] = 'CFEB'; z[0x60F4] = 'E3B7'; z[0x60F6] = 'BBCC'; z[0x60F9] = 'C8C7'; z[0x60FA] = 'D0CA'; z[0x6100] = 'E3B8'; z[0x6101] = 'B3EE'; z[0x6106] = 'EDA9'; z[0x6108] = 'D3FA'; z[0x6109] = 'D3E4'; z[0x610D] = 'EDAA'; z[0x610E] = 'E3B9'; z[0x610F] = 'D2E2'; z[0x6115] = 'E3B5'; z[0x611A] = 'D3DE'; z[0x611F] = 'B8D0'; z[0x6120] = 'E3B3'; z[0x6123] = 'E3B6'; z[0x6124] = 'B7DF'; z[0x6126] = 'E3B4'; z[0x6127] = 'C0A2'; z[0x612B] = 'E3BA'; z[0x613F] = 'D4B8'; z[0x6148] = 'B4C8'; z[0x614A] = 'E3BB'; z[0x614C] = 'BBC5'; z[0x614E] = 'C9F7'; z[0x6151] = 'C9E5'; z[0x6155] = 'C4BD'; z[0x615D] = 'EDAB'; z[0x6162] = 'C2FD'; z[0x6167] = 'BBDB'; z[0x6168] = 'BFAE'; z[0x6170] = 'CEBF'; z[0x6175] = 'E3BC'; z[0x6177] = 'BFB6'; z[0x618B] = 'B1EF'; z[0x618E] = 'D4F7'; z[0x6194] = 'E3BE'; z[0x619D] = 'EDAD'; z[0x61A7] = 'E3BF'; z[0x61A8] = 'BAA9'; z[0x61A9] = 'EDAC'; z[0x61AC] = 'E3BD'; z[0x61B7] = 'E3C0'; z[0x61BE] = 'BAB6'; z[0x61C2] = 'B6AE'; z[0x61C8] = 'D0B8'; z[0x61CA] = 'B0C3'; z[0x61CB] = 'EDAE'; z[0x61D1] = 'EDAF'; z[0x61D2] = 'C0C1'; z[0x61D4] = 'E3C1'; z[0x61E6] = 'C5B3'; z[0x61F5] = 'E3C2'; z[0x61FF] = 'DCB2'; z[0x6206] = 'EDB0'; z[0x6208] = 'B8EA'; z[0x620A] = 'CEEC'; z[0x620B] = 'EAA7'; z[0x620C] = 'D0E7'; z[0x620D] = 'CAF9'; z[0x620E] = 'C8D6'; z[0x620F] = 'CFB7'; z[0x6210] = 'B3C9'; z[0x6211] = 'CED2'; z[0x6212] = 'BDE4'; z[0x6215] = 'E3DE'; z[0x6216] = 'BBF2'; z[0x6217] = 'EAA8'; z[0x6218] = 'D5BD'; z[0x621A] = 'C6DD'; z[0x621B] = 'EAA9'; z[0x621F] = 'EAAA'; z[0x6221] = 'EAAC'; z[0x6222] = 'EAAB'; z[0x6224] = 'EAAE'; z[0x6225] = 'EAAD'; z[0x622A] = 'BDD8'; z[0x622C] = 'EAAF'; z[0x622E] = 'C2BE'; z[0x6233] = 'B4C1'; z[0x6234] = 'B4F7'; z[0x6237] = 'BBA7'; z[0x623D] = 'ECE6'; z[0x623E] = 'ECE5'; z[0x623F] = 'B7BF'; z[0x6240] = 'CBF9'; z[0x6241] = 'B1E2'; z[0x6243] = 'ECE7'; z[0x6247] = 'C9C8'; z[0x6248] = 'ECE8'; z[0x6249] = 'ECE9'; z[0x624B] = 'CAD6'; z[0x624C] = 'DED0'; z[0x624D] = 'B2C5'; z[0x624E] = 'D4FA'; z[0x6251] = 'C6CB'; z[0x6252] = 'B0C7'; z[0x6253] = 'B4F2'; z[0x6254] = 'C8D3'; z[0x6258] = 'CDD0'; z[0x625B] = 'BFB8'; z[0x6263] = 'BFDB'; z[0x6266] = 'C7A4'; z[0x6267] = 'D6B4'; z[0x6269] = 'C0A9'; z[0x626A] = 'DED1'; z[0x626B] = 'C9A8'; z[0x626C] = 'D1EF'; z[0x626D] = 'C5A4'; z[0x626E] = 'B0E7'; z[0x626F] = 'B3B6'; z[0x6270] = 'C8C5'; z[0x6273] = 'B0E2'; z[0x6276] = 'B7F6'; z[0x6279] = 'C5FA'; z[0x627C] = 'B6F3'; z[0x627E] = 'D5D2'; z[0x627F] = 'B3D0'; z[0x6280] = 'BCBC'; z[0x6284] = 'B3AD'; z[0x6289] = 'BEF1'; z[0x628A] = 'B0D1'; z[0x6291] = 'D2D6'; z[0x6292] = 'CAE3'; z[0x6293] = 'D7A5'; z[0x6295] = 'CDB6'; z[0x6296] = 'B6B6'; z[0x6297] = 'BFB9'; z[0x6298] = 'D5DB'; z[0x629A] = 'B8A7'; z[0x629B] = 'C5D7'; z[0x629F] = 'DED2'; z[0x62A0] = 'BFD9'; z[0x62A1] = 'C2D5'; z[0x62A2] = 'C7C0'; z[0x62A4] = 'BBA4'; z[0x62A5] = 'B1A8'; z[0x62A8] = 'C5EA'; z[0x62AB] = 'C5FB'; z[0x62AC] = 'CCA7'; z[0x62B1] = 'B1A7'; z[0x62B5] = 'B5D6'; z[0x62B9] = 'C4A8'; z[0x62BB] = 'DED3'; z[0x62BC] = 'D1BA'; z[0x62BD] = 'B3E9'; z[0x62BF] = 'C3F2'; z[0x62C2] = 'B7F7'; z[0x62C4] = 'D6F4'; z[0x62C5] = 'B5A3'; z[0x62C6] = 'B2F0'; z[0x62C7] = 'C4B4'; z[0x62C8] = 'C4E9'; z[0x62C9] = 'C0AD'; z[0x62CA] = 'DED4'; z[0x62CC] = 'B0E8'; z[0x62CD] = 'C5C4'; z[0x62CE] = 'C1E0'; z[0x62D0] = 'B9D5'; z[0x62D2] = 'BEDC'; z[0x62D3] = 'CDD8'; z[0x62D4] = 'B0CE'; z[0x62D6] = 'CDCF'; z[0x62D7] = 'DED6'; z[0x62D8] = 'BED0'; z[0x62D9] = 'D7BE'; z[0x62DA] = 'DED5'; z[0x62DB] = 'D5D0'; z[0x62DC] = 'B0DD'; z[0x62DF] = 'C4E2'; z[0x62E2] = 'C2A3'; z[0x62E3] = 'BCF0'; z[0x62E5] = 'D3B5'; z[0x62E6] = 'C0B9'; z[0x62E7] = 'C5A1'; z[0x62E8] = 'B2A6'; z[0x62E9] = 'D4F1'; z[0x62EC] = 'C0A8'; z[0x62ED] = 'CAC3'; z[0x62EE] = 'DED7'; z[0x62EF] = 'D5FC'; z[0x62F1] = 'B9B0'; z[0x62F3] = 'C8AD'; z[0x62F4] = 'CBA9'; z[0x62F6] = 'DED9'; z[0x62F7] = 'BFBD'; z[0x62FC] = 'C6B4'; z[0x62FD] = 'D7A7'; z[0x62FE] = 'CAB0'; z[0x62FF] = 'C4C3'; z[0x6301] = 'B3D6'; z[0x6302] = 'B9D2'; z[0x6307] = 'D6B8'; z[0x6308] = 'EAFC'; z[0x6309] = 'B0B4'; z[0x630E] = 'BFE6'; z[0x6311] = 'CCF4'; z[0x6316] = 'CDDA'; z[0x631A] = 'D6BF'; z[0x631B] = 'C2CE'; z[0x631D] = 'CECE'; z[0x631E] = 'CCA2'; z[0x631F] = 'D0AE'; z[0x6320] = 'C4D3'; z[0x6321] = 'B5B2'; z[0x6322] = 'DED8'; z[0x6323] = 'D5F5'; z[0x6324] = 'BCB7'; z[0x6325] = 'BBD3'; z[0x6328] = 'B0A4'; z[0x632A] = 'C5B2'; z[0x632B] = 'B4EC'; z[0x632F] = 'D5F1'; z[0x6332] = 'EAFD'; z[0x6339] = 'DEDA'; z[0x633A] = 'CDA6'; z[0x633D] = 'CDEC'; z[0x6342] = 'CEE6'; z[0x6343] = 'DEDC'; z[0x6345] = 'CDB1'; z[0x6346] = 'C0A6'; z[0x6349] = 'D7BD'; z[0x634B] = 'DEDB'; z[0x634C] = 'B0C6'; z[0x634D] = 'BAB4'; z[0x634E] = 'C9D3'; z[0x634F] = 'C4F3'; z[0x6350] = 'BEE8'; z[0x6355] = 'B2B6'; z[0x635E] = 'C0CC'; z[0x635F] = 'CBF0'; z[0x6361] = 'BCF1'; z[0x6362] = 'BBBB'; z[0x6363] = 'B5B7'; z[0x6367] = 'C5F5'; z[0x6369] = 'DEE6'; z[0x636D] = 'DEE3'; z[0x636E] = 'BEDD'; z[0x6371] = 'DEDF'; z[0x6376] = 'B4B7'; z[0x6377] = 'BDDD'; z[0x637A] = 'DEE0'; z[0x637B] = 'C4ED'; z[0x6380] = 'CFC6'; z[0x6382] = 'B5E0'; z[0x6387] = 'B6DE'; z[0x6388] = 'CADA'; z[0x6389] = 'B5F4'; z[0x638A] = 'DEE5'; z[0x638C] = 'D5C6'; z[0x638E] = 'DEE1'; z[0x638F] = 'CCCD'; z[0x6390] = 'C6FE'; z[0x6392] = 'C5C5'; z[0x6396] = 'D2B4'; z[0x6398] = 'BEF2'; z[0x63A0] = 'C2D3'; z[0x63A2] = 'CCBD'; z[0x63A3] = 'B3B8'; z[0x63A5] = 'BDD3'; z[0x63A7] = 'BFD8'; z[0x63A8] = 'CDC6'; z[0x63A9] = 'D1DA'; z[0x63AA] = 'B4EB'; z[0x63AC] = 'DEE4'; z[0x63AD] = 'DEDD'; z[0x63AE] = 'DEE7'; z[0x63B0] = 'EAFE'; z[0x63B3] = 'C2B0'; z[0x63B4] = 'DEE2'; z[0x63B7] = 'D6C0'; z[0x63B8] = 'B5A7'; z[0x63BA] = 'B2F4'; z[0x63BC] = 'DEE8'; z[0x63BE] = 'DEF2'; z[0x63C4] = 'DEED'; z[0x63C6] = 'DEF1'; z[0x63C9] = 'C8E0'; z[0x63CD] = 'D7E1'; z[0x63CE] = 'DEEF'; z[0x63CF] = 'C3E8'; z[0x63D0] = 'CCE1'; z[0x63D2] = 'B2E5'; z[0x63D6] = 'D2BE'; z[0x63DE] = 'DEEE'; z[0x63E0] = 'DEEB'; z[0x63E1] = 'CED5'; z[0x63E3] = 'B4A7'; z[0x63E9] = 'BFAB'; z[0x63EA] = 'BEBE'; z[0x63ED] = 'BDD2'; z[0x63F2] = 'DEE9'; z[0x63F4] = 'D4AE'; z[0x63F6] = 'DEDE'; z[0x63F8] = 'DEEA'; z[0x63FD] = 'C0BF'; z[0x63FF] = 'DEEC'; z[0x6400] = 'B2F3'; z[0x6401] = 'B8E9'; z[0x6402] = 'C2A7'; z[0x6405] = 'BDC1'; z[0x640B] = 'DEF5'; z[0x640C] = 'DEF8'; z[0x640F] = 'B2AB'; z[0x6410] = 'B4A4'; z[0x6413] = 'B4EA'; z[0x6414] = 'C9A6'; z[0x641B] = 'DEF6'; z[0x641C] = 'CBD1'; z[0x641E] = 'B8E3'; z[0x6420] = 'DEF7'; z[0x6421] = 'DEFA'; z[0x6426] = 'DEF9'; z[0x642A] = 'CCC2'; z[0x642C] = 'B0E1'; z[0x642D] = 'B4EE'; z[0x6434] = 'E5BA'; z[0x643A] = 'D0AF'; z[0x643D] = 'B2EB'; z[0x643F] = 'EBA1'; z[0x6441] = 'DEF4'; z[0x6444] = 'C9E3'; z[0x6445] = 'DEF3'; z[0x6446] = 'B0DA'; z[0x6447] = 'D2A1'; z[0x6448] = 'B1F7'; z[0x644A] = 'CCAF'; z[0x6452] = 'DEF0'; z[0x6454] = 'CBA4'; z[0x6458] = 'D5AA'; z[0x645E] = 'DEFB'; z[0x6467] = 'B4DD'; z[0x6469] = 'C4A6'; z[0x646D] = 'DEFD'; z[0x6478] = 'C3FE'; z[0x6479] = 'C4A1'; z[0x647A] = 'DFA1'; z[0x6482] = 'C1CC'; z[0x6484] = 'DEFC'; z[0x6485] = 'BEEF'; z[0x6487] = 'C6B2'; z[0x6491] = 'B3C5'; z[0x6492] = 'C8F6'; z[0x6495] = 'CBBA'; z[0x6496] = 'DEFE'; z[0x6499] = 'DFA4'; z[0x649E] = 'D7B2'; z[0x64A4] = 'B3B7'; z[0x64A9] = 'C1C3'; z[0x64AC] = 'C7CB'; z[0x64AD] = 'B2A5'; z[0x64AE] = 'B4E9'; z[0x64B0] = 'D7AB'; z[0x64B5] = 'C4EC'; z[0x64B7] = 'DFA2'; z[0x64B8] = 'DFA3'; z[0x64BA] = 'DFA5'; z[0x64BC] = 'BAB3'; z[0x64C0] = 'DFA6'; z[0x64C2] = 'C0DE'; z[0x64C5] = 'C9C3'; z[0x64CD] = 'B2D9'; z[0x64CE] = 'C7E6'; z[0x64D0] = 'DFA7'; z[0x64D2] = 'C7DC'; z[0x64D7] = 'DFA8'; z[0x64D8] = 'EBA2'; z[0x64DE] = 'CBD3'; z[0x64E2] = 'DFAA'; z[0x64E4] = 'DFA9'; z[0x64E6] = 'B2C1'; z[0x6500] = 'C5CA'; z[0x6509] = 'DFAB'; z[0x6512] = 'D4DC'; z[0x6518] = 'C8C1'; z[0x6525] = 'DFAC'; z[0x652B] = 'BEF0'; z[0x652E] = 'DFAD'; z[0x652F] = 'D6A7'; z[0x6534] = 'EAB7'; z[0x6535] = 'EBB6'; z[0x6536] = 'CAD5'; z[0x6538] = 'D8FC'; z[0x6539] = 'B8C4'; z[0x653B] = 'B9A5'; z[0x653E] = 'B7C5'; z[0x653F] = 'D5FE'; z[0x6545] = 'B9CA'; z[0x6548] = 'D0A7'; z[0x6549] = 'F4CD'; z[0x654C] = 'B5D0'; z[0x654F] = 'C3F4'; z[0x6551] = 'BEC8'; z[0x6555] = 'EBB7'; z[0x6556] = 'B0BD'; z[0x6559] = 'BDCC'; z[0x655B] = 'C1B2'; z[0x655D] = 'B1D6'; z[0x655E] = 'B3A8'; z[0x6562] = 'B8D2'; z[0x6563] = 'C9A2'; z[0x6566] = 'B6D8'; z[0x656B] = 'EBB8'; z[0x656C] = 'BEB4'; z[0x6570] = 'CAFD'; z[0x6572] = 'C7C3'; z[0x6574] = 'D5FB'; z[0x6577] = 'B7F3'; z[0x6587] = 'CEC4'; z[0x658B] = 'D5AB'; z[0x658C] = 'B1F3'; z[0x6590] = 'ECB3'; z[0x6591] = 'B0DF'; z[0x6593] = 'ECB5'; z[0x6597] = 'B6B7'; z[0x6599] = 'C1CF'; z[0x659B] = 'F5FA'; z[0x659C] = 'D0B1'; z[0x659F] = 'D5E5'; z[0x65A1] = 'CED3'; z[0x65A4] = 'BDEF'; z[0x65A5] = 'B3E2'; z[0x65A7] = 'B8AB'; z[0x65A9] = 'D5B6'; z[0x65AB] = 'EDBD'; z[0x65AD] = 'B6CF'; z[0x65AF] = 'CBB9'; z[0x65B0] = 'D0C2'; z[0x65B9] = 'B7BD'; z[0x65BC] = 'ECB6'; z[0x65BD] = 'CAA9'; z[0x65C1] = 'C5D4'; z[0x65C3] = 'ECB9'; z[0x65C4] = 'ECB8'; z[0x65C5] = 'C2C3'; z[0x65C6] = 'ECB7'; z[0x65CB] = 'D0FD'; z[0x65CC] = 'ECBA'; z[0x65CE] = 'ECBB'; z[0x65CF] = 'D7E5'; z[0x65D2] = 'ECBC'; z[0x65D6] = 'ECBD'; z[0x65D7] = 'C6EC'; z[0x65E0] = 'CEDE'; z[0x65E2] = 'BCC8'; z[0x65E5] = 'C8D5'; z[0x65E6] = 'B5A9'; z[0x65E7] = 'BEC9'; z[0x65E8] = 'D6BC'; z[0x65E9] = 'D4E7'; z[0x65EC] = 'D1AE'; z[0x65ED] = 'D0F1'; z[0x65EE] = 'EAB8'; z[0x65EF] = 'EAB9'; z[0x65F0] = 'EABA'; z[0x65F1] = 'BAB5'; z[0x65F6] = 'CAB1'; z[0x65F7] = 'BFF5'; z[0x65FA] = 'CDFA'; z[0x6600] = 'EAC0'; z[0x6602] = 'B0BA'; z[0x6603] = 'EABE'; z[0x6606] = 'C0A5'; z[0x660A] = 'EABB'; z[0x660C] = 'B2FD'; z[0x660E] = 'C3F7'; z[0x660F] = 'BBE8'; z[0x6613] = 'D2D7'; z[0x6614] = 'CEF4'; z[0x6615] = 'EABF'; z[0x6619] = 'EABC'; z[0x661D] = 'EAC3'; z[0x661F] = 'D0C7'; z[0x6620] = 'D3B3'; z[0x6625] = 'B4BA'; z[0x6627] = 'C3C1'; z[0x6628] = 'D7F2'; z[0x662D] = 'D5D1'; z[0x662F] = 'CAC7'; z[0x6631] = 'EAC5'; z[0x6634] = 'EAC4'; z[0x6635] = 'EAC7'; z[0x6636] = 'EAC6'; z[0x663C] = 'D6E7'; z[0x663E] = 'CFD4'; z[0x6641] = 'EACB'; z[0x6643] = 'BBCE'; z[0x664B] = 'BDFA'; z[0x664C] = 'C9CE'; z[0x664F] = 'EACC'; z[0x6652] = 'C9B9'; z[0x6653] = 'CFFE'; z[0x6654] = 'EACA'; z[0x6655] = 'D4CE'; z[0x6656] = 'EACD'; z[0x6657] = 'EACF'; z[0x665A] = 'CDED'; z[0x665F] = 'EAC9'; z[0x6661] = 'EACE'; z[0x6664] = 'CEEE'; z[0x6666] = 'BBDE'; z[0x6668] = 'B3BF'; z[0x666E] = 'C6D5'; z[0x666F] = 'BEB0'; z[0x6670] = 'CEFA'; z[0x6674] = 'C7E7'; z[0x6676] = 'BEA7'; z[0x6677] = 'EAD0'; z[0x667A] = 'D6C7'; z[0x667E] = 'C1C0'; z[0x6682] = 'D4DD'; z[0x6684] = 'EAD1'; z[0x6687] = 'CFBE'; z[0x668C] = 'EAD2'; z[0x6691] = 'CAEE'; z[0x6696] = 'C5AF'; z[0x6697] = 'B0B5'; z[0x669D] = 'EAD4'; z[0x66A7] = 'EAD3'; z[0x66A8] = 'F4DF'; z[0x66AE] = 'C4BA'; z[0x66B4] = 'B1A9'; z[0x66B9] = 'E5DF'; z[0x66BE] = 'EAD5'; z[0x66D9] = 'CAEF'; z[0x66DB] = 'EAD6'; z[0x66DC] = 'EAD7'; z[0x66DD] = 'C6D8'; z[0x66E6] = 'EAD8'; z[0x66E9] = 'EAD9'; z[0x66F0] = 'D4BB'; z[0x66F2] = 'C7FA'; z[0x66F3] = 'D2B7'; z[0x66F4] = 'B8FC'; z[0x66F7] = 'EAC2'; z[0x66F9] = 'B2DC'; z[0x66FC] = 'C2FC'; z[0x66FE] = 'D4F8'; z[0x66FF] = 'CCE6'; z[0x6700] = 'D7EE'; z[0x6708] = 'D4C2'; z[0x6709] = 'D3D0'; z[0x670A] = 'EBC3'; z[0x670B] = 'C5F3'; z[0x670D] = 'B7FE'; z[0x6710] = 'EBD4'; z[0x6714] = 'CBB7'; z[0x6715] = 'EBDE'; z[0x6717] = 'C0CA'; z[0x671B] = 'CDFB'; z[0x671D] = 'B3AF'; z[0x671F] = 'C6DA'; z[0x6726] = 'EBFC'; z[0x6728] = 'C4BE'; z[0x672A] = 'CEB4'; z[0x672B] = 'C4A9'; z[0x672C] = 'B1BE'; z[0x672D] = 'D4FD'; z[0x672F] = 'CAF5'; z[0x6731] = 'D6EC'; z[0x6734] = 'C6D3'; z[0x6735] = 'B6E4'; z[0x673A] = 'BBFA'; z[0x673D] = 'D0E0'; z[0x6740] = 'C9B1'; z[0x6742] = 'D4D3'; z[0x6743] = 'C8A8'; z[0x6746] = 'B8CB'; z[0x6748] = 'E8BE'; z[0x6749] = 'C9BC'; z[0x674C] = 'E8BB'; z[0x674E] = 'C0EE'; z[0x674F] = 'D0D3'; z[0x6750] = 'B2C4'; z[0x6751] = 'B4E5'; z[0x6753] = 'E8BC'; z[0x6756] = 'D5C8'; z[0x675C] = 'B6C5'; z[0x675E] = 'E8BD'; z[0x675F] = 'CAF8'; z[0x6760] = 'B8DC'; z[0x6761] = 'CCF5'; z[0x6765] = 'C0B4'; z[0x6768] = 'D1EE'; z[0x6769] = 'E8BF'; z[0x676A] = 'E8C2'; z[0x676D] = 'BABC'; z[0x676F] = 'B1AD'; z[0x6770] = 'BDDC'; z[0x6772] = 'EABD'; z[0x6773] = 'E8C3'; z[0x6775] = 'E8C6'; z[0x6777] = 'E8CB'; z[0x677C] = 'E8CC'; z[0x677E] = 'CBC9'; z[0x677F] = 'B0E5'; z[0x6781] = 'BCAB'; z[0x6784] = 'B9B9'; z[0x6787] = 'E8C1'; z[0x6789] = 'CDF7'; z[0x678B] = 'E8CA'; z[0x6790] = 'CEF6'; z[0x6795] = 'D5ED'; z[0x6797] = 'C1D6'; z[0x6798] = 'E8C4'; z[0x679A] = 'C3B6'; z[0x679C] = 'B9FB'; z[0x679D] = 'D6A6'; z[0x679E] = 'E8C8'; z[0x67A2] = 'CAE0'; z[0x67A3] = 'D4E6'; z[0x67A5] = 'E8C0'; z[0x67A7] = 'E8C5'; z[0x67A8] = 'E8C7'; z[0x67AA] = 'C7B9'; z[0x67AB] = 'B7E3'; z[0x67AD] = 'E8C9'; z[0x67AF] = 'BFDD'; z[0x67B0] = 'E8D2'; z[0x67B3] = 'E8D7'; z[0x67B5] = 'E8D5'; z[0x67B6] = 'BCDC'; z[0x67B7] = 'BCCF'; z[0x67B8] = 'E8DB'; z[0x67C1] = 'E8DE'; z[0x67C3] = 'E8DA'; z[0x67C4] = 'B1FA'; z[0x67CF] = 'B0D8'; z[0x67D0] = 'C4B3'; z[0x67D1] = 'B8CC'; z[0x67D2] = 'C6E2'; z[0x67D3] = 'C8BE'; z[0x67D4] = 'C8E1'; z[0x67D8] = 'E8CF'; z[0x67D9] = 'E8D4'; z[0x67DA] = 'E8D6'; z[0x67DC] = 'B9F1'; z[0x67DD] = 'E8D8'; z[0x67DE] = 'D7F5'; z[0x67E0] = 'C4FB'; z[0x67E2] = 'E8DC'; z[0x67E5] = 'B2E9'; z[0x67E9] = 'E8D1'; z[0x67EC] = 'BCED'; z[0x67EF] = 'BFC2'; z[0x67F0] = 'E8CD'; z[0x67F1] = 'D6F9'; z[0x67F3] = 'C1F8'; z[0x67F4] = 'B2F1'; z[0x67FD] = 'E8DF'; z[0x67FF] = 'CAC1'; z[0x6800] = 'E8D9'; z[0x6805] = 'D5A4'; z[0x6807] = 'B1EA'; z[0x6808] = 'D5BB'; z[0x6809] = 'E8CE'; z[0x680A] = 'E8D0'; z[0x680B] = 'B6B0'; z[0x680C] = 'E8D3'; z[0x680E] = 'E8DD'; z[0x680F] = 'C0B8'; z[0x6811] = 'CAF7'; z[0x6813] = 'CBA8'; z[0x6816] = 'C6DC'; z[0x6817] = 'C0F5'; z[0x681D] = 'E8E9'; z[0x6821] = 'D0A3'; z[0x6829] = 'E8F2'; z[0x682A] = 'D6EA'; z[0x6832] = 'E8E0'; z[0x6833] = 'E8E1'; z[0x6837] = 'D1F9'; z[0x6838] = 'BACB'; z[0x6839] = 'B8F9'; z[0x683C] = 'B8F1'; z[0x683D] = 'D4D4'; z[0x683E] = 'E8EF'; z[0x6840] = 'E8EE'; z[0x6841] = 'E8EC'; z[0x6842] = 'B9F0'; z[0x6843] = 'CCD2'; z[0x6844] = 'E8E6'; z[0x6845] = 'CEA6'; z[0x6846] = 'BFF2'; z[0x6848] = 'B0B8'; z[0x6849] = 'E8F1'; z[0x684A] = 'E8F0'; z[0x684C] = 'D7C0'; z[0x684E] = 'E8E4'; z[0x6850] = 'CDA9'; z[0x6851] = 'C9A3'; z[0x6853] = 'BBB8'; z[0x6854] = 'BDDB'; z[0x6855] = 'E8EA'; z[0x6860] = 'E8E2'; z[0x6861] = 'E8E3'; z[0x6862] = 'E8E5'; z[0x6863] = 'B5B5'; z[0x6864] = 'E8E7'; z[0x6865] = 'C7C5'; z[0x6866] = 'E8EB'; z[0x6867] = 'E8ED'; z[0x6868] = 'BDB0'; z[0x6869] = 'D7AE'; z[0x686B] = 'E8F8'; z[0x6874] = 'E8F5'; z[0x6876] = 'CDB0'; z[0x6877] = 'E8F6'; z[0x6881] = 'C1BA'; z[0x6883] = 'E8E8'; z[0x6885] = 'C3B7'; z[0x6886] = 'B0F0'; z[0x688F] = 'E8F4'; z[0x6893] = 'E8F7'; z[0x6897] = 'B9A3'; z[0x68A2] = 'C9D2'; z[0x68A6] = 'C3CE'; z[0x68A7] = 'CEE0'; z[0x68A8] = 'C0E6'; z[0x68AD] = 'CBF3'; z[0x68AF] = 'CCDD'; z[0x68B0] = 'D0B5'; z[0x68B3] = 'CAE1'; z[0x68B5] = 'E8F3'; z[0x68C0] = 'BCEC'; z[0x68C2] = 'E8F9'; z[0x68C9] = 'C3DE'; z[0x68CB] = 'C6E5'; z[0x68CD] = 'B9F7'; z[0x68D2] = 'B0F4'; z[0x68D5] = 'D7D8'; z[0x68D8] = 'BCAC'; z[0x68DA] = 'C5EF'; z[0x68E0] = 'CCC4'; z[0x68E3] = 'E9A6'; z[0x68EE] = 'C9AD'; z[0x68F0] = 'E9A2'; z[0x68F1] = 'C0E2'; z[0x68F5] = 'BFC3'; z[0x68F9] = 'E8FE'; z[0x68FA] = 'B9D7'; z[0x68FC] = 'E8FB'; z[0x6901] = 'E9A4'; z[0x6905] = 'D2CE'; z[0x690B] = 'E9A3'; z[0x690D] = 'D6B2'; z[0x690E] = 'D7B5'; z[0x6910] = 'E9A7'; z[0x6912] = 'BDB7'; z[0x691F] = 'E8FC'; z[0x6920] = 'E8FD'; z[0x6924] = 'E9A1'; z[0x692D] = 'CDD6'; z[0x6930] = 'D2AC'; z[0x6934] = 'E9B2'; z[0x6939] = 'E9A9'; z[0x693D] = 'B4AA'; z[0x693F] = 'B4BB'; z[0x6942] = 'E9AB'; z[0x6954] = 'D0A8'; z[0x6957] = 'E9A5'; z[0x695A] = 'B3FE'; z[0x695D] = 'E9AC'; z[0x695E] = 'C0E3'; z[0x6960] = 'E9AA'; z[0x6963] = 'E9B9'; z[0x6966] = 'E9B8'; z[0x696B] = 'E9AE'; z[0x696E] = 'E8FA'; z[0x6971] = 'E9A8'; z[0x6977] = 'BFAC'; z[0x6978] = 'E9B1'; z[0x6979] = 'E9BA'; z[0x697C] = 'C2A5'; z[0x6980] = 'E9AF'; z[0x6982] = 'B8C5'; z[0x6984] = 'E9AD'; z[0x6986] = 'D3DC'; z[0x6987] = 'E9B4'; z[0x6988] = 'E9B5'; z[0x6989] = 'E9B7'; z[0x698D] = 'E9C7'; z[0x6994] = 'C0C6'; z[0x6995] = 'E9C5'; z[0x6998] = 'E9B0'; z[0x699B] = 'E9BB'; z[0x699C] = 'B0F1'; z[0x69A7] = 'E9BC'; z[0x69A8] = 'D5A5'; z[0x69AB] = 'E9BE'; z[0x69AD] = 'E9BF'; z[0x69B1] = 'E9C1'; z[0x69B4] = 'C1F1'; z[0x69B7] = 'C8B6'; z[0x69BB] = 'E9BD'; z[0x69C1] = 'E9C2'; z[0x69CA] = 'E9C3'; z[0x69CC] = 'E9B3'; z[0x69CE] = 'E9B6'; z[0x69D0] = 'BBB1'; z[0x69D4] = 'E9C0'; z[0x69DB] = 'BCF7'; z[0x69DF] = 'E9C4'; z[0x69E0] = 'E9C6'; z[0x69ED] = 'E9CA'; z[0x69F2] = 'E9CE'; z[0x69FD] = 'B2DB'; z[0x69FF] = 'E9C8'; z[0x6A0A] = 'B7AE'; z[0x6A17] = 'E9CB'; z[0x6A18] = 'E9CC'; z[0x6A1F] = 'D5C1'; z[0x6A21] = 'C4A3'; z[0x6A28] = 'E9D8'; z[0x6A2A] = 'BAE1'; z[0x6A2F] = 'E9C9'; z[0x6A31] = 'D3A3'; z[0x6A35] = 'E9D4'; z[0x6A3D] = 'E9D7'; z[0x6A3E] = 'E9D0'; z[0x6A44] = 'E9CF'; z[0x6A47] = 'C7C1'; z[0x6A50] = 'E9D2'; z[0x6A58] = 'E9D9'; z[0x6A59] = 'B3C8'; z[0x6A5B] = 'E9D3'; z[0x6A61] = 'CFF0'; z[0x6A65] = 'E9CD'; z[0x6A71] = 'B3F7'; z[0x6A79] = 'E9D6'; z[0x6A7C] = 'E9DA'; z[0x6A80] = 'CCB4'; z[0x6A84] = 'CFAD'; z[0x6A8E] = 'E9D5'; z[0x6A90] = 'E9DC'; z[0x6A91] = 'E9DB'; z[0x6A97] = 'E9DE'; z[0x6AA0] = 'E9D1'; z[0x6AA9] = 'E9DD'; z[0x6AAB] = 'E9DF'; z[0x6AAC] = 'C3CA'; z[0x6B20] = 'C7B7'; z[0x6B21] = 'B4CE'; z[0x6B22] = 'BBB6'; z[0x6B23] = 'D0C0'; z[0x6B24] = 'ECA3'; z[0x6B27] = 'C5B7'; z[0x6B32] = 'D3FB'; z[0x6B37] = 'ECA4'; z[0x6B39] = 'ECA5'; z[0x6B3A] = 'C6DB'; z[0x6B3E] = 'BFEE'; z[0x6B43] = 'ECA6'; z[0x6B46] = 'ECA7'; z[0x6B47] = 'D0AA'; z[0x6B49] = 'C7B8'; z[0x6B4C] = 'B8E8'; z[0x6B59] = 'ECA8'; z[0x6B62] = 'D6B9'; z[0x6B63] = 'D5FD'; z[0x6B64] = 'B4CB'; z[0x6B65] = 'B2BD'; z[0x6B66] = 'CEE4'; z[0x6B67] = 'C6E7'; z[0x6B6A] = 'CDE1'; z[0x6B79] = 'B4F5'; z[0x6B7B] = 'CBC0'; z[0x6B7C] = 'BCDF'; z[0x6B81] = 'E9E2'; z[0x6B82] = 'E9E3'; z[0x6B83] = 'D1EA'; z[0x6B84] = 'E9E5'; z[0x6B86] = 'B4F9'; z[0x6B87] = 'E9E4'; z[0x6B89] = 'D1B3'; z[0x6B8A] = 'CAE2'; z[0x6B8B] = 'B2D0'; z[0x6B8D] = 'E9E8'; z[0x6B92] = 'E9E6'; z[0x6B93] = 'E9E7'; z[0x6B96] = 'D6B3'; z[0x6B9A] = 'E9E9'; z[0x6B9B] = 'E9EA'; z[0x6BA1] = 'E9EB'; z[0x6BAA] = 'E9EC'; z[0x6BB3] = 'ECAF'; z[0x6BB4] = 'C5B9'; z[0x6BB5] = 'B6CE'; z[0x6BB7] = 'D2F3'; z[0x6BBF] = 'B5EE'; z[0x6BC1] = 'BBD9'; z[0x6BC2] = 'ECB1'; z[0x6BC5] = 'D2E3'; z[0x6BCB] = 'CEE3'; z[0x6BCD] = 'C4B8'; z[0x6BCF] = 'C3BF'; z[0x6BD2] = 'B6BE'; z[0x6BD3] = 'D8B9'; z[0x6BD4] = 'B1C8'; z[0x6BD5] = 'B1CF'; z[0x6BD6] = 'B1D1'; z[0x6BD7] = 'C5FE'; z[0x6BD9] = 'B1D0'; z[0x6BDB] = 'C3AB'; z[0x6BE1] = 'D5B1'; z[0x6BEA] = 'EBA4'; z[0x6BEB] = 'BAC1'; z[0x6BEF] = 'CCBA'; z[0x6BF3] = 'EBA5'; z[0x6BF5] = 'EBA7'; z[0x6BF9] = 'EBA8'; z[0x6BFD] = 'EBA6'; z[0x6C05] = 'EBA9'; z[0x6C06] = 'EBAB'; z[0x6C07] = 'EBAA'; z[0x6C0D] = 'EBAC'; z[0x6C0F] = 'CACF'; z[0x6C10] = 'D8B5'; z[0x6C11] = 'C3F1'; z[0x6C13] = 'C3A5'; z[0x6C14] = 'C6F8'; z[0x6C15] = 'EBAD'; z[0x6C16] = 'C4CA'; z[0x6C18] = 'EBAE'; z[0x6C19] = 'EBAF'; z[0x6C1A] = 'EBB0'; z[0x6C1B] = 'B7D5'; z[0x6C1F] = 'B7FA'; z[0x6C21] = 'EBB1'; z[0x6C22] = 'C7E2'; z[0x6C24] = 'EBB3'; z[0x6C26] = 'BAA4'; z[0x6C27] = 'D1F5'; z[0x6C28] = 'B0B1'; z[0x6C29] = 'EBB2'; z[0x6C2A] = 'EBB4'; z[0x6C2E] = 'B5AA'; z[0x6C2F] = 'C2C8'; z[0x6C30] = 'C7E8'; z[0x6C32] = 'EBB5'; z[0x6C34] = 'CBAE'; z[0x6C35] = 'E3DF'; z[0x6C38] = 'D3C0'; z[0x6C3D] = 'D9DB'; z[0x6C40] = 'CDA1'; z[0x6C41] = 'D6AD'; z[0x6C42] = 'C7F3'; z[0x6C46] = 'D9E0'; z[0x6C47] = 'BBE3'; z[0x6C49] = 'BABA'; z[0x6C4A] = 'E3E2'; z[0x6C50] = 'CFAB'; z[0x6C54] = 'E3E0'; z[0x6C55] = 'C9C7'; z[0x6C57] = 'BAB9'; z[0x6C5B] = 'D1B4'; z[0x6C5C] = 'E3E1'; z[0x6C5D] = 'C8EA'; z[0x6C5E] = 'B9AF'; z[0x6C5F] = 'BDAD'; z[0x6C60] = 'B3D8'; z[0x6C61] = 'CEDB'; z[0x6C64] = 'CCC0'; z[0x6C68] = 'E3E8'; z[0x6C69] = 'E3E9'; z[0x6C6A] = 'CDF4'; z[0x6C70] = 'CCAD'; z[0x6C72] = 'BCB3'; z[0x6C74] = 'E3EA'; z[0x6C76] = 'E3EB'; z[0x6C79] = 'D0DA'; z[0x6C7D] = 'C6FB'; z[0x6C7E] = 'B7DA'; z[0x6C81] = 'C7DF'; z[0x6C82] = 'D2CA'; z[0x6C83] = 'CED6'; z[0x6C85] = 'E3E4'; z[0x6C86] = 'E3EC'; z[0x6C88] = 'C9F2'; z[0x6C89] = 'B3C1'; z[0x6C8C] = 'E3E7'; z[0x6C8F] = 'C6E3'; z[0x6C90] = 'E3E5'; z[0x6C93] = 'EDB3'; z[0x6C94] = 'E3E6'; z[0x6C99] = 'C9B3'; z[0x6C9B] = 'C5E6'; z[0x6C9F] = 'B9B5'; z[0x6CA1] = 'C3BB'; z[0x6CA3] = 'E3E3'; z[0x6CA4] = 'C5BD'; z[0x6CA5] = 'C1A4'; z[0x6CA6] = 'C2D9'; z[0x6CA7] = 'B2D7'; z[0x6CA9] = 'E3ED'; z[0x6CAA] = 'BBA6'; z[0x6CAB] = 'C4AD'; z[0x6CAD] = 'E3F0'; z[0x6CAE] = 'BEDA'; z[0x6CB1] = 'E3FB'; z[0x6CB2] = 'E3F5'; z[0x6CB3] = 'BAD3'; z[0x6CB8] = 'B7D0'; z[0x6CB9] = 'D3CD'; z[0x6CBB] = 'D6CE'; z[0x6CBC] = 'D5D3'; z[0x6CBD] = 'B9C1'; z[0x6CBE] = 'D5B4'; z[0x6CBF] = 'D1D8'; z[0x6CC4] = 'D0B9'; z[0x6CC5] = 'C7F6'; z[0x6CC9] = 'C8AA'; z[0x6CCA] = 'B2B4'; z[0x6CCC] = 'C3DA'; z[0x6CD0] = 'E3EE'; z[0x6CD3] = 'E3FC'; z[0x6CD4] = 'E3EF'; z[0x6CD5] = 'B7A8'; z[0x6CD6] = 'E3F7'; z[0x6CD7] = 'E3F4'; z[0x6CDB] = 'B7BA'; z[0x6CDE] = 'C5A2'; z[0x6CE0] = 'E3F6'; z[0x6CE1] = 'C5DD'; z[0x6CE2] = 'B2A8'; z[0x6CE3] = 'C6FC'; z[0x6CE5] = 'C4E0'; z[0x6CE8] = 'D7A2'; z[0x6CEA] = 'C0E1'; z[0x6CEB] = 'E3F9'; z[0x6CEE] = 'E3FA'; z[0x6CEF] = 'E3FD'; z[0x6CF0] = 'CCA9'; z[0x6CF1] = 'E3F3'; z[0x6CF3] = 'D3BE'; z[0x6CF5] = 'B1C3'; z[0x6CF6] = 'EDB4'; z[0x6CF7] = 'E3F1'; z[0x6CF8] = 'E3F2'; z[0x6CFA] = 'E3F8'; z[0x6CFB] = 'D0BA'; z[0x6CFC] = 'C6C3'; z[0x6CFD] = 'D4F3'; z[0x6CFE] = 'E3FE'; z[0x6D01] = 'BDE0'; z[0x6D04] = 'E4A7'; z[0x6D07] = 'E4A6'; z[0x6D0B] = 'D1F3'; z[0x6D0C] = 'E4A3'; z[0x6D0E] = 'E4A9'; z[0x6D12] = 'C8F7'; z[0x6D17] = 'CFB4'; z[0x6D19] = 'E4A8'; z[0x6D1A] = 'E4AE'; z[0x6D1B] = 'C2E5'; z[0x6D1E] = 'B6B4'; z[0x6D25] = 'BDF2'; z[0x6D27] = 'E4A2'; z[0x6D2A] = 'BAE9'; z[0x6D2B] = 'E4AA'; z[0x6D2E] = 'E4AC'; z[0x6D31] = 'B6FD'; z[0x6D32] = 'D6DE'; z[0x6D33] = 'E4B2'; z[0x6D35] = 'E4AD'; z[0x6D39] = 'E4A1'; z[0x6D3B] = 'BBEE'; z[0x6D3C] = 'CDDD'; z[0x6D3D] = 'C7A2'; z[0x6D3E] = 'C5C9'; z[0x6D41] = 'C1F7'; z[0x6D43] = 'E4A4'; z[0x6D45] = 'C7B3'; z[0x6D46] = 'BDAC'; z[0x6D47] = 'BDBD'; z[0x6D48] = 'E4A5'; z[0x6D4A] = 'D7C7'; z[0x6D4B] = 'B2E2'; z[0x6D4D] = 'E4AB'; z[0x6D4E] = 'BCC3'; z[0x6D4F] = 'E4AF'; z[0x6D51] = 'BBEB'; z[0x6D52] = 'E4B0'; z[0x6D53] = 'C5A8'; z[0x6D54] = 'E4B1'; z[0x6D59] = 'D5E3'; z[0x6D5A] = 'BFA3'; z[0x6D5C] = 'E4BA'; z[0x6D5E] = 'E4B7'; z[0x6D60] = 'E4BB'; z[0x6D63] = 'E4BD'; z[0x6D66] = 'C6D6'; z[0x6D69] = 'BAC6'; z[0x6D6A] = 'C0CB'; z[0x6D6E] = 'B8A1'; z[0x6D6F] = 'E4B4'; z[0x6D74] = 'D4A1'; z[0x6D77] = 'BAA3'; z[0x6D78] = 'BDFE'; z[0x6D7C] = 'E4BC'; z[0x6D82] = 'CDBF'; z[0x6D85] = 'C4F9'; z[0x6D88] = 'CFFB'; z[0x6D89] = 'C9E6'; z[0x6D8C] = 'D3BF'; z[0x6D8E] = 'CFD1'; z[0x6D91] = 'E4B3'; z[0x6D93] = 'E4B8'; z[0x6D94] = 'E4B9'; z[0x6D95] = 'CCE9'; z[0x6D9B] = 'CCCE'; z[0x6D9D] = 'C0D4'; z[0x6D9E] = 'E4B5'; z[0x6D9F] = 'C1B0'; z[0x6DA0] = 'E4B6'; z[0x6DA1] = 'CED0'; z[0x6DA3] = 'BBC1'; z[0x6DA4] = 'B5D3'; z[0x6DA6] = 'C8F3'; z[0x6DA7] = 'BDA7'; z[0x6DA8] = 'D5C7'; z[0x6DA9] = 'C9AC'; z[0x6DAA] = 'B8A2'; z[0x6DAB] = 'E4CA'; z[0x6DAE] = 'E4CC'; z[0x6DAF] = 'D1C4'; z[0x6DB2] = 'D2BA'; z[0x6DB5] = 'BAAD'; z[0x6DB8] = 'BAD4'; z[0x6DBF] = 'E4C3'; z[0x6DC0] = 'B5ED'; z[0x6DC4] = 'D7CD'; z[0x6DC5] = 'E4C0'; z[0x6DC6] = 'CFFD'; z[0x6DC7] = 'E4BF'; z[0x6DCB] = 'C1DC'; z[0x6DCC] = 'CCCA'; z[0x6DD1] = 'CAE7'; z[0x6DD6] = 'C4D7'; z[0x6DD8] = 'CCD4'; z[0x6DD9] = 'E4C8'; z[0x6DDD] = 'E4C7'; z[0x6DDE] = 'E4C1'; z[0x6DE0] = 'E4C4'; z[0x6DE1] = 'B5AD'; z[0x6DE4] = 'D3D9'; z[0x6DE6] = 'E4C6'; z[0x6DEB] = 'D2F9'; z[0x6DEC] = 'B4E3'; z[0x6DEE] = 'BBB4'; z[0x6DF1] = 'C9EE'; z[0x6DF3] = 'B4BE'; z[0x6DF7] = 'BBEC'; z[0x6DF9] = 'D1CD'; z[0x6DFB] = 'CCED'; z[0x6DFC] = 'EDB5'; z[0x6E05] = 'C7E5'; z[0x6E0A] = 'D4A8'; z[0x6E0C] = 'E4CB'; z[0x6E0D] = 'D7D5'; z[0x6E0E] = 'E4C2'; z[0x6E10] = 'BDA5'; z[0x6E11] = 'E4C5'; z[0x6E14] = 'D3E6'; z[0x6E16] = 'E4C9'; z[0x6E17] = 'C9F8'; z[0x6E1A] = 'E4BE'; z[0x6E1D] = 'D3E5'; z[0x6E20] = 'C7FE'; z[0x6E21] = 'B6C9'; z[0x6E23] = 'D4FC'; z[0x6E24] = 'B2B3'; z[0x6E25] = 'E4D7'; z[0x6E29] = 'CEC2'; z[0x6E2B] = 'E4CD'; z[0x6E2D] = 'CEBC'; z[0x6E2F] = 'B8DB'; z[0x6E32] = 'E4D6'; z[0x6E34] = 'BFCA'; z[0x6E38] = 'D3CE'; z[0x6E3A] = 'C3EC'; z[0x6E43] = 'C5C8'; z[0x6E44] = 'E4D8'; z[0x6E4D] = 'CDC4'; z[0x6E4E] = 'E4CF'; z[0x6E53] = 'E4D4'; z[0x6E54] = 'E4D5'; z[0x6E56] = 'BAFE'; z[0x6E58] = 'CFE6'; z[0x6E5B] = 'D5BF'; z[0x6E5F] = 'E4D2'; z[0x6E6B] = 'E4D0'; z[0x6E6E] = 'E4CE'; z[0x6E7E] = 'CDE5'; z[0x6E7F] = 'CAAA'; z[0x6E83] = 'C0A3'; z[0x6E85] = 'BDA6'; z[0x6E86] = 'E4D3'; z[0x6E89] = 'B8C8'; z[0x6E8F] = 'E4E7'; z[0x6E90] = 'D4B4'; z[0x6E98] = 'E4DB'; z[0x6E9C] = 'C1EF'; z[0x6E9F] = 'E4E9'; z[0x6EA2] = 'D2E7'; z[0x6EA5] = 'E4DF'; z[0x6EA7] = 'E4E0'; z[0x6EAA] = 'CFAA'; z[0x6EAF] = 'CBDD'; z[0x6EB1] = 'E4DA'; z[0x6EB2] = 'E4D1'; z[0x6EB4] = 'E4E5'; z[0x6EB6] = 'C8DC'; z[0x6EB7] = 'E4E3'; z[0x6EBA] = 'C4E7'; z[0x6EBB] = 'E4E2'; z[0x6EBD] = 'E4E1'; z[0x6EC1] = 'B3FC'; z[0x6EC2] = 'E4E8'; z[0x6EC7] = 'B5E1'; z[0x6ECB] = 'D7CC'; z[0x6ECF] = 'E4E6'; z[0x6ED1] = 'BBAC'; z[0x6ED3] = 'D7D2'; z[0x6ED4] = 'CCCF'; z[0x6ED5] = 'EBF8'; z[0x6ED7] = 'E4E4'; z[0x6EDA] = 'B9F6'; z[0x6EDE] = 'D6CD'; z[0x6EDF] = 'E4D9'; z[0x6EE0] = 'E4DC'; z[0x6EE1] = 'C2FA'; z[0x6EE2] = 'E4DE'; z[0x6EE4] = 'C2CB'; z[0x6EE5] = 'C0C4'; z[0x6EE6] = 'C2D0'; z[0x6EE8] = 'B1F5'; z[0x6EE9] = 'CCB2'; z[0x6EF4] = 'B5CE'; z[0x6EF9] = 'E4EF'; z[0x6F02] = 'C6AF'; z[0x6F06] = 'C6E1'; z[0x6F09] = 'E4F5'; z[0x6F0F] = 'C2A9'; z[0x6F13] = 'C0EC'; z[0x6F14] = 'D1DD'; z[0x6F15] = 'E4EE'; z[0x6F20] = 'C4AE'; z[0x6F24] = 'E4ED'; z[0x6F29] = 'E4F6'; z[0x6F2A] = 'E4F4'; z[0x6F2B] = 'C2FE'; z[0x6F2D] = 'E4DD'; z[0x6F2F] = 'E4F0'; z[0x6F31] = 'CAFE'; z[0x6F33] = 'D5C4'; z[0x6F36] = 'E4F1'; z[0x6F3E] = 'D1FA'; z[0x6F46] = 'E4EB'; z[0x6F47] = 'E4EC'; z[0x6F4B] = 'E4F2'; z[0x6F4D] = 'CEAB'; z[0x6F58] = 'C5CB'; z[0x6F5C] = 'C7B1'; z[0x6F5E] = 'C2BA'; z[0x6F62] = 'E4EA'; z[0x6F66] = 'C1CA'; z[0x6F6D] = 'CCB6'; z[0x6F6E] = 'B3B1'; z[0x6F72] = 'E4FB'; z[0x6F74] = 'E4F3'; z[0x6F78] = 'E4FA'; z[0x6F7A] = 'E4FD'; z[0x6F7C] = 'E4FC'; z[0x6F84] = 'B3CE'; z[0x6F88] = 'B3BA'; z[0x6F89] = 'E4F7'; z[0x6F8C] = 'E4F9'; z[0x6F8D] = 'E4F8'; z[0x6F8E] = 'C5EC'; z[0x6F9C] = 'C0BD'; z[0x6FA1] = 'D4E8'; z[0x6FA7] = 'E5A2'; z[0x6FB3] = 'B0C4'; z[0x6FB6] = 'E5A4'; z[0x6FB9] = 'E5A3'; z[0x6FC0] = 'BCA4'; z[0x6FC2] = 'E5A5'; z[0x6FC9] = 'E5A1'; z[0x6FD1] = 'E4FE'; z[0x6FD2] = 'B1F4'; z[0x6FDE] = 'E5A8'; z[0x6FE0] = 'E5A9'; z[0x6FE1] = 'E5A6'; z[0x6FEE] = 'E5A7'; z[0x6FEF] = 'E5AA'; z[0x7011] = 'C6D9'; z[0x701A] = 'E5AB'; z[0x701B] = 'E5AD'; z[0x7023] = 'E5AC'; z[0x7035] = 'E5AF'; z[0x7039] = 'E5AE'; z[0x704C] = 'B9E0'; z[0x704F] = 'E5B0'; z[0x705E] = 'E5B1'; z[0x706B] = 'BBF0'; z[0x706C] = 'ECE1'; z[0x706D] = 'C3F0'; z[0x706F] = 'B5C6'; z[0x7070] = 'BBD2'; z[0x7075] = 'C1E9'; z[0x7076] = 'D4EE'; z[0x7078] = 'BEC4'; z[0x707C] = 'D7C6'; z[0x707E] = 'D4D6'; z[0x707F] = 'B2D3'; z[0x7080] = 'ECBE'; z[0x7085] = 'EAC1'; z[0x7089] = 'C2AF'; z[0x708A] = 'B4B6'; z[0x708E] = 'D1D7'; z[0x7092] = 'B3B4'; z[0x7094] = 'C8B2'; z[0x7095] = 'BFBB'; z[0x7096] = 'ECC0'; z[0x7099] = 'D6CB'; z[0x709C] = 'ECBF'; z[0x709D] = 'ECC1'; z[0x70AB] = 'ECC5'; z[0x70AC] = 'BEE6'; z[0x70AD] = 'CCBF'; z[0x70AE] = 'C5DA'; z[0x70AF] = 'BEBC'; z[0x70B1] = 'ECC6'; z[0x70B3] = 'B1FE'; z[0x70B7] = 'ECC4'; z[0x70B8] = 'D5A8'; z[0x70B9] = 'B5E3'; z[0x70BB] = 'ECC2'; z[0x70BC] = 'C1B6'; z[0x70BD] = 'B3E3'; z[0x70C0] = 'ECC3'; z[0x70C1] = 'CBB8'; z[0x70C2] = 'C0C3'; z[0x70C3] = 'CCFE'; z[0x70C8] = 'C1D2'; z[0x70CA] = 'ECC8'; z[0x70D8] = 'BAE6'; z[0x70D9] = 'C0D3'; z[0x70DB] = 'D6F2'; z[0x70DF] = 'D1CC'; z[0x70E4] = 'BFBE'; z[0x70E6] = 'B7B3'; z[0x70E7] = 'C9D5'; z[0x70E8] = 'ECC7'; z[0x70E9] = 'BBE2'; z[0x70EB] = 'CCCC'; z[0x70EC] = 'BDFD'; z[0x70ED] = 'C8C8'; z[0x70EF] = 'CFA9'; z[0x70F7] = 'CDE9'; z[0x70F9] = 'C5EB'; z[0x70FD] = 'B7E9'; z[0x7109] = 'D1C9'; z[0x710A] = 'BAB8'; z[0x7110] = 'ECC9'; z[0x7113] = 'ECCA'; z[0x7115] = 'BBC0'; z[0x7116] = 'ECCB'; z[0x7118] = 'ECE2'; z[0x7119] = 'B1BA'; z[0x711A] = 'B7D9'; z[0x7126] = 'BDB9'; z[0x712F] = 'ECCC'; z[0x7130] = 'D1E6'; z[0x7131] = 'ECCD'; z[0x7136] = 'C8BB'; z[0x7145] = 'ECD1'; z[0x714A] = 'ECD3'; z[0x714C] = 'BBCD'; z[0x714E] = 'BCE5'; z[0x715C] = 'ECCF'; z[0x715E] = 'C9B7'; z[0x7164] = 'C3BA'; z[0x7166] = 'ECE3'; z[0x7167] = 'D5D5'; z[0x7168] = 'ECD0'; z[0x716E] = 'D6F3'; z[0x7172] = 'ECD2'; z[0x7173] = 'ECCE'; z[0x7178] = 'ECD4'; z[0x717A] = 'ECD5'; z[0x717D] = 'C9BF'; z[0x7184] = 'CFA8'; z[0x718A] = 'D0DC'; z[0x718F] = 'D1AC'; z[0x7194] = 'C8DB'; z[0x7198] = 'ECD6'; z[0x7199] = 'CEF5'; z[0x719F] = 'CAEC'; z[0x71A0] = 'ECDA'; z[0x71A8] = 'ECD9'; z[0x71AC] = 'B0BE'; z[0x71B3] = 'ECD7'; z[0x71B5] = 'ECD8'; z[0x71B9] = 'ECE4'; z[0x71C3] = 'C8BC'; z[0x71CE] = 'C1C7'; z[0x71D4] = 'ECDC'; z[0x71D5] = 'D1E0'; z[0x71E0] = 'ECDB'; z[0x71E5] = 'D4EF'; z[0x71E7] = 'ECDD'; z[0x71EE] = 'DBC6'; z[0x71F9] = 'ECDE'; z[0x7206] = 'B1AC'; z[0x721D] = 'ECDF'; z[0x7228] = 'ECE0'; z[0x722A] = 'D7A6'; z[0x722C] = 'C5C0'; z[0x7230] = 'EBBC'; z[0x7231] = 'B0AE'; z[0x7235] = 'BEF4'; z[0x7236] = 'B8B8'; z[0x7237] = 'D2AF'; z[0x7238] = 'B0D6'; z[0x7239] = 'B5F9'; z[0x723B] = 'D8B3'; z[0x723D] = 'CBAC'; z[0x723F] = 'E3DD'; z[0x7247] = 'C6AC'; z[0x7248] = 'B0E6'; z[0x724C] = 'C5C6'; z[0x724D] = 'EBB9'; z[0x7252] = 'EBBA'; z[0x7256] = 'EBBB'; z[0x7259] = 'D1C0'; z[0x725B] = 'C5A3'; z[0x725D] = 'EAF2'; z[0x725F] = 'C4B2'; z[0x7261] = 'C4B5'; z[0x7262] = 'C0CE'; z[0x7266] = 'EAF3'; z[0x7267] = 'C4C1'; z[0x7269] = 'CEEF'; z[0x726E] = 'EAF0'; z[0x726F] = 'EAF4'; z[0x7272] = 'C9FC'; z[0x7275] = 'C7A3'; z[0x7279] = 'CCD8'; z[0x727A] = 'CEFE'; z[0x727E] = 'EAF5'; z[0x727F] = 'EAF6'; z[0x7280] = 'CFAC'; z[0x7281] = 'C0E7'; z[0x7284] = 'EAF7'; z[0x728A] = 'B6BF'; z[0x728B] = 'EAF8'; z[0x728D] = 'EAF9'; z[0x728F] = 'EAFA'; z[0x7292] = 'EAFB'; z[0x729F] = 'EAF1'; z[0x72AC] = 'C8AE'; z[0x72AD] = 'E1EB'; z[0x72AF] = 'B7B8'; z[0x72B0] = 'E1EC'; z[0x72B4] = 'E1ED'; z[0x72B6] = 'D7B4'; z[0x72B7] = 'E1EE'; z[0x72B8] = 'E1EF'; z[0x72B9] = 'D3CC'; z[0x72C1] = 'E1F1'; z[0x72C2] = 'BFF1'; z[0x72C3] = 'E1F0'; z[0x72C4] = 'B5D2'; z[0x72C8] = 'B1B7'; z[0x72CD] = 'E1F3'; z[0x72CE] = 'E1F2'; z[0x72D0] = 'BAFC'; z[0x72D2] = 'E1F4'; z[0x72D7] = 'B9B7'; z[0x72D9] = 'BED1'; z[0x72DE] = 'C4FC'; z[0x72E0] = 'BADD'; z[0x72E1] = 'BDC6'; z[0x72E8] = 'E1F5'; z[0x72E9] = 'E1F7'; z[0x72EC] = 'B6C0'; z[0x72ED] = 'CFC1'; z[0x72EE] = 'CAA8'; z[0x72EF] = 'E1F6'; z[0x72F0] = 'D5F8'; z[0x72F1] = 'D3FC'; z[0x72F2] = 'E1F8'; z[0x72F3] = 'E1FC'; z[0x72F4] = 'E1F9'; z[0x72F7] = 'E1FA'; z[0x72F8] = 'C0EA'; z[0x72FA] = 'E1FE'; z[0x72FB] = 'E2A1'; z[0x72FC] = 'C0C7'; z[0x7301] = 'E1FB'; z[0x7303] = 'E1FD'; z[0x730A] = 'E2A5'; z[0x730E] = 'C1D4'; z[0x7313] = 'E2A3'; z[0x7315] = 'E2A8'; z[0x7316] = 'B2FE'; z[0x7317] = 'E2A2'; z[0x731B] = 'C3CD'; z[0x731C] = 'B2C2'; z[0x731D] = 'E2A7'; z[0x731E] = 'E2A6'; z[0x7321] = 'E2A4'; z[0x7322] = 'E2A9'; z[0x7325] = 'E2AB'; z[0x7329] = 'D0C9'; z[0x732A] = 'D6ED'; z[0x732B] = 'C3A8'; z[0x732C] = 'E2AC'; z[0x732E] = 'CFD7'; z[0x7331] = 'E2AE'; z[0x7334] = 'BAEF'; z[0x7337] = 'E9E0'; z[0x7338] = 'E2AD'; z[0x7339] = 'E2AA'; z[0x733E] = 'BBAB'; z[0x733F] = 'D4B3'; z[0x734D] = 'E2B0'; z[0x7350] = 'E2AF'; z[0x7352] = 'E9E1'; z[0x7357] = 'E2B1'; z[0x7360] = 'E2B2'; z[0x736C] = 'E2B3'; z[0x736D] = 'CCA1'; z[0x736F] = 'E2B4'; z[0x737E] = 'E2B5'; z[0x7384] = 'D0FE'; z[0x7387] = 'C2CA'; z[0x7389] = 'D3F1'; z[0x738B] = 'CDF5'; z[0x738E] = 'E7E0'; z[0x7391] = 'E7E1'; z[0x7396] = 'BEC1'; z[0x739B] = 'C2EA'; z[0x739F] = 'E7E4'; z[0x73A2] = 'E7E3'; z[0x73A9] = 'CDE6'; z[0x73AB] = 'C3B5'; z[0x73AE] = 'E7E2'; z[0x73AF] = 'BBB7'; z[0x73B0] = 'CFD6'; z[0x73B2] = 'C1E1'; z[0x73B3] = 'E7E9'; z[0x73B7] = 'E7E8'; z[0x73BA] = 'E7F4'; z[0x73BB] = 'B2A3'; z[0x73C0] = 'E7EA'; z[0x73C2] = 'E7E6'; z[0x73C8] = 'E7EC'; z[0x73C9] = 'E7EB'; z[0x73CA] = 'C9BA'; z[0x73CD] = 'D5E4'; z[0x73CF] = 'E7E5'; z[0x73D0] = 'B7A9'; z[0x73D1] = 'E7E7'; z[0x73D9] = 'E7EE'; z[0x73DE] = 'E7F3'; z[0x73E0] = 'D6E9'; z[0x73E5] = 'E7ED'; z[0x73E7] = 'E7F2'; z[0x73E9] = 'E7F1'; z[0x73ED] = 'B0E0'; z[0x73F2] = 'E7F5'; z[0x7403] = 'C7F2'; z[0x7405] = 'C0C5'; z[0x7406] = 'C0ED'; z[0x7409] = 'C1F0'; z[0x740A] = 'E7F0'; z[0x740F] = 'E7F6'; z[0x7410] = 'CBF6'; z[0x741A] = 'E8A2'; z[0x741B] = 'E8A1'; z[0x7422] = 'D7C1'; z[0x7425] = 'E7FA'; z[0x7426] = 'E7F9'; z[0x7428] = 'E7FB'; z[0x742A] = 'E7F7'; z[0x742C] = 'E7FE'; z[0x742E] = 'E7FD'; z[0x7430] = 'E7FC'; z[0x7433] = 'C1D5'; z[0x7434] = 'C7D9'; z[0x7435] = 'C5FD'; z[0x7436] = 'C5C3'; z[0x743C] = 'C7ED'; z[0x7441] = 'E8A3'; z[0x7455] = 'E8A6'; z[0x7457] = 'E8A5'; z[0x7459] = 'E8A7'; z[0x745A] = 'BAF7'; z[0x745B] = 'E7F8'; z[0x745C] = 'E8A4'; z[0x745E] = 'C8F0'; z[0x745F] = 'C9AA'; z[0x746D] = 'E8A9'; z[0x7470] = 'B9E5'; z[0x7476] = 'D1FE'; z[0x7477] = 'E8A8'; z[0x747E] = 'E8AA'; z[0x7480] = 'E8AD'; z[0x7481] = 'E8AE'; z[0x7483] = 'C1A7'; z[0x7487] = 'E8AF'; z[0x748B] = 'E8B0'; z[0x748E] = 'E8AC'; z[0x7490] = 'E8B4'; z[0x749C] = 'E8AB'; z[0x749E] = 'E8B1'; z[0x74A7] = 'E8B5'; z[0x74A8] = 'E8B2'; z[0x74A9] = 'E8B3'; z[0x74BA] = 'E8B7'; z[0x74D2] = 'E8B6'; z[0x74DC] = 'B9CF'; z[0x74DE] = 'F0AC'; z[0x74E0] = 'F0AD'; z[0x74E2] = 'C6B0'; z[0x74E3] = 'B0EA'; z[0x74E4] = 'C8BF'; z[0x74E6] = 'CDDF'; z[0x74EE] = 'CECD'; z[0x74EF] = 'EAB1'; z[0x74F4] = 'EAB2'; z[0x74F6] = 'C6BF'; z[0x74F7] = 'B4C9'; z[0x74FF] = 'EAB3'; z[0x7504] = 'D5E7'; z[0x750D] = 'DDF9'; z[0x750F] = 'EAB4'; z[0x7511] = 'EAB5'; z[0x7513] = 'EAB6'; z[0x7518] = 'B8CA'; z[0x7519] = 'DFB0'; z[0x751A] = 'C9F5'; z[0x751C] = 'CCF0'; z[0x751F] = 'C9FA'; z[0x7525] = 'C9FB'; z[0x7528] = 'D3C3'; z[0x7529] = 'CBA6'; z[0x752B] = 'B8A6'; z[0x752C] = 'F0AE'; z[0x752D] = 'B1C2'; z[0x752F] = 'E5B8'; z[0x7530] = 'CCEF'; z[0x7531] = 'D3C9'; z[0x7532] = 'BCD7'; z[0x7533] = 'C9EA'; z[0x7535] = 'B5E7'; z[0x7537] = 'C4D0'; z[0x7538] = 'B5E9'; z[0x753A] = 'EEAE'; z[0x753B] = 'BBAD'; z[0x753E] = 'E7DE'; z[0x7540] = 'EEAF'; z[0x7545] = 'B3A9'; z[0x7548] = 'EEB2'; z[0x754B] = 'EEB1'; z[0x754C] = 'BDE7'; z[0x754E] = 'EEB0'; z[0x754F] = 'CEB7'; z[0x7554] = 'C5CF'; z[0x7559] = 'C1F4'; z[0x755A] = 'DBCE'; z[0x755B] = 'EEB3'; z[0x755C] = 'D0F3'; z[0x7565] = 'C2D4'; z[0x7566] = 'C6E8'; z[0x756A] = 'B7AC'; z[0x7572] = 'EEB4'; z[0x7574] = 'B3EB'; z[0x7578] = 'BBFB'; z[0x7579] = 'EEB5'; z[0x757F] = 'E7DC'; z[0x7583] = 'EEB6'; z[0x7586] = 'BDAE'; z[0x758B] = 'F1E2'; z[0x758F] = 'CAE8'; z[0x7591] = 'D2C9'; z[0x7592] = 'F0DA'; z[0x7594] = 'F0DB'; z[0x7596] = 'F0DC'; z[0x7597] = 'C1C6'; z[0x7599] = 'B8ED'; z[0x759A] = 'BECE'; z[0x759D] = 'F0DE'; z[0x759F] = 'C5B1'; z[0x75A0] = 'F0DD'; z[0x75A1] = 'D1F1'; z[0x75A3] = 'F0E0'; z[0x75A4] = 'B0CC'; z[0x75A5] = 'BDEA'; z[0x75AB] = 'D2DF'; z[0x75AC] = 'F0DF'; z[0x75AE] = 'B4AF'; z[0x75AF] = 'B7E8'; z[0x75B0] = 'F0E6'; z[0x75B1] = 'F0E5'; z[0x75B2] = 'C6A3'; z[0x75B3] = 'F0E1'; z[0x75B4] = 'F0E2'; z[0x75B5] = 'B4C3'; z[0x75B8] = 'F0E3'; z[0x75B9] = 'D5EE'; z[0x75BC] = 'CCDB'; z[0x75BD] = 'BED2'; z[0x75BE] = 'BCB2'; z[0x75C2] = 'F0E8'; z[0x75C3] = 'F0E7'; z[0x75C4] = 'F0E4'; z[0x75C5] = 'B2A1'; z[0x75C7] = 'D6A2'; z[0x75C8] = 'D3B8'; z[0x75C9] = 'BEB7'; z[0x75CA] = 'C8AC'; z[0x75CD] = 'F0EA'; z[0x75D2] = 'D1F7'; z[0x75D4] = 'D6CC'; z[0x75D5] = 'BADB'; z[0x75D6] = 'F0E9'; z[0x75D8] = 'B6BB'; z[0x75DB] = 'CDB4'; z[0x75DE] = 'C6A6'; z[0x75E2] = 'C1A1'; z[0x75E3] = 'F0EB'; z[0x75E4] = 'F0EE'; z[0x75E6] = 'F0ED'; z[0x75E7] = 'F0F0'; z[0x75E8] = 'F0EC'; z[0x75EA] = 'BBBE'; z[0x75EB] = 'F0EF'; z[0x75F0] = 'CCB5'; z[0x75F1] = 'F0F2'; z[0x75F4] = 'B3D5'; z[0x75F9] = 'B1D4'; z[0x75FC] = 'F0F3'; z[0x75FF] = 'F0F4'; z[0x7600] = 'F0F6'; z[0x7601] = 'B4E1'; z[0x7603] = 'F0F1'; z[0x7605] = 'F0F7'; z[0x760A] = 'F0FA'; z[0x760C] = 'F0F8'; z[0x7610] = 'F0F5'; z[0x7615] = 'F0FD'; z[0x7617] = 'F0F9'; z[0x7618] = 'F0FC'; z[0x7619] = 'F0FE'; z[0x761B] = 'F1A1'; z[0x761F] = 'CEC1'; z[0x7620] = 'F1A4'; z[0x7622] = 'F1A3'; z[0x7624] = 'C1F6'; z[0x7625] = 'F0FB'; z[0x7626] = 'CADD'; z[0x7629] = 'B4F1'; z[0x762A] = 'B1F1'; z[0x762B] = 'CCB1'; z[0x762D] = 'F1A6'; z[0x7630] = 'F1A7'; z[0x7633] = 'F1AC'; z[0x7634] = 'D5CE'; z[0x7635] = 'F1A9'; z[0x7638] = 'C8B3'; z[0x763C] = 'F1A2'; z[0x763E] = 'F1AB'; z[0x763F] = 'F1A8'; z[0x7640] = 'F1A5'; z[0x7643] = 'F1AA'; z[0x764C] = 'B0A9'; z[0x764D] = 'F1AD'; z[0x7654] = 'F1AF'; z[0x7656] = 'F1B1'; z[0x765C] = 'F1B0'; z[0x765E] = 'F1AE'; z[0x7663] = 'D1A2'; z[0x766B] = 'F1B2'; z[0x766F] = 'F1B3'; z[0x7678] = 'B9EF'; z[0x767B] = 'B5C7'; z[0x767D] = 'B0D7'; z[0x767E] = 'B0D9'; z[0x7682] = 'D4ED'; z[0x7684] = 'B5C4'; z[0x7686] = 'BDD4'; z[0x7687] = 'BBCA'; z[0x7688] = 'F0A7'; z[0x768B] = 'B8DE'; z[0x768E] = 'F0A8'; z[0x7691] = 'B0A8'; z[0x7693] = 'F0A9'; z[0x7696] = 'CDEE'; z[0x7699] = 'F0AA'; z[0x76A4] = 'F0AB'; z[0x76AE] = 'C6A4'; z[0x76B1] = 'D6E5'; z[0x76B2] = 'F1E4'; z[0x76B4] = 'F1E5'; z[0x76BF] = 'C3F3'; z[0x76C2] = 'D3DB'; z[0x76C5] = 'D6D1'; z[0x76C6] = 'C5E8'; z[0x76C8] = 'D3AF'; z[0x76CA] = 'D2E6'; z[0x76CD] = 'EEC1'; z[0x76CE] = 'B0BB'; z[0x76CF] = 'D5B5'; z[0x76D0] = 'D1CE'; z[0x76D1] = 'BCE0'; z[0x76D2] = 'BAD0'; z[0x76D4] = 'BFF8'; z[0x76D6] = 'B8C7'; z[0x76D7] = 'B5C1'; z[0x76D8] = 'C5CC'; z[0x76DB] = 'CAA2'; z[0x76DF] = 'C3CB'; z[0x76E5] = 'EEC2'; z[0x76EE] = 'C4BF'; z[0x76EF] = 'B6A2'; z[0x76F1] = 'EDEC'; z[0x76F2] = 'C3A4'; z[0x76F4] = 'D6B1'; z[0x76F8] = 'CFE0'; z[0x76F9] = 'EDEF'; z[0x76FC] = 'C5CE'; z[0x76FE] = 'B6DC'; z[0x7701] = 'CAA1'; z[0x7704] = 'EDED'; z[0x7707] = 'EDF0'; z[0x7708] = 'EDF1'; z[0x7709] = 'C3BC'; z[0x770B] = 'BFB4'; z[0x770D] = 'EDEE'; z[0x7719] = 'EDF4'; z[0x771A] = 'EDF2'; z[0x771F] = 'D5E6'; z[0x7720] = 'C3DF'; z[0x7722] = 'EDF3'; z[0x7726] = 'EDF6'; z[0x7728] = 'D5A3'; z[0x7729] = 'D1A3'; z[0x772D] = 'EDF5'; z[0x772F] = 'C3D0'; z[0x7735] = 'EDF7'; z[0x7736] = 'BFF4'; z[0x7737] = 'BEEC'; z[0x7738] = 'EDF8'; z[0x773A] = 'CCF7'; z[0x773C] = 'D1DB'; z[0x7740] = 'D7C5'; z[0x7741] = 'D5F6'; z[0x7743] = 'EDFC'; z[0x7747] = 'EDFB'; z[0x7750] = 'EDF9'; z[0x7751] = 'EDFA'; z[0x775A] = 'EDFD'; z[0x775B] = 'BEA6'; z[0x7761] = 'CBAF'; z[0x7762] = 'EEA1'; z[0x7763] = 'B6BD'; z[0x7765] = 'EEA2'; z[0x7766] = 'C4C0'; z[0x7768] = 'EDFE'; z[0x776B] = 'BDDE'; z[0x776C] = 'B2C7'; z[0x7779] = 'B6C3'; z[0x777D] = 'EEA5'; z[0x777E] = 'D8BA'; z[0x777F] = 'EEA3'; z[0x7780] = 'EEA6'; z[0x7784] = 'C3E9'; z[0x7785] = 'B3F2'; z[0x778C] = 'EEA7'; z[0x778D] = 'EEA4'; z[0x778E] = 'CFB9'; z[0x7791] = 'EEA8'; z[0x7792] = 'C2F7'; z[0x779F] = 'EEA9'; z[0x77A0] = 'EEAA'; z[0x77A2] = 'DEAB'; z[0x77A5] = 'C6B3'; z[0x77A7] = 'C7C6'; z[0x77A9] = 'D6F5'; z[0x77AA] = 'B5C9'; z[0x77AC] = 'CBB2'; z[0x77B0] = 'EEAB'; z[0x77B3] = 'CDAB'; z[0x77B5] = 'EEAC'; z[0x77BB] = 'D5B0'; z[0x77BD] = 'EEAD'; z[0x77BF] = 'F6C4'; z[0x77CD] = 'DBC7'; z[0x77D7] = 'B4A3'; z[0x77DB] = 'C3AC'; z[0x77DC] = 'F1E6'; z[0x77E2] = 'CAB8'; z[0x77E3] = 'D2D3'; z[0x77E5] = 'D6AA'; z[0x77E7] = 'EFF2'; z[0x77E9] = 'BED8'; z[0x77EB] = 'BDC3'; z[0x77EC] = 'EFF3'; z[0x77ED] = 'B6CC'; z[0x77EE] = 'B0AB'; z[0x77F3] = 'CAAF'; z[0x77F6] = 'EDB6'; z[0x77F8] = 'EDB7'; z[0x77FD] = 'CEF9'; z[0x77FE] = 'B7AF'; z[0x77FF] = 'BFF3'; z[0x7800] = 'EDB8'; z[0x7801] = 'C2EB'; z[0x7802] = 'C9B0'; z[0x7809] = 'EDB9'; z[0x780C] = 'C6F6'; z[0x780D] = 'BFB3'; z[0x7811] = 'EDBC'; z[0x7812] = 'C5F8'; z[0x7814] = 'D1D0'; z[0x7816] = 'D7A9'; z[0x7817] = 'EDBA'; z[0x7818] = 'EDBB'; z[0x781A] = 'D1E2'; z[0x781C] = 'EDBF'; z[0x781D] = 'EDC0'; z[0x781F] = 'EDC4'; z[0x7823] = 'EDC8'; z[0x7825] = 'EDC6'; z[0x7826] = 'EDCE'; z[0x7827] = 'D5E8'; z[0x7829] = 'EDC9'; z[0x782C] = 'EDC7'; z[0x782D] = 'EDBE'; z[0x7830] = 'C5E9'; z[0x7834] = 'C6C6'; z[0x7837] = 'C9E9'; z[0x7838] = 'D4D2'; z[0x7839] = 'EDC1'; z[0x783A] = 'EDC2'; z[0x783B] = 'EDC3'; z[0x783C] = 'EDC5'; z[0x783E] = 'C0F9'; z[0x7840] = 'B4A1'; z[0x7845] = 'B9E8'; z[0x7847] = 'EDD0'; z[0x784C] = 'EDD1'; z[0x784E] = 'EDCA'; z[0x7850] = 'EDCF'; z[0x7852] = 'CEF8'; z[0x7855] = 'CBB6'; z[0x7856] = 'EDCC'; z[0x7857] = 'EDCD'; z[0x785D] = 'CFF5'; z[0x786A] = 'EDD2'; z[0x786B] = 'C1F2'; z[0x786C] = 'D3B2'; z[0x786D] = 'EDCB'; z[0x786E] = 'C8B7'; z[0x7877] = 'BCEF'; z[0x787C] = 'C5F0'; z[0x7887] = 'EDD6'; z[0x7889] = 'B5EF'; z[0x788C] = 'C2B5'; z[0x788D] = 'B0AD'; z[0x788E] = 'CBE9'; z[0x7891] = 'B1AE'; z[0x7893] = 'EDD4'; z[0x7897] = 'CDEB'; z[0x7898] = 'B5E2'; z[0x789A] = 'EDD5'; z[0x789B] = 'EDD3'; z[0x789C] = 'EDD7'; z[0x789F] = 'B5FA'; z[0x78A1] = 'EDD8'; z[0x78A3] = 'EDD9'; z[0x78A5] = 'EDDC'; z[0x78A7] = 'B1CC'; z[0x78B0] = 'C5F6'; z[0x78B1] = 'BCEE'; z[0x78B2] = 'EDDA'; z[0x78B3] = 'CCBC'; z[0x78B4] = 'B2EA'; z[0x78B9] = 'EDDB'; z[0x78BE] = 'C4EB'; z[0x78C1] = 'B4C5'; z[0x78C5] = 'B0F5'; z[0x78C9] = 'EDDF'; z[0x78CA] = 'C0DA'; z[0x78CB] = 'B4E8'; z[0x78D0] = 'C5CD'; z[0x78D4] = 'EDDD'; z[0x78D5] = 'BFC4'; z[0x78D9] = 'EDDE'; z[0x78E8] = 'C4A5'; z[0x78EC] = 'EDE0'; z[0x78F2] = 'EDE1'; z[0x78F4] = 'EDE3'; z[0x78F7] = 'C1D7'; z[0x78FA] = 'BBC7'; z[0x7901] = 'BDB8'; z[0x7905] = 'EDE2'; z[0x7913] = 'EDE4'; z[0x791E] = 'EDE6'; z[0x7924] = 'EDE5'; z[0x7934] = 'EDE7'; z[0x793A] = 'CABE'; z[0x793B] = 'ECEA'; z[0x793C] = 'C0F1'; z[0x793E] = 'C9E7'; z[0x7940] = 'ECEB'; z[0x7941] = 'C6EE'; z[0x7946] = 'ECEC'; z[0x7948] = 'C6ED'; z[0x7949] = 'ECED'; z[0x7953] = 'ECF0'; z[0x7956] = 'D7E6'; z[0x7957] = 'ECF3'; z[0x795A] = 'ECF1'; z[0x795B] = 'ECEE'; z[0x795C] = 'ECEF'; z[0x795D] = 'D7A3'; z[0x795E] = 'C9F1'; z[0x795F] = 'CBEE'; z[0x7960] = 'ECF4'; z[0x7962] = 'ECF2'; z[0x7965] = 'CFE9'; z[0x7967] = 'ECF6'; z[0x7968] = 'C6B1'; z[0x796D] = 'BCC0'; z[0x796F] = 'ECF5'; z[0x7977] = 'B5BB'; z[0x7978] = 'BBF6'; z[0x797A] = 'ECF7'; z[0x7980] = 'D9F7'; z[0x7981] = 'BDFB'; z[0x7984] = 'C2BB'; z[0x7985] = 'ECF8'; z[0x798A] = 'ECF9'; z[0x798F] = 'B8A3'; z[0x799A] = 'ECFA'; z[0x79A7] = 'ECFB'; z[0x79B3] = 'ECFC'; z[0x79B9] = 'D3ED'; z[0x79BA] = 'D8AE'; z[0x79BB] = 'C0EB'; z[0x79BD] = 'C7DD'; z[0x79BE] = 'BACC'; z[0x79C0] = 'D0E3'; z[0x79C1] = 'CBBD'; z[0x79C3] = 'CDBA'; z[0x79C6] = 'B8D1'; z[0x79C9] = 'B1FC'; z[0x79CB] = 'C7EF'; z[0x79CD] = 'D6D6'; z[0x79D1] = 'BFC6'; z[0x79D2] = 'C3EB'; z[0x79D5] = 'EFF5'; z[0x79D8] = 'C3D8'; z[0x79DF] = 'D7E2'; z[0x79E3] = 'EFF7'; z[0x79E4] = 'B3D3'; z[0x79E6] = 'C7D8'; z[0x79E7] = 'D1ED'; z[0x79E9] = 'D6C8'; z[0x79EB] = 'EFF8'; z[0x79ED] = 'EFF6'; z[0x79EF] = 'BBFD'; z[0x79F0] = 'B3C6'; z[0x79F8] = 'BDD5'; z[0x79FB] = 'D2C6'; z[0x79FD] = 'BBE0'; z[0x7A00] = 'CFA1'; z[0x7A02] = 'EFFC'; z[0x7A03] = 'EFFB'; z[0x7A06] = 'EFF9'; z[0x7A0B] = 'B3CC'; z[0x7A0D] = 'C9D4'; z[0x7A0E] = 'CBB0'; z[0x7A14] = 'EFFE'; z[0x7A17] = 'B0DE'; z[0x7A1A] = 'D6C9'; z[0x7A1E] = 'EFFD'; z[0x7A20] = 'B3ED'; z[0x7A23] = 'F6D5'; z[0x7A33] = 'CEC8'; z[0x7A37] = 'F0A2'; z[0x7A39] = 'F0A1'; z[0x7A3B] = 'B5BE'; z[0x7A3C] = 'BCDA'; z[0x7A3D] = 'BBFC'; z[0x7A3F] = 'B8E5'; z[0x7A46] = 'C4C2'; z[0x7A51] = 'F0A3'; z[0x7A57] = 'CBEB'; z[0x7A70] = 'F0A6'; z[0x7A74] = 'D1A8'; z[0x7A76] = 'BEBF'; z[0x7A77] = 'C7EE'; z[0x7A78] = 'F1B6'; z[0x7A79] = 'F1B7'; z[0x7A7A] = 'BFD5'; z[0x7A7F] = 'B4A9'; z[0x7A80] = 'F1B8'; z[0x7A81] = 'CDBB'; z[0x7A83] = 'C7D4'; z[0x7A84] = 'D5AD'; z[0x7A86] = 'F1B9'; z[0x7A88] = 'F1BA'; z[0x7A8D] = 'C7CF'; z[0x7A91] = 'D2A4'; z[0x7A92] = 'D6CF'; z[0x7A95] = 'F1BB'; z[0x7A96] = 'BDD1'; z[0x7A97] = 'B4B0'; z[0x7A98] = 'BEBD'; z[0x7A9C] = 'B4DC'; z[0x7A9D] = 'CED1'; z[0x7A9F] = 'BFDF'; z[0x7AA0] = 'F1BD'; z[0x7AA5] = 'BFFA'; z[0x7AA6] = 'F1BC'; z[0x7AA8] = 'F1BF'; z[0x7AAC] = 'F1BE'; z[0x7AAD] = 'F1C0'; z[0x7AB3] = 'F1C1'; z[0x7ABF] = 'C1FE'; z[0x7ACB] = 'C1A2'; z[0x7AD6] = 'CAFA'; z[0x7AD9] = 'D5BE'; z[0x7ADE] = 'BEBA'; z[0x7ADF] = 'BEB9'; z[0x7AE0] = 'D5C2'; z[0x7AE3] = 'BFA2'; z[0x7AE5] = 'CDAF'; z[0x7AE6] = 'F1B5'; z[0x7AED] = 'BDDF'; z[0x7AEF] = 'B6CB'; z[0x7AF9] = 'D6F1'; z[0x7AFA] = 'F3C3'; z[0x7AFD] = 'F3C4'; z[0x7AFF] = 'B8CD'; z[0x7B03] = 'F3C6'; z[0x7B04] = 'F3C7'; z[0x7B06] = 'B0CA'; z[0x7B08] = 'F3C5'; z[0x7B0A] = 'F3C9'; z[0x7B0B] = 'CBF1'; z[0x7B0F] = 'F3CB'; z[0x7B11] = 'D0A6'; z[0x7B14] = 'B1CA'; z[0x7B15] = 'F3C8'; z[0x7B19] = 'F3CF'; z[0x7B1B] = 'B5D1'; z[0x7B1E] = 'F3D7'; z[0x7B20] = 'F3D2'; z[0x7B24] = 'F3D4'; z[0x7B25] = 'F3D3'; z[0x7B26] = 'B7FB'; z[0x7B28] = 'B1BF'; z[0x7B2A] = 'F3CE'; z[0x7B2B] = 'F3CA'; z[0x7B2C] = 'B5DA'; z[0x7B2E] = 'F3D0'; z[0x7B31] = 'F3D1'; z[0x7B33] = 'F3D5'; z[0x7B38] = 'F3CD'; z[0x7B3A] = 'BCE3'; z[0x7B3C] = 'C1FD'; z[0x7B3E] = 'F3D6'; z[0x7B45] = 'F3DA'; z[0x7B47] = 'F3CC'; z[0x7B49] = 'B5C8'; z[0x7B4B] = 'BDEE'; z[0x7B4C] = 'F3DC'; z[0x7B4F] = 'B7A4'; z[0x7B50] = 'BFF0'; z[0x7B51] = 'D6FE'; z[0x7B52] = 'CDB2'; z[0x7B54] = 'B4F0'; z[0x7B56] = 'B2DF'; z[0x7B58] = 'F3D8'; z[0x7B5A] = 'F3D9'; z[0x7B5B] = 'C9B8'; z[0x7B5D] = 'F3DD'; z[0x7B60] = 'F3DE'; z[0x7B62] = 'F3E1'; z[0x7B6E] = 'F3DF'; z[0x7B71] = 'F3E3'; z[0x7B72] = 'F3E2'; z[0x7B75] = 'F3DB'; z[0x7B77] = 'BFEA'; z[0x7B79] = 'B3EF'; z[0x7B7B] = 'F3E0'; z[0x7B7E] = 'C7A9'; z[0x7B80] = 'BCF2'; z[0x7B85] = 'F3EB'; z[0x7B8D] = 'B9BF'; z[0x7B90] = 'F3E4'; z[0x7B94] = 'B2AD'; z[0x7B95] = 'BBFE'; z[0x7B97] = 'CBE3'; z[0x7B9C] = 'F3ED'; z[0x7B9D] = 'F3E9'; z[0x7BA1] = 'B9DC'; z[0x7BA2] = 'F3EE'; z[0x7BA6] = 'F3E5'; z[0x7BA7] = 'F3E6'; z[0x7BA8] = 'F3EA'; z[0x7BA9] = 'C2E1'; z[0x7BAA] = 'F3EC'; z[0x7BAB] = 'F3EF'; z[0x7BAC] = 'F3E8'; z[0x7BAD] = 'BCFD'; z[0x7BB1] = 'CFE4'; z[0x7BB4] = 'F3F0'; z[0x7BB8] = 'F3E7'; z[0x7BC1] = 'F3F2'; z[0x7BC6] = 'D7AD'; z[0x7BC7] = 'C6AA'; z[0x7BCC] = 'F3F3'; z[0x7BD1] = 'F3F1'; z[0x7BD3] = 'C2A8'; z[0x7BD9] = 'B8DD'; z[0x7BDA] = 'F3F5'; z[0x7BDD] = 'F3F4'; z[0x7BE1] = 'B4DB'; z[0x7BE5] = 'F3F6'; z[0x7BE6] = 'F3F7'; z[0x7BEA] = 'F3F8'; z[0x7BEE] = 'C0BA'; z[0x7BF1] = 'C0E9'; z[0x7BF7] = 'C5F1'; z[0x7BFC] = 'F3FB'; z[0x7BFE] = 'F3FA'; z[0x7C07] = 'B4D8'; z[0x7C0B] = 'F3FE'; z[0x7C0C] = 'F3F9'; z[0x7C0F] = 'F3FC'; z[0x7C16] = 'F3FD'; z[0x7C1F] = 'F4A1'; z[0x7C26] = 'F4A3'; z[0x7C27] = 'BBC9'; z[0x7C2A] = 'F4A2'; z[0x7C38] = 'F4A4'; z[0x7C3F] = 'B2BE'; z[0x7C40] = 'F4A6'; z[0x7C41] = 'F4A5'; z[0x7C4D] = 'BCAE'; z[0x7C73] = 'C3D7'; z[0x7C74] = 'D9E1'; z[0x7C7B] = 'C0E0'; z[0x7C7C] = 'F4CC'; z[0x7C7D] = 'D7D1'; z[0x7C89] = 'B7DB'; z[0x7C91] = 'F4CE'; z[0x7C92] = 'C1A3'; z[0x7C95] = 'C6C9'; z[0x7C97] = 'B4D6'; z[0x7C98] = 'D5B3'; z[0x7C9C] = 'F4D0'; z[0x7C9D] = 'F4CF'; z[0x7C9E] = 'F4D1'; z[0x7C9F] = 'CBDA'; z[0x7CA2] = 'F4D2'; z[0x7CA4] = 'D4C1'; z[0x7CA5] = 'D6E0'; z[0x7CAA] = 'B7E0'; z[0x7CAE] = 'C1B8'; z[0x7CB1] = 'C1BB'; z[0x7CB2] = 'F4D3'; z[0x7CB3] = 'BEAC'; z[0x7CB9] = 'B4E2'; z[0x7CBC] = 'F4D4'; z[0x7CBD] = 'F4D5'; z[0x7CBE] = 'BEAB'; z[0x7CC1] = 'F4D6'; z[0x7CC5] = 'F4DB'; z[0x7CC7] = 'F4D7'; z[0x7CC8] = 'F4DA'; z[0x7CCA] = 'BAFD'; z[0x7CCC] = 'F4D8'; z[0x7CCD] = 'F4D9'; z[0x7CD5] = 'B8E2'; z[0x7CD6] = 'CCC7'; z[0x7CD7] = 'F4DC'; z[0x7CD9] = 'B2DA'; z[0x7CDC] = 'C3D3'; z[0x7CDF] = 'D4E3'; z[0x7CE0] = 'BFB7'; z[0x7CE8] = 'F4DD'; z[0x7CEF] = 'C5B4'; z[0x7CF8] = 'F4E9'; z[0x7CFB] = 'CFB5'; z[0x7D0A] = 'CEC9'; z[0x7D20] = 'CBD8'; z[0x7D22] = 'CBF7'; z[0x7D27] = 'BDF4'; z[0x7D2B] = 'D7CF'; z[0x7D2F] = 'C0DB'; z[0x7D6E] = 'D0F5'; z[0x7D77] = 'F4EA'; z[0x7DA6] = 'F4EB'; z[0x7DAE] = 'F4EC'; z[0x7E3B] = 'F7E3'; z[0x7E41] = 'B7B1'; z[0x7E47] = 'F4ED'; z[0x7E82] = 'D7EB'; z[0x7E9B] = 'F4EE'; z[0x7E9F] = 'E6F9'; z[0x7EA0] = 'BEC0'; z[0x7EA1] = 'E6FA'; z[0x7EA2] = 'BAEC'; z[0x7EA3] = 'E6FB'; z[0x7EA4] = 'CFCB'; z[0x7EA5] = 'E6FC'; z[0x7EA6] = 'D4BC'; z[0x7EA7] = 'BCB6'; z[0x7EA8] = 'E6FD'; z[0x7EA9] = 'E6FE'; z[0x7EAA] = 'BCCD'; z[0x7EAB] = 'C8D2'; z[0x7EAC] = 'CEB3'; z[0x7EAD] = 'E7A1'; z[0x7EAF] = 'B4BF'; z[0x7EB0] = 'E7A2'; z[0x7EB1] = 'C9B4'; z[0x7EB2] = 'B8D9'; z[0x7EB3] = 'C4C9'; z[0x7EB5] = 'D7DD'; z[0x7EB6] = 'C2DA'; z[0x7EB7] = 'B7D7'; z[0x7EB8] = 'D6BD'; z[0x7EB9] = 'CEC6'; z[0x7EBA] = 'B7C4'; z[0x7EBD] = 'C5A6'; z[0x7EBE] = 'E7A3'; z[0x7EBF] = 'CFDF'; z[0x7EC0] = 'E7A4'; z[0x7EC1] = 'E7A5'; z[0x7EC2] = 'E7A6'; z[0x7EC3] = 'C1B7'; z[0x7EC4] = 'D7E9'; z[0x7EC5] = 'C9F0'; z[0x7EC6] = 'CFB8'; z[0x7EC7] = 'D6AF'; z[0x7EC8] = 'D6D5'; z[0x7EC9] = 'E7A7'; z[0x7ECA] = 'B0ED'; z[0x7ECB] = 'E7A8'; z[0x7ECC] = 'E7A9'; z[0x7ECD] = 'C9DC'; z[0x7ECE] = 'D2EF'; z[0x7ECF] = 'BEAD'; z[0x7ED0] = 'E7AA'; z[0x7ED1] = 'B0F3'; z[0x7ED2] = 'C8DE'; z[0x7ED3] = 'BDE1'; z[0x7ED4] = 'E7AB'; z[0x7ED5] = 'C8C6'; z[0x7ED7] = 'E7AC'; z[0x7ED8] = 'BBE6'; z[0x7ED9] = 'B8F8'; z[0x7EDA] = 'D1A4'; z[0x7EDB] = 'E7AD'; z[0x7EDC] = 'C2E7'; z[0x7EDD] = 'BEF8'; z[0x7EDE] = 'BDCA'; z[0x7EDF] = 'CDB3'; z[0x7EE0] = 'E7AE'; z[0x7EE1] = 'E7AF'; z[0x7EE2] = 'BEEE'; z[0x7EE3] = 'D0E5'; z[0x7EE5] = 'CBE7'; z[0x7EE6] = 'CCD0'; z[0x7EE7] = 'BCCC'; z[0x7EE8] = 'E7B0'; z[0x7EE9] = 'BCA8'; z[0x7EEA] = 'D0F7'; z[0x7EEB] = 'E7B1'; z[0x7EED] = 'D0F8'; z[0x7EEE] = 'E7B2'; z[0x7EEF] = 'E7B3'; z[0x7EF0] = 'B4C2'; z[0x7EF1] = 'E7B4'; z[0x7EF2] = 'E7B5'; z[0x7EF3] = 'C9FE'; z[0x7EF4] = 'CEAC'; z[0x7EF5] = 'C3E0'; z[0x7EF6] = 'E7B7'; z[0x7EF7] = 'B1C1'; z[0x7EF8] = 'B3F1'; z[0x7EFA] = 'E7B8'; z[0x7EFB] = 'E7B9'; z[0x7EFC] = 'D7DB'; z[0x7EFD] = 'D5C0'; z[0x7EFE] = 'E7BA'; z[0x7EFF] = 'C2CC'; z[0x7F00] = 'D7BA'; z[0x7F01] = 'E7BB'; z[0x7F02] = 'E7BC'; z[0x7F03] = 'E7BD'; z[0x7F04] = 'BCEA'; z[0x7F05] = 'C3E5'; z[0x7F06] = 'C0C2'; z[0x7F07] = 'E7BE'; z[0x7F08] = 'E7BF'; z[0x7F09] = 'BCA9'; z[0x7F0B] = 'E7C0'; z[0x7F0C] = 'E7C1'; z[0x7F0D] = 'E7B6'; z[0x7F0E] = 'B6D0'; z[0x7F0F] = 'E7C2'; z[0x7F11] = 'E7C3'; z[0x7F12] = 'E7C4'; z[0x7F13] = 'BBBA'; z[0x7F14] = 'B5DE'; z[0x7F15] = 'C2C6'; z[0x7F16] = 'B1E0'; z[0x7F17] = 'E7C5'; z[0x7F18] = 'D4B5'; z[0x7F19] = 'E7C6'; z[0x7F1A] = 'B8BF'; z[0x7F1B] = 'E7C8'; z[0x7F1C] = 'E7C7'; z[0x7F1D] = 'B7EC'; z[0x7F1F] = 'E7C9'; z[0x7F20] = 'B2F8'; z[0x7F21] = 'E7CA'; z[0x7F22] = 'E7CB'; z[0x7F23] = 'E7CC'; z[0x7F24] = 'E7CD'; z[0x7F25] = 'E7CE'; z[0x7F26] = 'E7CF'; z[0x7F27] = 'E7D0'; z[0x7F28] = 'D3A7'; z[0x7F29] = 'CBF5'; z[0x7F2A] = 'E7D1'; z[0x7F2B] = 'E7D2'; z[0x7F2C] = 'E7D3'; z[0x7F2D] = 'E7D4'; z[0x7F2E] = 'C9C9'; z[0x7F2F] = 'E7D5'; z[0x7F30] = 'E7D6'; z[0x7F31] = 'E7D7'; z[0x7F32] = 'E7D8'; z[0x7F33] = 'E7D9'; z[0x7F34] = 'BDC9'; z[0x7F35] = 'E7DA'; z[0x7F36] = 'F3BE'; z[0x7F38] = 'B8D7'; z[0x7F3A] = 'C8B1'; z[0x7F42] = 'F3BF'; z[0x7F44] = 'F3C0'; z[0x7F45] = 'F3C1'; z[0x7F50] = 'B9DE'; z[0x7F51] = 'CDF8'; z[0x7F54] = 'D8E8'; z[0x7F55] = 'BAB1'; z[0x7F57] = 'C2DE'; z[0x7F58] = 'EEB7'; z[0x7F5A] = 'B7A3'; z[0x7F5F] = 'EEB9'; z[0x7F61] = 'EEB8'; z[0x7F62] = 'B0D5'; z[0x7F68] = 'EEBB'; z[0x7F69] = 'D5D6'; z[0x7F6A] = 'D7EF'; z[0x7F6E] = 'D6C3'; z[0x7F71] = 'EEBD'; z[0x7F72] = 'CAF0'; z[0x7F74] = 'EEBC'; z[0x7F79] = 'EEBE'; z[0x7F7E] = 'EEC0'; z[0x7F81] = 'EEBF'; z[0x7F8A] = 'D1F2'; z[0x7F8C] = 'C7BC'; z[0x7F8E] = 'C3C0'; z[0x7F94] = 'B8E1'; z[0x7F9A] = 'C1E7'; z[0x7F9D] = 'F4C6'; z[0x7F9E] = 'D0DF'; z[0x7F9F] = 'F4C7'; z[0x7FA1] = 'CFDB'; z[0x7FA4] = 'C8BA'; z[0x7FA7] = 'F4C8'; z[0x7FAF] = 'F4C9'; z[0x7FB0] = 'F4CA'; z[0x7FB2] = 'F4CB'; z[0x7FB8] = 'D9FA'; z[0x7FB9] = 'B8FE'; z[0x7FBC] = 'E5F1'; z[0x7FBD] = 'D3F0'; z[0x7FBF] = 'F4E0'; z[0x7FC1] = 'CECC'; z[0x7FC5] = 'B3E1'; z[0x7FCA] = 'F1B4'; z[0x7FCC] = 'D2EE'; z[0x7FCE] = 'F4E1'; z[0x7FD4] = 'CFE8'; z[0x7FD5] = 'F4E2'; z[0x7FD8] = 'C7CC'; z[0x7FDF] = 'B5D4'; z[0x7FE0] = 'B4E4'; z[0x7FE1] = 'F4E4'; z[0x7FE5] = 'F4E3'; z[0x7FE6] = 'F4E5'; z[0x7FE9] = 'F4E6'; z[0x7FEE] = 'F4E7'; z[0x7FF0] = 'BAB2'; z[0x7FF1] = 'B0BF'; z[0x7FF3] = 'F4E8'; z[0x7FFB] = 'B7AD'; z[0x7FFC] = 'D2ED'; z[0x8000] = 'D2AB'; z[0x8001] = 'C0CF'; z[0x8003] = 'BFBC'; z[0x8004] = 'EBA3'; z[0x8005] = 'D5DF'; z[0x8006] = 'EAC8'; z[0x800B] = 'F1F3'; z[0x800C] = 'B6F8'; z[0x800D] = 'CBA3'; z[0x8010] = 'C4CD'; z[0x8012] = 'F1E7'; z[0x8014] = 'F1E8'; z[0x8015] = 'B8FB'; z[0x8016] = 'F1E9'; z[0x8017] = 'BAC4'; z[0x8018] = 'D4C5'; z[0x8019] = 'B0D2'; z[0x801C] = 'F1EA'; z[0x8020] = 'F1EB'; z[0x8022] = 'F1EC'; z[0x8025] = 'F1ED'; z[0x8026] = 'F1EE'; z[0x8027] = 'F1EF'; z[0x8028] = 'F1F1'; z[0x8029] = 'F1F0'; z[0x802A] = 'C5D5'; z[0x8031] = 'F1F2'; z[0x8033] = 'B6FA'; z[0x8035] = 'F1F4'; z[0x8036] = 'D2AE'; z[0x8037] = 'DEC7'; z[0x8038] = 'CBCA'; z[0x803B] = 'B3DC'; z[0x803D] = 'B5A2'; z[0x803F] = 'B9A2'; z[0x8042] = 'C4F4'; z[0x8043] = 'F1F5'; z[0x8046] = 'F1F6'; z[0x804A] = 'C1C4'; z[0x804B] = 'C1FB'; z[0x804C] = 'D6B0'; z[0x804D] = 'F1F7'; z[0x8052] = 'F1F8'; z[0x8054] = 'C1AA'; z[0x8058] = 'C6B8'; z[0x805A] = 'BEDB'; z[0x8069] = 'F1F9'; z[0x806A] = 'B4CF'; z[0x8071] = 'F1FA'; z[0x807F] = 'EDB2'; z[0x8080] = 'EDB1'; z[0x8083] = 'CBE0'; z[0x8084] = 'D2DE'; z[0x8086] = 'CBC1'; z[0x8087] = 'D5D8'; z[0x8089] = 'C8E2'; z[0x808B] = 'C0DF'; z[0x808C] = 'BCA1'; z[0x8093] = 'EBC1'; z[0x8096] = 'D0A4'; z[0x8098] = 'D6E2'; z[0x809A] = 'B6C7'; z[0x809B] = 'B8D8'; z[0x809C] = 'EBC0'; z[0x809D] = 'B8CE'; z[0x809F] = 'EBBF'; z[0x80A0] = 'B3A6'; z[0x80A1] = 'B9C9'; z[0x80A2] = 'D6AB'; z[0x80A4] = 'B7F4'; z[0x80A5] = 'B7CA'; z[0x80A9] = 'BCE7'; z[0x80AA] = 'B7BE'; z[0x80AB] = 'EBC6'; z[0x80AD] = 'EBC7'; z[0x80AE] = 'B0B9'; z[0x80AF] = 'BFCF'; z[0x80B1] = 'EBC5'; z[0x80B2] = 'D3FD'; z[0x80B4] = 'EBC8'; z[0x80B7] = 'EBC9'; z[0x80BA] = 'B7CE'; z[0x80BC] = 'EBC2'; z[0x80BD] = 'EBC4'; z[0x80BE] = 'C9F6'; z[0x80BF] = 'D6D7'; z[0x80C0] = 'D5CD'; z[0x80C1] = 'D0B2'; z[0x80C2] = 'EBCF'; z[0x80C3] = 'CEB8'; z[0x80C4] = 'EBD0'; z[0x80C6] = 'B5A8'; z[0x80CC] = 'B1B3'; z[0x80CD] = 'EBD2'; z[0x80CE] = 'CCA5'; z[0x80D6] = 'C5D6'; z[0x80D7] = 'EBD3'; z[0x80D9] = 'EBD1'; z[0x80DA] = 'C5DF'; z[0x80DB] = 'EBCE'; z[0x80DC] = 'CAA4'; z[0x80DD] = 'EBD5'; z[0x80DE] = 'B0FB'; z[0x80E1] = 'BAFA'; z[0x80E4] = 'D8B7'; z[0x80E5] = 'F1E3'; z[0x80E7] = 'EBCA'; z[0x80E8] = 'EBCB'; z[0x80E9] = 'EBCC'; z[0x80EA] = 'EBCD'; z[0x80EB] = 'EBD6'; z[0x80EC] = 'E6C0'; z[0x80ED] = 'EBD9'; z[0x80EF] = 'BFE8'; z[0x80F0] = 'D2C8'; z[0x80F1] = 'EBD7'; z[0x80F2] = 'EBDC'; z[0x80F3] = 'B8EC'; z[0x80F4] = 'EBD8'; z[0x80F6] = 'BDBA'; z[0x80F8] = 'D0D8'; z[0x80FA] = 'B0B7'; z[0x80FC] = 'EBDD'; z[0x80FD] = 'C4DC'; z[0x8102] = 'D6AC'; z[0x8106] = 'B4E0'; z[0x8109] = 'C2F6'; z[0x810A] = 'BCB9'; z[0x810D] = 'EBDA'; z[0x810E] = 'EBDB'; z[0x810F] = 'D4E0'; z[0x8110] = 'C6EA'; z[0x8111] = 'C4D4'; z[0x8112] = 'EBDF'; z[0x8113] = 'C5A7'; z[0x8114] = 'D9F5'; z[0x8116] = 'B2B1'; z[0x8118] = 'EBE4'; z[0x811A] = 'BDC5'; z[0x811E] = 'EBE2'; z[0x812C] = 'EBE3'; z[0x812F] = 'B8AC'; z[0x8131] = 'CDD1'; z[0x8132] = 'EBE5'; z[0x8136] = 'EBE1'; z[0x8138] = 'C1B3'; z[0x813E] = 'C6A2'; z[0x8146] = 'CCF3'; z[0x8148] = 'EBE6'; z[0x814A] = 'C0B0'; z[0x814B] = 'D2B8'; z[0x814C] = 'EBE7'; z[0x8150] = 'B8AF'; z[0x8151] = 'B8AD'; z[0x8153] = 'EBE8'; z[0x8154] = 'C7BB'; z[0x8155] = 'CDF3'; z[0x8159] = 'EBEA'; z[0x815A] = 'EBEB'; z[0x8160] = 'EBED'; z[0x8165] = 'D0C8'; z[0x8167] = 'EBF2'; z[0x8169] = 'EBEE'; z[0x816D] = 'EBF1'; z[0x816E] = 'C8F9'; z[0x8170] = 'D1FC'; z[0x8171] = 'EBEC'; z[0x8174] = 'EBE9'; z[0x8179] = 'B8B9'; z[0x817A] = 'CFD9'; z[0x817B] = 'C4E5'; z[0x817C] = 'EBEF'; z[0x817D] = 'EBF0'; z[0x817E] = 'CCDA'; z[0x817F] = 'CDC8'; z[0x8180] = 'B0F2'; z[0x8182] = 'EBF6'; z[0x8188] = 'EBF5'; z[0x818A] = 'B2B2'; z[0x818F] = 'B8E0'; z[0x8191] = 'EBF7'; z[0x8198] = 'B1EC'; z[0x819B] = 'CCC5'; z[0x819C] = 'C4A4'; z[0x819D] = 'CFA5'; z[0x81A3] = 'EBF9'; z[0x81A6] = 'ECA2'; z[0x81A8] = 'C5F2'; z[0x81AA] = 'EBFA'; z[0x81B3] = 'C9C5'; z[0x81BA] = 'E2DF'; z[0x81BB] = 'EBFE'; z[0x81C0] = 'CDCE'; z[0x81C1] = 'ECA1'; z[0x81C2] = 'B1DB'; z[0x81C3] = 'D3B7'; z[0x81C6] = 'D2DC'; z[0x81CA] = 'EBFD'; z[0x81CC] = 'EBFB'; z[0x81E3] = 'B3BC'; z[0x81E7] = 'EAB0'; z[0x81EA] = 'D7D4'; z[0x81EC] = 'F4AB'; z[0x81ED] = 'B3F4'; z[0x81F3] = 'D6C1'; z[0x81F4] = 'D6C2'; z[0x81FB] = 'D5E9'; z[0x81FC] = 'BECA'; z[0x81FE] = 'F4A7'; z[0x8200] = 'D2A8'; z[0x8201] = 'F4A8'; z[0x8202] = 'F4A9'; z[0x8204] = 'F4AA'; z[0x8205] = 'BECB'; z[0x8206] = 'D3DF'; z[0x820C] = 'C9E0'; z[0x820D] = 'C9E1'; z[0x8210] = 'F3C2'; z[0x8212] = 'CAE6'; z[0x8214] = 'CCF2'; z[0x821B] = 'E2B6'; z[0x821C] = 'CBB4'; z[0x821E] = 'CEE8'; z[0x821F] = 'D6DB'; z[0x8221] = 'F4AD'; z[0x8222] = 'F4AE'; z[0x8223] = 'F4AF'; z[0x8228] = 'F4B2'; z[0x822A] = 'BABD'; z[0x822B] = 'F4B3'; z[0x822C] = 'B0E3'; z[0x822D] = 'F4B0'; z[0x822F] = 'F4B1'; z[0x8230] = 'BDA2'; z[0x8231] = 'B2D5'; z[0x8233] = 'F4B6'; z[0x8234] = 'F4B7'; z[0x8235] = 'B6E6'; z[0x8236] = 'B2B0'; z[0x8237] = 'CFCF'; z[0x8238] = 'F4B4'; z[0x8239] = 'B4AC'; z[0x823B] = 'F4B5'; z[0x823E] = 'F4B8'; z[0x8244] = 'F4B9'; z[0x8247] = 'CDA7'; z[0x8249] = 'F4BA'; z[0x824B] = 'F4BB'; z[0x824F] = 'F4BC'; z[0x8258] = 'CBD2'; z[0x825A] = 'F4BD'; z[0x825F] = 'F4BE'; z[0x8268] = 'F4BF'; z[0x826E] = 'F4DE'; z[0x826F] = 'C1BC'; z[0x8270] = 'BCE8'; z[0x8272] = 'C9AB'; z[0x8273] = 'D1DE'; z[0x8274] = 'E5F5'; z[0x8279] = 'DCB3'; z[0x827A] = 'D2D5'; z[0x827D] = 'DCB4'; z[0x827E] = 'B0AC'; z[0x827F] = 'DCB5'; z[0x8282] = 'BDDA'; z[0x8284] = 'DCB9'; z[0x8288] = 'D8C2'; z[0x828A] = 'DCB7'; z[0x828B] = 'D3F3'; z[0x828D] = 'C9D6'; z[0x828E] = 'DCBA'; z[0x828F] = 'DCB6'; z[0x8291] = 'DCBB'; z[0x8292] = 'C3A2'; z[0x8297] = 'DCBC'; z[0x8298] = 'DCC5'; z[0x8299] = 'DCBD'; z[0x829C] = 'CEDF'; z[0x829D] = 'D6A5'; z[0x829F] = 'DCCF'; z[0x82A1] = 'DCCD'; z[0x82A4] = 'DCD2'; z[0x82A5] = 'BDE6'; z[0x82A6] = 'C2AB'; z[0x82A8] = 'DCB8'; z[0x82A9] = 'DCCB'; z[0x82AA] = 'DCCE'; z[0x82AB] = 'DCBE'; z[0x82AC] = 'B7D2'; z[0x82AD] = 'B0C5'; z[0x82AE] = 'DCC7'; z[0x82AF] = 'D0BE'; z[0x82B0] = 'DCC1'; z[0x82B1] = 'BBA8'; z[0x82B3] = 'B7BC'; z[0x82B4] = 'DCCC'; z[0x82B7] = 'DCC6'; z[0x82B8] = 'DCBF'; z[0x82B9] = 'C7DB'; z[0x82BD] = 'D1BF'; z[0x82BE] = 'DCC0'; z[0x82C1] = 'DCCA'; z[0x82C4] = 'DCD0'; z[0x82C7] = 'CEAD'; z[0x82C8] = 'DCC2'; z[0x82CA] = 'DCC3'; z[0x82CB] = 'DCC8'; z[0x82CC] = 'DCC9'; z[0x82CD] = 'B2D4'; z[0x82CE] = 'DCD1'; z[0x82CF] = 'CBD5'; z[0x82D1] = 'D4B7'; z[0x82D2] = 'DCDB'; z[0x82D3] = 'DCDF'; z[0x82D4] = 'CCA6'; z[0x82D5] = 'DCE6'; z[0x82D7] = 'C3E7'; z[0x82D8] = 'DCDC'; z[0x82DB] = 'BFC1'; z[0x82DC] = 'DCD9'; z[0x82DE] = 'B0FA'; z[0x82DF] = 'B9B6'; z[0x82E0] = 'DCE5'; z[0x82E1] = 'DCD3'; z[0x82E3] = 'DCC4'; z[0x82E4] = 'DCD6'; z[0x82E5] = 'C8F4'; z[0x82E6] = 'BFE0'; z[0x82EB] = 'C9BB'; z[0x82EF] = 'B1BD'; z[0x82F1] = 'D3A2'; z[0x82F4] = 'DCDA'; z[0x82F7] = 'DCD5'; z[0x82F9] = 'C6BB'; z[0x82FB] = 'DCDE'; z[0x8301] = 'D7C2'; z[0x8302] = 'C3AF'; z[0x8303] = 'B7B6'; z[0x8304] = 'C7D1'; z[0x8305] = 'C3A9'; z[0x8306] = 'DCE2'; z[0x8307] = 'DCD8'; z[0x8308] = 'DCEB'; z[0x8309] = 'DCD4'; z[0x830C] = 'DCDD'; z[0x830E] = 'BEA5'; z[0x830F] = 'DCD7'; z[0x8311] = 'DCE0'; z[0x8314] = 'DCE3'; z[0x8315] = 'DCE4'; z[0x8317] = 'DCF8'; z[0x831A] = 'DCE1'; z[0x831B] = 'DDA2'; z[0x831C] = 'DCE7'; z[0x8327] = 'BCEB'; z[0x8328] = 'B4C4'; z[0x832B] = 'C3A3'; z[0x832C] = 'B2E7'; z[0x832D] = 'DCFA'; z[0x832F] = 'DCF2'; z[0x8331] = 'DCEF'; z[0x8333] = 'DCFC'; z[0x8334] = 'DCEE'; z[0x8335] = 'D2F0'; z[0x8336] = 'B2E8'; z[0x8338] = 'C8D7'; z[0x8339] = 'C8E3'; z[0x833A] = 'DCFB'; z[0x833C] = 'DCED'; z[0x8340] = 'DCF7'; z[0x8343] = 'DCF5'; z[0x8346] = 'BEA3'; z[0x8347] = 'DCF4'; z[0x8349] = 'B2DD'; z[0x834F] = 'DCF3'; z[0x8350] = 'BCF6'; z[0x8351] = 'DCE8'; z[0x8352] = 'BBC4'; z[0x8354] = 'C0F3'; z[0x835A] = 'BCD4'; z[0x835B] = 'DCE9'; z[0x835C] = 'DCEA'; z[0x835E] = 'DCF1'; z[0x835F] = 'DCF6'; z[0x8360] = 'DCF9'; z[0x8361] = 'B5B4'; z[0x8363] = 'C8D9'; z[0x8364] = 'BBE7'; z[0x8365] = 'DCFE'; z[0x8366] = 'DCFD'; z[0x8367] = 'D3AB'; z[0x8368] = 'DDA1'; z[0x8369] = 'DDA3'; z[0x836A] = 'DDA5'; z[0x836B] = 'D2F1'; z[0x836C] = 'DDA4'; z[0x836D] = 'DDA6'; z[0x836E] = 'DDA7'; z[0x836F] = 'D2A9'; z[0x8377] = 'BAC9'; z[0x8378] = 'DDA9'; z[0x837B] = 'DDB6'; z[0x837C] = 'DDB1'; z[0x837D] = 'DDB4'; z[0x8385] = 'DDB0'; z[0x8386] = 'C6CE'; z[0x8389] = 'C0F2'; z[0x838E] = 'C9AF'; z[0x8392] = 'DCEC'; z[0x8393] = 'DDAE'; z[0x8398] = 'DDB7'; z[0x839B] = 'DCF0'; z[0x839C] = 'DDAF'; z[0x839E] = 'DDB8'; z[0x83A0] = 'DDAC'; z[0x83A8] = 'DDB9'; z[0x83A9] = 'DDB3'; z[0x83AA] = 'DDAD'; z[0x83AB] = 'C4AA'; z[0x83B0] = 'DDA8'; z[0x83B1] = 'C0B3'; z[0x83B2] = 'C1AB'; z[0x83B3] = 'DDAA'; z[0x83B4] = 'DDAB'; z[0x83B6] = 'DDB2'; z[0x83B7] = 'BBF1'; z[0x83B8] = 'DDB5'; z[0x83B9] = 'D3A8'; z[0x83BA] = 'DDBA'; z[0x83BC] = 'DDBB'; z[0x83BD] = 'C3A7'; z[0x83C0] = 'DDD2'; z[0x83C1] = 'DDBC'; z[0x83C5] = 'DDD1'; z[0x83C7] = 'B9BD'; z[0x83CA] = 'BED5'; z[0x83CC] = 'BEFA'; z[0x83CF] = 'BACA'; z[0x83D4] = 'DDCA'; z[0x83D6] = 'DDC5'; z[0x83D8] = 'DDBF'; z[0x83DC] = 'B2CB'; z[0x83DD] = 'DDC3'; z[0x83DF] = 'DDCB'; z[0x83E0] = 'B2A4'; z[0x83E1] = 'DDD5'; z[0x83E5] = 'DDBE'; z[0x83E9] = 'C6D0'; z[0x83EA] = 'DDD0'; z[0x83F0] = 'DDD4'; z[0x83F1] = 'C1E2'; z[0x83F2] = 'B7C6'; z[0x83F8] = 'DDCE'; z[0x83F9] = 'DDCF'; z[0x83FD] = 'DDC4'; z[0x8401] = 'DDBD'; z[0x8403] = 'DDCD'; z[0x8404] = 'CCD1'; z[0x8406] = 'DDC9'; z[0x840B] = 'DDC2'; z[0x840C] = 'C3C8'; z[0x840D] = 'C6BC'; z[0x840E] = 'CEAE'; z[0x840F] = 'DDCC'; z[0x8411] = 'DDC8'; z[0x8418] = 'DDC1'; z[0x841C] = 'DDC6'; z[0x841D] = 'C2DC'; z[0x8424] = 'D3A9'; z[0x8425] = 'D3AA'; z[0x8426] = 'DDD3'; z[0x8427] = 'CFF4'; z[0x8428] = 'C8F8'; z[0x8431] = 'DDE6'; z[0x8438] = 'DDC7'; z[0x843C] = 'DDE0'; z[0x843D] = 'C2E4'; z[0x8446] = 'DDE1'; z[0x8451] = 'DDD7'; z[0x8457] = 'D6F8'; z[0x8459] = 'DDD9'; z[0x845A] = 'DDD8'; z[0x845B] = 'B8F0'; z[0x845C] = 'DDD6'; z[0x8461] = 'C6CF'; z[0x8463] = 'B6AD'; z[0x8469] = 'DDE2'; z[0x846B] = 'BAF9'; z[0x846C] = 'D4E1'; z[0x846D] = 'DDE7'; z[0x8471] = 'B4D0'; z[0x8473] = 'DDDA'; z[0x8475] = 'BFFB'; z[0x8476] = 'DDE3'; z[0x8478] = 'DDDF'; z[0x847A] = 'DDDD'; z[0x8482] = 'B5D9'; z[0x8487] = 'DDDB'; z[0x8488] = 'DDDC'; z[0x8489] = 'DDDE'; z[0x848B] = 'BDAF'; z[0x848C] = 'DDE4'; z[0x848E] = 'DDE5'; z[0x8497] = 'DDF5'; z[0x8499] = 'C3C9'; z[0x849C] = 'CBE2'; z[0x84A1] = 'DDF2'; z[0x84AF] = 'D8E1'; z[0x84B2] = 'C6D1'; z[0x84B4] = 'DDF4'; z[0x84B8] = 'D5F4'; z[0x84B9] = 'DDF3'; z[0x84BA] = 'DDF0'; z[0x84BD] = 'DDEC'; z[0x84BF] = 'DDEF'; z[0x84C1] = 'DDE8'; z[0x84C4] = 'D0EE'; z[0x84C9] = 'C8D8'; z[0x84CA] = 'DDEE'; z[0x84CD] = 'DDE9'; z[0x84D0] = 'DDEA'; z[0x84D1] = 'CBF2'; z[0x84D3] = 'DDED'; z[0x84D6] = 'B1CD'; z[0x84DD] = 'C0B6'; z[0x84DF] = 'BCBB'; z[0x84E0] = 'DDF1'; z[0x84E3] = 'DDF7'; z[0x84E5] = 'DDF6'; z[0x84E6] = 'DDEB'; z[0x84EC] = 'C5EE'; z[0x84F0] = 'DDFB'; z[0x84FC] = 'DEA4'; z[0x84FF] = 'DEA3'; z[0x850C] = 'DDF8'; z[0x8511] = 'C3EF'; z[0x8513] = 'C2FB'; z[0x8517] = 'D5E1'; z[0x851A] = 'CEB5'; z[0x851F] = 'DDFD'; z[0x8521] = 'B2CC'; z[0x852B] = 'C4E8'; z[0x852C] = 'CADF'; z[0x8537] = 'C7BE'; z[0x8538] = 'DDFA'; z[0x8539] = 'DDFC'; z[0x853A] = 'DDFE'; z[0x853B] = 'DEA2'; z[0x853C] = 'B0AA'; z[0x853D] = 'B1CE'; z[0x8543] = 'DEAC'; z[0x8548] = 'DEA6'; z[0x8549] = 'BDB6'; z[0x854A] = 'C8EF'; z[0x8556] = 'DEA1'; z[0x8559] = 'DEA5'; z[0x855E] = 'DEA9'; z[0x8564] = 'DEA8'; z[0x8568] = 'DEA7'; z[0x8572] = 'DEAD'; z[0x8574] = 'D4CC'; z[0x8579] = 'DEB3'; z[0x857A] = 'DEAA'; z[0x857B] = 'DEAE'; z[0x857E] = 'C0D9'; z[0x8584] = 'B1A1'; z[0x8585] = 'DEB6'; z[0x8587] = 'DEB1'; z[0x858F] = 'DEB2'; z[0x859B] = 'D1A6'; z[0x859C] = 'DEB5'; z[0x85A4] = 'DEAF'; z[0x85A8] = 'DEB0'; z[0x85AA] = 'D0BD'; z[0x85AE] = 'DEB4'; z[0x85AF] = 'CAED'; z[0x85B0] = 'DEB9'; z[0x85B7] = 'DEB8'; z[0x85B9] = 'DEB7'; z[0x85C1] = 'DEBB'; z[0x85C9] = 'BDE5'; z[0x85CF] = 'B2D8'; z[0x85D0] = 'C3EA'; z[0x85D3] = 'DEBA'; z[0x85D5] = 'C5BA'; z[0x85DC] = 'DEBC'; z[0x85E4] = 'CCD9'; z[0x85E9] = 'B7AA'; z[0x85FB] = 'D4E5'; z[0x85FF] = 'DEBD'; z[0x8605] = 'DEBF'; z[0x8611] = 'C4A2'; z[0x8616] = 'DEC1'; z[0x8627] = 'DEBE'; z[0x8629] = 'DEC0'; z[0x8638] = 'D5BA'; z[0x863C] = 'DEC2'; z[0x864D] = 'F2AE'; z[0x864E] = 'BBA2'; z[0x864F] = 'C2B2'; z[0x8650] = 'C5B0'; z[0x8651] = 'C2C7'; z[0x8654] = 'F2AF'; z[0x865A] = 'D0E9'; z[0x865E] = 'D3DD'; z[0x8662] = 'EBBD'; z[0x866B] = 'B3E6'; z[0x866C] = 'F2B0'; z[0x866E] = 'F2B1'; z[0x8671] = 'CAAD'; z[0x8679] = 'BAE7'; z[0x867A] = 'F2B3'; z[0x867B] = 'F2B5'; z[0x867C] = 'F2B4'; z[0x867D] = 'CBE4'; z[0x867E] = 'CFBA'; z[0x867F] = 'F2B2'; z[0x8680] = 'CAB4'; z[0x8681] = 'D2CF'; z[0x8682] = 'C2EC'; z[0x868A] = 'CEC3'; z[0x868B] = 'F2B8'; z[0x868C] = 'B0F6'; z[0x868D] = 'F2B7'; z[0x8693] = 'F2BE'; z[0x8695] = 'B2CF'; z[0x869C] = 'D1C1'; z[0x869D] = 'F2BA'; z[0x86A3] = 'F2BC'; z[0x86A4] = 'D4E9'; z[0x86A7] = 'F2BB'; z[0x86A8] = 'F2B6'; z[0x86A9] = 'F2BF'; z[0x86AA] = 'F2BD'; z[0x86AC] = 'F2B9'; z[0x86AF] = 'F2C7'; z[0x86B0] = 'F2C4'; z[0x86B1] = 'F2C6'; z[0x86B4] = 'F2CA'; z[0x86B5] = 'F2C2'; z[0x86B6] = 'F2C0'; z[0x86BA] = 'F2C5'; z[0x86C0] = 'D6FB'; z[0x86C4] = 'F2C1'; z[0x86C6] = 'C7F9'; z[0x86C7] = 'C9DF'; z[0x86C9] = 'F2C8'; z[0x86CA] = 'B9C6'; z[0x86CB] = 'B5B0'; z[0x86CE] = 'F2C3'; z[0x86CF] = 'F2C9'; z[0x86D0] = 'F2D0'; z[0x86D1] = 'F2D6'; z[0x86D4] = 'BBD7'; z[0x86D8] = 'F2D5'; z[0x86D9] = 'CDDC'; z[0x86DB] = 'D6EB'; z[0x86DE] = 'F2D2'; z[0x86DF] = 'F2D4'; z[0x86E4] = 'B8F2'; z[0x86E9] = 'F2CB'; z[0x86ED] = 'F2CE'; z[0x86EE] = 'C2F9'; z[0x86F0] = 'D5DD'; z[0x86F1] = 'F2CC'; z[0x86F2] = 'F2CD'; z[0x86F3] = 'F2CF'; z[0x86F4] = 'F2D3'; z[0x86F8] = 'F2D9'; z[0x86F9] = 'D3BC'; z[0x86FE] = 'B6EA'; z[0x8700] = 'CAF1'; z[0x8702] = 'B7E4'; z[0x8703] = 'F2D7'; z[0x8707] = 'F2D8'; z[0x8708] = 'F2DA'; z[0x8709] = 'F2DD'; z[0x870A] = 'F2DB'; z[0x870D] = 'F2DC'; z[0x8712] = 'D1D1'; z[0x8713] = 'F2D1'; z[0x8715] = 'CDC9'; z[0x8717] = 'CECF'; z[0x8718] = 'D6A9'; z[0x871A] = 'F2E3'; z[0x871C] = 'C3DB'; z[0x871E] = 'F2E0'; z[0x8721] = 'C0AF'; z[0x8722] = 'F2EC'; z[0x8723] = 'F2DE'; z[0x8725] = 'F2E1'; z[0x8729] = 'F2E8'; z[0x872E] = 'F2E2'; z[0x8731] = 'F2E7'; z[0x8734] = 'F2E6'; z[0x8737] = 'F2E9'; z[0x873B] = 'F2DF'; z[0x873E] = 'F2E4'; z[0x873F] = 'F2EA'; z[0x8747] = 'D3AC'; z[0x8748] = 'F2E5'; z[0x8749] = 'B2F5'; z[0x874C] = 'F2F2'; z[0x874E] = 'D0AB'; z[0x8753] = 'F2F5'; z[0x8757] = 'BBC8'; z[0x8759] = 'F2F9'; z[0x8760] = 'F2F0'; z[0x8763] = 'F2F6'; z[0x8764] = 'F2F8'; z[0x8765] = 'F2FA'; z[0x876E] = 'F2F3'; z[0x8770] = 'F2F1'; z[0x8774] = 'BAFB'; z[0x8776] = 'B5FB'; z[0x877B] = 'F2EF'; z[0x877C] = 'F2F7'; z[0x877D] = 'F2ED'; z[0x877E] = 'F2EE'; z[0x8782] = 'F2EB'; z[0x8783] = 'F3A6'; z[0x8785] = 'F3A3'; z[0x8788] = 'F3A2'; z[0x878B] = 'F2F4'; z[0x878D] = 'C8DA'; z[0x8793] = 'F2FB'; z[0x8797] = 'F3A5'; z[0x879F] = 'C3F8'; z[0x87A8] = 'F2FD'; z[0x87AB] = 'F3A7'; z[0x87AC] = 'F3A9'; z[0x87AD] = 'F3A4'; z[0x87AF] = 'F2FC'; z[0x87B3] = 'F3AB'; z[0x87B5] = 'F3AA'; z[0x87BA] = 'C2DD'; z[0x87BD] = 'F3AE'; z[0x87C0] = 'F3B0'; z[0x87C6] = 'F3A1'; z[0x87CA] = 'F3B1'; z[0x87CB] = 'F3AC'; z[0x87D1] = 'F3AF'; z[0x87D2] = 'F2FE'; z[0x87D3] = 'F3AD'; z[0x87DB] = 'F3B2'; z[0x87E0] = 'F3B4'; z[0x87E5] = 'F3A8'; z[0x87EA] = 'F3B3'; z[0x87EE] = 'F3B5'; z[0x87F9] = 'D0B7'; z[0x87FE] = 'F3B8'; z[0x8803] = 'D9F9'; z[0x880A] = 'F3B9'; z[0x8813] = 'F3B7'; z[0x8815] = 'C8E4'; z[0x8816] = 'F3B6'; z[0x881B] = 'F3BA'; z[0x8821] = 'F3BB'; z[0x8822] = 'B4C0'; z[0x8832] = 'EEC3'; z[0x8839] = 'F3BC'; z[0x883C] = 'F3BD'; z[0x8840] = 'D1AA'; z[0x8844] = 'F4AC'; z[0x8845] = 'D0C6'; z[0x884C] = 'D0D0'; z[0x884D] = 'D1DC'; z[0x8854] = 'CFCE'; z[0x8857] = 'BDD6'; z[0x8859] = 'D1C3'; z[0x8861] = 'BAE2'; z[0x8862] = 'E1E9'; z[0x8863] = 'D2C2'; z[0x8864] = 'F1C2'; z[0x8865] = 'B2B9'; z[0x8868] = 'B1ED'; z[0x8869] = 'F1C3'; z[0x886B] = 'C9C0'; z[0x886C] = 'B3C4'; z[0x886E] = 'D9F2'; z[0x8870] = 'CBA5'; z[0x8872] = 'F1C4'; z[0x8877] = 'D6D4'; z[0x887D] = 'F1C5'; z[0x887E] = 'F4C0'; z[0x887F] = 'F1C6'; z[0x8881] = 'D4AC'; z[0x8882] = 'F1C7'; z[0x8884] = 'B0C0'; z[0x8885] = 'F4C1'; z[0x8888] = 'F4C2'; z[0x888B] = 'B4FC'; z[0x888D] = 'C5DB'; z[0x8892] = 'CCBB'; z[0x8896] = 'D0E4'; z[0x889C] = 'CDE0'; z[0x88A2] = 'F1C8'; z[0x88A4] = 'D9F3'; z[0x88AB] = 'B1BB'; z[0x88AD] = 'CFAE'; z[0x88B1] = 'B8A4'; z[0x88B7] = 'F1CA'; z[0x88BC] = 'F1CB'; z[0x88C1] = 'B2C3'; z[0x88C2] = 'C1D1'; z[0x88C5] = 'D7B0'; z[0x88C6] = 'F1C9'; z[0x88C9] = 'F1CC'; z[0x88CE] = 'F1CE'; z[0x88D2] = 'D9F6'; z[0x88D4] = 'D2E1'; z[0x88D5] = 'D4A3'; z[0x88D8] = 'F4C3'; z[0x88D9] = 'C8B9'; z[0x88DF] = 'F4C4'; z[0x88E2] = 'F1CD'; z[0x88E3] = 'F1CF'; z[0x88E4] = 'BFE3'; z[0x88E5] = 'F1D0'; z[0x88E8] = 'F1D4'; z[0x88F0] = 'F1D6'; z[0x88F1] = 'F1D1'; z[0x88F3] = 'C9D1'; z[0x88F4] = 'C5E1'; z[0x88F8] = 'C2E3'; z[0x88F9] = 'B9FC'; z[0x88FC] = 'F1D3'; z[0x88FE] = 'F1D5'; z[0x8902] = 'B9D3'; z[0x890A] = 'F1DB'; z[0x8910] = 'BAD6'; z[0x8912] = 'B0FD'; z[0x8913] = 'F1D9'; z[0x8919] = 'F1D8'; z[0x891A] = 'F1D2'; z[0x891B] = 'F1DA'; z[0x8921] = 'F1D7'; z[0x8925] = 'C8EC'; z[0x892A] = 'CDCA'; z[0x892B] = 'F1DD'; z[0x8930] = 'E5BD'; z[0x8934] = 'F1DC'; z[0x8936] = 'F1DE'; z[0x8941] = 'F1DF'; z[0x8944] = 'CFE5'; z[0x895E] = 'F4C5'; z[0x895F] = 'BDF3'; z[0x8966] = 'F1E0'; z[0x897B] = 'F1E1'; z[0x897F] = 'CEF7'; z[0x8981] = 'D2AA'; z[0x8983] = 'F1FB'; z[0x8986] = 'B8B2'; z[0x89C1] = 'BCFB'; z[0x89C2] = 'B9DB'; z[0x89C4] = 'B9E6'; z[0x89C5] = 'C3D9'; z[0x89C6] = 'CAD3'; z[0x89C7] = 'EAE8'; z[0x89C8] = 'C0C0'; z[0x89C9] = 'BEF5'; z[0x89CA] = 'EAE9'; z[0x89CB] = 'EAEA'; z[0x89CC] = 'EAEB'; z[0x89CE] = 'EAEC'; z[0x89CF] = 'EAED'; z[0x89D0] = 'EAEE'; z[0x89D1] = 'EAEF'; z[0x89D2] = 'BDC7'; z[0x89D6] = 'F5FB'; z[0x89DA] = 'F5FD'; z[0x89DC] = 'F5FE'; z[0x89DE] = 'F5FC'; z[0x89E3] = 'BDE2'; z[0x89E5] = 'F6A1'; z[0x89E6] = 'B4A5'; z[0x89EB] = 'F6A2'; z[0x89EF] = 'F6A3'; z[0x89F3] = 'ECB2'; z[0x8A00] = 'D1D4'; z[0x8A07] = 'D9EA'; z[0x8A3E] = 'F6A4'; z[0x8A48] = 'EEBA'; z[0x8A79] = 'D5B2'; z[0x8A89] = 'D3FE'; z[0x8A8A] = 'CCDC'; z[0x8A93] = 'CAC4'; z[0x8B07] = 'E5C0'; z[0x8B26] = 'F6A5'; z[0x8B66] = 'BEAF'; z[0x8B6C] = 'C6A9'; z[0x8BA0] = 'DAA5'; z[0x8BA1] = 'BCC6'; z[0x8BA2] = 'B6A9'; z[0x8BA3] = 'B8BC'; z[0x8BA4] = 'C8CF'; z[0x8BA5] = 'BCA5'; z[0x8BA6] = 'DAA6'; z[0x8BA7] = 'DAA7'; z[0x8BA8] = 'CCD6'; z[0x8BA9] = 'C8C3'; z[0x8BAA] = 'DAA8'; z[0x8BAB] = 'C6FD'; z[0x8BAD] = 'D1B5'; z[0x8BAE] = 'D2E9'; z[0x8BAF] = 'D1B6'; z[0x8BB0] = 'BCC7'; z[0x8BB2] = 'BDB2'; z[0x8BB3] = 'BBE4'; z[0x8BB4] = 'DAA9'; z[0x8BB5] = 'DAAA'; z[0x8BB6] = 'D1C8'; z[0x8BB7] = 'DAAB'; z[0x8BB8] = 'D0ED'; z[0x8BB9] = 'B6EF'; z[0x8BBA] = 'C2DB'; z[0x8BBC] = 'CBCF'; z[0x8BBD] = 'B7ED'; z[0x8BBE] = 'C9E8'; z[0x8BBF] = 'B7C3'; z[0x8BC0] = 'BEF7'; z[0x8BC1] = 'D6A4'; z[0x8BC2] = 'DAAC'; z[0x8BC3] = 'DAAD'; z[0x8BC4] = 'C6C0'; z[0x8BC5] = 'D7E7'; z[0x8BC6] = 'CAB6'; z[0x8BC8] = 'D5A9'; z[0x8BC9] = 'CBDF'; z[0x8BCA] = 'D5EF'; z[0x8BCB] = 'DAAE'; z[0x8BCC] = 'D6DF'; z[0x8BCD] = 'B4CA'; z[0x8BCE] = 'DAB0'; z[0x8BCF] = 'DAAF'; z[0x8BD1] = 'D2EB'; z[0x8BD2] = 'DAB1'; z[0x8BD3] = 'DAB2'; z[0x8BD4] = 'DAB3'; z[0x8BD5] = 'CAD4'; z[0x8BD6] = 'DAB4'; z[0x8BD7] = 'CAAB'; z[0x8BD8] = 'DAB5'; z[0x8BD9] = 'DAB6'; z[0x8BDA] = 'B3CF'; z[0x8BDB] = 'D6EF'; z[0x8BDC] = 'DAB7'; z[0x8BDD] = 'BBB0'; z[0x8BDE] = 'B5AE'; z[0x8BDF] = 'DAB8'; z[0x8BE0] = 'DAB9'; z[0x8BE1] = 'B9EE'; z[0x8BE2] = 'D1AF'; z[0x8BE3] = 'D2E8'; z[0x8BE4] = 'DABA'; z[0x8BE5] = 'B8C3'; z[0x8BE6] = 'CFEA'; z[0x8BE7] = 'B2EF'; z[0x8BE8] = 'DABB'; z[0x8BE9] = 'DABC'; z[0x8BEB] = 'BDEB'; z[0x8BEC] = 'CEDC'; z[0x8BED] = 'D3EF'; z[0x8BEE] = 'DABD'; z[0x8BEF] = 'CEF3'; z[0x8BF0] = 'DABE'; z[0x8BF1] = 'D3D5'; z[0x8BF2] = 'BBE5'; z[0x8BF3] = 'DABF'; z[0x8BF4] = 'CBB5'; z[0x8BF5] = 'CBD0'; z[0x8BF6] = 'DAC0'; z[0x8BF7] = 'C7EB'; z[0x8BF8] = 'D6EE'; z[0x8BF9] = 'DAC1'; z[0x8BFA] = 'C5B5'; z[0x8BFB] = 'B6C1'; z[0x8BFC] = 'DAC2'; z[0x8BFD] = 'B7CC'; z[0x8BFE] = 'BFCE'; z[0x8BFF] = 'DAC3'; z[0x8C00] = 'DAC4'; z[0x8C01] = 'CBAD'; z[0x8C02] = 'DAC5'; z[0x8C03] = 'B5F7'; z[0x8C04] = 'DAC6'; z[0x8C05] = 'C1C2'; z[0x8C06] = 'D7BB'; z[0x8C07] = 'DAC7'; z[0x8C08] = 'CCB8'; z[0x8C0A] = 'D2EA'; z[0x8C0B] = 'C4B1'; z[0x8C0C] = 'DAC8'; z[0x8C0D] = 'B5FD'; z[0x8C0E] = 'BBD1'; z[0x8C0F] = 'DAC9'; z[0x8C10] = 'D0B3'; z[0x8C11] = 'DACA'; z[0x8C12] = 'DACB'; z[0x8C13] = 'CEBD'; z[0x8C14] = 'DACC'; z[0x8C15] = 'DACD'; z[0x8C16] = 'DACE'; z[0x8C17] = 'B2F7'; z[0x8C18] = 'DAD1'; z[0x8C19] = 'DACF'; z[0x8C1A] = 'D1E8'; z[0x8C1B] = 'DAD0'; z[0x8C1C] = 'C3D5'; z[0x8C1D] = 'DAD2'; z[0x8C1F] = 'DAD3'; z[0x8C20] = 'DAD4'; z[0x8C21] = 'DAD5'; z[0x8C22] = 'D0BB'; z[0x8C23] = 'D2A5'; z[0x8C24] = 'B0F9'; z[0x8C25] = 'DAD6'; z[0x8C26] = 'C7AB'; z[0x8C27] = 'DAD7'; z[0x8C28] = 'BDF7'; z[0x8C29] = 'C3A1'; z[0x8C2A] = 'DAD8'; z[0x8C2B] = 'DAD9'; z[0x8C2C] = 'C3FD'; z[0x8C2D] = 'CCB7'; z[0x8C2E] = 'DADA'; z[0x8C2F] = 'DADB'; z[0x8C30] = 'C0BE'; z[0x8C31] = 'C6D7'; z[0x8C32] = 'DADC'; z[0x8C33] = 'DADD'; z[0x8C34] = 'C7B4'; z[0x8C35] = 'DADE'; z[0x8C36] = 'DADF'; z[0x8C37] = 'B9C8'; z[0x8C41] = 'BBED'; z[0x8C46] = 'B6B9'; z[0x8C47] = 'F4F8'; z[0x8C49] = 'F4F9'; z[0x8C4C] = 'CDE3'; z[0x8C55] = 'F5B9'; z[0x8C5A] = 'EBE0'; z[0x8C61] = 'CFF3'; z[0x8C62] = 'BBBF'; z[0x8C6A] = 'BAC0'; z[0x8C6B] = 'D4A5'; z[0x8C73] = 'E1D9'; z[0x8C78] = 'F5F4'; z[0x8C79] = 'B1AA'; z[0x8C7A] = 'B2F2'; z[0x8C82] = 'F5F5'; z[0x8C85] = 'F5F7'; z[0x8C89] = 'BAD1'; z[0x8C8A] = 'F5F6'; z[0x8C8C] = 'C3B2'; z[0x8C94] = 'F5F9'; z[0x8C98] = 'F5F8'; z[0x8D1D] = 'B1B4'; z[0x8D1E] = 'D5EA'; z[0x8D1F] = 'B8BA'; z[0x8D21] = 'B9B1'; z[0x8D22] = 'B2C6'; z[0x8D23] = 'D4F0'; z[0x8D24] = 'CFCD'; z[0x8D25] = 'B0DC'; z[0x8D26] = 'D5CB'; z[0x8D27] = 'BBF5'; z[0x8D28] = 'D6CA'; z[0x8D29] = 'B7B7'; z[0x8D2A] = 'CCB0'; z[0x8D2B] = 'C6B6'; z[0x8D2C] = 'B1E1'; z[0x8D2D] = 'B9BA'; z[0x8D2E] = 'D6FC'; z[0x8D2F] = 'B9E1'; z[0x8D30] = 'B7A1'; z[0x8D31] = 'BCFA'; z[0x8D32] = 'EADA'; z[0x8D33] = 'EADB'; z[0x8D34] = 'CCF9'; z[0x8D35] = 'B9F3'; z[0x8D36] = 'EADC'; z[0x8D37] = 'B4FB'; z[0x8D38] = 'C3B3'; z[0x8D39] = 'B7D1'; z[0x8D3A] = 'BAD8'; z[0x8D3B] = 'EADD'; z[0x8D3C] = 'D4F4'; z[0x8D3D] = 'EADE'; z[0x8D3E] = 'BCD6'; z[0x8D3F] = 'BBDF'; z[0x8D40] = 'EADF'; z[0x8D41] = 'C1DE'; z[0x8D42] = 'C2B8'; z[0x8D43] = 'D4DF'; z[0x8D44] = 'D7CA'; z[0x8D45] = 'EAE0'; z[0x8D46] = 'EAE1'; z[0x8D47] = 'EAE4'; z[0x8D48] = 'EAE2'; z[0x8D49] = 'EAE3'; z[0x8D4A] = 'C9DE'; z[0x8D4B] = 'B8B3'; z[0x8D4C] = 'B6C4'; z[0x8D4D] = 'EAE5'; z[0x8D4E] = 'CAEA'; z[0x8D4F] = 'C9CD'; z[0x8D50] = 'B4CD'; z[0x8D53] = 'E2D9'; z[0x8D54] = 'C5E2'; z[0x8D55] = 'EAE6'; z[0x8D56] = 'C0B5'; z[0x8D58] = 'D7B8'; z[0x8D59] = 'EAE7'; z[0x8D5A] = 'D7AC'; z[0x8D5B] = 'C8FC'; z[0x8D5C] = 'D8D3'; z[0x8D5D] = 'D8CD'; z[0x8D5E] = 'D4DE'; z[0x8D60] = 'D4F9'; z[0x8D61] = 'C9C4'; z[0x8D62] = 'D3AE'; z[0x8D63] = 'B8D3'; z[0x8D64] = 'B3E0'; z[0x8D66] = 'C9E2'; z[0x8D67] = 'F4F6'; z[0x8D6B] = 'BAD5'; z[0x8D6D] = 'F4F7'; z[0x8D70] = 'D7DF'; z[0x8D73] = 'F4F1'; z[0x8D74] = 'B8B0'; z[0x8D75] = 'D5D4'; z[0x8D76] = 'B8CF'; z[0x8D77] = 'C6F0'; z[0x8D81] = 'B3C3'; z[0x8D84] = 'F4F2'; z[0x8D85] = 'B3AC'; z[0x8D8A] = 'D4BD'; z[0x8D8B] = 'C7F7'; z[0x8D91] = 'F4F4'; z[0x8D94] = 'F4F3'; z[0x8D9F] = 'CCCB'; z[0x8DA3] = 'C8A4'; z[0x8DB1] = 'F4F5'; z[0x8DB3] = 'D7E3'; z[0x8DB4] = 'C5BF'; z[0x8DB5] = 'F5C0'; z[0x8DB8] = 'F5BB'; z[0x8DBA] = 'F5C3'; z[0x8DBC] = 'F5C2'; z[0x8DBE] = 'D6BA'; z[0x8DBF] = 'F5C1'; z[0x8DC3] = 'D4BE'; z[0x8DC4] = 'F5C4'; z[0x8DC6] = 'F5CC'; z[0x8DCB] = 'B0CF'; z[0x8DCC] = 'B5F8'; z[0x8DCE] = 'F5C9'; z[0x8DCF] = 'F5CA'; z[0x8DD1] = 'C5DC'; z[0x8DD6] = 'F5C5'; z[0x8DD7] = 'F5C6'; z[0x8DDA] = 'F5C7'; z[0x8DDB] = 'F5CB'; z[0x8DDD] = 'BEE0'; z[0x8DDE] = 'F5C8'; z[0x8DDF] = 'B8FA'; z[0x8DE3] = 'F5D0'; z[0x8DE4] = 'F5D3'; z[0x8DE8] = 'BFE7'; z[0x8DEA] = 'B9F2'; z[0x8DEB] = 'F5BC'; z[0x8DEC] = 'F5CD'; z[0x8DEF] = 'C2B7'; z[0x8DF3] = 'CCF8'; z[0x8DF5] = 'BCF9'; z[0x8DF7] = 'F5CE'; z[0x8DF8] = 'F5CF'; z[0x8DF9] = 'F5D1'; z[0x8DFA] = 'B6E5'; z[0x8DFB] = 'F5D2'; z[0x8DFD] = 'F5D5'; z[0x8E05] = 'F5BD'; z[0x8E09] = 'F5D4'; z[0x8E0A] = 'D3BB'; z[0x8E0C] = 'B3EC'; z[0x8E0F] = 'CCA4'; z[0x8E14] = 'F5D6'; z[0x8E1D] = 'F5D7'; z[0x8E1E] = 'BEE1'; z[0x8E1F] = 'F5D8'; z[0x8E22] = 'CCDF'; z[0x8E23] = 'F5DB'; z[0x8E29] = 'B2C8'; z[0x8E2A] = 'D7D9'; z[0x8E2C] = 'F5D9'; z[0x8E2E] = 'F5DA'; z[0x8E2F] = 'F5DC'; z[0x8E31] = 'F5E2'; z[0x8E35] = 'F5E0'; z[0x8E39] = 'F5DF'; z[0x8E3A] = 'F5DD'; z[0x8E3D] = 'F5E1'; z[0x8E40] = 'F5DE'; z[0x8E41] = 'F5E4'; z[0x8E42] = 'F5E5'; z[0x8E44] = 'CCE3'; z[0x8E47] = 'E5BF'; z[0x8E48] = 'B5B8'; z[0x8E49] = 'F5E3'; z[0x8E4A] = 'F5E8'; z[0x8E4B] = 'CCA3'; z[0x8E51] = 'F5E6'; z[0x8E52] = 'F5E7'; z[0x8E59] = 'F5BE'; z[0x8E66] = 'B1C4'; z[0x8E69] = 'F5BF'; z[0x8E6C] = 'B5C5'; z[0x8E6D] = 'B2E4'; z[0x8E6F] = 'F5EC'; z[0x8E70] = 'F5E9'; z[0x8E72] = 'B6D7'; z[0x8E74] = 'F5ED'; z[0x8E76] = 'F5EA'; z[0x8E7C] = 'F5EB'; z[0x8E7F] = 'B4DA'; z[0x8E81] = 'D4EA'; z[0x8E85] = 'F5EE'; z[0x8E87] = 'B3F9'; z[0x8E8F] = 'F5EF'; z[0x8E90] = 'F5F1'; z[0x8E94] = 'F5F0'; z[0x8E9C] = 'F5F2'; z[0x8E9E] = 'F5F3'; z[0x8EAB] = 'C9ED'; z[0x8EAC] = 'B9AA'; z[0x8EAF] = 'C7FB'; z[0x8EB2] = 'B6E3'; z[0x8EBA] = 'CCC9'; z[0x8ECE] = 'EAA6'; z[0x8F66] = 'B3B5'; z[0x8F67] = 'D4FE'; z[0x8F68] = 'B9EC'; z[0x8F69] = 'D0F9'; z[0x8F6B] = 'E9ED'; z[0x8F6C] = 'D7AA'; z[0x8F6D] = 'E9EE'; z[0x8F6E] = 'C2D6'; z[0x8F6F] = 'C8ED'; z[0x8F70] = 'BAE4'; z[0x8F71] = 'E9EF'; z[0x8F72] = 'E9F0'; z[0x8F73] = 'E9F1'; z[0x8F74] = 'D6E1'; z[0x8F75] = 'E9F2'; z[0x8F76] = 'E9F3'; z[0x8F77] = 'E9F5'; z[0x8F78] = 'E9F4'; z[0x8F79] = 'E9F6'; z[0x8F7A] = 'E9F7'; z[0x8F7B] = 'C7E1'; z[0x8F7C] = 'E9F8'; z[0x8F7D] = 'D4D8'; z[0x8F7E] = 'E9F9'; z[0x8F7F] = 'BDCE'; z[0x8F81] = 'E9FA'; z[0x8F82] = 'E9FB'; z[0x8F83] = 'BDCF'; z[0x8F84] = 'E9FC'; z[0x8F85] = 'B8A8'; z[0x8F86] = 'C1BE'; z[0x8F87] = 'E9FD'; z[0x8F88] = 'B1B2'; z[0x8F89] = 'BBD4'; z[0x8F8A] = 'B9F5'; z[0x8F8B] = 'E9FE'; z[0x8F8D] = 'EAA1'; z[0x8F8E] = 'EAA2'; z[0x8F8F] = 'EAA3'; z[0x8F90] = 'B7F8'; z[0x8F91] = 'BCAD'; z[0x8F93] = 'CAE4'; z[0x8F94] = 'E0CE'; z[0x8F95] = 'D4AF'; z[0x8F96] = 'CFBD'; z[0x8F97] = 'D5B7'; z[0x8F98] = 'EAA4'; z[0x8F99] = 'D5DE'; z[0x8F9A] = 'EAA5'; z[0x8F9B] = 'D0C1'; z[0x8F9C] = 'B9BC'; z[0x8F9E] = 'B4C7'; z[0x8F9F] = 'B1D9'; z[0x8FA3] = 'C0B1'; z[0x8FA8] = 'B1E6'; z[0x8FA9] = 'B1E7'; z[0x8FAB] = 'B1E8'; z[0x8FB0] = 'B3BD'; z[0x8FB1] = 'C8E8'; z[0x8FB6] = 'E5C1'; z[0x8FB9] = 'B1DF'; z[0x8FBD] = 'C1C9'; z[0x8FBE] = 'B4EF'; z[0x8FC1] = 'C7A8'; z[0x8FC2] = 'D3D8'; z[0x8FC4] = 'C6F9'; z[0x8FC5] = 'D1B8'; z[0x8FC7] = 'B9FD'; z[0x8FC8] = 'C2F5'; z[0x8FCE] = 'D3AD'; z[0x8FD0] = 'D4CB'; z[0x8FD1] = 'BDFC'; z[0x8FD3] = 'E5C2'; z[0x8FD4] = 'B7B5'; z[0x8FD5] = 'E5C3'; z[0x8FD8] = 'BBB9'; z[0x8FD9] = 'D5E2'; z[0x8FDB] = 'BDF8'; z[0x8FDC] = 'D4B6'; z[0x8FDD] = 'CEA5'; z[0x8FDE] = 'C1AC'; z[0x8FDF] = 'B3D9'; z[0x8FE2] = 'CCF6'; z[0x8FE4] = 'E5C6'; z[0x8FE5] = 'E5C4'; z[0x8FE6] = 'E5C8'; z[0x8FE8] = 'E5CA'; z[0x8FE9] = 'E5C7'; z[0x8FEA] = 'B5CF'; z[0x8FEB] = 'C6C8'; z[0x8FED] = 'B5FC'; z[0x8FEE] = 'E5C5'; z[0x8FF0] = 'CAF6'; z[0x8FF3] = 'E5C9'; z[0x8FF7] = 'C3D4'; z[0x8FF8] = 'B1C5'; z[0x8FF9] = 'BCA3'; z[0x8FFD] = 'D7B7'; z[0x9000] = 'CDCB'; z[0x9001] = 'CBCD'; z[0x9002] = 'CACA'; z[0x9003] = 'CCD3'; z[0x9004] = 'E5CC'; z[0x9005] = 'E5CB'; z[0x9006] = 'C4E6'; z[0x9009] = 'D1A1'; z[0x900A] = 'D1B7'; z[0x900B] = 'E5CD'; z[0x900D] = 'E5D0'; z[0x900F] = 'CDB8'; z[0x9010] = 'D6F0'; z[0x9011] = 'E5CF'; z[0x9012] = 'B5DD'; z[0x9014] = 'CDBE'; z[0x9016] = 'E5D1'; z[0x9017] = 'B6BA'; z[0x901A] = 'CDA8'; z[0x901B] = 'B9E4'; z[0x901D] = 'CAC5'; z[0x901E] = 'B3D1'; z[0x901F] = 'CBD9'; z[0x9020] = 'D4EC'; z[0x9021] = 'E5D2'; z[0x9022] = 'B7EA'; z[0x9026] = 'E5CE'; z[0x902D] = 'E5D5'; z[0x902E] = 'B4FE'; z[0x902F] = 'E5D6'; z[0x9035] = 'E5D3'; z[0x9036] = 'E5D4'; z[0x9038] = 'D2DD'; z[0x903B] = 'C2DF'; z[0x903C] = 'B1C6'; z[0x903E] = 'D3E2'; z[0x9041] = 'B6DD'; z[0x9042] = 'CBEC'; z[0x9044] = 'E5D7'; z[0x9047] = 'D3F6'; z[0x904D] = 'B1E9'; z[0x904F] = 'B6F4'; z[0x9050] = 'E5DA'; z[0x9051] = 'E5D8'; z[0x9052] = 'E5D9'; z[0x9053] = 'B5C0'; z[0x9057] = 'D2C5'; z[0x9058] = 'E5DC'; z[0x905B] = 'E5DE'; z[0x9062] = 'E5DD'; z[0x9063] = 'C7B2'; z[0x9065] = 'D2A3'; z[0x9068] = 'E5DB'; z[0x906D] = 'D4E2'; z[0x906E] = 'D5DA'; z[0x9074] = 'E5E0'; z[0x9075] = 'D7F1'; z[0x907D] = 'E5E1'; z[0x907F] = 'B1DC'; z[0x9080] = 'D1FB'; z[0x9082] = 'E5E2'; z[0x9083] = 'E5E4'; z[0x9088] = 'E5E3'; z[0x908B] = 'E5E5'; z[0x9091] = 'D2D8'; z[0x9093] = 'B5CB'; z[0x9095] = 'E7DF'; z[0x9097] = 'DAF5'; z[0x9099] = 'DAF8'; z[0x909B] = 'DAF6'; z[0x909D] = 'DAF7'; z[0x90A1] = 'DAFA'; z[0x90A2] = 'D0CF'; z[0x90A3] = 'C4C7'; z[0x90A6] = 'B0EE'; z[0x90AA] = 'D0B0'; z[0x90AC] = 'DAF9'; z[0x90AE] = 'D3CA'; z[0x90AF] = 'BAAA'; z[0x90B0] = 'DBA2'; z[0x90B1] = 'C7F1'; z[0x90B3] = 'DAFC'; z[0x90B4] = 'DAFB'; z[0x90B5] = 'C9DB'; z[0x90B6] = 'DAFD'; z[0x90B8] = 'DBA1'; z[0x90B9] = 'D7DE'; z[0x90BA] = 'DAFE'; z[0x90BB] = 'C1DA'; z[0x90BE] = 'DBA5'; z[0x90C1] = 'D3F4'; z[0x90C4] = 'DBA7'; z[0x90C5] = 'DBA4'; z[0x90C7] = 'DBA8'; z[0x90CA] = 'BDBC'; z[0x90CE] = 'C0C9'; z[0x90CF] = 'DBA3'; z[0x90D0] = 'DBA6'; z[0x90D1] = 'D6A3'; z[0x90D3] = 'DBA9'; z[0x90D7] = 'DBAD'; z[0x90DB] = 'DBAE'; z[0x90DC] = 'DBAC'; z[0x90DD] = 'BAC2'; z[0x90E1] = 'BFA4'; z[0x90E2] = 'DBAB'; z[0x90E6] = 'DBAA'; z[0x90E7] = 'D4C7'; z[0x90E8] = 'B2BF'; z[0x90EB] = 'DBAF'; z[0x90ED] = 'B9F9'; z[0x90EF] = 'DBB0'; z[0x90F4] = 'B3BB'; z[0x90F8] = 'B5A6'; z[0x90FD] = 'B6BC'; z[0x90FE] = 'DBB1'; z[0x9102] = 'B6F5'; z[0x9104] = 'DBB2'; z[0x9119] = 'B1C9'; z[0x911E] = 'DBB4'; z[0x9122] = 'DBB3'; z[0x9123] = 'DBB5'; z[0x912F] = 'DBB7'; z[0x9131] = 'DBB6'; z[0x9139] = 'DBB8'; z[0x9143] = 'DBB9'; z[0x9146] = 'DBBA'; z[0x9149] = 'D3CF'; z[0x914A] = 'F4FA'; z[0x914B] = 'C7F5'; z[0x914C] = 'D7C3'; z[0x914D] = 'C5E4'; z[0x914E] = 'F4FC'; z[0x914F] = 'F4FD'; z[0x9150] = 'F4FB'; z[0x9152] = 'BEC6'; z[0x9157] = 'D0EF'; z[0x915A] = 'B7D3'; z[0x915D] = 'D4CD'; z[0x915E] = 'CCAA'; z[0x9161] = 'F5A2'; z[0x9162] = 'F5A1'; z[0x9163] = 'BAA8'; z[0x9164] = 'F4FE'; z[0x9165] = 'CBD6'; z[0x9169] = 'F5A4'; z[0x916A] = 'C0D2'; z[0x916C] = 'B3EA'; z[0x916E] = 'CDAA'; z[0x916F] = 'F5A5'; z[0x9170] = 'F5A3'; z[0x9171] = 'BDB4'; z[0x9172] = 'F5A8'; z[0x9174] = 'F5A9'; z[0x9175] = 'BDCD'; z[0x9176] = 'C3B8'; z[0x9177] = 'BFE1'; z[0x9178] = 'CBE1'; z[0x9179] = 'F5AA'; z[0x917D] = 'F5A6'; z[0x917E] = 'F5A7'; z[0x917F] = 'C4F0'; z[0x9185] = 'F5AC'; z[0x9187] = 'B4BC'; z[0x9189] = 'D7ED'; z[0x918B] = 'B4D7'; z[0x918C] = 'F5AB'; z[0x918D] = 'F5AE'; z[0x9190] = 'F5AD'; z[0x9191] = 'F5AF'; z[0x9192] = 'D0D1'; z[0x919A] = 'C3D1'; z[0x919B] = 'C8A9'; z[0x91A2] = 'F5B0'; z[0x91A3] = 'F5B1'; z[0x91AA] = 'F5B2'; z[0x91AD] = 'F5B3'; z[0x91AE] = 'F5B4'; z[0x91AF] = 'F5B5'; z[0x91B4] = 'F5B7'; z[0x91B5] = 'F5B6'; z[0x91BA] = 'F5B8'; z[0x91C7] = 'B2C9'; z[0x91C9] = 'D3D4'; z[0x91CA] = 'CACD'; z[0x91CC] = 'C0EF'; z[0x91CD] = 'D6D8'; z[0x91CE] = 'D2B0'; z[0x91CF] = 'C1BF'; z[0x91D1] = 'BDF0'; z[0x91DC] = 'B8AA'; z[0x9274] = 'BCF8'; z[0x928E] = 'F6C6'; z[0x92AE] = 'F6C7'; z[0x92C8] = 'F6C8'; z[0x933E] = 'F6C9'; z[0x936A] = 'F6CA'; z[0x938F] = 'F6CC'; z[0x93CA] = 'F6CB'; z[0x93D6] = 'F7E9'; z[0x943E] = 'F6CD'; z[0x946B] = 'F6CE'; z[0x9485] = 'EEC4'; z[0x9486] = 'EEC5'; z[0x9487] = 'EEC6'; z[0x9488] = 'D5EB'; z[0x9489] = 'B6A4'; z[0x948A] = 'EEC8'; z[0x948B] = 'EEC7'; z[0x948C] = 'EEC9'; z[0x948D] = 'EECA'; z[0x948E] = 'C7A5'; z[0x948F] = 'EECB'; z[0x9490] = 'EECC'; z[0x9492] = 'B7B0'; z[0x9493] = 'B5F6'; z[0x9494] = 'EECD'; z[0x9495] = 'EECF'; z[0x9497] = 'EECE'; z[0x9499] = 'B8C6'; z[0x949A] = 'EED0'; z[0x949B] = 'EED1'; z[0x949C] = 'EED2'; z[0x949D] = 'B6DB'; z[0x949E] = 'B3AE'; z[0x949F] = 'D6D3'; z[0x94A0] = 'C4C6'; z[0x94A1] = 'B1B5'; z[0x94A2] = 'B8D6'; z[0x94A3] = 'EED3'; z[0x94A4] = 'EED4'; z[0x94A5] = 'D4BF'; z[0x94A6] = 'C7D5'; z[0x94A7] = 'BEFB'; z[0x94A8] = 'CED9'; z[0x94A9] = 'B9B3'; z[0x94AA] = 'EED6'; z[0x94AB] = 'EED5'; z[0x94AC] = 'EED8'; z[0x94AD] = 'EED7'; z[0x94AE] = 'C5A5'; z[0x94AF] = 'EED9'; z[0x94B0] = 'EEDA'; z[0x94B1] = 'C7AE'; z[0x94B2] = 'EEDB'; z[0x94B3] = 'C7AF'; z[0x94B4] = 'EEDC'; z[0x94B5] = 'B2A7'; z[0x94B6] = 'EEDD'; z[0x94B7] = 'EEDE'; z[0x94B8] = 'EEDF'; z[0x94B9] = 'EEE0'; z[0x94BA] = 'EEE1'; z[0x94BB] = 'D7EA'; z[0x94BC] = 'EEE2'; z[0x94BD] = 'EEE3'; z[0x94BE] = 'BCD8'; z[0x94BF] = 'EEE4'; z[0x94C0] = 'D3CB'; z[0x94C1] = 'CCFA'; z[0x94C2] = 'B2AC'; z[0x94C3] = 'C1E5'; z[0x94C4] = 'EEE5'; z[0x94C5] = 'C7A6'; z[0x94C6] = 'C3AD'; z[0x94C8] = 'EEE6'; z[0x94C9] = 'EEE7'; z[0x94CA] = 'EEE8'; z[0x94CB] = 'EEE9'; z[0x94CC] = 'EEEA'; z[0x94CD] = 'EEEB'; z[0x94CE] = 'EEEC'; z[0x94D0] = 'EEED'; z[0x94D1] = 'EEEE'; z[0x94D2] = 'EEEF'; z[0x94D5] = 'EEF0'; z[0x94D6] = 'EEF1'; z[0x94D7] = 'EEF2'; z[0x94D8] = 'EEF4'; z[0x94D9] = 'EEF3'; z[0x94DB] = 'EEF5'; z[0x94DC] = 'CDAD'; z[0x94DD] = 'C2C1'; z[0x94DE] = 'EEF6'; z[0x94DF] = 'EEF7'; z[0x94E0] = 'EEF8'; z[0x94E1] = 'D5A1'; z[0x94E2] = 'EEF9'; z[0x94E3] = 'CFB3'; z[0x94E4] = 'EEFA'; z[0x94E5] = 'EEFB'; z[0x94E7] = 'EEFC'; z[0x94E8] = 'EEFD'; z[0x94E9] = 'EFA1'; z[0x94EA] = 'EEFE'; z[0x94EB] = 'EFA2'; z[0x94EC] = 'B8F5'; z[0x94ED] = 'C3FA'; z[0x94EE] = 'EFA3'; z[0x94EF] = 'EFA4'; z[0x94F0] = 'BDC2'; z[0x94F1] = 'D2BF'; z[0x94F2] = 'B2F9'; z[0x94F3] = 'EFA5'; z[0x94F4] = 'EFA6'; z[0x94F5] = 'EFA7'; z[0x94F6] = 'D2F8'; z[0x94F7] = 'EFA8'; z[0x94F8] = 'D6FD'; z[0x94F9] = 'EFA9'; z[0x94FA] = 'C6CC'; z[0x94FC] = 'EFAA'; z[0x94FD] = 'EFAB'; z[0x94FE] = 'C1B4'; z[0x94FF] = 'EFAC'; z[0x9500] = 'CFFA'; z[0x9501] = 'CBF8'; z[0x9502] = 'EFAE'; z[0x9503] = 'EFAD'; z[0x9504] = 'B3FA'; z[0x9505] = 'B9F8'; z[0x9506] = 'EFAF'; z[0x9507] = 'EFB0'; z[0x9508] = 'D0E2'; z[0x9509] = 'EFB1'; z[0x950A] = 'EFB2'; z[0x950B] = 'B7E6'; z[0x950C] = 'D0BF'; z[0x950D] = 'EFB3'; z[0x950E] = 'EFB4'; z[0x950F] = 'EFB5'; z[0x9510] = 'C8F1'; z[0x9511] = 'CCE0'; z[0x9512] = 'EFB6'; z[0x9513] = 'EFB7'; z[0x9514] = 'EFB8'; z[0x9515] = 'EFB9'; z[0x9516] = 'EFBA'; z[0x9517] = 'D5E0'; z[0x9518] = 'EFBB'; z[0x9519] = 'B4ED'; z[0x951A] = 'C3AA'; z[0x951B] = 'EFBC'; z[0x951D] = 'EFBD'; z[0x951E] = 'EFBE'; z[0x951F] = 'EFBF'; z[0x9521] = 'CEFD'; z[0x9522] = 'EFC0'; z[0x9523] = 'C2E0'; z[0x9524] = 'B4B8'; z[0x9525] = 'D7B6'; z[0x9526] = 'BDF5'; z[0x9528] = 'CFC7'; z[0x9529] = 'EFC3'; z[0x952A] = 'EFC1'; z[0x952B] = 'EFC2'; z[0x952C] = 'EFC4'; z[0x952D] = 'B6A7'; z[0x952E] = 'BCFC'; z[0x952F] = 'BEE2'; z[0x9530] = 'C3CC'; z[0x9531] = 'EFC5'; z[0x9532] = 'EFC6'; z[0x9534] = 'EFC7'; z[0x9535] = 'EFCF'; z[0x9536] = 'EFC8'; z[0x9537] = 'EFC9'; z[0x9538] = 'EFCA'; z[0x9539] = 'C7C2'; z[0x953A] = 'EFF1'; z[0x953B] = 'B6CD'; z[0x953C] = 'EFCB'; z[0x953E] = 'EFCC'; z[0x953F] = 'EFCD'; z[0x9540] = 'B6C6'; z[0x9541] = 'C3BE'; z[0x9542] = 'EFCE'; z[0x9544] = 'EFD0'; z[0x9545] = 'EFD1'; z[0x9546] = 'EFD2'; z[0x9547] = 'D5F2'; z[0x9549] = 'EFD3'; z[0x954A] = 'C4F7'; z[0x954C] = 'EFD4'; z[0x954D] = 'C4F8'; z[0x954E] = 'EFD5'; z[0x954F] = 'EFD6'; z[0x9550] = 'B8E4'; z[0x9551] = 'B0F7'; z[0x9552] = 'EFD7'; z[0x9553] = 'EFD8'; z[0x9554] = 'EFD9'; z[0x9556] = 'EFDA'; z[0x9557] = 'EFDB'; z[0x9558] = 'EFDC'; z[0x9559] = 'EFDD'; z[0x955B] = 'EFDE'; z[0x955C] = 'BEB5'; z[0x955D] = 'EFE1'; z[0x955E] = 'EFDF'; z[0x955F] = 'EFE0'; z[0x9561] = 'EFE2'; z[0x9562] = 'EFE3'; z[0x9563] = 'C1CD'; z[0x9564] = 'EFE4'; z[0x9565] = 'EFE5'; z[0x9566] = 'EFE6'; z[0x9567] = 'EFE7'; z[0x9568] = 'EFE8'; z[0x9569] = 'EFE9'; z[0x956A] = 'EFEA'; z[0x956B] = 'EFEB'; z[0x956C] = 'EFEC'; z[0x956D] = 'C0D8'; z[0x956F] = 'EFED'; z[0x9570] = 'C1AD'; z[0x9571] = 'EFEE'; z[0x9572] = 'EFEF'; z[0x9573] = 'EFF0'; z[0x9576] = 'CFE2'; z[0x957F] = 'B3A4'; z[0x95E8] = 'C3C5'; z[0x95E9] = 'E3C5'; z[0x95EA] = 'C9C1'; z[0x95EB] = 'E3C6'; z[0x95ED] = 'B1D5'; z[0x95EE] = 'CECA'; z[0x95EF] = 'B4B3'; z[0x95F0] = 'C8F2'; z[0x95F1] = 'E3C7'; z[0x95F2] = 'CFD0'; z[0x95F3] = 'E3C8'; z[0x95F4] = 'BCE4'; z[0x95F5] = 'E3C9'; z[0x95F6] = 'E3CA'; z[0x95F7] = 'C3C6'; z[0x95F8] = 'D5A2'; z[0x95F9] = 'C4D6'; z[0x95FA] = 'B9EB'; z[0x95FB] = 'CEC5'; z[0x95FC] = 'E3CB'; z[0x95FD] = 'C3F6'; z[0x95FE] = 'E3CC'; z[0x9600] = 'B7A7'; z[0x9601] = 'B8F3'; z[0x9602] = 'BAD2'; z[0x9603] = 'E3CD'; z[0x9604] = 'E3CE'; z[0x9605] = 'D4C4'; z[0x9606] = 'E3CF'; z[0x9608] = 'E3D0'; z[0x9609] = 'D1CB'; z[0x960A] = 'E3D1'; z[0x960B] = 'E3D2'; z[0x960C] = 'E3D3'; z[0x960D] = 'E3D4'; z[0x960E] = 'D1D6'; z[0x960F] = 'E3D5'; z[0x9610] = 'B2FB'; z[0x9611] = 'C0BB'; z[0x9612] = 'E3D6'; z[0x9614] = 'C0AB'; z[0x9615] = 'E3D7'; z[0x9616] = 'E3D8'; z[0x9617] = 'E3D9'; z[0x9619] = 'E3DA'; z[0x961A] = 'E3DB'; z[0x961C] = 'B8B7'; z[0x961D] = 'DAE2'; z[0x961F] = 'B6D3'; z[0x9621] = 'DAE4'; z[0x9622] = 'DAE3'; z[0x962A] = 'DAE6'; z[0x962E] = 'C8EE'; z[0x9631] = 'DAE5'; z[0x9632] = 'B7C0'; z[0x9633] = 'D1F4'; z[0x9634] = 'D2F5'; z[0x9635] = 'D5F3'; z[0x9636] = 'BDD7'; z[0x963B] = 'D7E8'; z[0x963C] = 'DAE8'; z[0x963D] = 'DAE7'; z[0x963F] = 'B0A2'; z[0x9640] = 'CDD3'; z[0x9642] = 'DAE9'; z[0x9644] = 'B8BD'; z[0x9645] = 'BCCA'; z[0x9646] = 'C2BD'; z[0x9647] = 'C2A4'; z[0x9648] = 'B3C2'; z[0x9649] = 'DAEA'; z[0x964B] = 'C2AA'; z[0x964C] = 'C4B0'; z[0x964D] = 'BDB5'; z[0x9650] = 'CFDE'; z[0x9654] = 'DAEB'; z[0x9655] = 'C9C2'; z[0x965B] = 'B1DD'; z[0x965F] = 'DAEC'; z[0x9661] = 'B6B8'; z[0x9662] = 'D4BA'; z[0x9664] = 'B3FD'; z[0x9667] = 'DAED'; z[0x9668] = 'D4C9'; z[0x9669] = 'CFD5'; z[0x966A] = 'C5E3'; z[0x966C] = 'DAEE'; z[0x9672] = 'DAEF'; z[0x9674] = 'DAF0'; z[0x9675] = 'C1EA'; z[0x9676] = 'CCD5'; z[0x9677] = 'CFDD'; z[0x9685] = 'D3E7'; z[0x9686] = 'C2A1'; z[0x9688] = 'DAF1'; z[0x968B] = 'CBE5'; z[0x968D] = 'DAF2'; z[0x968F] = 'CBE6'; z[0x9690] = 'D2FE'; z[0x9694] = 'B8F4'; z[0x9697] = 'DAF3'; z[0x9698] = 'B0AF'; z[0x9699] = 'CFB6'; z[0x969C] = 'D5CF'; z[0x96A7] = 'CBED'; z[0x96B0] = 'DAF4'; z[0x96B3] = 'E3C4'; z[0x96B6] = 'C1A5'; z[0x96B9] = 'F6BF'; z[0x96BC] = 'F6C0'; z[0x96BD] = 'F6C1'; z[0x96BE] = 'C4D1'; z[0x96C0] = 'C8B8'; z[0x96C1] = 'D1E3'; z[0x96C4] = 'D0DB'; z[0x96C5] = 'D1C5'; z[0x96C6] = 'BCAF'; z[0x96C7] = 'B9CD'; z[0x96C9] = 'EFF4'; z[0x96CC] = 'B4C6'; z[0x96CD] = 'D3BA'; z[0x96CE] = 'F6C2'; z[0x96CF] = 'B3FB'; z[0x96D2] = 'F6C3'; z[0x96D5] = 'B5F1'; z[0x96E0] = 'F6C5'; z[0x96E8] = 'D3EA'; z[0x96E9] = 'F6A7'; z[0x96EA] = 'D1A9'; z[0x96EF] = 'F6A9'; z[0x96F3] = 'F6A8'; z[0x96F6] = 'C1E3'; z[0x96F7] = 'C0D7'; z[0x96F9] = 'B1A2'; z[0x96FE] = 'CEED'; z[0x9700] = 'D0E8'; z[0x9701] = 'F6AB'; z[0x9704] = 'CFF6'; z[0x9706] = 'F6AA'; z[0x9707] = 'D5F0'; z[0x9708] = 'F6AC'; z[0x9709] = 'C3B9'; z[0x970D] = 'BBF4'; z[0x970E] = 'F6AE'; z[0x970F] = 'F6AD'; z[0x9713] = 'C4DE'; z[0x9716] = 'C1D8'; z[0x971C] = 'CBAA'; z[0x971E] = 'CFBC'; z[0x972A] = 'F6AF'; z[0x972D] = 'F6B0'; z[0x9730] = 'F6B1'; z[0x9732] = 'C2B6'; z[0x9738] = 'B0D4'; z[0x9739] = 'C5F9'; z[0x973E] = 'F6B2'; z[0x9752] = 'C7E0'; z[0x9753] = 'F6A6'; z[0x9756] = 'BEB8'; z[0x9759] = 'BEB2'; z[0x975B] = 'B5E5'; z[0x975E] = 'B7C7'; z[0x9760] = 'BFBF'; z[0x9761] = 'C3D2'; z[0x9762] = 'C3E6'; z[0x9765] = 'D8CC'; z[0x9769] = 'B8EF'; z[0x9773] = 'BDF9'; z[0x9774] = 'D1A5'; z[0x9776] = 'B0D0'; z[0x977C] = 'F7B0'; z[0x9785] = 'F7B1'; z[0x978B] = 'D0AC'; z[0x978D] = 'B0B0'; z[0x9791] = 'F7B2'; z[0x9792] = 'F7B3'; z[0x9794] = 'F7B4'; z[0x9798] = 'C7CA'; z[0x97A0] = 'BECF'; z[0x97A3] = 'F7B7'; z[0x97AB] = 'F7B6'; z[0x97AD] = 'B1DE'; z[0x97AF] = 'F7B5'; z[0x97B2] = 'F7B8'; z[0x97B4] = 'F7B9'; z[0x97E6] = 'CEA4'; z[0x97E7] = 'C8CD'; z[0x97E9] = 'BAAB'; z[0x97EA] = 'E8B8'; z[0x97EB] = 'E8B9'; z[0x97EC] = 'E8BA'; z[0x97ED] = 'BEC2'; z[0x97F3] = 'D2F4'; z[0x97F5] = 'D4CF'; z[0x97F6] = 'C9D8'; z[0x9875] = 'D2B3'; z[0x9876] = 'B6A5'; z[0x9877] = 'C7EA'; z[0x9878] = 'F1FC'; z[0x9879] = 'CFEE'; z[0x987A] = 'CBB3'; z[0x987B] = 'D0EB'; z[0x987C] = 'E7EF'; z[0x987D] = 'CDE7'; z[0x987E] = 'B9CB'; z[0x987F] = 'B6D9'; z[0x9880] = 'F1FD'; z[0x9881] = 'B0E4'; z[0x9882] = 'CBCC'; z[0x9883] = 'F1FE'; z[0x9884] = 'D4A4'; z[0x9885] = 'C2AD'; z[0x9886] = 'C1EC'; z[0x9887] = 'C6C4'; z[0x9888] = 'BEB1'; z[0x9889] = 'F2A1'; z[0x988A] = 'BCD5'; z[0x988C] = 'F2A2'; z[0x988D] = 'F2A3'; z[0x988F] = 'F2A4'; z[0x9890] = 'D2C3'; z[0x9891] = 'C6B5'; z[0x9893] = 'CDC7'; z[0x9894] = 'F2A5'; z[0x9896] = 'D3B1'; z[0x9897] = 'BFC5'; z[0x9898] = 'CCE2'; z[0x989A] = 'F2A6'; z[0x989B] = 'F2A7'; z[0x989C] = 'D1D5'; z[0x989D] = 'B6EE'; z[0x989E] = 'F2A8'; z[0x989F] = 'F2A9'; z[0x98A0] = 'B5DF'; z[0x98A1] = 'F2AA'; z[0x98A2] = 'F2AB'; z[0x98A4] = 'B2FC'; z[0x98A5] = 'F2AC'; z[0x98A6] = 'F2AD'; z[0x98A7] = 'C8A7'; z[0x98CE] = 'B7E7'; z[0x98D1] = 'ECA9'; z[0x98D2] = 'ECAA'; z[0x98D3] = 'ECAB'; z[0x98D5] = 'ECAC'; z[0x98D8] = 'C6AE'; z[0x98D9] = 'ECAD'; z[0x98DA] = 'ECAE'; z[0x98DE] = 'B7C9'; z[0x98DF] = 'CAB3'; z[0x98E7] = 'E2B8'; z[0x98E8] = 'F7CF'; z[0x990D] = 'F7D0'; z[0x9910] = 'B2CD'; z[0x992E] = 'F7D1'; z[0x9954] = 'F7D3'; z[0x9955] = 'F7D2'; z[0x9963] = 'E2BB'; z[0x9965] = 'BCA2'; z[0x9967] = 'E2BC'; z[0x9968] = 'E2BD'; z[0x9969] = 'E2BE'; z[0x996A] = 'E2BF'; z[0x996B] = 'E2C0'; z[0x996C] = 'E2C1'; z[0x996D] = 'B7B9'; z[0x996E] = 'D2FB'; z[0x996F] = 'BDA4'; z[0x9970] = 'CACE'; z[0x9971] = 'B1A5'; z[0x9972] = 'CBC7'; z[0x9974] = 'E2C2'; z[0x9975] = 'B6FC'; z[0x9976] = 'C8C4'; z[0x9977] = 'E2C3'; z[0x997A] = 'BDC8'; z[0x997C] = 'B1FD'; z[0x997D] = 'E2C4'; z[0x997F] = 'B6F6'; z[0x9980] = 'E2C5'; z[0x9981] = 'C4D9'; z[0x9984] = 'E2C6'; z[0x9985] = 'CFDA'; z[0x9986] = 'B9DD'; z[0x9987] = 'E2C7'; z[0x9988] = 'C0A1'; z[0x998A] = 'E2C8'; z[0x998B] = 'B2F6'; z[0x998D] = 'E2C9'; z[0x998F] = 'C1F3'; z[0x9990] = 'E2CA'; z[0x9991] = 'E2CB'; z[0x9992] = 'C2F8'; z[0x9993] = 'E2CC'; z[0x9994] = 'E2CD'; z[0x9995] = 'E2CE'; z[0x9996] = 'CAD7'; z[0x9997] = 'D8B8'; z[0x9998] = 'D9E5'; z[0x9999] = 'CFE3'; z[0x99A5] = 'F0A5'; z[0x99A8] = 'DCB0'; z[0x9A6C] = 'C2ED'; z[0x9A6D] = 'D4A6'; z[0x9A6E] = 'CDD4'; z[0x9A6F] = 'D1B1'; z[0x9A70] = 'B3DB'; z[0x9A71] = 'C7FD'; z[0x9A73] = 'B2B5'; z[0x9A74] = 'C2BF'; z[0x9A75] = 'E6E0'; z[0x9A76] = 'CABB'; z[0x9A77] = 'E6E1'; z[0x9A78] = 'E6E2'; z[0x9A79] = 'BED4'; z[0x9A7A] = 'E6E3'; z[0x9A7B] = 'D7A4'; z[0x9A7C] = 'CDD5'; z[0x9A7D] = 'E6E5'; z[0x9A7E] = 'BCDD'; z[0x9A7F] = 'E6E4'; z[0x9A80] = 'E6E6'; z[0x9A81] = 'E6E7'; z[0x9A82] = 'C2EE'; z[0x9A84] = 'BDBE'; z[0x9A85] = 'E6E8'; z[0x9A86] = 'C2E6'; z[0x9A87] = 'BAA7'; z[0x9A88] = 'E6E9'; z[0x9A8A] = 'E6EA'; z[0x9A8B] = 'B3D2'; z[0x9A8C] = 'D1E9'; z[0x9A8F] = 'BFA5'; z[0x9A90] = 'E6EB'; z[0x9A91] = 'C6EF'; z[0x9A92] = 'E6EC'; z[0x9A93] = 'E6ED'; z[0x9A96] = 'E6EE'; z[0x9A97] = 'C6AD'; z[0x9A98] = 'E6EF'; z[0x9A9A] = 'C9A7'; z[0x9A9B] = 'E6F0'; z[0x9A9C] = 'E6F1'; z[0x9A9D] = 'E6F2'; z[0x9A9E] = 'E5B9'; z[0x9A9F] = 'E6F3'; z[0x9AA0] = 'E6F4'; z[0x9AA1] = 'C2E2'; z[0x9AA2] = 'E6F5'; z[0x9AA3] = 'E6F6'; z[0x9AA4] = 'D6E8'; z[0x9AA5] = 'E6F7'; z[0x9AA7] = 'E6F8'; z[0x9AA8] = 'B9C7'; z[0x9AB0] = 'F7BB'; z[0x9AB1] = 'F7BA'; z[0x9AB6] = 'F7BE'; z[0x9AB7] = 'F7BC'; z[0x9AB8] = 'BAA1'; z[0x9ABA] = 'F7BF'; z[0x9ABC] = 'F7C0'; z[0x9AC0] = 'F7C2'; z[0x9AC1] = 'F7C1'; z[0x9AC2] = 'F7C4'; z[0x9AC5] = 'F7C3'; z[0x9ACB] = 'F7C5'; z[0x9ACC] = 'F7C6'; z[0x9AD1] = 'F7C7'; z[0x9AD3] = 'CBE8'; z[0x9AD8] = 'B8DF'; z[0x9ADF] = 'F7D4'; z[0x9AE1] = 'F7D5'; z[0x9AE6] = 'F7D6'; z[0x9AEB] = 'F7D8'; z[0x9AED] = 'F7DA'; z[0x9AEF] = 'F7D7'; z[0x9AF9] = 'F7DB'; z[0x9AFB] = 'F7D9'; z[0x9B03] = 'D7D7'; z[0x9B08] = 'F7DC'; z[0x9B0F] = 'F7DD'; z[0x9B13] = 'F7DE'; z[0x9B1F] = 'F7DF'; z[0x9B23] = 'F7E0'; z[0x9B2F] = 'DBCB'; z[0x9B32] = 'D8AA'; z[0x9B3B] = 'E5F7'; z[0x9B3C] = 'B9ED'; z[0x9B41] = 'BFFD'; z[0x9B42] = 'BBEA'; z[0x9B43] = 'F7C9'; z[0x9B44] = 'C6C7'; z[0x9B45] = 'F7C8'; z[0x9B47] = 'F7CA'; z[0x9B48] = 'F7CC'; z[0x9B49] = 'F7CB'; z[0x9B4D] = 'F7CD'; z[0x9B4F] = 'CEBA'; z[0x9B51] = 'F7CE'; z[0x9B54] = 'C4A7'; z[0x9C7C] = 'D3E3'; z[0x9C7F] = 'F6CF'; z[0x9C81] = 'C2B3'; z[0x9C82] = 'F6D0'; z[0x9C85] = 'F6D1'; z[0x9C86] = 'F6D2'; z[0x9C87] = 'F6D3'; z[0x9C88] = 'F6D4'; z[0x9C8B] = 'F6D6'; z[0x9C8D] = 'B1AB'; z[0x9C8E] = 'F6D7'; z[0x9C90] = 'F6D8'; z[0x9C91] = 'F6D9'; z[0x9C92] = 'F6DA'; z[0x9C94] = 'F6DB'; z[0x9C95] = 'F6DC'; z[0x9C9A] = 'F6DD'; z[0x9C9B] = 'F6DE'; z[0x9C9C] = 'CFCA'; z[0x9C9E] = 'F6DF'; z[0x9C9F] = 'F6E0'; z[0x9CA0] = 'F6E1'; z[0x9CA1] = 'F6E2'; z[0x9CA2] = 'F6E3'; z[0x9CA3] = 'F6E4'; z[0x9CA4] = 'C0F0'; z[0x9CA5] = 'F6E5'; z[0x9CA6] = 'F6E6'; z[0x9CA7] = 'F6E7'; z[0x9CA8] = 'F6E8'; z[0x9CA9] = 'F6E9'; z[0x9CAB] = 'F6EA'; z[0x9CAD] = 'F6EB'; z[0x9CAE] = 'F6EC'; z[0x9CB0] = 'F6ED'; z[0x9CB1] = 'F6EE'; z[0x9CB2] = 'F6EF'; z[0x9CB3] = 'F6F0'; z[0x9CB4] = 'F6F1'; z[0x9CB5] = 'F6F2'; z[0x9CB6] = 'F6F3'; z[0x9CB7] = 'F6F4'; z[0x9CB8] = 'BEA8'; z[0x9CBA] = 'F6F5'; z[0x9CBB] = 'F6F6'; z[0x9CBC] = 'F6F7'; z[0x9CBD] = 'F6F8'; z[0x9CC3] = 'C8FA'; z[0x9CC4] = 'F6F9'; z[0x9CC5] = 'F6FA'; z[0x9CC6] = 'F6FB'; z[0x9CC7] = 'F6FC'; z[0x9CCA] = 'F6FD'; z[0x9CCB] = 'F6FE'; z[0x9CCC] = 'F7A1'; z[0x9CCD] = 'F7A2'; z[0x9CCE] = 'F7A3'; z[0x9CCF] = 'F7A4'; z[0x9CD0] = 'F7A5'; z[0x9CD3] = 'F7A6'; z[0x9CD4] = 'F7A7'; z[0x9CD5] = 'F7A8'; z[0x9CD6] = 'B1EE'; z[0x9CD7] = 'F7A9'; z[0x9CD8] = 'F7AA'; z[0x9CD9] = 'F7AB'; z[0x9CDC] = 'F7AC'; z[0x9CDD] = 'F7AD'; z[0x9CDE] = 'C1DB'; z[0x9CDF] = 'F7AE'; z[0x9CE2] = 'F7AF'; z[0x9E1F] = 'C4F1'; z[0x9E20] = 'F0AF'; z[0x9E21] = 'BCA6'; z[0x9E22] = 'F0B0'; z[0x9E23] = 'C3F9'; z[0x9E25] = 'C5B8'; z[0x9E26] = 'D1BB'; z[0x9E28] = 'F0B1'; z[0x9E29] = 'F0B2'; z[0x9E2A] = 'F0B3'; z[0x9E2B] = 'F0B4'; z[0x9E2C] = 'F0B5'; z[0x9E2D] = 'D1BC'; z[0x9E2F] = 'D1EC'; z[0x9E31] = 'F0B7'; z[0x9E32] = 'F0B6'; z[0x9E33] = 'D4A7'; z[0x9E35] = 'CDD2'; z[0x9E36] = 'F0B8'; z[0x9E37] = 'F0BA'; z[0x9E38] = 'F0B9'; z[0x9E39] = 'F0BB'; z[0x9E3A] = 'F0BC'; z[0x9E3D] = 'B8EB'; z[0x9E3E] = 'F0BD'; z[0x9E3F] = 'BAE8'; z[0x9E41] = 'F0BE'; z[0x9E42] = 'F0BF'; z[0x9E43] = 'BEE9'; z[0x9E44] = 'F0C0'; z[0x9E45] = 'B6EC'; z[0x9E46] = 'F0C1'; z[0x9E47] = 'F0C2'; z[0x9E48] = 'F0C3'; z[0x9E49] = 'F0C4'; z[0x9E4A] = 'C8B5'; z[0x9E4B] = 'F0C5'; z[0x9E4C] = 'F0C6'; z[0x9E4E] = 'F0C7'; z[0x9E4F] = 'C5F4'; z[0x9E51] = 'F0C8'; z[0x9E55] = 'F0C9'; z[0x9E57] = 'F0CA'; z[0x9E58] = 'F7BD'; z[0x9E5A] = 'F0CB'; z[0x9E5B] = 'F0CC'; z[0x9E5C] = 'F0CD'; z[0x9E5E] = 'F0CE'; z[0x9E63] = 'F0CF'; z[0x9E64] = 'BAD7'; z[0x9E66] = 'F0D0'; z[0x9E67] = 'F0D1'; z[0x9E68] = 'F0D2'; z[0x9E69] = 'F0D3'; z[0x9E6A] = 'F0D4'; z[0x9E6B] = 'F0D5'; z[0x9E6C] = 'F0D6'; z[0x9E6D] = 'F0D8'; z[0x9E70] = 'D3A5'; z[0x9E71] = 'F0D7'; z[0x9E73] = 'F0D9'; z[0x9E7E] = 'F5BA'; z[0x9E7F] = 'C2B9'; z[0x9E82] = 'F7E4'; z[0x9E87] = 'F7E5'; z[0x9E88] = 'F7E6'; z[0x9E8B] = 'F7E7'; z[0x9E92] = 'F7E8'; z[0x9E93] = 'C2B4'; z[0x9E9D] = 'F7EA'; z[0x9E9F] = 'F7EB'; z[0x9EA6] = 'C2F3'; z[0x9EB4] = 'F4F0'; z[0x9EB8] = 'F4EF'; z[0x9EBB] = 'C2E9'; z[0x9EBD] = 'F7E1'; z[0x9EBE] = 'F7E2'; z[0x9EC4] = 'BBC6'; z[0x9EC9] = 'D9E4'; z[0x9ECD] = 'CAF2'; z[0x9ECE] = 'C0E8'; z[0x9ECF] = 'F0A4'; z[0x9ED1] = 'BADA'; z[0x9ED4] = 'C7AD'; z[0x9ED8] = 'C4AC'; z[0x9EDB] = 'F7EC'; z[0x9EDC] = 'F7ED'; z[0x9EDD] = 'F7EE'; z[0x9EDF] = 'F7F0'; z[0x9EE0] = 'F7EF'; z[0x9EE2] = 'F7F1'; z[0x9EE5] = 'F7F4'; z[0x9EE7] = 'F7F3'; z[0x9EE9] = 'F7F2'; z[0x9EEA] = 'F7F5'; z[0x9EEF] = 'F7F6'; z[0x9EF9] = 'EDE9'; z[0x9EFB] = 'EDEA'; z[0x9EFC] = 'EDEB'; z[0x9EFE] = 'F6BC'; z[0x9F0B] = 'F6BD'; z[0x9F0D] = 'F6BE'; z[0x9F0E] = 'B6A6'; z[0x9F10] = 'D8BE'; z[0x9F13] = 'B9C4'; z[0x9F17] = 'D8BB'; z[0x9F19] = 'DCB1'; z[0x9F20] = 'CAF3'; z[0x9F22] = 'F7F7'; z[0x9F2C] = 'F7F8'; z[0x9F2F] = 'F7F9'; z[0x9F37] = 'F7FB'; z[0x9F39] = 'F7FA'; z[0x9F3B] = 'B1C7'; z[0x9F3D] = 'F7FC'; z[0x9F3E] = 'F7FD'; z[0x9F44] = 'F7FE'; z[0x9F50] = 'C6EB'; z[0x9F51] = 'ECB4'; z[0x9F7F] = 'B3DD'; z[0x9F80] = 'F6B3'; z[0x9F83] = 'F6B4'; z[0x9F84] = 'C1E4'; z[0x9F85] = 'F6B5'; z[0x9F86] = 'F6B6'; z[0x9F87] = 'F6B7'; z[0x9F88] = 'F6B8'; z[0x9F89] = 'F6B9'; z[0x9F8A] = 'F6BA'; z[0x9F8B] = 'C8A3'; z[0x9F8C] = 'F6BB'; z[0x9F99] = 'C1FA'; z[0x9F9A] = 'B9A8'; z[0x9F9B] = 'EDE8'; z[0x9F9F] = 'B9EA'; z[0x9FA0] = 'D9DF'; z[0xFF01] = 'A3A1'; z[0xFF02] = 'A3A2'; z[0xFF03] = 'A3A3'; z[0xFF04] = 'A1E7'; z[0xFF05] = 'A3A5'; z[0xFF06] = 'A3A6'; z[0xFF07] = 'A3A7'; z[0xFF08] = 'A3A8'; z[0xFF09] = 'A3A9'; z[0xFF0A] = 'A3AA'; z[0xFF0B] = 'A3AB'; z[0xFF0C] = 'A3AC'; z[0xFF0D] = 'A3AD'; z[0xFF0E] = 'A3AE'; z[0xFF0F] = 'A3AF'; z[0xFF10] = 'A3B0'; z[0xFF11] = 'A3B1'; z[0xFF12] = 'A3B2'; z[0xFF13] = 'A3B3'; z[0xFF14] = 'A3B4'; z[0xFF15] = 'A3B5'; z[0xFF16] = 'A3B6'; z[0xFF17] = 'A3B7'; z[0xFF18] = 'A3B8'; z[0xFF19] = 'A3B9'; z[0xFF1A] = 'A3BA'; z[0xFF1B] = 'A3BB'; z[0xFF1C] = 'A3BC'; z[0xFF1D] = 'A3BD'; z[0xFF1E] = 'A3BE'; z[0xFF1F] = 'A3BF'; z[0xFF20] = 'A3C0'; z[0xFF21] = 'A3C1'; z[0xFF22] = 'A3C2'; z[0xFF23] = 'A3C3'; z[0xFF24] = 'A3C4'; z[0xFF25] = 'A3C5'; z[0xFF26] = 'A3C6'; z[0xFF27] = 'A3C7'; z[0xFF28] = 'A3C8'; z[0xFF29] = 'A3C9'; z[0xFF2A] = 'A3CA'; z[0xFF2B] = 'A3CB'; z[0xFF2C] = 'A3CC'; z[0xFF2D] = 'A3CD'; z[0xFF2E] = 'A3CE'; z[0xFF2F] = 'A3CF'; z[0xFF30] = 'A3D0'; z[0xFF31] = 'A3D1'; z[0xFF32] = 'A3D2'; z[0xFF33] = 'A3D3'; z[0xFF34] = 'A3D4'; z[0xFF35] = 'A3D5'; z[0xFF36] = 'A3D6'; z[0xFF37] = 'A3D7'; z[0xFF38] = 'A3D8'; z[0xFF39] = 'A3D9'; z[0xFF3A] = 'A3DA'; z[0xFF3B] = 'A3DB'; z[0xFF3C] = 'A3DC'; z[0xFF3D] = 'A3DD'; z[0xFF3E] = 'A3DE'; z[0xFF3F] = 'A3DF'; z[0xFF40] = 'A3E0'; z[0xFF41] = 'A3E1'; z[0xFF42] = 'A3E2'; z[0xFF43] = 'A3E3'; z[0xFF44] = 'A3E4'; z[0xFF45] = 'A3E5'; z[0xFF46] = 'A3E6'; z[0xFF47] = 'A3E7'; z[0xFF48] = 'A3E8'; z[0xFF49] = 'A3E9'; z[0xFF4A] = 'A3EA'; z[0xFF4B] = 'A3EB'; z[0xFF4C] = 'A3EC'; z[0xFF4D] = 'A3ED'; z[0xFF4E] = 'A3EE'; z[0xFF4F] = 'A3EF'; z[0xFF50] = 'A3F0'; z[0xFF51] = 'A3F1'; z[0xFF52] = 'A3F2'; z[0xFF53] = 'A3F3'; z[0xFF54] = 'A3F4'; z[0xFF55] = 'A3F5'; z[0xFF56] = 'A3F6'; z[0xFF57] = 'A3F7'; z[0xFF58] = 'A3F8'; z[0xFF59] = 'A3F9'; z[0xFF5A] = 'A3FA'; z[0xFF5B] = 'A3FB'; z[0xFF5C] = 'A3FC'; z[0xFF5D] = 'A3FD'; z[0xFF5E] = 'A1AB'; z[0xFFE0] = 'A1E9'; z[0xFFE1] = 'A1EA'; z[0xFFE3] = 'A3FE'; z[0xFFE5] = 'A3A4';
var utfToGBK = function (str) {
    var i, c, ret = "", strSpecial = "!\"#$%&'()*+,/:;<=>?@[\]^`{|}~%";
    for (i = 0; i < str.length; i++) {
        //alert(str.charCodeAt(i));
        c = str.charCodeAt(i).toString(16);
        if (c == " ")
            ret += "+";
        else if (strSpecial.indexOf(c) != -1)
            ret += str.charCodeAt(i).toString(16);
        if (z[str.charCodeAt(i)] != null) {
            d = z[str.charCodeAt(i)];
            try {
                ret += d.slice(0, 2) + d.slice(-2);
            }
            catch (e) {
                alert(" $$ error name = " + e.name
                    + ", message = " + e.message + ", d " + i + "= " + str.charCodeAt(i))
            }
        }
        else
            ret += c;
    }
    return ret;
}

var devices = [];
// 终端查询
function deviceQuery() {
    var query_json = {
        uid: $.cookie('dealer_id')
    };
    wistorm_api._list('_iotDevice', query_json, 'did', 'did', '-createdAt', 0, 0, 1, -1, auth_code, true, function (json) {
        for (var i = 0; i < json.data.length; i++) {
            if (!json.data[i].binded) {
                devices.push(json.data[i].did);
            }
        }
        $('#device_id').typeahead({
            source: function (query, process) {
                process(devices);
            }
        });
    });
}

function customerQuery() {
    var dealer_type = $.cookie('dealer_type');
    var dealer_id = $.cookie('dealer_id');
    var tree_path = $.cookie('tree_path');
    var key = '';
    if ($('#searchKey').val() !== '') {
        key = $('#searchKey').val().trim();
    }
    var page_no = 1;
    var page_count = 1000;

    // var searchUrl = $.cookie('Host') + "dealer/" + dealer_id + "/customer";
    // var searchData = { auth_code:auth_code, tree_path: tree_path, dealer_type: dealer_type, key:key, page_no:page_no, page_count:page_count };
    // var searchObj = { type:"GET", url:searchUrl, data:searchData, success:function (json) {
    //     customerQuerySuccess(json);
    // }, error:OnError };
    // ajax_function(searchObj);
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
    '8': '/img/company_icon.png',
    '99': '/img/depart_icon.png'
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
        //         if(parseInt(treeNode.id) > 100){
        uid = treeNode.id;
        tree_path = treeNode.treePath;
        is_depart = treeNode.isDepart;
        selectNode = treeNode;
        cust_id = treeNode.id;
        $.cookie('uid', uid);
        cust_name = treeNode.name;
        $('#selCustName').html(cust_name);
        vehicleQuery(uid, tree_path, is_depart);
        // }
    };

    var onCustomerAssignClick = function (event, treeId, treeNode) {
        //        alert(treeNode.tree_path);
        if (parseInt(treeNode.id) > -1) {
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

    var customerArray = [];
    var selectArray = [];
    // customerArray.push({
    //     open: true,
    //     id: $.cookie('dealer_id'),
    //     pId: 0,
    //     name: '我的目标',
    //     icon: '/img/customer.png'
    // });
    // selectArray.push({
    //     open: true,
    //     id: $.cookie('dealer_id'),
    //     pId: 0,
    //     name: '恢复到上级用户',
    //     icon: '/img/restore.png'
    // });
    // uid = $.cookie('dealer_id');
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
        // json.data[i]['open'] = true;
        // json.data[i]['id'] = json.data[i]['objectId'];
        // json.data[i]['pId'] = json.data[i]['custType'];
        // json.data[i]['name'] = json.data[i]['name'];
        // json.data[i]['icon'] = '/img/customer.png';
        var childCount = json.data[i]['other'] ? (json.data[i]['other']['childCount'] || 0) : 0;
        var vehicleCount = json.data[i]['other'] ? (json.data[i]['other']['vehicleCount'] || 0) : 0;
        customerArray.push({
            open: false,
            id: json.data[i]['uid'],
            treePath: json.data[i]['treePath'],
            pId: json.data[i]['parentId'][0],
            name: json.data[i]['name'] + '(' + vehicleCount + ')',
            _name: json.data[i]['name'],
            childCount: childCount,
            vehicleCount: vehicleCount,
            icon: treeIcon[json.data[i]['custType']]
        });
        selectArray.push({
            open: false,
            id: json.data[i]['uid'],
            treePath: json.data[i]['treePath'],
            pId: json.data[i]['parentId'][0],
            name: json.data[i]['name'] + '(' + vehicleCount + ')',
            _name: json.data[i]['name'],
            childCount: childCount,
            vehicleCount: vehicleCount,
            icon: treeIcon[json.data[i]['custType']]
        });
    }
    $.fn.zTree.init($("#customerTree"), setting, customerArray);
    $.fn.zTree.init($("#customerTreeAssign"), settingAssign, selectArray);

    var MM = new csMenu($("#customerTree"), $("#Menu1"), 'customerTree');
    $('#customerKey').typeahead({ source: names });

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
        if (typeof vehicleQuery != "undefined") {
            vehicleQuery(uid, tree_path, is_depart);
        }
    }
};

// 目标查询
function vehicleQuery(cust_id, tree_path, is_depart) {
    // var mode = "current"; //all
    // var page_no = 1;
    // var page_count = 1000;
    var key = '';
    if ($("#vehicleKey").val() !== '') {
        key = $("#vehicleKey").val().trim();
    }
    //
    // var searchUrl = $.cookie('Host') + "customer/" + cust_id + "/vehicle/search";
    // var searchData = { auth_code:auth_code, tree_path:tree_path, mode:mode, page_no:page_no, page_count:page_count, key:key };
    // var searchObj = { type:"GET", url:searchUrl, data:searchData, success:function (json) {
    //     vehicleQuerySuccess(json);
    // }, error:OnError };
    // ajax_function(searchObj);
    var query_json;
    if (key !== "") {
        var searchType = $('#searchType').val();
        if (is_depart) {
            query_json = {
                departId: cust_id
            };
            query_json[searchType] = '^' + key;
        } else if ($('#allNode').is(':checked')) {
            query_json = {
                treePath: '^' + tree_path
            };
            setLoading("vehicle_list");
            wistorm_api._list('customer', query_json, 'uid', 'uid', '-createdAt', 0, 0, 1, -1, auth_code, true, function (json) {
                var uids = [];
                uids.push(uid.toString());
                for (var i = 0; i < json.data.length; i++) {
                    uids.push(json.data[i].uid);
                }
                query_json = {
                    uid: uids.join('|')
                };
                query_json[searchType] = '^' + key;
                wistorm_api._listPost('vehicle', query_json, 'objectId,uid,name,model,did,sim,serviceRegDate,serviceExpireIn,contact,tel', '-createdAt', '-createdAt', 0, 0, 1, -1, auth_code, true, vehicleQuerySuccess)
            });
        } else {
            query_json = {
                uid: cust_id
            };
            query_json[searchType] = '^' + key;
            if (['9', '12', '13'].indexOf(dealer_type) > -1) {
                query_json['departId'] = login_depart_id;
            }
        }
    } else {
        if (is_depart) {
            query_json = {
                departId: cust_id
            };
        } else {
            query_json = {
                uid: cust_id
            };
            if (['9', '12', '13'].indexOf(dealer_type) > -1) {
                query_json['departId'] = login_depart_id;
            }
        }
    }
    setLoading("vehicle_list");
    wistorm_api._list('vehicle', query_json, 'objectId,departId,name,model,did,sim,serviceRegDate,serviceExpireIn,contact,tel', '-createdAt', '-createdAt', 0, 0, 1, -1, auth_code, true, vehicleQuerySuccess)

    wistorm_api._list('department', { uid: cust_id }, '', '-createdAt', '-createdAt', 0, 0, 1, -1, auth_code, true, function (json) {
        var departmentData = {};
        if (json.total) {
            json.data.forEach(ele => {
                departmentData[ele.objectId] = ele.name;
            })
        }
        exportCustomer('vehicle', query_json, departmentData)
        // console.log(departmentData)
        // console.log(json,'department',cust_id)
    })

}

var exportData;
var exportCustomer = function (tableName, query_json, departEnum) {
    var query = query_json;

    Object.assign(departEnum, oDepartmentData, { 'undefined': '' }, { '': '', 'null': '' })
    var departString = 'enum' + JSON.stringify(departEnum);

    var typeChangeFn = function () {
        if (typeof v == 'undefined' || typeof v == 'object' || typeof v == 'boolean') {
            return ''
        } else if (typeof v == 'string' || typeof v == 'number') {
            return v
        } else {
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


    // var exportObj = {
    //     map: 'BAIDU',
    //     fields: ["name", "departId", "objectType", "model", "sim", "contact", "tel", "serviceExpireIn", "remark", "did", "insuranceExpireIn", "maintainExpireIn", "inspectExpireIn", "maintainMileage"],
    //     titles: ['目标名称', '所属部门', "目标类型", "目标型号", "SIM卡号", "联系人", "联系电话", "到期时间", "备注", "终端ID", "保养到期日", "年检到期日", "保险到期日", "保养里程"],
    //     displays: ["s", departString, 's', 's', "s", "s", "s", 'd', "s", "s", "d", "d", "d", "s"]
    // };
    // var titles = ['目标名称', '所属部门', "目标类型", "目标型号", "SIM卡号", "联系人", "联系电话", "到期时间", "备注", "终端ID", "保养到期日", "年检到期日", "保险到期日", "保养里程"];
    // var exportObj = {
    //     map: 'BAIDU',
    //     fields: ["name", "departId", "objectType", "model", "sim", "contact", "tel", "serviceExpireIn", "remark", "did", "insuranceExpireIn", "maintainExpireIn", "inspectExpireIn", "maintainMileage"],
    //     titles: [i18next.t('vehicle.name'), i18next.t('system.depart'), i18next.t('vehicle.objectType'), i18next.t('vehicle.model'), i18next.t('vehicle.sim'), i18next.t('vehicle.contact'), i18next.t('vehicle.tel'), i18next.t('vehicle.end_date'), i18next.t('vehicle.remark'), i18next.t('device.id'), i18next.t('vehicle.insuranceExpireIn'), i18next.t('vehicle.maintainExpireIn'), i18next.t('vehicle.inspectExpireIn'), i18next.t('vehicle.maintainMileage')],
    //     displays: [typeChangeFn.toString(), departString, typeChangeFn.toString(), typeChangeFn.toString(), typeChangeFn.toString(), typeChangeFn.toString(), typeChangeFn.toString(), 'd', typeChangeFn.toString(), typeChangeFn.toString(), dateFn.toString(), dateFn.toString(), dateFn.toString(), typeChangeFn.toString()]
    // };
    var exportObj = {
        map: 'BAIDU',
        fields: ["name", "departId", "objectType", "model", "sim", "contact", "tel", "serviceExpireIn", "remark", "did", "insuranceExpireIn", "maintainExpireIn", "inspectExpireIn", "maintainMileage"],
        titles: [i18next.t('vehicle.name'), i18next.t('system.depart'), i18next.t('vehicle.objectType'), i18next.t('vehicle.model'), i18next.t('vehicle.sim'), i18next.t('vehicle.contact'), i18next.t('vehicle.tel'), i18next.t('vehicle.end_date'), i18next.t('vehicle.remark'), i18next.t('device.id'), i18next.t('vehicle.insuranceExpireIn'), i18next.t('vehicle.maintainExpireIn'), i18next.t('vehicle.inspectExpireIn'), i18next.t('vehicle.maintainMileage')],
        displays: [typeChangeFn.toString(), departString, typeChangeFn.toString(), typeChangeFn.toString(), typeChangeFn.toString(), typeChangeFn.toString(), typeChangeFn.toString(), typeChangeFn.toString(), typeChangeFn.toString(), typeChangeFn.toString(), typeChangeFn.toString(), typeChangeFn.toString(), typeChangeFn.toString(), typeChangeFn.toString()]
    };
    console.log(exportObj)
    // t
    // "s", typeChangeFn.toString(), typeChangeFn.toString(), typeChangeFn.toString(), typeChangeFn.toString(), typeChangeFn.toString(), typeChangeFn.toString(), 'd', typeChangeFn.toString(), typeChangeFn.toString(), dateFn.toString(), dateFn.toString(), dateFn.toString(), typeChangeFn.toString()
    // for (var i = 0; i < (exportObj.displays.length = 14); i++) {
    //     if (i == 7 || i == 10 || i == 11 || i == 12) {
    //         exportObj.displays[i] = dateFn.toString();
    //     } else {
    //         exportObj.displays[i] = typeChangeFn.toString()
    //     }
    // }
    // var exportObj = {
    //     map: 'BAIDU',
    //     fields: ["name", "model", "sim"],
    //     titles: ['目标名称', '目标型号', "SIM卡号"],
    //     displays: ["s", "s", typeChangeFn.toString()]
    // };
    // debugger;
    // exportUrl = wistorm_api._exportUrl(tableName, query, exportObj.fields.join(','), exportObj.titles.join(','), exportObj.displays.join('#'), '-createdAt', '-createdAt', exportObj.map || 'BAIDU', auth_code);
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




var names = [];

var vehicleQuerySuccess = function (json) {
    if (json.total) {
        $('#export').show()
    } else {
        $('#export').hide()
    }


    var j, _j, UnContacter, Uncontacter_tel;
    names = [];
    // if(json.status_code === 0 && selectNode && selectNode.id !== $.cookie('dealer_id')){
    //     var treeObj = $.fn.zTree.getZTreeObj("customerTree");
    //     selectNode.name = selectNode._name + '(' + selectNode.childCount + '/' + json.total + ')';
    //     treeObj.updateNode(selectNode);
    // }
    for (var i = 0; i < json.data.length; i++) {
        oDepartmentData[json.data[i].departId] = json.data[i].departId
        json.data[i].serviceRegDate = NewDate(json.data[i].serviceRegDate);
        json.data[i].serviceRegDate = json.data[i].serviceRegDate.format("yyyy-MM-dd");
        json.data[i].serviceExpireIn = NewDate(json.data[i].serviceExpireIn);
        json.data[i].serviceExpireIn = json.data[i].serviceExpireIn.format("yyyy-MM-dd");
        json.data[i].sim = json.data[i].sim || '';
        json.data[i].contact = json.data[i].contact || '';
        json.data[i].tel = json.data[i].tel || '';
        names.push(json.data[i].name);
    }

    var _columns = [
        {
            "mData": null, "sClass": "center", "bSortable": false, "fnRender": function (obj) {
                return "<input type='checkbox' value='" + obj.aData.objectId + "'>";
            }
        },
        { "mData": "name", "sClass": "ms_left" },
        { "mData": "did", "sClass": "center" },
        // { "mData":"serial", "sClass":"center" },
        { "mData": "sim", "sClass": "center" },
        { "mData": "contact", "sClass": "center" },
        { "mData": "tel", "sClass": "center" },
        { "mData": "serviceRegDate", "sClass": "center" },
        { "mData": "serviceExpireIn", "sClass": "center" },
        {
            "mData": null, "sClass": "center", "bSortable": false, "fnRender": function (obj) {
                return "<a href='#' title='编辑' data-i18n='[title]table.edit'><i class='icon-edit' obj_id='" + obj.aData.objectId + "' did='" + obj.aData.did + "'></i></a>&nbsp&nbsp<a href='#' title='更换用户' data-i18n='[title]vehicle.change_parent'><i class='icon-retweet' obj_id='" + obj.aData.objectId + "' obj_name='" + obj.aData.name + "' did='" + obj.aData.did + "'></i></a>&nbsp&nbsp<a href='#' title='删除' data-i18n='[title]table.delete'><i class='icon-remove' obj_id='" +
                    obj.aData.objectId + "' obj_name='" + obj.aData.name + "' did='" + obj.aData.did + "'></i></a>";
            }
        }
    ];
    var lang = i18next.language || 'en';
    var objTable = {
        "bInfo": false,
        "bLengthChange": false,
        "bProcessing": true,
        "bServerSide": false,
        "bFilter": false,
        "aaData": json.data,
        "aoColumns": _columns,
        "sDom": "<'row'r>t<'row'<'pull-right'p>>",
        "sPaginationType": "bootstrap",
        "oLanguage": { "sUrl": 'css/' + lang + '.txt' }
    };
    //$('#vehicleKey').typeahead({source:names});

    $('#vehicleKey').typeahead({
        source: function (query, process) {
            process(names);
        }
    });

    if (vehicle_table) {
        vehicle_table.fnClearTable();
        vehicle_table.fnAddData(json.data);
    } else {
        vehicle_table = $("#vehicle_list").dataTable(objTable);
        windowResize();
    }

    if ($("#vehicleKey").val() !== '' && json.data.length === 1) {
        var treeObj = $.fn.zTree.getZTreeObj("customerTree");
        var node = treeObj.getNodeByParam("id", json.data[0].uid, null);
        cust_name = node ? node.name : '';
        $('#selCustName').html(cust_name);
        treeObj.selectNode(node);
    }
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

var updateDevice = function (did, update, callback) {
    var query = {
        did: did
    };
    wistorm_api._update('_iotDevice', query, update, auth_code, true, function (obj) {
        return callback(obj);
    });
};

// 新增目标
var vehicleAdd = function () {
    if (doing) {
        return;
    }
    doing = true;
    if (uid === 0) {
        _alert(i18next.t("system.select_customer"));
        return;
    }
    var obj_name = $('#obj_name').val();   //车牌号码
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
    var contact = $('#contact').val();
    var tel = $('#tel').val();
    var remark = $('#remark').val();

    var objectType = $('#objectType').val();
    var fuelTankCapacity = $('#fuelTankCapacity').val() || 0;
    var insuranceExpireIn = $('#insuranceExpireIn').val();
    var maintainExpireIn = $('#maintainExpireIn').val();
    var inspectExpireIn = $('#inspectExpireIn').val();
    var maintainMileage = $('#maintainMileage').val();

    var sim_type = 1;                      //SIM卡类型，保留
    var mobile_operator = "";              //运营商，保留
    var op_mobile = "";                    //主号，当前手机号，保留
    var op_mobile2 = "";                   //副号，当前手机号，保留
    var brand = 1;                         //只针对手机客户端，目标品牌  通过字典表获取dict_type=brand
    var mdt_type = 0;                      //保留
    var call_phones =
        [
            {
                obj_model: $('#obj_model').val(),
                manager: $('#manager').val(),
                driver: $('#driver').val(),
                phone: $('#phone').val(),
                phone1: $("#phone1").val(),
                obj_model: $("#obj_model").val()
            }                   //只针对手机客户端，用于一键呼叫
        ];
    var sms_phones = [];                   //只针对手机客户端，暂时保留
    var obj_model = $('#obj_model').val();

    var now = new Date();
    var create_json = {
        name: obj_name,
        model: obj_model,
        did: device_id.trim(),
        sim: sim,
        uid: uid,
        departId: assignDepartId || '',
        contact: contact,
        tel: tel,
        remark: remark,
        serviceRegDate: now.format('yyyy-MM-dd hh:mm:ss'),
        serviceExpireIn: new Date(now.setFullYear(now.getFullYear() + 1)).format('yyyy-MM-dd hh:mm:ss'),
        brand: '',
        battery: '',
        color: '',
        objectType: objectType,
        fuelTankCapacity: fuelTankCapacity
    };
    if (insuranceExpireIn) {
        create_json.insuranceExpireIn = insuranceExpireIn;
    }
    if (maintainExpireIn) {
        create_json.maintainExpireIn = maintainExpireIn;
    }
    if (inspectExpireIn) {
        create_json.inspectExpireIn = maintainExpireIn;
    }
    if (maintainMileage) {
        create_json.maintainMileage = maintainMileage;
    }
    wistorm_api._create('vehicle', create_json, auth_code, true, function (json) {
        if (json.status_code === 0) {
            // 更新设置的vehicleId和vehicleName
            var uids = uid;
            if (tree_path != '') {
                uids = tree_path.split(',').filter(function (item) { return item !== '' });
            }
            var alertOptions = [];
            $.each($('input[name="alert"]:checked'), function () {
                alertOptions.push($(this).val())
            })
            var update = {
                vehicleId: json.objectId,
                vehicleName: obj_name,
                binded: true,
                bindDate: now.format('yyyy-MM-dd hh:mm:ss'),
                uid: uids,
                objectType: objectType,
                "params.alertOptions": alertOptions
            };
            updateDevice(device_id, update, function (dev) {
                if (dev.status_code === 0) {
                    wistorm_api.setCache(device_id + '.alertOptions', alertOptions, function (res) {
                        console.log(res)
                    });
                } else {
                    console.log('Update device fail, please try again');
                }
                $("#divVehicle").dialog("close");
                doing = false;
                // 更新用户目标数
                updateVehicleCount(uid.toString());
                vehicleQuery(uid, tree_path, is_depart);
            });
        } else {
            doing = false;
            _alert(i18next.t("vehicle.msg_add_fail"));
        }
    });
};

// var vehicleAddSuccess = function(json) {
//     if(json.status_code == 0){
//         $("#divVehicle").dialog("close");
//         vehicleQuery(uid, tree_path);
//         // 更新设置的vehicleId和vehicleName
//         var update = {
//             vehicleId: json.objectId,
//             vehicleName: plate
//         };
//         owner.updateDevice(did, update, function(dev){
//             if(dev.status_code == 0){
//             }else{
//                 console.log('更新设备信息失败，请稍后重试');
//             }
//         });
//     }else{
//         alert("新增目标失败，请稍后再试");
//     }
// };

// 修改目标
var vehicleEdit = function () {
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
    var contact = $('#contact').val();
    var tel = $('#tel').val();
    var remark = $('#remark').val();

    var inspectExpireIn = $('#inspectExpireIn').val();
    var maintainMileage = $('#maintainMileage').val();
    var maintainExpireIn = $('#maintainExpireIn').val();
    var insuranceExpireIn = $('#insuranceExpireIn').val();
    var objectType = $('#objectType').val();
    var fuelTankCapacity = $('#fuelTankCapacity').val() || 0;

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
        departId: assignDepartId || '',
        name: obj_name,
        model: obj_model,
        did: device_id.trim(),
        sim: sim,
        contact: contact,
        tel: tel,
        remark: remark,
        maintainMileage: maintainMileage,
        objectType: objectType,
        fuelTankCapacity: fuelTankCapacity
    };
    if (insuranceExpireIn) {
        update_json.insuranceExpireIn = insuranceExpireIn;
    }
    if (maintainExpireIn) {
        update_json.maintainExpireIn = maintainExpireIn;
    }
    if (inspectExpireIn) {
        update_json.inspectExpireIn = maintainExpireIn;
    }
    if (maintainMileage) {
        update_json.maintainMileage = maintainMileage;
    }
    wistorm_api._update('vehicle', query_json, update_json, auth_code, true, function (json) {
        if (json.status_code == 0) {
            $("#divVehicle").dialog("close");
            vehicleQuery(uid, tree_path, is_depart);
            if (did !== device_id) {
                // 解绑原有的终端ID
                var update = {
                    vehicleId: '',
                    vehicleName: '',
                    binded: false,
                    uid: '-' + uid
                };
                updateDevice(did, update, function (dev) {
                    if (dev.status_code == 0) {
                    } else {
                        console.log('Unbind device fail, pls try again');
                    }
                });
            }
            var uids = uid;
            tree_path = tree_path || '';
            if (tree_path !== '') {
                uids = tree_path.split(',').filter(function (item) { return item !== '' });
            }
            // 更新设置的vehicleId和vehicleName
            var alertOptions = [];
            $.each($('input[name="alert"]:checked'), function () {
                alertOptions.push($(this).val())
            })
            var now = new Date();
            var update = {
                vehicleId: obj_id,
                vehicleName: obj_name,
                binded: true,
                bindDate: now.format('yyyy-MM-dd hh:mm:ss'),
                uid: uids,
                objectType: objectType,
                "params.alertOptions": alertOptions
            };
            updateDevice(device_id, update, function (dev) {
                if (dev.status_code === 0) {
                    wistorm_api.setCache(device_id + '.alertOptions', alertOptions, function (res) {
                        console.log(res)
                    });
                } else {
                    console.log('Update device fail, please try again');
                }
            });
        } else {
            _alert(i18next.t("device.msg_save_fail"));
        }
    });
};

// var vehicleEditSuccess = function(json) {
//     if(json.status_code == 0){
//         $("#divVehicle").dialog("close");
//         vehicleQuery(uid, tree_path);
//     }else{
//         alert("修改目标失败，请稍后再试");
//     }
// };

// 删除目标
var vehicleDelete = function (obj_id, device_id) {
    // var auth_code = $.cookie('auth_code');
    //
    // var sendUrl = $.cookie('Host') + "vehicle/" + obj_id + "?access_token=" + auth_code;
    // var sendData = {
    //     cust_id: cust_id
    // };
    // var sendObj = { type:"DELETE", url:sendUrl, data:sendData, success:function (json) {
    //     vehicleDeleteSuccess(json);
    // }, error:OnError };
    // ajax_function(sendObj);
    var query_json = {
        objectId: obj_id
    };
    wistorm_api._delete('vehicle', query_json, auth_code, true, function (json) {
        if (json.status_code == 0) {
            // 更新设置的vehicleId和vehicleName
            var update = {
                vehicleId: '',
                vehicleName: '',
                binded: false,
                uid: '-' + uid
            };
            updateDevice(device_id, update, function (dev) {
                if (dev.status_code == 0) {
                } else {
                    console.log('Update device fail, please try again');
                }
            });
            // 更新用户目标数
            updateVehicleCount(uid.toString());
            vehicleQuery(uid, tree_path, is_depart);
        } else {
            _alert(i18next.t("vehicle.msg_delete_fail"));
        }
    });
};

// var vehicleDeleteSuccess = function(json) {
//     if(json.status_code == 0){
//         vehicleQuery(uid, tree_path);
//         // 更新设置的vehicleId和vehicleName
//     }else{
//         _alert("删除目标失败，请稍后再试");
//     }
// };

// 目标更换所属用户
var vehicleChangeCustomer = function (obj_id, change_cust_id, device_id) {
    var query_json = {
        objectId: obj_id
    };
    var update_json = {
        uid: change_cust_id
    };
    wistorm_api._update('vehicle', query_json, update_json, auth_code, true, function (json) {
        if (json.status_code === 0) {
            // 更新设置的vehicleId和vehicleName
            var uids = uid;
            if (assignTreePath !== '') {
                uids = assignTreePath.split(',').filter(function (item) { return item !== '' });
            }
            var update = {
                uid: uids
            };
            updateDevice(device_id, update, function (dev) {
                $("#divCustomerAssign").dialog("close");
                if (dev.status_code === 0) {
                    vehicleQuery(uid, tree_path, is_depart);
                } else {
                    // _alert('更新设备所属失败');
                }
                // 更新用户目标数
                updateVehicleCount(uid.toString());
                updateVehicleCount(assignUid.toString());
                vehicleQuery(uid, tree_path, is_depart);
            });
        } else {
            _alert(i18next.t("vehicle.err_change_parent"));
        }
    });
};

// var vehicleChangeCustomerSuccess = function(json) {
//     if(json.status_code == 0){
//         $("#divCustomerAssign").dialog("close");
//         vehicleQuery(uid, tree_path);
//     }else{
//         _alert("更换目标所属用户失败，请稍后再试");
//     }
// };


var accountAmount = function (callback) {
    var query = {
        objectId: $.cookie('dealer_id')
    }
    wistorm_api.get(query, '', auth_code, function (user) {
        callback(user)
    })
}








$(document).ready(function () {
    $("#alert").hide();

    windowResize();
    $(window).resize(function () {
        windowResize();
    });

    var id = setInterval(function () {
        var dateOption = {
            language: $.cookie("lang"),
            weekStart: 1,
            todayBtn: 1,
            autoclose: 1,
            todayHighlight: 1,
            startView: 2,
            forceParse: 0,
            showMeridian: 1,
            minView: 2
        }
        $('.insuranceExpireIn').datetimepicker(dateOption);
        $('#insuranceExpireIn').val(new Date().format('yyyy-MM-dd'));
        $('.maintainExpireIn').datetimepicker(dateOption);
        $('#maintainExpireIn').val(new Date().format('yyyy-MM-dd'));
        $('.inspectExpireIn').datetimepicker(dateOption);
        $('#inspectExpireIn').val(new Date().format('yyyy-MM-dd'));

        if (!i18nextLoaded) {
            return;
        }
        cust_typeObj = {
            2: i18next.t('system.dealer'),
            7: i18next.t('system.personal'),
            8: i18next.t('system.company')
        }

        $(document).on("click", "#vehicle_list .icon-remove", function () {
            obj_id = parseInt($(this).attr("obj_id"));
            obj_name = $(this).attr("obj_name");
            did = $(this).attr("did");
            if (CloseConfirm(i18next.t("vehicle.msg_confirm_delete", { name: obj_name }))) {
                vehicleDelete(obj_id, did);
            }
        });

        $(document).on("click", "#vehicle_list .icon-edit", function () {
            obj_id = parseInt($(this).attr("obj_id"));
            did = $(this).attr("did");
            vehicleInfo(obj_id);
        });


        $(document).on("click", "#vehicle_list .icon-list-alt", function () {
            device_id = $(this).attr("device_id");
            logInfo(device_id);
        });

        $(document).on("click", "#vehicle_list .icon-retweet", function () {
            obj_id = parseInt($(this).attr("obj_id"));
            obj_name = $(this).attr("obj_name");
            did = $(this).attr("did");
            changeType = 2;
            var title = i18next.t("vehicle.change_parent");
            $("#divCustomerAssign").dialog("option", "title", title);
            $("#divCustomerAssign").dialog("open");
        });


        $(document).on("click", "#Menu1 .mretweet", function () {
            cust_id = $.cookie('rightId')
            cust_name = $.cookie('rightName');
            tree_path = $.cookie('rightTree_path');
            uid = $.cookie('rightPUid');
            changeType = 1;
            var title = i18next.t("customer.change_parent");
            $("#divCustomerAssign").dialog("option", "title", title);
            $("#divCustomerAssign").dialog("open");
        });

        $(document).on("click", "#Menu1 .medit", function () {
            cust_id = $.cookie('rightId')
            customerInfo(cust_id);
            initRole();
        });



        $("#changeParent").click(function () {
            changeType = 2;
            var ids = $("[type='checkbox']:checked:not(#checkAll)");
            if (ids.length === 0) {
                _alert(i18next.t("system.select_vehicle"));
                return;
            }
            obj_id = [];
            for (var i = 0; i < ids.length; i++) {
                obj_id.push($(ids[i]).val());
            }
            obj_id = obj_id.join("|");
            obj_name = i18next.t("vehicle.selected_vehicle", { count: ids.length });
            var title = i18next.t("vehicle.change_parent");
            $("#divCustomerAssign").dialog("option", "title", title);
            $("#divCustomerAssign").dialog("open");
        });

        //$(document).on("dblclick", "#customer_list li", function () {
        //    // 获取客户信息
        //    cust_id = parseInt($(this).attr("cust_id"));
        //    customerInfo(cust_id);
        //});

        $("#searchCustomer").click(function () {
            // customerQuery();
            var treeObj = $.fn.zTree.getZTreeObj("customerTree");
            var node = treeObj.getNodeByParam("name", $('#customerKey').val(), null);
            treeObj.selectNode(node);
            $('#selCustName').html(node.name);
            vehicleQuery(node.id, '', is_depart);
        });

        $("#checkAll").click(function () {
            //alert($('#checkAll').prop("checked"));
            $("[type='checkbox'][id!=allNode]").prop("checked", $('#checkAll').prop("checked"));//全选
        });

        $("#searchVehicle").click(function () {
            vehicleQuery(uid, tree_path, is_depart);
        });

        $('#searchKey').keydown(function (e) {
            var curKey = e.which;
            if (curKey == 13) {
                customerQuery();
                return false;
            }
        });

        $('#vehicleKey').keydown(function (e) {
            var curKey = e.which;
            if (curKey == 13) {
                vehicleQuery(uid, tree_path, is_depart);
                return false;
            }
        });

        $("#bind").click(function () {
            var device_id = $('#device_id').val();     //终端ID
            var obj_name = $('#obj_name').val();   //车牌号码
            var query_json = {
                objectId: obj_id
            };
            var update_json = {
                did: device_id.trim()
            };
            wistorm_api._update('vehicle', query_json, update_json, auth_code, true, function (json) {
                if (json.status_code == 0) {
                    var uids = uid;
                    if (tree_path != '') {
                        uids = tree_path.split(',').filter(function (item) { return item !== '' });
                    }
                    // 更新设置的vehicleId和vehicleName
                    var now = new Date();
                    var update = {
                        vehicleId: obj_id,
                        vehicleName: obj_name,
                        binded: true,
                        bindDate: now.format('yyyy-MM-dd hh:mm:ss'),
                        uid: uids
                    };
                    updateDevice(device_id, update, function (dev) {
                        if (dev.status_code == 0) {
                            _ok(i18next.t("vehicle.msg_bind_success"));
                            $('#device_id').attr("disabled", "disabled");
                            $('#bind').css("display", "none");
                            $('#unbind').css("display", "inline-block");
                            vehicleQuery(uid, tree_path, is_depart);
                        } else {
                            _alert(i18next.t("vehicle.msg_bind_fail"), 2);
                        }
                    });
                } else {
                    _alert(i18next.t("vehicle.msg_bind_fail"), 2);
                }
            });
        });

        $("#unbind").click(function () {
            if (!CloseConfirm(i18next.t("vehicle.msg_confirm_unbind"))) {
                return;
            }
            var device_id = $('#device_id').val();     //终端ID
            var query_json = {
                objectId: obj_id
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
                        binded: false,
                        uid: '-' + uid
                    };
                    updateDevice(device_id, update, function (dev) {
                        if (dev.status_code == 0) {
                            _ok(i18next.t("vehicle.msg_unbind_success"));
                            $('#device_id').val('');
                            $('#device_id').removeAttr("disabled");
                            $('#bind').css("display", "inline-block");
                            $('#unbind').css("display", "none");
                            vehicleQuery(uid, tree_path, is_depart);
                        } else {
                            _alert(i18next.t("vehicle.msg_unbind_fail"), 2);
                        }
                    });
                } else {
                    _alert(i18next.t("vehicle.msg_unbind_fail"), 2);
                }
            });
        });

        $("#addVehicle").click(function () {
            if (uid == 0) {
                _alert(i18next.t("system.select_customer"));
                return;
            }
            deviceInfo();
            showCustomerInfo(uid);
            var service_end_date = new Date();
            service_end_date = new Date(Date.parse(service_end_date) + (86400000 * 31));
            service_end_date = service_end_date.format("yyyy-MM-dd");
            var title = i18next.t("vehicle.add_vehicle", { cust_name: cust_name });
            initFrmVehicle(title, 1, "", "", "", "", "", "", "", "", service_end_date);
            validator_vehicle.resetForm();
            $("#divVehicle").dialog("open");
        });


        $('#renew').click(function () {
            var ids = $("#vehicle_list [type='checkbox']:checked:not(#checkAll)");
            // if (ids.length === 0) {
            //     _alert(i18next.t("system.select_vehicle"));
            //     return;
            // }
            var obj_id = [];
            for (var i = 0; i < ids.length; i++) {
                obj_id.push($(ids[i]).parent().next().next().text());
            }
            $('#feeNum').val(1)
            $('#feeDevice').val(obj_id.join('\r'));
            feeChange()
            // $('#feeCount').text('终端数量' + obj_id.length)
            // console.log(obj_id)
            $('#divRenew').dialog('open');
        });

        $('#csvfile').change(function () {
            $("input[name=csvfile]").csv2arr(function (arr) {
                console.log(arr);
                //something to do here
                var str = '';
                $.each(arr, function (i, line) {
                    str += line.join(',') + '\r';
                });
                // $("#devices").val(str);
                $('#feeDevice').val(str)
                feeChange(true)
            });
        });

        var feeChange = function (isDevice) {
            var pay_count = parseFloat($('#feeNum').val());
            var pay_type = $('#feeType').val();
            var monthFee = parseFloat($('#parent_month_fee').text());
            var yearFee = parseFloat($('#parent_year_fee').text());
            var allFee = 0;
            if (isNaN(pay_count)) {
                _alert('请输入正确的数字！');
                return false;
            }
            var devices = $('#feeDevice').val().split(/\s+/);
            devices = devices.filter(ele => ele !== '');
            if (isDevice) {
                var query_json = {
                    uid: $.cookie('dealer_id')
                }
                wistorm_api._list('_iotDevice', query_json, '', 'createdAt', 'createdAt', 0, 0, 1, -1, auth_code, true, function (res) {
                    if (res.status_code == 0) {
                        var obj = {};
                        devices.forEach(e => {
                            res.data.forEach(ele => {
                                if (!obj[e]) {
                                    if (e == ele.did) {
                                        obj[e] = true
                                    }
                                }
                            })
                        })
                        var newDevice = [];
                        for (var o in obj) {
                            newDevice.push(o);
                        }
                        if (newDevice.length > 100) {
                            _alert('终端数量超过限制，每次批量续费最多只能续100个');
                            newDevice = newDevice.splice(0, 100);
                            $('#feeDevice').val(newDevice.join('\r'));
                            feeChange()
                            return;
                        }
                        if (pay_type == 1) {
                            allFee = pay_count * yearFee * newDevice.length;
                        } else if (pay_type == 2) {
                            allFee = pay_count * monthFee * newDevice.length;
                        }
                        $('#feeNeed').text(allFee)

                        $('#feeDevice').val(newDevice.join('\r'));
                        var remarkVal = newDevice.join(',');
                        remarkVal += ` - ${pay_count}${pay_type == 1 ? '年' : '月'}服务费`;
                        $('#feeCount').text('终端数量' + newDevice.length)
                        $('#feeRemark').val(remarkVal)
                    }
                })
            } else {
                if (pay_type == 1) {
                    allFee += pay_count * yearFee * devices.length;
                } else if (pay_type == 2) {
                    allFee += pay_count * monthFee * devices.length;
                }
                console.log(allFee)
                $('#feeNeed').text(allFee)
                var remarkVal = devices.join(',');
                remarkVal += ` - ${pay_count}${pay_type == 1 ? '年' : '月'}服务费`;
                $('#feeCount').text('终端数量' + devices.length)
                $('#feeRemark').val(remarkVal)
            }

        }


        $('#feeType').on('change', function () {
            feeChange()
        });
        $('#feeNum').on('change', function () {
            feeChange()
        });
        $('#feeDevice').on('change', function () {
            feeChange(true)
        })



        var buttons = {};
        buttons[i18next.t("system.save")] = function () {
            $('#frmCustomerList').submit();
        };
        buttons[i18next.t("system.cancel")] = function () {
            $(this).dialog("close");
        };
        // 更换所属用户窗口
        $('#divCustomerList').dialog({
            autoOpen: false,
            width: 650,
            buttons: buttons
        });

        $('#frmCustomerList').submit(function () {
            var obj_id = parseInt($("#change_obj_id").val());
            var cust_id = parseInt($("#change_cust_id").val());
            var did = $("#change_did").val();
            vehicleChangeCustomer(obj_id, cust_id, did);
            return false;
        });

        var buttons = {};
        buttons[i18next.t("system.save")] = function () {
            $('#frmVehicle').submit();
        };
        buttons[i18next.t("system.cancel")] = function () {
            validator_vehicle.resetForm();
            $(this).dialog("close");
        };
        // Dialog Simple
        $('#divVehicle').dialog({
            autoOpen: false,
            width: 650,
            buttons: buttons
        });

        $('#frmVehicle').submit(function () {
            if ($('#frmVehicle').valid()) {
                if (vehicle_flag == 1) {
                    vehicleAdd();
                } else {
                    vehicleEdit();
                }
            }
            return false;
        });

        var buttons = {};
        buttons[i18next.t("system.change")] = function () {
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
            if (changeType == 2) {
                var msg = i18next.t("vehicle.msg_change_parent", { name: obj_name, assignName: assignName }); // '你确定将目标[' + obj_name + ']的用户更换为[' + assignName + ']吗?';
                if (assignUid === $.cookie('dealer_id')) {
                    msg = i18next.t("vehicle.msg_restore_parent", { name: obj_name }); // '你确定将目标[' + obj_name + ']恢复到上级用户进行管理吗?';
                }
                if (CloseConfirm(msg)) {
                    vehicleChangeCustomer(obj_id, assignUid, did);
                }
                return false;
            } else {
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
            }

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











        var buttons = {};
        buttons[i18next.t("system.select")] = function () {
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
            $('#depart_name').val(assignDepartName);
            $("#divDepartAssign").dialog("close");
            return false;
        });

        $("#selectDepart").click(function () {
            var title = i18next.t("system.depart");
            $("#divDepartAssign").dialog("option", "title", title);
            $("#divDepartAssign").dialog("open");
        });



        $('#sendMessage').click(function () {
            $("#divVehicleMessage").dialog("option", "title", i18next.t("setting.textMessage"));
            $("#divVehicleMessage").dialog("open");
        })

        var buttons = {};
        buttons[i18next.t("system.save")] = function () {
            // $('#frmDepartAssign').submit();
            // alert('1')
            var ids = $("[type='checkbox']:checked:not(#checkAll)");
            if (ids.length === 0) {
                _alert(i18next.t("system.select_vehicle"));
                return;
            }
            var obj_id = [];
            for (var i = 0; i < ids.length; i++) {
                obj_id.push($(ids[i]).parent().next().next().text());
            }
            console.log(obj_id)
            var message = $('#textMessage').val();
            if (message) {
                wistorm_api.createCommand(obj_id.join('|'), IOT_CMD.TEXT_MESSAGE, {
                    flag: 1,
                    message: '0x' + utfToGBK(message)
                }, 0, i18next.t("setting.textMessage"), auth_code, function (obj) {
                    console.log(obj)
                    if (obj.status_code == 0) {
                        _alert(i18next.t("setting.flag_success"))
                        $("#divVehicleMessage").dialog("close");
                    } else if (obj.status_code == 36874) {
                        _alert(i18next.t("setting.msg_send_fail"))
                    }
                })
            } else {
                _alert(i18next.t("setting.input_message"))
            }

        };
        buttons[i18next.t("system.cancel")] = function () {
            $(this).dialog("close");
        };
        $('#divVehicleMessage').dialog({
            autoOpen: false,
            width: 480,
            buttons: buttons
        });


        buttons = {};
        buttons['确定'] = function () {
            var _uid = $.cookie('dealer_id');
            var pay_count = parseInt($('#feeNum').val());
            var pay_type = $('#feeType').val();
            var attach = $('#feeDevice').val().split(/\s+/).join(',');
            var remark = $('#feeRemark').val();
            var needMoney = parseFloat($('#feeNeed').text());
            if (watchBalance) {
                clearInterval(watchBalance)
            }
            if (isNaN(pay_count)) {
                _alert('请输入正确的数字');
                return false;
            }
            var setFlag = 0;
            var isrecharge = function () {
                accountAmount(function (res) {
                    if (res.status_code == 0 && res.data) {
                        // var balance = res.data.balance - 550 - 0.01;
                        var balance = res.data.balance
                        balance = parseFloat(balance.toFixed(2));
                        var adminUser = $.cookie('adminUser') == 0 ? 829909845607059600 : $.cookie('adminUser');
                        if (balance < needMoney) {
                            if (setFlag == 0) {
                                setFlag++;
                                var amount = needMoney - balance + 0.01;
                                amount = parseFloat(amount.toFixed(2))

                                var _link = 'http://h5.bibibaba.cn/pay/wicare/wxpayv3/index.php?'
                                    + 'total=' + amount
                                    + '&adminUser=' + adminUser
                                    + '&orderType=2'
                                    + '&uid=' + $.cookie('dealer_id')
                                    + '&subject=充值&body=充值&tradeType=NATIVE&productId=chargePC&deviceInfo=WEB';
                                showQRCode(_link, 1);
                                var divText = document.createElement('div');
                                divText.innerText = '您的账号余额不足以支持本次续费，需充值';
                                divText.style.textAlign = 'center';
                                divText.style.color = 'red';
                                divText.style.fontSize = '14px';
                                $(rechargeDiv).append(divText)
                            }
                        } else {
                            wistorm_api.payService(_uid, adminUser, 1, 3, pay_type, pay_count, remark, attach, function (pay) {
                                console.log(pay, 'paystatus')
                                if (pay.status_code == 0) {
                                    $('#divRenew').dialog("close");
                                    _alert('续费成功！')
                                }
                                if (rechargeDiv) {
                                    $(rechargeDiv).remove();
                                }
                                if (watchBalance) {
                                    clearInterval(watchBalance)
                                }
                            })
                        }
                    }

                })
            }
            isrecharge()
            watchBalance = setInterval(isrecharge, 1000);
            // 
        }
        buttons[i18next.t("system.cancel")] = function () {
            $(this).dialog("close");
            if (rechargeDiv) {
                $(rechargeDiv).remove();
            }
            if (watchBalance) {
                clearInterval(watchBalance)
            }
        };
        $('#divRenew').dialog({
            autoOpen: false,
            width: 480,
            title: '续费',
            height: 'auto',
            buttons: buttons
        })

        validator_vehicle = $('#frmVehicle').validate(
            {
                rules: {
                    obj_name: {
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
                                    return 4;
                                },
                                value: function () {
                                    return $('#obj_name').val();
                                },
                                old_value: function () {
                                    return edit_obj_name;
                                }
                            }
                        }
                    },
                    device_id: {
                        minlength: 6,
                        required: true,
                        remote: {
                            url: "exists", //后台处理程序
                            type: "get", //数据发送方式
                            dataType: "json", //接受数据格式
                            data: {
                                auth_code: function () {
                                    return $.cookie('auth_code');
                                },
                                query_type: function () {
                                    return 2;
                                },
                                value: function () {
                                    return $('#device_id').val();
                                },
                                uid: function () {
                                    return $.cookie('dealer_id');
                                }
                            }
                        }
                    },
                    sim: {
                        rangelength: [11, 13],
                        required: true,
                        remote: {
                            url: "exists", //后台处理程序
                            type: "get", //数据发送方式
                            dataType: "json", //接受数据格式
                            data: {
                                auth_code: function () {
                                    return $.cookie('auth_code');
                                },
                                query_type: function () {
                                    return 1;
                                },
                                value: function () {
                                    return $('#sim').val();
                                },
                                old_value: function () {
                                    return edit_sim;
                                }
                            }
                        }
                    }
                },
                messages: {
                    obj_name: { minlength: i18next.t("vehicle.name_minlength"), required: i18next.t("vehicle.name_required"), remote: i18next.t("vehicle.name_remote") },
                    device_id: { minlength: i18next.t("vehicle.id_minlength"), required: i18next.t("vehicle.id_required"), remote: i18next.t("vehicle.id_remote") },
                    sim: { rangelength: i18next.t("vehicle.sim_rangelength"), required: i18next.t("vehicle.sim_required"), remote: i18next.t("vehicle.sim_remote") }
                },
                highlight: function (element) {
                    $(element).closest('.control-group').removeClass('success').addClass('error');
                },

                showErrors: function (errorMap, errorList) {
                    console.log(errorMap, errorList, 'showErrors')
                    if (this.currentElements.length) {
                        if (this.currentElements[0].name == 'device_id') {
                            if (errorMap['device_id']) {
                                $('#bind').attr('disabled', 'disabled')
                            } else {
                                $('#bind').removeAttr('disabled')
                            }
                        }
                    }
                    this.defaultShowErrors();
                },
                errorPlacement: function (error, element) {
                    console.log(error, element, 'errorPlacement', this);
                    if (element.attr("name") == "device_id") {
                        error.insertAfter("#bind");
                    } else {
                        error.insertAfter(element);
                    }
                },
                success: function (element) {
                    element
                        .text('OK!').addClass('valid')
                        .closest('.control-group').removeClass('error').addClass('success');
                    console.log(this, element);
                    // console.log(validator_vehicle)
                },
            });
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
        deviceQuery();
        getAllDepart();
        clearInterval(id);
    }, 100);
});