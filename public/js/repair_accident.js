$(document).ready(function () {
    var _user = JSON.parse(sessionStorage.getItem('user'));
    var companyId = $.cookie('dealer_id')
    getDepart()
    console.log(_user, 'user')
    var car_data = [];
    var vehicleId = null;
    var option = {}
    function getDepart() {
        wistorm_api._list('department', { objectId: '>0', uid: companyId }, '', '', '-createdAt', 0, 0, 1, -1, W.getCookie('auth_code'), true, function (dep) {
            console.log(dep, 'depart');
            $('#depart').on('click', function () {
                var depart_data = [];
                dep.data.forEach((ele, index) => {
                    var op = {};
                    if (ele.objectId != 1) {
                        op.label = ele.name;
                        op.value = ele.objectId;
                        depart_data.push(op)
                    }
                })
                _index = depart_data[0].value
                weui.picker(depart_data, {
                    defaultValue: [_index],
                    onChange: function (result) {

                    },
                    onConfirm: function (result) {
                        delete_car();
                        getVehicl(result[0].value)
                        option.DEPT = result[0].value;
                        $('#depart .weui-cell__ft').text(result[0].label);
                        $('#depart .weui-cell__ft').css({ color: '#000' });
                    },
                    id: 'depart'
                });
            });
        })
    }
    function getVehicl(val) {
        wistorm_api._list('vehicle', { departId: val, uid: companyId }, '', '', '-createdAt', 0, 0, 1, -1, W.getCookie('auth_code'), true, function (veh) {
            // console.log(veh)
            veh.data.forEach((ele, index) => {
                var op = {};
                op.label = ele.name
                op.value = ele.objectId;
                car_data.push(op);
            })
            $('#vehicle').on('click', function () {
                car_data.length ?
                    weui.picker(car_data, {
                        onChange: function (result) {
                            console.log(result);
                        },
                        onConfirm: function (result) {
                            vehicleId = result[0].value;
                            option.HPHM = result[0].label;
                            $('#vehicle .weui-cell__ft').text(result[0].label);
                            $('#vehicle .weui-cell__ft').css({ color: '#000' });
                            showVehicleMessage(veh.data, vehicleId)
                        },
                        id: 'vehicle'
                    })
                    :
                    weui.alert('没有目标选择')
                    ;
            });
        })
    }

    function showVehicleMessage(data, index) {
        console.log(data, index)
        var text = data.filter(ele => ele.objectId == index)
        $('#hpzl .hpzltext').text('小型汽车')
        $('#clxh .clxhtext').text(text[0].model)
        // $('#gmrq .gmrqtext').text(W.dateToString(W.date(text[0].buyDate)).slice(0,-8));

        var _date = W.date(text[0].buyDate)
        var _time = _date.getTime();
        var _nowTime = Date.parse(new Date());
        var all_Month = parseInt((_nowTime - _time) / (1000 * 60 * 60 * 24 * 30));
        var _year = _date.getFullYear()
        var _month = _date.getMonth() + 1;
        var _dates = _date.getDate();
        var _gmrq = _year + '-' + _month + '-' + _dates;
        var _synx = '已使用' + ~~(all_Month / 12) + '年';
        console.log(_synx, 'synx')
        $('#gmrq .gmrqtext').html(W.dateToString(W.date(text[0].buyDate)).slice(0, -8) + '<span style="font-size:16px;color:blue">' + _synx + '</span>');
        // $('#syr .syrtext').text('1')
    }

    function delete_car() {
        vehicleId = null;
        $('#select_car .weui-cell__ft').text('请选择');
        $('#select_car .weui-cell__ft').css({ color: '#ccc' });
    }
    $('#cxsj').on('click', function () {
        weui.datePicker({
            start: new Date(),
            end: new Date().getFullYear() + 10,
            defaultValue: [new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate()],
            onChange: function (result) {
                console.log(result);
            },
            onConfirm: function (result) {
                var date = '';
                var val = '';
                result.forEach((ele, index) => {
                    date += ele.label;
                    index < 2 ? val += ele.value + '-' : val += ele.value
                })
                console.log(date);
                option.CXSJ = val;
                // _apply2.option.JCRQ = val
                $('#cxsj .weui-cell__ft').empty();
                $('#cxsj .weui-cell__ft').text(date);
                $('#cxsj .weui-cell__ft').css({ color: '#000' });
                // console.log(result);
            }
        });
    })
    $('#toastBtn').on('click', function () {
        option.CXDD = $('#cxdd').val();
        option.ZRR = $('#zrr').val();
        option.ZRFC = $('#zrfc').val();
        option.PCJE = $('#pcje').val();
        option.RYPCF = $('#rypc').val() || 0;
        option.BZ = $('#bz').val();
        option.USERID = _user.employee.uid
        console.log(option)
        if (!option.DEPT) {
            weui.alert('请选择部门');
            return false
        }
        if (!option.HPHM) {
            weui.alert('请选择号牌号码');
            return false
        }
        if (!option.CXSJ) {
            weui.alert('请选择出险时间');
            return false;
        }
        if (!option.CXDD) {
            weui.alert('请输入出险地点');
            return false;
        }
        if (!option.ZRR) {
            weui.alert('请输入责任人');
            return false;
        }

        if (!option.ZRFC) {
            weui.alert('请输入责任分成');
            return false;
        }
        if (!option.PCJE) {
            weui.alert('请输入赔偿金额');
            return false;
        }
        W.$ajax('mysql_api/create', {
            json_p: option,
            table: 'ga_accident',
        }, function (res) {
            $('#accident', window.parent.document).toggle('slow', function () {
                $('#accident', window.parent.document).empty()
            })
        })
        // console.log(option)
    })


})