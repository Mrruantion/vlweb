var select_vehicle = null;
// var toolType = TOOL_TYPE_DEFAULT;
var current_marker = null;
var current_overlay = null;
var current_infowin = null;
var current_retangle = null;
var currentIdle = null;
var baidumap;

var EARTH_RADIUS = 6378.137; //地球半径，单位为公里
function rad(d) {   //计算弧度
    return d * Math.PI / 180.0;
}

function calDistance(lat1, lng1, lat2, lng2) {     //计算两个经纬度坐标之间的距离，返回单位为公里的数值
    var radLat1 = rad(lat1);
    var radLat2 = rad(lat2);
    var a = radLat1 - radLat2;
    var b = rad(lng1) - rad(lng2);
    var s = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(a / 2), 2) + Math.cos(radLat1) * Math.cos(radLat2) * Math.pow(Math.sin(b / 2), 2)));
    s = s * EARTH_RADIUS;
    s = Math.round(s * 10000) / 10000;
    return s;
}

var refreshLabel = function (map, vehicles) {
    return function () {
        //alert("hello");
        var v = null;
        for (var i = 0; i < vehicles.length; i++) {
            v = vehicles[i];
            v.marker_.setLabel(new BMap.Label(vehicles[i].nick_name, { offset: new BMap.Size(15, -20) }));
        }
    }
};

function bmap(div_map, center_point, zoom) {
    this.map = new BMap.Map(div_map);
    baidumap = this.map;
    this.map.centerAndZoom(center_point, zoom);
    // this.map.setCenter(point);
    // this.map.setZoom(zoom);
    this.map.enableScrollWheelZoom();
    this.map.addControl(new BMap.NavigationControl());
    this.map.addControl(new BMap.ScaleControl());
    this.map.addControl(new BMap.OverviewMapControl());
    this.map.addControl(new BMap.MapTypeControl());
    this.geocoder = new BMap.Geocoder();
    geocoder = this.geocoder;
    this.vehicles = [];
    this.pois = [];
    this.geos = [];
    this.markers = [];
    this.poi_markers = [];
    this.markerClusterer = null;
    this.showLocation = null;
    this.mapClick = null;
    // this.traffic(40, 30)
    // this.cityList(10, 170);
    // this.distanceTool();
    this.addPanoramaCtrl(10, 124)
    // document.getElementById('panorama') ? this.addPanoramaCtrl(10, 124) : null;
    //    fn = refreshLabel(this.map, this.vehicles);
    //    this.map.addEventListener("dragend", fn);
};

bmap.prototype.setCenter = function (lon, lat) {
    point = new BMap.Point(lon, lat);
    this.map.setCenter(point);
};

// 设置地图缩放比例
bmap.prototype.setZoom = function (level) {
    this.map.setZoom(level);
};

// 获取地址后的函数处理
bmap.prototype.setShowLocation = function (fun) {
    this.showLocation = fun;
}

function vehicleMarker(vehicle, if_track, if_show_line, if_show_win) {
    this.did = vehicle.did;
    this.name = vehicle.name;
    this.lon = vehicle.activeGpsData.lon;
    this.lat = vehicle.activeGpsData.lat;
    this.speed = vehicle.activeGpsData.speed;
    this.direct = vehicle.activeGpsData.direct;
    this.gpsTime = vehicle.activeGpsData.gpsTime;
    this.rcvTime = vehicle.activeGpsData.rcvTime;
    this.if_track = if_track;
    this.if_show_line = if_show_line;
    this.if_show_win = if_show_win || if_track;
    this.track_line = null;
    this.track_point = null;
    this.track_lines = [];
    this.content = "";
    this.marker_ = null;
    this.label_ = null;
    this.infowin_ = null;
    this.idles = [];
}

function poiMarker(poi) {
    this.poi_id = poi.objectId;
    this.poi_name = poi.name;
    this.poi_type = poi.opt.type;
    this.lon = poi.points[0][0];
    this.lat = poi.points[0][1];
    this.remark = poi.remark;
    this.marker_ = null;
}

function branchMarker(branch) {
    this._id = branch._id;
    this.name = branch.name;
    this.lon = branch.lon;
    this.lat = branch.lat;
    this.marker_ = null;
}

bmap.prototype.addVehicles = function (vehicles, is_track, is_playback, if_open_win) {
    var v = null;
    var latLng = null;
    var icon = "";
    var title = "";
    var points = [];
    var _is_playback = is_playback || false;
    var _is_open_win = if_open_win || false;
    for (var i = 0; i < vehicles.length; i++) {
        if (vehicles[i].activeGpsData === undefined) continue;
        var v = this.vehicles[vehicles[i].did];
        // 判断目标是否存在，存在则更新数据，不存在则添加
        if (v != null) {
            this.updateVehicle(vehicles[i], is_track, is_track, _is_open_win, '#FF0000', 3, is_playback);
        } else {
            latLng = new BMap.Point(vehicles[i].activeGpsData.lon, vehicles[i].activeGpsData.lat);
            points.push(latLng);
            v = new vehicleMarker(vehicles[i], false, false, false);
            icon = getIcon(vehicles[i], MAP_TYPE_BAIDU, _is_playback);
            title = vehicles[i].nick_name + "（" + getStatusDesc(vehicles[i], 2) + "）";
            v.marker_ = new BMap.Marker(latLng, { icon: icon });
            vehicles[i].objectType != 9 ? v.marker_.setRotation(vehicles[i].activeGpsData.direct) : null;
            v.marker_.setLabel(new BMap.Label(vehicles[i].name, { offset: new BMap.Size(15, -20) }));
            v.marker_.getLabel().setStyle({ border: "1px solid blue" });
            v.marker_.setTitle = title;
            if (!_is_playback) {
                content = getMapContent(vehicles[i], is_track);
                //打开该目标的信息窗体
                var infowin = new BMap.InfoWindow(content, { enableAutoPan: false });
                infowin.setHeight(256)
                v.infowin_ = infowin;

                var fn = markerClickFunction(v);
                v.marker_.addEventListener("click", fn);
                if (_is_open_win) {
                    this.map.openInfoWindow(v.infowin_, latLng);
                    var geoFn = geoFunction(v.did, latLng);
                    geocoder.getLocation(latLng, geoFn, { "poiRadius": "500", "numPois": "10" });
                }
            }

            this.vehicles[vehicles[i].did] = v;
            this.markers.push(v.marker_);
            this.map.addOverlay(v.marker_);
        }
    }
    if (is_track) {
        var vp = this.map.getViewport(points, {
            margins: [20, 20, 20, 20]
        });
        this.map.centerAndZoom(vp.center, vp.zoom);
    }
};

bmap.prototype.addIdles = function (did, idles) {
    var v = this.vehicles[did];
    if (v) {
        // var icon = new BMap.Icon("images/icon.png", new BMap.Size(36, 36));
        for (var i = 0; i < idles.length; i++) {
            var latLng = new BMap.Point(idles[i].startLon, idles[i].startLat);
            var _idleMarker = new BMap.Marker(latLng);
            _idleMarker.setLabel(new BMap.Label((i + 1).toString(), { offset: new BMap.Size(4, 2) }));
            _idleMarker.getLabel().setStyle({ border: "0px solid red", color: 'rgb(255, 255, 255)', backgroundColor: 'rgba(255, 255, 255, 0)', fontWeight: "normal", fontSize: "13px" });
            v.idles.push(_idleMarker);
            this.map.addOverlay(_idleMarker);
        }
    }
};

bmap.prototype.addIdleMarker = function (lon, lat, index) {
    if (currentIdle) {
        this.map.removeOverlay(currentIdle);
    }
    var icon = new BMap.Icon("images/markerdown.png", new BMap.Size(23, 25), { anchor: new BMap.Size(10, 25) });
    var latLng = new BMap.Point(lon, lat);
    currentIdle = new BMap.Marker(latLng, { icon: icon });
    currentIdle.setLabel(new BMap.Label(index, { offset: new BMap.Size(4, 2) }));
    currentIdle.getLabel().setStyle({ border: "0px solid red", color: 'rgb(255, 255, 255)', backgroundColor: 'rgba(255, 255, 255, 0)', fontWeight: "normal", fontSize: "13px" });
    this.map.addOverlay(currentIdle);
};

bmap.prototype.clearIdles = function (did) {
    var v = this.vehicles[did];
    if (v) {
        // var icon = new BMap.Icon("images/icon.png", new BMap.Size(36, 36));
        for (var i = 0; i < v.idles.length; i++) {
            this.map.removeOverlay(v.idles[i]);
        }
        v.idles = [];
    }
    if (currentIdle) {
        this.map.removeOverlay(currentIdle);
    }
};

var markerClickFunction = function (v) {
    return function (e) {
        v.marker_.openInfoWindow(v.infowin_);
        var latLng = new BMap.Point(v.lon, v.lat);
        var geoFn = geoFunction(v.did, latLng);
        geocoder.getLocation(latLng, geoFn, { "poiRadius": "500", "numPois": "10" });
        select_vehicle = v;
    };
};

var geoFunction = function (did, latLng) {
    return function (rs) {
        var di = 2000;
        var shortpoint = -1;
        for (i = 0; i < rs.surroundingPois.length; i++) {
            var d = baidumap.getDistance(rs.surroundingPois[i].point, latLng);
            if (d < di) {
                shortpoint = i;
                di = d;
            }
        }

        var getAddAddress = "";
        if (shortpoint >= 0) {
            getAddAddress = rs.address + '，离' + rs.surroundingPois[shortpoint].title + di.toFixed(0) + '米';
        } else {
            getAddAddress = rs.address;
        }

        if (getAddAddress != "") {
            $("#location" + did).html(getAddAddress);
        }
    };
};

// 更新目标显示
bmap.prototype.updateVehicle = function (vehicle, if_track, if_show_line, if_open_win, color, width, if_playback) {
    var v = this.vehicles[vehicle.did];
    var content = "";
    var _if_track = vehicle.if_track || if_track;
    var _if_show_line = vehicle.if_show_line || if_show_line;
    if (v != null && vehicle.activeGpsData != undefined) {
        var oldlatLng;
        oldlatLng = new BMap.Point(v.lon, v.lat);
        v.lon = vehicle.activeGpsData.lon;
        v.lat = vehicle.activeGpsData.lat;
        v.gps_time = vehicle.activeGpsData.gpsTime;
        v.speed = vehicle.activeGpsData.speed;
        v.direct = vehicle.activeGpsData.direct;
        var icon = getIcon(vehicle, MAP_TYPE_BAIDU, if_playback);
        var latLng;
        latLng = new BMap.Point(vehicle.activeGpsData.lon, vehicle.activeGpsData.lat);

        if (_if_show_line) {
            var distance = calDistance(oldlatLng.lat, oldlatLng.lng, latLng.lat, latLng.lng);
            if (distance < 10) {
                if (!v.track_line) {
                    var polyOptions = {
                        strokeColor: color,
                        strokeOpacity: 1.0,
                        strokeWeight: width
                    };
                    v.track_line = new BMap.Polyline([], polyOptions);
                    var path = v.track_line.getPath();
                    this.map.addOverlay(v.track_line);
                    path.push(oldlatLng);
                    v.track_lines.push(v.track_line);
                }
                var path = v.track_line.getPath();
                path.push(latLng);
                v.track_line.setPath(path);
            } else {
                v.track_line = null;
            }
        }


        v.marker_.getLabel().setContent(vehicle.name);
        v.marker_.setIcon(icon);
        v.marker_.setPosition(latLng);
        vehicle.objectType != 9 ? v.marker_.setRotation(vehicle.activeGpsData.direct) : null;
        if (!if_playback) {
            content = getMapContent(vehicle, _if_track);
            v.infowin_.setContent(content);
            // var fn = markerClickFunction(v);
            // fn();
        }
        if (_if_track) {
            // 加入视野判断，如果超过地图范围才进行置中操作
            var bounds = this.map.getBounds();
            if (v.lon < bounds.getSouthWest().lng || v.lon > bounds.getNorthEast().lng ||
                v.lat < bounds.getSouthWest().lat || v.lat > bounds.getNorthEast().lat) {
                this.map.setCenter(latLng);
            }
        }

        if (v.if_show_win || if_open_win) {
            this.map.openInfoWindow(v.infowin_, latLng);
            var geoFn = geoFunction(v.did, latLng);
            geocoder.getLocation(latLng, geoFn, { "poiRadius": "500", "numPois": "10" });
        }
    }
};

bmap.prototype.findVehicle = function (did, if_track, if_open_win) {
    var v = this.vehicles[did];
    var content = "";
    if (v != null) {
        var latLng;
        latLng = new BMap.Point(v.lon, v.lat);

        if (if_track) {
            this.map.setZoom(15);
            this.map.setCenter(latLng);
        }
        if (if_open_win) {
            if (select_vehicle) {
                select_vehicle.marker_.closeInfoWindow();
                select_vehicle.if_show_win = false;
                this.clearIdles(select_vehicle.did);
            }
            v.marker_.openInfoWindow(v.infowin_);
            v.if_show_win = true;
            select_vehicle = v;
        }
        // 获取地址
        this.geocoder.getLocation(latLng, function (rs) {
            var di = 2000;
            var shortpoint = -1;
            for (i = 0; i < rs.surroundingPois.length; i++) {
                var d = baidumap.getDistance(rs.surroundingPois[i].point, latLng);
                if (d < di) {
                    shortpoint = i;
                    di = d;
                }
            }

            if (shortpoint >= 0) {
                getAddAddress = rs.address + '，离' + rs.surroundingPois[shortpoint].title + di.toFixed(0) + '米';
            } else {
                getAddAddress = rs.address;
            }

            if (getAddAddress != "") {
                $("#location" + did).html(getAddAddress);
            }
        }, { "poiRadius": "500", "numPois": "10" });
        return v;
    } else {

    }
};

bmap.prototype.deleteVehicle = function (did) {
    var v = this.vehicles[did];
    if (v != null) {
        // 从数组中删除对象
        this.vehicles[did] = null;
        this.markers.pop(v.marker_);
        if (v.marker_) {
            this.map.removeOverlay(v.marker_);
        }
        if (v.track_lines) {
            for (var i = 0; i < v.track_lines.length; i++) {
                this.map.removeOverlay(v.track_lines[i]);
            }
        }
    }
}

bmap.prototype.clearVehicle = function () {
    for (var i = this.markers.length - 1; i >= 0; i--) {
        var m = this.markers[i];
        if (m) {
            this.map.removeOverlay(m);
        }
    }
    this.vehicles = [];
    this.markers = [];
};


// bmap.prototype.addTrackLine = function (vehicle, gps_datas, color, width, centerAndZoom) {
//     var v = this.vehicles[vehicle.did];
//     var content = "";
//     if (v == null) {
//         v = new vehicleMarker(vehicle, false, false);
//         this.vehicles[vehicle.did] = v;
//     }
//     var points = [];
//     var latLng;
//     for (var i = 0; i < gps_datas.length; i++) {
//         latLng = new BMap.Point(gps_datas[i].lon, gps_datas[i].lat);
//         points.push(latLng);
//     }

//     var polyOptions = {
//         strokeColor: color,
//         strokeOpacity: 1.0,
//         strokeWeight: width
//     };
//     if (v.track_line) {
//         this.map.removeOverlay(v.track_line);
//     };
//     v.track_line = new BMap.Polyline(points, polyOptions);
//     this.map.addOverlay(v.track_line);
//     if (centerAndZoom) {
//         var vp = this.map.getViewport(points, {
//             margins: [10, 10, 10, 10]
//         });
//         this.map.centerAndZoom(vp.center, vp.zoom);
//     }
// }
// bmap.prototype.addTrackLine = function (vehicle, gps_datas, color, width, centerAndZoom) {
//     var v = this.vehicles[vehicle.did];
//     var content = "";
//     if (v == null) {
//         v = new vehicleMarker(vehicle, false, false);
//         this.vehicles[vehicle.did] = v;
//     }
//     var lineIndex = 0;
//     var lineObj = {};
//     var points = [];
//     var allpoints = [];
//     var latLng;
//     var oldlatLng;
//     for (var i = 0; i < gps_datas.length; i++) {
//         latLng = new BMap.Point(gps_datas[i].lon, gps_datas[i].lat);
//         var distance = oldlatLng ? calDistance(oldlatLng.lat, oldlatLng.lng, latLng.lat, latLng.lng) : 0;
//         allpoints.push(latLng)
//         if (distance < 10) {
//             points.push(latLng);
//         } else {
//             lineObj[lineIndex] = points;
//             lineIndex++;
//             points = [];
//             points.push(latLng)
//         }
//         oldlatLng = latLng;
//     }
//     lineObj[lineIndex] = points;
//     console.log(lineObj)

//     var polyOptions = {
//         strokeColor: color,
//         strokeOpacity: 1.0,
//         strokeWeight: width
//     };
//     if (v.track_line) {
//         this.map.removeOverlay(v.track_line);
//     }
//     // debugger;
//     for(var i in lineObj){
//         console.log(lineObj[i])
//         v.track_line = new BMap.Polyline(lineObj[i], polyOptions);
//         this.map.addOverlay(v.track_line);
//     }   
//     if (centerAndZoom) {
//         var vp = this.map.getViewport(allpoints, {
//             margins: [10, 10, 10, 10]
//         });
//         this.map.centerAndZoom(vp.center, vp.zoom);
//     }
// };
bmap.prototype.addTrackLine = function (vehicle, gps_datas, color, width, centerAndZoom) {
    var v = this.vehicles[vehicle.did];
    var content = "";
    if (v == null) {
        v = new vehicleMarker(vehicle, false, false);
        this.vehicles[vehicle.did] = v;
    }
    var lineIndex = 0;
    var lineObj = {};
    var points = [];
    var allpoints = [];
    var latLng;
    var pointObj = {};
    var oldlatLng;
    for (var i = 0; i < gps_datas.length; i++) {
        pointObj = {};
        latLng = new BMap.Point(gps_datas[i].lon, gps_datas[i].lat);
        pointObj.alert = gps_datas[i].alerts || [];
        pointObj.latLng = latLng;
        var distance = oldlatLng ? calDistance(oldlatLng.lat, oldlatLng.lng, latLng.lat, latLng.lng) : 0;
        allpoints.push(latLng)
        if (distance < 10) {
            points.push(pointObj);
        } else {
            lineObj[lineIndex] = points;
            lineIndex++;
            points = [];
            points.push(pointObj);
        }
        oldlatLng = latLng;
    }
    lineObj[lineIndex] = points;
    console.log(lineObj)

    // var polyOptions = {
    //     strokeColor: color,
    //     strokeOpacity: 1.0,
    //     strokeWeight: width
    // };
    if (v.track_line) {
        this.map.removeOverlay(v.track_line);
    }
    var allObjPoints = {};
    // points = [];
    // latLng;
    // oldlatLng;
    lineIndex = 0
    // var greenColor = 'green';
    // var redColor = 'red';
    var changeColor = '';
    var isgreen = true;
    var isfrist = true;
    var ooldlatLng;
    for (var i in lineObj) {
        points = [];
        oldlatLng = '';
        allObjPoints[i] = {};
        isfrist = true;
        ooldlatLng = '';
        for (var j = 0; j < lineObj[i].length; j++) {
            latLng = lineObj[i][j].latLng;
            if (isfrist) { //第一次
                latLng = oldlatLng ? oldlatLng : lineObj[i][j].latLng;
                var _j;
                
                if (lineIndex == 0) {
                    _j = j;
                } else {
                    _j = j - 1;
                    _j = _j == -1 ? 0 : _j
                }
                console.log(j, i,_j, 'jj')
                if (lineObj[i][_j].alert.length) {
                    isgreen = false;
                    changeColor = 'red' + lineIndex
                } else {
                    isgreen = true;
                    changeColor = 'green' + lineIndex
                }

                // allObjPoints[i][changeColor] = [];
                allObjPoints[i][changeColor] = ooldlatLng ? [ooldlatLng] : []
                // allObjPoints[changeColor]["points"] = [];
            }
            isfrist = false;
            if (isgreen) { //行驶
                if (lineObj[i][j].alert.length) {
                    isfrist = true;
                    lineIndex++;
                    oldlatLng = lineObj[i][j].latLng;
                    ooldlatLng = lineObj[i][j - 1] ? lineObj[i][j - 1].latLng : ''
                } else {
                    // allObjPoints[changeColor].push(latLng)
                    allObjPoints[i][changeColor].push(latLng)
                }
            } else { //报警
                if (!lineObj[i][j-1].alert.length) {
                    isfrist = true;
                    lineIndex++;
                    oldlatLng = lineObj[i][j-1].latLng;
                    ooldlatLng = lineObj[i][j - 2] ? lineObj[i][j - 2].latLng : '';
                } else {
                    // allObjPoints[changeColor].push(latLng)
                    allObjPoints[i][changeColor].push(latLng)
                }
            }
        }
    }
    var polyOptions = {
        // strokeColor: lineColor, //线路颜色  
        strokeWeight: width,//折线的宽度，以像素为单位
        strokeOpacity: 0.8,//折线的透明度，取值范围0 - 1
    }

    for (var i in allObjPoints) {
        var _dis = allObjPoints[i];
        for (var j in _dis) {
            if (j.indexOf('red') > -1) {
                polyOptions.strokeColor = 'red'
            } else {
                polyOptions.strokeColor = 'green'
            }
            v.track_line = new BMap.Polyline(_dis[j], polyOptions);
            this.map.addOverlay(v.track_line);
            v.track_lines.push(v.track_line)
        }
    }


    console.log(allObjPoints, 'allObjPoints')

    // debugger;
    // for (var i in lineObj) {
    //     console.log(lineObj[i]);
    //     var arrPois = [];
    //     var lineColor = "";
    //     var val = lineObj[i];
    //     for (var j = 0; j < val.length; j++) {
    //         if (val[j + 1]) {
    //             arrPois.splice(0, arrPois.length);
    //             arrPois.push(val[j].latLng);
    //             arrPois.push(val[j + 1].latLng);
    //             if (val[j].speed < 30) {
    //                 lineColor = "yellow";
    //             } else if (val[j].speed > 30 && val[j].speed < 60) {
    //                 lineColor = "green";
    //             } else if (val[j].speed > 60 && val[j].speed < 90) {
    //                 lineColor = "black";
    //             } else {
    //                 lineColor = "red";
    //             }
    //             var sy = new BMap.Symbol(BMap_Symbol_SHAPE_BACKWARD_OPEN_ARROW, {
    //                 scale: 0.6,//图标缩放大小
    //                 strokeColor: '#fff',//设置矢量图标的线填充颜色
    //                 strokeWeight: '2',//设置线宽
    //             });
    //             var icons = new BMap.IconSequence(sy, '10', '50', false);

    //             var polyOptions = {
    //                 strokeColor: lineColor, //线路颜色  
    //                 // icons: [icons],
    //                 strokeWeight: '8',//折线的宽度，以像素为单位
    //                 strokeOpacity: 0.8,//折线的透明度，取值范围0 - 1
    //             }

    //             v.track_line = new BMap.Polyline(arrPois, polyOptions);
    //             this.map.addOverlay(v.track_line);
    //         }
    //     }
    // }
    if (centerAndZoom) {
        var vp = this.map.getViewport(allpoints, {
            margins: [10, 10, 10, 10]
        });
        this.map.centerAndZoom(vp.center, vp.zoom);
    }
};

bmap.prototype.removeTrackLine = function (vehicle) {
    var v = this.vehicles[vehicle.did];
    var content = "";
    if (v != null && v.track_line != null) {
        for (var i = 0; i < v.track_lines.length; i++) {
            this.map.removeOverlay(v.track_lines[i]);
        }
        this.map.removeOverlay(v.track_line);
        v.track_line = null;
    }
}

bmap.prototype.addTrackPoint = function (vehicle, gps_datas, color, width, centerAndZoom) {
    var v = this.vehicles[vehicle.did];
    var content = "";
    if (v == null) {
        v = new vehicleMarker(vehicle, false, false);
        this.vehicles[vehicle.did] = v;
    }
    var points = [];
    var latLng;
    for (var i = 0; i < gps_datas.length; i++) {
        latLng = new BMap.Point(gps_datas[i].lon, gps_datas[i].lat);
        points.push(latLng);
    }

    var options = {
        shape: BMAP_POINT_SHAPE_CIRCLE,
        size: BMAP_POINT_SIZE_NORMAL,
        color: color
    };
    if (v.track_point) {
        this.map.removeOverlay(v.track_point);
    }
    v.track_point = new BMap.PointCollection(points, options);
    this.map.addOverlay(v.track_point);
    if (centerAndZoom) {
        var vp = this.map.getViewport(points, {
            margins: [10, 10, 10, 10]
        });
        this.map.centerAndZoom(vp.center, vp.zoom);
    }
};

bmap.prototype.removeTrackPoint = function (vehicle) {
    var v = this.vehicles[vehicle.did];
    var content = "";
    if (v != null && v.track_point != null) {
        this.map.removeOverlay(v.track_point);
        v.track_point = null;
    }
}

bmap.prototype.moveTrackPoint = function (vehicle, gps_data, if_open_win) {
    var v = vehicle;
    v.active_gps_data.lon = gps_data.lon;
    v.active_gps_data.lat = gps_data.lat;
    v.active_gps_data.speed = gps_data.speed;
    v.active_gps_data.direct = gps_data.direct;
    v.active_gps_data.gps_time = gps_data.gps_time;
    v.active_gps_data.uni_status = gps_data.uni_status;
    v.active_gps_data.uni_alerts = gps_data.uni_alerts;
    this.updateVehicle(v, true, true, if_open_win, 'green', 3, true);
}

//function strPad(hex) {
//    var zero = '00000000';
//    var tmp = 8 - hex.length;
//    return zero.substr(0, tmp) + hex;
//}

//bmap.prototype.openAddGeoTool = function () {
//    google.maps.event.addListener(this.map, 'click', function (event) {
//        //alert(event.latLng);
//        var lon = parseInt(event.latLng.lat() * 600000);
//        var lat = parseInt(event.latLng.lng() * 600000);
//        lon = strPad(lon.toString(16).toUpperCase());
//        lat = strPad(lat.toString(16).toUpperCase());
//        alert(lat + "," + lon);
//    });
//}

//var onMapClick = function (map, title, div_content) {
//    return function (event) {
//        switch (toolType) {
//            case TOOL_TYPE_POI:
//                //alert("兴趣点：" + event.latLng);
//                if (current_infowin) {
//                    current_infowin.close();
//                }
//                current_infowin = new google.maps.InfoWindow({
//                    content: div_content,
//                    disableAutoPan: true
//                });
//                if (current_marker) {
//                    current_marker.setMap(null);
//                }
//                current_marker = new google.maps.Marker({
//                    position: event.latLng,
//                    map: map,
//                    title: title
//                });
//                current_infowin.open(map, current_marker);
//                break;
//            case TOOL_TYPE_GEO:
//                //alert("矩形围栏：" + event.latLng);
//                if (current_infowin) {
//                    current_infowin.close();
//                }
//                current_infowin = new google.maps.InfoWindow({
//                    content: div_content,
//                    disableAutoPan: true,
//                    position: event.latLng
//                });
//                if (current_retangle) {
//                    current_retangle.setMap(null);
//                }
//                current_retangle = new google.maps.Rectangle({
//                    strokeColor: "#FF0000",
//                    strokeOpacity: 0.8,
//                    strokeWeight: 2,
//                    fillColor: "#FF0000",
//                    fillOpacity: 0.35,
//                    map: map,
//                    bounds: getRectangle(event.latLng.lng(), event.latLng.lat(), 100)
//                });
//                current_infowin.open(map);
//                break;
//            case TOOL_TYPE_POLY:
//                alert("多边形围栏：" + event.latLng);
//                break;
//            case TOOL_TYPE_ROUTE:
//                alert("线路：" + event.latLng);
//                break;
//        }
//    }
//}

//bmap.prototype.setTool = function (tool_type, title, div_content, callback) {
//    toolType = tool_type;
//    switch (tool_type) {
//        case TOOL_TYPE_DEFAULT:
//            google.maps.event.removeListener(this.mapClick);
//            if (current_infowin) {
//                current_infowin.close();
//            }
//            if(current_marker) {
//                current_marker.setMap(null);
//            }
//            break;
//        case TOOL_TYPE_POI:
//        case TOOL_TYPE_GEO:
//        case TOOL_TYPE_POLY:
//        case TOOL_TYPE_ROUTE:
//            fn = onMapClick(this.map, title, div_content);
//            this.mapClick = google.maps.event.addListener(this.map, 'click', fn);
//            break;
//    }
//}

bmap.prototype.addPois = function (pois) {
    var p = null;
    var latLng = null;
    var icon = "";
    var title = "";
    for (var i = 0; i < pois.length; i++) {
        this.addPoi(pois[i]);
    }
}

bmap.prototype.addPoi = function (poi) {
    var p = null;
    var latLng = null;
    var icon = "";
    var title = "";
    var p = this.pois[poi.objectId] || null;
    // 判断兴趣点是否存在，存在则更新数据，不存在则添加
    if (p === null) {
        latLng = new BMap.Point(poi.points[0][0], poi.points[0][1]);
        p = new poiMarker(poi);
        icon = getPoiIcon(poi, MAP_TYPE_BAIDU);
        title = p.poi_name || poi.name;
        p.marker_ = new BMap.Marker(latLng, { icon: icon });
        p.marker_.setLabel(new BMap.Label(title, { offset: new BMap.Size(26, 0) }));
        p.marker_.getLabel().setStyle({ border: "0px solid red", backgroundColor: 'rgba(255, 255, 255, 0)', fontWeight: "bold", fontFamily: "微软雅黑", fontSize: "13px", textShadow: "#fff 1px 0 0,#fff 0 1px 0,#fff -1px 0 0,#fff 0 -1px 0" });
        this.map.addOverlay(p.marker_);
        this.pois[poi.objectId] = p;
        this.poi_markers.push(p.marker_);
    }
}

bmap.prototype.addBranches = function (branches) {
    var p = null;
    var latLng = null;
    var icon = "";
    var title = "";
    for (var i = 0; i < branches.length; i++) {
        this.addBranch(branches[i]);
    }
}

bmap.prototype.addBranch = function (branch) {
    var p = null;
    var latLng = null;
    var icon = "";
    var title = "";
    var p = this.pois[branch._id];
    // 判断兴趣点是否存在，存在则更新数据，不存在则添加
    if (p != null) {
        this.updateBranch(branch);
    } else {
        latLng = new BMap.Point(branch.lon, branch.lat);
        p = new branchMarker(branch);
        // icon = getPoiIcon(branch, MAP_TYPE_BAIDU);
        p.marker_ = new BMap.Marker(latLng, { icon: icon });
        p.marker_.setLabel(new BMap.Label(branch.name, { offset: new BMap.Size(30, 0) }));
        p.marker_.getLabel().setStyle({ border: "1px solid blue", "background-color": "#fff" });
        this.map.addOverlay(p.marker_);
        this.pois[branch._id] = p;
        this.poi_markers.push(p.marker_);
    }
};

bmap.prototype.findBranch = function (_id) {
    var p = this.pois[_id];
    var content = "";
    if (p != null) {
        this.setCenter(p.lon, p.lat);
        return p;
    }
};

//bmap.prototype.findPoi = function (poi_id) {
//    var p = this.pois[poi_id];
//    var content = "";
//    if (p != null) {
//        var latLng;
//        if (this.map.getMapTypeId() == google.maps.MapTypeId.SATELLITE || this.map.getMapTypeId() == google.maps.MapTypeId.HYBRID) {
//            latLng = new google.maps.LatLng(p.lat, p.lon);
//        } else {
//            latLng = new google.maps.LatLng(p.rev_lat, p.rev_lon);
//        }
//        this.map.setZoom(10);
//        this.map.setCenter(latLng);
//        return p;
//    }

//}

//bmap.prototype.editPoi = function (div_content, poi_id, callback) {
//    //找到对应的poi
//    var p = this.pois[poi_id];
//    if (p) {
//        var latLng;
//        if (this.map.getMapTypeId() == google.maps.MapTypeId.SATELLITE || this.map.getMapTypeId() == google.maps.MapTypeId.HYBRID) {
//            latLng = new google.maps.LatLng(p.lat, p.lon);
//        } else {
//            latLng = new google.maps.LatLng(p.rev_lat, p.rev_lon);
//        }
//        this.map.setZoom(10);
//        this.map.setCenter(latLng);
//        current_infowin = new google.maps.InfoWindow({
//            content: div_content,
//            disableAutoPan: true
//        });
//        if (current_marker) {
//            current_marker.setMap(null);
//        }
//        current_marker = new google.maps.Marker({
//            position: p.marker_.position,
//            map: this.map,
//            title: p.poi_name
//        });
//        current_infowin.open(this.map, current_marker);
//        //current_marker = p.marker_;
//        this.setTool(TOOL_TYPE_POI, p.poi_name, div_content, callback);
//    }
//}

bmap.prototype.updateBranch = function (branch) {
    var p = this.pois[branch._id];
    var content = "";
    if (p != null) {
        p.name = branch.name;
        // var icon = getPoiIcon(poi, MAP_TYPE_BAIDU);
        // p.marker_.setIcon(icon);
        var latLng;
        latLng = new BMap.Point(branch.lon, branch.lat);
        p.marker_.setPosition(latLng);
        p.marker_.getLabel().setContent(branch.name);
    }
};

//bmap.prototype.deletePoi = function (poi_id) {
//    var p = this.pois[poi_id];
//    if (p != null) {
//        // 从数组中删除对象
//        this.pois[poi_id] = null;
//        if (p.marker_) {
//            p.marker_.setMap(null);
//        }
//    }
//}

bmap.prototype.clearPoi = function () {
    for (var i = 0; i < this.poi_markers.length; i++) {
        var m = this.poi_markers[i];
        if (m) {
            this.map.removeOverlay(m);
        }
    }
    this.poi_markers = [];
    this.pois = [];
}

////lon,lat: 中心点经纬度
////meter: 半径，单位(米)
//var getRectangle = function(lon, lat, meter){
//    var pi = 3.1415926535897932;
//    var ranx,rany;
//    var x,y;
//    y = lat;
//    x = 90- y;
//    x = Math.sin(x * pi / 180);
//    x = 40075.38 * x;
//    x = x / 360;
//    x = x * 1000;
//    ranx = meter / x;
//    rany = meter / 110940; 
//    return new google.maps.LatLngBounds(
//        new google.maps.LatLng(lat - rany, lon - ranx),
//        new google.maps.LatLng(lat + rany, lon + ranx)
//        );
//}

//bmap.prototype.showGeo = function (poi) {
//    var latLng;
//    if (this.map.getMapTypeId() == google.maps.MapTypeId.SATELLITE || this.map.getMapTypeId() == google.maps.MapTypeId.HYBRID) {
//        latLng = new google.maps.LatLng(poi.lat, poi.lon);
//    } else {
//        latLng = new google.maps.LatLng(poi.rev_lat, poi.rev_lon);
//    }
//    this.map.setZoom(15);
//    this.map.setCenter(latLng);
//    if (current_retangle) {
//        current_retangle.setMap(null);
//    }
//    current_retangle = new google.maps.Rectangle({
//        strokeColor: "#FF0000",
//        strokeOpacity: 0.8,
//        strokeWeight: 2,
//        fillColor: "#FF0000",
//        fillOpacity: 0.35,
//        map: this.map,
//        bounds: getRectangle(latLng.lng(), latLng.lat(), poi.width)
//    });
//}

//bmap.prototype.deleteGeo = function () {
//    if (current_retangle) {
//        current_retangle.setMap(null);
//    }
//}

////更改电子围栏宽度
//bmap.prototype.changeGeoWidth = function (width) {
//    if (current_retangle) {
//        var bounds = getRectangle(current_retangle.getBounds().getCenter().lng(), current_retangle.getBounds().getCenter().lat(), width);
//        current_retangle.setBounds(bounds);
//    }
//}

//bmap.prototype.editGeo = function (div_content, poi, callback) {
//    //找到对应的poi
//    var p = poi;
//    if (poi) {
//        var latLng;
//        if (this.map.getMapTypeId() == google.maps.MapTypeId.SATELLITE || this.map.getMapTypeId() == google.maps.MapTypeId.HYBRID) {
//            latLng = new google.maps.LatLng(p.lat, p.lon);
//        } else {
//            latLng = new google.maps.LatLng(p.rev_lat, p.rev_lon);
//        }
//        this.map.setZoom(15);
//        this.map.setCenter(latLng);
//        current_infowin = new google.maps.InfoWindow({
//            content: div_content,
//            disableAutoPan: true,
//            position: latLng
//        });
//        if (current_retangle) {
//            current_retangle.setMap(null);
//        }
//        current_retangle = new google.maps.Rectangle({
//            strokeColor: "#FF0000",
//            strokeOpacity: 0.8,
//            strokeWeight: 2,
//            fillColor: "#FF0000",
//            fillOpacity: 0.35,
//            map: this.map,
//            bounds: getRectangle(latLng.lng(), latLng.lat(), p.width)
//        });
//        current_infowin.open(this.map);

//        this.setTool(TOOL_TYPE_GEO, p.poi_name, div_content, callback);
//    }
//}
var start_marker;
bmap.prototype.addStartMarker = function (lon, lat, content) {
    if (start_marker) {
        this.map.removeOverlay(start_marker);
    }
    var icon = new BMap.Icon("images/icon.png", new BMap.Size(36, 36));
    var latLng = new BMap.Point(lon, lat);
    start_marker = new BMap.Marker(latLng);
    start_marker.setLabel(new BMap.Label(content, { offset: new BMap.Size(30, 0) }));
    start_marker.getLabel().setStyle({ border: "0px solid red", backgroundColor: 'rgba(255, 255, 255, 0.7)', fontWeight: "bold", fontFamily: "微软雅黑", fontSize: "13px", textShadow: "#fff 1px 0 0,#fff 0 1px 0,#fff -1px 0 0,#fff 0 -1px 0" });
    start_marker.setTitle = content;
    this.map.addOverlay(start_marker);
};

bmap.prototype.addMarker = function (lon, lat, content) {
    if (current_marker) {
        this.map.removeOverlay(current_marker);
    }
    var latLng = new BMap.Point(lon, lat);
    current_marker = new BMap.Marker(latLng);
    this.map.addOverlay(current_marker);
};

bmap.prototype.addOverlay = function (type, points, radius, editingCallback, opt, name) {
    if (current_overlay) {
        this.map.removeOverlay(current_overlay);
    }
    var styleOptions = {
        strokeColor: "blue",    //边线颜色。
        fillColor: "blue",      //填充颜色。当参数为空时，圆形将没有填充效果。
        strokeWeight: 3,       //边线的宽度，以像素为单位。
        strokeOpacity: 0.8,	   //边线透明度，取值范围0 - 1。
        fillOpacity: 0.6,      //填充的透明度，取值范围0 - 1。
        strokeStyle: 'solid' //边线的样式，solid或dashed。
    };
    if (type === 1) {
        var icon = new BMap.Icon("poi/" + opt.type + ".png", new BMap.Size(24, 24));
        var latLng = new BMap.Point(points[0][0], points[0][1]);
        current_overlay = new BMap.Marker(latLng, { icon: icon });
        current_overlay.setLabel(new BMap.Label(name, { offset: new BMap.Size(26, 0) }));
        current_overlay.getLabel().setStyle({ border: "0px solid red", backgroundColor: 'rgba(255, 255, 255, 0)', fontWeight: "bold", fontFamily: "微软雅黑", fontSize: "13px", textShadow: "#fff 1px 0 0,#fff 0 1px 0,#fff -1px 0 0,#fff 0 -1px 0" });
    } else if (type === 4) {
        var cp = new BMap.Point(points[0][0], points[0][1]);
        current_overlay = new BMap.Circle(cp, radius, styleOptions);
    } else if (type === 2) {
        var paths = [];
        for (var i = 0; i < points.length; i++) {
            paths.push(new BMap.Point(points[i][0], points[i][1]));
        }
        current_overlay = new BMap.Polygon(paths, styleOptions);
    } else if (type === 3 || type === 5) {
        var paths = [];
        for (var i = 0; i < points.length; i++) {
            paths.push(new BMap.Point(points[i][0], points[i][1]));
        }
        current_overlay = new BMap.Polyline(paths, styleOptions);
    }
    this.map.addOverlay(current_overlay);
    // current_overlay.enableEditing();
    current_overlay.addEventListener('lineupdate', function (_type, target) {
        // console.log(type.target.getRadius());
        if (type === 4) {
            editingCallback(_type, target);
        }
    });
    return current_overlay;
};

bmap.prototype.setEditable = function (overlay) {
    if (overlay && overlay.enableEditing) {
        overlay.enableEditing();
    }
};

bmap.prototype.setDisable = function (overlay) {
    if (overlay && overlay.disableEditing) {
        overlay.disableEditing();
    }
};

bmap.prototype.removeOverlay = function (overlay) {
    this.map.removeOverlay(overlay);
};



bmap.prototype.addPanoramaCtrl = function (top, right) {
    // 创建控件
    var _this = this;
    var panoramaCtrl = new PanoramaControl(_this.map);
    panoramaCtrl.setOffset(new BMap.Size(right, top))
    // 添加到地图当中
    this.map.addControl(panoramaCtrl);
    var _this = this;
    //添加地图移动事件
    debugger;
    var movePanorama = function (type, target) {
        panorama.setPosition(new BMap.Point(_this.map.getCenter().lng, _this.map.getCenter().lat));
    };
    this.map.addEventListener("moveend", movePanorama);
    this.map.addEventListener("zoomend", movePanorama);
    this.map.addEventListener("resize", movePanorama);
}
bmap.prototype.distanceTool = function () {
    var myDis = new BMapLib.DistanceTool(this.map);
    $('#distanceTool').click(function () {
        myDis.open();
    })
}

bmap.prototype.cityList = function (top, right) {
    this.map.enableScrollWheelZoom();
    this.map.enableInertialDragging();
    this.map.enableContinuousZoom();
    var size = new BMap.Size(right, top);
    // var geoc = new BMap.Geocoder();
    this.map.addControl(new BMap.CityListControl({
        anchor: BMAP_ANCHOR_TOP_LEFT,
        offset: size,
        // 切换城市之间事件
        // onChangeBefore: function(){
        // },
        // 切换城市之后事件
        onChangeAfter: function () {
            var city = document.getElementById("cur_city_name");
        }
    }));
    var otherControl = setTimeout(() => {
        $('#cur_city_name').parent().addClass('br6');
        $('.otherControl').show();
        clearTimeout(otherControl)
    }, 1000)
}

bmap.prototype.traffic = function (top, right) {
    var size2 = new BMap.Size(right, top);
    var ctrl = new BMapLib.TrafficControl({
        showPanel: false, //是否显示路况提示面板,
        anchor: BMAP_ANCHOR_TOP_RIGHT,
    });
    this.map.addControl(ctrl);
    ctrl.setOffset(size2)
}

