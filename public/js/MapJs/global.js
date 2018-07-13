//自动关闭提示框
function Alerts(str) {
    var msgw, msgh, bordercolor;
    msgw = 350; //提示窗口的宽度  
    msgh = 80; //提示窗口的高度  
    titleheight = 25 //提示窗口标题高度  
    bordercolor = "#FD9900"; //提示窗口的边框颜色  
    titlecolor = "#FD9900"; //提示窗口的标题颜色  
    var sWidth, sHeight;
    //获取当前窗口尺寸  
    sWidth = document.body.offsetWidth;
    sHeight = document.body.offsetHeight;
    //    //背景div  
    var bgObj = document.createElement("div");
    bgObj.setAttribute('id', 'alertbgDiv');
    bgObj.style.position = "absolute";
    bgObj.style.top = "0";
    bgObj.style.background = "#E8E8E8";
    bgObj.style.filter = "progid:DXImageTransform.Microsoft.Alpha(style=3,opacity=25,finishOpacity=75";
    bgObj.style.opacity = "0.6";
    bgObj.style.left = "0";
    bgObj.style.width = sWidth + "px";
    bgObj.style.height = sHeight + "px";
    bgObj.style.zIndex = "10000";
    document.body.appendChild(bgObj);
    //创建提示窗口的div  
    var msgObj = document.createElement("div")
    msgObj.setAttribute("id", "alertmsgDiv");
    msgObj.setAttribute("align", "center");
    msgObj.style.background = "white";
    msgObj.style.border = "1px solid " + bordercolor;
    msgObj.style.position = "absolute";
    msgObj.style.left = "50%";
    msgObj.style.font = "12px/1.6em Verdana, Geneva, Arial, Helvetica, sans-serif";
    //窗口距离左侧和顶端的距离   
    msgObj.style.marginLeft = "-225px";
    //窗口被卷去的高+（屏幕可用工作区高/2）-150  
    msgObj.style.top = document.body.scrollTop + (window.screen.availHeight / 2) - 150 + "px";
    msgObj.style.width = msgw + "px";
    msgObj.style.height = msgh + "px";
    msgObj.style.textAlign = "center";
    msgObj.style.lineHeight = "25px";
    msgObj.style.zIndex = "10001";
    document.body.appendChild(msgObj);
    //提示信息标题  
    var title = document.createElement("h4");
    title.setAttribute("id", "alertmsgTitle");
    title.setAttribute("align", "left");
    title.style.margin = "0";
    title.style.padding = "3px";
    title.style.background = bordercolor;
    title.style.filter = "progid:DXImageTransform.Microsoft.Alpha(startX=20, startY=20, finishX=100, finishY=100,style=1,opacity=75,finishOpacity=100);";
    title.style.opacity = "0.75";
    title.style.border = "1px solid " + bordercolor;
    title.style.height = "18px";
    title.style.font = "12px Verdana, Geneva, Arial, Helvetica, sans-serif";
    title.style.color = "white";
    title.innerHTML = "提示消息";
    document.getElementById("alertmsgDiv").appendChild(title);
    //提示信息  
    var txt = document.createElement("p");
    txt.setAttribute("id", "msgTxt");
    txt.style.margin = "16px 0";
    txt.innerHTML = str;
    document.getElementById("alertmsgDiv").appendChild(txt);
    //设置关闭时间  
    window.setTimeout("closewin()", 2000);
}
function closewin() {
    document.body.removeChild(document.getElementById("alertbgDiv"));
    document.getElementById("alertmsgDiv").removeChild(document.getElementById("alertmsgTitle"));
    document.body.removeChild(document.getElementById("alertmsgDiv"));
}


//function inArray(needle, array) {
//    if (typeof needle == "string" || typeof needle == "number") {
//        var len = array.length;
//        for (var i = 0; i < len; i++) {
//            if (needle === array[i]) {
//                return true;
//            }
//        }
//        return false;
//    }
//}

function getDirectDesc(direct) {
    var obj_direct = i18next.t("direct.N");
    if ((direct >= 0 && direct <= 22) || (direct > 337 && direct <= 360)) {
        obj_direct = i18next.t("direct.N");
    }
    else if (direct > 22 && direct <= 67) {
        obj_direct = i18next.t("direct.NE");
    }
    else if (direct > 67 && direct <= 112) {
        obj_direct = i18next.t("direct.E");
    }
    else if (direct > 112 && direct <= 157) {
        obj_direct = i18next.t("direct.SE");
    }
    else if (direct > 157 && direct <= 202) {
        obj_direct = i18next.t("direct.S");
    }
    else if (direct > 202 && direct <= 247) {
        obj_direct = i18next.t("direct.SW");
    }
    else if (direct > 247 && direct <= 292) {
        obj_direct = i18next.t("direct.W");
    }
    else if (direct > 292 && direct <= 337) {
        obj_direct = i18next.t("direct.NW");
    }
    else {
        obj_direct = i18next.t("direct.N");
    }
    return obj_direct + '(' + direct + ')';
}

function getDirect(direct) {
    var obj_direct = 0;
    if ((direct >= 0 && direct <= 22) || (direct > 337 && direct <= 360)) {
        obj_direct = 0;
    }
    else if (direct > 22 && direct <= 67) {
        obj_direct = 45;
    }
    else if (direct > 67 && direct <= 112) {
        obj_direct = 90;
    }
    else if (direct > 112 && direct <= 157) {
        obj_direct = 135;
    }
    else if (direct > 157 && direct <= 202) {
        obj_direct = 180;
    }
    else if (direct > 202 && direct <= 247) {
        obj_direct = 225;
    }
    else if (direct > 247 && direct <= 292) {
        obj_direct = 270;
    }
    else if (direct > 292 && direct <= 337) {
        obj_direct = 315;
    }
    else {
        obj_direct = 0;
    }
    return obj_direct;
}

function getIconStatus(vehicle, if_playback) {
    var _if_playback = if_playback || false;
    var icon_status = "stop";
    if (!_if_playback && !getOnLine(vehicle)) {
        icon_status = "offline";
    } else {
        if (vehicle.activeGpsData.alerts.length > 0) {
            icon_status = "alert";
        } else {
            if (vehicle.activeGpsData.status.indexOf(8196) > -1) {
                icon_status = "run";
            } else {
                icon_status = "stop";
            }
        }
    }
    return icon_status;
}

function getIconName(vehicle) {
    var icon_name = "normal";
    // if (vehicle.obj_type == 0) {
    //     icon_name = "normal";
    // }
    if (!vehicle.objectType) {
        icon_name = "normal"
    } else {
        icon_name = vehicle.objectType
    }
    return icon_name;
}

function getIcon(vehicle, map_type, if_playback) {
    var _if_playback = if_playback || false;
    switch (map_type) {
        case MAP_TYPE_GOOGLE:
            var icon = {}; //标注
            var icon_name = getIconName(vehicle);
            var icon_status = getIconStatus(vehicle, _if_playback);
            icon_direct = getDirect(vehicle.activeGpsData.direct);
            //icon.size = new google.maps.Size(20, 20);
            icon.labelOrigin = new google.maps.Point(60, 10);
            //icon.url = "../../Content/MapImages/" + icon_name + "_" + icon_status + "_" + icon_direct + ".png";
            // icon.url = "./objects/" + icon_name + "_" + icon_status + "_" + icon_direct + ".gif";
            // icon.url = "./objects/" + icon_name + "_" + icon_status + "_1.svg";
            icon.url = "./objects/" + icon_name + "_" + icon_status + "_" + 0 + ".gif";
            icon.rotation = vehicle.activeGpsData.direct;
            return icon;
            break;
        case MAP_TYPE_BAIDU:
            var icon_name = getIconName(vehicle);
            var icon_status = getIconStatus(vehicle, _if_playback);
            var icon_direct = getDirect(vehicle.activeGpsData.direct);
            var icon = new BMap.Icon("./objects/" + icon_name + "_" + icon_status + "_" + 0 + ".gif", new BMap.Size(28, 28));
            return icon;
            break;
        case MAP_TYPE_GAODE:
            var icon_name = getIconName(vehicle);
            var icon_status = getIconStatus(vehicle, _if_playback);
            var icon_direct = getDirect(vehicle.activeGpsData.direct);
            var icon = new AMap.Icon({
                image: "./objects/" + icon_name + "_" + icon_status + "_" + 0 + ".gif",
                imageOffset: new AMap.Pixel(0, 0)
            });
            return icon;
    }
}

function getPoiIcon(poi, map_type) {
    switch (map_type) {
        case MAP_TYPE_GOOGLE:
            var icon = {}; //标注
            icon.labelOrigin = new google.maps.Point(55, 10);
            icon.url = "poi/" + poi.opt.type + ".png";
            return icon;
            break;
        case MAP_TYPE_BAIDU:
            var icon = new BMap.Icon("poi/" + poi.opt.type + ".png", new BMap.Size(24, 24));
            icon.anchor = 0;
            return icon;
            break;
    }
}

Date.prototype.format = function (format) {
    var o =
    {
        "M+": this.getMonth() + 1, //month
        "d+": this.getDate(),    //day
        "h+": this.getHours(),   //hour
        "m+": this.getMinutes(), //minute
        "s+": this.getSeconds(), //second
        "q+": Math.floor((this.getMonth() + 3) / 3),  //quarter
        "S": this.getMilliseconds() //millisecond
    }
    if (/(y+)/.test(format))
        format = format.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(format))
            format = format.replace(RegExp.$1, RegExp.$1.length == 1 ? o[k] : ("00" + o[k]).substr(("" + o[k]).length));
    return format;
}

function dateDiff(sDate1, sDate2, mode) {     //sDate1和sDate2是2004-10-18格式
    var iDays;
    if (mode == "dd") {
        iDays = parseInt(Math.abs(sDate1 - sDate2) / 1000 / 60 / 60 / 24);    //把相差的毫秒数转换为天数
    } else if (mode == "mm") {
        iDays = parseInt(Math.abs(sDate1 - sDate2) / 1000 / 60);    //把相差的毫秒数转换为分钟
    }
    return iDays;
}

// var gpsFlagDesc = ['', '参考', 'GPS', '基站', '北斗'];
// var workTypeDesc = ['（有线）', '（无线）'];

var formatLongTime = function (longTime) {
    var s = '';
    var old_t = '';
    for (var i = 0; i < longTime.length / 2; i++) {
        var t = longTime.substr(i * 2, 2);
        if (old_t != t) {
            old_t = t;
            t = parseInt('0x' + t);
            if (t < 24) {
                s += ' ' + t + ':00';
            }
        }
    }
    return s;
};

function getMapContent(vehicle, if_playback) {
    var gpsFlagDesc =
        ['',
            i18next.t("locate.bad"),
            i18next.t("locate.gps"),
            i18next.t("locate.lbs"),
            i18next.t("locate.bd")
        ];
    var workTypeDesc = [' (' + i18next.t("device.wired_device") + ') ', ' (' + i18next.t("device.wireless_device") + ') '];
    var show_mode = 2;
    var rcv_time = NewDate(vehicle.activeGpsData.rcvTime);
    var gps_time = NewDate(vehicle.activeGpsData.gpsTime);
    var temp = vehicle.activeGpsData.temp ? vehicle.activeGpsData.temp : [];
    var soc = vehicle.activeGpsData.soc;
    var model = vehicle.model || '';
    // fuelTankCapacityObj = fuelTankCapacityObj ? fuelTankCapacityObj : {};
    var fuelTankCapacity = fuelTankCapacityObj ? fuelTankCapacityObj[vehicle.did] || 0 : 0;
    var oilMass = fuelTankCapacity * vehicle.activeGpsData.fuel;
    rcv_time = rcv_time.format("MM-dd hh:mm:ss");
    gps_time = gps_time.format("MM-dd hh:mm:ss");
    var _vehiclesim = vehicle.sim;
    if (_vehiclesim === undefined) {
        _vehiclesim = "";
    }
    var workType = (vehicle.workType || 0).toString();
    var content = "<div class='zhishichuang'><div class='wind'>";
    content += "<p><span><font style='font-size: 15px;'>" + vehicle.name + workTypeDesc[workType] + "</font></span>" + "                     ";
    if (if_playback) {
        show_mode = 3;
    } else {
        show_mode = 2;
    }
    var wifis = vehicle.activeGpsData.signal;
    var isonline = getOnLine(vehicle);
    var acc = i18next.t("monitor.acc_off");
    if (inArray(vehicle.activeGpsData.status, 8196)) {
        acc = i18next.t("monitor.acc_on");
    }
    if (wifis <= 10) {
        content += "<img src='../../images/wifi1.png'  title='信号差'/> ";
        if (vehicle.activeGpsData.status[0] != 8197) {
            if (vehicle.activeGpsData.gpsFlag == 1)
                content += "<img src='../../images/gps.png' title='无定位' />  ";
            else if (vehicle.activeGpsData.gpsFlag == 2)
                content += "<img src='../../images/gps_g.png' title='定位' />";
        }
        content += "</p>";
    }
    else if (wifis > 10 && wifis <= 15) {
        content += "<img src='../../images/wifi2.png' title='信号弱' />  ";
        if (vehicle.activeGpsData.status[0] != 8197) {
            if (vehicle.activeGpsData.gpsFlag == 1)
                content += "<img src='../../images/gps.png' title='无定位' />  ";
            else if (vehicle.activeGpsData.gpsFlag == 2)
                content += "<img src='../../images/gps_g.png' title='定位' />";
        }
        content += "</p>";
    }
    else if (wifis > 15 && wifis <= 20) {
        content += "<img src='../../images/wifi3.png'  title='信号良'/>  ";
        if (vehicle.activeGpsData.status[0] != 8197) {
            if (vehicle.activeGpsData.gpsFlag == 1)
                content += "<img src='../../images/gps.png' title='无定位' />  ";
            else if (vehicle.activeGpsData.gpsFlag == 2)
                content += "<img src='../../images/gps_g.png' title='定位' />";
        }
        content += "</p>";
    }
    else if (wifis > 20) {
        content += "<img src='../../images/wifi4.png' title='信号强' />  ";
        if (vehicle.activeGpsData.status[0] != 8197) {
            if (vehicle.activeGpsData.gpsFlag == 1)
                content += "<img src='../../images/gps.png' title='无定位' />  ";
            else if (vehicle.activeGpsData.gpsFlag == 2)
                content += "<img src='../../images/gps_g.png' title='定位' />";
        }
        content += "</p>";
    }
    content += "<table class='vehicle'>";
    content += "<tr><td class='info_label'><font color='#244FAF'>" + i18next.t("monitor.time") + ": </font></td><td colspan='3'>" + gps_time + "(" + i18next.t("monitor.time_gps") + ") " + rcv_time + "(" + i18next.t("monitor.time_server") + ")</td></tr>";
    /*
     无线设备相关数据
     */
    if (workType === '1') {
        var mode = '';
        if (vehicle.activeGpsData && vehicle.activeGpsData.longWorkMode) {
            if (vehicle.activeGpsData.longWorkMode === 1) {
                if (vehicle.activeGpsData.longInterval === 1440) {
                    mode = i18next.t("monitor.mode_long", { longTime: formatLongTime(vehicle.activeGpsData.longTime) });
                } else {
                    mode = i18next.t("monitor.mode_time", { longInterval: parseInt(vehicle.activeGpsData.longInterval) });
                }
            } else {
                mode = i18next.t("monitor.mode_trace", { longInterval: parseInt(vehicle.activeGpsData.longInterval) }); //'跟踪（上传间隔: ' + parseInt(vehicle.activeGpsData.longInterval) + '秒）';
            }
            vehicle.activeGpsData.longPercent += vehicle.activeGpsData.longPercent * 1.2;
            if (vehicle.activeGpsData.longPercent > 0.99) {
                vehicle.activeGpsData.longPercent = 0.99;
            }
            mode += ', ' + i18next.t("monitor.open_count", { longCount: parseInt(vehicle.activeGpsData.longCount) });  //开机次数：' + vehicle.activeGpsData.longCount + '次';
            content += "<tr><td><span style='color: #244FAF'>" + i18next.t("monitor.mode") + ": </span></td><td colspan='3'>" + mode + "</td></tr>";
        }
    } else {
        if (show_mode == 3 || getOnLine(vehicle)) {
            content += "<tr><td><span style='color: #244FAF'>" + i18next.t("monitor.status") + ": </span></td><td>" + vehicle.status + "</td><td><span style='color: #244FAF'>ACC: </span></td><td>" + acc + "</td></tr>";
        } else {
            content += "<tr><td><font color='#244FAF'>" + i18next.t("monitor.status") + ": </font></span></td><td colspan='3'>" + vehicle.status + "</td></tr>";
        }
        // debugger
        // content += "<tr><td><font color='#244FAF'>" + i18next.t("monitor.status") + ": </font></span></td><td colspan='3'>" + vehicle.status + "</td></tr>";

    }
    content += "<tr><td class='info_label'><font color='#244FAF'>" + i18next.t("monitor.locate") + ": </font></td><td class='content'>" + gpsFlagDesc[vehicle.activeGpsData.gpsFlag] + "</td><td class='info_label'><font color='#244FAF'>" + i18next.t("monitor.direct") + ": </font></td><td class='content'>" + getDirectDesc(vehicle.activeGpsData.direct) + "</td></tr>";

    if (workType === '1') {
        content += "<tr><td><font color='#244FAF'>" + i18next.t("monitor.battery") + ": </font></td><td>" + (vehicle.activeGpsData.longBattery || 0).toFixed(1) + "V</td><td><font color='#244FAF'>" + i18next.t("monitor.speed") + ": </font></td><td>" + vehicle.activeGpsData.speed.toFixed(1) + "km/h</td></tr>";
    } else {
        content += "<tr><td><font color='#244FAF'>" + i18next.t("monitor.mileage") + ": </font></td><td>" + vehicle.activeGpsData.mileage.toFixed(1) + "km</td><td><font color='#244FAF'>" + i18next.t("monitor.speed") + ": </font></td><td>" + vehicle.activeGpsData.speed.toFixed(1) + "km/h</td></tr>";
    }
    // 加入油耗
    // if(vehicle.activeGpsData.fuel > 0){
    //     content += "<tr><td colspan='2' style='width:100%'><font color='#244FAF'>累计油耗：</font></span>" + vehicle.activeGpsData.fuel.toFixed(0) + "升</td></tr>";
    // }
    // 如果将到期30天内，则进行续费提示
    var now = new Date();
    if (typeof (vehicle.serviceExpireIn) != "undefined" && vehicle.serviceExpireIn != null) {
        rcv_time = NewDate(vehicle.serviceExpireIn);
    }
    else
        rcv_time = "";
    // if (dateDiff(rcv_time, now, "dd") < 30) {
    //     content += "<tr><td colspan='2'><font color='#CD0200'>服务到期：</font></span>" + vehicle.serviceExpireIn + "</td></tr>";
    // }
    var tempGet = function (temp) {
        if (temp != null && temp > -99) {
            return parseFloat(temp).toFixed(1);
        } else {
            return ''
        }
    }

    if (temp.length) {
        content += "<tr><td><font color='#244FAF'>温度: </font></td><td colspan='3'>"
        temp.forEach((ele, i) => {
            switch (i) {
                case 0: content += tempGet(ele) ? '<span style="position:relative;top:-1px">①</span>' + tempGet(ele) + '°C&nbsp;&nbsp;' : tempGet(ele)
                    break;
                case 1: content += tempGet(ele) ? '<span style="position:relative;top:-1px">②</span>' + tempGet(ele) + '°C&nbsp;&nbsp;' : tempGet(ele)
                    break;
                case 2: content += tempGet(ele) ? '<span style="position:relative;top:-1px">③</span>' + tempGet(ele) + '°C&nbsp;&nbsp;' : tempGet(ele)
                    break;
                case 3: content += tempGet(ele) ? '<span style="position:relative;top:-1px">④</span>' + tempGet(ele) + '°C' : tempGet(ele)
                    break;
                default:
                    break;
            }
        })
        content += "</td></tr>"
    }
    // if(soc)
    if (oilMass || (soc != undefined && soc != null && soc != -1 && model.indexOf("D6") > -1)) {
        content += "<tr>"
        if (oilMass) {
            content += "<td><font color='#244FAF'>油量: </font></td>" + `<td>${oilMass.toFixed(2)}L</td>`
        }
        if (soc != undefined && soc != null && soc != -1 && model.indexOf("D6") > -1) {
            content += "<td><font color='#244FAF'>电量: </font></td>" + `<td ${soc < 20 ? 'style="color:red"' : ''}>${soc.toFixed(1)}%</td>`
        }
        content += "</tr>"
    }

    var caption = vehicle.if_track ? i18next.t("monitor.untrace") : i18next.t("monitor.trace");
    content += "<tr><td><font color='#244FAF'>" + i18next.t("monitor.location") + ": </font></td><td colspan='3'><span id='location" + vehicle.did + "'><img style='width:16px;height:16px' src='./img/loading.gif'/></span></td></tr>";


    // if(temp != -99){
    //     content+="<td><font color='#244FAF'>温度: </font></td>"
    // }
    console.log(temp, fuelTankCapacity)
    // debugger;
    if (!if_playback) {
        content += '<tr class="button"><td colspan="4"><div class="infowin-button"><button class="btn trace" type="button" id="trace" did="' + vehicle.did + '" onclick="trace(this, \'' + vehicle.did + '\');">' + caption + '</button><button class="btn playback" type="button" id="playback" did="' + vehicle.did + '" onclick="playback(\'' + vehicle.did + '\');">' + i18next.t("monitor.playback") + '</button><button class="btn playback" type="button" id="playback" did="' + vehicle.did + '" onclick="deviceSet(\'' + vehicle.did + '\');">' + i18next.t("monitor.setting") + '</button><button class="btn geofence" type="button" id="geofence" did="' + vehicle.did + '" onclick="geofenceSet(\'' + vehicle.did + '\',' + vehicle.activeGpsData.lon + ',' + vehicle.activeGpsData.lat + ');">' + i18next.t("monitor.geofence") + '</button><button class="btn playback" type="button" id="playback" did="' + vehicle.did + '" onclick="vehicleEditOpen(\'' + vehicle.did + '\');">' + i18next.t("monitor.info") + '</button><button class="btn idle" type="button" id="idle" did="' + vehicle.did + '" onclick="idle(\'' + vehicle.did + '\');">' + i18next.t("monitor.idle") + '</button><button class="btn picture" type="button" id="picture" did="' + vehicle.did + '" onclick="picture(\'' + vehicle.did + '\');">' + i18next.t("monitor.picture") + '</button></div></td></tr>';
    }
    content += "</table>";
    content += "</div></div>";
    return content;
}

/*
五、	终端状态定义
a)	设防：STATUS_FORTIFY = 0x2001
b)	锁车：STATUS_LOCK = 0x2002
c)	基站定位：STATUS_NETLOC = 0x2003
d)	ACC状态：STATUS_ACC = 0x2004
e)	省电状态：STATUS_SLEEP = 0x2005
f)	报警器检测线：STATUS_ALARM = 0x2006
g)	继电器检测线：STATUS_RELAY = 0x2007
h)	自定义IO1：STATUS_INPUT1 = 0x2008
i)	自定义IO2：STATUS_INPUT2 = 0x2009
j)	自定义IO3：STATUS_INPUT3 = 0x200A
k)	短信发送状态：STATUS_SMS = 0x200B

六、	终端报警定义
a)	紧急报警：ALERT_SOS = 0x3001
b)	超速报警：ALERT_OVERSPEED = 0x3002
c)	震动报警：ALERT_VIRBRATE = 0x3003
d)	位移报警：ALERT_MOVE = 0x3004
e)	防盗器报警：ALERT_ALARM = 0x3005
f)	非法行驶报警：ALERT_INVALIDRUN = 0x3006
g)	进围栏报警：ALERT_ENTERGEO = 0x3007
h)	出围栏报警：ALERT_EXITGEO = 0x3008
i)	断电报警：ALERT_CUTPOWER = 0x3009
j)	低电压报警：ALERT_LOWPOWER = 0x300A
k)	GPS天线断路报警：ALERT_GPSCUT = 0x300B
l)	疲劳驾驶报警：ALERT_OVERDRIVE = 0x300C
m)	非法启动：ALERT_INVALIDACC = 0x300D
n)	非法开车门：ALERT_INVALIDDOOR = 0x300E
*/
// show_mode 
// 1: 目标列表中
// 2: 实时监控中
// 3: 轨迹回放中
function getStatusDesc(vehicle, show_mode) {
    /*
    离线，1--显示SIM卡号, 2--离线1个小时内小时显示“离线 <1小时“，超过1个小时，显示离线“离线 xx个小时”
    在线，有效定位，速度超过10公里，显示：行驶，其他状态 xx公里/小时，速度低于等于10公里，显示：静止，其他状态
    在线，无效定位，如果信号小于指定值，速度超过10公里，显示：盲区，速度低于等于10公里，显示：静止
    */
    var desc = "";
    var alert_desc = "";
    // 如果数据接收时间在10分钟以内，认为在线，否则为离线
    var now = new Date();
    rcv_time = NewDate(vehicle.activeGpsData.rcvTime);
    if (show_mode == 3 || dateDiff(now, rcv_time, "mm") < 10) {
        if (vehicle.activeGpsData.gpsFlag % 2 == 0) {
            if (vehicle.activeGpsData.speed > 10) {
                desc = i18next.t("monitor.run");
                desc += getUniStatusDesc(vehicle.activeGpsData.status);
                alert_desc = getUniAlertsDesc(vehicle.activeGpsData.alerts);
            } else {
                desc = i18next.t("monitor.stop");
                desc += getUniStatusDesc(vehicle.activeGpsData.status);
                alert_desc = getUniAlertsDesc(vehicle.activeGpsData.alerts);
            }
        } else {
            if (vehicle.activeGpsData.speed > 10) {
                desc = i18next.t("monitor.run");
                desc += getUniStatusDesc(vehicle.activeGpsData.status);
                alert_desc = getUniAlertsDesc(vehicle.activeGpsData.alerts);
            }
            else {
                desc = i18next.t("monitor.stop");
                desc += getUniStatusDesc(vehicle.activeGpsData.status);
                alert_desc = getUniAlertsDesc(vehicle.activeGpsData.alerts);
            }
        }
        desc = alert_desc == '' ? desc : alert_desc;
    } else {
        if (show_mode == 1) {
            desc = i18next.t("monitor.offline");
        } else {
            desc = "";
        }
    }
    return desc;
}

//处理js时间转化的方法
function NewDate(str) {
    if (!str) {
        // debugger;
        return new Date().format("yyyy-MM-dd hh:mm:ss");
    }
    var date = new Date();
    var str_before = str.split('T')[0]; //获取年月日
    var str_after = str.split('T')[1]; //获取时分秒
    var years = str_before.split('-')[0]; //分别截取得到年月日
    var months = str_before.split('-')[1] - 1;
    var days = str_before.split('-')[2];
    var hours = str_after.split(':')[0];
    var mins = str_after.split(':')[1];
    var seces = str_after.split(':')[2].replace("Z", "");
    var secs = seces.split('.')[0];
    var smsecs = seces.split('.')[1];
    date.setUTCFullYear(years, months, days);
    date.setUTCHours(hours, mins, secs, smsecs);
    return date;
}


function getUniStatusDesc(uni_status) {
    var desc = "";
    for (var i = 0; i < uni_status.length; i++) {
        switch (uni_status[i]) {
            //case STATUS_ACC: desc += ",启动"; break;                                 
            case STATUS_FORTIFY: desc += "," + i18next.t("monitor.fortify"); break;
            case STATUS_LOCK: desc += "," + i18next.t("monitor.lock"); break;
            // case STATUS_NETLOC: desc += ",基站定位"; break;
            //case STATUS_SLEEP: desc += ",省电状态"; break;
        }
    }
    return desc;
}

function getUniAlertsDesc(uni_alerts) {
    var desc = "";
    for (var i = 0; i < uni_alerts.length; i++) {
        switch (parseInt(uni_alerts[i])) {
            case ALERT_SOS: desc += i18next.t("alert.sos") + "|"; break;
            case ALERT_OVERSPEED: desc += i18next.t("alert.overspeed") + "|"; break;
            case ALERT_VIRBRATE: desc += i18next.t("alert.virbrate") + "|"; break;
            case ALERT_MOVE: desc += i18next.t("alert.move") + "|"; break;
            case ALERT_ALARM: desc += i18next.t("alert.alarm") + "|"; break;
            case ALERT_ENTERGEO: desc += i18next.t("alert.entergeo") + "|"; break;
            case ALERT_EXITGEO: desc += i18next.t("alert.exitgeo") + "|"; break;
            case ALERT_CUTPOWER: desc += i18next.t("alert.cutpower") + "|"; break;
            case ALERT_LOWPOWER: desc += i18next.t("alert.lowpower") + "|"; break;
            case ALERT_GPSCUT: desc += i18next.t("alert.gpscut") + "|"; break;
            case ALERT_OVERDRIVE: desc += i18next.t("alert.overdrive") + "|"; break;
        }
    }
    if (desc != '') {
        desc = desc.substr(0, desc.length - 1);
    }
    return desc;
}


// getOnLine 
// 1: 目标列表中
// 2: 地图中
function getOnLine(vehicle) {
    var desc = "";
    var now = new Date();
    now = now.format("yyyy-MM-dd hh:mm:ss");
    rcv_time = NewDate(vehicle.activeGpsData.rcvTime);
    rcv_time = rcv_time.format("yyyy-MM-dd hh:mm:ss");
    var m = dateOnLine(now, rcv_time, "mm");
    if (m < 10) {
        desc = true;
    } else {
        desc = false;
    }
    return desc;
}

function dateOnLine(sDate1, sDate2, mode) {     //sDate1和sDate2是2004-10-18格式
    var iDays;
    var date1 = new Date(Date.parse(sDate1.replace(/-/g, "/"))); //转换成Data();  
    var date2 = new Date(Date.parse(sDate2.replace(/-/g, "/"))); //转换成Data();  
    if (mode == "dd") {
        iDays = parseInt(Math.abs(date1 - date2) / 1000 / 60 / 60 / 24);    //把相差的毫秒数转换为天数
    } else if (mode == "mm") {
        iDays = parseInt(Math.abs(date1 - date2) / 1000 / 60);    //把相差的毫秒数转换为分钟
    }
    return iDays;
}

function dateDiff(d1, d2, mode) {     //sDate1和sDate2是2004-10-18格式
    var diff;
    if (mode == "dd") {
        diff = parseInt(Math.abs(d1 - d2) / 1000 / 60 / 60 / 24);    //把相差的毫秒数转换为天数
    } else if (mode == "mm") {
        diff = parseInt(Math.abs(d1 - d2) / 1000 / 60);    //把相差的毫秒数转换为分钟
    }
    return diff;
}

function getOnline(vehicle) {
    var desc = "";
    var now = new Date();
    rcv_time = new Date(vehicle.activeGpsData.rcvTime);
    var m = dateDiff(now, rcv_time, "mm");
    if (m < 10) {
        desc = true;
    } else {
        desc = false;
    }
    return desc;
}

var isExpiredFun = function (did) {
    // console.log(vehicleServiceObj[did])
    // if (vehicleServiceObj[did]) {
    //     var _serviceExpireIn;
    //     _serviceExpireIn = vehicleServiceObj[did].serviceExpireIn ? NewDate(vehicleServiceObj[did].serviceExpireIn) : '';
    //     if (_serviceExpireIn) {
    //         // console.log(_serviceExpireIn)
    //         if (_serviceExpireIn.format('yyyy-MM-dd hh:mm:ss') < new Date().format('yyyy-MM-dd hh:mm:ss')) {
    //             return true
    //         }
    //         // return false
    //     }
    //     // return false
    // }
    return false
}

var getStatus = function (vehicle) {
    if (isExpiredFun(vehicle.did)) {
        return {
            status: 'Expired',
            desc: 'Expired'
        }
    }
    var result = i18next.t("monitor.no_data");
    var status = 'offline';
    console.log(vehicle)
    if (vehicle.activeGpsData) {
        if (!getOnline(vehicle)) {
            var now = new Date();
            var rcvTime = new Date(vehicle.activeGpsData.rcvTime);
            var m = dateDiff(now, rcvTime, "mm");
            if (m < 60) {
                result = i18next.t("monitor.offline") + '<1h';
            } else if (m >= 60 && m < 240) {
                result = i18next.t("monitor.offline") + '<4h';
            } else if (m >= 60 && m < 240) {
                result = i18next.t("monitor.offline") + '<4h';
            } else if (m >= 240 && m < 480) {
                result = i18next.t("monitor.offline") + '<8h';
            } else if (m >= 480 && m < 720) {
                result = i18next.t("monitor.offline") + '<12h';
            } else if (m >= 720 && m < 960) {
                result = i18next.t("monitor.offline") + '<16h';
            } else if (m >= 960 && m < 1200) {
                result = i18next.t("monitor.offline") + '<20h';
            } else if (m >= 1200 && m < 1440) {
                result = i18next.t("monitor.offline") + '<1d';
            } else if (m >= 1440 && m < 129600) {
                result = i18next.t("monitor.offline") + parseInt(m / 60 / 24) + 'd';
            } else if (m >= 129600) {
                result = i18next.t("monitor.offline") + '>90d';
            }
            status = 'offline';
        } else {
            var alertResult = '';
            if (vehicle.activeGpsData.alerts.length > 0) {
                alertResult = getUniAlertsDesc(vehicle.activeGpsData.alerts);
                console.log(alertResult)
                // status = 'alert';
            }
            // else {
            if (vehicle.activeGpsData.status.indexOf(8196) > -1 && vehicle.activeGpsData.speed > 5) {
                result = vehicle.activeGpsData.speed.toFixed(0) + 'km';
                status = 'run';
            } else {
                result = i18next.t("monitor.stop");
                status = 'stop';
            }
            result = alertResult ? alertResult + ',' + result : result;
            // }
        }
    }
    return {
        status: status,
        desc: result
    };
}


function _getStatusDesc(vehicle) {
    /*
    离线，1--显示SIM卡号, 2--离线1个小时内小时显示“离线 <1小时“，超过1个小时，显示离线“离线 xx个小时”
    在线，有效定位，速度超过10公里，显示：行驶，其他状态 xx公里/小时，速度低于等于10公里，显示：静止，其他状态
    在线，无效定位，如果信号小于指定值，速度超过10公里，显示：盲区，速度低于等于10公里，显示：静止
    */
    var desc = "";
    var alert_desc = "";
    if (vehicle.speed > 10) {
        desc = i18next.t("monitor.run");
        desc += getUniStatusDesc(vehicle.status);
        alert_desc = getUniAlertsDesc(vehicle.alerts);
    } else {
        desc = i18next.t("monitor.stop");
        desc += getUniStatusDesc(vehicle.status);
        alert_desc = getUniAlertsDesc(vehicle.alerts);
    }
    desc = alert_desc === '' ? desc : alert_desc;
    return desc;
}

function getUniAlertDesc(uni_alert) {
    var desc = "";
    switch (uni_alert) {
        case ALERT_SOS: desc += "紧急报警"; break;
        case ALERT_OVERSPEED: desc += "超速报警"; break;
        case ALERT_VIRBRATE: desc += "震动报警"; break;
        case ALERT_MOVE: desc += "位移报警"; break;
        case ALERT_ALARM: desc += "防盗器报警"; break;
        case ALERT_INVALIDRUN: desc += "非法行驶报警"; break;
        case ALERT_ENTERGEO: desc += "进围栏报警"; break;
        case ALERT_EXITGEO: desc += "出围栏报警"; break;
        case ALERT_CUTPOWER: desc += "断电报警"; break;
        case ALERT_LOWPOWER: desc += "低电压报警"; break;
        case ALERT_GPSCUT: desc += "GPS断线报警"; break;
        case ALERT_OVERDRIVE: desc += "疲劳驾驶报警"; break;
        case ALERT_INVALIDACC: desc += "非法点火报警"; break;
        case ALERT_INVALIDDOOR: desc += "非法开门报警"; break;
    }
    return desc;
}

function format_number(pnumber, decimals) {
    if (isNaN(pnumber)) { return 0 };
    if (pnumber == '') { return 0 };
    var result = parseFloat(pnumber).toFixed(decimals)
    var dot = result.indexOf('.');
    while (result.length <= dot + decimals) { result += '0'; }
    //        result = dec;
    //    var snum = new String(pnumber);
    //    var sec = snum.split('.');
    //    var whole = parseFloat(sec[0]);
    //    var result = '';

    //    if (sec.length > 1) {
    //        var dec = new String(sec[1]);
    //        dec = String(parseFloat(sec[1]) / Math.pow(10, (dec.length - decimals)));
    //        dec = String(whole + Math.round(parseFloat(dec)) / Math.pow(10, decimals));
    //        var dot = dec.indexOf('.');
    //        if (dot == -1) {
    //            dec += '.';
    //            dot = dec.indexOf('.');
    //        }
    //        while (dec.length <= dot + decimals) { dec += '0'; }
    //        result = dec;
    //    } else {
    //        var dot;
    //        var dec = new String(whole);
    //        dec += '.';
    //        dot = dec.indexOf('.');
    //        while (dec.length <= dot + decimals) { dec += '0'; }
    //        result = dec;
    //    }
    return result;
}
