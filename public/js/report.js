/**
 * Created with JetBrains WebStorm.
 * User: 1
 * Date: 13-8-26
 * Time: 下午11:33
 * To change this template use File | Settings | File Templates.
 */

var today = new Date();
var yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);

// 修改预约
var _dealAlert = function (objectId, callback) {
    var query_json = {
        objectId: objectId
    };
    var update_json = {
        alertUndeal: false
    };
    wistorm_api._update('_iotDevice', query_json, update_json, auth_code, true, function (json) {
        if (json.status_code == 0) {
            return callback();
        } else {
            return callback("清除报警失败，请稍后再试");
        }
    });
};

var showLocation = function showLocation(thisID, address) {
    thisID.html(address);
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
        $(".endlocUpdate").each(function (i) {
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

function windowResize() {
    //高度变化改变(要重新计算_browserheight)
    windowHeight = $(window).height() - 215;
    // 如果宽度小于390，则设置表格为简易显示模式，并且客户列表高度改为300px
    windowWidth = $(window).width();
}

var _report;

var makeReport = function (type, uid, vid) {
    // $('#toolbar .row-fluid:first').show();
    $('#customer_name')
    $('#export').hide()
    switch (type) {
        case 1: //日统计表
            // 创建日统计表表格
            var fields = [
                {
                    title: i18next.t("vehicle.name"),
                    width: '100px',
                    name: 'vehicleName',
                    className: 'center',
                    display: 'TextBox'
                },
                {
                    title: i18next.t("monitor.date"),
                    width: '100px',
                    name: 'day',
                    className: 'center',
                    display: 'TextBox'
                },
                {
                    title: i18next.t("report.day_duration"),
                    width: '100px',
                    name: 'distance',
                    className: 'center',
                    display: 'TextBox'
                },
                {
                    title: i18next.t("alert.virbrate"),
                    width: '100px',
                    name: 'alert1',
                    className: 'center',
                    display: 'TextBox'
                },
                {
                    title: i18next.t("alert.overspeed"),
                    width: '100px',
                    name: 'alert2',
                    className: 'center',
                    display: 'TextBox'
                },
                {
                    title: i18next.t("alert.geo"),
                    width: '100px',
                    name: 'alert3',
                    className: 'center',
                    display: 'TextBox'
                },
                {
                    title: i18next.t("alert.lowpower"),
                    width: '100px',
                    name: 'alert4',
                    className: 'center',
                    display: 'TextBox'
                },
                {
                    title: i18next.t("alert.cutpower"),
                    width: '100px',
                    name: 'alert5',
                    className: 'center',
                    display: 'TextBox'
                }
            ];
            var buttons = {
                show: false //是否显示列表按钮
            };
            var uButtons = [];
            var div = $('#list');
            var query = {
                uid: uid,
                vehicleName: '<>null'
            };

            if (vid && vid > 0) {
                query = {
                    vehicleId: vid
                }
            }

            _report = new _dataTable(div, '_iotDevice', fields, query, 'vehicleName', $('#vehicleKey'), 'vehicleName', buttons, uButtons);
            _report.createHeader();
            _report.sFields = 'did,vehicleName'; //重新设置初始查询返回字段
            _report.query(query, function (json) {
                // 对数据进行后置处理
            }, function (json, callback) {
                var dids = '';
                for (var i = 0; i < json.data.length; i++) {
                    dids += json.data[i].did + '|';
                }
                var startTime = $('#startTime').val();
                var endTime = $('#endTime').val();
                var query = {
                    did: dids,
                    day: startTime + '@' + endTime
                };
                var auth_code = $.cookie('auth_code');
                wistorm_api._list('_iotStat', query, 'did,day,distance,alertTotal', '-did', 'did', 0, 0, 0, -1, auth_code, true, function (stat) {
                    var _stat = {};
                    if (stat && stat.data.length > 0) {
                        for (var i = 0; i < stat.data.length; i++) {
                            _stat[stat.data[i].did] = stat.data[i];
                        }
                    }
                    for (var j = 0; j < json.data.length; j++) {
                        var s = _stat[json.data[j].did];
                        if (s) {
                            json.data[j].day = new Date(s.day).format('yyyy-MM-dd');
                            json.data[j].vehicleName = json.data[j].vehicleName || json.data[j].did;
                            json.data[j].distance = s.distance;
                            json.data[j].alert1 = s.alertTotal ? s.alertTotal[IOT_ALERT.ALERT_VIRBRATE.toString()] || 0 : 0;
                            json.data[j].alert2 = s.alertTotal ? s.alertTotal[IOT_ALERT.ALERT_OVERSPEED.toString()] || 0 : 0;
                            json.data[j].alert3 = s.alertTotal ? (s.alertTotal[IOT_ALERT.ALERT_ENTERGEO.toString()] || 0 + s.alertTotal[IOT_ALERT.ALERT_EXITGEO.toString()] || 0) : 0;
                            json.data[j].alert4 = s.alertTotal ? s.alertTotal[IOT_ALERT.ALERT_LOWPOWER.toString()] || 0 : 0;
                            json.data[j].alert5 = s.alertTotal ? s.alertTotal[IOT_ALERT.ALERT_CUTPOWER.toString()] || 0 : 0;
                        } else {
                            // json.data[j].day = yesterday.format('yyyy-MM-dd');
                            json.data[j].day = new Date(startTime).format('yyyy-MM-dd')
                            json.data[j].vehicleName = json.data[j].vehicleName || json.data[j].did;
                            json.data[j].distance = 0;
                            json.data[j].alert1 = 0;
                            json.data[j].alert2 = 0;
                            json.data[j].alert3 = 0;
                            json.data[j].alert4 = 0;
                            json.data[j].alert5 = 0;
                        }
                    }
                    callback(json);
                });
            });
            break;
        case 2: //报警详情
            var fields = [
                {
                    title: i18next.t("alert.alert_type"),
                    width: '100px',
                    name: 'alertType',
                    className: 'center',
                    display: 'UserDefined',
                    render: function (obj) {
                        var data = obj.aData ? obj.aData : obj;
                        return IOT_ALERT_DESC[data.alertType.toString()];
                    }
                },
                {
                    title: i18next.t("alert.alert_time"),
                    width: '160px',
                    name: 'createdAt',
                    className: 'center',
                    display: 'UserDefined',
                    render: function (obj) {
                        var data = obj.aData ? obj.aData : obj;
                        return new Date(data.createdAt).format('yyyy-MM-dd hh:mm:ss');
                    }
                },
                {
                    title: i18next.t("monitor.speed"),
                    width: '100px',
                    name: 'speed',
                    className: 'center',
                    display: 'UserDefined',
                    render: function (obj) {
                        var data = obj.aData ? obj.aData : obj;
                        return data.speed.toFixed(1) + ' km/h';
                    }
                },
                {
                    title: i18next.t("monitor.location"),
                    width: '',
                    name: 'lon',
                    className: 'locUpdate',
                    display: 'UserDefined',
                    render: function (obj) {
                        var data = obj.aData ? obj.aData : obj;
                        return data.lon.toFixed(6) + ', ' + data.lat.toFixed(6);
                    }
                }
            ];
            var alertType = $('#alertType').val();
            if (alertType === '12295|12296') {
                fields = [
                    {
                        title: i18next.t("alert.alert_type"),
                        width: '100px',
                        name: 'alertType',
                        className: 'center',
                        display: 'UserDefined',
                        render: function (obj) {
                            var data = obj.aData ? obj.aData : obj;
                            return IOT_ALERT_DESC[data.alertType.toString()];
                        }
                    },
                    {
                        title: i18next.t("report.alert_time"),
                        width: '160px',
                        name: 'createdAt',
                        className: 'center',
                        display: 'UserDefined',
                        render: function (obj) {
                            var data = obj.aData ? obj.aData : obj;
                            return new Date(data.createdAt).format('yyyy-MM-dd hh:mm:ss');
                        }
                    },
                    {
                        title: i18next.t("report.geo_name"),
                        width: '200px',
                        name: 'targetName',
                        className: 'center',
                        display: 'UserDefined',
                        render: function (obj) {
                            var data = obj.aData ? obj.aData : obj;
                            return data.targetName || '';
                        }
                    },
                    {
                        title: i18next.t("monitor.location"),
                        width: '',
                        name: 'location',
                        className: 'locUpdate',
                        display: 'UserDefined',
                        render: function (obj) {
                            var data = obj.aData ? obj.aData : obj;
                            return data.lon.toFixed(6) + ', ' + data.lat.toFixed(6);
                        }
                    }
                ];
            }
            var buttons = {
                show: false //是否显示列表按钮
            };
            var uButtons = [];
            var div = $('#list');
            var startTime = $('#startTime').val();
            var endTime = $('#endTime').val();
            var query = {
                did: _did,
                createdAt: startTime + '@' + endTime,
                map: 'BAIDU'
            };
            if (alertType != '') {
                query.alertType = alertType;
            }

            _report = new _dataTable(div, '_iotAlert', fields, query, '-createdAt', $('#vehicleKey'), 'createdAt', buttons, uButtons);
            _report.createHeader();
            var alertDisplay = 'enum' + JSON.stringify(IOT_ALERT_DESC);
            var speedFunction = function () {
                return parseFloat(v).toFixed(1) + ' km/h';
            };
            if (alertType === '12295|12296') {
                _report.sFields = 'alertType,createdAt,targetName,location,lon,lat,did'; //重新设置初始查询返回字段
                _report.setExportFields('alertType,createdAt,targetName,location,lon,lat,did');
                _report.setExportDisplays(alertDisplay + '#d#f2#s#s');
            } else {
                _report.sFields = 'alertType,createdAt,speed,location,lon,lat,did'; //重新设置初始查询返回字段
                _report.setExportFields('alertType,createdAt,speed,location,lon,lat,did');
                _report.setExportDisplays(alertDisplay + '#d#' + speedFunction.toString() + '#s');
            }
            if (_did === '') return;
            _report.query(query, function (json) {
                // 对数据进行后置处理
                updateLoc();
            });
            break;
        case 4: //轨迹报表
            var fields = [
                {
                    title: i18next.t("monitor.gps_time"),
                    width: '100px',
                    name: 'gpsTime',
                    className: 'center',
                    display: 'UserDefined',
                    render: function (obj) {
                        var data = obj.aData ? obj.aData : obj;
                        return new Date(data.gpsTime).format('MM-dd hh:mm:ss');
                    }
                },
                {
                    title: i18next.t("monitor.rcv_time"),
                    width: '100px',
                    name: 'rcvTime',
                    className: 'center',
                    display: 'UserDefined',
                    render: function (obj) {
                        var data = obj.aData ? obj.aData : obj;
                        return new Date(data.rcvTime).format('MM-dd hh:mm:ss');
                    }
                },
                {
                    title: i18next.t("monitor.lon"),
                    width: '80px',
                    name: 'lon',
                    className: 'center',
                    display: 'UserDefined',
                    render: function (obj) {
                        var data = obj.aData ? obj.aData : obj;
                        return data.lon.toFixed(6)
                    }
                },
                {
                    title: i18next.t("monitor.lat"),
                    width: '80px',
                    name: 'lat',
                    className: 'center',
                    display: 'UserDefined',
                    render: function (obj) {
                        var data = obj.aData ? obj.aData : obj;
                        return data.lat.toFixed(6);
                    }
                },
                {
                    title: i18next.t("monitor.location"),
                    width: '',
                    name: 'location',
                    className: 'locUpdate',
                    display: 'UserDefined',
                    render: function (obj) {
                        var data = obj.aData ? obj.aData : obj;
                        return data.lon.toFixed(6) + ', ' + data.lat.toFixed(6);
                    }
                },
                {
                    title: i18next.t("monitor.mileage"),
                    width: '70px',
                    name: 'mileage',
                    className: 'center',
                    display: 'UserDefined',
                    render: function (obj) {
                        var data = obj.aData ? obj.aData : obj;
                        return data.mileage.toFixed(1) + ' km';
                    }
                },
                {
                    title: i18next.t("monitor.speed"),
                    width: '70px',
                    name: 'speed',
                    className: 'center',
                    display: 'UserDefined',
                    render: function (obj) {
                        var data = obj.aData ? obj.aData : obj;
                        return data.speed.toFixed(1) + ' km/h';
                    }
                },
                {
                    title: i18next.t("monitor.direct"),
                    width: '60px',
                    name: 'direct',
                    className: 'center',
                    display: 'TextBox'
                },
                {
                    title: i18next.t("monitor.status"),
                    width: '80px',
                    name: 'status',
                    className: 'center',
                    display: 'UserDefined',
                    render: function (obj) {
                        var data = obj.aData ? obj.aData : obj;
                        return _getStatusDesc(data);
                    }
                }
            ];

            var buttons = {
                show: false //是否显示列表按钮
            };
            var uButtons = [];
            var div = $('#list');
            var startTime = $('#startTime').val();
            var endTime = $('#endTime').val();
            var query = {
                did: _did,
                gpsTime: startTime + '@' + endTime,
                map: 'BAIDU'
            };
            _report = new _dataTable(div, '_iotGpsData', fields, query, 'gpsTime', $('#vehicleKey'), 'gpsTime', buttons, uButtons);
            _report.createHeader();
            var speedFunction = function () {
                return parseFloat(v).toFixed(1) + ' km/h';
            };
            var mileageFunction = function () {
                return parseFloat(v).toFixed(1) + ' km';
            };
            _report.sFields = 'gpsTime,rcvTime,lon,lat,location,mileage,speed,direct,status,alerts'; //重新设置初始查询返回字段
            _report.setExportFields('gpsTime,rcvTime,lon,lat,location,mileage,speed,direct,status,alerts');
            _report.setExportDisplays('d#d#f6#f6#s#' + mileageFunction.toString() + '#' + speedFunction.toString() + '#s#s');

            // console.log(exportObj)
            if (_did === '') return;

            _report.query(query, function (json) {
                // 对数据进行后置处理
                updateLoc();

            });
            break;
        case 3: //打卡详情
            // 创建日统计表表格
            var fields = [
                {
                    title: i18next.t("report.driver_name"),
                    width: '100px',
                    name: 'driverName',
                    className: 'center',
                    display: 'TextBox'
                },
                {
                    title: i18next.t("report.card_no"),
                    width: '120px',
                    name: 'cardNo',
                    className: 'center',
                    display: 'TextBox'
                },
                {
                    title: i18next.t("report.action_type"),
                    width: '100px',
                    name: 'type',
                    className: 'center',
                    display: 'UserDefined',
                    render: function (obj) {
                        var data = obj.aData ? obj.aData : obj;
                        return data.type === 1 ? i18next.t("report.login") : i18next.t("report.logout");
                    }
                },
                {
                    title: i18next.t("report.tag_time"),
                    width: '160px',
                    name: 'createdAt',
                    className: 'center',
                    display: 'UserDefined',
                    render: function (obj) {
                        var data = obj.aData ? obj.aData : obj;
                        return new Date(data.createdAt).format('yyyy-MM-dd hh:mm:ss');
                    }
                },
                {
                    title: i18next.t("monitor.location"),
                    width: '',
                    name: 'lon',
                    className: 'locUpdate',
                    display: 'UserDefined',
                    render: function (obj) {
                        var data = obj.aData ? obj.aData : obj;
                        return data.lon.toFixed(6) + ', ' + data.lat.toFixed(6);
                    }
                }
            ];
            var buttons = {
                show: false //是否显示列表按钮
            };
            var uButtons = [];
            var div = $('#list');
            var startTime = $('#startTime').val();
            var endTime = $('#endTime').val();
            var query = {
                did: _did,
                createdAt: startTime + '@' + endTime,
                map: 'BAIDU'
            };

            _report = new _dataTable(div, '_iotTag', fields, query, '-createdAt', $('#vehicleKey'), 'cardNo', buttons, uButtons);
            _report.createHeader();
            _report.sFields = 'did,type,cardNo,vehicleName,driverName,lon,lat,createdAt'; //重新设置初始查询返回字段
            if (_did == '') return;
            _report.query(query, function (json) {
                // 对数据进行后置处理
                updateLoc();
            });
            break;
        case 5: //启动报表
            var fields = [
                {
                    title: i18next.t('monitor.run_time'),
                    width: '100px',
                    name: 'duration',
                    className: 'center',
                    display: 'UserDefined',
                    render: function (obj) {
                        var data = obj.aData ? obj.aData : obj;
                        // return data.duration.toFixed(1) + ' min'
                        var time;
                        if (data.duration < 60) {
                            time = data.duration.toFixed(1) + ' s'
                        } else if (data.duration / 60 < 60) {
                            time = (data.duration / 60).toFixed(1) + ' min'
                        } else {
                            time = (data.duration / 3600).toFixed(1) + ' h'
                        }
                        return time;
                    }
                },
                {
                    title: i18next.t('monitor.run_distance'),
                    width: '100px',
                    name: 'distance',
                    className: 'center',
                    display: 'UserDefined',
                    render: function (obj) {
                        var data = obj.aData ? obj.aData : obj;
                        return data.distance.toFixed(1) + ' km';
                    }
                },
                {
                    title: i18next.t('monitor.startlon'),
                    width: '80px',
                    name: 'startLon',
                    className: 'center',
                    display: 'UserDefined',
                    render: function (obj) {
                        var data = obj.aData ? obj.aData : obj;
                        return data.startLon.toFixed(6)
                    }
                },
                {
                    title: i18next.t('monitor.startlat'),
                    width: '80px',
                    name: 'startLat',
                    className: 'center',
                    display: 'UserDefined',
                    render: function (obj) {
                        var data = obj.aData ? obj.aData : obj;
                        return data.startLat.toFixed(6);
                    }
                },
                {
                    title: i18next.t('monitor.startlocation'),
                    width: '',
                    name: 'location1',
                    className: 'locUpdate',
                    display: 'UserDefined',
                    render: function (obj) {
                        var data = obj.aData ? obj.aData : obj;
                        return data.startLon.toFixed(6) + ', ' + data.startLat.toFixed(6);
                    }
                },
                {
                    title: i18next.t('monitor.endlon'),
                    width: '80px',
                    name: 'endLon',
                    className: 'center',
                    display: 'UserDefined',
                    render: function (obj) {
                        var data = obj.aData ? obj.aData : obj;
                        return data.endLon.toFixed(6)
                    }
                },
                {
                    title: i18next.t('monitor.endlat'),
                    width: '80px',
                    name: 'endLat',
                    className: 'center',
                    display: 'UserDefined',
                    render: function (obj) {
                        var data = obj.aData ? obj.aData : obj;
                        return data.endLat.toFixed(6);
                    }
                },
                {
                    title: i18next.t('monitor.endlocation'),
                    width: '',
                    name: 'location2',
                    className: 'endlocUpdate',
                    display: 'UserDefined',
                    render: function (obj) {
                        var data = obj.aData ? obj.aData : obj;
                        return data.endLon.toFixed(6) + ', ' + data.endLat.toFixed(6);
                    }
                }
            ];

            var buttons = {
                show: false //是否显示列表按钮
            };
            var uButtons = [];
            var div = $('#list');
            var startTime = $('#startTime').val();
            var endTime = $('#endTime').val();
            var query = {
                did: _did,
                createdAt: startTime + '@' + endTime,
                map: 'BAIDU'
            };

            _report = new _dataTable(div, '_iotTrip', fields, query, '-createdAt', $('#vehicleKey'), 'createdAt', buttons, uButtons);
            _report.createHeader();

            var distanceFunction = function () {
                return parseFloat(v).toFixed(1) + ' km';
            };
            var durationFunction = function () {
                var time;
                if (v < 60) {
                    time = v.toFixed(1) + ' s'
                } else if (v / 60 < 60) {
                    time = (v / 60).toFixed(1) + ' min'
                } else {
                    time = (v / 3600).toFixed(1) + ' h'
                }
                return time;
            }

            _report.sFields = 'duration,distance,startLon,startLat,location1,endLon,endLat,location2'; //重新设置初始查询返回字段
            _report.setExportFields('duration,distance,startLon,startLat,location1,endLon,endLat,location2');
            _report.setExportDisplays(durationFunction.toString() + '#' + distanceFunction.toString() + '#f6#f6#s#f6#f6#s');
            if (_did === '') return;
            _report.query(query, function (json) {
                // 对数据进行后置处理
                updateLoc();
            });
            break;
        case 6: //停留报表
            var fields = [
                {
                    title: i18next.t('monitor.acc_off_time'),
                    width: '100px',
                    name: 'startTime',
                    className: 'center',
                    display: 'UserDefined',
                    render: function (obj) {
                        var data = obj.aData ? obj.aData : obj;
                        return new Date(data.startTime).format('MM-dd hh:mm:ss');
                    }
                },
                {
                    title: i18next.t('monitor.acc_on_time'),
                    width: '100px',
                    name: 'endTime',
                    className: 'center',
                    display: 'UserDefined',
                    render: function (obj) {
                        var data = obj.aData ? obj.aData : obj;
                        return new Date(data.endTime).format('MM-dd hh:mm:ss');
                    }
                },
                {
                    title: i18next.t('monitor.idle_duration'),
                    width: '80px',
                    name: 'duration',
                    className: 'center',
                    display: 'UserDefined',
                    render: function (obj) {
                        var data = obj.aData ? obj.aData : obj;
                        var time;
                        if (data.duration < 60) {
                            time = data.duration.toFixed(1) + ' s'
                        } else if (data.duration / 60 < 60) {
                            time = (data.duration / 60).toFixed(1) + ' min'
                        } else {
                            time = (data.duration / 3600).toFixed(1) + ' h'
                        }
                        return time;
                    }
                },
                {
                    title: i18next.t('monitor.lon'),
                    width: '80px',
                    name: 'startLon',
                    className: 'center',
                    display: 'UserDefined',
                    render: function (obj) {
                        var data = obj.aData ? obj.aData : obj;
                        return data.startLon.toFixed(6);
                    }
                },
                {
                    title: i18next.t('monitor.lat'),
                    width: '80px',
                    name: 'startLat',
                    className: 'center',
                    display: 'UserDefined',
                    render: function (obj) {
                        var data = obj.aData ? obj.aData : obj;
                        return data.startLat.toFixed(6);
                    }
                },
                {
                    title: i18next.t('monitor.idle_location'),
                    width: '',
                    name: 'location',
                    className: 'locUpdate',
                    display: 'UserDefined',
                    render: function (obj) {
                        var data = obj.aData ? obj.aData : obj;
                        return data.startLon.toFixed(6) + ', ' + data.startLat.toFixed(6);
                    }
                }
            ];

            var buttons = {
                show: false //是否显示列表按钮
            };
            var uButtons = [];
            var div = $('#list');
            var startTime = $('#startTime').val();
            var endTime = $('#endTime').val();
            var query = {
                did: _did,
                createdAt: startTime + '@' + endTime,
                map: 'BAIDU'
            };

            _report = new _dataTable(div, '_iotIdle', fields, query, '-createdAt', $('#vehicleKey'), 'createdAt', buttons, uButtons);
            _report.createHeader();

            // var distanceFunction = function () {
            //     return parseFloat(v).toFixed(1) + ' km';
            // };
            var durationFunction = function () {
                var time;
                if (v < 60) {
                    time = v.toFixed(1) + ' s'
                } else if (v / 60 < 60) {
                    time = (v / 60).toFixed(1) + ' min'
                } else {
                    time = (v / 3600).toFixed(1) + ' h'
                }
                return time;
                // return parseFloat(v).toFixed(1) + ' min';

            }

            _report.sFields = 'startTime,endTime,duration,startLon,startLat,location'; //重新设置初始查询返回字段
            _report.setExportFields('startTime,endTime,duration,startLon,startLat,location');
            _report.setExportDisplays('d#d#' + durationFunction.toString() + '#f6#f6#s');
            // if (_did === '') return;
            _report.query(query, function (json) {
                // 对数据进行后置处理
                updateLoc();
            });
            break;
        case 7: //收入统计
            // $('#toolbar .row-fluid:first').hide();
            var fields = [
                {
                    title: i18next.t("monitor.date"),
                    width: '100px',
                    name: 'date',
                    className: 'center',
                    display: 'TextBox'
                },
                {
                    title: i18next.t("report.income"),
                    width: '100px',
                    name: 'total',
                    className: 'center',
                    display: 'UserDefined',
                    render: function (obj) {
                        var data = obj.aData ? obj.aData : obj;
                        return data.total.toFixed(2);
                    }
                }
            ];
            var buttons = {
                show: false //是否显示列表按钮
            };
            var uButtons = [];
            var div = $('#list');
            var query = {
                uid: uid,
            };

            _report = new _dataTable(div, '', fields, query, 'vehicleName', $('#vehicleKey'), 'vehicleName', buttons, uButtons);
            _report.createHeader();
            _report.sFields = 'date,total'; //重新设置初始查询返回字段
            _report.query(query, function (json) {
                // 对数据进行后置处理
            }, function (json, callback) {

                var startTime = $('#startTime').val();
                var endTime = $('#endTime').val();

                var auth_code = $.cookie('auth_code');
                var dealer_id = $.cookie('dealer_id')

                wistorm_api.getBillTotal(dealer_id, startTime, endTime, json.page_no, json.page_count, auth_code, function (stat) {
                    json.total = stat.total
                    json.iTotalRecords = stat.total;
                    json.iTotalDisplayRecords = stat.total;
                    json.aaData = stat.data;
                    json.data = stat.data;
                    json.status_code = stat.status_code;
                    callback(json);
                });
            });
            break;
        case 8: //会员使用统计
            var fields = [
                {
                    title: i18next.t('member.name'),
                    width: '100px',
                    name: 'name',
                    className: 'center',
                    display: 'TextBox'
                },
                {
                    title:  i18next.t('report.total_amount'),
                    width: '100px',
                    name: 'amount',
                    className: 'center',
                    display: 'UserDefined',
                    render: function (obj) {
                        var data = obj.aData ? obj.aData : obj;
                        return data.amount.toFixed(2);
                    }
                },
                {
                    title: i18next.t('report.total_usage'),
                    width: '80px',
                    name: 'count',
                    className: 'center',
                    display: 'TextBox'
                }
            ];

            var buttons = {
                show: false //是否显示列表按钮
            };
            var uButtons = [];
            var div = $('#list');
            var query = {
                parentId: uid,
                custType: 14
            };

            _report = new _dataTable(div, 'customer', fields, query, 'vehicleName', $('#vehicleKey'), 'vehicleName', buttons, uButtons);
            _report.createHeader();
            _report.sFields = ''; //重新设置初始查询返回字段
            _report.query(query, function (json) {
                // 对数据进行后置处理
            }, function (json, callback) {
                var _creator = [];
                json.data.forEach(ele => _creator.push(ele.uid))
                var startTime = $('#startTime').val();
                var endTime = $('#endTime').val();
                var query_json = {
                    createdAt: startTime + "@" + endTime,
                    creator: _creator.join('|')
                };

                var group = {
                    _id: { creator: "$creator" },
                    amount: { $sum: "$amount" },
                    count: { $sum: 1 }
                };
                var sorts = '_id.creator';
                var auth_code = $.cookie('auth_code');
                wistorm_api._aggr("_iotTrip", query_json, group, sorts, 1, -1, auth_code, function (obj) {
                    console.log(JSON.stringify(obj));
                    json.data.forEach(e => {
                        e.amount = 0;
                        e.count = 0
                        if (obj.data.length) {
                            obj.data.forEach(ele => {
                                if (e.uid == ele._id.creator) {
                                    e.amount = ele.amount;
                                    e.count = ele.count
                                }
                            })
                        }
                    })
                    callback(json);
                });
            });
            break;
        case 9: //会员收支明细

            var _billType = { 1: "交易", 2: "充值", 3: "扣费", 4: "体现", 5: "退款", 6: "手续费", 7: "充押金", 8: "退押金", 9: "购买游戏币", 10: "商户分佣", 11: "服务费分成" };
            var memberUid = memberOption[$('#member').val()] || '';
            var fields = [
                {
                    title: i18next.t('report.trading_hours'),
                    width: '160px',
                    name: 'createdAt',
                    className: 'center',
                    display: 'UserDefined',
                    render: function (obj) {
                        var data = obj.aData ? obj.aData : obj;
                        return new Date(data.createdAt).format('yyyy-MM-dd hh:mm:ss');
                    }
                },
                {
                    title: i18next.t('report.orderId'),
                    width: '100px',
                    name: 'oid',
                    className: 'center',
                    display: 'TextBox'
                },
                {
                    title: i18next.t('report.available_amount'),
                    width: '100px',
                    name: 'balance',
                    className: 'center',
                    display: 'UserDefined',
                    render: function (obj) {
                        var data = obj.aData ? obj.aData : obj;
                        return data.balance.toFixed(2);
                    }
                },
                {
                    title: i18next.t('report.trading_amount'),
                    width: '100px',
                    name: 'amount',
                    className: 'center',
                    display: 'UserDefined',
                    render: function (obj) {
                        var data = obj.aData ? obj.aData : obj;
                        debugger;
                        return data.amount.toFixed(2);
                    }
                },
                {
                    title: i18next.t('report.trading_remark'),
                    width: '100px',
                    name: 'remark',
                    className: 'center',
                    display: 'TextBox'
                },
                {
                    title: i18next.t('report.trading_type'),
                    width: '100px',
                    name: 'billType',
                    className: 'center',
                    display: 'UserDefined',
                    render: function (obj) {
                        var data = obj.aData ? obj.aData : obj;
                        return _billType[data.billType]
                    }
                },
            ];
            var buttons = {
                show: false //是否显示列表按钮
            };
            var uButtons = [];
            var div = $('#list');
            var query = {
                uid: uid,
            };

            _report = new _dataTable(div, '', fields, query, 'vehicleName', $('#vehicleKey'), 'vehicleName', buttons, uButtons);
            _report.createHeader();
            _report.sFields = 'date,total'; //重新设置初始查询返回字段
            _report.query(query, function (json) {
                // 对数据进行后置处理
            }, function (json, callback) {

                var startTime = $('#startTime').val();
                var endTime = $('#endTime').val();

                var auth_code = $.cookie('auth_code');
                var dealer_id = $.cookie('dealer_id')
                // debugger;
                // console.log(uid)
                if (memberUid) {
                    wistorm_api.getBillList(memberUid, startTime, endTime, json.page_no, json.page_count, auth_code, function (stat) {
                        json.total = stat.total
                        json.iTotalRecords = stat.total;
                        json.iTotalDisplayRecords = stat.total;
                        json.aaData = stat.data;
                        json.data = stat.data;
                        json.status_code = stat.status_code;
                        callback(json);
                    });
                } else {
                    callback(json);
                }

            });
            break;
        case 10: //里程报表
            var fields = [
                {
                    title: i18next.t("vehicle.name"),
                    width: '100px',
                    name: 'vehicleName',
                    className: 'center',
                    display: 'TextBox'
                },
                {
                    title: "里程(km)",
                    width: '100px',
                    name: 'distance',
                    className: 'center',
                    display: 'TextBox'
                },
                // {
                //     title: i18next.t("report.day_duration"),
                //     width: '100px',
                //     name: 'distance',
                //     className: 'center',
                //     display: 'TextBox'
                // },
            ];
            var buttons = {
                show: false //是否显示列表按钮
            };
            var uButtons = [];
            var div = $('#list');
            var query = {
                uid: uid,
                vehicleName: '<>null'
            };

            if (vid && vid > 0) {
                query = {
                    vehicleId: vid
                }
            }

            _report = new _dataTable(div, '_iotDevice', fields, query, 'vehicleName', $('#vehicleKey'), 'vehicleName', buttons, uButtons);
            _report.createHeader();
            _report.sFields = 'did,vehicleName'; //重新设置初始查询返回字段
            _report.query(query, function (json) {
                // 对数据进行后置处理
            }, function (json, callback) {
                var dids = [];
                for (var i = 0; i < json.data.length; i++) {
                    if (json.data[i].did) {
                        dids.push(json.data[i].did)
                    }
                    // dids += json.data[i].did + '|';
                }
                var startTime = $('#startTime').val();
                var endTime = $('#endTime').val();
                // var query = {
                //     uid: uid,
                //     did: dids,
                //     endTime: startTime.format("yyyy-MM-dd") + "@" + endTime.format("yyyy-MM-dd"),
                // };

                var query = {
                    did: dids.join('|'),
                    gpsTime: startTime.format("yyyy-MM-dd") + "@" + endTime.format("yyyy-MM-dd"),
                    mileage: '>0'
                };
                var group = {
                    _id: { did: "$did" },
                    max: { $max: "$mileage" },
                    min: { $min: "$mileage" }
                };

                // var group = {
                //     _id: { did: '$did' },
                //     distance: { $sum: "$distance" },
                // };
                var sorts = '_id.did';
                var auth_code = $.cookie('auth_code');
                wistorm_api._aggr("_iotGpsData", query, group, sorts, 1, -1, auth_code, function (trip) {
                    console.log(trip)
                    var _trip = {};
                    if (trip && trip.data.length > 0) {
                        for (var i = 0; i < trip.data.length; i++) {
                            _trip[trip.data[i]._id.did] = trip.data[i];
                        }
                    }

                    for (var j = 0; j < json.data.length; j++) {
                        var s = _trip[json.data[j].did];
                        if (s) {
                            json.data[j].vehicleName = json.data[j].vehicleName || json.data[j].did;
                            json.data[j].distance = (s.max - s.min).toFixed(2);
                        } else {
                            json.data[j].vehicleName = json.data[j].vehicleName || json.data[j].did;
                            json.data[j].distance = 0;
                        }
                    }
                    callback(json);
                });
            });
            break;
        case 11: //收支明细

            var _billType = { 1: "交易", 2: "充值", 3: "扣费", 4: "体现", 5: "退款", 6: "手续费", 7: "充押金", 8: "退押金", 9: "购买游戏币", 10: "商户分佣", 11: "服务费分成" };
            var memberUid = memberOption[$('#member').val()] || '';
            var fields = [
                {
                    title: i18next.t('report.trading_hours'),
                    width: '160px',
                    name: 'createdAt',
                    className: 'center',
                    display: 'UserDefined',
                    render: function (obj) {
                        var data = obj.aData ? obj.aData : obj;
                        return new Date(data.createdAt).format('yyyy-MM-dd hh:mm:ss');
                    }
                },
                {
                    title: i18next.t('report.orderId'),
                    width: '100px',
                    name: 'oid',
                    className: 'center',
                    display: 'TextBox'
                },
                {
                    title: i18next.t('report.available_amount'),
                    width: '100px',
                    name: 'balance',
                    className: 'center',
                    display: 'UserDefined',
                    render: function (obj) {
                        var data = obj.aData ? obj.aData : obj;
                        return data.balance.toFixed(2);
                    }
                },
                {
                    title: i18next.t('report.trading_amount'),
                    width: '100px',
                    name: 'amount',
                    className: 'center',
                    display: 'UserDefined',
                    render: function (obj) {
                        var data = obj.aData ? obj.aData : obj;
                        debugger;
                        return data.amount.toFixed(2);
                    }
                },
                {
                    title: i18next.t('report.trading_remark'),
                    width: '100px',
                    name: 'remark',
                    className: 'center',
                    display: 'TextBox'
                },
                {
                    title: i18next.t('report.trading_type'),
                    width: '100px',
                    name: 'billType',
                    className: 'center',
                    display: 'UserDefined',
                    render: function (obj) {
                        var data = obj.aData ? obj.aData : obj;
                        return _billType[data.billType]
                    }
                },
            ];
            var buttons = {
                show: false //是否显示列表按钮
            };
            var uButtons = [];
            var div = $('#list');
            var query = {
                uid: uid,
            };

            _report = new _dataTable(div, '', fields, query, 'vehicleName', $('#vehicleKey'), 'vehicleName', buttons, uButtons);
            _report.createHeader();
            _report.sFields = 'date,total'; //重新设置初始查询返回字段
            _report.query(query, function (json) {
                // 对数据进行后置处理
            }, function (json, callback) {

                var startTime = $('#startTime').val();
                var endTime = $('#endTime').val();

                var auth_code = $.cookie('auth_code');
                var dealer_id = $.cookie('dealer_id')
                // debugger;
                // console.log(uid)
                if (dealer_id) {
                    wistorm_api.getBillList(dealer_id, startTime, endTime, json.page_no, json.page_count, auth_code, function (stat) {
                        json.total = stat.total
                        json.iTotalRecords = stat.total;
                        json.iTotalDisplayRecords = stat.total;
                        json.aaData = stat.data;
                        json.data = stat.data;
                        json.status_code = stat.status_code;
                        callback(json);
                    });
                } else {
                    callback(json);
                }

            });
            break;
        case 12:
            // alert(12)
            var startTime = $('#startTime').val();
            var endTime = $('#endTime').val();
            if (!_did || _did == '') return
            console.log(_did);

            var query = {
                did: _did
            }
            wistorm_api._get('vehicle', query, 'did,fuelTankCapacity,name', auth_code, true, function (veh) {
                console.log(veh);
                var fuelTankCapacity = veh.data ? veh.data.fuelTankCapacity || 1 : 1;
                var query_json = {
                    did: _did,
                    gpsTime: startTime.format("yyyy-MM-dd") + "@" + endTime.format("yyyy-MM-dd"),
                    fuel: '>0'
                }
                wistorm_api._list('_iotGpsData', query_json, 'fuel,mileage', 'createdAt', 'createdAt', 0, 0, 1, -1, $.cookie('auth_code'), true, function (obj) {
                    console.log(obj)
                    if (obj.status_code === 0) {
                        var dateArray = [];
                        var mileArray = [];
                        var fuelArray = [];
                        for (var i = 0; i < obj.data.length; i++) {
                            dateArray.push(new Date(obj.data[i].rcvTime).format('yyyy-MM-dd hh:mm:ss'));
                            mileArray.push(obj.data[i].mileage.toFixed(2));
                            fuelArray.push((obj.data[i].fuel * fuelTankCapacity).toFixed(2));
                        }
                        drawOilChart(dateArray, mileArray, fuelArray);
                    }
                })
            })
            // wistorm_api._get('vehicle',{d})
            // wistorm_api._list('_iotGpsData', {did:'63074726924',gpsTime: startTime.format("yyyy-MM-dd") + "@" + endTime.format("yyyy-MM-dd")}, 'fuel,mileage', 'createdAt', 'createdAt', 0, 0, 1, -1, $.cookie('auth_code'), true, function (obj) {
            //     console.log(obj)
            // })
            break;
        default:
            break;
    }
};

var memberOption = {};
var getMember = function (uid) {
    var query = {
        parentId: _uid,
        custType: 14
    }
    wistorm_api._list('customer', query, 'objectId,name,treePath,parentId,uid,custType', 'custType,name', '-createdAt', 0, 0, 1, -1, auth_code, true, function (json) {
        var names = [];
        if (json.total) {
            $('#member').val(json.data[0].name)
            json.data.forEach(ele => {
                memberOption[ele.name] = ele.uid;
                names.push(ele.name)
            })
            $('#member').typeahead({ source: names });
        }
    })
}

var reportType = 1;
var activeReportType = null;
var _uid = $.cookie("dealer_id");
var _vid = null;
var _did = '';

$(document).ready(function () {
    $("#alert").hide();

    var rpId = setInterval(function () {
        if (!i18nextLoaded) {
            return;
        }

        activeReportType = $("#1")[0];
        $(document).on("click", ".reportType", function () {
            if (activeReportType) {
                activeReportType.classList.remove("active");
            }
            $(this)[0].classList.add("active");
            activeReportType = $(this)[0];
            reportType = parseInt($(this).attr("id"));
            // debugger;
            $('#alertPanel').css('display', reportType == 2 ? 'block' : 'none');
            $('#customer_name').css('display', reportType == 7 || reportType == 8 || reportType == 9 || reportType == 11 ? 'none' : 'block');
            $('#vehicle_name').css('display', reportType == 7 || reportType == 8 || reportType == 9 || reportType == 11 ? 'none' : 'block');
            $('#member_name').css('display', reportType == 9 ? 'block' : 'none');
            // $('#member_name').css('display', reportType == 9 ? 'block' : 'none');
            reportType == 12 ? $('#oilCurve').show() : $('#oilCurve').hide();
            reportType == 12 ? $('#list').hide() : $('#list').show();
            makeReport(reportType, _uid, _vid);
        });

        $('#alertType').change(function (e) {
            makeReport(reportType, _uid, _vid);
        });

        $('#query').click(function (e) {
            makeReport(reportType, _uid, _vid);
        });

        $('#member').change(function (e) {
            makeReport(reportType, memberOption[e.target.value])
        })

        $('#export').click(function (e) {
            showLoading(true, i18next.t("report.exporting"), ICON_LOADING);
            location.href = _report.exportUrl;
            showLoading(false);
        });

        // 初始化日期框
        $('.startTime').datetimepicker({
            language: $.cookie("lang"),
            weekStart: 1,
            todayBtn: 1,
            autoclose: 1,
            todayHighlight: 1,
            startView: 2,
            forceParse: 0,
            showMeridian: 1
        });
        $('#startTime').val(today.format('yyyy-MM-dd 00:00:00'));
        $('.endTime').datetimepicker({
            language: $.cookie("lang"),
            weekStart: 1,
            todayBtn: 1,
            autoclose: 1,
            todayHighlight: 1,
            startView: 2,
            forceParse: 0,
            showMeridian: 1
        });
        $('#endTime').val(today.format('yyyy-MM-dd 23:59:59'));

        // 初始化目标选择框
        var ts = new vehicleSelector($('#vehicle'), function (vid, did, name) {
            makeReport(reportType, 0, vid);
            _vid = vid;
            _did = did;
        });
        ts.init();

        // 初始化用户选择框
        var cs = new customerSelector($('#customer'), function (uid, name) {
            ts.getData(uid, name);
            makeReport(reportType, uid);
            _uid = uid;
        });
        getMember(_uid)
        cs.init();

        // 初始加载本级用户所有目标数据
        makeReport(reportType, _uid);
        _navResize()
        clearInterval(rpId);
        $(window).resize(function () {
            _navResize();
        })
    }, 100);
});

function _tableResize() {
    // 修改目标列表高度
    var height = $(window).height() - 200;
    $('.dataTables_wrapper').css({ "height": height + "px" });
}

function _navResize() {
    var height = $(window).height() - 80;
    $('#leftNav').css({ "height": height + "px", "overflow": 'auto' });
}

// 加载目标状态曲线
/**
 * @param {[*]} dateArray
 */
var drawOilChart = function (dateArray, mileArray, fuelArray) {
    // 基于准备好的dom，初始化echarts实例
    statChart = echarts.init(document.getElementById('oilCurve'));

    // 指定图表的配置项和数据
    var option = {
        backgroundColor: '#fff',
        color: ['#5793f3', '#d14a61'],
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'cross',
                animation: false,
                label: {
                    backgroundColor: '#0D4286'
                }
            }
        },
        toolbox: {
            show: true,
            feature: {
                dataView: { show: true, readOnly: false },
                magicType: { show: true, type: ['line', 'bar'] },
                restore: { show: true },
                saveAsImage: { show: true }
            }
        },
        legend: {
            left: 'center',
            data: [i18next.t('summary.mileage'), i18next.t('report.oil')],
            textStyle: {
                color: "#000",
                fontsize: 5
            }
        },
        // dataZoom: [{
        //     show: false,
        //     realtime: true,
        //     start: 0,
        //     end: 5,
        //     // backgroundColor:'#d'
        //     textStyle: {
        //         color: "#000"
        //     }
        // }, {
        //     type: 'inside',
        //     realtime: true,
        //     start: 5,
        //     end: 85
        // }],
        grid: {
            show: true,
            top: '24%',
            left: '2%',
            right: '1%',
            bottom: '14%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            axisLine: {
                lineStyle: {
                    color: '#000'
                }
            },
            axisLabel: { //调整x轴的lable
                textStyle: {
                    color: '#000'
                }
            },
            splitLine: {
                show: true
            },
            data: dateArray
        },
        yAxis: [{
            boundaryGap: [0, '50%'],
            axisLine: {
                lineStyle: {
                    color: '#000'
                }
            },
            type: 'value',
            name: i18next.t('summary.mileage') + '(km)',
            position: 'left',
            offset: 0,
            splitNumber: 10,
            axisLabel: {
                formatter: '{value}',
                textStyle: {
                    color: '#000'
                }
            },
            splitLine: {
                show: false
            },
            min: function (value) {
                return value.min - 10;
            },
            max: function (value) {
                return value.max + 10;
            }
        }, {
            boundaryGap: [0, '50%'],
            axisLine: {
                lineStyle: {
                    color: '#000'
                }
            },
            splitLine: {
                show: false
            },
            type: 'value',
            name: i18next.t('report.oil') + '(L)',
            position: 'right',
            axisLabel: {
                formatter: '{value}'
            },
            min: function (value) {
                return parseInt(value.min - 5);
            },
            max: function (value) {
                return parseInt(value.max + 5);
            }
        }],
        series: [{
            name: i18next.t('summary.mileage'),
            type: 'line',
            // step: 'middle',
            smooth: true,
            data: mileArray,
            yAxisIndex: 0
        }, {
            name: i18next.t('report.oil'),
            type: 'line',
            // step: 'start',
            smooth: true,
            data: fuelArray,
            yAxisIndex: 1
        }]
    };

    // 使用刚指定的配置项和数据显示图表。
    statChart.setOption(option);
};