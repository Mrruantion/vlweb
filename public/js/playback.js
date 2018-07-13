/**
 * Created with JetBrains WebStorm.
 * User: 1
 * Date: 13-8-26
 * Time: 下午11:33
 * To change this template use File | Settings | File Templates.
 */

var vehicle_table;
var lon = parseFloat($.cookie("lon")) || 113.84714;
var lat = parseFloat($.cookie("lat")) || 22.67805;
var auth_code = $.cookie('auth_code');
var updateTime = new Date(0);
var names = [];
var vehicles = [];
var _vehicles = {};
var checkDids = ($.cookie("checkDids") || '').split("|");
var _counts = {
    '': '全部',
    '1': '在线',
    '2': '离线',
    '3': '报警'
};
var statusSelected;
var collapsed = true;
var timerPlayback = null;
var gpsDatas = null;
var _play = false;
var _pause = false;
var _first = true;
var _interval = 200;
var __interval = 200;
var p = 0;
var sliderSpeed;
var sliderProgress;
var did = '';
var name = '';
var objectType = '';
var _table = null;
var map_type = MAP_TYPE_BAIDU;
var map_engine = 'BAIDU';
var mapType = $.cookie('map_type');
var typeaheadNameOption = {}; //存储搜索的目标点

function windowResize() {
    var map_canvas = $("#map_canvas");
    var _panorama = $("#panorama");
    var play_info = $('#play_info')
    var canvasHeight = $(window).height() - 80;
    map_canvas.css({ "height": canvasHeight + "px" });
    // var windowobj = $(window);
    // map_canvasHeight = windowobj.height() - 80;
    // browsCss(_panorama, map_canvasHeight);
    // debugger;
    play_info.css({ "height": canvasHeight - 356 + 'px' })
    _panorama.css({ "height": canvasHeight + "px" });
    $('.dataTables_scrollBody').css({ "height": ($(window).height() - 138 - $('.accordion-group').height()) + "px" });

}

var showLocation = function (obj, address) {
    obj.text(address);
};

var stop = function (clear) {
    clearTimeout(timerPlayback);
    setPlayButton(false);
    setPauseButton(false);
    p = 0;
    if (clear) {
        sliderProgress.setValue(0);
    }
};

var setPlayButton = function (play) {
    _play = play;
    if (_play) {
        $('#startPlay').text(i18next.t("playback.stop"));
    } else {
        $('#startPlay').text(i18next.t("playback.play"));
    }
};

var setPauseButton = function (pause) {
    if (pause) {
        $('#pause').show();
    } else {
        $('#pause').hide();
    }
    _pause = !pause;
};
var screenGpsData = function (data) {
    var _isMove = true;
    var _gpsDatas = [];
    for (var i = 0; i < data.length; i++) {
        if (data[i].speed == 0) {
            if (_isMove) {
                _gpsDatas.push(data[i]);
            }
            _isMove = false;
        } else if (data[i].speed > 0) {
            _isMove = true;
            _gpsDatas.push(data[i]);
        }
    }
    return _gpsDatas
}

var playback = function () {
    __interval = _interval;
    timerPlayback = setTimeout(function () {



        if (!_play || p == gpsDatas.length) {
            stop(false);
            return;
        }
        var vehicle = {
            did: did,
            name: name,
            objectType: objectType,
            activeGpsData: gpsDatas[p],
        };
        wimap.updateVehicle(vehicle, true, false, false, 0, 0, true);
        setGpsInfo(p, vehicle);
        // _interval = (gpsDatas[p].speed || 0) > 0 ? 200: 10;
        p++;
        playback();
    }, _interval);
};

// 设置播放进度
var gpsFlagDesc = ['', '参考', 'GPS', '基站', '北斗'];
var setGpsInfo = function (n, vehicle) {
    var speed = parseInt(vehicle.activeGpsData.speed) + 'km/h';
    var direct = getDirectDesc(vehicle.activeGpsData.direct);
    var desc = _getStatusDesc(vehicle.activeGpsData);
    var gpsTime = new Date(vehicle.activeGpsData.gpsTime).format("yyyy-MM-dd hh:mm:ss");
    var rcvTime = new Date(vehicle.activeGpsData.rcvTime).format("yyyy-MM-dd hh:mm:ss");
    var gpsFlag = gpsFlagDesc[vehicle.activeGpsData.gpsFlag];
    var percent = parseInt((n + 1) / gpsDatas.length * 100);
    sliderProgress.setValue(percent);
    $('#infoTitle').text(i18next.t("playback.info") + '(' + (n + 1) + '/' + gpsDatas.length + ')');
    $('#gpsTime').text(gpsTime);
    $('#rcvTime').text(rcvTime);
    $('#speed').text(speed);
    $('#direction').text(direct);
    $('#status').text(desc);
    $('#lonLat').text(gpsFlag);
    setLocation(0, vehicle.activeGpsData.lon, vehicle.activeGpsData.lat, $('#location'), showLocation);
};

function format(d) {
    // `d` is the original data object for the row
    var content =
        '<table class="detail" cellpadding="5" cellspacing="0" border="0" style="padding-left:5px;">' +
        '<tr>' +
        '<td>' + i18next.t("monitor.rcv_time") + ':</td>' +
        '<td>{{rcvTimeDesc}}</td>' +
        '</tr>' +
        '<tr>' +
        '<td>' + i18next.t("monitor.direct") + ':</td>' +
        '<td>{{directDesc}}</td>' +
        '</tr>' +
        '<tr>' +
        '<td>' + i18next.t("monitor.locate") + ':</td>' +
        '<td>{{gpsFlagDesc}}</td>' +
        '</tr>' +
        '<tr>' +
        '<td>' + i18next.t("monitor.lonlat") + ':</td>' +
        '<td>{{lonLat}}</td>' +
        '</tr>' +
        '<tr>' +
        '<td>' + i18next.t("monitor.location") + ':</td>' +
        '<td><span id="loc"></span></td>' +
        '</tr>' +
        '</table>';
    return content.format(d);
}

var getAcc = function (device) {
    var acc = device.status.join(",").indexOf('8196') > -1 ? i18next.t("monitor.acc_on") : i18next.t("monitor.acc_off");
    return acc;
};

var getSpeed = function (device) {
    var speed = parseInt(device.speed) || 0;
    speed += 'km/h';
    return speed;
};

var setGpsDataList = function (json) {
    // var _total = 
    $('#detailTitle').text(i18next.t("playback.list") + "(" + json.data.length + ")");
    for (var i = 0; i < json.data.length; i++) {
        json.data[i].acc = getAcc(json.data[i]);
        json.data[i].directDesc = getDirectDesc(json.data[i].direct);
        json.data[i].speedDesc = getSpeed(json.data[i]);
        if ($('#workType').val() === '1') {
            json.data[i].statusDesc = gpsFlagDesc[json.data[i].gpsFlag];
        } else {
            json.data[i].statusDesc = _getStatusDesc(json.data[i]) + '，' + getAcc(json.data[i]) + '，' + getSpeed(json.data[i]);
        }
        json.data[i].gpsFlagDesc = gpsFlagDesc[json.data[i].gpsFlag];
        json.data[i].lonLat = json.data[i].lon.toFixed(6) + ", " + json.data[i].lat.toFixed(6);
        json.data[i].gpsTimeDesc = new Date(json.data[i].gpsTime).format('MM-dd hh:mm:ss');
        json.data[i].rcvTimeDesc = new Date(json.data[i].rcvTime).format('MM-dd hh:mm:ss');
    }
    var _columns = [
        { "orderable": false, "data": null, "className": 'details-control', "defaultContent": '' },
        { "searchable": false, "data": "gpsTimeDesc", "className": "center" },
        // { "searchable": false, "data":"acc", "className":"center" },
        // { "searchable": false, "data":"speedDesc", "className":"center" },
        { "searchable": false, "data": "statusDesc", "className": "" }
    ];
    var lang = i18next.language || 'en';
    var objTable = {
        "deferRender": true,
        "bInfo": true,
        "bLengthChange": false,
        "bProcessing": true,
        "bServerSide": false,
        "bFilter": false,
        "searching": false,//本地搜索
        "data": json.data,
        "aoColumns": _columns,
        "paging": false,
        "scrollY": ($(window).height() - 412) + "px",
        // "scrollCollapse": true,
        "sDom": "<'row'r>t<'row'<'pull-right'p>>",
        // "sPaginationType":"bootstrap",
        "oLanguage": { "sUrl": 'css/' + lang + '.txt' }
    };
    if (_table) {
        _table.clear();
        _table.rows.add(json.data).draw();
    } else {
        _table = $("#vehicle_list").DataTable(objTable);
    }
    $('#vehicle_list tbody').on('click', 'tr', function () {
        if ($(this).hasClass('selected')) {
            // $(this).removeClass('selected');
        }
        else {
            _table.$('tr.selected').removeClass('selected');
            $(this).addClass('selected');
        }
        var tr = $(this).closest('tr');
        var row = _table.row(tr);

        if (row.child.isShown()) {
            // This row is already open - close it
            // row.child.hide();
            // tr.removeClass('shown');
        }
        else {
            // Open this row
            if (_table.$('.shown').length > 0) {
                _table.row(_table.$('.shown')).child.hide();
                _table.$('.shown').removeClass('shown');
            }
            row.child(format(row.data())).show();
            tr.addClass('shown');
        }
        var data = row.data();
        var content = data.gpsTimeDesc + ' ' + data.statusDesc;
        wimap.addStartMarker(data.lon, data.lat, content);
        wimap.setCenter(data.lon, data.lat);
        setLocation(0, data.lon, data.lat, $(row.child().find('#loc')[0]), showLocation);
    });
    $('#vehicle_list tbody').on('click', 'td.details-control', function () {
        // var tr = $(this).closest('tr');
        // var row = _table.row( tr );
        //
        // if ( row.child.isShown() ) {
        //     // This row is already open - close it
        //     row.child.hide();
        //     tr.removeClass('shown');
        // }
        // else {
        //     // Open this row
        //     row.child( format(row.data()) ).show();
        //     tr.addClass('shown');
        // }
    });
};

var clearGpsData = function (did) {
    var vehicle = {
        did: did
    };
    // 删除之前的轨迹
    wimap.removeTrackLine(vehicle);
    wimap.removeTrackPoint(vehicle);
    // 删除之前的目标
    wimap.deleteVehicle(did);
};

var loadGpsData = function (did, name, startTime, endTime, objectType) {
    _first = true;
    $('.waiting').show();
    // 画轨迹线
    var vehicle = {
        did: did
    };
    // 删除之前的轨迹
    wimap.removeTrackLine(vehicle);
    wimap.removeTrackPoint(vehicle);
    !map_engine ? changeTypeAndEngine() : null;
    var query = {
        did: did,
        gpsTime: startTime + '@' + endTime,
        // gpsFlag: '2|3|4',
        lon: '>0',
        lat: '>0',
        map: map_engine
    };
    wistorm_api._list('_iotGpsData', query, 'lon,lat,speed,direct,gpsFlag,status,alerts,gpsTime,rcvTime', 'gpsTime', 'gpsTime', 0, 0, 0, -1, auth_code, true, function (obj) {
        console.log(obj);
        if (obj.statusText == 'timeout') {
            _alert(i18next.t("msg.err_timeout"), 3);
            $('.waiting').hide();
            return;
        }
        if (obj.status_code == 0 && obj.total > 0) {
            // gpsDatas = obj.data;
            if ($('#isFiltering').is(':checked')) {
                gpsDatas = screenGpsData(obj.data)
            } else {
                gpsDatas = obj.data;
            }

            // 添加目标
            var vehicles = [{
                did: did,
                name: name,
                objectType: objectType,
                activeGpsData: gpsDatas[0]
            }];
            wimap.addVehicles(vehicles, false, true);
            // 画新的轨迹
            if ($('#chkLine').is(':checked')) {
                wimap.addTrackLine(vehicle, gpsDatas, '#0000FF', 4, true);
            }
            // 画轨迹点
            if ($('#chkPoint').is(':checked')) {
                wimap.addTrackPoint(vehicle, gpsDatas, '#0000FF', 4, true);
            }
            // 显示第一个定位
            vehicle = {
                obj_id: did,
                obj_name: name,
                activeGpsData: gpsDatas[0]
            };
            setGpsInfo(0, vehicle);
            setGpsDataList({ data: gpsDatas });
            $('.empty').hide();
            $('.data').show();
            $('#startPlay').show();
            // 显示停留记录
            if ($('#chkIdle').is(':checked')) {
                if (loadIdleList) {
                    _vehicles[did] = {
                        did: did,
                        name: name
                    };
                    _idleDate = new Date(startTime);
                    _endIdleDate = new Date(endTime);
                    idle(did, 1);
                }
            }
        } else {
            $('.empty').show();
            $('.data').hide();
            $('#startPlay').hide();
        }
        $('.waiting').hide();
    });
};

var changeTypeAndEngine = function () {
    if (mapType) {
        map_type = mapType == 1 ? MAP_TYPE_BAIDU : mapType == 3 ? MAP_TYPE_GAODE : MAP_TYPE_GOOGLE;
        map_engine = mapType == 1 ? 'BAIDU' : 'GOOGLE';
    } else {
        map_type = $.cookie('lang') === 'zh' || $.cookie('lang') === 'zh-CN' ? MAP_TYPE_BAIDU : MAP_TYPE_GOOGLE;
        mapType = $.cookie('lang') === 'zh' || $.cookie('lang') === 'zh-CN' ? 1 : 2;
        map_engine = $.cookie('lang') === 'zh' || $.cookie('lang') === 'zh-CN' ? 'BAIDU' : 'GOOGLE';
    }
}

$(document).ready(function () {
    sliderSpeed = new Slider('#playbackSpeed', {
        formatter: function (value) {
            var speedDesc = 'Normal';
            if (value >= 0 && value < 3) {
                speedDesc = 'Very Slow';
            } else if (value >= 3 && value < 5) {
                speedDesc = 'Slow';
            } else if (value >= 5 && value <= 7) {
                speedDesc = 'Normal';
            } else if (value >= 7 && value <= 9) {
                speedDesc = 'Fast';
            } else if (value >= 9 && value <= 10) {
                speedDesc = 'Very Fast';
            }
            var s = value === 0 ? 1 : value;
            _interval = parseInt(1000 / s);
            return speedDesc;
        }
    });
    sliderProgress = new Slider('#playbackProgress');
    sliderProgress.disable();
    // sliderProgress.setValue(50);

    $("#alert").hide();

    windowResize();

    // customerQuery();
    // 设置缺省设置
    var workType = parseInt($('#workType').val());
    $('#chkLine').attr('checked', workType !== 1);
    $('#chkPoint').attr('checked', workType === 1);

    $(window).resize(function () {
        windowResize();
    });

    statusSelected = $('#allStatus');

    // map_type = $.cookie('lang') === 'zh' || $.cookie('lang') === 'zh-CN' ? MAP_TYPE_BAIDU : MAP_TYPE_GOOGLE;
    // map_engine = $.cookie('lang') === 'zh' || $.cookie('lang') === 'zh-CN' ? 'BAIDU' : 'GOOGLE';

    var pbId = setInterval(function () {
        if (!i18nextLoaded) {
            return;
        }

        _counts = {
            '': i18next.t("monitor.all_status"),
            '1': i18next.t("monitor.online_status"),
            '2': i18next.t("monitor.offline_status"),
            '3': i18next.t("monitor.alert_status")
        };

        gpsFlagDesc =
            ['',
                i18next.t("locate.bad"),
                i18next.t("locate.gps"),
                i18next.t("locate.lbs"),
                i18next.t("locate.bd")
            ];

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
        $('#startTime').val(new Date().format('yyyy-MM-dd 00:00:00'));
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
        $('#endTime').val(new Date().format('yyyy-MM-dd hh:mm:ss'));

        $('.accordion-toggle').click(function () {
            // alert("accordion-toggle");
            collapsed = !collapsed;
            // alert(collapsed);
            if (collapsed) {
                $('#accordion-icon').removeClass("icon-arrow-down");
                $('#accordion-icon').addClass("icon-arrow-up");
            } else {
                $('#accordion-icon').removeClass("icon-arrow-up");
                $('#accordion-icon').addClass("icon-arrow-down");
            }
            setTimeout(function () {
                windowResize();
            }, 300);
        });

        // 初始化目标选择框
        var ts = new vehicleSelector($('#name'), function (vid, did, name, workType, objectType) {
            clearGpsData($('#did').val());
            $('#startPlay').hide();
            stop(true);
            $('#did').val(did);
            $('#workType').val(workType);
            $('#objectType').val(objectType)
        });
        ts.init();
        var uid = $.cookie('dealer_id');
        ts.getData(uid, i18next.t("system.all_vehicle"));

        $('#query').click(function () {
            $('#startPlay').hide();
            stop(true);
            did = $('#did').val();
            if (did === '') {
                _alert(i18next.t("vehicle.select_vehicle"));
                return;
            }
            name = $('#name').val();
            var startTime = $('#startTime').val();
            var endTime = $('#endTime').val();
            objectType = $('#objectType').val();
            loadGpsData(did, name, startTime, endTime, objectType);
        });

        $('#startPlay').click(function () {
            if (_play) {
                stop(true);
            } else {
                if (!_pause) {
                    sliderProgress.setValue(0);
                    p = 0;
                }
                setPlayButton(true);
                setPauseButton(true);
                playback();
            }
        });

        $('#pause').click(function () {
            setPauseButton(false);
            setPlayButton(false);
            clearTimeout(timerPlayback);
        });

        changeTypeAndEngine();
        $('#map_type').val(mapType)
        $('#map_type').change(function () {
            $.cookie('map_type', this.value);
            history.go(0);
        })
        var center_point = { lon: lon, lat: lat };
        wimap = new wiseMap(map_type, document.getElementById('map_canvas'), center_point, 14);

        if (map_type === MAP_TYPE_BAIDU) {
            var local = new BMap.LocalSearch(wimap.map, {
                renderOptions: {},
            });
            var addrSearch = function (id) {
                var searchMarker;
                $(id).typeahead({
                    source: function (query, process) {
                        $(id).val() == query && query ? local.search(query) : process([]);
                        var func = function (results) {
                            // console.log(res.zr)
                            // var names = [];
                            // res.zr.forEach((ele, i) => {
                            //     typeaheadNameOption[ele.title] = {}
                            //     typeaheadNameOption[ele.title]["point"] = ele.point;
                            //     typeaheadNameOption[ele.title]["address"] = ele.address;
                            //     names.push(ele.title);
                            // });
                            // process(names)
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
            wimap.cityList(10, 170);
            wimap.distanceTool();
        } else if (map_type === MAP_TYPE_GAODE) {
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
                $('#distanceTool').show();
            } else if (map_type === MAP_TYPE_GAODE) {
                $('#distanceTool').show();
            }
            clearTimeout(otherControl);
        }, 1000)
        // wimap.addPanoramaCtrl(10, 130)
        // // 创建控件
        // var panoramaCtrl = new PanoramaControl();
        // panoramaCtrl.setOffset(new BMap.Size(130, 10))
        // // 添加到地图当中
        // wimap.map.addControl(panoramaCtrl);
        // //添加地图移动事件
        // var movePanorama = function (type, target) {
        //     panorama.setPosition(new BMap.Point(wimap.map.getCenter().lng, wimap.map.getCenter().lat));
        // };
        // wimap.map.addEventListener("moveend", movePanorama);
        // wimap.map.addEventListener("zoomend", movePanorama);
        // wimap.map.addEventListener("resize", movePanorama);

        clearInterval(pbId);
    }, 100);
});