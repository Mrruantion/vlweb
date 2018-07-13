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

// 初始化账号信息窗体
var initFrmPicture = function(mode, title, did, date){
    var _did = did;
    var _idleDate = date;
    $("#divPicture").dialog("option", "title", title);
};

var createPicture = function(picture){
    picture.smallUrl = picture.url + '?imageView2/0/w/160/h/120';
    picture.title = i18next.t("picture.channel") + " " + picture.channel + ' - ' + new Date(picture.createdAt).format('yyyy-MM-dd hh:mm:ss');
    var li = '<li>' +
        '<div class="img-label">{{title}}</div>' +
        '<img data-original="{{url}}" src="{{smallUrl}}" alt="{{title}}">' +
        '</li>';
  return li.format(picture);
};

var addPictureList = function(pictures){
    var ul = $('#PictureList');
    ul.html('');
    for(var i = 0; i < pictures.length; i++){
        pictures[i].index = (i+1).toString();
        var li = createPicture(pictures[i]);
        ul.append(li);
    }
    var $images = $('.docs-pictures');
    var options = {
        // inline: true,
        url: 'data-original',
        // movable: false,
        navbar: false
        // build: function (e) {
        //     console.log(e.type);
        // },
        // built: function (e) {
        //     console.log(e.type);
        // },
        // show: function (e) {
        //     console.log(e.type);
        // },
        // shown: function (e) {
        //     console.log(e.type);
        // },
        // hide: function (e) {
        //     console.log(e.type);
        // },
        // hidden: function (e) {
        //     console.log(e.type);
        // },
        // view: function (e) {
        //     console.log(e.type);
        // },
        // viewed: function (e) {
        //     console.log(e.type);
        // }
    };
    $images.viewer(options);
    $images.viewer('update');
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

var loadPictureList = function(){
    _first = true;
    $('.waiting').show();
    // 画轨迹线
    var vehicle = {
        did: _did
    };
    // 删除之前的轨迹
    // wimap.clearIdles(_did);
    var startTime = $('#startTime').val();
    var endTime = $('#endTime').val();
    var query = {
        did: _did,
        createdAt: startTime + '@' + endTime,
        map: 'BAIDU'
    };
    wistorm_api._list('_iotMedia', query, 'did,channel,event,type,url,gpsData,createdAt', '-createdAt', 'createdAt', 0, 0, 0, -1, auth_code, true, function(obj){
        console.log(obj);
        if(obj.statusText === 'timeout'){
            _alert(i18next.t("msg.err_timeout"), 3);
            return;
        }
        if(obj.status_code == 0 && obj.total > 0){
            var pictures = obj.data;
            // 添加停留点列表
            addPictureList(pictures);
            // getLocation();
            // 在地图上添加停留点
            // wimap.addIdles(_did, idles);
        }else{
            $('#PictureList').html('<p style="text-align: center; padding-top: 20px">' + i18next.t("picture.no_data") +'</p>');
        }
    });
};

// 停留列表
var picture = function(did, mode){
    var vehicle = _vehicles[did];
    if(vehicle){
        _did = did;
        var mode = mode || 0;
        initFrmPicture(mode, i18next.t("picture.picture_manage") + '(' + vehicle.name + ')', did, _idleDate);
        $("#divPicture").dialog("open");
        loadPictureList();
    }
};

var _begun = false;
var expire_in = new Date();

var showProgress = function(){
    wistorm_api.getCache(_did+'.picture', function(obj) {
        if (obj && obj.percent < 100) {
            showLoading(true, i18next.t("picture.gathering") + '(' + obj.percent + '%)', ICON_LOADING);
            _begun = true;
            setTimeout(showProgress, 2000);
        }else{
            if (_begun) {
                showLoading(true, i18next.t("picture.gather_finish"), ICON_OK, 2);
                setTimeout(function () {
                    loadPictureList();
                }, 1000);
            } else {
                var now = new Date();
                if (expire_in > now) {
                    showLoading(true, i18next.t("picture.gathering")+ '(0%)', ICON_LOADING);
                    setTimeout(showProgress, 2000);
                } else {
                    showLoading(true, i18next.t("picture.gather_timeout"), ICON_FAIL, 2);
                }
            }
        }
    });
};

$(document).ready(function () {
    var picId = setInterval(function () {
       if(!i18nextLoaded){
           return;
       }

        $('.startTime').datetimepicker({
            language:  $.cookie("lang"),
            weekStart: 1,
            todayBtn:  1,
            autoclose: 1,
            todayHighlight: 1,
            startView: 2,
            forceParse: 0,
            showMeridian: 1
        });
        $('#startTime').val(new Date().format('yyyy-MM-dd 00:00:00'));
        $('.endTime').datetimepicker({
            language:  $.cookie("lang"),
            weekStart: 1,
            todayBtn:  1,
            autoclose: 1,
            todayHighlight: 1,
            startView: 2,
            forceParse: 0,
            showMeridian: 1
        });
        $('#endTime').val(new Date().format('yyyy-MM-dd 23:59:59'));
        $('#query').on('click', function () {
            loadPictureList();
        });

        $('#takePicture').on('click', function () {
            if(_did === ''){
                _alert(i18next.t("system.select_vehicle"), 3);
                return;
            }
            // 判断是否有图像任务在执行，有择不能再次采集
            wistorm_api.getCache(_did+'.picture', function(obj){
                if(obj){
                    showLoading(true, i18next.t("picture.last_task_runing") + '(' + obj.percent + '%)' , ICON_WARN);
                    setTimeout(function(){
                        showProgress();
                    }, 1000);
                }else{
                    showLoading(true, i18next.t("setting.sending_command"), ICON_LOADING);
                    var channel = parseInt($('#channel').val());
                    var take_type = parseInt($('#take_type').val());
                    var resolution = parseInt($('#resolution').val());
                    var quality = parseInt($('#quality').val());
                    var remark = i18next.t("picture.gather_picture") + '(' + $("#channel").find("option:selected").text() + '，' + $("#take_type").find("option:selected").text() + '，' + $("#resolution").find("option:selected").text() + '，' + $("#quality").find("option:selected").text() + ')';
                    wistorm_api.createCommand(_did, IOT_CMD.TAKE_PICTURE, {
                        channel_id: channel,
                        take_type: take_type,
                        interval: 0,
                        save_flag: 0,
                        resolution: resolution,
                        quality: quality,
                        brightness: 0,
                        contrast: 0,
                        saturation: 0,
                        shades: 0
                    }, 0, remark, auth_code, function (obj) {
                        if(obj.status_code === 0){
                            showLoading(true, i18next.t("picture.gathering") + '(0%)', ICON_LOADING);
                            setTimeout(function(){
                                _begun = false;
                                expire_in = new Date();
                                expire_in = new Date(expire_in.setSeconds(expire_in.getSeconds()+60));
                                showProgress();
                            }, 1000);
                        }else{
                            showLoading(true, i18next.t("setting.msg_send_fail"), ICON_FAIL, 2);
                        }
                    });
                }
            });
        });

        // Dialog Simple
        $('#divPicture').dialog({
            position: { my: "right-10 top+45", at: "right top", of: $('#map_canvas') },
            autoOpen: false,
            resizable: false,
            width: 640,
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

        $('#PictureList').on('click', '.picture', function(){
            var loc = $(this).find('div.idleLocation');
            if(loc){
                var index = $(this).find('div.idleMarker').html();
                var lon = loc.attr('lon');
                var lat = loc.attr('lat');
                wimap.addIdleMarker(lon, lat, index);
                wimap.setCenter(lon, lat);
            }
        });

       clearInterval(picId);
    }, 100);
});