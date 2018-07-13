var select_vehicle = null;
var toolType = TOOL_TYPE_DEFAULT;
var current_marker = null;
var current_infowin = null;
var current_retangle = null;
var currentIdle = null;
var geocoder;
var current_overlay = null;

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

function gmap(div_map, center_point, zoom) {
    this.map = new google.maps.Map(div_map, {
        zoom: zoom,
        center: center_point,
        scrollwheel: true,
        gestureHandling: 'greedy',
        fullscreenControl: false,
        mapTypeControlOptions: {
            mapTypeIds: [google.maps.MapTypeId.ROADMAP, google.maps.MapTypeId.SATELLITE],
            position: google.maps.ControlPosition.RIGHT_TOP
        },
        zoomControlOptions: {
            position: google.maps.ControlPosition.LEFT_TOP
        },
        streetViewControlOptions: {
            position: google.maps.ControlPosition.LEFT_TOP
        }
    });
    this.geocoder = new google.maps.Geocoder();
    geocoder = this.geocoder;
    this.vehicles = [];
    this.pois = [];
    this.geos = [];
    this.markers = [];
    this.poi_markers = [];
    // this.markerClusterer = null;
    this.showLocation = null;
    this.mapClick = null;
}

gmap.prototype.setCenter = function (lon, lat) {
    point = new google.maps.LatLng(lat, lon);
    this.map.setCenter(point);
};

gmap.prototype.getCenter = function(){
    var lon = this.map.center.lng();
    var lat = this.map.center.lat();
    return {
        lon: lon,
        lat: lat
    }
};

// 获取地址后的函数处理
gmap.prototype.setShowLocation = function (fun) {
    this.showLocation = fun;
};

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
    this.track_lines = [];
    this.track_points = [];
    this.content = "";
    this.marker_ = null;
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

gmap.prototype.addVehicles = function (vehicles, is_track, is_playback, if_open_win) {
    var v = null;
    var latLng = null;
    var icon = "";
    var title = "";
    var _is_playback = is_playback || false;
    var _is_open_win = if_open_win || false;
    for (var i = 0; i < vehicles.length; i++) {
        if (vehicles[0] != null) {
            if(vehicles[i].activeGpsData === undefined)continue;
            var v = this.vehicles[vehicles[i].did];
            // 判断目标是否存在，存在则更新数据，不存在则添加
            if (v != null) {
                this.updateVehicle(vehicles[i], is_track, is_track, _is_open_win, '#FF0000', 3, is_playback);
            } else {
                latLng = new google.maps.LatLng(vehicles[i].activeGpsData.lat, vehicles[i].activeGpsData.lon);
                v = new vehicleMarker(vehicles[i], false, false);
                icon = getIcon(vehicles[i], MAP_TYPE_GOOGLE, _is_playback);
                title = vehicles[i].name + "（" + getStatusDesc(vehicles[i], 2) + "）";
                // v.marker_ = new MarkerWithLabel({
                //     title: title,
                //     position: latLng,
                //     icon: icon,
                //     draggable: false,
                //     raiseOnDrag: false,
                //     //map: this.map,
                //     labelContent: vehicles[i].name,
                //     labelAnchor: new google.maps.Point(0, 20),
                //     labelClass: "labels", // the CSS class for the label
                //     labelStyle: { opacity: 0.75 }
                // });
                var label = {
                    text: vehicles[i].name,
                    color: '#666666',
                    fontSize: '12px'
                };
                v.marker_ = new google.maps.Marker({
                    position: latLng,
                    label: label,
                    icon: icon
                });
                if(!_is_playback){
                    content = getMapContent(vehicles[i]);
                    //打开该目标的信息窗体
                    var infowin = new google.maps.InfoWindow({
                        content: content,
                        disableAutoPan: true
                    });
                    v.infowin_ = infowin;

                    var fn = markerClickFunction(v);
                    google.maps.event.addListener(v.marker_, "click", fn);

                    google.maps.event.addListener(this.map, "click", function (e) {
                        if (select_vehicle) {
                            select_vehicle.infowin_.close();
                        }
                    });
                }
                this.vehicles[vehicles[i].did] = v;
                this.markers.push(v.marker_);
                v.marker_.setMap(this.map);
            }
        }
    }

    // if (this.markerClusterer == null) {
    //     //        this.markerClusterer = new MarkerClusterer(this.map, this.markers);
    //     this.markerClusterer = new MarkerClusterer(this.map, this.markers, { minimumClusterSize: 5, maxZoom: 20 });
    // } else {
    //     this.markerClusterer.addMarkers(this.markers);
    // }

    if(is_track){
        // var vp = this.map.getViewport(points, {
        //     margins: [20, 20, 20, 20]
        // });
        this.map.setCenter(latLng);
    }
};

gmap.prototype.addIdles = function(did, idles){
    var v = this.vehicles[did];
    if(v){
        // var icon = new BMap.Icon("images/icon.png", new BMap.Size(36, 36));
        for(var i = 0; i < idles.length; i++){
            // var latLng = new BMap.Point(idles[i].startLon, idles[i].startLat);
            // var _idleMarker = new BMap.Marker(latLng);
            // _idleMarker.setLabel(new BMap.Label((i + 1).toString(), {offset: new BMap.Size(4, 2)}));
            // _idleMarker.getLabel().setStyle({border: "0px solid red", color: 'rgb(255, 255, 255)', backgroundColor: 'rgba(255, 255, 255, 0)', fontWeight: "normal", fontSize: "13px"});
            // v.idles.push(_idleMarker);
            // this.map.addOverlay(_idleMarker);
            var latLng = new google.maps.LatLng(idles[i].startLat, idles[i].startLon);
            var marker = new google.maps.Marker({
                position: latLng,
                map: this.map,
                icon: {
                    scaledSize: new google.maps.Size(23, 25),
                    anchor: new google.maps.Point(12, 12),
                    url: 'images/marker.png'
                },
                label: {
                    text: (i + 1).toString(),
                    color: '#fff'
                }
            });
            v.idles.push(marker);
        }
    }
};

gmap.prototype.addIdleMarker = function (lon, lat, index) {
    if (currentIdle) {
        // this.map.removeOverlay(currentIdle);
        currentIdle.setMap(null);
    }
    // var icon = new BMap.Icon("images/markerdown.png", new BMap.Size(23, 25), {anchor: new BMap.Size(10, 25)});
    // var latLng = new BMap.Point(lon, lat);
    // currentIdle = new BMap.Marker(latLng, {icon: icon});
    // currentIdle.setLabel(new BMap.Label(index, {offset: new BMap.Size(4, 2)}));
    // currentIdle.getLabel().setStyle({border: "0px solid red", color: 'rgb(255, 255, 255)', backgroundColor: 'rgba(255, 255, 255, 0)', fontWeight: "normal", fontSize: "13px"});
    // this.map.addOverlay(currentIdle);
    var latLng = new google.maps.LatLng(lat, lon);
    currentIdle = new google.maps.Marker({
        position: latLng,
        map: this.map,
        icon: {
            scaledSize: new google.maps.Size(23, 25),
            anchor: new google.maps.Point(12, 12),
            url: 'images/markerdown.png'
        },
        label: {
            text: index,
            color: '#fff'
        }
    });
};

gmap.prototype.clearIdles = function(did){
    var v = this.vehicles[did];
    if(v){
        // var icon = new BMap.Icon("images/icon.png", new BMap.Size(36, 36));
        for(var i = 0; i < v.idles.length; i++){
            v.idles[i].setMap(null);
        }
        v.idles = [];
    }
    if (currentIdle) {
        currentIdle.setMap(null);
    }
};

var markerClickFunction = function (v) {
    return function (e) {
        if (select_vehicle) {
            select_vehicle.infowin_.close();
        }

        v.infowin_.open(this.map, this);
        var latLng = new google.maps.LatLng(v.lat, v.lon);
        var geoFn = geoFunction(v.did);
        geocoder.geocode({'latLng': latLng}, geoFn);
        // 设置该目标为选中目标
        select_vehicle = v;
    };
};

var geoFunction = function (did) {
    return function (results, status) {
        if (status === google.maps.GeocoderStatus.OK) {
            if (results[1]) {
                $("#location" + did).html(results[0].formatted_address);
            }
        } else {
            //alert("Geocoder failed due to: " + status);
        }
    }
};

// 设置地图缩放比例
gmap.prototype.setZoom = function (level) {
    this.map.setZoom(level);
};

// 更新目标显示
gmap.prototype.updateVehicle = function (vehicle, if_track, if_show_line, if_open_win, color, width, if_playback) {
    var v = this.vehicles[vehicle.did];
    var content = "";
    var _if_track = vehicle.if_track || if_track;
    var _if_show_line = vehicle.if_show_line || if_show_line;
    if (v != null && vehicle.activeGpsData != undefined) {
        var oldlatLng;
        var oldGpsTime;
        oldlatLng = new google.maps.LatLng(v.lat, v.lon);
        oldGpsTime = v.gpsTime;
        v.lon = vehicle.activeGpsData.lon;
        v.lat = vehicle.activeGpsData.lat;
        v.gpsTime = vehicle.activeGpsData.gpsTime;
        v.speed = vehicle.activeGpsData.speed;
        v.direct = vehicle.activeGpsData.direct;

        var latLng;
        latLng = new google.maps.LatLng(vehicle.activeGpsData.lat, vehicle.activeGpsData.lon);

        var distance;
        if (_if_show_line) {
            distance = calDistance(oldlatLng.lng(), oldlatLng.lat(), latLng.lng(), latLng.lat());
            //            var duration = dateDiff(NewDate(oldGpsTime), NewDate(v.gps_time), "mm")
            if (distance < 2) {
                if (!v.track_line) {
                    var polyOptions = {
                        strokeColor: color,
                        strokeOpacity: 1.0,
                        strokeWeight: width
                    };
                    v.track_line = new google.maps.Polyline(polyOptions);
                    v.track_line.setMap(this.map);
                    var path = v.track_line.getPath();
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


        var icon = getIcon(vehicle, MAP_TYPE_GOOGLE, if_playback);
        v.marker_.setPosition(latLng);
        v.marker_.setIcon(icon);
        v.marker_.setVisible(true);
        if (!if_playback) {
            content = getMapContent(vehicle, if_playback);
            v.infowin_.setContent(content);
        }

        if (_if_track) {
            var bounds = this.map.getBounds();
            if (v.lon < bounds.getSouthWest().lng() || v.lon > bounds.getNorthEast().lng() ||
                v.lat < bounds.getSouthWest().lat() || v.lat > bounds.getNorthEast().lat()) {
                this.map.setCenter(latLng);
            }
        }

        if (v.if_show_win || if_open_win) {
            v.infowin_.open(this.map, v.marker_);
            var geoFn = geoFunction(v.did);
            this.geocoder.geocode({'latLng': latLng}, geoFn);
        }
    }
};

gmap.prototype.findVehicle = function (obj_id, if_track, if_open_win) {
    var v = this.vehicles[obj_id];
    var content = "";
    if (v != null) {
        var latLng;
//        if (this.map.getMapTypeId() == google.maps.MapTypeId.SATELLITE || this.map.getMapTypeId() == google.maps.MapTypeId.HYBRID) {
//            latLng = new google.maps.LatLng(v.lat, v.lon);
//        } else {
            latLng = new google.maps.LatLng(v.lat, v.lon);
//        }
        if (if_track) {
            this.map.setZoom(15);
            this.map.setCenter(latLng);
        }
        if (if_open_win) {
            if (select_vehicle) {
                select_vehicle.infowin_.close();
                select_vehicle.if_show_win = false;
            }
            v.infowin_.open(this.map, v.marker_);
            v.if_show_win = true;
            select_vehicle = v;
        }
        // 获取地址
        this.geocoder.geocode({'latLng': new google.maps.LatLng(v.lat, v.lon)}, function (results, status) {
            if (status === google.maps.GeocoderStatus.OK) {
                if (results[1]) {
                    $("#location" + obj_id).html(results[0].formatted_address);
                }
            } else {
                //alert("Geocoder failed due to: " + status);
            }
        });
        // var pt = new BMap.Point(v.lon, v.lat);
        // if (typeof (BMap.Convertor) != "undefined") {
        //     BMap.Convertor.translate(pt, 2, function (point) {
        //         var gc = new BMap.Geocoder();
        //         gc.getLocation(point, function (rs) {
        //             var di = 2000;
        //             var shortpoint = -1;
        //             for (i = 0; i < rs.surroundingPois.length; i++) {
        //                 var d = baidumap.getDistance(rs.surroundingPois[i].point, point);
        //                 if (d < di) {
        //                     shortpoint = i;
        //                     di = d;
        //                 }
        //             }
        //
        //             if (shortpoint >= 0) {
        //                 getAddAddress = rs.address + '，离' + rs.surroundingPois[shortpoint].title + di.toFixed(0) + '米';
        //             } else {
        //                 getAddAddress = rs.address;
        //             }
        //
        //             if (showLocation) {
        //                 this.showLocation(getAddAddress);
        //             }
        //         }, { "poiRadius": "500", "numPois": "10" });
        //     });
        // }
        return v;
    }

};

gmap.prototype.deleteVehicle = function (obj_id) {
    var v = this.vehicles[obj_id];
    if (v != null) {
        // 从数组中删除对象
        this.vehicles[obj_id] = null;
        this.markers.pop(v.marker_);
        v.marker_.setMap(null);
        // this.markerClusterer.removeMarker(v.marker_);
        if (v.track_lines) {
            for (var i = 0; i < v.track_lines.length; i++) {
                v.track_lines[i].setMap(null);
            }
        }
    }
};

gmap.prototype.clearVehicle = function () {
    for (var i = this.markers.length - 1; i >= 0 ; i--) {
        var m = this.markers[i];
        if (m) {
            m.setMap(null);
        }
    }
    this.vehicles = [];
    this.markers = [];
};


gmap.prototype.addTrackLine = function (vehicle, gps_datas, color, width) {
    var v = this.vehicles[vehicle.did];
    var content = "";
    if (v == null) {
        v = new vehicleMarker(vehicle, false, false);
        this.vehicles[vehicle.did] = v;
    }
    var points = [];
    var latLng;
    for (var i = 0; i < gps_datas.length; i++) {
        latLng = new google.maps.LatLng(gps_datas[i].lat, gps_datas[i].lon);
        points.push(latLng);
    }

    var polyOptions = {
        path: points,
        strokeColor: color,
        strokeOpacity: 1.0,
        strokeWeight: width
    };
    if (v.track_line) {
        v.track_line.setMap(null);
    };
    v.track_line = new google.maps.Polyline(polyOptions);
    v.track_line.setMap(this.map);
};

gmap.prototype.removeTrackLine = function (vehicle) {
    var v = this.vehicles[vehicle.did];
    var content = "";
    if (v != null && v.track_line != null) {
        v.track_line.setMap(null);
        v.track_line = null;
    }
};

gmap.prototype.addTrackPoint = function (vehicle, gps_datas, color, width, centerAndZoom) {
    var v = this.vehicles[vehicle.did];
    var content = "";
    if (v == null) {
        v = new vehicleMarker(vehicle, false, false);
        this.vehicles[vehicle.did] = v;
    }
    var points = [];
    var latLng;
    for (var i = 0; i < gps_datas.length; i++) {
        latLng = new google.maps.LatLng(gps_datas[i].lat, gps_datas[i].lon);
        var marker = new google.maps.Marker({
            position: latLng,
            map: this.map,
            icon: {
                scaledSize: new google.maps.Size(12, 12),
                anchor: new google.maps.Point(6, 6),
                url: 'img/point.png'
            }
        });
        v.track_points.push(marker);
    }

    if(centerAndZoom){
        // var vp = this.map.getViewport(points, {
        //     margins: [10, 10, 10, 10]
        // });
        // this.map.centerAndZoom(vp.center, vp.zoom);
    }
};

gmap.prototype.removeTrackPoint = function (vehicle) {
    var v = this.vehicles[vehicle.did];
    var content = "";
    if(v && v.track_points){
        for(var i = 0; i < v.track_points.length; i++){
            v.track_points[i].setMap(null);
        }
        v.track_points = [];
    }
};

gmap.prototype.moveTrackPoint = function (vehicle, gps_data, if_open_win) {
    var v = vehicle;
    v.active_gps_data.lon = gps_data.lon;
    v.active_gps_data.lat = gps_data.lat;
    v.active_gps_data.rev_lon = gps_data.rev_lon;
    v.active_gps_data.rev_lat = gps_data.rev_lat;
    v.active_gps_data.speed = gps_data.speed;
    v.active_gps_data.direct = gps_data.direct;
    v.active_gps_data.gps_time = gps_data.gps_time;
    v.active_gps_data.uni_status = gps_data.uni_status;
    v.active_gps_data.uni_alerts = gps_data.uni_alerts;
    this.updateVehicle(v, true, true, if_open_win, 'green', 3, true);
}

function strPad(hex) {
    var zero = '00000000';
    var tmp = 8 - hex.length;
    return zero.substr(0, tmp) + hex;
}

gmap.prototype.openAddGeoTool = function () {
    google.maps.event.addListener(this.map, 'click', function (event) {
        //alert(event.latLng);
        var lon = parseInt(event.latLng.lat() * 600000);
        var lat = parseInt(event.latLng.lng() * 600000);
        lon = strPad(lon.toString(16).toUpperCase());
        lat = strPad(lat.toString(16).toUpperCase());
        alert(lat + "," + lon);
    });
}

var onMapClick = function (map, title, div_content) {
    return function (event) {
        switch (toolType) {
            case TOOL_TYPE_POI:
                //alert("兴趣点：" + event.latLng);
                if (current_infowin) {
                    current_infowin.close();
                }
                current_infowin = new google.maps.InfoWindow({
                    content: div_content,
                    disableAutoPan: true
                });
                if (current_marker) {
                    current_marker.setMap(null);
                }
                current_marker = new google.maps.Marker({
                    position: event.latLng,
                    map: map,
                    title: title
                });
                current_infowin.open(map, current_marker);
                break;
            case TOOL_TYPE_GEO:
                //alert("矩形围栏：" + event.latLng);
                if (current_infowin) {
                    current_infowin.close();
                }
                current_infowin = new google.maps.InfoWindow({
                    content: div_content,
                    disableAutoPan: true,
                    position: event.latLng
                });
                if (current_retangle) {
                    current_retangle.setMap(null);
                }
                current_retangle = new google.maps.Rectangle({
                    strokeColor: "#FF0000",
                    strokeOpacity: 0.8,
                    strokeWeight: 2,
                    fillColor: "#FF0000",
                    fillOpacity: 0.35,
                    map: map,
                    bounds: getRectangle(event.latLng.lng(), event.latLng.lat(), 100)
                });
                current_infowin.open(map);
                break;
            case TOOL_TYPE_POLY:
                alert("多边形围栏：" + event.latLng);
                break;
            case TOOL_TYPE_ROUTE:
                alert("线路：" + event.latLng);
                break;
        }
    }
}

gmap.prototype.setTool = function (tool_type, title, div_content, callback) {
    toolType = tool_type;
    switch (tool_type) {
        case TOOL_TYPE_DEFAULT:
            google.maps.event.removeListener(this.mapClick);
            if (current_infowin) {
                current_infowin.close();
            }
            if (current_marker) {
                current_marker.setMap(null);
            }
            break;
        case TOOL_TYPE_POI:
        case TOOL_TYPE_GEO:
        case TOOL_TYPE_POLY:
        case TOOL_TYPE_ROUTE:
            fn = onMapClick(this.map, title, div_content);
            this.mapClick = google.maps.event.addListener(this.map, 'click', fn);
            break;
    }
}

gmap.prototype.addPois = function (pois) {
    var p = null;
    var latLng = null;
    var icon = "";
    var title = "";
    for (var i = 0; i < pois.length; i++) {
        this.addPoi(pois[i]);
    }
}

gmap.prototype.addPoi = function (poi) {
    var p = null;
    var latLng = null;
    var icon = "";
    var title = "";
    var p = this.pois[poi.objectId];
    // 判断兴趣点是否存在，存在则更新数据，不存在则添加
    if (p === null) {
        latLng = new google.maps.LatLng(poi.points[0][1], poi.points[0][0]);
        p = new poiMarker(poi);
        icon = getPoiIcon(poi, MAP_TYPE_GOOGLE);
        var label = {
            text: poi.name,
            color: '#666666',
            fontSize: '12px'
        };
        p.marker_ = new google.maps.Marker({
            position: latLng,
            label: label,
            map: this.map,
            icon: icon
        });
        this.pois[poi.objectId] = p;
        this.poi_markers.push(p.marker_);
    }
}

gmap.prototype.findPoi = function (poi_id) {
    var p = this.pois[poi_id];
    var content = "";
    if (p != null) {
        var latLng;
        //        if (this.map.getMapTypeId() == google.maps.MapTypeId.SATELLITE || this.map.getMapTypeId() == google.maps.MapTypeId.HYBRID) {
        //            latLng = new google.maps.LatLng(p.lat, p.lon);
        //        } else {
        latLng = new google.maps.LatLng(p.rev_lat, p.rev_lon);
        //        }
        this.map.setZoom(10);
        this.map.setCenter(latLng);
        return p;
    }

}

gmap.prototype.editPoi = function (div_content, poi_id, callback) {
    //找到对应的poi
    var p = this.pois[poi_id];
    if (p) {
        var latLng;
        //        if (this.map.getMapTypeId() == google.maps.MapTypeId.SATELLITE || this.map.getMapTypeId() == google.maps.MapTypeId.HYBRID) {
        //            latLng = new google.maps.LatLng(p.lat, p.lon);
        //        } else {
        latLng = new google.maps.LatLng(p.rev_lat, p.rev_lon);
        //        }
        this.map.setZoom(10);
        this.map.setCenter(latLng);
        current_infowin = new google.maps.InfoWindow({
            content: div_content,
            disableAutoPan: true
        });
        if (current_marker) {
            current_marker.setMap(null);
        }
        current_marker = new google.maps.Marker({
            position: p.marker_.position,
            map: this.map,
            title: p.poi_name
        });
        current_infowin.open(this.map, current_marker);
        //current_marker = p.marker_;
        this.setTool(TOOL_TYPE_POI, p.poi_name, div_content, callback);
    }
}

gmap.prototype.deletePoi = function (poi_id) {
    var p = this.pois[poi_id];
    if (p != null) {
        // 从数组中删除对象
        this.pois[poi_id] = null;
        if (p.marker_) {
            p.marker_.setMap(null);
        }
    }
}

gmap.prototype.clearPoi = function () {
    for (var i = 0; i < this.poi_markers.length; i++) {
        var m = this.poi_markers[i];
        if (m) {
            m.setMap(null);
        }
    }
    this.poi_markers = [];
    this.pois = [];
}

//lon,lat: 中心点经纬度
//meter: 半径，单位(米)
var getRectangle = function (lon, lat, meter) {
    var pi = 3.1415926535897932;
    var ranx, rany;
    var x, y;
    y = lat;
    x = 90 - y;
    x = Math.sin(x * pi / 180);
    x = 40075.38 * x;
    x = x / 360;
    x = x * 1000;
    ranx = meter / x;
    rany = meter / 110940;
    return new google.maps.LatLngBounds(
        new google.maps.LatLng(lat - rany, lon - ranx),
        new google.maps.LatLng(lat + rany, lon + ranx)
        );
}

gmap.prototype.showGeo = function (poi) {
    var latLng;
    //    if (this.map.getMapTypeId() == google.maps.MapTypeId.SATELLITE || this.map.getMapTypeId() == google.maps.MapTypeId.HYBRID) {
    //        latLng = new google.maps.LatLng(poi.lat, poi.lon);
    //    } else {
    latLng = new google.maps.LatLng(poi.rev_lat, poi.rev_lon);
    //    }
    this.map.setZoom(15);
    this.map.setCenter(latLng);
    if (current_retangle) {
        current_retangle.setMap(null);
    }
    current_retangle = new google.maps.Rectangle({
        strokeColor: "#FF0000",
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: "#FF0000",
        fillOpacity: 0.35,
        map: this.map,
        bounds: getRectangle(latLng.lng(), latLng.lat(), poi.width)
    });
}

gmap.prototype.deleteGeo = function () {
    if (current_retangle) {
        current_retangle.setMap(null);
    }
}

//更改电子围栏宽度
gmap.prototype.changeGeoWidth = function (width) {
    if (current_retangle) {
        var bounds = getRectangle(current_retangle.getBounds().getCenter().lng(), current_retangle.getBounds().getCenter().lat(), width);
        current_retangle.setBounds(bounds);
    }
}

gmap.prototype.editGeo = function (div_content, poi, callback) {
    //找到对应的poi
    var p = poi;
    if (poi) {
        var latLng;
        //        if (this.map.getMapTypeId() == google.maps.MapTypeId.SATELLITE || this.map.getMapTypeId() == google.maps.MapTypeId.HYBRID) {
        //            latLng = new google.maps.LatLng(p.lat, p.lon);
        //        } else {
        latLng = new google.maps.LatLng(p.rev_lat, p.rev_lon);
        //        }
        this.map.setZoom(15);
        this.map.setCenter(latLng);
        current_infowin = new google.maps.InfoWindow({
            content: div_content,
            disableAutoPan: true,
            position: latLng
        });
        if (current_retangle) {
            current_retangle.setMap(null);
        }
        current_retangle = new google.maps.Rectangle({
            strokeColor: "#FF0000",
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: "#FF0000",
            fillOpacity: 0.35,
            map: this.map,
            bounds: getRectangle(latLng.lng(), latLng.lat(), p.width)
        });
        current_infowin.open(this.map);

        this.setTool(TOOL_TYPE_GEO, p.poi_name, div_content, callback);
    }
};

var start_marker;
gmap.prototype.addStartMarker = function (lon, lat, content) {
    if (start_marker) {
        start_marker.setMap(null);
    }
    var latLng = new google.maps.LatLng(lat, lon);
    var icon = new google.maps.MarkerImage(); //标注
    icon.url = "images/icon.png";
    start_marker = new MarkerWithLabel({
        title: content,
        position: latLng,
        // icon: icon,
        draggable: false,
        raiseOnDrag: false,
        map: this.map,
        labelContent: content,
        labelAnchor: new google.maps.Point(0, 20),
        labelClass: "labels", // the CSS class for the label
        labelStyle: { opacity: 0.75 }
    });
};

gmap.prototype.addOverlay = function (type, points, radius, editingCallback, opt, name) {
    if (current_overlay) {
        current_overlay.setMap(null);
    }
    var styleOptions = {
        strokeColor: "blue",    //边线颜色。
        fillColor: "blue",      //填充颜色。当参数为空时，圆形将没有填充效果。
        strokeWeight: 3,       //边线的宽度，以像素为单位。
        strokeOpacity: 0.8,	   //边线透明度，取值范围0 - 1。
        fillOpacity: 0.6,      //填充的透明度，取值范围0 - 1。
        strokeStyle: 'solid' //边线的样式，solid或dashed。
    };
    if(type === 1){
        var latLng = new google.maps.LatLng(points[0][1], points[0][0]);
        // var icon = new google.maps.MarkerImage(); //标注
        var icon = {
            url: "poi/" + opt.type + ".png",
            labelOrigin: new google.maps.Point(55, 10)
        };
        var label = {
            text: name,
            color: '#666666',
            fontSize: '12px'
        };
        current_overlay = new google.maps.Marker({
            position: latLng,
            label: label,
            // map: this.map,
            icon: icon
        });
    }else if(type === 4){
        styleOptions.center = new google.maps.LatLng(points[0][1], points[0][0]);
        styleOptions.radius = radius;
        current_overlay = new google.maps.Circle(styleOptions);
    }else if(type === 2){
        var paths = [];
        for(var i = 0; i < points.length; i++){
            paths.push(new google.maps.LatLng(points[i][1], points[i][0]));
        }
        styleOptions.paths = paths;
        current_overlay = new google.maps.Polygon(styleOptions);
    }else if(type === 3 || type === 5){
        var paths = [];
        for(var i = 0; i < points.length; i++){
            paths.push(new google.maps.LatLng(points[i][1], points[i][0]));
        }
        styleOptions.path = paths;
        current_overlay = new google.maps.Polyline(styleOptions);
    }
    current_overlay.setMap(this.map);
    // current_overlay.setEditable(true);
    google.maps.event.addListener(current_overlay, 'radius_changed', function() {
        if(type === 4){
            editingCallback({target: current_overlay});
        }
    });
    // current_overlay.addEventListener('lineupdate', function(_type, target){
    //     // console.log(type.target.getRadius());
    //     if(type === 4){
    //         editingCallback(_type, target);
    //     }
    // });
    return current_overlay;
};

gmap.prototype.setEditable = function(overlay){
    if(overlay && overlay.setEditable){
        overlay.setEditable(true);
    }
};

gmap.prototype.setDisable = function(overlay){
    if(overlay && overlay.setEditable){
        overlay.setEditable(false);
    }
};

gmap.prototype.removeOverlay = function(overlay){
    overlay.setMap(null);
};
