//处理js时间转化的方法
function NewDate(str) {
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


function preTime(s) {
    var date = new Date();
    var nowYear = date.getFullYear();
    var nowMonth = date.getMonth();
    var nowDate = date.getDate();

    date.setMonth(nowMonth - s);
    return date.format('yyyy-MM-dd')
}

function nextTime(s) {
    var date = new Date();
    var nowYear = date.getFullYear();
    var nowMonth = date.getMonth();
    var nowDate = date.getDate();
    date.setMonth(nowMonth + s);
    return date.format('yyyy-MM-dd')
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
};

// 让表格记入加载状态
var setLoading = function (name) {
    var col_span = $("#" + name + " thead tr th").length;
    if (!$("#waiting").length > 0) {
        $("#" + name + " tbody").append('<tr><td colspan="' + col_span + '"><p style="text-align: center; padding-top: 5px"><img style="width:16px;height:16px" src="/img/waiting.gif" id="waiting"/> Loading...</p></td></tr>');
    }
};

/** trim() method for String */
String.prototype.trim = function () {
    return this.replace(/(^\s*)|(\s*$)/g, '');
};

/*
* 修改主菜单的指示图标 tspNode当前节点,  imgpath 当前节点img路劲, ImgreplacePath 当前节点替换的img路劲
*/
function changeIcon(tspNode, imgpath, ImgreplacePath) {
    if (tspNode) {
        if (tspNode.attr("src") == imgpath) {
            tspNode.attr("src", ImgreplacePath);
        }
        else {
            tspNode.attr("src", imgpath);
        }
    }
}

/*
* atrDialogOpen打开 obj当前atrDialog参数配置 ，contentID atrDialog文本内容ID
*/
function atrDialogOpen(obj, contentID) {
    art.dialog({
        fixed: obj.fixed,
        id: obj.id,
        lock: obj.lock,
        opacity: obj.opacity,
        padding: obj.padding,
        left: obj.left,
        top: obj.top,
        content: document.getElementById(contentID),
        drag: obj.drag,
        resize: obj.resize,
        time: obj.time,
        title: obj.title,
        init: obj.init
    });
}

/*
* 关闭所有atrDiaLog
*/
function atrDiaLogClose() {
    var list = art.dialog.list;
    for (var i in list) {
        list[i].close();
    }
}

/*
* 删除操作提示
*/
function CloseConfirm(Msg) {
    if (confirm(Msg) == true) {
        return true;
    }
    else {
        return false;
    }
}

function msgShow(str, fade_out) {
    $("#err_msg").html(str);
    if (fade_out) {
        $("#alert").show().fadeOut(fade_out);
    } else {
        $("#alert").show();
    }
}

function loadStyles(url) {
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = url;
    document.getElementsByTagName('head')[0].appendChild(link);
}

function loadScript(url) {
    var script = document.createElement('script');   // 创建script标签;
    script.type = 'text/javascript';          // 设置type属性;
    script.src = url;                 // 引入url;
    document.getElementsByTagName('head')[0].appendChild(script);  // 将script引入<head>中;
}

// loadStyles('js/message/css/messenger.css');
// loadStyles('js/message/css/messenger-theme-air.css');
// loadScript('js/message/js/messenger.min.js');
// loadScript('js/message/js/messenger-theme-future.js');

// function _ok(str, fade_out) {
//     if(Messenger){
//         Messenger.options = {
//             extraClasses: 'messenger-fixed messenger-on-top',
//             theme: 'ice'
//         };
//         Messenger().post({
//             message: str,
//             hideAfter: fade_out,
//             hideOnNavigate: true,
//             type: 'success',
//             showCloseButton: true
//         });
//     }else{
//         alert(str);
//     }
// }

function clearLogin() {
    $.cookie('Login_auth_code', null);
    $.cookie('Login_tree_path', null);
    $.cookie('Login_cust_id', null);
    $.cookie('Login_userName', null);
    $.cookie('xmlHost', null);
}

function ajax_function(obj) {
    var datas = JSON.stringify(obj.data);
    $.ajax({
        url: obj.url,
        type: obj.type,
        dataType: "json",
        data: obj.data,
        async: true,
        timeout: 10000,
        success: obj.success,
        error: obj.error
    });
}

function Report_function(datastr) {
    alert(datastr);
    var dataStr = "datas=" + datastr + "";
    $.ajax({
        type: "POST",
        url: "/ReportCount/GetReport",
        dataType: "json",
        data: dataStr,
        async: false,
        success: function (strs) {
            alert(str);
        },
        error: obj.error
    });
}



/*
* jquery ajax
*/
function PoPuDel_function(obj) {
    $.ajax({
        type: obj.type,
        url: obj.url,
        data: obj.data,
        dataType: obj.dataType,
        success: obj.success,
        error: obj.error
    });
}



/*
* Slider sliderID当前作用域div ,txtID 文本框id ,obj(对象)当前Slider配置参数 ,falg slider标识 , paly(轨迹播放处理)
*/
function Slider_Extend(sliderID, txtID, obj, falg, paly) {
    sliderID.slider({
        value: obj.value,
        min: obj.min,
        max: obj.max,
        step: obj.step,
        slide: function (event, ui) {
            var txtCallVaule = ui.value;
            Slider_switch(falg, txtID, txtCallVaule, paly);
        }
    });
    var txtValue = sliderID.slider("value");
    Slider_switch(falg, txtID, txtValue, paly);
}

/*
* Slider里面switch  Sliderfalgs sliderID标识,  txtID 文本id, txtValue 给txtID赋值的value
*/
function Slider_switch(Sliderfalg, txtID, txtValue, paly) {
    var sensitivity = $("#sensitivity");
    if (Sliderfalg == "slider_Shock") {
        switch (true) {
            case (txtValue == 10):
                txtID.attr("value", "10");
                sensitivity.attr("value", txtValue);
                break;
            case (txtValue == 20):
                txtID.attr("value", "20");
                sensitivity.attr("value", txtValue);
                break;
            case (txtValue == 30):
                txtID.attr("value", "30");
                sensitivity.attr("value", txtValue);
                break;
            case (txtValue == 60):
                txtID.attr("value", "60");
                sensitivity.attr("value", txtValue);
                break;
        }
    }
    else
        if (paly == "paly") {
            txtID.val(txtValue);
            var txt = parseInt(50000 / txtID.val());
            txtID.val(txt);
            txtID.change();
        }
        else {
            txtID.val(txtValue);
            txtID.change();
        }
}

/*
* createDOM
*/
var diff = true;
createDomObj = []; //上一次保存用户目标数组
function createDOM(obj, flag, ImgPath, mode) {
    var _createDomExtend = new createDomExtend();
    var flg, imgState, onLineSum = 0, offLineSum = 0;
    if (flag.type == "true") {
        diff = true;
    }
    if (mode == "add") {
        if (!diff) {//不是第一次
            for (var i = 0; i < obj.length; i++) {
                var isNew = false;
                for (var j = 0; j < createDomObj.length; j++) {
                    if (obj[i]["obj_id"] == createDomObj[j]["obj_id"]) {
                        var LastStatus = getStatusDesc(createDomObj[j], 1); //上一次状态(在线 离线 警告)
                        var NowStatus = getStatusDesc(obj[i], 1); //当前状态(在线 离线 警告)
                        isNew = true;
                        if (LastStatus == NowStatus) {
                        }
                        else {
                            //更新状态 并且改变状态颜色
                            $("#divType" + createDomObj[j]["obj_id"]).text(NowStatus);
                            if (typeof (obj[i].uni_status) != "undefined") {
                                if (inArray(obj[i].uni_status, 8197)) {
                                    $("#divType" + createDomObj[j]["obj_id"]).parent().css('color', 'gray');
                                    $("#divType" + createDomObj[j]["obj_id"]).parent().find("a").eq(0).css('color', 'gray');
                                }
                            }
                            else if (NowStatus.indexOf("行驶") > -1) {
                                $("#divType" + createDomObj[j]["obj_id"]).parent().css('color', 'green');
                                $("#divType" + createDomObj[j]["obj_id"]).parent().find("a").eq(0).css('color', 'green');
                            } else if (NowStatus.indexOf("静止") > -1) {
                                $("#divType" + createDomObj[j]["obj_id"]).parent().css('color', 'black');
                                $("#divType" + createDomObj[j]["obj_id"]).parent().find("a").eq(0).css('color', 'black');
                            } else if (NowStatus.indexOf("报警") > -1) {
                                $("#divType" + createDomObj[j]["obj_id"]).parent().css('color', 'red');
                                $("#divType" + createDomObj[j]["obj_id"]).parent().find("a").eq(0).css('color', 'red');
                            }
                            //                            createDomObj.remove(j);
                            //                            createDomObj.push(obj[i]);
                        }
                        break;
                    }
                }
            }

            //在线,离线列表切换开始
            var offLinehtml = $(".offLine"), OnlineHtml = $(".Online");
            var LastStatus;
            for (var i = 0; i < createDomObj.length; i++) {
                LastStatus = getStatusDesc(createDomObj[i], 1); //状态(在线 离线 报警)
                if (LastStatus.indexOf("离线") >= 0) {
                    _createDomExtend.domOnline(createDomObj[i].obj_id, createDomObj[i], LastStatus);
                }
                else {
                    _createDomExtend.domOffline(createDomObj[i].obj_id);
                }
            }

            //统计人数
            _createDomExtend.CountLine();
            //在线 离线列表切换结束
        }
        else {
            for (var i = 0; i < obj.length; i++) {
                createDomObj = obj;
                diff = false;
                var IconStatus = getIconStatus(obj[i]); //状态(在线 离线 警告)
                var Status = getStatusDesc(obj[i], 1);
                flg = getOnLine(obj[i]); //在线离线(插入dom判断)
                if (flg == true) {
                    imgState = ImgPath.onLine
                }
                else {
                    imgState = ImgPath.offLine
                }

                //创建用户目标列表dom
                var objnames = "";
                if (obj[i]["obj_name"].length <= 9) {
                    objnames = obj[i]["obj_name"].trim();
                }
                else
                    objnames = obj[i]["obj_name"].trim().substr(0, 8) + "...";
                var str = _createDomExtend.userList(IconStatus, obj[i]["obj_id"], objnames, obj[i]["obj_name"], imgState, Status, flag, obj[i]["active_gps_data"].uni_status);
                if (flg) {
                    $("#Onlinelists").append(str);
                }
                else {
                    $("#Offlinelists").append(str);
                }
            }

            //统计人数
            _createDomExtend.CountLine();
            $("#mytab_flagContent").removeClass("_ui-autocomplete-loading");
        }
    }
    else
        if (mode == "query") {
            //添加query列表添加css
            _createDomExtend.JqueryDomCSS();

            for (var i = 0; i < obj.data.length; i++) {
                var IconStatus = getIconStatus(obj.data[i]); //状态(在线 离线 警告)
                var Status = getStatusDesc(obj.data[i], 1);
                flg = getOnLine(obj.data[i]);
                if (flg == true) {
                    imgState = ImgPath.onLine
                }
                else {
                    imgState = ImgPath.offLine
                }
                //创建jquery列表dom 
                var obj_names = "";
                if (obj.data[i]["obj_name"].length <= 9) {
                    obj_names = obj.data[i]["obj_name"];
                }
                else
                    obj_names = obj.data[i]["obj_name"].substr(0, 8) + "...";
                var str = _createDomExtend.JqueryDom(IconStatus, obj.data[i]["obj_id"], obj_names, obj.data[i]["obj_name"], imgState, flag, Status, obj.data[i]["active_gps_data"].uni_status);
                $("#queryLinelists").append(str);
            }
            $(".queryLine").html("搜索(" + $("#queryLine ul li").length + ")");
        }
}


/*
* createDOM扩展
*/
function createDomExtend() {
    this.html = "";
}

var inArray = function (array, e) {
    var r = new RegExp(String.fromCharCode(2) + e + String.fromCharCode(2));
    return (r.test(String.fromCharCode(2) + array.join(String.fromCharCode(2)) + String.fromCharCode(2)));
};

createDomExtend.prototype = {
    domOnline: function (obj_id, i, LastStatus) {
        var _divType = $("#divType" + obj_id);
        var _li = $("#li" + obj_id);
        if (_divType.text().indexOf("离线") == -1) {
            _divType.text(LastStatus);
            $("#divImg" + obj_id).find("img").attr("src", "/Content/images/offline.gif");
            $("#li" + obj_id + " div[class=left]").attr("style", "color:gray");
            if (_li.hasClass("on")) {
                _li.removeClass("on");
            }
            _li.clone(true).appendTo("#Offlinelists");
            _li.remove();
            wimap.updateVehicle(i);
        }
    },
    domOffline: function (obj_id) {
        var _li = $("#li" + obj_id);
        if ($("#divType" + obj_id).text().indexOf("离线") >= 0) {
            _li.clone(true).appendTo("#Onlinelists");
            _li.remove();
        }
    },
    userList: function (IconStatus, obj_id, obj_name, objname, imgState, Status, flag, droplist) {
        var str = "";
        str += "<li id='li" + obj_id + "' >";
        if (IconStatus == "stop") {
            if (typeof (inArray) != "undefined") {
                if (inArray(droplist, 8197))
                    str += "<div class='left' style='color: gray;'><div class='divFloat'  id='divImg" + obj_id + "'><img  src=" + imgState + " align='absmiddle' /></div>" + "<div style='margin-right: 15px;width: 100px;word-wrap: break-word;overflow: hidden;' class='divFloat' id='divName" + obj_id + "'><a href='#' style='text-decoration:none;color: gray;' title=" + objname.replace(" ", "") + ">" + obj_name + "</a></div>" + "<div style='display:none'>" + objname + "</div>" + "<div class='divFloat' id='divType" + obj_id + "'>" + Status + "</div></div>";
                else
                    str += "<div class='left' style='color: black;'><div class='divFloat'  id='divImg" + obj_id + "'><img  src=" + imgState + " align='absmiddle' /></div>" + "<div style='margin-right: 15px;width: 100px;word-wrap: break-word;overflow: hidden;' class='divFloat' id='divName" + obj_id + "'><a href='#' style='text-decoration:none;color: black;' title=" + objname.replace(" ", "") + ">" + obj_name + "</a></div>" + "<div style='display:none'>" + objname + "</div>" + "<div class='divFloat' id='divType" + obj_id + "'>" + Status + "</div></div>";
            }
        }
        else
            if (IconStatus == "alert") {
                str += "<div class='left' style='color: red;'><div   class='divFloat'  id='divImg" + obj_id + "'><img  src=" + imgState + " align='absmiddle' /></div>" + "<div style='margin-right: 15px;width: 100px;word-wrap: break-word;overflow: hidden;' class='divFloat' id='divName" + obj_id + "'><a href='#' style='text-decoration:none;color: red;' title=" + objname.replace(" ", "") + ">" + obj_name + "</a></div>" + "<div style='display:none'>" + objname + "</div>" + "<div class='divFloat' id='divType" + obj_id + "'>" + Status + "</div></div>";
            }
            else if (IconStatus == "run") {
                str += "<div class='left' style='color: Green;'><div   class='divFloat'  id='divImg" + obj_id + "'><img  src=" + imgState + " align='absmiddle' /></div>" + "<div style='margin-right: 15px;width: 100px;word-wrap: break-word;overflow: hidden;' class='divFloat' id='divName" + obj_id + "'><a href='#' style='text-decoration:none;color: Green;' title=" + objname.replace(" ", "") + ">" + obj_name + "</a></div>" + "<div style='display:none'>" + objname + "</div>" + "<div class='divFloat' id='divType" + obj_id + "'>" + Status + "</div></div>";
            }
            else {
                str += "<div class='left' style='color: gray;'><div   class='divFloat'  id='divImg" + obj_id + "'><img  src=" + imgState + " align='absmiddle' /></div>" + "<div style='margin-right: 15px;width: 100px;word-wrap: break-word;overflow: hidden;' class='divFloat' id='divName" + obj_id + "'><a href='#' style='text-decoration:none;color: gray;' title=" + objname.replace(" ", "") + ">" + obj_name + "</a></div>" + "<div style='display:none'>" + objname + "</div>" + "<div class='divFloat' id='divType" + obj_id + "'>" + Status + "</div></div>";
            }
        str += "<div class='right1'><p class='pNODefalut' style='float:left'><a id=" + obj_id + "  class='following' href='#'>" + flag.sp + "</a> |  <a class='replay' href='#'>" + flag.tsp + "</a>";
        //更多
        str += " | ";
        str += "<a class='pMore' href='#'>更多<small>▼</small></a></p>";
        str += "<div class='pdivDefalut'>";
        var is_set = false, is_lock = false;
        for (var h = 0; h < droplist.length; h++) {
            if (droplist[h] == 0x2001) {
                is_set = true;
            }
            else if (droplist[h] == 0x2002) {
                is_lock = true;
            }
        }
        if (!is_set) {
            str += "<a class='a_send' id='16393' href='#'>设防</a><br/>";
        }
        else {
            str += "<a class='a_send' id='16394' href='#'>撤防</a><br/>";
        }
        if (!is_lock) {
            str += "<a class='a_send' id='16395' href='#'>锁车</a><br/>";
        }
        else {
            str += "<a class='a_send' id='16396' href='#'>解锁</a>";
        }
        str += "</div></div>";
        return str;
    },
    JqueryDom: function (IconStatus, obj_id, obj_name, objname, imgState, flag, Status, droplist) {
        var str = "";
        str += "<li id='li" + obj_id + "'>";
        if (IconStatus == "stop") {
            if (droplist == 8197)
                str += "<div class='left' style='color: gray;'><div class='divFloat'  id='divImg" + obj_id + "'><img  src=" + imgState + " align='absmiddle' /></div>" + "<div style='margin-right: 15px;width: 100px;word-wrap: break-word;overflow: hidden;' class='divFloat' id='divName" + obj_id + "'><a href='#' style='text-decoration:none;color: gray;' title=" + objname.replace(" ", "") + ">" + obj_name + "</a></div>" + "<div style='display:none'>" + objname + "</div>" + "<div class='divFloat' id='divType" + obj_id + "'>" + Status + "</div></div>";
            else
                str += "<div class='left' style='color: black;'><div class='divFloat'  id='divImg" + obj_id + "'><img  src=" + imgState + " align='absmiddle' /></div>" + "<div style='margin-right: 15px;width: 100px;word-wrap: break-word;overflow: hidden;' class='divFloat' id='divName" + obj_id + "'><a href='#' style='text-decoration:none;color: black;' title=" + objname.replace(" ", "") + ">" + obj_name + "</a></div>" + "<div style='display:none'>" + objname + "</div>" + "<div class='divFloat' id='divType" + obj_id + "'>" + Status + "</div></div>";
        }
        else
            if (IconStatus == "alert") {
                str += "<div class='left' style='color: red;'><div   class='divFloat'  id='divImg" + obj_id + "'><img  src=" + imgState + " align='absmiddle' /></div>" + "<div style='margin-right: 15px;width: 100px;word-wrap: break-word;overflow: hidden;' class='divFloat' id='divName" + obj_id + "'><a href='#' style='text-decoration:none;color: red;' title=" + objname.replace(" ", "") + ">" + obj_name + "</a></div>" + "<div style='display:none'><a href='#' style='text-decoration:none;' title=" + objname + ">" + obj_name + "</a></div>" + "<div class='divFloat' id='divType" + obj_id + "'>" + Status + "</div></div>";
            }
            else
                if (IconStatus == "run") {
                    str += "<div class='left' style='color: Green;'><div  class='divFloat'  id='divImg" + obj_id + "'><img  src=" + imgState + " align='absmiddle' /></div>" + "<div style='margin-right: 15px;width: 100px;word-wrap: break-word;overflow: hidden;' class='divFloat' id='divName" + obj_id + "'><a href='#' style='text-decoration:none;color: Green;' title=" + objname.replace(" ", "") + ">" + obj_name + "</a></div>" + "<div style='display:none'><a href='#' style='text-decoration:none;' title=" + objname + ">" + obj_name + "</a></div>" + "<div class='divFloat' id='divType" + obj_id + "'>" + Status + "</div></div>";
                }
                else {
                    str += "<div class='left' style='color: gray;'><div  class='divFloat'  id='divImg" + obj_id + "'><img  src=" + imgState + " align='absmiddle' /></div>" + "<div style='margin-right: 15px;width: 100px;word-wrap: break-word;overflow: hidden;' class='divFloat' id='divName" + obj_id + "'><a href='#' style='text-decoration:none;color: gray;' title=" + objname.replace(" ", "") + ">" + obj_name + "</a></div>" + "<div style='display:none'>" + objname + "</div>" + "<div class='divFloat' id='divType" + obj_id + "'>" + Status + "</div></div>";
                }
        str += "<div class='right1'><p class='pNODefalut' style='float:left'><a id=" + obj_id + "  class='following' href='#'>" + flag.sp + "</a> |  <a class='replay' href='#'>" + flag.tsp + "</a>";
        //更多
        str += " | ";
        str += "<a class='pMore' href='#'>更多<small>▼</small></a></p>";
        str += "<div class='pdivDefalut'>";
        var is_set = false, is_lock = false;
        for (var h = 0; h < droplist.length; h++) {
            if (droplist[h] == 0x2001) {
                is_set = true;
            }
            else if (droplist[h] == 0x2002) {
                is_lock = true;
            }
        }
        if (!is_set) {
            str += "<a class='a_send' id='16393' href='#'>设防</a><br/>";
        }
        else {
            str += "<a class='a_send' id='16394' href='#'>撤防</a><br/>";
        }
        if (!is_lock) {
            str += "<a class='a_send' id='16395' href='#'>锁车</a><br/>";
        }
        else {
            str += "<a class='a_send' id='16396' href='#'>解锁</a>";
        }
        str += "</div></div>";
        return str;
    },
    JqueryDomCSS: function () {
        $("#queryLinelists li").remove();
        $("#queryLineLi").css("display", "block");
        $(".queryLine").parent().addClass("active").siblings().removeClass("active").end();
        $("#queryLine").addClass("in active").siblings().removeClass("in active").end();
        $("#queryLinelists").addClass("active").siblings().removeClass("active").end();
    },
    CountLine: function () {
        $(".Online").html("在线(" + $("#Online ul li").length + ")");
        $(".offLine").html("离线(" + $("#offLine ul li").length + ")");
    }

}

/*
* 经常用的是通过遍历,重构数组.
*/
Array.prototype.remove = function (dx) {
    if (isNaN(dx) || dx > this.length) {
        return false;
    }
    for (var i = 0, n = 0; i < this.length; i++) {
        if (this[i] != this[dx]) {
            this[n++] = this[i]
        }
    }
    this.length -= 1
}

/*
* 在数组中获取指定值的元素索引
*/
Array.prototype.getIndexByValue = function (value) {
    var index = -1;
    for (var i = 0; i < this.length; i++) {
        if (this[i] == value) {
            index = i;
            break;
        }
    }
    return index;
}

/*
* 获取Url地址栏参数
*/
function redUrl(url) {
    if (url.indexOf("=") != -1) {
        var start = url.indexOf("=") + 1;
        var result = new Array();
        var i = 0;
        if (url.search("&") > 0) {
            var end = url.indexOf("&");
            result[i] = url.substring(start, end);
            start = url.indexOf("=", end) + 1;
            while (url.indexOf("&", start) != -1) {
                end = url.indexOf("&", start);
                result[++i] = url.substring(start, end);
                start = url.indexOf("=", end) + 1;
            }
            start = url.indexOf("=", end) + 1;
            result[++i] = url.substring(start, url.length);
        }
        return result;
    }
    return "No Param!";
}

/*
*css高度设置
*/
function browsCss(ID, windowHeight) {
    ID.css({
        "height": windowHeight + "px"
    });
}

/*
*清除所有cooike
*/
function clearCookie() {
    var keys = document.cookie.match(/[^ =;]+(?=\=)/g);
    if (keys) {
        for (var i = keys.length; i--;)
            document.cookie = keys[i] + '=0;expires=' + new Date(0).toUTCString()
    }
}

/*
* 删除指定名称的cookie
*/
function deleteCookie(name) {
    var date = new Date();
    date.setTime(date.getTime() - 10000);
    document.cookie = name + "=v; expire=" + date.toGMTString();
}

/*
* autoComplete
*/
function _autoComplete(objID, obj) {
    objID.autocomplete({
        source: obj.source,
        minLength: obj.minLength,
        open: obj.open,
        close: obj.close,
        select: obj.select
    });
}


/*
* 弹出消息
*/
function ShowMsg(msg) {
    alert(msg);
}

/*
* 计算天数差的函数，通用
*/
function DateDiff(sDate1, sDate2) { //sDate1和sDate2是2004-10-18格式  
    var aDate, oDate1, oDate2, iDays
    aDate = sDate1.split("-")
    oDate1 = new Date(aDate[1] + '-' + aDate[2] + '-' + aDate[0]) //转换为10-18-2004格式  
    aDate = sDate2.split("-")
    oDate2 = new Date(aDate[1] + '-' + aDate[2] + '-' + aDate[0])
    iDays = parseInt(Math.abs(oDate1 - oDate2) / 1000 / 60 / 60 / 24) //把相差的毫秒数转换为天数  
    return iDays
}

function DateTick(sDate1, sDate2) { //sDate1和sDate2是2004-10-18格式  
    var aDate, oDate1, oDate2, iDays
    aDate = sDate1.split("-")
    oDate1 = new Date(aDate[1] + '-' + aDate[2] + '-' + aDate[0]) //转换为10-18-2004格式  
    aDate = sDate2.split("-")
    oDate2 = new Date(aDate[1] + '-' + aDate[2] + '-' + aDate[0])
    iDays = parseInt(Math.abs(oDate1 - oDate2) / 1000 / 60 / 60 + 1) //把相差的毫秒数转换为天数  
    return iDays
}
/*
*计算天数差的函数，通用 2011/01/28 16:22:00
*/
function _DateDiff(statrDate, endDate) {
    var st = new Date(statrDate);
    var et = new Date(endDate);
    if ((et.getTime() - st.getTime()) / 1000 / 60 / 60 / 24 > 1) {
        return true;
    }
    else {
        return false;
    }
}

function _NowDateDiff(statrDate) {
    var st = new Date(statrDate);
    var et = new Date();
    if ((et.getTime() - st.getTime()) / 1000 / 60 / 60 / 24 >= 1) {
        return true;
    }
    else {
        return false;
    }
}

/*
*计算天数差的函数，通用 2013/06/26 16:22:00
*/
function _weekDiff(statrDate, endDate) {
    var st = new Date(statrDate);
    var et = new Date(endDate);
    if ((et.getTime() - st.getTime()) / 1000 / 60 / 60 / 24 > 3) {
        return true;
    }
    else {
        return false;
    }
}

/*
*datatabel tootip提示
*/
function getHtml() {
    this.html = "";
}

getHtml.prototype = {
    show: function () {
        var toolTip = $("<div id='tooltip' width='100px' height='12px'>" + this.html + "</div>");
        return toolTip;
    }
}

/*
*jquery datatable
*/
function _getDataTable() {
}

/*
* jquery datatable 扩展
* show             显示表格
* getupPage        点击上一页向左递减
* getdowmPage      点击下一页向右自加
* getPageIndex     点击页码操作
* createPageNumber 创建页面dom 操作
* btnCreatePageNumber 点击确定按钮查询操作
* createDateMenu   创建表头Menu
*/
_getDataTable.prototype = {
    show: function (obj, tableID) {
        if (obj == "" || tableID == "") {
            return;
        }
        else {
            var tableInfo = tableID.dataTable({
                "bInfo": obj.bInfo,
                "bStateSave": obj.bStateSave,
                "bRetrieve": obj.bRetrieve,
                "bLengthChange": obj.bLengthChange,   // 是否允许用户通过一个下拉列表来选择分页后每页的行数
                'bPaginate': obj.bPaginate,           //是否分页。
                "bProcessing": obj.bProcessing,       //datatable获取数据时候是否显示正在处理提示信息。 
                "bServerSide": obj.bServerSide,
                "bFilter": obj.bFilter,              //过滤
                "aaData": obj.aaData,                //数据源
                "aoColumns": obj.aoColumns,          //数据源
                "aaSorting": [],
                "fnRowCallback": obj.fnRowCallback
            });
            return tableInfo;
        }
    },
    poi_show: function (obj, tableID) {
        var tableInfo = tableID.dataTable({
            "bInfo": obj.bInfo,
            "bStateSave": obj.bStateSave,
            "bRetrieve": obj.bRetrieve,
            "bLengthChange": obj.bLengthChange,
            'bPaginate': obj.bPaginate,
            "bProcessing": obj.bProcessing,
            "bServerSide": obj.bServerSide,
            "bFilter": obj.bFilter,
            "aaData": obj.aaData,
            "aoColumns": obj.aoColumns,
            "aaSorting": [],
            "aoColumnDefs": obj.aoColumnDefs,
            "fnRowCallback": obj.fnRowCallback,
            "iDisplayLength": obj.iDisplayLength,
            "sPaginationType": obj.sPaginationType,
            "oLanguage": obj.oLanguage
        });
        return tableInfo;
    },
    getupPage: function (page_no, id) {
        //获取最大值最小值 这里修改利用each获取 
        //        var min = parseInt($("#page").children("a:first").text());

        //        //当前页小于最小值
        //        if (page_no <= min) {
        //            if (page_no == 1) {
        //                return;
        //            }
        //            for (var i = min; i < page_no + 5; i++) {
        //                $("#a_" + i + "").attr("id", "a_" + (i - 1) + "");
        //                $("#a_" + (i - 1) + "").text(i - 1);
        //            }
        //        }
        //样式操作
        dataTableCss(page_no, pageNumberCount);
    },
    getdowmPage: function (page_no, id) {
        //获取最大值最小值 这里修改利用each获取 
        //        var i, max = parseInt($("#page").children("a:last").text());

        //        //当前页小于最大值
        //        if (page_no < max) {
        //        }
        //        else {
        //            if (page_no < pageNumberCount) {//当前页小于总页数才修改id 和文本值
        //                for (var i = page_no; i > 0; i--) {
        //                    $("#a_" + i + "").attr("id", "a_" + (i + 1) + "");
        //                    $("#a_" + (i + 1) + "").text(i + 1);
        //                }
        //            }
        //        }
        //样式操作
        dataTableCss(page_no, pageNumberCount);
    },
    getPageIndex: function (page_no, id, pageNumberCount) {
        //最大值最小值 这里修改利用each获取 
        var i, max = parseInt($("#page").children("a:last").text()), min = parseInt($("#page").children("a:first").text());

        if (page_no != pageNumberCount) {//当前页不等于总页数
            if (max == page_no) {////当前页等于最大值
                for (var i = page_no; i > 0; i--) {
                    $("#a_" + i + "").attr("id", "a_" + (i + 1) + "");
                    $("#a_" + (i + 1) + "").text(i + 1);
                }
            }
            else
                if (min == page_no) {//当前页等于最小值
                    if (page_no != 1) {//当前页不等于1
                        for (var i = min; i < page_no + 5; i++) {
                            $("#a_" + i + "").attr("id", "a_" + (i - 1) + "");
                            $("#a_" + (i - 1) + "").text(i - 1);
                        }
                    }
                }
        }
        //样式操作
        dataTableCss(page_no, pageNumberCount);
    },
    createPageNumber: function (pageNumberCount, page_no) {
        var pageCount = "", pageJquery = "",
            upPage = "<input class='pageNumberInfo' type='button' id='upPage' value='上一页' title='上一页'/>",
            dowmPage = "<input class='pageNumberInfo' type='button' value='下一页' id='dowmPage'  title='下一页'/>";
        omitPage = "<span id='omitPage' class='pageNumberInfo'>...</span>";
        page.empty();
        page.append(upPage);
        if (pageNumberCount > 5) {
            _sum = 5;
            if (page_no < 5) {
                for (var i = 1; i <= _sum; i++) {
                    pageCount += "<a class='pageNumberInfo' id='a_" + i + "' href=''>" + i + "</a>";
                }
            } else if (page_no + 5 > pageNumberCount) {
                for (var i = pageNumberCount - 4; i <= pageNumberCount; i++) {
                    pageCount += "<a class='pageNumberInfo' id='a_" + i + "' href=''>" + i + "</a>";
                }
            } else {
                for (var i = page_no - 3; i <= page_no - 3 + 4; i++) {
                    pageCount += "<a class='pageNumberInfo' id='a_" + i + "' href=''>" + i + "</a>";
                }
            }
            page.append(pageCount);
            page.append(omitPage);
        }
        else {
            for (var i = 1; i <= pageNumberCount; i++) {
                pageCount += "<a class='pageNumberInfo' id='a_" + i + "' href=''>" + i + "</a>";
            }
            page.append(pageCount);
        }
        pageJquery = "共  " + pageNumberCount + "  页到第 <input class='pageNumberInfo' placeholder='请输入' type='text' id='jumpto' name='jumpto' title='指定页码'/><input class='pageNumberInfo' type='button' value='确定' id='btnJquery' title='指定页码'/>";
        page.append(pageJquery);
        page.append(dowmPage);
    },
    btnCreatePageNumber: function (page_no) {
        var i;
        //获取最大值最小值 这里修改利用each获取 
        var max = parseInt($("#page").children("a:last").text()), min = parseInt($("#page").children("a:first").text());

        var pageCount = "", pageJquery = "",
            upPage = "<input class='pageNumberInfo' type='button' id='upPage' value='上一页' title='上一页'/>",
            dowmPage = "<input class='pageNumberInfo' type='button' value='下一页' id='dowmPage'  title='下一页'/>";
        omitPage = "<span id='omitPage' class='pageNumberInfo'>...</span>";
        if (page_no >= max) {
            if (page_no == pageNumberCount) {
                var statr = parseInt($("#page").children("a").length);
                //点6情况
                page.html("");
                page.append(upPage);
                for (var i = statr - 1; i >= 0; i--) {
                    pageCount += "<a class='pageNumberInfo' id='a_" + (page_no - i) + "' href=''>" + (page_no - i) + "</a>";
                }
                page.append(pageCount);
                page.append(omitPage);
                pageJquery = "共  " + pageNumberCount + "  页到第 <input class='pageNumberInfo' placeholder='请输入' type='text' id='jumpto' name='jumpto' title='指定页码'/><input class='pageNumberInfo' type='button' value='确定' id='btnJquery' title='指定页码'/>";
                page.append(pageJquery);
                page.append(dowmPage);
            } else {
                page.html("");
                page.append(upPage);
                for (var i = 4; i >= 0; i--) {
                    pageCount += "<a class='pageNumberInfo' id='a_" + (page_no - i + 1) + "' href=''>" + (page_no - i + 1) + "</a>";
                }
                page.append(pageCount);
                page.append(omitPage);
                pageJquery = "共  " + pageNumberCount + "  页到第 <input class='pageNumberInfo' placeholder='请输入' type='text' id='jumpto' name='jumpto' title='指定页码'/><input class='pageNumberInfo' type='button' value='确定' id='btnJquery' title='指定页码'/>";
                page.append(pageJquery);
                page.append(dowmPage);
            }

        } else if (page_no <= min) {
            if (page_no == 1) {
                page.html("");
                page.append(upPage);
                for (var i = 0; i <= 4; i++) {
                    pageCount += "<a class='pageNumberInfo' id='a_" + (parseInt(page_no) + i) + "' href=''>" + (parseInt(page_no) + i) + "</a>";
                }
                page.append(pageCount);
                page.append(omitPage);
                pageJquery = "共  " + pageNumberCount + "  页到第 <input class='pageNumberInfo' placeholder='请输入' type='text' id='jumpto' name='jumpto' title='指定页码'/><input class='pageNumberInfo' type='button' value='确定' id='btnJquery' title='指定页码'/>";
                page.append(pageJquery);
                page.append(dowmPage);
            } else {
                page.html("");
                page.append(upPage);
                for (var i = 0; i <= 4; i++) {
                    pageCount += "<a class='pageNumberInfo' id='a_" + (page_no - 1 + i) + "' href=''>" + (page_no - 1 + i) + "</a>";
                }
                page.append(pageCount);
                page.append(omitPage);
                pageJquery = "共  " + pageNumberCount + "  页到第 <input class='pageNumberInfo' placeholder='请输入' type='text' id='jumpto' name='jumpto' title='指定页码'/><input class='pageNumberInfo' type='button' value='确定' id='btnJquery' title='指定页码'/>";
                page.append(pageJquery);
                page.append(dowmPage);
            }
        }
        //样式操作
        dataTableCss(page_no, pageNumberCount);
    },
    createDateMenu: function (Menu) {
        $(".tops").contextMenu({
            menu: Menu
        }, function (action, el, pos) {
            //action 是点击对应菜单名称
        });
    }
}

/*
*page_no当前页数 ，pageNumberCount总页数
*/
function dataTableCss(page_no, pageNumberCount) {
    $("#a_" + page_no + "").addClass("indexPageClass").siblings().removeClass("indexPageClass");
    if (parseInt($("#page").children("a:last").text()) < pageNumberCount) {
        $("#omitPage").show();
    }
    else {
        $("#omitPage").hide();
    }
}

/*
*创建数组关系
*/
function deleteUseDom(useID, obj) {
    var aUser = new Array();
    for (var i = 0; i < obj.length; i++) {
        var aUsercars = [useID, obj[i].obj_id];
        aUser.push(aUsercars);
        for (var j = 0; j < createDomObj.length; j++) {
            if (aUser["obj_id"] == createDomObj[j]["obj_id"]) {
                createDomObj.remove(j);
                break;
            }
        }
    }
    return aUser;
}

var custVehicleList = {};
var doc;
var josn_diff = true;
var isIn;
function useCarJosn(json) {
    for (var i = 0; i < json.length; i++) {
        var custVehicle = custVehicleList["cust_" + json[i].cust_id.toString()];
        if (!custVehicle) {
            doc = {
                cust_id: json[i].cust_id,
                vehicles: []
            }
            doc.vehicles.push(json[i]);
            custVehicleList["cust_" + json[i].cust_id.toString()] = doc;
        }
        else {
            isIn = true;
            for (var j = 0; j < custVehicle.vehicles.length; j++) {
                if (json[i].obj_id == custVehicle.vehicles[j].obj_id) {
                    isIn = false;
                    break;
                }
            }
            if (isIn) {
                //添加
                custVehicle.vehicles.push(json[i]);
            }
        }
    }
    return custVehicleList;
}



/*
*显示地址
*/
// var showLocation = function (address) {
//     if (address != "") {
//         _location.attr("name", address);
//         if (address.length > 10) {
//             address = address.substring(0, 10) + "......";
//         }
//         _location.html(address);
//     }
// }

/*
*查看位置
*/
function showOpenLocation(rev_lon) {
    window.open(" http://ditu.google.cn/maps?hl=zh-CN&tab=wl&q=" + rev_lon, "_blank");
}

/*
*ajax回调函数(异常错误) 统一调用
*/
var OnError = function OnError(XMLHttpRequest, textStatus, errorThrown) {
    alert("连接服务器异常, 请检查网络后再试");
}

/*
*地图操作
*/
function _gmap() {
    this.divContent = '<div  style="height:150px;overflow:hidden;"><div>' +
        '<table cellpadding="0" cellspacing="0" border="0">' +
        '<div>添加兴趣点</div>' +
        '<tr>' +
        '<td style="height:35px;" align="right">名称: </td>' +
        '<td align="left"><input style="width:140px;" id="poi_name" type="text"><img src="../../images/red_star.gif" align="absmiddle" /></td>' +
        '</tr>' +
        '<tr>' +
        '<td style="height:35px;" align="right">类别: </td>' +
        '<td align="left"><select id ="poi_type" style="width:140px;"><option value="1">一般建筑</option><option value="2">金融机构</option><option value="3">休闲娱乐</option><option value="4">加油站</option><option value="5">医疗机构</option><option value="6">科研教育</option><option value="7">企事业单位</option><option value="8">收费站</option></select></td>' +
        '</tr>' +
        '<tr>' +
        '<td style="height:35px;" align="right">备注: </td>' +
        '<td align="left"><input style="width:140px;" id="remark" type="text"></td>' +
        '</tr>' +
        '</table>' +
        '</div>' +
        '<div style="text-align: center"><input id="add_hobbySave" type="image" src="../../images/btn_save.jpg" border="0" align="absmiddle" /> <input id="add_hobbyClose" type="image" src="../../images/btn_cancel.jpg" border="0" align="absmiddle" /></div>' +
        '</div>' +
        '</div></div>';
}

_gmap.prototype = {
    editContent: function (thisID) {
        var divContent = '<div style="height:150px;overflow:hidden;"><div>' +
            '<table cellpadding="0" cellspacing="0" border="0">' +
            '<div>编辑兴趣点</div>' +
            '<tr>' +
            '<td style="height:35px;" align="right">名称: </td>' +
            '<td align="left" style="width:140px"><input style="width:130px;" id="poi_name" type="text" value=' + thisID.poi_name + '><img src="../../Content/images/red_star.gif" align="absmiddle" /></td>' +
            '</tr>' +
            '<tr>' +
            '<td style="height:35px;" align="right">类别: </td>' +
            '<td align="left"><select id ="poi_type" style="width:130px;"><option value="1">一般建筑</option><option value="2">金融机构</option><option value="3">休闲娱乐</option><option value="4">加油站</option><option value="5">医疗机构</option><option value="6">科研教育</option><option value="7">企事业单位</option><option value="8">收费站</option></select></td>' +
            '</tr>' +
            '<tr>' +
            '<td  style="height:35px;" align="right">备注: </td>' +
            '<td align="left"><input style="width:130px;"  id="remark" value=' + thisID.remark + ' type="text"></td>' +
            '</tr>' +
            '</table>' +
            '</div>' +
            '<div style="text-align: center"><input id="edit_hobbySave" type="image" src="../../images/btn_save.jpg" border="0" align="absmiddle"/> <input id="edit_hobbyClose" type="image" src="../../images/btn_cancel.jpg" border="0" align="absmiddle" /></div>' +
            '</div>' +
            '</div></div>';

        $("#poi_type option[value='" + thisID.poi_type + "']").attr("selected", "selected");
        return divContent;

    }, addFenceContent: function () {
        var divContent = '<div style="height:150px;overflow:hidden;"><div>' +
            '<table cellpadding="0" cellspacing="0" border="0">' +
            '<div>添加围栏</div>' +
            '<tr>' +
            '<td style="height:35px;" align="right">名称: </td>' +
            '<td align="left" style="width:140px;"><input style="width:130px" id="poi_name" type="text"><img src="../../images/red_star.gif" align="absmiddle" /></td>' +
            '</tr>' +
            '<tr>' +
            '<td style="height:35px;" align="right">范围(米): </td>' +
            '<td align="left"><input style="width:130px" id="width" type="text"><img src="../../images/red_star.gif" align="absmiddle" /></td>' +
            '</tr>' +
            '<tr>' +
            '<td style="height:35px;" align="right">备注: </td>' +
            '<td align="left"><input style="width:130px" id="remark" type="text"></td>' +
            '</tr>' +
            '</table>' +
            '</div>' +
            '<div style="text-align: center"><input id="add_fenceSave" type="image" src="../../images/btn_save.jpg" border="0" align="absmiddle"/> <input id="add_fenceColse" type="image" src="../../images/btn_cancel.jpg" border="0" align="absmiddle" /></div>' +
            '</div>' +
            '</div></div>';
        return divContent;
    }, editFenceContent: function (obj) {
        var divContent = '<div style="height:150px;overflow:hidden;"><div>' +
            '<table cellpadding="0" cellspacing="0" border="0">' +
            '<div>添加围栏</div>' +
            '<tr>' +
            '<td style="height:35px;" align="right">围栏名称: </td>' +
            '<td align="left" style="width:140px;"><input style="width:130px" id="poi_name" type="text" value=' + obj.poi_name + '><img src="../../images/red_star.gif" align="absmiddle" /></td>' +
            '</tr>' +
            '<tr>' +
            '<td style="height:35px;" align="right">范围(米): </td>' +
            '<td align="left"><input style="width:130px"  id="width" type="text" value=' + obj.width + '><img src="../../images/red_star.gif" align="absmiddle" /></td>' +
            '</tr>' +
            '<tr>' +
            '<td style="height:35px;" align="right">备注: </td>' +
            '<td align="left"><input style="width:130px"  id="remark" type="text"  value=' + obj.remark + ' ></td>' +
            '</tr>' +
            '</table>' +
            '</div>' +
            '<div style="text-align: center"><input id="edit_fenceSave" type="image" src="../../images/btn_save.jpg" border="0" align="absmiddle"/> <input id="edit_fenceColse" type="image" src="../../Content/images/btn_cancel.jpg" border="0" align="absmiddle" /></div>' +
            '</div>' +
            '</div></div>';
        return divContent;
    }
}

/*
*domID附加前缀id=>以便页面共存多个 
*/
function msgReadTable(domID) {
    this.msgShow = "<span  class='pageNumberInfo'  id='" + domID + "unread' class='pageNumberInfo'style='visibility:hidden;color:blue;' >已经到了第一页了!</span>";
    this.upPage = "<input class='pageNumberInfo' type='button' id='" + domID + "upPage'   value='上一页' title='上一页'/>";
    this.dowmPage = "<input class='pageNumberInfo' type='button' id='" + domID + "dowmPage' value='下一页' title='下一页'/>";
}

msgReadTable.prototype = {
    createDom: function (divID) {
        divID.html("");
        divID.append(this.msgShow);
        divID.append(this.upPage);
        divID.append(this.dowmPage);
    }
}

/*
*表格查询
*/
function tableJquery(obj) {
    obj.table.show().hide();
    obj.td.filter(":contains('" + obj.txt + "')").parent().show();
}

function userNameJquery(obj) {
    obj.liHtml
        .hide()
        .filter(":contains('" + (obj.txt) + "')")
        .show();
}

/*
*清空atrDialog
*/
function clerAtrDialog() {
    $(".input1").val("");
}

var COMMAND_VERSION = 0x4001;        //获取版本
var COMMAND_GPSINTERVAL = 0x4002;    //定位上传间隔 {gps_interval: 30}
var COMMAND_TRACKINTERVAL = 0x4003;  //跟踪上传间隔 {track_interval: 10}
var COMMAND_OVERSPEED = 0x4004;      //超速限速 {speed_limit: 80}
var COMMAND_NETLOC = 0x4005;         //基站定位 {network_loc: true}
var COMMAND_SLEEP = 0x4006;          //省电模式 {sleep: true}
var COMMAND_VIBRATEALERT = 0x4007;   //震动设置 {sensitivity: 0}
var COMMAND_RESTARTTIME = 0x4008;    //重启时间 {restart_time: 5}
var COMMAND_RESTRICT = 0x4015;       //禁行时段 {start_time: '10:00:00', end_time: '12:00:00'}

var COMMAND_ARMING = 0x4009;
var COMMAND_DISARMING = 0x400A;
var COMMAND_LOCK = 0x400B;
var COMMAND_UNLOCK = 0x400C;
var ALERT_SOS = 0x3001;              //紧急报警
var ALERT_OVERSPEED = 0x3002;        //超速报警
var ALERT_VIRBRATE = 0x3003;         //震动报警       
var ALERT_MOVE = 0x3004;             //位移报警       
var ALERT_ALARM = 0x3005;            //防盗器报警     
var ALERT_INVALIDRUN = 0x3006;       //非法行驶报警   
var ALERT_ENTERGEO = 0x3007;         //进围栏报警     
var ALERT_EXITGEO = 0x3008;          //出围栏报警     
var ALERT_CUTPOWER = 0x3009;         //断电报警       
var ALERT_LOWPOWER = 0x300A;         //低电压报警     
var ALERT_GPSCUT = 0x300B;           //GPS天线断路报警
var ALERT_OVERDRIVE = 0x300C;        //疲劳驾驶报警   
var ALERT_INVALIDACC = 0x300D;       //非法启动       
var ALERT_INVALIDDOOR = 0x300E;      //非法开车门     
var alert_type = ALERT_OVERSPEED;    //超速报警

//终端状态定义
var STATUS_FORTIFY = 0x2001,
    STATUS_LOCK = 0x2002,
    STATUS_NETLOC = 0x2003,
    STATUS_ACC = 0x2004,
    STATUS_SLEEP = 0x2005,
    STATUS_ALARM = 0x2006,
    STATUS_RELAY = 0x2007,
    STATUS_INPUT1 = 0x2008,
    STATUS_INPUT2 = 0x2009,
    STATUS_INPUT3 = 0x200A,
    STATUS_SMS = 0x200B;

/* ------------------------------
 // 字符串模板1，语法严格，不能混用，效率相对较高
 // 使用 {{ }} 作为标记是为了允许在模板中使用 JSON 字符串

 // 用法 1(对象参数，对象可多次调用)：
 var say = "对　象：{{hi}}, {{to}}! {{hello}}, {{world}}!"
 say = say.format({hi:"Hello", to:"World"})
 .format({hello:"你好", world:"世界"})
 console.log(say)

 // 用法 2(数组参数)：
 var say = "数　组：{{0}}, {{1}}! {{0}}!"
 say = say.format(["Hello", "World"])
 console.log(say)

 // 用法 3(字符串参数，最后一个字符串可以重复使用)：
 var say = "字符串：{{.}}, {{.}}! {{.}}!"
 say = say.format("Hello", "World")
 console.log(say)

 // 用法 4(多次调用，字符串和数组不能共用，字符串必须首先处理)：

 // 无数组
 var say = "{{.}}：3 2 1, {{hi}}, {{to}}! {{hello}}, {{world}}!"
 say = say.format("多　次")
 .format({hi: "Hello"})
 .format({to: "World"})
 .format({hello: "你好", world: "世界"})
 console.log(say)

 // 无字符串
 var say = "多　次：{{2}} {{1}} {{0}}, {{hi}}, {{to}}! {{hello}}, {{world}}!"
 say = say.format({hi: "Hello"})
 .format({to: "World"})
 .format([1,2,3])
 .format({hello: "你好", world: "世界"})
 console.log(say)

 // 字符串和数组共用
 var say = "{{.}}：{{2}} {{1}} {{0}}, {{hi}}, {{to}}! {{hello}}, {{world}}!"
 say = say.format("出问题")
 .format({hi: "Hello"})
 .format({to: "World"})
 .format([1,2,3])
 .format({hello: "你好", world: "世界"})
 console.log(say)

 // 没有首先处理字符串
 var say = "出问题：{{.}}, {{hi}}, {{to}}! {{hello}}, {{world}}!"
 say = say.format({hi: "Hello"})
 .format("3 2 1")
 .format({to: "World"})
 .format({hello: "你好", world: "世界"})
 console.log(say)
 ------------------------------ */
String.prototype.format = function (arg) {
    // 安全检查(长度不能小于 {{.}}，为后面下标引用做准备)
    var len = this.length;
    if (len < 5) { return this }

    var start = 0, result = "", argi = 0;

    for (var i = 0; i <= len; i++) {
        // 处理 {{ }} 之外的内容
        if (this[i] === "{" && this[i - 1] === "{") {
            result += this.slice(start, i - 1);
            start = i - 1;
        } else if (this[i] === "}" && this[i - 1] === "}") {
            // 获取 {{ }} 中的索引
            var index = this.slice(start + 2, i - 1);
            if (index === ".") {          // 字符串
                result += arguments[argi];
                // 最后一个字符串会重复使用
                if (argi < (arguments.length - 1)) {
                    argi++;
                }
                start = i + 1;
            } else {                      // 对象或数组
                if (arg[index] != null) {
                    result += arg[index];
                    start = i + 1;
                }
            }
        }
    }
    // 处理最后一个 {{ }} 之后的内容
    result += this.slice(start);
    return result;
};

// 加载中
const ICON_INFO = 0;
const ICON_LOADING = 1;
const ICON_OK = 2;
const ICON_FAIL = 3;
const ICON_WARN = 4;
const ICON_PATH = ['/img/info.png', '/img/loading.gif', '/img/ok.png', '/img/fail.png', '/img/warn.png'];
var showLoading = function (show, info, type, delayClose) {
    var _processing = $('#_processing');
    var _processingText = $('#_processingText');
    var _processingIcon = $('#_processingIcon');
    if (show) {
        _processingIcon.attr('src', ICON_PATH[type]);
        _processingText.html(info);
        _processing.css('visibility', 'visible');
        if (delayClose) {
            setTimeout(function () {
                _processing.css('visibility', 'hidden');
            }, delayClose * 1000)
        }
    } else {
        _processing.css('visibility', 'hidden');
    }
};

var setLoading2 = function (ul) {
    ul.html('<tr>' +
        '<td colspan="3">' +
        '<p style="text-align: center; padding-top: 5px; padding-bottom: 5px">' +
        '<img style="width:16px;height:16px" src="/img/waiting.gif"/>' +
        '</p>' +
        '</td>' +
        '</tr>');
};

function _ok(str) {
    showLoading(true, str, ICON_OK, 2);
}

function _fail(str) {
    showLoading(true, str, ICON_FAIL, 2);
}

function _alert(str, fade_out) {
    showLoading(true, str, ICON_INFO, 2);
}

var loadSubNode = function (treeObj, node) {
    var uid = node.id;
    if (parseInt(uid) > 100 && !node.children) {
        var query_json = {
            parentId: uid
        };
        wistorm_api._list('customer', query_json, 'objectId,name,treePath,parentId,uid,custType,other', '-custType,name', '-createdAt', 0, 0, 1, -1, auth_code, true, function (json) {
            var customerArray = [];
            for (var i = 0; i < json.data.length; i++) {
                if (json.data[i]['uid'] !== uid) {
                    var childCount = json.data[i]['other'] ? (json.data[i]['other']['childCount'] || 0) : 0;
                    var vehicleCount = json.data[i]['other'] ? (json.data[i]['other']['vehicleCount'] || 0) : 0;
                    customerArray.push({
                        open: false,
                        id: json.data[i]['uid'],
                        treePath: json.data[i]['treePath'],
                        pId: uid,
                        _name: json.data[i]['name'],
                        childCount: childCount,
                        vehicleCount: vehicleCount,
                        name: json.data[i]['name'] + '(' + childCount + '/' + vehicleCount + ')'
                    });
                }
            }
            if (customerArray.length > 0) {
                treeObj.addNodes(node, customerArray, false);
            }
        });
    }
};

var searchNode = function (treeObj, key) {
    if (key && key !== '') {
        var query_json = {
            objectId: '>0'
        };
        wistorm_api._list('customer', query_json, 'objectId,name,treePath,parentId,uid,custType,other', '-custType,name', '-createdAt', 0, 0, 1, -1, auth_code, true, function (json) {
            var customerArray = [];
            for (var i = 0; i < json.data.length; i++) {
                if (json.data[i]['uid'] !== uid) {
                    var childCount = json.data[i]['other'] ? (json.data[i]['other']['childCount'] || 0) : 0;
                    var vehicleCount = json.data[i]['other'] ? (json.data[i]['other']['vehicleCount'] || 0) : 0;
                    customerArray.push({
                        open: false,
                        id: json.data[i]['uid'],
                        treePath: json.data[i]['treePath'],
                        pId: uid,
                        name: json.data[i]['name'] + '(' + childCount + '/' + vehicleCount + ')'
                    });
                }
            }
            if (customerArray.length > 0) {
                treeObj.addNodes(node, customerArray, false);
            }
        });
    }
};


// 更新客户下级用户数
var updateCustomerCount = function (uid, treePath, callback) {
    var query_json = {
        treePath: '^' + treePath,
        custType: '<>14'
    };
    wistorm_api._count('customer', query_json, auth_code, true, function (json) {
        var count = json.status_code === 0 ? json.count || 1 : 1;
        count--;
        var query_json = {
            uid: uid
        };
        var update_json = {
            'other.childCount': count
        };
        wistorm_api._update('customer', query_json, update_json, auth_code, true, function (json) {
            if (json.status_code !== 0) {
                console.log('update customer child count failed - ' + json);
            } else {

            }
            if (callback) {
                callback(json)
            }
        });
    });
};

// 更新用户目标数
var updateVehicleCount = function (uid) {
    var query_json = {
        uid: uid
    };
    wistorm_api._count('_iotDevice', query_json, auth_code, true, function (json) {
        var count = json.status_code === 0 ? json.count || 0 : 0;
        var query_json = {
            uid: uid,
            binded: true
        };
        var update_json = {
            'other.vehicleCount': count
        };
        wistorm_api._update('customer', query_json, update_json, auth_code, true, function (json) {
            if (json.status_code !== 0) {
                console.log('update vehicle child count failed - ' + json);
            }
        });
    });
};

// 设置上级用户信息
var setParentInfo = function () {
    if ($.cookie('parent_name') && $.cookie('parent_name') !== '') {
        $('#parentInfo').html('所属用户：' + $.cookie('parent_name') + '&nbsp;&nbsp;&nbsp;&nbsp;联系人：' + $.cookie('parent_contact') +
            '&nbsp;&nbsp;&nbsp;&nbsp;联系电话：' + $.cookie('parent_tel'));
    }
};

setParentInfo();

/*
 * 将秒数格式化时间
 * @param {Number} seconds: 整数类型的秒数
 * @return {String} time: 格式化之后的时间
 */
function formatTime(seconds) {
    var min = Math.floor(seconds / 60),
        second = seconds % 60,
        hour, newMin, time;

    if (min > 60) {
        hour = Math.floor(min / 60);
        newMin = min % 60;
    }

    if (second < 10) { second = '0' + second; }
    if (min < 10) { min = '0' + min; }

    return time = hour ? (hour + i18next.t("system.hour") + newMin + i18next.t("system.min") + second + i18next.t("system.sec")) : (min + i18next.t("system.min") + second + i18next.t("system.sec"));
}

function _tableResize() {
    // 修改目标列表高度
    var height = $(window).height() - 150;
    $('.dataTables_wrapper').css({ "height": height + "px" });
}

$(document).ready(function () {
    //高度变化改变(要重新计算_browserheight)
    setTimeout(function () {
        _tableResize();
    }, 1000);
    $(window).resize(function () {
        _tableResize();
    });
});

if (!Array.prototype.unique) {
    Array.prototype.unique = function () {
        var hash = {}, result = [], type = '', item;
        for (var i = 0; i < this.length; i++) {
            item = this[i];
            type = Object.prototype.toString.call(item);
            if (!hash[item + type]) {
                hash[item + type] = true;
                result.push(item);
            }
        }
        return result;
    };
}