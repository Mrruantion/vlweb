/**
 * Created with JetBrains WebStorm.
 * User: 1
 * Date: 13-8-26
 * Time: 下午11:33
 * To change this template use File | Settings | File Templates.
 */

var branch_flag = 1;   //1: 新增  2: 修改
var validator_branch;
var vehicle_table;
var branch_id = "";
var branch;
var lon = parseFloat($.cookie("lon")) || 113.84714;
var lat = parseFloat($.cookie("lat")) || 22.67805;
var drawingManager;
var auth_code = $.cookie('auth_code');
var updateTime = new Date(0);
var names = [];
var vehicles = [];
var _vehicles = {};
var _devices = {};
var checkDids = ($.cookie("checkDids") || '').split("|");
var _counts;
var _firstLoad = true;
var _drawing = false;
var map_type = MAP_TYPE_BAIDU;
var map_engine = 'BAIDU';
var status_flag = '';
var uid = 0;
var is_depart = false;
var departs = {};
var dealer_id = $.cookie('dealer_id');
var dealer_type = $.cookie('dealer_type');
var login_depart_id = $.cookie('login_depart_id');
var mapType = $.cookie('map_type');
var typeaheadNameOption = {};  //存储搜索的目标点
var markePois = []; //存储查询节点
var edit_obj_name = '';
var edit_sim = '';
var obj_id = '';
var fuelTankCapacityObj;
var cust_typeObj = {};
var vehicleServiceObj = {};
// var wistorm_api = 

function customerQuery() {
    var dealer_type = $.cookie('dealer_type');
    // var dealer_id = $.cookie('dealer_id');
    var tree_path = $.cookie('tree_path');
    var key = '';
    if ($('#customerKey').val() !== '') {
        key = $('#customerKey').val();
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
    '8': '/img/company_icon.png',
    '99': '/img/depart_icon.png'
};

var _runing = false;

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
        //         if(!_runing){
        //             _runing = true;
        if (treeNode.pId || treeNode.id == dealer_id) {
            uid = treeNode.id;
            is_depart = treeNode.isDepart || false;
            $.cookie('uid', uid);
            cust_name = treeNode.name;
            $('#selCustName').html(cust_name);
            clearVehicles();
            vehicleQuery(treeNode.id, treeNode.isDepart || false);
        }
        // }
    };

    var onCustomerSelectDblClick = function (event, treeId, treeNode) {
        // var treeObj = $.fn.zTree.getZTreeObj("customerTree");
        // if (treeNode.id !== $.cookie('dealer_id')) {
        //     loadSubNode(treeObj, treeNode);
        // }
    };

    var setting = {
        view: { showIcon: true },
        check: { enable: false, chkStyle: "checkbox" },
        data: { simpleData: { enable: true } },
        callback: { onClick: onCustomerSelectClick, onDblClick: onCustomerSelectDblClick }
    };

    var customerArray = [];
    // customerArray.push({
    //     open: true,
    //     id: $.cookie('dealer_id'),
    //     pId: 0,
    //     name: '我的目标',
    //     icon: '/img/customer.png'
    // });
    // uid = $.cookie('dealer_id');
    //
    // if ($.cookie('dealer_type') == 1 || $.cookie('dealer_type') == 11 || $.cookie('dealer_type') == 2) {
    //     customerArray.push({
    //         open: true,
    //         id: '2',
    //         pId: 0,
    //         name: '运营商(用户/目标)',
    //         icon: '/img/customer.png'
    //     });
    // }
    //
    // if ($.cookie('dealer_type') == 1 || $.cookie('dealer_type') == 11 || $.cookie('dealer_type') == 2 || $.cookie('dealer_type') == 8) {
    //     customerArray.push({
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
    // }
    //
    // if ($.cookie('dealer_type') == 7) {
    //     customerArray.push({
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
            pId: json.data[i]['parentId'][0],
            name: json.data[i]['name'] + '(' + childCount + '/' + vehicleCount + ')',
            icon: treeIcon[json.data[i]['custType']]
        });
    }
    $.fn.zTree.init($("#customerTree"), setting, customerArray);

    $('#customerKey').typeahead({ source: names });

    // if (uid > 0) {
    //     var treeObj = $.fn.zTree.getZTreeObj("customerTree");
    //     var node = treeObj.getNodeByParam("id", uid, null);
    //     tree_path = node.treePath;
    //     cust_name = node.name;
    //     $('#selCustName').html(cust_name);
    //     treeObj.selectNode(node);
    //     if (typeof vehicleQuery != "undefined") {
    //         vehicleQuery(uid, "");
    //     }
    // }
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
            if (node) {
                tree_path = node.treePath;
                cust_name = node.name;
                $('#selCustName').html(cust_name);
                treeObj.selectNode(node);
            }
        }
        if (typeof vehicleQuery != "undefined") {
            vehicleQuery(uid, "");
        }
    }
};

function getAllDepart() {
    // var dealer_type = $.cookie('dealer_type');
    // var dealer_id = $.cookie('dealer_id');

    var query_json = {
        uid: dealer_id
    };
    var rootArray = [];

    wistorm_api._list('department', query_json, 'objectId,name,parentId,uid', 'name', 'name', 0, 0, 1, -1, auth_code, true, function (json) {
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
        var treeObj = $.fn.zTree.getZTreeObj("customerTree");
        if (treeObj) {
            var root = treeObj.getNodeByParam("id", dealer_id, null);
            if (root) {
                treeObj.addNodes(root, rootArray);
            }
        }
    });
}

function vehicleService(query_json, callback) {
    vehicleServiceObj = { isbegin: false }

    wistorm_api._listPost('vehicle', query_json, '', 'createdAt', 'createdAt', 0, 0, 1, -1, $.cookie('auth_code'), true, function (obj) {
        console.log(obj, 'post vehicle')
        vehicleServiceObj['isbegin'] = true;
        if (obj.status_code == 0 && obj.data.length) {
            obj.data.forEach(ele => {
                if (ele.did) {
                    vehicleServiceObj[ele.did] = ele
                }
            });
            callback(vehicleServiceObj)
        }
    })



}


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
                // if (roleId && roleIds.indexOf(roleId.toString()) == -1) {
                //     otherCustomer(roleData.uid, function (otherCus) {
                //         var option = document.createElement('option');;
                //         option.value = roleId;
                //         option.innerText = roleData.name + '(' + otherCus.name + ')';
                //         $('#roleId').append(option);
                //         customerInfoSuccess(json.data);

                //     })
                // } else {
                //     customerInfoSuccess(json.data);
                // }
            });
        });
    });
}
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

// 目标查询
function vehicleQuery(cust_id, depart) {
    // var query_json;
    // if (key && key != "") {
    //     query_json = {
    //         uid: cust_id,
    //         name: '^' + key
    //     };
    // } else {
    //     query_json = {
    //         uid: cust_id
    //     };
    // }
    // setLoading("vehicle_list");
    // wistorm_api._list('vehicle', query_json, 'objectId,name,model,did,sim,serviceRegDate,serviceExpireIn', 'name', 'name', 0, 0, 1, -1, auth_code, true, vehicleQuerySuccess)
    uid = cust_id;
    is_depart = depart;
    // if(uid)
    querySuccess();
}


// 设备查询
function deviceQuery(dids, callback) {
    var startTime = updateTime.format("yyyy-MM-dd hh:mm:ss");
    var endTime = '2100-01-01';
    // var query_json = {
    //     // did: dids,
    //     uid: uid,
    //     map: 'BAIDU',
    //     'activeGpsData.rcvTime': startTime + '@' + endTime
    // };
    if (dids !== '') {
        query_json = {
            did: dids,
            map: map_engine,
            'activeGpsData.rcvTime': startTime + '@' + endTime
        };
        wistorm_api._listPost('_iotDevice', query_json, 'did,activeGpsData,accOffTime,params,workType,objectType,model', '-activeGpsData.rcvTime', '-activeGpsData.rcvTime', 0, 0, 1, -1, auth_code, true, function (json) {
            if (json.data.length > 0) {
                updateTime = new Date(json.data[0].activeGpsData.rcvTime);
                updateTime.setSeconds(updateTime.getSeconds() + 1);
            }
            callback(json);
        });
    }
}

var getAcc = function (device) {
    var acc = device.activeGpsData.status.join(",").indexOf('8196') > -1 ? '启动' : '熄火';
    return acc;
};

var getSpeed = function (device) {
    var speed = (device.activeGpsData.speed || 0).toFixed(0);
    return speed;
};

var getFlag = function (device) {
    var flag = '';
    if (!device.activeGpsData || !getOnLine(device)) {
        flag = '2';
    } else if (device.activeGpsData && device.activeGpsData.alerts.length > 0) {
        flag = '3';
    } else {
        flag = '1';
    }
    return flag;
};

var getColorFlag = function (device) {
    var flag = '';
    if (!device.activeGpsData || !getOnLine(device)) {
        flag = '_offline';
    } else if (device.activeGpsData && device.activeGpsData.alerts.length > 0) {
        flag = '_alert';
    } else {
        if (device.activeGpsData.status.join(",").indexOf('8196') > -1) {
            flag = '_run';
        }
    }
    return flag;
};

var setColor = function (vehicle) {
    var obj = $('#' + vehicle.did.trim());
    if (obj.length > 0) {
        var flag = getColorFlag(vehicle);
        obj.parent().parent().removeClass('_run');
        obj.parent().parent().removeClass('_alert');
        obj.parent().parent().removeClass('_offline');
        obj.parent().parent().addClass(flag);
    }
};

var setInfo = function (vehicle) {
    _drawing = true;
    var obj = $('#' + vehicle.did.trim());
    if (obj.length > 0) {
        // obj.parent().parent().find('td')[2].innerHTML = vehicle.status;
        obj.parent().parent().find('td')[2].innerHTML = `<div style="width:auto;overflow:hidden;white-space:nowrap; text-overflow:ellipsis" title="${vehicle.status}">${vehicle.status}</div>`
        var d = vehicle_table.api().rows(obj.parent().parent()).data()[0];
        d.flag = vehicle.flag;
        // vehicle_table.api().rows(obj.parent().parent()).data(d).draw();
        // vehicle_table.api().row(obj.parent().parent()).remove();
        // vehicle_table.api().row.add(d);
        var idx = vehicle_table.api().row(obj.parent().parent()).index();
        // vehicle_table.api().cell(idx, 3).data(vehicle.flag).draw(false);
        vehicle_table.api().cell(idx, 3).data(vehicle.flag);
    }
    // obj.parent().parent().find('td')[2].innerHTML = vehicle.acc;
    // obj.parent().parent().find('td')[3].innerHTML = vehicle.speed;
    // $('#' + vehicle.did).prop("checked", true);
    _drawing = false;
    // vehicle_table.api().row().draw();
};

// 更新各种状态的计数
var updateVehicleCount = function (callback) {
    // $('#vehicle-status li').each(function () {
    //     var _this = this;
    //     var count = vehicle_table.api().column(3).data().filter(function (value, index) {
    //         return $(_this).attr('flag') == '' || ($(_this).attr('flag') == '1' && (value == '1' || value == '3')) || value == $(_this).attr('flag');
    //     }).length;
    //     $(this).find('a')[0].innerHTML = _counts[$(this).attr('flag')] + '(' + count + ')';
    // });
    if (is_depart) {
        var query = {
            uid: dealer_id,
            departId: uid.toString()
        };
    } else {
        var query = {
            uid: uid
        };
        if (['9', '12', '13'].indexOf(dealer_type) > -1) {
            query['departId'] = login_depart_id;
        }
    }

    query.isDepart = is_depart ? 1 : 0;

    wistorm_api._count('vehicle2', query, auth_code, true, function (obj) {
        console.log(obj);
        $('#onlineStatus').find('a')[0].innerHTML = _counts['1'] + '(' + (obj.online || 0) + ')';
        $('#offlineStatus').find('a')[0].innerHTML = _counts['2'] + '(' + (obj.offline || 0) + ')';
        $('#alertStatus').find('a')[0].innerHTML = _counts['3'] + '(' + (obj.alert || 0) + ')';
        if (callback) callback();
    });
};

var getRefreshDid = function () {
    var refreshDids = [];
    if (vehicle_table) {
        var start = vehicle_table.fnSettings()._iDisplayStart;
        for (var i = 0; i < 100; i++) {
            if (start + i >= vehicles.length) {
                break;
            }
            refreshDids.push(vehicles[start + i].did);
        }
    }
    return refreshDids;
};

var querySuccess = function () {
    var _columns = [
        {
            "searchable": false,
            "data": null,
            "className": "center did",
            "bSortable": false,
            "render": function (obj) {
                return "<input type='checkbox' id='" + obj.did + "' value='" + obj.did + "' title='" + i18next.t("monitor.check_refresh") + "'>";
            }
        },
        {
            "searchable": false, "data": null, "className": "", "render": function (obj) {
                return '<div style="min-width:115px;width:115px;overflow:hidden;white-space:nowrap; text-overflow:ellipsis" title="' + obj.name + '">' + obj.name + '</div>';
            }
        },
        // { "searchable": false, "data":"acc", "className":"center" },
        // { "searchable": false, "data":"speed", "className":"center" },
        {
            "searchable": false, "data": null, "className": "", "render": function (obj) {
                // console.log(obj.status)
                return '<div style="width:auto;overflow:hidden;white-space:nowrap; text-overflow:ellipsis" title="' + obj.status + '">' + obj.status + '</div>';
            }
        },
        { "searchable": false, "data": "flag", "className": "", "bVisible": false }
    ];
    var lang = i18next.language || 'en';
    var height = $(window).height() - $('#accordion2').height() - 210;
    var objTable = {
        "bDestroy": true,
        "bAutoWidth": false,
        // "sScrollX": "330px",
        "sScrollY": height + "px",
        "bInfo": false,
        "iDisplayLength": 100,
        "bLengthChange": false,
        "bProcessing": false,
        "bServerSide": true,
        "bDeferRender": false,
        "bFilter": false,
        "aoColumns": _columns,
        "sDom": "<'row'r>t<'row'<'pull-right'p>>",
        "sPaginationType": "bootstrap",
        "oLanguage": { "sUrl": 'css/' + lang + '.txt' },
        "sAjaxSource": "",
        "fnServerData": retrieveData
    };
    $('#vehicleKey').typeahead({
        source: function (query, process) {
            process(names);
        }
    });

    vehicle_table = $("#vehicle_list").dataTable(objTable);

    $('#vehicle_list tbody').on('click', 'tr', function () {
        if ($(this).hasClass('selected')) {
            // $(this).removeClass('selected');
        }
        else {
            vehicle_table.$('tr.selected').removeClass('selected');
            $(this).addClass('selected');
        }
        var did = $(this).find(".did [type='checkbox']").val();

        if (isExpiredFun(did)) {
            return false
        }

        if (did) {
            addVehicle(did);
            wimap.findVehicle(did, true, true);
            $('#' + did).prop("checked", true);
            if (checkDids.indexOf(did) === -1) {
                checkDids.push(did);
            }
            console.log(checkDids.join('|'));
            $.cookie('checkDids', checkDids.join('|'));
            $('#checkAll').prop("checked", checkDids.length == vehicles.length);
            if (loadIdleList) {
                if ($("#divIdle").dialog("isOpen")) {
                    idle(did, 0);
                }
            }
        }
    });
    $('#vehicle_list').on('draw.dt', function () {
        if (_drawing) {
            return;
        }
        checkAllDid();
        console.log('redraw occurred at: ' + new Date().getTime());
        setVehicleList();
    });
};

var setVehicleList = function () {
    $('#vehicle_list :checkbox:not(#checkAll)').unbind("change");
    $('#vehicle_list :checkbox:not(#checkAll)').change(function () {
        // alert($(this).prop("checked"));
        // alert($(this).val());
        
        var checked = $(this).prop("checked");
        var did = $(this).val();
        if (isExpiredFun(did)) {
            return false
        }
        if (checked) {
            checkDids.push(did);
            addVehicle(did);
        } else {
            checkDids.pop(did);
            wimap.deleteVehicle(did);
        }
        console.log(checkDids.join('|'));
        $.cookie('checkDids', checkDids.join('|'));
        $('#checkAll').prop("checked", checkDids.length == vehicles.length);
    });
    $('#vehicle_list :checkbox:not(#checkAll)').unbind("click");
    $('#vehicle_list :checkbox:not(#checkAll)').click(function (event) {
        event.stopPropagation();
    });
    for (var i = 0; i < vehicles.length; i++) {
        setColor(vehicles[i]);
    }
};

// var vehicleQuerySuccess = function (json) {
//     var j, _j, UnContacter, Uncontacter_tel;
//     names = [];
//     var dids = [];
//     vehicles = json.data;
//     for (var i = 0; i < json.data.length; i++) {
//         json.data[i].acc = '';
//         json.data[i].speed = '';
//         json.data[i].status = json.data[i].did === '' ? i18next.t("monitor.no_device") : i18next.t("monitor.no_data");
//         json.data[i].flag = '';
//         json.data[i].did = json.data[i].did.trim();
//         names.push(json.data[i].name);
//         dids.push(json.data[i].did);
//         _vehicles[json.data[i].did] = json.data[i];
//     }
//
//     if (vehicles.length > 0) {
//         if (intervalId) {
//             clearTimeout(intervalId);
//         }
//         refreshLocation();
//     }
//     //定时更新数据
//     $('#refreshText').css('display', vehicles.length > 0 ? 'block' : 'none');
//
//     dids = dids.join('|');
//     deviceQuery(dids, function (devices) {
//         for (var i = 0; i < devices.data.length; i++) {
//             var vehicle = _vehicles[devices.data[i].did];
//             if (vehicle) {
//                 vehicle.acc = getAcc(devices.data[i]);
//                 vehicle.speed = getSpeed(devices.data[i]);
//                 // vehicle.status = getStatusDesc(devices.data[i], 1);
//                 vehicle.status = getStatus(devices.data[i]).desc;
//                 vehicle.flag = getFlag(devices.data[i]);
//                 vehicle.activeGpsData = devices.data[i].activeGpsData;
//                 vehicle.workType = devices.data[i].workType;
//                 vehicle.params = devices.data[i].params;
//             }
//         }
//         var _columns = [
//             {
//                 "searchable": false,
//                 "data": null,
//                 "className": "center did",
//                 "bSortable": false,
//                 "render": function (obj) {
//                     return "<input type='checkbox' id='" + obj.did + "' value='" + obj.did + "' title='" + i18next.t("monitor.check_refresh") + "'>";
//                 }
//             },
//             {
//                 "searchable": false, "data": null, "className": "", "render": function (obj) {
//                 return '<div style="min-width:135px;width:auto;overflow:hidden;white-space:nowrap; text-overflow:ellipsis" title="' + obj.name + '">' + obj.name + '</div>';
//             }
//             },
//             // { "searchable": false, "data":"acc", "className":"center" },
//             // { "searchable": false, "data":"speed", "className":"center" },
//             {"searchable": false, "data": "status", "className": ""},
//             {"searchable": true, "data": "flag", "className": "center", 'visible': false}
//         ];
//         var lang = i18next.language || 'en';
//         var objTable = {
//             "bInfo": false,
//             "bLengthChange": false,
//             "bProcessing": false,
//             "bServerSide": false,
//             "bFilter": true,
//             "scrollY": true,
//             "searching": true,//本地搜索
//             "data": json.data,
//             "aoColumns": _columns,
//             'bPaginate': true,
//             "iDisplayLength": 100,
//             "sDom": "<'row'r>t<'row'<'pull-right'p>>",
//             "sPaginationType": "bootstrap",
//             "oLanguage": {"sUrl": 'css/' + lang + '.txt'}
//         };
//         $('#vehicleKey').typeahead({
//             source: function (query, process) {
//                 process(names);
//             }
//         });
//
//         if (vehicle_table) {
//             vehicle_table.fnClearTable();
//             if (json.data.length > 0) {
//                 vehicle_table.fnAddData(json.data);
//             }
//         } else {
//             vehicle_table = $("#vehicle_list").dataTable(objTable);
//             //  //添加索引列
//             // vehicle_table.on('order.dt search.dt',
//             //         function () {
//             //         }).draw();
//             $('#vehicle_list tbody').on('click', 'tr', function () {
//                 if ($(this).hasClass('selected')) {
//                     // $(this).removeClass('selected');
//                 }
//                 else {
//                     vehicle_table.$('tr.selected').removeClass('selected');
//                     $(this).addClass('selected');
//                 }
//                 var did = $(this).find(".did [type='checkbox']").val();
//                 if (did) {
//                     addVehicle(did);
//                     wimap.findVehicle(did, true, true);
//                     $('#' + did).prop("checked", true);
//                     if (checkDids.indexOf(did) === -1) {
//                         checkDids.push(did);
//                     }
//                     console.log(checkDids.join('|'));
//                     $.cookie('checkDids', checkDids.join('|'));
//                     $('#checkAll').prop("checked", checkDids.length == vehicles.length);
//                     if (loadIdleList) {
//                         if ($("#divIdle").dialog("isOpen")) {
//                             idle(did, 0);
//                         }
//                     }
//                 }
//             });
//             $('#vehicle_list').on('draw.dt', function () {
//                 if (_drawing) {
//                     return;
//                 }
//                 checkAllDid();
//                 // updateVehicleCount();
//                 console.log('redraw occurred at: ' + new Date().getTime());
//                 $('#vehicle_list :checkbox:not(#checkAll)').unbind("change");
//                 $('#vehicle_list :checkbox:not(#checkAll)').change(function () {
//                     // alert($(this).prop("checked"));
//                     // alert($(this).val());
//                     var checked = $(this).prop("checked");
//                     var did = $(this).val();
//                     if (checked) {
//                         checkDids.push(did);
//                         addVehicle(did);
//                     } else {
//                         checkDids.pop(did);
//                         wimap.deleteVehicle(did);
//                     }
//                     console.log(checkDids.join('|'));
//                     $.cookie('checkDids', checkDids.join('|'));
//                     $('#checkAll').prop("checked", checkDids.length == vehicles.length);
//                 });
//                 $('#vehicle_list :checkbox:not(#checkAll)').unbind("click");
//                 $('#vehicle_list :checkbox:not(#checkAll)').click(function (event) {
//                     event.stopPropagation();
//                 });
//                 for (var i = 0; i < vehicles.length; i++) {
//                     setColor(vehicles[i]);
//                 }
//             });
//         }
//         // setTimeout(function () {
//         //     windowResize();
//         // }, 300);
//         _runing = false;
//     });
// };

function _clearTimeout() {
    updateTime = new Date(0);
    if (intervalId) {
        clearTimeout(intervalId);
        interval = 10;
    }
    $('#refreshText').css('display', 'none');
}

function retrieveData(sSource, aoData, fnCallback) {
    $(window).trigger("resize");
    if (uid === 0) {
        var json = {};
        json.aaData = [];
        fnCallback(json);
        return;
    }
    _clearTimeout();
    setLoading2($("#vehicleBody"));
    var key = $('#searchKey').val().trim();
    var query_json;
    var lookup;

    var now = new Date();
    now = new Date(now.setMinutes(now.getMinutes() - 10));

    if (is_depart) {
        if (key && key != "") {
            query_json = {
                uid: dealer_id,
                departId: uid,
                name: '^' + key
            };
        } else {
            query_json = {
                uid: dealer_id,
                departId: uid
            };
        }
        lookup = {
            from: "_iotdevices",
            localField: "did",
            foreignField: "did",
            as: "device"
        };

        if (status_flag === '1') {
            query_json['device.activeGpsData.rcvTime'] = now.format("yyyy-MM-dd hh:mm:ss") + '@2099-01-01';
        } else if (status_flag === '2') {
            query_json['device.activeGpsData.rcvTime'] = '1700-01-01@' + now.format("yyyy-MM-dd hh:mm:ss");
        } else if (status_flag === '3') {
            query_json['device.activeGpsData.rcvTime'] = now.format("yyyy-MM-dd hh:mm:ss") + '@2099-01-01';
            query_json['device.activeGpsData.alerts'] = '<>[]';
        }
    } else {
        if (key && key != "") {
            query_json = {
                uid: uid,
                $where: 'function(){return this.did.indexOf("' + key + '") > -1 || (this.vehicleName && (this.vehicleName.indexOf("' + key + '") > -1));}'
            };
        } else {
            query_json = {
                uid: uid,
                binded: true
            };
        }
        if (status_flag === '1') {
            query_json['activeGpsData.rcvTime'] = now.format("yyyy-MM-dd hh:mm:ss") + '@2099-01-01';
        } else if (status_flag === '2') {
            query_json['activeGpsData.rcvTime'] = '1700-01-01@' + now.format("yyyy-MM-dd hh:mm:ss");
        } else if (status_flag === '3') {
            query_json['activeGpsData.rcvTime'] = now.format("yyyy-MM-dd hh:mm:ss") + '@2099-01-01';
            query_json['activeGpsData.alerts'] = '<>[]';
        }

        if (['9', '12', '13'].indexOf(dealer_type) > -1) {
            if (key && key != "") {
                query_json = {
                    uid: uid,
                    name: '^' + key
                };
            } else {
                query_json = {
                    uid: uid
                };
            }
            query_json['departId'] = login_depart_id;
            lookup = {
                from: "_iotdevices",
                localField: "did",
                foreignField: "did",
                as: "device"
            };

            if (status_flag === '1') {
                query_json['device.activeGpsData.rcvTime'] = now.format("yyyy-MM-dd hh:mm:ss") + '@2099-01-01';
            } else if (status_flag === '2') {
                query_json['device.activeGpsData.rcvTime'] = '1700-01-01@' + now.format("yyyy-MM-dd hh:mm:ss");
            } else if (status_flag === '3') {
                query_json['device.activeGpsData.rcvTime'] = now.format("yyyy-MM-dd hh:mm:ss") + '@2099-01-01';
                query_json['device.activeGpsData.alerts'] = '<>[]';
            }
        }

    }

    query_json['map'] = map_engine;

    var page_count = aoData[4].value;
    var page_no = (aoData[3].value / page_count) + 1;
    var url = "";
    if (is_depart) {
        url = wistorm_api._lookupUrl('vehicle', lookup, query_json, 'objectId,name,model,did,sim,serviceRegDate,serviceExpireIn,objectType,device.activeGpsData,device.workType,device.params,device.vehicleName,device.did', 'name', 'name', page_no, page_count, auth_code, true);
    } else {
        url = wistorm_api._listUrl('_iotDevice', query_json, 'objectId,vehicleName,did,activeGpsData,workType,params,objectType,model', 'vehicleName', 'vehicleName', 0, 0, page_no, page_count, auth_code, true);
    }
    vehicleFuelTankCapacity(query_json)
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
            vehicles = json.data;
            var serviceDids = [];
            json.data.forEach(ele => {
                ele.did ? serviceDids.push(ele.did) : null;
            });
            if (serviceDids.length) {
                var serviceQuery = { did: serviceDids.join('|') };
                vehicleService(serviceQuery, function () {
                    prePlay()
                })
            } else {
                prePlay()
            }
            var prePlay = function () {
                for (var i = 0; i < json.data.length; i++) {
                    if (json.data[i].did) {
                        serviceDids.push(json.data[i].did)
                    }
                    var vehicle = json.data[i];
                    var device = json.data[i].device ? json.data[i].device[0] : json.data[i];
                    if (device) {
                        if (device.activeGpsData && device.activeGpsData.gpsTime) {
                            vehicle.name = device.vehicleName || device.did;
                            vehicle.flag = getFlag(device);
                            vehicle.acc = getAcc(device);
                            vehicle.speed = getSpeed(device);
                            vehicle.status = getStatus(device).desc;
                            vehicle.activeGpsData = device.activeGpsData;
                        } else {
                            vehicle.name = vehicle.did;
                            vehicle.status = vehicle.did === '' ? i18next.t("monitor.no_device") : i18next.t("monitor.no_data");
                            vehicle.flag = '';
                        }
                        vehicle.workType = device.workType || 0;
                        vehicle.params = device.params || {};
                    } else {
                        vehicle.status = vehicle.did === '' ? i18next.t("monitor.no_device") : i18next.t("monitor.no_data");
                        vehicle.flag = '';
                    }
                    _vehicles[vehicle.did] = vehicle;
                }


                json.aaData = json.data;
                if (status_flag === '') {
                    $('#allStatus').find('a')[0].innerHTML = _counts[''] + '(' + json.total + ')';
                    // $("#vehicle_list").html('');
                    fnCallback(json); //服务器端返回的对象的returnObject部分是要求的格式
                    updateVehicleCount(function () { });
                } else {
                    // $("#vehicle_list").html('');
                    fnCallback(json);
                }
                if (vehicles.length > 0) {
                    refreshLocation();
                }
                //定时更新数据
                $('#refreshText').css('display', vehicles.length > 0 ? 'block' : 'none');
                _runing = false;
                _drawing = false;
                checkAllDid();
                setVehicleList();
                windowResize();
            }

        }
    });
    _runing = true;
    _drawing = true;
}

function windowResize() {
    //高度变化改变(要重新计算_browserheight)
    var windowHeight = $(window).height() - 80;
    // var _panorama = $("#panorama");
    // var windowobj = $(window);
    // map_canvasHeight = windowobj.height() - 80;
    // browsCss(_panorama, map_canvasHeight);
    $("#panorama").css({ "height": windowHeight + "px" });
    $('#map_canvas').css({ "height": windowHeight + "px" });
    // 修改目标列表高度
    var height = $(window).height() - $('#accordion2').height() - 210;
    $('.dataTables_scrollBody').css({ "height": height + "px" });
}

var vehicleFuelTankCapacity = function (query_json) {
    wistorm_api._list('vehicle', query_json, 'did,fuelTankCapacity', '-createdAt', 'createdAt', 0, 0, 1, 60, $.cookie('auth_code'), true, function (obj) {
        fuelTankCapacityObj = {};
        if (obj.total) {
            obj.data.forEach(ele => {
                fuelTankCapacityObj[ele.did] = ele.fuelTankCapacity || 0;
            })
        }
        sessionStorage.setItem('fuelTank', JSON.stringify(fuelTankCapacityObj))
        console.log(obj, 'ddd');
    })
}

var addVehicle = function (did) {
    var vehicle = _vehicles[did];
    var vehicles = [vehicle];
    wimap.addVehicles(vehicles);
    // 保存默认位置
    if (vehicle.activeGpsData) {
        $.cookie('lon', vehicle.activeGpsData.lon);
        $.cookie('lat', vehicle.activeGpsData.lat);
    }
};

// 加载目标
var addVehicles = function () {
    var checked = $('#checkAll').prop("checked");
    if (!checked) {
        wimap.clearVehicle();
    }
    var vehicles = [];
    var dids = $("[type='checkbox']:checked:not(#checkAll)");
    checkDids = [];
    for (var i = 0; i < dids.length; i++) {
        if (isExpiredFun($(dids[i]).val())) {
            continue;
        }
        var vehicle = _vehicles[$(dids[i]).val()];
        if (vehicle) {
            vehicles.push(vehicle);
        }
        checkDids.push($(dids[i]).val());
    }
    wimap.addVehicles(vehicles, _firstLoad);
    _firstLoad = false;
    // }else{
    //     wimap.clearVehicle();
    //     checkDids = [];
    // }
    console.log(checkDids.join('|'));
    $.cookie('checkDids', checkDids.join('|'));
};

var loadPois = function () {
    wimap.clearPoi();
    var query_json = {
        uid: dealer_id,
        type: 1
    };
    wistorm_api._list('overlay', query_json, 'objectId,name,type,opt,points', 'name', 'name', 0, 0, 1, -1, auth_code, true, function (json) {
        if (json.status_code === 0 && json.total > 0) {
            wimap.addPois(json.data);
        }
    });
};

// 目标跟踪
var trace = function (target, did) {
    var vehicle = _vehicles[did];
    if (vehicle) {
        // vehicle.if_track = !(vehicle.if_track || false);
        // vehicle.if_show_line = !(vehicle.if_show_line || false);
        // var caption = vehicle.if_track ? '取消跟踪' : '跟踪';
        // $(target).text(caption);
        window.open('/trace?did=' + did + '&name=' + vehicle.name);
    }
    console.log('trace = ' + did);
};

// 目标回放
var playback = function (did) {
    var vehicle = _vehicles[did];
    if (vehicle) {
        window.open('/playback?did=' + did + '&name=' + vehicle.name + '&workType=' + vehicle.workType + '&objectType=' + (vehicle.objectType || 0));
    }
    console.log('playback = ' + did);
};

// 围栏设置
var geofenceSet = function (did, lon, lat) {
    $.cookie('lon', lon);
    $.cookie('lat', lat);
    window.open('/geofence');
};
//资料
var vehicleEditOpen = function (obj_id) {

    query_json = {
        did: obj_id
    };
    wistorm_api._get('vehicle', query_json, 'objectId,uid,departId,name,model,did,sim,serviceExpireIn,contact,tel,remark,inspectExpireIn,maintainMileage,maintainExpireIn,insuranceExpireIn,objectType,fuelTankCapacity', auth_code, true, function (json) {
        vehicleInfoSuccess(json.data);
        // console.log(json)
    });
}

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
        var alertOptions = json.data.params ? json.data.params.alertOptions : null;
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

var vehicleEdit = function () {
    var auth_code = $.cookie('auth_code');
    var obj_name = $('#obj_name').val().trim();             //车牌号码
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
            // var alertOptions = [];
            var alertOptions = [];
            $.each($('input[name="alert"]:checked'), function () {
                alertOptions.push($(this).val())
            })
            var update = {
                // vehicleId: obj_id,
                // vehicleName: obj_name,
                // binded: true,
                // bindDate: now.format('yyyy-MM-dd hh:mm:ss'),
                // uid: uids,
                objectType: objectType,
                "params.alertOptions": alertOptions
            };

            updateDevice(device_id.trim(), update, function (dev) {
                if (dev.status_code == 0) {
                    wistorm_api.setCache(device_id.trim() + '.alertOptions', alertOptions, function (res) {
                        console.log(res)
                    });
                } else {
                    console.log('Update device fail, please try again');
                }
            });
            // oVehicleQuery(uid, tree_path, is_depart);
            // if (did !== device_id) {
            //     // 解绑原有的终端ID
            //     var update = {
            //         vehicleId: '',
            //         vehicleName: '',
            //         binded: false,
            //         uid: '-' + uid
            //     };
            //     updateDevice(did, update, function (dev) {
            //         if (dev.status_code == 0) {
            //         } else {
            //             console.log('Unbind device fail, pls try again');
            //         }
            //     });
            // }
            // var uids = uid;
            // tree_path = tree_path || '';
            // if (tree_path !== '') {
            //     uids = tree_path.split(',').filter(function (item) { return item !== '' });
            // }
            // // 更新设置的vehicleId和vehicleName
            // var now = new Date();
            // var update = {
            //     vehicleId: obj_id,
            //     vehicleName: obj_name,
            //     binded: true,
            //     bindDate: now.format('yyyy-MM-dd hh:mm:ss'),
            //     uid: uids,
            //     objectType: objectType
            // };
            // updateDevice(device_id, update, function (dev) {
            //     if (dev.status_code === 0) {
            //     } else {
            //         console.log('Update device fail, please try again');
            //     }
            // });
        } else {
            _alert(i18next.t("device.msg_save_fail"));
        }
    });
};

var vehicleInfoSuccess = function (json) {
    //alert(json);
    deviceInfo(json.did);
    showCustomerInfo(json.uid)
    validator_vehicle.resetForm();
    obj_id = json.objectId;
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
    // vehicle_flag = flag;
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
    // if (vehicle_flag == 1) {
    //     $('#device_id').removeAttr("disabled");
    //     $('#service_panel').show();
    //     $('#service_end_date_panel').hide();
    // } else {
    if (device_id != '') {
        $('#device_id').attr("disabled", "disabled");
        $('#bind').css("display", "none");
        $('#unbind').css("display", "none");
    } else {
        $('#device_id').removeAttr("disabled");
        $('#bind').css("display", "inline-block");
        $('#unbind').css("display", "none");
    }
    $('#service_panel').hide();
    $('#service_end_date_panel').show();
    // }
};
var updateDevice = function (did, update, callback) {
    var query = {
        did: did
    };
    wistorm_api._update('_iotDevice', query, update, auth_code, true, function (obj) {
        return callback(obj);
    });
};

// 参数设置
var deviceSet = function (did) {
    var vehicle = _vehicles[did];
    if (vehicle) {
        $('#name').val(vehicle.name);
        $('#did').val(did);
        _did = did;
        $("#divDeviceSet").dialog("option", "title", i18next.t("setting.device_set"));
        $("#divDeviceSet").dialog("open");
    }
};

var refreshVehicles = function () {
    deviceQuery(getRefreshDid().join('|'), function (devices) {
        console.log("更新" + devices.total + '辆车数据。');
        var vehicles = [];
        for (var i = 0; i < devices.data.length; i++) {
            var vehicle = _vehicles[devices.data[i].did];
            if (vehicle) {
                vehicle.acc = getAcc(devices.data[i]);
                vehicle.speed = getSpeed(devices.data[i]);
                vehicle.status = getStatus(devices.data[i]).desc;
                vehicle.flag = getFlag(devices.data[i]);
                vehicle.activeGpsData = devices.data[i].activeGpsData;
                vehicle.params = devices.data[i].params;
                setInfo(vehicle);
                setColor(vehicle);
                if (checkDids.indexOf(devices.data[i].did) > -1) {
                    vehicles.push(vehicle);
                }
            }
        }
        wimap.addVehicles(vehicles, false, false, false);
        if (devices.total > 0) {
            updateVehicleCount();
        }
    });
};

var clearVehicles = function () {
    $(":checkbox").attr("checked", false);
    uid = 0;
    vehicle_table.fnClearTable();
    status_flag = '';
    statusSelected.removeClass("active");
    $('#allStatus').addClass("active");
    statusSelected = $('#allStatus');
    // _clearTimeout();
    // clearTimeout(intervalId);
    // interval = 10;
    // updateTime = new Date(0);
};

var interval = 10;
var intervalId;
var refreshLocation = function () {
    $('#refreshText').html(i18next.t("monitor.refresh_after", { interval: interval }));
    if (interval == 0) {
        if (vehicles.length > 0) {
            refreshVehicles();
        }
        interval = 10;
    } else {
        interval--;
    }
    intervalId = setTimeout('refreshLocation()', 1000);
};

var checkAllDid = function () {
    for (var i = 0; i < checkDids.length; i++) {
        $("#" + checkDids[i]).prop("checked", true);//全选
    }
    $('#checkAll').prop("checked", checkDids.length == vehicles.length);
    addVehicles();
};

// var heavy = function (obj) {
//     var didArr = [];
//     var didobj = {};
//     obj.forEach(ele => {
//         if (!didobj[ele.did]) {
//             didobj[ele.did] = 1;
//             didArr.push(ele.did)
//         }
//     });
//     return didArr;
// }
var getVehicleMessage = function (obj) {
    var _thisVehicle = Object.keys(obj);
    console.log(_thisVehicle, 'did')
    if (!_thisVehicle.length) {
        $('#divLoseList').dialog('option', "title", "目标信息");
        $('#divLoseList').dialog('open');
        $('#loseTable').empty();
        var tr = `<tr><td colspan="3">无数据</td></tr>`
        $('#loseTable').append(tr);
    } else {
        wistorm_api._list('vehicle', { did: _thisVehicle.join('|') }, '', 'createdAt', 'createdAt', 0, 0, 0, -1, $.cookie('auth_code'), true, function (obj) {
            console.log(obj, 'vehicle')
            var _nodeUid = [];
            var _nodeUidObj = {};
            obj.data.forEach(ele => {
                _nodeUidObj[ele.uid] = ele.name;
                _nodeUid.push(ele.uid)
            })
            console.log(_nodeUidObj)
            console.log(_nodeUid)
            $('#divLoseList').dialog('option', "title", "目标信息");
            $('#divLoseList').dialog('open');
            $('#loseTable').empty();
            if (!obj.data.length) {
                var tr = `<tr><td colspan="3">无数据</td></tr>`;
                $('#loseTable').append(tr);
                return;
            }
            obj.data.forEach(ele => {
                var tr = `<tr>
                    <td>${ele.name}</td>
                    <td>${ele.contact || ''}</td>
                    <td>${ele.tel || ''}</td>
                </tr>`
                $('#loseTable').append(tr)
            })
            // wistorm_api._list('customer', { uid: _nodeUid.join('|') }, '', 'createdAt', 'createdAt', 0, 0, 0, -1, $.cookie('auth_code'), true, function (cust) {
            //     console.log(cust, 'cust')
            //     $('#divLoseList').dialog('option', "title", "目标信息");
            //     $('#divLoseList').dialog('open');
            //     $('#loseTable').empty();
            //     if (!cust.data.length) {
            //         var tr = `<tr>
            //             <td colspan="3">无数据</td>
            //         </tr>`
            //         $('#loseTable').append(tr);
            //         return;
            //     }
            //     cust.data.forEach(ele => {
            //         var tr = `<tr>
            //             <td>${_nodeUidObj[ele.objectId]}</td>
            //             <td>${ele.contact}</td>
            //             <td>${ele.tel || ''}</td>
            //         </tr>`
            //         $('#loseTable').append(tr)
            //     })
            // })
        })
    }

}

//节点查询
var searchVehicle = function () {
    console.log(markePois)
    var startTime = $('#divStartTime').val();
    var endTime = $('#divEndTime').val();
    console.log(startTime, endTime);
    if (startTime > endTime) {
        _alert('开始时间不能大于结束时间');
        return;
    }
    if ((new Date(endTime).getTime() - new Date(startTime).getTime()) > 28800000) {
        _alert('时间差不能超过8小时');
        return;
    }
    if (markePois.length == 0) {
        _alert('途经点不能为空');
        return;
    }
    if (markePois.length > 3) {
        _alert('途经点不能超过三个');
        return;
    }
    var query = {
        gpsTime: startTime + "@" + endTime
    };

    var _thisDid = {};
    var _thisI = 0;
    markePois.forEach((ele, i) => {
        var _thisPoi = ele.split(',');
        wistorm_api.revise(_thisPoi[0], _thisPoi[1], 4, function (res) {
            query.loc = '!' + res.x.toFixed(6) + '@' + res.y.toFixed(6) + '@' + parseInt(100);
            otherWistorm_api._list('_iotGpsData', query, 'did,rcvTime,createdAt', 'createdAt', 'createdAt', 0, 0, 0, -1, $.cookie('auth_code'), true, function (obj) {
                _thisI++;
                if (obj) {
                    obj.data.forEach(ele => {
                        _thisDid[ele.did] ? _thisDid[ele.did]++ : _thisDid[ele.did] = 1;
                    })
                }
                console.log(_thisI, markePois.length)
                if (_thisI == markePois.length) {
                    getVehicleMessage(_thisDid)
                }
            })
        })
    })
}


var statusSelected;
var collapsed = false;
$(document).ready(function () {
    $("#alert").hide();



    // map_type = mapType == 1 || $.cookie('lang') === 'zh' || $.cookie('lang') === 'zh-CN' ? MAP_TYPE_BAIDU : mapType == 3 ? MAP_TYPE_GAODE : MAP_TYPE_GOOGLE;
    // map_engine = mapType == 1 || mapType == 3 || $.cookie('lang') === 'zh' || $.cookie('lang') === 'zh-CN' ? 'BAIDU' : 'GOOGLE';

    windowResize();

    var mtId = setInterval(function () {
        // debugger;
        if (mapType) {
            map_type = mapType == 1 ? MAP_TYPE_BAIDU : mapType == 3 ? MAP_TYPE_GAODE : MAP_TYPE_GOOGLE;
            map_engine = mapType == 1 ? 'BAIDU' : 'GOOGLE';
        } else {
            map_type = $.cookie('lang') === 'zh' || $.cookie('lang') === 'zh-CN' ? MAP_TYPE_BAIDU : MAP_TYPE_GOOGLE;
            mapType = $.cookie('lang') === 'zh' || $.cookie('lang') === 'zh-CN' ? 1 : 2;
            map_engine = $.cookie('lang') === 'zh' || $.cookie('lang') === 'zh-CN' ? 'BAIDU' : 'GOOGLE';
        }
        if (!i18nextLoaded) {
            return;
        }
        cust_typeObj = {
            2: i18next.t('system.dealer'),
            7: i18next.t('system.personal'),
            8: i18next.t('system.company')
        };
        statusSelected = $('#allStatus');

        $("#customerKey").click(function (event) {
            // event.stopPropagation();
        });

        $('#customerKey').keydown(function (e) {
            var curKey = e.which;
            if (curKey == 13) {
                var treeObj = $.fn.zTree.getZTreeObj("customerTree");
                var node = treeObj.getNodesByParamFuzzy("name", $('#customerKey').val(), null);
                if (node && node.length > 0) {
                    treeObj.selectNode(node[0]);
                    clearVehicles();
                    vehicleQuery(node[0].id, '');
                    collapsed = false;
                    // alert(collapsed);
                    if (!collapsed) {
                        $('#collapseOne').addClass("in");
                        $('#accordion-icon').removeClass("icon-arrow-down");
                        $('#accordion-icon').addClass("icon-arrow-up");
                    }
                }
                return false;
            }
        });

        $("#checkAll").click(function () {
            $("[type='checkbox']").prop("checked", $('#checkAll').prop("checked"));//全选
            _firstLoad = true;
            // if(intervalId){
            //     clearTimeout(intervalId);
            // }
            addVehicles();
        });

        $(document).on("click", "#vehicle-status li", function () {
            statusSelected.removeClass("active");
            $(this).addClass("active");
            statusSelected = $(this);
            status_flag = $(this).attr('flag') === '' ? '' : $(this).attr('flag');
            // var regex = status_flag === '[1]' ? '[13]' : status_flag;
            // console.log(regex);
            // vehicle_table.api().search(regex, true).draw();
            vehicle_table.api().draw();
        });

        $('#accordion-icon').click(function () {
            // alert("accordion-toggle");
            collapsed = !collapsed;
            // alert(collapsed);
            if (collapsed) {
                $('#collapseOne').removeClass("in");
                $('#accordion-icon').removeClass("icon-arrow-up");
                $('#accordion-icon').addClass("icon-arrow-down");
            } else {
                $('#collapseOne').addClass("in");
                $('#accordion-icon').removeClass("icon-arrow-down");
                $('#accordion-icon').addClass("icon-arrow-up");
            }
            setTimeout(function () {
                windowResize();
            }, 300)
        });

        // if($.cookie())
        $('#map_type').val(mapType)
        $('#map_type').change(function () {
            $.cookie('map_type', this.value);
            history.go(0);
            // console.log(this.value)
        })


        $('#nodeSearch').on('click', function () {
            $("#divLose").dialog("open");
            $('#divLose').dialog('option', "title", i18next.t("map.node_search"))
            wimap.map.addEventListener("click", showInfo)
        })
        //地图初始化
        var center_point = { lon: lon, lat: lat };
        wimap = new wiseMap(map_type, document.getElementById('map_canvas'), center_point, 15);
        if (map_type == MAP_TYPE_BAIDU) {
            var geoc = wimap.geocoder;
            var local = new BMap.LocalSearch(wimap.map, {
                renderOptions: {},
            });
            var markeMessage = {};
            var selectMarker;
            var showInfo = function (e) {
                selectMarker ? wimap.map.removeOverlay(selectMarker) : null;
                var point = new BMap.Point(e.point.lng, e.point.lat);
                markeMessage.point = e.point;
                geoc.getLocation(e.point, function (rs) {
                    console.log(rs)
                    var addComp = rs.addressComponents;
                    var title = rs.surroundingPois[0] ? rs.surroundingPois[0].title : rs.address;
                    var _address = addComp.province + "" + addComp.city + "" + addComp.district + "" + addComp.street + "" + addComp.streetNumber
                    markeMessage.title = title;
                    // alert(addComp.province + ", " + addComp.city + ", " + addComp.district + ", " + addComp.street + ", " + addComp.streetNumber);
                    var content = "<div class=''><div class='wind'>";
                    content += "<p><span><font style='font-size: 15px;'>" + title + "</font></span>" + "                     " +
                        '<div>地址：' + _address + '</div></div></div>';

                    var infoWindow = new BMap.InfoWindow(content);  // 创建信息窗口对象
                    selectMarker = new BMap.Marker(point); // 创建点
                    wimap.map.addOverlay(selectMarker);    //增加点
                    selectMarker.openInfoWindow(infoWindow);
                });
            }
            var changeHour = function (_h) {
                var date = new Date();
                var h = date.getHours();
                var d = date.getDate();
                var m = date.getMonth();
                var y = date.getFullYear();
                var hh = h - _h;
                var dd = d - 1;
                var mm = m - 1;
                var yy = y - 1;
                if (hh >= 0) {
                    date.setHours(hh)
                } else {
                    date.setHours(24 + hh)
                    if (dd >= 0) {
                        date.setDate(dd)
                    } else {
                        if (mm >= -1) {
                            date.setMonth(mm)
                            date.setDate(date.getDate() + dd);
                        } else {
                            date.setMonth(11 + mm)
                            date.setFullYear(yy)
                        }
                    }
                }
                return date
            }
            // 初始化日期框
            $('.divStartTime').datetimepicker({
                language: $.cookie("lang"),
                weekStart: 1,
                todayBtn: 1,
                autoclose: 1,
                todayHighlight: 1,
                startView: 2,
                forceParse: 0,
                showMeridian: 1
            });
            $('#divStartTime').val(changeHour(8).format('yyyy-MM-dd hh:mm:ss'));
            $('.divEndTime').datetimepicker({
                language: $.cookie("lang"),
                weekStart: 1,
                todayBtn: 1,
                autoclose: 1,
                todayHighlight: 1,
                startView: 2,
                forceParse: 0,
                showMeridian: 1
            });
            $('#divEndTime').val(new Date().format('yyyy-MM-dd hh:mm:ss'));

            var addrSearch = function (id) {
                var searchMarker;
                $(id).typeahead({
                    source: function (query, process) {
                        $(id).val() == query && query ? local.search(query) : process([]);
                        var func = function (results) {
                            console.log(results)
                            console.log(results.getNumPois())
                            var names = [];
                            var poiNum = results.getNumPois();
                            for (var i = 0; i < 50; i++) {
                                var _currPoi = results.getPoi(i);
                                console.log(_currPoi)
                                if (_currPoi) {
                                    typeaheadNameOption[_currPoi.title] = {}
                                    typeaheadNameOption[_currPoi.title]["point"] = _currPoi.point;
                                    typeaheadNameOption[_currPoi.title]["address"] = _currPoi.address;
                                    names.push(_currPoi.title);
                                }
                            }
                            process(names)
                        }
                        local.setSearchCompleteCallback(func)
                        // local.setInfoHtmlSetCallback(func)
                    }
                });

                $(id).on('input', function (e) {
                    if (e.target.value == '') {
                        wimap.map.removeOverlay(searchMarker);
                    }
                });

                $(id).change(function (e) {
                    if (typeaheadNameOption[e.target.value]) {
                        wimap.map.removeOverlay(searchMarker);
                        var l_point = typeaheadNameOption[e.target.value].point;
                        var point = new BMap.Point(l_point.lng, l_point.lat)
                        wimap.map.centerAndZoom(point, 15);
                        searchMarker = new BMap.Marker(point); // 创建点
                        wimap.map.addOverlay(searchMarker);    //增加点
                    }
                    typeaheadNameOption = {}
                })
            }
            addrSearch('#lose_addr');
            addrSearch('#searchText');
            var buttons = {};
            buttons['确定'] = function () {
                searchVehicle()
            };
            buttons[i18next.t("system.cancel")] = function () {
                wimap.map.removeEventListener('click', showInfo)
                $(this).dialog("close");
            };
            $('#divLose').dialog({
                autoOpen: false,
                width: 450,
                buttons: buttons,
                close: function (event, ui) {
                    selectMarker ? wimap.map.removeOverlay(selectMarker) : null;
                    wimap.map.removeEventListener('click', showInfo)
                }
            });
            $('#divLoseList').dialog({
                autoOpen: false,
                width: 450,
                maxHeight: 450,
            });

            var list_i = 0;
            $('#addAddress').click(function () {
                if (!markeMessage.point) {
                    _alert('请选择途经点');
                    return;
                }
                var _thisloc = markeMessage.point.lng + ',' + markeMessage.point.lat;
                if (markePois.length && markePois[markePois.length - 1] == _thisloc) {
                    _alert('途经点相同，请选择不同途经点');
                    return;
                }
                list_i++;

                markePois.push(_thisloc);
                // var pointLeng = markePois.length;
                var id = 'list_' + list_i;
                var input_content =
                    `<div class="control-group">
                    <div class="controls">
                        <input disabled=true style="width:52%" type="text" value=${markeMessage.title} >
                        <button type="button" class="btn btn-primary" id=${id}>删除</button>
                    </div>
                </div>`;
                $('#address_list').append(input_content);
                // debugger;
                $('#' + id).click(function (e) {
                    $('#' + id).parent().parent().remove();
                    markePois.splice(markePois.indexOf(_thisloc), 1)
                })
            })
            wimap.traffic(40, 30)
            wimap.cityList(10, 170);
            wimap.distanceTool();
        } else if (map_type == MAP_TYPE_GAODE) {
            var distanceTool = wimap.distanceTool();
            $('#distanceTool').on('click', function () {
                // distanceTool.off();
                distanceTool.turnOn();
            })

        }
        var otherControl = setTimeout(() => {
            $('#cur_city_name').parent().addClass('br6');
            $('.otherControl').show();
            if (map_type === MAP_TYPE_BAIDU) {
                $('#lose_addr').show();
                $('#nodeSearch').show();
                $('#distanceTool').show();
            } else if (map_type == MAP_TYPE_GAODE) {
                $('#distanceTool').show();
            }
            clearTimeout(otherControl);
        }, 1000)
        // wimap.map.enableScrollWheelZoom();
        // wimap.map.enableInertialDragging();
        // wimap.map.enableContinuousZoom();
        // var size = new BMap.Size(170, 10);

        // wimap.map.addControl(new BMap.CityListControl({
        //     anchor: BMAP_ANCHOR_TOP_LEFT,
        //     offset: size,
        //     // 切换城市之间事件
        //     // onChangeBefore: function(){
        //     // },
        //     // 切换城市之后事件
        //     onChangeAfter: function () {
        //         var city = document.getElementById("cur_city_name");
        //     }
        // }));

        // console.log($('#cur_city_name'))
        // debugger;





        // // 百度地图API路况功能
        // // var size2 = new BMap.Size(30, 40);
        // // var ctrl = new BMapLib.TrafficControl({
        // //     showPanel: false, //是否显示路况提示面板,
        // //     anchor: BMAP_ANCHOR_TOP_RIGHT,
        // // });
        // // wimap.map.addControl(ctrl);
        // // ctrl.setOffset(size2)

        // //测距
        // // var myDis = new BMapLib.DistanceTool(wimap.map);
        // // $('#distanceTool').click(function () {
        // //     myDis.open();
        // // })


        // // 创建控件
        // var panoramaCtrl = new PanoramaControl();
        // panoramaCtrl.setOffset(new BMap.Size(124, 10))
        // // 添加到地图当中
        // wimap.map.addControl(panoramaCtrl);
        // //添加地图移动事件
        // var movePanorama = function (type, target) {
        //     panorama.setPosition(new BMap.Point(wimap.map.getCenter().lng, wimap.map.getCenter().lat));
        // };
        // wimap.map.addEventListener("moveend", movePanorama);
        // wimap.map.addEventListener("zoomend", movePanorama);
        // wimap.map.addEventListener("resize", movePanorama);
        // var _panorama = $("#panorama");
        // var windowobj = $(window);
        // map_canvasHeight = windowobj.height() - 80;
        // // browsCss(_panorama, map_canvasHeight);
        // _panorama.css({ "height": map_canvasHeight + "px" });

        //浏览器高度变化菜单栏对应改变
        // var map_canvas = $("#map_canvas");
        // var canvasHeight;
        // canvasHeight = $(window).height() - 80;
        // //刷新设置css
        // map_canvas.css({"height": canvasHeight + "px"});
        windowResize();
        //高度变化改变(要重新计算_browserheight)
        $(window).resize(function () {
            // canvasHeight = $(window).height() - 80;
            // map_canvas.css({"height": canvasHeight + "px"});
            windowResize();
        });

        // $('#customerKey').keydown(function (e) {
        //     var curKey = e.which;
        //     if (curKey == 13) {
        //         customerQuery();
        //         return false;
        //     }
        // });
        // $("#bind").click(function () {
        //     var device_id = $('#device_id').val();     //终端ID
        //     var obj_name = $('#obj_name').val();   //车牌号码
        //     var query_json = {
        //         objectId: obj_id
        //     };
        //     var update_json = {
        //         did: device_id.trim()
        //     };
        //     wistorm_api._update('vehicle', query_json, update_json, auth_code, true, function (json) {
        //         if (json.status_code == 0) {
        //             var uids = uid;
        //             if (tree_path != '') {
        //                 uids = tree_path.split(',').filter(function (item) { return item !== '' });
        //             }
        //             // 更新设置的vehicleId和vehicleName
        //             var now = new Date();
        //             var update = {
        //                 vehicleId: obj_id,
        //                 vehicleName: obj_name,
        //                 binded: true,
        //                 bindDate: now.format('yyyy-MM-dd hh:mm:ss'),
        //                 uid: uids
        //             };
        //             updateDevice(device_id, update, function (dev) {
        //                 if (dev.status_code == 0) {
        //                     _ok(i18next.t("vehicle.msg_bind_success"));
        //                     $('#device_id').attr("disabled", "disabled");
        //                     $('#bind').css("display", "none");
        //                     $('#unbind').css("display", "inline-block");
        //                     // vehicleQuery(uid, tree_path, is_depart);
        //                 } else {
        //                     _alert(i18next.t("vehicle.msg_bind_fail"), 2);
        //                 }
        //             });
        //         } else {
        //             _alert(i18next.t("vehicle.msg_bind_fail"), 2);
        //         }
        //     });
        // });
        // $("#unbind").click(function () {
        //     if (!CloseConfirm(i18next.t("vehicle.msg_confirm_unbind"))) {
        //         return;
        //     }
        //     var device_id = $('#device_id').val();     //终端ID
        //     var query_json = {
        //         objectId: obj_id
        //     };
        //     var update_json = {
        //         did: ''
        //     };
        //     wistorm_api._update('vehicle', query_json, update_json, auth_code, true, function (json) {
        //         if (json.status_code == 0) {
        //             // 更新设置的vehicleId和vehicleName
        //             var update = {
        //                 vehicleId: '',
        //                 vehicleName: '',
        //                 binded: false,
        //                 uid: '-' + uid
        //             };
        //             updateDevice(device_id, update, function (dev) {
        //                 if (dev.status_code == 0) {
        //                     _ok(i18next.t("vehicle.msg_unbind_success"));
        //                     $('#device_id').val('');
        //                     $('#device_id').removeAttr("disabled");
        //                     $('#bind').css("display", "inline-block");
        //                     $('#unbind').css("display", "none");
        //                     // vehicleQuery(uid, tree_path, is_depart);
        //                 } else {
        //                     _alert(i18next.t("vehicle.msg_unbind_fail"), 2);
        //                 }
        //             });
        //         } else {
        //             _alert(i18next.t("vehicle.msg_unbind_fail"), 2);
        //         }
        //     });
        // });
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

        buttons = {};
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
                vehicleEdit();
            }
            return false;
        });
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
                success: function (element) {
                    element
                        .text('OK!').addClass('valid')
                        .closest('.control-group').removeClass('error').addClass('success');
                    //alert('success');
                }
            });

        $('#searchKey').keydown(function (e) {
            var curKey = e.which;
            if (curKey == 13) {
                var key = '';
                if ($('#searchKey').val() !== '') {
                    key = $('#searchKey').val();
                }
                var _uid = uid;
                clearVehicles();
                vehicleQuery(_uid, is_depart);
                return false;
            }
        });

        _counts = {
            '': i18next.t("monitor.all_status"),
            '1': i18next.t("monitor.online_status"),
            '2': i18next.t("monitor.offline_status"),
            '3': i18next.t("monitor.alert_status")
        };

        customerQuery();
        getAllDepart();
        // 加载兴趣点
        loadPois();
        clearInterval(mtId);


    }, 100);
});


