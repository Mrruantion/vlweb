/**
 * Created with JetBrains WebStorm.
 * User: 1
 * Date: 13-8-26
 * Time: 下午11:33
 * To change this template use File | Settings | File Templates.
 */

var auth_code = $.cookie('auth_code');

var typeDesc;
var sendFlagDesc;
var cmdTypeDesc = {};
var _cmdType = 1;
var _did = '';
var t;

var engineSwitch = 0;
var setEngineSwitch = function(value){
    engineSwitch = parseInt(value);
};
var standSwitch = 1;
var setStandSwitch = function(value){
    standSwitch = parseInt(value);
};
var workType = 1; //默认为长待机模式
var setWorkType = function(value){
    workType = parseInt(value);
};

var sendCommand = function(){
    if(_did === ''){
        _alert(i18next.t("system.select_vehicle"), 3);
        return;
    }
    var type = parseInt($('#type').val());
    var remark = '';
    switch (_cmdType){
        case 1: //断油断电
            var password = $('#passwordConfirm').val();
            if(password === '' || hex_md5(hex_md5(password)) !== $.cookie('sec_pass')){
                showLoading(true, i18next.t("setting.msg_wrong_password"), ICON_WARN, 2);
                return;
            }
            remark = engineSwitch === 1 ? i18next.t("setting.stop_engine"): i18next.t("setting.retore_engine");
            showLoading(true, i18next.t("setting.sending_command"), ICON_LOADING);
            wistorm_api.createCommand(_did, IOT_CMD.VEHICLE_CONTORL, {
                flag: 4,
                switch: engineSwitch
            }, type, remark, auth_code, function (obj) {
                if(obj.status_code === 0){
                    showLoading(true, i18next.t("setting.msg_send_success"), ICON_OK, 2);
                }else if(obj.status_code === 0x9012){
                    showLoading(true, i18next.t("setting.msg_send_offline"), ICON_INFO, 2);
                }else{
                    showLoading(true, i18next.t("setting.msg_send_fail"), ICON_FAIL, 2);
                }
                if(t){
                    t.query(null, function(){});
                }
                $("#divDeviceSet").dialog("close");
            });
            break;
        case 2: //一键设防
            remark = standSwitch === 1 ? i18next.t("setting.set_arming"): i18next.t("setting.set_disarming");
            showLoading(true, i18next.t("setting.sending_command"), ICON_LOADING);
            wistorm_api.createCommand(_did, IOT_CMD.VEHICLE_CONTORL, {
                flag: 2,
                switch: standSwitch
            }, type, remark, auth_code, function (obj) {
                if(obj.status_code === 0){
                    showLoading(true, i18next.t("setting.msg_send_success"), ICON_OK, 2);
                }else if(obj.status_code === 0x9012){
                    showLoading(true, i18next.t("setting.msg_send_offline"), ICON_INFO, 2);
                }else{
                    showLoading(true, i18next.t("setting.msg_send_fail"), ICON_FAIL, 2);
                }
                if(t){
                    t.query(null, function(){});
                }
                $("#divDeviceSet").dialog("close");
            });
            break;
        case 3: //回传间隔
            var interval = parseInt($('#interval').val());
            remark = i18next.t("setting.set_interval", {interval: interval});
            showLoading(true, i18next.t("setting.sending_command"), ICON_LOADING);
            wistorm_api.createCommand(_did, IOT_CMD.SET_PARAM, {
                param_id: 0x0029,
                param_len: 4,
                param_value: interval
            }, type, remark, auth_code, function (obj) {
                if(obj.status_code === 0){
                    showLoading(true, i18next.t("setting.msg_send_success"), ICON_OK, 2);
                }else if(obj.status_code === 0x9012){
                    showLoading(true, i18next.t("setting.msg_send_offline"), ICON_INFO, 2);
                }else{
                    showLoading(true, i18next.t("setting.msg_send_fail"), ICON_FAIL, 2);
                }
                if(t) {
                    t.query(null, function () {});
                }
                $("#divDeviceSet").dialog("close");
            });
            break;
        case 4: //超速报警
            var speedLimit = parseInt($('#speedLimit').val());
            remark = i18next.t("setting.set_overspeed", {speedLimit: speedLimit});
            showLoading(true, i18next.t("setting.sending_command"), ICON_LOADING);
            wistorm_api.createCommand(_did, IOT_CMD.SET_PARAM, {
                param_id: 0x0055,
                param_len: 4,
                param_value: speedLimit
            }, type, remark, auth_code, function (obj) {
                if(obj.status_code === 0){
                    showLoading(true, i18next.t("setting.msg_send_success"), ICON_OK, 2);
                }else if(obj.status_code === 0x9012){
                    showLoading(true, i18next.t("setting.msg_send_offline"), ICON_INFO, 2);
                }else{
                    showLoading(true, i18next.t("setting.msg_send_fail"), ICON_FAIL, 2);
                }
                if(t){
                    t.query(null, function(){});
                }
                $("#divDeviceSet").dialog("close");
            });
            break;
        case 5: //重启
            remark = i18next.t("setting.restart_device");
            showLoading(true, i18next.t("setting.sending_command"), ICON_LOADING);
            wistorm_api.createCommand(_did, IOT_CMD.DEVICE_CONTORL, {
                control_cmd: 0x04,
                control_param: ''
            }, type, remark, auth_code, function (obj) {
                if(obj.status_code === 0){
                    showLoading(true, i18next.t("setting.msg_send_success"), ICON_OK, 2);
                }else if(obj.status_code === 0x9012){
                    showLoading(true, i18next.t("setting.msg_send_offline"), ICON_INFO, 2);
                }else{
                    showLoading(true, i18next.t("setting.msg_send_fail"), ICON_FAIL, 2);
                }
                if(t){
                    t.query(null, function(){});
                }
                $("#divDeviceSet").dialog("close");
            });
            break;
        case 6: //超长待机设置
            remark = i18next.t("setting.set_mode");
            var buf = [0x81, 0x01, 0x00, 0x0A, 0x31, 0x01, 0x00, 0x0A, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30];
            buf[5] = workType === 1 || workType === 2 ? 1: 0;
            if(workType === 1){
                var dayInterval = parseInt($('#dayInterval').val()) * 24 * 60;
                var h = parseInt(dayInterval / 256);
                var l = dayInterval % 256;
                buf[6] = h;
                buf[7] = l;
                var times = [];
                if($('#t1').val() !== '')times.push(parseInt($('#t1').val()));
                if($('#t2').val() !== '')times.push(parseInt($('#t2').val()));
                if($('#t3').val() !== '')times.push(parseInt($('#t3').val()));
                if($('#t4').val() !== '')times.push(parseInt($('#t4').val()));
                if($('#t5').val() !== '')times.push(parseInt($('#t5').val()));
                if($('#t6').val() !== '')times.push(parseInt($('#t6').val()));
                times.sort(function (a, b) {
                    return b < a
                });
                remark += i18next.t("setting.msg_mode_long", {dayInterval: $('#dayInterval').find("option:selected").text()}); //'长待机模式(回传间隔：' + $('#dayInterval').find("option:selected").text() + '，回传时间点:';
                    // ($('#t1').val() !== '' ? $('#t1').find("option:selected").text() + ' ' : '') +
                    // ($('#t2').val() !== '' ? $('#t2').find("option:selected").text() + ' ' : '') +
                    // ($('#t3').val() !== '' ? $('#t3').find("option:selected").text() + ' ' : '') +
                    // ($('#t4').val() !== '' ? $('#t4').find("option:selected").text() + ' ' : '') +
                    // ($('#t5').val() !== '' ? $('#t5').find("option:selected").text() + ' ' : '') +
                    // ($('#t6').val() !== '' ? $('#t6').find("option:selected").text() : '') + ')';
                for(var i = 0; i < times.length; i++){
                    buf[8 + i] = times[i];
                    remark += ' ' + times[i] + ':00';
                }
                remark += ')';
                // if($('#t1').val() !== '')buf[8] = parseInt($('#t1').val());
                // if($('#t2').val() !== '')buf[9] = parseInt($('#t2').val());
                // if($('#t3').val() !== '')buf[10] = parseInt($('#t3').val());
                // if($('#t4').val() !== '')buf[11] = parseInt($('#t4').val());
                // if($('#t5').val() !== '')buf[12] = parseInt($('#t5').val());
                // if($('#t6').val() !== '')buf[13] = parseInt($('#t6').val());
            }else if(workType === 2){
                remark += i18next.t("setting.msg_mode_time", {minInterval: $('#minInterval').find("option:selected").text()}); //'分时模式(每天' + $('#minInterval').find("option:selected").text() + ')';
                var dayInterval = parseInt($('#minInterval').val());
                var h = parseInt(dayInterval / 256);
                var l = dayInterval % 256;
                buf[6] = h;
                buf[7] = l;
            }else{
                remark += i18next.t("setting.msg_mode_trace", {trackInterval: $('#trackInterval').val()}); //'跟踪模式(回传间隔：' + $('#trackInterval').val() + '秒)';
                var trackInterval = parseInt($('#trackInterval').val());
                buf[7] = trackInterval;
            }
            showLoading(true, i18next.t("setting.sending_command"), ICON_LOADING);
            wistorm_api.createCommand(_did, IOT_CMD.MT_DATA, {
                type: 0xF1,
                buffer: buf
            }, type, remark, auth_code, function (obj) {
                if(obj.status_code === 0){
                    showLoading(true, i18next.t("setting.msg_send_success"), ICON_OK, 2);
                }else if(obj.status_code === 0x9012){
                    showLoading(true, i18next.t("setting.msg_send_offline"), ICON_INFO, 2);
                }else{
                    showLoading(true, i18next.t("setting.msg_send_fail"), ICON_FAIL, 2);
                }
                if(t){
                    t.query(null, function(){});
                }
                $("#divDeviceSet").dialog("close");
            });
            break;
        case 7: //远程升级
            var version = $('#version').val();
            if(version === ''){
                _alert(i18next.t("setting.msg_version_wrong"));
                return;
            }
            remark = i18next.t("setting.msg_upgrade", {version: version}); //'远程升级(软件版本号：' + version + ')';
            showLoading(true, i18next.t("setting.sending_command"), ICON_LOADING);
            wistorm_api.createCommand(_did, IOT_CMD.UPGRADE, {
                param_id: 0x00A,
                version: version
            }, type, remark, auth_code, function (obj) {
                if(obj.status_code === 0){
                    showLoading(true, i18next.t("setting.msg_send_success"), ICON_OK, 2);
                }else if(obj.status_code === 0x9012){
                    showLoading(true, i18next.t("setting.msg_send_offline"), ICON_INFO, 2);
                }else{
                    showLoading(true, i18next.t("setting.msg_send_fail"), ICON_FAIL, 2);
                }
                if(t){
                    t.query(null, function(){});
                }
                $("#divDeviceSet").dialog("close");
            });
            break;
    }
};

$(document).ready(function () {
    var dsId = setInterval(function(){
        if(!i18nextLoaded){
            return;
        }

        typeDesc = [i18next.t("setting.send_rightnow"),i18next.t("setting.send_offline")];
        sendFlagDesc = [i18next.t("setting.flag_waiting"),i18next.t("setting.flag_success"),i18next.t("setting.flag_fail")];
        cmdTypeDesc = {
            '33027': i18next.t("setting.device_set_param"),
            '33029': i18next.t("setting.device_control"),
            '33028': i18next.t("setting.device_get_param"),
            '33031': i18next.t("setting.device_get_prop"),
            '33032': i18next.t("setting.remote_upgrade"),
            '35072': i18next.t("setting.long_device_set"),
            '34048': i18next.t("setting.vehicle_control"),
            '33536': i18next.t("setting.sendTextMessage"),
        };
        // 初始化目标选择框
        var uid = $.cookie('dealer_id');
        var ts = new vehicleSelector($('#name'), function(vid, did, name){
            $('#did').val(did);
            _did = did;
        });
        ts.init();
        ts.getData(uid, i18next.t("system.all_vehicle"));

        $('#cmdTypeTab a').click(function (e) {
            _cmdType = parseInt($(this).attr('value'));
        });

        var buttons = {};
        buttons[i18next.t("system.save")] = function () {
            $('#frmDeviceSet').submit();
        };
        buttons[i18next.t("system.cancel")] = function () {
            $(this).dialog("close");
        };
        $('#divDeviceSet').dialog({
            autoOpen: false,
            width: 460,
            buttons: buttons
        });

        $('#frmDeviceSet').submit(function () {
            sendCommand();
            return false;
        });
        clearInterval(dsId);
    }, 100);
});


