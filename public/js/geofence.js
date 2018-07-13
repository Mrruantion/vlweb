/**
 * Created with JetBrains WebStorm.
 * User: 1
 * Date: 13-8-26
 * Time: 下午11:33
 * To change this template use File | Settings | File Templates.
 */

// if ($.cookie('lang') === 'zh' || $.cookie('lang') === 'zh-CN') {
//     $.getScript('js/DrawingManager.js');
// }

var _flag = 1;   //1: 新增  2: 修改
var _validator;
var _table;
var _tableGeofence;
var _tablePoi;
var _tableCheckPoint;
var _tableRoute;
var _id = 0;
var _name = '';
var _createdAt = '';
var _remark = '';
var lon = parseFloat($.cookie("lon")) || 113.84714;
var lat = parseFloat($.cookie("lat")) || 22.67805;
var drawingManager;
var auth_code = $.cookie('auth_code');
var updateTime = new Date(0);
var names = [];
var vehicles = [];
var _vehicles = {};
var _firstLoad = true;
var _overlayType = '1';
var _actionType = 1;  //1兴趣点，2|4围栏，5检查点，3线路
var typeDesc; // = ['', '兴趣点', '多边形', '折线', '圆形'];
var actionDesc; // = ['进出', '进', '出'];
var map_type = MAP_TYPE_BAIDU;
var map_engine = 'BAIDU';
var mapType = $.cookie('map_type'); 
var _clickTotal = 0;
var checkTotal;
var _editing = false;
var toggleEdit;
var amapEdit = false;

// 围栏查询
function _queryGeofence(key, type) {
    var query_json;
    if (key && key != "") {
        query_json = {
            uid: $.cookie('dealer_id'),
            type: type || '2|4',
            name: '^' + key
        };
    } else {
        query_json = {
            uid: $.cookie('dealer_id'),
            type: type || '2|4'
        };
    }
    wistorm_api._list('overlay', query_json, 'objectId,name,type,remark,createdAt,vehicleCount', '-createdAt', '-createdAt', 0, 0, 1, -1, auth_code, true, function (json) {
        if (type === '2|4') {
            var _columns = [
                {
                    "searchable": false,
                    "data": null,
                    "className": "center did",
                    "bSortable": false,
                    "render": function (obj) {
                        return "<input type='checkbox' id='" + obj.objectId + "' value='" + obj.objectId + "' name='" + obj.name + "' title='" + i18next.t("geofence.check") + "'>";
                    }
                },
                {
                    "searchable": false, "data": null, "className": "", "render": function (obj) {
                        return '<span class="name" title="' + i18next.t("geofence.dblclick_edit") + '">' + obj.name + '</span>';
                    }
                },
                {
                    "searchable": false, "data": null, "className": "center", "render": function (obj) {
                        return '<span title="' + i18next.t("geofence.dblclick_edit") + '">' + typeDesc[obj.type] + '</span>';
                    }
                },
                {
                    "searchable": false, "data": null, "className": "center", "render": function (obj) {
                        return '<span title="' + i18next.t("geofence.dblclick_edit") + '">' + new Date(obj.createdAt).format('yyyy-MM-dd') + '</span>';
                    }
                },
                {
                    "searchable": false, "data": null, "className": "center", "render": function (obj) {
                        var vehicleCount = obj.vehicleCount || 0;
                        return '<a class="vehicleCount" id="' + obj.objectId + '" name="' + obj.name + '" title="' + i18next.t("geofence.click_bind") + '">' + vehicleCount + '</a>';
                    }
                }
            ];
        } else if (type === '1') {
            var _columns = [
                {
                    "searchable": false,
                    "data": null,
                    "className": "center did",
                    "bSortable": false,
                    "render": function (obj) {
                        return "<input type='checkbox' id='" + obj.objectId + "' value='" + obj.objectId + "' name='" + obj.name + "' title='" + i18next.t("geofence.check") + "'>";
                    }
                },
                {
                    "searchable": false, "data": null, "className": "", "render": function (obj) {
                        return '<span class="name" title="' + i18next.t("geofence.dblclick_edit") + '">' + obj.name + '</span>';
                    }
                },
                {
                    "searchable": false, "data": null, "className": "center", "render": function (obj) {
                        return '<span title="' + i18next.t("geofence.dblclick_edit") + '">' + new Date(obj.createdAt).format('yyyy-MM-dd') + '</span>';
                    }
                }
            ];
        } else {
            var _columns = [
                {
                    "searchable": false,
                    "data": null,
                    "className": "center did",
                    "bSortable": false,
                    "render": function (obj) {
                        return "<input type='checkbox' id='" + obj.objectId + "' value='" + obj.objectId + "' name='" + obj.name + "' title='" + i18next.t("geofence.check") + "'>";
                    }
                },
                {
                    "searchable": false, "data": null, "className": "", "render": function (obj) {
                        return '<span class="name" title="' + i18next.t("geofence.dblclick_edit") + '">' + obj.name + '</span>';
                    }
                },
                {
                    "searchable": false, "data": null, "className": "center", "render": function (obj) {
                        return '<span title="' + i18next.t("geofence.dblclick_edit") + '">' + new Date(obj.createdAt).format('yyyy-MM-dd') + '</span>';
                    }
                },
                {
                    "searchable": false, "data": null, "className": "center", "render": function (obj) {
                        var vehicleCount = obj.vehicleCount || 0;
                        return '<a class="vehicleCount" id="' + obj.objectId + '" name="' + obj.name + '" title="' + i18next.t("geofence.click_bind") + '">' + vehicleCount + '</a>';
                    }
                }
            ];
        }

        var lang = i18next.language || 'zh-CN';
        var objTable = {
            "bInfo": false,
            "bLengthChange": false,
            "bProcessing": false,
            "bServerSide": false,
            "bFilter": true,
            "scrollY": true,
            "searching": true,//本地搜索
            "data": json.data,
            "aoColumns": _columns,
            "sDom": "<'row'r>t<'row'<'pull-right'p>>",
            "sPaginationType": "bootstrap",
            "oLanguage": { "sUrl": 'css/' + lang + '.txt' }
        };

        var __table;
        var __html;
        var __var;
        switch (type) {
            case '2|4':
                __var = '_tableGeofence';
                __table = _tableGeofence;
                __html = "#geofenceList";
                break;
            case '1':
                __var = '_tablePoi';
                __table = _tablePoi;
                __html = "#poiList";
                break;
            case '3':
                __var = '_tableRoute';
                __table = _tableRoute;
                __html = "#routeList";
                break;
            case '5':
                __var = '_tableCheckPoint';
                __table = _tableCheckPoint;
                __html = "#checkPointList";
        }

        if (__table) {
            __table.fnClearTable();
            if (json.data.length > 0) {
                __table.fnAddData(json.data);
            }
        } else {
            window[__var] = $(__html).dataTable(objTable);
            __table = window[__var];
            $(__html + ' tbody').on('click', 'tr', function () {
                if ($(this).hasClass('selected')) {
                    // $(this).removeClass('selected');
                }
                else {
                    __table.$('tr.selected').removeClass('selected');
                    $(this).addClass('selected');
                }
                _id = $(this).find(".did [type='checkbox']").val();
                _name = $(this).find(".name").html();
                // findGeofence(id);
                $("#binded").prop("checked", true);
                setAssignButton();
                _query();
            });
            $(__html + ' tbody').on('click', 'tr', function () {
                if ($(this).hasClass('selected')) {
                    // $(this).removeClass('selected');
                }
                else {
                    _tableGeofence.$('tr.selected').removeClass('selected');
                    $(this).addClass('selected');
                }
                _id = $(this).find(".did [type='checkbox']").val();
                _name = $(this).find(".name").html();
                findGeofence(_id, type);
            });
            $(__html + ' tbody').on('mouseover', 'tr', function () {
                $(this).css("cursor", "pointer");
            });
            $(__html + ' tbody').on('mouseout', 'tr', function () {
                $(this).css("cursor", "default");
            });
        }
    });
}

function findGeofence(id, type) {
    _id = id;
    var query_json = {
        objectId: id,
        type: type || '2|4'
    };
    wistorm_api._get('overlay', query_json, 'objectId,type,name,points,remark,opt,createdAt', auth_code, true, function (json) {
        if (json.data) {
            var radius = json.data.opt ? json.data.opt.radius || 0 : 0;
            var points = json.data.points;
            var name = json.data.name;
            var opt = json.data.opt;
            _type = json.data.type;
            _overlay = wimap.addOverlay(_type, points, radius, function (type, target) {
                //'半径：' + type.target.getRadius().toFixed(0) + '米'
                $('#typeInfo').html(i18next.t("geofence.radius", { radius: type.target.getRadius().toFixed(0) }));
            }, opt, name);
            var cp;
            if (_type === 1) {
                cp = _overlay.getPosition();
            } else if (_type === 4) {
                cp = _overlay.getCenter();
            } else if (_type === 2 || _type === 3 || _type === 5) {
                if (map_type === MAP_TYPE_BAIDU) {
                    cp = _overlay.getBounds().getCenter();
                } else if (map_type === MAP_TYPE_GOOGLE) {
                    var bounds = new google.maps.LatLngBounds();
                    var polygonCoords = _overlay.getPath().getArray();
                    for (i = 0; i < polygonCoords.length; i++) {
                        bounds.extend(polygonCoords[i]);
                    }
                    cp = bounds.getCenter();
                } else if (map_type === MAP_TYPE_GAODE) {
                    cp = _overlay.getBounds().getCenter();
                }
            }
            if (map_type === MAP_TYPE_BAIDU) {
                wimap.setCenter(cp.lng, cp.lat);
            } else if (map_type === MAP_TYPE_GOOGLE) {
                wimap.setCenter(cp.lng(), cp.lat());
            } else if (map_type === MAP_TYPE_GAODE) {
                wimap.setCenter(cp.lng, cp.lat);
            }
            // 打开编辑框
            // var createdAt = new Date(json.data.createdAt).format('yyyy-MM-dd hh:mm:ss');
            // initFrmGeofence(i18next.t("geofence.edit_geofence"), 2, json.data.name, '', json.data.remark, createdAt);
            // if(_type === 4){
            //     $('#type').val(i18next.t("geofence.circle"));
            //     $('#typeInfo').html(i18next.t("geofence.radius", {radius: _overlay.getRadius().toFixed(0)}));
            // }else if(_type === 2){
            //     $('#type').val(i18next.t("geofence.polygon"));
            //     $('#typeInfo').html('');
            // }
            // $("#divGeofence").dialog("open");
            // drawingManager.show();
            _name = json.data.name;
            _createdAt = json.data.createdAt;
            _remark = json.data.remark;
            _opt = json.data.opt;
        }
    });
}

// 设备查询
function _query(key, sort) {
    var query_json;
    var binded = $('#binded').prop("checked");
    if (key && key != "") {
        query_json = {
            uid: $.cookie('dealer_id'),
            vehicleName: '^' + key
        };
    } else {
        query_json = {
            uid: $.cookie('dealer_id')
        };
    }
    if (!sort) {
        sort = 'vehicleName';
    }
    if (binded) {
        query_json['geofences.id'] = _id;
    }
    wistorm_api._list('_iotDevice', query_json, 'objectId,vehicleId,vehicleName,did,geofences', 'vehicleName', 'vehicleName', 0, 0, 1, -1, auth_code, true, querySuccess);
}

var setAssignButton = function () {
    $('#assignDevices').attr('disabled', $("#binded").prop("checked"))
};

var isBinded = function (geofences, id) {
    var s = JSON.stringify(geofences);
    return s.indexOf(id) > -1;
};

var getActionType = function (geofences, id) {
    var obj = geofences.find(function (item) {
        return item.id === id;
    });
    return obj.type;
};

var querySuccess = function (json) {
    var j, _j, UnContacter, Uncontacter_tel;
    // vehicles = json.data;
    for (var i = 0; i < json.data.length; i++) {
        json.data[i].status = '0';
    }

    var binded = $('#binded').prop('checked');
    if (!binded) {
        json.data = json.data.filter(function (obj) {
            return !isBinded(obj.geofences, _id);
        });
    }

    var _columns = [
        {
            "searchable": false, "data": null, "className": "center did", "bSortable": false, "render": function (obj) {
                return isBinded(obj.geofences, _id) ? "<input type='checkbox' id='" + obj.did + "' value='" + obj.did + "' name='" + (obj.vehicleName || obj.did) + "' title='" + i18next.t("geofence.check") + "' checked>" : "<input type='checkbox' id='" + obj.did + "' value='" + obj.did + "' name='" + (obj.vehicleName || obj.did) + "' title='" + i18next.t("geofence.check") + "'>";
            }
        },
        {
            "searchable": false, "data": null, "className": "", "render": function (obj) {
                if (obj.vehicleName) {
                    return '<div style="width:150px;overflow:hidden;white-space:nowrap; text-overflow:ellipsis" title="' + obj.vehicleName + '">' + obj.vehicleName + '</div>';
                } else {
                    var name = obj.did;
                    return '<div style="width:150px;overflow:hidden;white-space:nowrap; text-overflow:ellipsis" title="' + name + '">' + name + '</div>';
                }
            }
        },
        {
            "searchable": false, "data": null, "className": "center", "render": function (obj) {
                return isBinded(obj.geofences, _id) ? actionDesc[getActionType(obj.geofences, _id)] : '';
            }
        },
        {
            "searchable": false, "data": null, "className": "center", "render": function (obj) {
                var geoCount = obj.geofences ? obj.geofences.length || 0 : 0;
                return '<a class="geoCount" id="' + obj.did + '" name="' + obj.vehicleName + '" title="' + i18next.t("geofence.click_geofence") + '">' + geoCount + '</a>';
            }
        },
        {
            "searchable": false, "data": null, "className": "center", "render": function (obj) {
                return isBinded(obj.geofences, _id) ? '<i did="' + obj.did + '" actionType="' + getActionType(obj.geofences, _id) + '" class="unbinded icon-remove" title="' + i18next.t("geofence.delete_bind") + '"></i>' : '';
            }
        }
    ];
    var lang = i18next.language || 'zh-CN';
    var objTable = {
        "bInfo": false,
        "bLengthChange": false,
        "bProcessing": false,
        "bServerSide": false,
        "bFilter": true,
        "scrollY": true,
        "searching": true,//本地搜索
        "data": json.data,
        "aoColumns": _columns,
        "sDom": "<'row'r>t<'row'<'pull-right'p>>",
        "sPaginationType": "bootstrap",
        "oLanguage": { "sUrl": 'css/' + lang + '.txt' }
    };

    if (_table) {
        _table.fnClearTable();
        if (json.data.length > 0) {
            _table.fnAddData(json.data);
        }
    } else {
        _table = $("#vehicleList").dataTable(objTable);
        $('#vehicleList tbody').on('dblclick', 'tr', function () {
            var did = $(this).find(".did [type='checkbox']").val();
            var query = {
                did: did,
                map: map_engine
            };
            wistorm_api._get('_iotDevice', query, 'vehicleName, activeGpsData', auth_code, true, function (json) {
                if (json.status_code === 0 && json.data && json.data.activeGpsData) {
                    var vehicleName = json.data.vehicleName || did;
                    wimap.addStartMarker(json.data.activeGpsData.lon, json.data.activeGpsData.lat, vehicleName);
                    wimap.setCenter(json.data.activeGpsData.lon, json.data.activeGpsData.lat);
                } else {
                    _alert(i18next.t("geofence.no_valid_location"), 2);
                }
            });
        });
        $('#vehicleList tbody').on('click', 'tr', function () {
            if ($(this).hasClass('selected')) {
            }
            else {
                _table.$('tr.selected').removeClass('selected');
                $(this).addClass('selected');
            }
        });
        $('#vehicleList tbody').on('mouseover', 'tr', function () {
            $(this).css("cursor", "pointer");
        });
        $('#vehicleList tbody').on('mouseout', 'tr', function () {
            $(this).css("cursor", "default");
        });
    }
};

function windowResize() {
    //高度变化改变(要重新计算_browserheight)
    windowHeight = $(window).height() - 215;
    // 如果宽度小于390，则设置表格为简易显示模式，并且客户列表高度改为300px
    windowWidth = $(window).width();
}

// 初始化目标信息窗体
var initFrmGeofence = function (title, flag, name, type, remark, createdAt, opt) {
    $("#divGeofence").dialog("option", "title", title);
    _flag = flag;
    $('#name').val(name);
    $('#type').val(type);
    $('#poiType').val(opt ? opt.type || '1' : '1');
    $('#width').val(opt ? opt.width || '0' : '0');
    $('#remark').val(remark);
    if (_flag === 1) {
        $('#pnlDate').hide();
    } else {
        $('#createdAt').val(createdAt);
        $('#createdAt').attr("disabled", "disabled");
        $('#pnlDate').show();
    }
    $('#divPoiType').hide();
    $('#divGeofenceType').hide();
    $('#divWidth').hide();
    if (_actionType === 1) {
        $('#divPoiType').show();
    } else if (_actionType === 2) {
        $('#divGeofenceType').show();
    } else if (_actionType === 3) {
        $('#divWidth').show();
    }
};

// 初始化关联信息窗体
var initFrmGeofenceAssign = function (title, overlayName, assginDevices) {
    $("#divGeofenceAssign").dialog("option", "title", title);
    $('#overlayName').val(overlayName);
    $('#assginDevices').val(assginDevices);
    var titleDesc = ['', i18next.t("geofence.poi"), i18next.t("geofence.geofence"), i18next.t("geofence.route"), i18next.t("geofence.geofence"), i18next.t("geofence.checkpoint")];
    var title = titleDesc[_actionType];
    $('#lblSelect').html(i18next.t("geofence.select_geofence", { type: title }));
};

// 新增围栏
var _add = function () {
    var dealerId = $.cookie('dealer_id');
    var name = $("#name").val();
    var remark = $("#remark").val();
    var type = _type;
    var poiType = $('#poiType').val();
    var width = parseInt($('#width').val() || 0);
    var points = [];
    var _points = [];
    var loc = {};
    var opt = {};
    opt.mapType = map_engine;
    if (type === 1) {
        opt.type = poiType;
        if (map_type === MAP_TYPE_BAIDU || map_type === MAP_TYPE_GAODE) {
            loc = { type: "Point", coordinates: [_overlay.getPosition().lng, _overlay.getPosition().lat] };
            _points.push([_overlay.getPosition().lng, _overlay.getPosition().lat]);
        } else if (map_type === MAP_TYPE_GOOGLE) {
            loc = { type: "Point", coordinates: [_overlay.getPosition().lng(), _overlay.getPosition().lat()] };
            _points.push([_overlay.getPosition().lng(), _overlay.getPosition().lat()]);
        }
        // else if (map_type === MAP_TYPE_GAODE) {

        // }
    } else if (type === 4) {
        opt.radius = _overlay.getRadius();
        if (map_type === MAP_TYPE_BAIDU || map_type === MAP_TYPE_GAODE) {
            loc = { type: "Point", coordinates: [_overlay.getCenter().lng, _overlay.getCenter().lat] };
            _points.push([_overlay.getCenter().lng, _overlay.getCenter().lat]);
        } else if (map_type === MAP_TYPE_GOOGLE) {
            loc = { type: "Point", coordinates: [_overlay.getCenter().lng(), _overlay.getCenter().lat()] };
            _points.push([_overlay.getCenter().lng(), _overlay.getCenter().lat()]);
        }
        // else if (map_type === MAP_TYPE_GAODE) {

        // }
    } else if (type === 2 || type === 3 || type === 5) {
        points = _overlay.getPath();
        if (map_type === MAP_TYPE_BAIDU || map_type === MAP_TYPE_GAODE) {
            if (type === 5) {
                for (var i = 0; i < 2; i++) {
                    _points.push([points[i].lng, points[i].lat]);
                }
            } else {
                for (var i = 0; i < points.length; i++) {
                    _points.push([points[i].lng, points[i].lat]);
                }
            }
        } else if (map_type === MAP_TYPE_GOOGLE) {
            points = points.getArray();
            if (type === 5) {
                for (var i = 0; i < 2; i++) {
                    _points.push([points[i].lng(), points[i].lat()]);
                }
            } else {
                for (var i = 0; i < points.length; i++) {
                    _points.push([points[i].lng(), points[i].lat()]);
                }
            }
        }
        // else if (map_type === MAP_TYPE_GAODE) {

        // }

        if (type === 2) {
            if (map_type === MAP_TYPE_BAIDU || map_type === MAP_TYPE_GAODE) {
                _points.push([points[0].lng, points[0].lat]);
            } else if (map_type === MAP_TYPE_GOOGLE) {
                _points.push([points[0].lng(), points[0].lat()]);
            }
            // else if (map_type === MAP_TYPE_GAODE) {

            // }
            loc = {
                type: "Polygon",
                coordinates: [_points]
            }
        } else {
            loc = {
                type: "LineString",
                coordinates: _points
            }
        }

        if (type === 3) {
            opt.width = width;
        }
    }
    // var wistorm_api = new WiStormAPI(app_key, app_secret, 'json', '2.0', 'md5', dev_key);
    var create_json = {
        uid: dealerId,
        name: name,
        type: type,
        points: _points,
        opt: opt,
        loc: loc,
        remark: remark,
        createdAt: new Date()
    };
    wistorm_api._createPost('overlay', create_json, auth_code, true, function (json) {
        if (json.status_code == 0) {
            $("#divGeofence").dialog("close");
            // wimap.map.clearOverlays();
            if (_overlay) {
                wimap.removeOverlay(_overlay);
            }
            drawingManager.hide();
            _queryGeofence('', _overlayType);
        } else {
            _alert(i18next.t("geofence.msg_add_fail"));
        }
    });
};

// 修改围栏
var _edit = function () {
    var name = $("#name").val();
    var remark = $("#remark").val();
    var type = _type;
    var poiType = $('#poiType').val();
    var width = parseInt($('#width').val() || 0);
    var points = [];
    var _points = [];
    var loc = {};
    var opt = {};
    opt.mapType = map_engine;
    if (type === 1) {
        opt.type = poiType;
        if (map_type === MAP_TYPE_BAIDU || map_type === MAP_TYPE_GAODE) {
            loc = { type: "Point", coordinates: [_overlay.getPosition().lng, _overlay.getPosition().lat] };
            _points.push([_overlay.getPosition().lng, _overlay.getPosition().lat]);
        } else if (map_type === MAP_TYPE_GOOGLE) {
            loc = { type: "Point", coordinates: [_overlay.getPosition().lng(), _overlay.getPosition().lat()] };
            _points.push([_overlay.getPosition().lng(), _overlay.getPosition().lat()]);
        }
        // else if (map_type === MAP_TYPE_GAODE) {
        //     loc = { type: "Point", coordinates: [_overlay.getPosition().lng, _overlay.getPosition().lat] };
        //     _points.push([_overlay.getPosition().lng, _overlay.getPosition().lat]);
        // }
    } else if (type === 4) {
        opt.radius = _overlay.getRadius();
        if (map_type === MAP_TYPE_BAIDU || map_type === MAP_TYPE_GAODE) {
            loc = { type: "Point", coordinates: [_overlay.getCenter().lng, _overlay.getCenter().lat] };
            _points.push([_overlay.getCenter().lng, _overlay.getCenter().lat]);
        } else if (map_type === MAP_TYPE_GOOGLE) {
            loc = { type: "Point", coordinates: [_overlay.getCenter().lng(), _overlay.getCenter().lat()] };
            _points.push([_overlay.getCenter().lng(), _overlay.getCenter().lat()]);
        }
        // else if (map_type === MAP_TYPE_GAODE) {
        //     loc = { type: "Point", coordinates: [_overlay.getCenter().lng, _overlay.getCenter().lat] };
        //     _points.push([_overlay.getCenter().lng, _overlay.getCenter().lat]);
        // }
    } else if (type === 2 || type === 3 || type === 5) {
        points = _overlay.getPath();
        if (map_type === MAP_TYPE_BAIDU || map_type === MAP_TYPE_GAODE) {
            if (type === 5) {
                for (var i = 0; i < 2; i++) {
                    _points.push([points[i].lng, points[i].lat]);
                }
            }else{
                for (var i = 0; i < points.length; i++) {
                    _points.push([points[i].lng, points[i].lat]);
                }
            }
           
        } else if (map_type === MAP_TYPE_GOOGLE) {
            points = points.getArray();
            if (type === 5) {
                for (var i = 0; i < 2; i++) {
                    _points.push([points[i].lng(), points[i].lat()]);
                }
            }else{
                for (var i = 0; i < points.length; i++) {
                    _points.push([points[i].lng(), points[i].lat()]);
                }
            }
            // for (var i = 0; i < points.length; i++) {
            //     _points.push([points[i].lng(), points[i].lat()]);
            // }
        }
        // else if (map_type === MAP_TYPE_GAODE) {
        //     for (var i = 0; i < points.length; i++) {
        //         _points.push([points[i].lng, points[i].lat]);
        //     }
        // }
        if (type === 2) {
            if (map_type === MAP_TYPE_BAIDU || map_type === MAP_TYPE_GAODE) {
                _points.push([points[0].lng, points[0].lat]);
            } else if (map_type === MAP_TYPE_GOOGLE) {
                _points.push([points[0].lng(), points[0].lat()]);
            }
            // else if (map_type === MAP_TYPE_GAODE) {
            //     _points.push([points[0].lng, points[0].lat]);
            // }
            loc = {
                type: "Polygon",
                coordinates: [_points]
            }
        } else {
            loc = {
                type: "LineString",
                coordinates: _points
            }
        }
        if (type === 3) {
            opt.width = width;
        }
    }
    var updatedAt = new Date();
    // var wistorm_api = new WiStormAPI(app_key, app_secret, 'json', '2.0', 'md5', dev_key);
    var query_json = {
        objectId: _id
    };
    var update_json = {
        name: name,
        type: type,
        points: _points,
        loc: loc,
        opt: opt,
        remark: remark,
        updatedAt: updatedAt
    };
    wistorm_api._updatePost('overlay', query_json, update_json, auth_code, true, function (json) {
        if (json.status_code == 0) {
            $("#divGeofence").dialog("close");
            // wimap.map.clearOverlays();
            if (_overlay) {
                wimap.removeOverlay(_overlay);
            }
            drawingManager.hide();
            _queryGeofence('', _overlayType);
        } else {
            _alert(i18next.t("geofence.msg_edit_fail"));
        }
    });
};

// 删除围栏
var _delete = function (_id) {
    var query_json = {
        objectId: _id
    };
    wistorm_api._delete('overlay', query_json, auth_code, true, function (json) {
        if (json.status_code === 0) {
            var query_json = {
                'geofences.id': _id
            };
            var updatedAt = new Date().format('yyyy-MM-dd hh:mm:ss');
            var update_json = {
                'geofences.$.id': '-' + _id,
                'geoUpdatedAt': updatedAt
            };
            wistorm_api._updatePost('_iotDevice', query_json, update_json, auth_code, true, function (json) {
                if (json.status_code == 0) {
                } else {
                    // _alert(i18next.t("geofence.msg_delete_fail"));
                    console.log(i18next.t("geofence.msg_delete_fail"));
                }
                if (_overlay) {
                    wimap.removeOverlay(_overlay);
                }
                _queryGeofence('', _overlayType);
                _query();
            });
        } else {
            _alert(i18next.t("geofence.msg_delete_fail"));
        }
    });
};

// 分配围栏
var _assign = function () {
    if (_id === 0) {
        _alert(i18next.t("geofence.msg_select_geofence"));
        return;
    }
    var query_json = getAssignDevices();
    var add_json = {
        id: _id,
        type: parseInt($('#actionType').val())
    };
    var updatedAt = new Date().format('yyyy-MM-dd hh:mm:ss');
    var update_json = {
        'geofences': '+' + JSON.stringify(add_json),
        'geoUpdatedAt': updatedAt
    };
    wistorm_api._updatePost('_iotDevice', query_json, update_json, auth_code, true, function (json) {
        if (json.status_code == 0) {
            query_json = {
                'geofences.id': _id
            };
            wistorm_api._count('_iotDevice', query_json, auth_code, true, function (dev) {
                var count = dev.count || 0;
                query_json = {
                    objectId: _id
                };
                update_json = {
                    vehicleCount: count
                };
                wistorm_api._update('overlay', query_json, update_json, auth_code, true, function (json) {
                    $("#divGeofenceAssign").dialog("close");
                    // _queryGeofence();
                    $("a#" + _id + ".vehicleCount").html(count);
                    $("#binded").prop("checked", true);
                    setAssignButton();
                    _query();
                });
            });
        } else {
            _alert(i18next.t("geofence.msg_bind_fail"), 3);
        }
    });
};

// 解绑围栏
var _unassign = function (did, actionType) {
    if (_id === 0) {
        _alert(i18next.t("geofence.msg_select_geofence"));
        return;
    }
    var query_json = {
        did: did
    };
    var add_json = {
        id: _id,
        type: actionType
    };
    var updatedAt = new Date().format('yyyy-MM-dd hh:mm:ss');
    var update_json = {
        'geofences': '-' + JSON.stringify(add_json),
        'geoUpdatedAt': updatedAt
    };
    wistorm_api._updatePost('_iotDevice', query_json, update_json, auth_code, true, function (json) {
        if (json.status_code == 0) {
            query_json = {
                'geofences.id': _id
            };
            wistorm_api._count('_iotDevice', query_json, auth_code, true, function (dev) {
                var count = dev.count || 0;
                query_json = {
                    objectId: _id
                };
                update_json = {
                    vehicleCount: count
                };
                wistorm_api._update('overlay', query_json, update_json, auth_code, true, function (json) {
                    $("#divGeofenceAssign").dialog("close");
                    // _queryGeofence();
                    $("a#" + _id + ".vehicleCount").html(count);
                    $("#binded").prop("checked", true);
                    _query();
                });
            });
        } else {
            _alert(i18next.t("geofence.msg_unbind_fail"), 3);
        }
    });
};

var clearVehicles = function () {
    _table.fnClearTable();
};

var clearGeofences = function () {
    _tableGeofence.fnClearTable();
};

var getSelectDevices = function () {
    var list = $("#vehicleList [type='checkbox']:checked");
    var devices = [];
    for (var i = 0; i < list.length; i++) {
        if (list[i].name && list[i].name !== '') {
            devices.push(list[i].name);
        }
    }
    return devices.join('\r\n');
};

var getAssignDevices = function () {
    var list = $("#vehicleList [type='checkbox']:checked");
    var devices = [];
    for (var i = 0; i < list.length; i++) {
        if (list[i].name && list[i].name !== '') {
            devices.push(list[i].id);
        }
    }
    return {
        'did': devices.join('|')
    };
};

var statusSelected;
var collapsed = true;
var wimap;
var _type = 0;  //0:没有选择 2:多边形 4：圆形 5：行政区划
var _drawed = false;
var _overlay;
var drawingManager;
var deviceShow = false;

function windowResize() {
    //高度变化改变(要重新计算_browserheight)
    var windowHeight = $(window).height() - 80;
    $('#map_canvas').css({ "height": windowHeight + "px" });
    $("#panorama").css({ "height": windowHeight + "px" });
    // 修改目标列表高度
    var height = $(window).height() - 220;
    setTimeout(() => { $('.dataTables_scrollBody').css({ "height": height + "px" }); }, 100)

}

function setButtonMode(mode) {
    var __add = '#addPoi';
    var __edit = '#editPoi';
    var __delete = '#delPoi';
    switch (_actionType) {
        case 1:
            __add = '#addPoi';
            __edit = '#editPoi';
            __delete = '#delPoi';
            break;
        case 2:
            __add = '#addGeofence';
            __edit = '#editGeofence';
            __delete = '#delGeofence';
            break;
        case 3:
            __add = '#addRoute';
            __edit = '#editRoute';
            __delete = '#delRoute';
            break;
        case 5:
            __add = '#addCheckPoint';
            __edit = '#editCheckPoint';
            __delete = '#delCheckPoint';
            break;
    }
    switch (mode) {
        case 0: //缺省
            $(__add).attr('disabled', false);
            $(__edit).attr('disabled', false);
            $(__delete).attr('disabled', false);
            break;
        case 1: //新增
            $(__add).attr('disabled', true);
            $(__edit).attr('disabled', true);
            $(__delete).attr('disabled', true);
            if (map_type === MAP_TYPE_BAIDU) {
                wimap.map.clearOverlays();
            } else if (map_type === MAP_TYPE_GOOGLE) {
                if (_overlay) {
                    _overlay.setMap(null);
                }
            } else if (map_type === MAP_TYPE_GAODE) {
                if (_overlay) {
                    _overlay.setMap(null);
                }
            }
            _drawed = false;
            break;
        case 2: //修改
            $(__add).attr('disabled', true);
            $(__edit).attr('disabled', true);
            $(__delete).attr('disabled', true);
            _drawed = true;
            break;
    }
}

function getBoundary(area) {
    var bdary = new BMap.Boundary();
    bdary.get(area, function (rs) {       //获取行政区域
        wimap.map.clearOverlays();        //清除地图覆盖物
        var count = rs.boundaries.length; //行政区域的点有多少个
        if (count === 0) {
            // alert('未能获取当前输入行政区域');
            return;
        }
        var pointArray = [];
        for (var i = 0; i < count; i++) {
            _overlay = new BMap.Polygon(rs.boundaries[i], { strokeWeight: 2, strokeColor: "#ff0000" }); //建立多边形覆盖物
            wimap.map.addOverlay(_overlay);  //添加覆盖物
            pointArray = pointArray.concat(_overlay.getPath());
        }
        wimap.map.setViewport(pointArray);    //调整视野
        _type = 2;
        $('#name').val(area);
        $('#type').val('行政区域');
        _drawed = true;
    });
}

$(document).ready(function () {
    $("#alert").hide();



    var geoId = setInterval(function () {
        $("#accordion-icon").hide();
        console.log('geo interval');
        if (!i18nextLoaded) {
            return;
        }
        clearInterval(geoId);

        $('#geofenceType a').click(function (e) {
            e.preventDefault();
            $(this).tab('show');
            // debugger;
            windowResize();
        });

        windowResize();

        typeDesc = ['', i18next.t("geofence.poi"), i18next.t("geofence.polygon"), i18next.t("geofence.route"), i18next.t("geofence.circle"), i18next.t("geofence.checkpoint")];
        titleDesc = ['', i18next.t("geofence.poi"), i18next.t("geofence.geofence"), i18next.t("geofence.route"), i18next.t("geofence.geofence"), i18next.t("geofence.checkpoint")];
        actionDesc = [i18next.t("geofence.in_out"), i18next.t("geofence.in"), i18next.t("geofence.out")];
        buttonType = {
            'addPoi': 1,
            'addGeofence': 2,
            'addRoute': 3,
            'addCheckPoint': 5,
            'editPoi': 1,
            'editGeofence': 2,
            'editRoute': 3,
            'editCheckPoint': 5
        };
        // customerQuery();
        _queryGeofence('', _overlayType);
        _query();

        $("#addGeofence, #addPoi, #addCheckPoint, #addRoute").click(function () {
            _actionType = buttonType[$(this).attr('id')];
            var title = titleDesc[_actionType];
            initFrmGeofence(i18next.t("geofence.add_geofence", { type: title }), 1, "", "");
            _validator.resetForm();
            $("#divGeofence").dialog("open");
            // 打开绘图工具
            amapEdit = false;
            drawingManager.show();
            setButtonMode(1);

        });

        $("#poiType").change(function () {
            var type = $(this).val();
            $("#poiIcon").attr("src", 'poi/' + type + '.png');
        });

        $("#editGeofence, #editPoi, #editCheckPoint, #editRoute").click(function () {
            _actionType = buttonType[$(this).attr('id')];
            var title = titleDesc[_actionType];
            var createdAt = new Date(_createdAt).format('yyyy-MM-dd hh:mm:ss');
            initFrmGeofence(i18next.t("geofence.edit_geofence", { type: title }), 2, _name, '', _remark, createdAt, _opt);
            if (_overlay && _actionType !== 3) {
                wimap.setEditable(_overlay);
            }
            if (_type === 4) {
                $('#type').val(i18next.t("geofence.circle"));
                $('#typeInfo').html(i18next.t("geofence.radius", { radius: _overlay.getRadius().toFixed(0) }));
            } else if (_type === 2) {
                $('#type').val(i18next.t("geofence.polygon"));
                $('#typeInfo').html('');
            }
            $("#divGeofence").dialog("open");
            amapEdit = true;
            drawingManager.show();
            setButtonMode(2);
        });

        $("#accordion-icon").click(function () {
            deviceShow = !deviceShow;
            if (deviceShow) {
                $("#vehiclePanel").show();
            } else {
                $("#vehiclePanel").hide();
            }
        });

        $("#deviceListClose").click(function () {
            deviceShow = false;
            $("#vehiclePanel").hide();
        });

        $("#delGeofence, #delPoi, #delCheckPoint, #delRoute").click(function () {
            var __list = ['', '#poiList', '#geofenceList', '#routeList', '#geofenceList', '#checkPointList'];
            var selected = $(__list[_actionType] + " [type='checkbox']:checked:not([id='checkAll'])");
            if (selected.length === 0) {
                _alert(i18next.t("geofence.msg_select_geofence"), 3);
                return;
            }
            var ids = [];
            for (var i = 0; i < selected.length; i++) {
                ids.push(selected[i].id);
            }
            var _ids = ids.join('|');
            if (selected.length === 1) {
                if (CloseConfirm(i18next.t("geofence.confirm_delete", { name: selected[0].name }))) {
                    _delete(_ids);
                }
            } else {
                if (CloseConfirm(i18next.t("geofence.confirm_delete2", { count: selected.length }))) {
                    _delete(_ids);
                }
            }
        });

        var buttons = {};
        buttons[i18next.t("system.save")] = function () {
            $('#frmGeofence').submit();
        };
        buttons[i18next.t("system.cancel")] = function () {
            $(this).dialog("close");
            if (map_type === MAP_TYPE_BAIDU) {
                drawingManager.close();
                drawingManager.hide();
                wimap.map.clearOverlays();
            } else if (map_type === MAP_TYPE_GOOGLE) {
                drawingManager.setOptions({
                    drawingMode: null
                });
                drawingManager.hide();
                if (_overlay) {
                    _overlay.setMap(null);
                }
            } else if (map_type === MAP_TYPE_GAODE) {
                drawingManager.hide();
                // wimap.map.clearMap();
            }
            setButtonMode(0);
        };
        $('#divGeofence').dialog({
            position: { my: "right-20 bottom-50", at: "right bottom", of: $('#map_canvas') },
            autoOpen: false,
            width: 380,
            buttons: buttons,
            close: function (event, ui) {
                if (map_type === MAP_TYPE_BAIDU) {
                    drawingManager.close();
                    drawingManager.hide();
                    wimap.map.clearOverlays();
                } else if (map_type === MAP_TYPE_GOOGLE) {
                    drawingManager.setOptions({
                        drawingMode: null
                    });
                    drawingManager.hide();
                    if (_overlay) {
                        _overlay.setMap(null);
                    }
                } else if (map_type === MAP_TYPE_GAODE) {
                    drawingManager.hide()
                }
                setButtonMode(0);
            }
        });

        $('#frmGeofence').submit(function () {
            if ($('#frmGeofence').valid()) {
                if (!_drawed) {
                    var typeDesc = ['', i18next.t("geofence.poi"), i18next.t("geofence.geofence"), i18next.t("geofence.route"), i18next.t("geofence.geofence"), i18next.t("geofence.checkpoint")];
                    _alert(i18next.t("geofence.msg_draw_geofence", { type: typeDesc[_actionType] }), 3);
                    return false;
                }
                if (_flag === 1) {
                    _add();
                } else {
                    _edit();
                }
                setButtonMode(0);
            }
            return false;
        });

        var buttons = {};
        buttons[i18next.t("system.save")] = function () {
            $('#frmGeofenceAssign').submit();
        };
        buttons[i18next.t("system.cancel")] = function () {
            $(this).dialog("close");
        };
        $('#divGeofenceAssign').dialog({
            autoOpen: false,
            width: 380,
            buttons: buttons
        });

        $('#frmGeofenceAssign').submit(function () {
            _assign();
            return false;
        });

        $("#assignDevices").click(function () {
            if (_id === 0) {
                _alert(i18next.t("geofence.msg_select_bind"), 3);
                return;
            }
            if (getSelectDevices() === '') {
                _alert(i18next.t("geofence.msg_select_vehicle"), 3);
                return;
            }
            initFrmGeofenceAssign(i18next.t("geofence.assign_vehicle"), _name, getSelectDevices());
            $("#divGeofenceAssign").dialog("open");
        });

        $("#binded").click(function () {
            setAssignButton();
            _query();
        });

        $("#checkAll").click(function () {
            $("#geofenceList [type='checkbox']").prop("checked", $('#checkAll').prop("checked"));//全选
        });

        $("#checkAll2").click(function () {
            $("#vehicleList [type='checkbox']").prop("checked", $('#checkAll2').prop("checked"));//全选
        });

        $(document).on("click", "#vehicle-status li", function () {
            statusSelected.removeClass("active");
            $(this).addClass("active");
            statusSelected = $(this);
            var flag = $(this).attr('flag') === '' ? '' : '[' + $(this).attr('flag') + ']';
            var regex = flag === '[1]' ? '[13]' : flag;
            // console.log(regex);
            vehicle_table.api().search(regex, true).draw();
        });

        $(document).on("click", "#vehicleList .icon-remove", function () {
            var did = $(this).attr("did");
            var actionType = parseInt($(this).attr("actionType"));
            if (CloseConfirm(i18next.t("geofence.confirm_delete_bind", { name: _name }))) {
                _unassign(did, actionType);
            }
        });

        $(document).on("click", "#geofenceList .vehicleCount", function () {
            $("#vehiclePanel").show();
        });

        //浏览器高度变化菜单栏对应改变
        // //刷新设置css

        windowResize();

        //高度变化改变(要重新计算_browserheight)
        $(window).resize(function () {
            // canvasHeight = $(window).height() - 80;
            // map_canvas.css({"height": canvasHeight + "px"});
            windowResize();
        });

        // map_type = $.cookie('lang') === 'zh' || $.cookie('lang') === 'zh-CN' ? MAP_TYPE_BAIDU : MAP_TYPE_GOOGLE;
        // map_engine = $.cookie('lang') === 'zh' || $.cookie('lang') === 'zh-CN' ? 'BAIDU' : 'GOOGLE';
        if (mapType) {
            map_type = mapType == 1 ? MAP_TYPE_BAIDU : mapType == 3 ? MAP_TYPE_GAODE : MAP_TYPE_GOOGLE;
            map_engine = mapType == 1 ? 'BAIDU' : 'GOOGLE';
        } else {
            map_type = $.cookie('lang') === 'zh' || $.cookie('lang') === 'zh-CN' ? MAP_TYPE_BAIDU : MAP_TYPE_GOOGLE;
            mapType = $.cookie('lang') === 'zh' || $.cookie('lang') === 'zh-CN' ? 1 : 2;
            map_engine = $.cookie('lang') === 'zh' || $.cookie('lang') === 'zh-CN' ? 'BAIDU' : 'GOOGLE';
        }
        $('#map_type').val(mapType)
        $('#map_type').change(function () {
            $.cookie('map_type', this.value);
            history.go(0);
        })
        var center_point = { lon: lon, lat: lat };
        wimap = new wiseMap(map_type, document.getElementById('map_canvas'), center_point, 15);
        // debugger;
        if (map_type === MAP_TYPE_BAIDU) {
            var cityList = new BMapLib.CityList({
                container: 'city_list',
                map: wimap.map
            });
            cityList.addEventListener("cityclick", function (e) {
                // alert(e.area_name);
                getBoundary(e.area_name);
            });
            // 多边形和矩形绘制
            var circlecomplete = function (e, overlay) {
                // lon = overlay.getPosition().lng;
                // lat = overlay.getPosition().lat;
                _overlay = overlay;
                _type = 4;
                // alert(overlay.getRadius());
                $('#type').val(i18next.t("geofence.circle"));
                $('#typeInfo').html(i18next.t("geofence.radius", { radius: overlay.getRadius().toFixed(0) }));
                overlay.enableEditing();
                overlay.addEventListener('lineupdate', function (type, target) {
                    // console.log(type.target.getRadius());
                    $('#typeInfo').html(i18next.t("geofence.radius", { radius: type.target.getRadius().toFixed(0) }));
                    _drawed = true;
                });
                drawingManager.close();
                _drawed = true;
            };

            var polygoncomplete = function (e, overlay) {
                // lon = overlay.getPosition().lng;
                // lat = overlay.getPosition().lat;
                // alert(overlay.getRadius());
                _overlay = overlay;
                _type = 2;
                $('#type').val(i18next.t("geofence.polygon"));
                overlay.enableEditing();
                drawingManager.close();
                _drawed = true;
            };
            var polylinecomplete = function (e, overlay) {
                // lon = overlay.getPosition().lng;
                // lat = overlay.getPosition().lat;
                // alert(overlay.getRadius());
                _overlay = overlay;
                _type = _actionType;
                overlay.enableEditing();
                drawingManager.close();
                _drawed = true;
            };
            var markercomplete = function (e, overlay) {
                // lon = overlay.getPosition().lng;
                // lat = overlay.getPosition().lat;
                // alert(overlay.getRadius());
                if (_overlay) {
                    wimap.removeOverlay(_overlay);
                }
                _overlay = overlay;
                _type = 1;
                // drawingManager.close();
                _drawed = true;
            };
            var styleOptions = {
                strokeColor: "red",    //边线颜色。
                fillColor: "red",      //填充颜色。当参数为空时，圆形将没有填充效果。
                strokeWeight: 3,       //边线的宽度，以像素为单位。
                strokeOpacity: 0.8,	   //边线透明度，取值范围0 - 1。
                fillOpacity: 0.6,      //填充的透明度，取值范围0 - 1。
                strokeStyle: 'solid' //边线的样式，solid或dashed。
            };

            var initDrawingManager = function () {
                if (BMapLib.DrawingManager) {
                    //实例化鼠标绘制工具
                    drawingManager = new BMapLib.DrawingManager(wimap.map, {
                        isOpen: false, //是否开启绘制模式
                        enableDrawingTool: true, //是否显示工具栏
                        enableCalculate: false,
                        drawingToolOptions: {
                            anchor: BMAP_ANCHOR_TOP_LEFT, //位置
                            offset: new BMap.Size(75, 10), //偏离值
                            drawingModes: [
                                // BMAP_DRAWING_MARKER,
                                BMAP_DRAWING_CIRCLE,
                                BMAP_DRAWING_POLYGON
                                // BMAP_DRAWING_POLYLINE
                            ]
                        },
                        circleOptions: styleOptions, //圆的样式
                        polylineOptions: styleOptions, //线的样式
                        polygonOptions: styleOptions, //多边形的样式
                        rectangleOptions: styleOptions //矩形的样式
                    });
                    //添加鼠标绘制工具监听事件，用于获取绘制结果
                    drawingManager.addEventListener('polygoncomplete', polygoncomplete);
                    drawingManager.addEventListener('circlecomplete', circlecomplete);
                    drawingManager.addEventListener('polylinecomplete', polylinecomplete);
                    drawingManager.addEventListener('markercomplete', markercomplete);
                    drawingManager.show = function () {
                        drawingManager.close();
                        switch (_actionType) {
                            case 1:
                                drawingManager.setDrawingMode(BMAP_DRAWING_MARKER);
                                setTimeout(function () {
                                    drawingManager.open();
                                }, 100);
                                break;
                            case 2:
                                $('.BMapLib_Drawing_panel').show();
                                $('#city_list').show();
                                break;
                            case 3:
                                toggleEdit = function (type, target, point, pixel) {
                                    _editing = !_editing;
                                    if (_editing) {
                                        wimap.setEditable(_overlay);
                                    } else {
                                        wimap.setDisable(_overlay);
                                    }
                                    event.stopPropagation();
                                };
                                setTimeout(function () {
                                    if (_flag == 1) {
                                        drawingManager.open();
                                        drawingManager.setDrawingMode(BMAP_DRAWING_POLYLINE);
                                    } else {
                                        drawingManager.open();
                                        var path = _overlay.getPath();
                                        // _overlay.addEventListener("dblclick", toggleEdit);
                                        google.maps.event.addListener(_overlay, 'dblclick', toggleEdit)
                                        drawingManager.setDrawingMode(BMAP_DRAWING_POLYLINE, path);
                                    }
                                }, 100);
                                break;
                            case 5:
                                _clickTotal = 0;
                                checkTotal = function () {
                                    _clickTotal++;
                                    if (_clickTotal === 2) {
                                        var evt = document.createEvent('MouseEvents');
                                        evt.initEvent('dblclick', true, true);
                                        drawingManager._isCheckPoint = true;
                                        drawingManager._mask.dispatchEvent(evt);
                                        drawingManager._isCheckPoint = false;
                                        wimap.map.removeEventListener("click", checkTotal);
                                    }
                                };
                                wimap.map.addEventListener("click", checkTotal);
                                drawingManager.setDrawingMode(BMAP_DRAWING_POLYLINE);
                                setTimeout(function () {
                                    drawingManager.open();
                                }, 100);
                                break;
                        }
                    };
                    drawingManager.hide = function () {
                        $('.BMapLib_Drawing_panel').hide();
                        $('#city_list').hide();
                    };
                } else {
                    setTimeout(initDrawingManager, 100);
                }
            };

            initDrawingManager();
        } else if (map_type === MAP_TYPE_GOOGLE) {
            // 多边形和矩形绘制
            var circlecomplete = function (overlay) {
                // lon = overlay.getPosition().lng;
                // lat = overlay.getPosition().lat;
                _overlay = overlay;
                _type = 4;
                // alert(overlay.getRadius());
                $('#type').val(i18next.t("geofence.circle"));
                $('#typeInfo').html(i18next.t("geofence.radius", { radius: overlay.getRadius().toFixed(0) }));
                // overlay.enableEditing();
                // overlay.addEventListener('lineupdate', function(type, target){
                //     // console.log(type.target.getRadius());
                //     $('#typeInfo').html(i18next.t("geofence.radius", {radius: type.target.getRadius().toFixed(0)}));
                // });
                // drawingManager.close();
                google.maps.event.addListener(overlay, 'radius_changed', function () {
                    $('#typeInfo').html(i18next.t("geofence.radius", { radius: _overlay.getRadius().toFixed(0) }));
                    _drawed = true;
                });
                drawingManager.setOptions({
                    drawingMode: null
                });
                _drawed = true;
            };
            var polygoncomplete = function (overlay) {
                // lon = overlay.getPosition().lng;
                // lat = overlay.getPosition().lat;
                // alert(overlay.getRadius());
                _overlay = overlay;
                _type = 2;
                $('#type').val(i18next.t("geofence.polygon"));
                // overlay.enableEditing();
                drawingManager.setOptions({
                    drawingMode: null
                });
                _drawed = true;
            };
            var polylinecomplete = function (overlay) {
                // lon = overlay.getPosition().lng;
                // lat = overlay.getPosition().lat;
                // alert(overlay.getRadius());
                // alert('polyline');
                _overlay = overlay;
                _type = _actionType;
                drawingManager.setOptions({
                    drawingMode: null
                });
                _drawed = true;
            };
            var markercomplete = function (overlay) {
                // lon = overlay.getPosition().lng;
                // lat = overlay.getPosition().lat;
                // alert('marker');
                if (_overlay) {
                    wimap.removeOverlay(_overlay);
                }
                _overlay = overlay;
                _type = 1;
                // drawingManager.close();
                _drawed = true;
            };
            var styleOptions = {
                fillColor: 'red',
                fillOpacity: 0.6,
                strokeWeight: 3,
                clickable: false,
                editable: true,
                zIndex: 1
            };
            drawingManager = new google.maps.drawing.DrawingManager({
                // drawingMode: google.maps.drawing.OverlayType.MARKER,
                drawingControl: false,
                drawingControlOptions: {
                    position: google.maps.ControlPosition.TOP_LEFT,
                    drawingModes: ['circle', 'polygon']
                },
                circleOptions: styleOptions, //圆的样式
                polygonOptions: styleOptions, //线的样式
                polylineOptions: styleOptions
            });
            drawingManager.setMap(wimap.map);
            google.maps.event.addListener(drawingManager, 'polygoncomplete', polygoncomplete);
            google.maps.event.addListener(drawingManager, 'circlecomplete', circlecomplete);
            google.maps.event.addListener(drawingManager, 'markercomplete', markercomplete);
            google.maps.event.addListener(drawingManager, 'polylinecomplete', polylinecomplete);
            // drawingManager.show = function(){
            //     drawingManager.setOptions({
            //         drawingControl: true
            //     });
            // };
            drawingManager.show = function () {
                switch (_actionType) {
                    case 1:
                        drawingManager.setDrawingMode(google.maps.drawing.OverlayType.MARKER);
                        break;
                    case 2:
                        drawingManager.setOptions({
                            drawingControl: true
                        });
                        break;
                    case 3:
                        toggleEdit = function (type, target, point, pixel) {
                            _editing = !_editing;
                            if (_editing) {
                                wimap.setEditable(_overlay);
                            } else {
                                wimap.setDisable(_overlay);
                            }
                            event.stopPropagation();
                        };
                        setTimeout(function () {
                            if (_flag == 1) {
                                drawingManager.setDrawingMode(google.maps.drawing.OverlayType.POLYLINE);
                            } else {
                                var path = _overlay.getPath();
                                // _overlay.addEventListener("dblclick", toggleEdit);
                                google.maps.event.addListener(_overlay, 'dblclick', toggleEdit)
                                drawingManager.setDrawingMode(google.maps.drawing.OverlayType.POLYLINE, path);
                            }
                        }, 100);
                        break;
                    case 5:
                        _clickTotal = 0;
                        checkTotal = function () {
                            _clickTotal++;
                            alert(_clickTotal);
                            // if(_clickTotal === 2){
                            //     drawingManager.setDrawingMode('null');
                            // }else{
                            //     alert(_clickTotal);
                            // }
                        };
                        drawingManager.setDrawingMode(google.maps.drawing.OverlayType.POLYLINE);
                        // wimap.map.addListener("click", checkTotal);
                        break;
                }
            };
            drawingManager.hide = function () {
                drawingManager.setOptions({
                    drawingControl: false
                });
            };
        } else if (map_type === MAP_TYPE_GAODE) {

            var mouseTool = new AMap.MouseTool(wimap.map);   //在地图中添加MouseTool插件
            var styleOptions = {
                strokeColor: "red",    //边线颜色。
                fillColor: "red",      //填充颜色。当参数为空时，圆形将没有填充效果。
                strokeWeight: 3,       //边线的宽度，以像素为单位。
                strokeOpacity: 0.8,	   //边线透明度，取值范围0 - 1。
                fillOpacity: 0.6,      //填充的透明度，取值范围0 - 1。
                strokeStyle: 'solid' //边线的样式，solid或dashed。
            };
            var drawPlay;
            var drawEdit;
            // drawPolyline = mouseTool.polyline(); //用鼠标工具画折线

            // console.log(polylineEditor)
            AMap.event.addListener(mouseTool, 'draw', function (e) { //添加事件
                _overlay = e.obj;
                drawingManager._circleAndPolygoninit();
                var _atype = e.obj.CLASS_NAME
                // wimap.map.clearMap();
                // console.log(e.obj.getPath());//获取路径/范围
                if (_type === 4) {
                    $('#type').val(i18next.t("geofence.circle"));
                    $('#typeInfo').html(i18next.t("geofence.radius", { radius: _overlay.getRadius().toFixed(0) }));
                } else if (_type === 2) {
                    $('#type').val(i18next.t("geofence.polygon"));
                    $('#typeInfo').html('');
                }
                mouseTool.close();
                _drawed = true;
                switch (_atype) {
                    case 'AMap.Polyline': //折线 3 5
                        drawingManager.edit(_actionType);
                        // mouseTool.close();
                        // _drawed = true;
                        break;
                    case 'AMap.Circle': //园 4
                        drawingManager.edit(4);
                        // $('#type').val(i18next.t("geofence.circle"));
                        // mouseTool.close();
                        break;
                    case "AMap.Marker": //兴趣点 1
                        // alert('marker')
                        // _drawed = true;
                        drawingManager.edit(1)
                        wimap.map.clearMap();
                        _overlay.setMap(wimap.map)
                        break;
                    case 'AMap.Polygon': //多边形 2
                        drawingManager.edit(2);
                        // mouseTool.close();
                        break;
                }
                
            });
            drawingManager = {};
        

            drawingManager.edit = function (type) {
                _type = type;
                switch (type) {
                    case 1:
                        // wimap.map.clearMap();
                        mouseTool.marker();
                        break;
                    case 4:
                        drawEdit = new AMap.CircleEditor(wimap.map, _overlay);
                        drawEdit.open()
                        break;
                    case 2:
                    case 3:
                    case 5:
                        drawEdit = _overlay.CLASS_NAME == "AMap.Circle" ? new AMap.CircleEditor(wimap.map, _overlay) : new AMap.PolyEditor(wimap.map, _overlay)
                        // drawEdit = new AMap.PolyEditor(wimap.map, _overlay);
                        drawEdit.open()
                        break;
                }
                if (drawEdit) {
                    drawEdit.on('end', function (e) {
                        console.log(e);
                        debugger;
                        _overlay = e.target;
                    })
                    drawEdit.on('adjust', function (e) {
                        console.log(e);
                        _overlay = e.target;
                        if(e.target.CLASS_NAME == 'AMap.Polygon'){
                            _type = 2;
                        }else if(e.target.CLASS_NAME == "AMap.Circle"){
                            _type = 4;
                        }
                        if (_type === 4) {
                            $('#type').val(i18next.t("geofence.circle"));
                            $('#typeInfo').html(i18next.t("geofence.radius", { radius: _overlay.getRadius().toFixed(0) }));
                        } else if (_type === 2) {
                            $('#type').val(i18next.t("geofence.polygon"));
                            $('#typeInfo').html('');
                        }
                        
                    })
                }
            }

            drawingManager.add = function (type) {
                _type = type;
                switch (type) {
                    case 1:
                        mouseTool.marker();
                        break;
                    case 2:
                        $('.AMapLib_Drawing_panel').show()
                        // drawPlay = mouseTool.polygon(styleOptions);
                        // drawPlay = mouseTool.circle(styleOptions)
                        break;
                    case 3:
                        drawPlay = mouseTool.polyline(styleOptions);
                        break;
                    case 5:
                        drawPlay = mouseTool.polyline(styleOptions);
                        break;
                }
            }
            drawingManager.show = function () {
                if (amapEdit && _overlay) { //修改
                    drawingManager.edit(_type)
                } else { //新增
                    drawingManager.add(_actionType)
                }
            };

            drawingManager._circleAndPolygon = function() {
                var moduleHtml = `<div class="AMapLib_Drawing_panel" style="display: none;">
                                <a class="AMapLib_box AMapLib_hander" drawingtype="hander" href="javascript:void(0)" title="拖动地图" onfocus="this.blur()"></a>
                                <a class="AMapLib_box AMapLib_circle" drawingtype="circle" href="javascript:void(0)" title="画圆" onfocus="this.blur()"></a>
                                <a class="AMapLib_last AMapLib_box AMapLib_polygon" drawingtype="polygon" href="javascript:void(0)" title="画多边形" onfocus="this.blur()" style="border-right:0"></a>
                            </div>`
                $('#map_canvas').append(moduleHtml);
                $('.AMapLib_Drawing_panel a').on('click',function() {
                    var drawingtype = $(this).attr('drawingtype');
                    var oldClass =  $(this).attr('class');
                    // var toggleClass = oldClass.indexOf('_hover') > -1 ? oldClass.slice(0,oldClass.indexOf('_hover')) : oldClass + '_hover';
                    var toggleClass = oldClass.indexOf('_hover') > -1 ? oldClass : $(this).attr('class') + '_hover';
                    $(this).attr('class',toggleClass)
                    var preClass = 'AMapLib_box AMapLib_'+$($(this).siblings()[0]).attr('drawingtype');
                    var preClass2 = 'AMapLib_box AMapLib_'+$($(this).siblings()[1]).attr('drawingtype');
                    $($(this).siblings()[0]).attr('class',preClass);
                    $($(this).siblings()[1]).attr('class',preClass2);

                    // console.log(drawingtype)
                    if(drawingtype == 'circle'){
                        mouseTool.circle(styleOptions);
                        _type = 4;
                    }else if(drawingtype == 'polygon'){
                        drawPlay = mouseTool.polygon(styleOptions);
                        _type = 2;
                    }else {
                        mouseTool.close();
                    }
                })
            }
            drawingManager._circleAndPolygoninit = function() {
                $($('.AMapLib_Drawing_panel a')[0]).attr('class','AMapLib_box AMapLib_hander_hover');
                $($('.AMapLib_Drawing_panel a')[1]).attr('class','AMapLib_box AMapLib_circle');
                $($('.AMapLib_Drawing_panel a')[2]).attr('class','AMapLib_box AMapLib_polygon');
            }
            drawingManager._circleAndPolygon();
            drawingManager.hide = function () {
                mouseTool.close();
                wimap.map.clearMap();
                drawEdit = null;
                $('.AMapLib_Drawing_panel').hide();
                drawingManager._circleAndPolygoninit();
            };
        }

        $(document).on("click", "#geofenceType li", function () {
            _overlayType = $(this).attr('type');
            $("#accordion-icon").hide();
            switch (_overlayType) {
                case '2|4':
                    _actionType = 2;
                    $("#accordion-icon").show();
                    break;
                case '1':
                    _actionType = 1;
                    break;
                case '3':
                    _actionType = 3;
                    $("#accordion-icon").show();
                    break;
                case '5':
                    _actionType = 5;
                    $("#accordion-icon").show();
            }
            _queryGeofence('', _overlayType);
        });

        $('#searchVehicle').keydown(function (e) {
            var curKey = e.which;
            if (curKey === 13) {
                var key = '';
                if ($('#searchVehicle').val() !== '') {
                    key = $('#searchVehicle').val();
                }
                clearVehicles();
                _query(key);
                return false;
            }
        });

        $('#searchGeofence').keydown(function (e) {
            var curKey = e.which;
            if (curKey === 13) {
                var key = '';
                if ($('#searchGeofence').val() !== '') {
                    key = $('#searchGeofence').val();
                }
                clearGeofences();
                _queryGeofence(key, _overlayType);
                return false;
            }
        });

        _validator = $('#frmGeofence').validate(
            {
                rules: {
                    name: {
                        required: true
                    }
                },
                messages: {
                    name: { required: i18next.t("geofence.name_required") }
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
    }, 10);
});


