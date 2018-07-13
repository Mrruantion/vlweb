// if ($.cookie('map_type') == 1 || $.cookie('lang') === 'zh' || $.cookie('lang') === 'zh-CN') {
//     document.write('<script type="text/javascript" src="http://api.map.baidu.com/getscript?v=2.0&ak=B40b712d90ffc5e40854d259b2e627cd&services=&t=20180201111639"></script>');
//     document.write('<script type="text/javascript" src="js/MapJs/CityList.js"></script>');
//     document.write('<script src="js/DrawingManager.js"></script>');
//     document.write('<script src="js/MapJs/define.js"></script>');
//     document.write('<script src="js/MapJs/bmap.js"></script>');
//     document.write('<script src="js/MapJs/DistanceTool.js"></script>');
//     document.write('<script type="text/javascript" src="http://api.map.baidu.com/library/TrafficControl/1.4/src/TrafficControl_min.js"></script>')
//     document.write('<script type="text/javascript" src="http://api.map.baidu.com/library/SearchInfoWindow/1.5/src/SearchInfoWindow_min.js"></script>')
//     document.write('<script src="js/panoramaCtrl.js"></script>');
//     // document.write('<script type="text/javascript" src="http://api.map.baidu.com/library/DistanceTool/1.2/src/DistanceTool.js"></script>');
//     // $.getScript("http://api.map.baidu.com/getscript?v=2.0&ak=B40b712d90ffc5e40854d259b2e627cd&services=&t=20180201111639");
//     // $.getScript('js/DrawingManager.js');
//     // setTimeout(() => $.getScript('js/DrawingManager.js'),500)
//     // $.getScript("http://api.map.baidu.com/library/DrawingManager/1.4/src/DrawingManager_min.js");
//     // $.getScript("js/MapJs/define.js");
//     // $.getScript("js/MapJs/bmap.js");
//     // $.ajax({
//     //     url: "http://api.map.baidu.com/getscript?v=2.0&ak=B40b712d90ffc5e40854d259b2e627cd&services=&t=20180201111639",
//     //     async: false,
//     //     dataType: "script",
//     //     success: function () {
//     //         //ok
//     //         // $.getScript('js/DrawingManager.js');
//     //         // setTimeout(() => $.getScript('js/DrawingManager.js'),500)
//     //         // $.getScript("http://api.map.baidu.com/library/DrawingManager/1.4/src/DrawingManager_min.js");
//     //     }
//     // });
//     // $.getScript('js/DrawingManager.js');
//     // $.getScript("js/MapJs/define.js");
//     // $.getScript("js/MapJs/bmap.js");

//     // document.write('<script type="text/javascript" src="http://api.map.baidu.com/library/SearchInfoWindow/1.5/src/SearchInfoWindow_min.js"></script>')
//     // document.write('<script src="js/panoramaCtrl.js"></script>');
// } else if ($.cookie('map_type') == 3) {
//     document.write('<script type="text/javascript" src="http://webapi.amap.com/maps?v=1.4.5&key=d19b835987c12851be0a94f14ac860df&&plugin=AMap.Scale,AMap.OverView,AMap.ToolBar"></script>')
//     document.write('<script src="js/MapJs/amap.js"></script>');
// } else {
//     document.write('<script type="text/javascript" src="http://ditu.google.cn/maps/api/js?libraries=drawing&key=AIzaSyAPNfIol28jBmFgzU-ubjI_nVE8fIEtdjg"></script>');
//     // document.write('<script type="text/javascript" src="js/MapJs/markerwithlabel.js"></script>');
//     // document.write('<script type="text/javascript" src="js/MapJs/markerclusterer.js"></script>');
//     document.write('<script src="js/MapJs/define.js"></script>');
//     document.write('<script src="js/MapJs/gmap.js"></script>');
//     // $.getScript("http://ditu.google.cn/maps/api/js?libraries=drawing&key=AIzaSyAPNfIol28jBmFgzU-ubjI_nVE8fIEtdjg");
//     // $.getScript("js/MapJs/markerwithlabel.js");
//     // $.getScript("js/MapJs/markerclusterer.js");
//     // $.getScript("js/MapJs/define.js");
//     // $.getScript("js/MapJs/gmap.js");
// }
if ($.cookie('map_type')) {
    if ($.cookie('map_type') == 1) {
        document.write('<script type="text/javascript" src="http://api.map.baidu.com/getscript?v=2.0&ak=B40b712d90ffc5e40854d259b2e627cd&services=&t=20180201111639"></script>');
        document.write('<script type="text/javascript" src="js/MapJs/CityList.js"></script>');
        document.write('<script src="js/DrawingManager.js"></script>');
        document.write('<script src="js/MapJs/define.js"></script>');
        document.write('<script src="js/MapJs/CityList.js"></script>');
        document.write('<script src="js/MapJs/DistanceTool.js"></script>');
        document.write('<script type="text/javascript" src="http://api.map.baidu.com/library/TrafficControl/1.4/src/TrafficControl_min.js"></script>')
        document.write('<script type="text/javascript" src="http://api.map.baidu.com/library/SearchInfoWindow/1.5/src/SearchInfoWindow_min.js"></script>')
        document.write('<script src="js/panoramaCtrl.js"></script>');
        document.write('<script src="js/MapJs/bmap.js"></script>');

    } else if ($.cookie('map_type') == 2) {
        document.write('<script type="text/javascript" src="http://ditu.google.cn/maps/api/js?libraries=drawing&key=AIzaSyAPNfIol28jBmFgzU-ubjI_nVE8fIEtdjg"></script>');
        document.write('<script src="js/MapJs/define.js"></script>');
        document.write('<script src="js/MapJs/gmap.js"></script>');
    } else if ($.cookie('map_type') == 3) {
        document.write('<script type="text/javascript" src="http://webapi.amap.com/maps?v=1.4.5&key=d19b835987c12851be0a94f14ac860df&&plugin=AMap.Scale,AMap.OverView,AMap.ToolBar,AMap.Geocoder,AMap.MouseTool,AMap.PolyEditor,AMap.CircleEditor,AMap.RangingTool"></script>')
        document.write('<script src="//webapi.amap.com/ui/1.0/main.js?v=1.0.11"></script>')
        document.write('<script src="js/MapJs/amap.js"></script>');

    }

} else {
    if ($.cookie('lang') === 'zh' || $.cookie('lang') === 'zh-CN') {
        document.write('<script type="text/javascript" src="http://api.map.baidu.com/getscript?v=2.0&ak=B40b712d90ffc5e40854d259b2e627cd&services=&t=20180201111639"></script>');
        document.write('<script type="text/javascript" src="js/MapJs/CityList.js"></script>');
        document.write('<script src="js/DrawingManager.js"></script>');
        document.write('<script src="js/MapJs/define.js"></script>');
        document.write('<script src="js/MapJs/DistanceTool.js"></script>');
        document.write('<script type="text/javascript" src="http://api.map.baidu.com/library/TrafficControl/1.4/src/TrafficControl_min.js"></script>')
        document.write('<script type="text/javascript" src="http://api.map.baidu.com/library/SearchInfoWindow/1.5/src/SearchInfoWindow_min.js"></script>')
        document.write('<script src="js/panoramaCtrl.js"></script>');
        document.write('<script src="js/MapJs/bmap.js"></script>');
    } else {
        document.write('<script type="text/javascript" src="http://ditu.google.cn/maps/api/js?libraries=drawing&key=AIzaSyAPNfIol28jBmFgzU-ubjI_nVE8fIEtdjg"></script>');
        document.write('<script src="js/MapJs/define.js"></script>');
        document.write('<script src="js/MapJs/gmap.js"></script>');
    }
}

// function changeMap() {

// }

function wiseMap(map_type, div_map, center_point, zoom) {
    var map = null;
    // console(JSON.stringify(BMap))
    // var latLng;
    switch (map_type) {
        case MAP_TYPE_GOOGLE:
            var latLng = new google.maps.LatLng(center_point.lat, center_point.lon);
            map = new gmap(div_map, latLng, zoom);

            break;
        case MAP_TYPE_BAIDU:
            var latLng = new BMap.Point(center_point.lon, center_point.lat);
            // BMap.Point ? latLng = new BMap.Point(center_point.lon, center_point.lat) : setTimeout(() => wiseMap(map_type, div_map, center_point, zoom),500);
            map = new bmap(div_map, latLng, zoom);
            // if (BMap.Point) {
            //     latLng = new BMap.Point(center_point.lon, center_point.lat)
            //     map = new bmap(div_map, latLng, zoom);
            // } else {
            //     setTimeout(() => wiseMap(map_type, div_map, center_point, zoom), 500)
            // }
            break;
        case MAP_TYPE_GAODE:
            var latlng = [center_point.lon, center_point.lat];
            map = new amap(div_map, latlng, zoom);
            break;
    }
    return map;
}

function setLocation(idx, rev_lon, rev_lat, obj, showLocation) {


    if ($.cookie('map_type')) {
        if ($.cookie('map_type') == 1) {
            var pt = new BMap.Point(rev_lon, rev_lat);
            var gc = new BMap.Geocoder();
            gc.getLocation(pt, function (rs) {
                var di = 2000;
                var shortpoint = -1;
                for (i = 0; i < rs.surroundingPois.length; i++) {
                    var d = calDistance(rs.surroundingPois[i].point.lat, rs.surroundingPois[i].point.lng, rev_lat, rev_lon) * 1000;
                    if (d < di) {
                        shortpoint = i;
                        di = d;
                    }
                }
                var getAddAddress = rs.addressComponents.city + rs.addressComponents.district + rs.addressComponents.street + rs.addressComponents.streetNumber;
                if (shortpoint >= 0) {
                    getAddAddress += '，离' + rs.surroundingPois[shortpoint].title + di.toFixed(0) + '米';
                }

                if (showLocation) {
                    showLocation(obj, getAddAddress);
                }
            }, { "poiRadius": "500", "numPois": "10" });

        } else if ($.cookie('map_type') == 2) {
            var latLng = new google.maps.LatLng(rev_lat, rev_lon);
            var geocoder = new google.maps.Geocoder();
            geocoder.geocode({ 'latLng': latLng }, function (results, status) {
                if (status == google.maps.GeocoderStatus.OK) {
                    if (results[1]) {
                        if (this.showLocation) {
                            this.showLocation(obj, results[0].formatted_address);
                        }
                    }
                } else {
                }
            });
        } else if ($.cookie('map_type') == 3) {
            var latLng = new AMap.LngLat(rev_lon, rev_lat);
            var geocoder = new AMap.Geocoder();
            geocoder.getAddress(latLng, function (status, result) {

                if (status === 'complete' && result.info === 'OK') {
    
                    var getAddAddress = result.regeocode.formattedAddress; //返回地址描述
                    // $("#location" + did).html(getAddAddress);
                    if (showLocation) {
                        showLocation(obj, getAddAddress);
                    }
                }
            })
        }

    } else {
        if (i18next.language === 'zh' || i18next.language === 'zh-CN') {
            var pt = new BMap.Point(rev_lon, rev_lat);
            var gc = new BMap.Geocoder();
            gc.getLocation(pt, function (rs) {
                var di = 2000;
                var shortpoint = -1;
                for (i = 0; i < rs.surroundingPois.length; i++) {
                    var d = calDistance(rs.surroundingPois[i].point.lat, rs.surroundingPois[i].point.lng, rev_lat, rev_lon) * 1000;
                    if (d < di) {
                        shortpoint = i;
                        di = d;
                    }
                }
                var getAddAddress = rs.addressComponents.city + rs.addressComponents.district + rs.addressComponents.street + rs.addressComponents.streetNumber;
                if (shortpoint >= 0) {
                    getAddAddress += '，离' + rs.surroundingPois[shortpoint].title + di.toFixed(0) + '米';
                }

                if (showLocation) {
                    showLocation(obj, getAddAddress);
                }
            }, { "poiRadius": "500", "numPois": "10" });
        } else {
            var latLng = new google.maps.LatLng(rev_lat, rev_lon);
            var geocoder = new google.maps.Geocoder();
            geocoder.geocode({ 'latLng': latLng }, function (results, status) {
                if (status == google.maps.GeocoderStatus.OK) {
                    if (results[1]) {
                        if (this.showLocation) {
                            this.showLocation(obj, results[0].formatted_address);
                        }
                    }
                } else {
                }
            });
        }
    }


}