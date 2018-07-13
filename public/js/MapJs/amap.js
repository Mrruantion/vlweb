var select_vehicle = null;
// var toolType = TOOL_TYPE_DEFAULT;
var current_marker = null;
var current_overlay = null;
var current_infowin = null;
var current_retangle = null;
var currentIdle = null;
var gaodemap;
// var _this = this;

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

function amap(div_map, center_point, zoom) {
    var _this = this;
    this.map = new AMap.Map(div_map);
    gaodemap = this.map;

    this.map.setZoomAndCenter(zoom, center_point);
    // var scale = new AMap.Scale(),
    // toolBar = new AMap.ToolBar(),
    // overView = new AMap.OverView();
    this.map.addControl(new AMap.Scale());
    this.map.addControl(new AMap.ToolBar());
    this.map.addControl(new AMap.OverView());

    AMapUI.loadUI(['control/BasicControl'], function (BasicControl) {
        var layerCtrl = new BasicControl.LayerSwitcher({
            position: { top: '10px', right: '20px', }
        });
        _this.map.addControl(layerCtrl);
    });
    // this.map.setCenter(point);
    // this.map.setZoom(zoom);
    // this.map.enableScrollWheelZoom();
    // this.map.addControl(new BMap.NavigationControl());
    // this.map.addControl(new BMap.ScaleControl());
    // this.map.addControl(new BMap.OverviewMapControl());
    // this.map.addControl(new BMap.MapTypeControl());
    this.geocoder = new AMap.Geocoder();
    geocoder = this.geocoder;
    this.vehicles = [];
    this.pois = [];
    this.geos = [];
    this.markers = [];
    this.markerTexts = [];
    this.poi_markers = [];
    this.markerClusterer = null;
    this.showLocation = null;
    this.mapClick = null;
    //    fn = refreshLabel(this.map, this.vehicles);
    //    this.map.addEventListener("dragend", fn);
};

amap.prototype.setCenter = function (lon, lat) {
    // point = new BMap.Point(lon, lat);
    point = [lon, lat]
    this.map.setCenter(point);
};

// 设置地图缩放比例
amap.prototype.setZoom = function (level) {
    this.map.setZoom(level);
};

// 获取地址后的函数处理
// amap.prototype.setShowLocation = function (fun) {
//     this.showLocation = fun;
// }

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

amap.prototype.addVehicles = function (vehicles, is_track, is_playback, if_open_win) {
    var v = null;
    var _this = this;
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
            // latLng = new BMap.Point(vehicles[i].activeGpsData.lon, vehicles[i].activeGpsData.lat);
            // latLng = [vehicles[i].activeGpsData.lon, vehicles[i].activeGpsData.lat];
            latLng = new AMap.LngLat(vehicles[i].activeGpsData.lon, vehicles[i].activeGpsData.lat)
            points.push(latLng);
            v = new vehicleMarker(vehicles[i], false, false, false);
            icon = getIcon(vehicles[i], MAP_TYPE_GAODE, _is_playback);
            title = vehicles[i].name + "（" + getStatusDesc(vehicles[i], 2) + "）";
            v.marker_ = new AMap.Marker({ map: this.map, position: latLng, icon: icon, offset: new AMap.Pixel(-13, -13) });
            vehicles[i].objectType != 9 ? v.marker_.setAngle(vehicles[i].activeGpsData.direct) : null;
            // v.marker_.setLabel({ content: vehicles[i].name, offset: new AMap.Pixel(15, -20) });
            // v.marker_.getLabel().setStyle({ border: "1px solid blue" });
            v.marker_.setTitle(title);
            v.markerText = new AMap.Text({ text: v.name, position: latLng, draggable: false, cursor: 'pointer', offset: new AMap.Pixel(0, -28) })
            if (!_is_playback) {
                content = getMapContent(vehicles[i], is_track);
                //打开该目标的信息窗体
                // var infowin = new BMap.InfoWindow(content, { enableAutoPan: false });
                // var infowin = new AMap.InfoWindow({ content: content })
                var infowin = new AMap.InfoWindow({ content: content });
                v.infowin_ = infowin;
                // debugger;
                // infowin.open({
                //     map: this.map,
                //     pos: latLng
                // })

                var fn = markerClickFunction(v, this);

                // v.marker_.addEventListener("click", fn);
                // AMap.event.addDomListener(v.marker_, 'click', function () {
                //     console.log(1)
                // })
                var _this = this;
                v.marker_.on('click', fn)
                // v.marker_.on('click', function (e) {
                //     // console.log(1)
                //     debugger;
                //     v.infowin_.open(_this.map, e.target.getPosition())
                // });
                if (_is_open_win) {
                    // this.map.openInfoWindow(v.infowin_, latLng);
                    infowin.open(_this.map, latLng)
                    var geoFn = geoFunction(v.did, latLng);
                    geocoder.getAddress(latLng, geoFn);
                }
            }

            this.vehicles[vehicles[i].did] = v;
            this.markers.push(v.marker_);
            this.markerTexts.push(v.markerText);
            // this.map.addOverlay(v.marker_);
            v.marker_.setMap(this.map);
            v.markerText.setMap(this.map);
        }
    }
    if (is_track) {
        // var vp = this.map.getViewport(points, {
        //     margins: [20, 20, 20, 20]
        // });
        // this.map.centerAndZoom(vp.center, vp.zoom);
        this.map.setCenter(latLng);
    }
};

amap.prototype.addIdles = function (did, idles) {
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

amap.prototype.addIdleMarker = function (lon, lat, index) {
    if (currentIdle) {
        this.map.remove(currentIdle);
    }
    var icon = new BMap.Icon("images/markerdown.png", new BMap.Size(23, 25), { anchor: new BMap.Size(10, 25) });
    var latLng = new BMap.Point(lon, lat);
    currentIdle = new BMap.Marker(latLng, { icon: icon });
    currentIdle.setLabel(new BMap.Label(index, { offset: new BMap.Size(4, 2) }));
    currentIdle.getLabel().setStyle({ border: "0px solid red", color: 'rgb(255, 255, 255)', backgroundColor: 'rgba(255, 255, 255, 0)', fontWeight: "normal", fontSize: "13px" });
    this.map.addOverlay(currentIdle);
};

amap.prototype.clearIdles = function (did) {
    var v = this.vehicles[did];
    if (v) {
        // var icon = new BMap.Icon("images/icon.png", new BMap.Size(36, 36));
        for (var i = 0; i < v.idles.length; i++) {
            this.map.remove(v.idles[i]);
        }
        v.idles = [];
    }
    if (currentIdle) {
        this.map.remove(currentIdle);
    }
};

var markerClickFunction = function (v, _this) {
    return function (e) {
        // v.marker_.openInfoWindow(v.infowin_);
        if (select_vehicle) {
            select_vehicle.infowin_.close();
        }
        var latLng = new AMap.LngLat(v.lon, v.lat);
        v.infowin_.open(_this.map, latLng)

        var geoFn = geoFunction(v.did, latLng);
        // geocoder.getLocation(latLng, geoFn, { "poiRadius": "500", "numPois": "10" });
        geocoder.getAddress(latLng, geoFn)
        select_vehicle = v;
    };
};

var geoFunction = function (did, latLng) {
    return function (status, result) {
        console.log(status, result, 'goFun')
        if (status === 'complete' && result.info === 'OK') {
            var getAddAddress = result.regeocode.formattedAddress; //返回地址描述
            $("#location" + did).html(getAddAddress);
        }
    };
};

// 更新目标显示
amap.prototype.updateVehicle = function (vehicle, if_track, if_show_line, if_open_win, color, width, if_playback) {
    var v = this.vehicles[vehicle.did];
    var _this = this;
    var content = "";
    var _if_track = vehicle.if_track || if_track;
    var _if_show_line = vehicle.if_show_line || if_show_line;
    if (v != null && vehicle.activeGpsData != undefined) {
        var oldlatLng;
        oldlatLng = new AMap.LngLat(v.lon, v.lat);
        v.lon = vehicle.activeGpsData.lon;
        v.lat = vehicle.activeGpsData.lat;
        v.gps_time = vehicle.activeGpsData.gpsTime;
        v.speed = vehicle.activeGpsData.speed;
        v.direct = vehicle.activeGpsData.direct;
        var icon = getIcon(vehicle, MAP_TYPE_GAODE, if_playback);
        var latLng;
        latLng = new AMap.LngLat(vehicle.activeGpsData.lon, vehicle.activeGpsData.lat);

        if (_if_show_line) {
            var distance = calDistance(oldlatLng.lat, oldlatLng.lng, latLng.lat, latLng.lng);
            if (distance < 10) {
                if (!v.track_line) {
                    var polyOptions = {
                        path: [],
                        strokeColor: color,
                        strokeOpacity: 1.0,
                        strokeWeight: width
                    };
                    v.track_line = new AMap.Polyline(polyOptions);
                    var path = v.track_line.getPath();
                    this.map.add(v.track_line);
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


        // v.marker_.getLabel().setContent(vehicle.name);
        v.marker_.setIcon(icon);
        v.marker_.setPosition(latLng);
        v.markerText.setPosition(latLng)
        // v.marker_.setRotation(vehicle.activeGpsData.direct);
        vehicle.objectType != 9 ? v.marker_.setAngle(vehicle.activeGpsData.direct) : null;
        // v.markerText = new AMap.Text({text:v.name,position:latLng,draggable:false,cursor:'pointer',offset:new AMap.Pixel(-10,-24)})
        // v.marker_.setLabel({ content: vehicle.name, offset: new AMap.Pixel(15, -20) });
        // v.marker_.getLabel().setStyle({ border: "1px solid blue" });
        // v.marker_.setTitle(title);
        // debugger;
        if (!if_playback) {
            content = getMapContent(vehicle, _if_track);
            v.infowin_.setContent(content);
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
            // this.map.openInfoWindow(v.infowin_, latLng);
            v.infowin_.open(_this.map, latLng)
            var geoFn = geoFunction(v.did, latLng);
            geocoder.getAddress(latLng, geoFn)
        }
    }
};

amap.prototype.findVehicle = function (did, if_track, if_open_win) {
    var v = this.vehicles[did];
    var _this = this;
    var content = "";
    if (v != null) {
        var latLng;
        // latLng = new BMap.Point(v.lon, v.lat);
        latLng = new AMap.LngLat(v.lon, v.lat);
        // latLng = [v.lon, v.lat]
        if (if_track) {
            this.map.setZoom(15);
            this.map.setCenter(latLng);
        }
        if (if_open_win) {
            if (select_vehicle) {
                select_vehicle.infowin_.close();
                select_vehicle.if_show_win = false;
                this.clearIdles(select_vehicle.did);
            }
            // v.marker_.open(v.infowin_);
            // v.infowin_.open({ map: this.map, pos: latLng})
            v.infowin_.open(_this.map, latLng)
            v.if_show_win = true;
            select_vehicle = v;
        }


        // 获取地址
        geocoder.getAddress(latLng, function (status, result) {
            console.log(status, result, 'find')
            if (status === 'complete' && result.info === 'OK') {

                var getAddAddress = result.regeocode.formattedAddress; //返回地址描述
                $("#location" + did).html(getAddAddress);
            }


        })
        return v;
    } else {

    }
};

amap.prototype.deleteVehicle = function (did) {
    var v = this.vehicles[did];
    if (v != null) {
        // 从数组中删除对象
        this.vehicles[did] = null;
        this.markers.pop(v.marker_);
        this.markerTexts.pop(v.markerText)
        if (v.marker_) {
            v.infowin_ ? v.infowin_.close() : null;
            this.map.remove(v.marker_);
            this.map.remove(v.markerText)
        }
        if (v.track_lines) {
            for (var i = 0; i < v.track_lines.length; i++) {
                this.map.remove(v.track_lines[i]);
            }
        }
    }
}

amap.prototype.clearVehicle = function () {
    for (var i = this.markers.length - 1; i >= 0; i--) {
        var m = this.markers[i];
        var m1 = this.markerTexts[i];
        if (m) {
            this.map.remove(m);
            this.map.remove(m1);
        }
    }
    this.vehicles = [];
    this.markers = [];
    this.markerTexts = [];
};


amap.prototype.addTrackLine = function (vehicle, gps_datas, color, width, centerAndZoom) {
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
    var oldlatLng;
    for (var i = 0; i < gps_datas.length; i++) {
        // latLng = new BMap.Point(gps_datas[i].lon, gps_datas[i].lat);
        // latLng = new AMap.LngLat(gps_datas[i].lon, gps_datas[i].lat);
        // points.push(latLng);
        latLng = new AMap.LngLat(gps_datas[i].lon, gps_datas[i].lat);
        var distance = oldlatLng ? calDistance(oldlatLng.lat, oldlatLng.lng, latLng.lat, latLng.lng): 0;
        allpoints.push(latLng)
        if (distance < 10) {
            points.push(latLng);
        } else {
            lineObj[lineIndex] = points;
            lineIndex++;
            points = [latLng];
            // points.push(latLng)
        }
        oldlatLng = latLng;
    }
    lineObj[lineIndex] = points;
    // console.log(lineObj)

    var polyOptions = {
        strokeColor: color,
        strokeOpacity: 1.0,
        strokeWeight: width,
        // path: points,
        map: this.map
    };
    if (v.track_line) {
        this.map.remove(v.track_line);
    };
    // v.track_line = new BMap.Polyline(points, polyOptions);
   
    for(var i in lineObj){
        // console.log(lineObj[i])
        polyOptions.path = lineObj[i];
        v.track_line = new AMap.Polyline(polyOptions);
        this.map.add(v.track_line);
    }   
    if (centerAndZoom) {
        // this.map.setFitView(points)
        // var vp = this.map.getViewport(points, {
        //     margins: [10, 10, 10, 10]
        // });
        // this.map.centerAndZoom(vp.center, vp.zoom);
        // this.setCenter(points[0]);
        // this.setZoom(15)
        this.map.setFitView()
        // this.map.setZoomAndCenter(10, allpoints[0])

    }
}

amap.prototype.removeTrackLine = function (vehicle) {
    var v = this.vehicles[vehicle.did];
    var content = "";
    if (v != null && v.track_line != null) {
        for (var i = 0; i < v.track_lines.length; i++) {
            this.map.remove(v.track_lines[i]);
        }
        this.map.remove(v.track_line);
        v.track_line = null;
    }
}

amap.prototype.addTrackPoint = function (vehicle, gps_datas, color, width, centerAndZoom) {
    var v = this.vehicles[vehicle.did];
    var content = "";
    if (v == null) {
        v = new vehicleMarker(vehicle, false, false);
        this.vehicles[vehicle.did] = v;
    }
    var points = [];
    var latLng;
    var massData = [];
    for (var i = 0; i < gps_datas.length; i++) {
        // latLng = new BMap.Point(gps_datas[i].lon, gps_datas[i].lat);
        latLng = new AMap.LngLat(gps_datas[i].lon, gps_datas[i].lat)
        points.push(latLng);
        massData.push({ lnglat: [gps_datas[i].lon, gps_datas[i].lat] })
    }

    var options = {
        opacity: 0.8,
        zIndex: 111,
        cursor: 'pointer',
        style: {
            anchor: new AMap.Pixel(5, 5),
            url: 'img/point.png',
            size: new AMap.Size(11, 11)
        }
    };
    if (v.track_point) {
        // this.map.removeOverlay(v.track_point);
        this.map.remove(v.track_point);
    }
    // var massData = [];
    // points
    v.track_point = new AMap.MassMarks(massData, options)
    v.track_point.setMap(gaodemap)
    // v.track_point = new BMap.PointCollection(points, options);
    // this.map.addOverlay(v.track_point);

    if (centerAndZoom) {
        // var vp = this.map.getViewport(points, {
        //     margins: [10, 10, 10, 10]
        // });
        // this.map.centerAndZoom(vp.center, vp.zoom);
        this.map.setFitView();
        // this.map.setZoomAndCenter(15, points[0])
    }
};

amap.prototype.removeTrackPoint = function (vehicle) {
    var v = this.vehicles[vehicle.did];
    var content = "";
    if (v != null && v.track_point != null) {
        this.map.remove(v.track_point);
        v.track_point = null;
    }
}

amap.prototype.moveTrackPoint = function (vehicle, gps_data, if_open_win) {
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

amap.prototype.addPois = function (pois) {
    var p = null;
    var latLng = null;
    var icon = "";
    var title = "";
    for (var i = 0; i < pois.length; i++) {
        this.addPoi(pois[i]);
    }
}

amap.prototype.addPoi = function (poi) {
    var p = null;
    var latLng = null;
    var icon = "";
    var title = "";
    var p = this.pois[poi.objectId];
    // 判断兴趣点是否存在，存在则更新数据，不存在则添加
    if (p === null) {
        latLng = new BMap.Point(poi.points[0][0], poi.points[0][1]);
        p = new poiMarker(poi);
        icon = getPoiIcon(poi, MAP_TYPE_GAODE);
        title = p.poi_name;
        p.marker_ = new BMap.Marker(latLng, { icon: icon });
        p.marker_.setLabel(new BMap.Label(title, { offset: new BMap.Size(26, 0) }));
        p.marker_.getLabel().setStyle({ border: "0px solid red", backgroundColor: 'rgba(255, 255, 255, 0)', fontWeight: "bold", fontFamily: "微软雅黑", fontSize: "13px", textShadow: "#fff 1px 0 0,#fff 0 1px 0,#fff -1px 0 0,#fff 0 -1px 0" });
        this.map.addOverlay(p.marker_);
        this.pois[poi.objectId] = p;
        this.poi_markers.push(p.marker_);
    }
}

amap.prototype.addBranches = function (branches) {
    var p = null;
    var latLng = null;
    var icon = "";
    var title = "";
    for (var i = 0; i < branches.length; i++) {
        this.addBranch(branches[i]);
    }
}

amap.prototype.addBranch = function (branch) {
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
        // icon = getPoiIcon(branch, MAP_TYPE_GAODE);
        p.marker_ = new BMap.Marker(latLng, { icon: icon });
        p.marker_.setLabel(new BMap.Label(branch.name, { offset: new BMap.Size(30, 0) }));
        p.marker_.getLabel().setStyle({ border: "1px solid blue", "background-color": "#fff" });
        this.map.addOverlay(p.marker_);
        this.pois[branch._id] = p;
        this.poi_markers.push(p.marker_);
    }
};

amap.prototype.findBranch = function (_id) {
    var p = this.pois[_id];
    var content = "";
    if (p != null) {
        this.setCenter(p.lon, p.lat);
        return p;
    }
};

amap.prototype.updateBranch = function (branch) {
    var p = this.pois[branch._id];
    var content = "";
    if (p != null) {
        p.name = branch.name;
        // var icon = getPoiIcon(poi, MAP_TYPE_GAODE);
        // p.marker_.setIcon(icon);
        var latLng;
        latLng = new BMap.Point(branch.lon, branch.lat);
        p.marker_.setPosition(latLng);
        p.marker_.getLabel().setContent(branch.name);
    }
};

amap.prototype.clearPoi = function () {
    for (var i = 0; i < this.poi_markers.length; i++) {
        var m = this.poi_markers[i];
        if (m) {
            this.map.removeOverlay(m);
        }
    }
    this.poi_markers = [];
    this.pois = [];
}

var start_marker;
amap.prototype.addStartMarker = function (lon, lat, content) {
    if (start_marker) {
        this.map.remove(start_marker);
    }
    var icon = new AMap.Icon({
        image: "images/icon.png",
        imageOffset: new AMap.Pixel(0, 0)
    });
    // var icon = new BMap.Icon("images/icon.png", new AMap.Size(36, 36));
    // var latLng = new BMap.Point(lon, lat);
    var latLng = new AMap.LngLat(lon, lat)
    // start_marker = new BMap.Marker(latLng);
    start_marker = new AMap.Marker({ position: latLng  })
    // start_marker.setLabel(new BMap.Label(content, { offset: new BMap.Size(30, 0) }));
    start_marker.setLabel({ content: content,offset: new AMap.Pixel(15, -20) })
    // start_marker.getLabel().setStyle({ border: "0px solid red", backgroundColor: 'rgba(255, 255, 255, 0.7)', fontWeight: "bold", fontFamily: "微软雅黑", fontSize: "13px", textShadow: "#fff 1px 0 0,#fff 0 1px 0,#fff -1px 0 0,#fff 0 -1px 0" });
    // start_marker.setTitle = content;
    start_marker.setTitle(content)
    this.map.add(start_marker);
};

amap.prototype.addMarker = function (lon, lat, content) {
    if (current_marker) {
        this.map.remove(current_marker);
    }
    var latLng = new AMap.LngLat(lon, lat);
    current_marker = new AMap.Marker({ position: latLng });
    this.map.add(current_marker);
};

amap.prototype.addOverlay = function (type, points, radius, editingCallback, opt, name) {

    if (current_overlay) {
        this.map.remove(current_overlay);
    }
    var styleOptions = {
        map: this.map,
        strokeColor: "blue",    //边线颜色。
        fillColor: "blue",      //填充颜色。当参数为空时，圆形将没有填充效果。
        strokeWeight: 3,       //边线的宽度，以像素为单位。
        strokeOpacity: 0.8,	   //边线透明度，取值范围0 - 1。
        fillOpacity: 0.6,      //填充的透明度，取值范围0 - 1。
        strokeStyle: 'solid' //边线的样式，solid或dashed。
    };
    if (type === 1) {
        // var icon = new BMap.Icon("poi/" + opt.type + ".png", new BMap.Size(24, 24));
        var icon = new AMap.Icon({
            image: "poi/" + opt.type + ".png",
            imageOffset: new AMap.Pixel(0, 0)
        });
        var latLng = new AMap.LngLat(points[0][0], points[0][1]);

        // current_overlay = new BMap.Marker(latLng, { icon: icon });
        // current_overlay.setLabel(new BMap.Label(name, { offset: new BMap.Size(26, 0) }));
        // current_overlay.getLabel().setStyle({ border: "0px solid red", backgroundColor: 'rgba(255, 255, 255, 0)', fontWeight: "bold", fontFamily: "微软雅黑", fontSize: "13px", textShadow: "#fff 1px 0 0,#fff 0 1px 0,#fff -1px 0 0,#fff 0 -1px 0" });

        current_overlay = new AMap.Marker({ map: gaodemap, position: latLng, icon: icon })
        // var markerText = new AMap.Text({ text: name, textAlign: 'center', position: latLng });
        // this.map.add(markerText);
        current_overlay.setLabel({ content: name, offset: new AMap.Pixel(15, -20) });
        // current_overlay.setExtData({style:{border:'0px'}})
        setTimeout(() => { $('.amap-marker-label').css({ border: "0px solid red", backgroundColor: 'rgba(255, 255, 255, 0)', fontWeight: "bold", fontFamily: "微软雅黑", fontSize: "13px", textShadow: "#fff 1px 0 0,#fff 0 1px 0,#fff -1px 0 0,#fff 0 -1px 0" }) }, 100)
        // console.log($(current_overlay))

    } else if (type === 4) {
        var cp = new AMap.LngLat(points[0][0], points[0][1]);
        styleOptions.center = cp;
        styleOptions.radius = radius;
        current_overlay = new AMap.Circle(styleOptions);
    } else if (type === 2) {
        var paths = [];
        for (var i = 0; i < points.length; i++) {
            // paths.push(new BMap.Point(points[i][0], points[i][1]));
            paths.push(new AMap.LngLat(points[i][0], points[i][1]));
        }
        styleOptions.path = paths;
        current_overlay = new AMap.Polygon(styleOptions)
        // current_overlay = new BMap.Polygon(paths, styleOptions);
    } else if (type === 3 || type === 5) {
        var paths = [];
        for (var i = 0; i < points.length; i++) {
            // paths.push(new BMap.Point(points[i][0], points[i][1]));
            paths.push(new AMap.LngLat(points[i][0], points[i][1]));
        }
        styleOptions.path = paths;
        current_overlay = new AMap.Polyline(styleOptions)
        // current_overlay = new BMap.Polyline(paths, styleOptions);
    }
    this.map.add(current_overlay);
    // type == 1  ? $('.amap-marker-label').css({border:'0px solid #ccc'}):null
    // current_overlay.enableEditing();
    // current_overlay.addEventListener('lineupdate', function (_type, target) {
    //     // console.log(type.target.getRadius());
    //     if (type === 4) {
    //         editingCallback(_type, target);
    //     }
    // });
    return current_overlay;
};

amap.prototype.setEditable = function (overlay) {
    if (overlay && overlay.enableEditing) {
        overlay.enableEditing();
    }
};

amap.prototype.setDisable = function (overlay) {
    if (overlay && overlay.disableEditing) {
        overlay.disableEditing();
    }
};

amap.prototype.removeOverlay = function (overlay) {
    this.map.remove(overlay);
};

amap.prototype.geofenceType = function () {

}

amap.prototype.distanceTool = function () {
    var ruler;
    ruler = new AMap.RangingTool(gaodemap);
    AMap.event.addListener(ruler, "end", function (e) {
        ruler.turnOff();
    });
    return ruler
}