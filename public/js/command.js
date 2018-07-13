/**
 * Created with JetBrains WebStorm.
 * User: 1
 * Date: 13-8-26
 * Time: 下午11:33
 * To change this template use File | Settings | File Templates.
 */

var auth_code = $.cookie('auth_code');

function windowResize() {
    //高度变化改变(要重新计算_browserheight)
    windowHeight = $(window).height() - 215;
    // 如果宽度小于390，则设置表格为简易显示模式，并且客户列表高度改为300px
    windowWidth = $(window).width();
}

$(document).ready(function () {
    $("#alert").hide();

    windowResize();
    var i = 0;
    var cmdId = setInterval(function () {
        if (!i18nextLoaded) {
            return;
        }

        // 创建指令发送表格
        var fields = [
            {
                title: 'ID',
                width: '30px',
                name: 'objectId',
                className: 'center',
                display: 'CheckBox'
            },
            {
                title: i18next.t("vehicle.name"),
                width: '100px',
                name: 'vehicleName',
                className: 'center',
                display: 'UserDefined',
                render: function (obj) {
                    var data = obj.aData ? obj.aData : obj;
                    return data.vehicleName || data.did;
                }
            },
            {
                title: i18next.t("device.id"),
                width: '100px',
                name: 'did',
                className: 'center',
                display: 'TextBox'
            },
            {
                title: i18next.t("setting.cmd_type"),
                width: '80px',
                name: 'cmdType',
                className: 'center',
                display: 'UserDefined',
                render: function (obj) {
                    return (cmdTypeDesc[obj.aData ? obj.aData.cmdType.toString() : obj.cmdType.toString()]) || i18next.t("setting.unknown");
                }
            },
            {
                title: i18next.t("setting.remark"),
                width: '200px',
                name: 'remark',
                className: '',
                display: 'UserDefined',
                render: function (obj) {
                    return (obj.aData ? obj.aData.remark : obj.remark) || '';
                }
            },
            {
                title: i18next.t("setting.send_type"),
                width: '60px',
                name: 'type',
                className: 'center',
                display: 'UserDefined',
                render: function (obj) {
                    return typeDesc[(obj.aData ? obj.aData.type : obj.type) || 0];
                }
            },
            {
                title: i18next.t("setting.send_status"),
                width: '60px',
                name: 'sendFlag',
                className: 'center',
                display: 'UserDefined',
                render: function (obj) {
                    return sendFlagDesc[obj.aData ? obj.aData.sendFlag : obj.sendFlag];
                }
            },
            {
                title: i18next.t("setting.send_time"),
                width: '100px',
                name: 'createdAt',
                className: 'center',
                display: 'UserDefined',
                render: function (obj) {
                    var createdAt = obj.aData ? new Date(obj.aData.createdAt) : new Date(obj.createdAt);
                    createdAt = createdAt.format('yyyy-MM-dd hh:mm:ss');
                    return createdAt;
                }
            }
        ];
        var buttons = {
            show: false,
            edit: false,
            delete: false
        };
        var uButtons = [
            // {
            //     title: '处理',
            //     className: 'icon-check'
            // }
        ];
        var div = $('#list');
        var uid = $.cookie("dealer_id");
        var query = {
            'uid': uid
        };

        t = new _dataTable(div, '_iotCommand', fields, query, '-createdAt', $('#commandKey'), 'createdAt', buttons, uButtons);
        t.createHeader();
        t.query(null, function () {
            // updateLoc();
        });

        // 初始化目标选择框
        var ts = new vehicleSelector($('#name2'), function (vid, did, name) {
            $('#did2').val(did);
            $('#did').val(did);
            _did = did;
            $('#name').val(name);
            var query = {
                'uid': uid
            };
            if (did !== '') {
                query = {
                    'did': did
                };
            }
            t.query(query, function () {
            }, null);
        });
        ts.init();

        // 初始化用户选择框
        var cs = new customerSelector($('#customer'), function (uid, name) {
            ts.getData(uid, name);
        });
        cs.init();

        $('#commandKey').keydown(function (e) {
            var curKey = e.which;
            if (curKey == 13) {
                var uid = $.cookie("dealer_id");
                var query = {
                    'uid': uid,
                    'did': '^' + this.value
                };
                t.query(query, function () {
                    updateLoc();
                });
                return false;
            }
        });

        $("#deivceSet").click(function () {
            $("#divDeviceSet").dialog("option", "title", i18next.t("setting.device_set"));
            $("#divDeviceSet").dialog("open");
        });

        clearInterval(cmdId);
    },100);
});


