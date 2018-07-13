var panorama;
var if_show_panorama = false;
var panoramaId = document.getElementById('panorama');
if (panoramaId) {
    panorama = new BMap.Panorama('panorama'); //默认为显示道路指示控件
    panorama.setPosition(new BMap.Point(116.316169, 40.005567));
}


// 定义一个控件类,即function
function PanoramaControl(map) {
    // 默认停靠位置和偏移量
    map = map;
    this.defaultAnchor = BMAP_ANCHOR_TOP_RIGHT;
    this.defaultOffset = new BMap.Size(170, 40);
}

// 通过JavaScript的prototype属性继承于BMap.Control
PanoramaControl.prototype = new BMap.Control();

// 自定义控件必须实现自己的initialize方法,并且将控件的DOM元素返回
// 在本方法中创建个div元素作为控件的容器,并将其添加到地图容器中
PanoramaControl.prototype.initialize = function (map) {
    // 创建一个DOM元素
    var div = document.createElement("div");
    $(div).css({ "border-radius": "3px" })
    // 添加文字说明
    div.appendChild(document.createTextNode("全景"));
    // 设置样式
    //        color: rgb(0, 0, 0); background: rgb(255, 255, 255);
    div.style.backgroundColor = "white";
    div.style.boxShadow = "rgba(0, 0, 0, 0.34902) 2px 2px 3px";
    div.style.borderLeftWidth = "1px";
    div.style.borderLeftStyle = "solid";
    div.style.borderLeftColor = "rgb(139, 164, 220)";
    div.style.borderTopWidth = "1px";
    div.style.borderTopStyle = "solid";
    div.style.borderTopColor = "rgb(139, 164, 220)";
    div.style.borderBottomWidth = "1px";
    div.style.borderBottomStyle = "solid";
    div.style.borderBottomColor = "rgb(139, 164, 220)";
    div.style.padding = "2px 6px";
    div.style.fontStyle = "normal";
    div.style.fontVariant = "normal";
    div.style.fontStretch = "normal";
    div.style.fontSize = "12px";
    div.style.lineHeight = "1.3em";
    div.style.fontFamily = "arial, sans-serif";
    div.style.textAlign = "center";
    div.style.whiteSpace = "nowrap";
    div.style.color = "rgb(0, 0, 0)";
    div.style.cursor = "pointer";
    // 绑定事件,点击一次放大两级
    div.onclick = function (e) {
        if (!if_show_panorama) {
            $(".panorama").show();
            if_show_panorama = true;
            pcLayer = new BMap.PanoramaCoverageLayer();
            map.addTileLayer(pcLayer);
            panorama.setPosition(new BMap.Point(map.getCenter().lng, map.getCenter().lat));
        } else {
            $(".panorama").hide();
            if_show_panorama = false;
            map.removeTileLayer(pcLayer);
        }
    };
    // 添加DOM元素到地图中
    map.getContainer().appendChild(div);
    // 将DOM元素返回
    return div;
};

// // 创建控件
// var panoramaCtrl = new PanoramaControl();

// panoramaCtrl.setOffset(new BMap.Size(40, 70))
// // 添加到地图当中
// map.addControl(panoramaCtrl);

// //    var driving = new BMap.DrivingRoute(map, {renderOptions: {map: map, panel: "r-result", autoViewport: true, enableDragging : true}});
// //    driving.search("中关村一街", "魏公村");
// // this.setShowLocation(showLocation);

// //添加地图移动事件
// var movePanorama = function (type, target) {
//     panorama.setPosition(new BMap.Point(map.getCenter().lng, map.getCenter().lat));
// };
// map.addEventListener("moveend", movePanorama);
// map.addEventListener("zoomend", movePanorama);
// map.addEventListener("resize", movePanorama);