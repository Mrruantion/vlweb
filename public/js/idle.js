/**
 * Created with JetBrains WebStorm.
 * User: 1
 * Date: 13-8-26
 * Time: 下午11:33
 * To change this template use File | Settings | File Templates.
 */

var auth_code = $.cookie('auth_code');
var dealerId = $.cookie('dealer_id');
var _idleDate = new Date();
var _endIdleDate = new Date();
_endIdleDate = new Date(_endIdleDate.setDate(_endIdleDate.getDate() + 1));
var _did = '';
var map_type = MAP_TYPE_BAIDU;
var map_engine = 'BAIDU';

// 初始化账号信息窗体
var initFrmIdle = function(mode, title, did, date){
    var _did = did;
    var _idleDate = date;
    $('#dateLabel').css('display', mode === 1 ? 'none': 'block');
    $('#datePanel').css('display', mode === 1 ? 'none': 'block');
    $('#datepicker').val(new Date(date).format('yyyy-MM-dd'));
    $("#divIdle").dialog("option", "title", title);
};

var createIdle = function(idle){
    idle.startTime = new Date(idle.startTime).format('yyyy-MM-dd hh:mm:ss');
    idle.duration = formatTime(parseInt(idle.duration));
    var li = '<li class="idle">' +
        '<div class="block">' +
        '<div class="img">' +
        '<div class="idleMarker">{{index}}</div>' +
        '</div>' +
        '<div class="idleLocation" lon="{{startLon}}" lat="{{startLat}}"><img style="width:16px;height:16px" src="/img/waiting.gif"/>&nbsp;' + i18next.t("idle.get_location") +'</div>' +
        '</div>' +
        '<div class="block">' +
        '<div class="img">' +
        '<img src="images/location.png" align="absmiddle" style="visibility: hidden;">' +
        '</div>' +
        '<div class="left" style="padding-right: 5px">' + i18next.t("idle.idle_time") +'</div>' +
        '<div class="left">{{startTime}}</div>' +
        '</div>' +
        '<div class="duration">' +
        '<div class="img">' +
        '<img src="images/location.png" align="absmiddle" style="visibility: hidden;">' +
        '</div>' +
        '<div class="left" style="padding-right: 5px">' + i18next.t("idle.idle_duration") +'</div>' +
        '<div class="left">{{duration}}</div>' +
        '</div>' +
        '</li>';
  return li.format(idle);
};

var addIdleList = function(idles){
    var ul = $('#idleList');
    ul.html('');
    for(var i = 0; i < idles.length; i++){
        idles[i].index = (i+1).toString();
        var li = createIdle(idles[i]);
        ul.append(li);
    }
};

var showLocation = function showLocation(thisID, address) {
    thisID.html(address);
};

var getLocation = function(){
    setTimeout(function(){
        $(".idleLocation").each(function (i) {
            var lon = parseFloat($(this).attr("lon"));
            var lat = parseFloat($(this).attr("lat"));
            setLocation(0, lon, lat, $(this), showLocation);
        });
    }, 0);
};

var loadIdleList = function(){
    _first = true;
    $('.waiting').show();
    // 画轨迹线
    var vehicle = {
        did: _did
    };
    // 删除之前的轨迹
    wimap.clearIdles(_did);
    var d = new Date($('#datepicker').val());
    var duration = $('#duration').val();
    var startTime = _idleDate.format('yyyy-MM-dd hh:mm:ss');
    var endTime = _endIdleDate.format('yyyy-MM-dd hh:mm:ss');
    var query = {
        did: _did,
        startTime: startTime + '@' + endTime,
        duration: duration,
        map: map_engine
    };
    wistorm_api._list('_iotIdle', query, 'startTime,startLon,startLat,endTime,duration', 'startTime', 'startTime', 0, 0, 0, -1, auth_code, true, function(obj){
        console.log(obj);
        if(obj.statusText === 'timeout'){
            _alert(i18next.t("msg.err_timeout"), 3);
            return;
        }
        if(obj.status_code == 0 && obj.total > 0){
            idles = obj.data;
            // 添加停留点列表
            addIdleList(idles);
            getLocation();
            // 在地图上添加停留点
            wimap.addIdles(_did, idles);
            $('.waiting').hide();
        }else{
            $('.waiting').hide();
            $('#idleList').html('<p style="text-align: center; padding-top: 5px">' + i18next.t("idle.no_data") +'</p>');
        }
    });
};

// 停留列表
var idle = function(did, mode){
    var vehicle = _vehicles[did];
    if(vehicle){
        _did = did;
        var mode = mode || 0;
        initFrmIdle(mode, i18next.t("idle.idle_list") + '(' + vehicle.name + ')', did, _idleDate);
        $("#divIdle").dialog("open");
        loadIdleList();
    }
};

$(document).ready(function () {

    map_type = $.cookie('lang') === 'zh' || $.cookie('lang') === 'zh-CN' ? MAP_TYPE_BAIDU : MAP_TYPE_GOOGLE;
    map_engine = $.cookie('lang') === 'zh' || $.cookie('lang') === 'zh-CN' ? 'BAIDU' : 'GOOGLE';

    var idleId = setInterval(function () {
        if(!i18nextLoaded){
            return;
        }

        $('#datepicker').datepicker($.datepicker.regional[ $.cookie("lang") ]);
        $('#datepicker').datepicker( "option", "dateFormat", "yy-mm-dd" );
        $('#datepicker').on('change', function () {
            _idleDate = new Date($('#datepicker').val() + ' 00:00:00');
            _endIdleDate = new Date($('#datepicker').val() + ' 23:59:59');
            loadIdleList();
        });
        $('#duration').on('change', function () {
            loadIdleList();
        });
        // Dialog Simple
        $('#divIdle').dialog({
            position: { my: "right-10 top+45", at: "right top", of: $('#map_canvas') },
            autoOpen: false,
            resizable: false,
            width: 350,
            buttons: {
                // "保存": function () {
                //     $('#frmAccount').submit();
                // },
                // "取消": function () {
                //     validator_account.resetForm();
                //     $(this).dialog("close");
                // }
            }
        });

        $('#idleList').on('click', '.idle', function(){
            var loc = $(this).find('div.idleLocation');
            if(loc){
                var index = $(this).find('div.idleMarker').html();
                var lon = loc.attr('lon');
                var lat = loc.attr('lat');
                wimap.addIdleMarker(lon, lat, index);
                wimap.setCenter(lon, lat);

            }

        });

        clearInterval(idleId);
    }, 100);
});