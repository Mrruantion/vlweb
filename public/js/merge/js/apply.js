$(document).ready(function () {

    var all_depart;
    var form_option = {};
    var _user = JSON.parse(sessionStorage.getItem('user'));
    var is_kq = null; //是否跨区
    var _val = $('input[name="order"]:checked').val();
    var apend_data = []; //显示的审核人
    var vehicle_people = [];
    var juboss = [];
    var vehicleId = null; //车辆id
    var car_data = [];
    var syrid = null; //使用人id
    var syruid = null;
    var use_reason = ['执法办案', '社会面管理', '重大勤务', '督察检查', '指挥通信', '现场勘查', '押解', '勤务保障', '其他执法执勤']

    form_option.night = _val;
    console.log(_user, 'user')
    var role = {
        9: '民警',
        12: '科所队领导',
        13: '局领导'
    }
    // var apply_estatus = {
    //     '0': '已结束',
    //     '2': '科所队领导审批',
    //     '4': '警务保障室领导审批',
    //     '6': '局领导审批',
    //     '8': '已通过',
    //     'A': '已还车'
    // }
    if (_user.user) {
        form_option.uid = _user.user.objectId;
        form_option.role = role[_user.employee.role];
        form_option.depart = _user.depart.objectId
        $('#user').val(_user.employee.name)

        if (_user.employee.role == '13') {
            $('#borrow').parent().hide();
            $('#night').hide();
            $('#auditer').hide();
            $('#reason').parent().hide();
            $('#address1').hide();
            $('#usershow').hide();
            $('#peershow').hide();
            $('#address').parent().hide();
            $('#address2').parent().show()
        } else {
            $('#borrow').parent().show();
            $('#night').show();
        }

        if (_user.employee.isDriver) {
            $('#jldselectshow').show();
            $('#user').val('');
            $('#driver').val(_user.employee.name)
            departBoss()
        } else {
            if (_user.employee.role != 13) {
                getAudit()
            }
        }

        wistorm_api._list('department', { objectId: '>0', uid: _user.employee.companyId }, '', '', '-createdAt', 0, 0, 1, -1, W.getCookie('auth_code'), true, function (dep) {
            all_depart(dep.data)
        })
        // vehicle_lister()
        GetVehicleCaptain(_user);
    }

    $('#user').on('change', function () {
        console.log(this.value.trim())
        wistorm_api._list('employee', { name: this.value.trim() }, '', '', '-createdAt', 0, 0, 1, -1, W.getCookie('auth_code'), true, function (emp) {
            if (!emp.total) {
                weui.alert('该申请人不存在')
            } else {
                wistorm_api.getUserList({ objectId: emp.data[0].uid }, 'objectId,username,authData,createdAt', '-createdAt', '-createdAt', 0, 0, -1, W.getCookie('auth_code'), function (json) {
                    syrid = json.data[0].username;
                    syruid = json.data[0].objectId;
                })
            }

        })
    })

    function GetVehicleCaptain(user) {
        wistorm_api._list('department', { name: '车队', uid: user.employee.companyId }, '', '', '-createdAt', 0, 0, 1, -1, W.getCookie('auth_code'), true, function (dep) {
            console.log(dep, 'dep')
            wistorm_api._list('employee', { departId: dep.data[0].objectId, role: '12|13' }, '', '', '-createdAt', 0, 0, 1, -1, W.getCookie('auth_code'), true, function (emp) {
                console.log(emp, 'emmp')
                var i = 0;
                emp.data.forEach(ele => {
                    wistorm_api._list('role', { objectId: ele.roleId }, '', '-createdAt', '-createdAt', 0, 0, 1, -1, W.getCookie('auth_code'), false, function (roles) {
                        ele.rolename = roles.data ? roles.data[0].name : '';
                        wistorm_api.getUserList({ objectId: ele.uid }, 'objectId,username,authData,createdAt', '-createdAt', '-createdAt', 0, 0, -1, W.getCookie('auth_code'), function (json) {
                            ele.user = json.data[0];
                            i++;
                            if (i == emp.data.length) {
                                vehicle_people = emp.data;
                                console.log(vehicle_people, 'vehiclecaptaion')
                            }
                        })
                    })
                })
            })
        })
    }
    // function vehicle_lister() {
    //     wistorm_api._list('employee', { departId: 58, role: 12 }, '', '', '-createdAt', 0, 0, 1, -1, W.getCookie('auth_code'), true, function (emp) {
    //         var i = 0;
    //         emp.data.forEach(ele => {
    //             wistorm_api.getUserList({ objectId: emp.data[0].uid }, 'objectId,username,authData,createdAt', '-createdAt', '-createdAt', 0, 0, -1, W.getCookie('auth_code'), function (json) {
    //                 ele.userid = json.data[0].username;
    //                 i++;
    //                 if (i == emp.total) {
    //                     console.log(emp.data)
    //                     vehicle_people = emp.data
    //                 }
    //             })
    //         })
    //     })
    // }

    function departBoss() {
        wistorm_api._list('employee', { departId: 1 }, '', '', '-createdAt', 0, 0, 1, -1, W.getCookie('auth_code'), true, function (emp) {
            var i = 0;
            var j_arr = [];
            emp.data.forEach(ele => {
                wistorm_api.getUserList({ objectId: ele.uid }, 'objectId,username,authData,createdAt', '-createdAt', '-createdAt', 0, 0, -1, W.getCookie('auth_code'), function (json) {
                    // sqrid = json.data[0].username;
                    ele.userid = json.data[0].username;
                    var op_json = { label: ele.name, value: json.data[0].username };
                    j_arr.push(op_json)
                    i++;
                    if (emp.data.length == i) {
                        selectBoss(j_arr, emp.data)
                    }
                })
            })
        })
    }
    function selectBoss(data, all) {
        $('#jldselectshow').on('click', function () {
            weui.picker(data, {
                onConfirm: function (result) {
                    // console.log(result,'boss')
                    $('#jldselectshow .weui-cell__ft').text(result[0].label)
                    $('#jldselectshow .weui-cell__ft').css({ color: '#000' })
                    syrid = result[0].value;
                    form_option.name = result[0].label;
                    var _sqruid = all.filter(ele => ele.userid == syrid);
                    syruid = _sqruid[0].uid
                },
                id: 'jldselectshow'
            });
        });
    }

    //用车单位
    $('#borrow').on('click', function () {
        weui.picker([
            {
                label: '本单位车辆',
                value: '1'
            }, {
                label: '向其他单位借车',
                value: '2'
            }, {
                label: '向车队申请派车',
                value: '3'
            }
        ], {
                defaultValue: ['1'],
                onConfirm: function (result) {
                    // console.log(result);
                    // form_option.borrow = result[0];
                    vehicleId = null;

                    var _v = result[0].value;
                    // form_option.driver = _v;
                    form_option.use_type = _v;
                    _user.employee.isDriver ? '' : $("#driver").val("")
                    delete_depart();
                    delete_car();
                    if (_v == 3) {
                        $('#car_driver').hide();
                        $('#borrow_depart1').hide();
                    } else {
                        _v == 1 ? $('#car_driver').show() : $('#car_driver').hide();
                        _v == 2 ? $('#borrow_depart1').show() : $('#borrow_depart1').hide();
                        _v == 1 ? get_carData(_user.depart.objectId) : null;

                    }
                    $('#borrow .weui-cell__ft').text(result[0].label);
                    $('#borrow .weui-cell__ft').css({ color: '#000' });
                    _v == 2 ? other_depart() : null;
                },
                id: 'borrow'
            });
    });



    function get_carData(depart) {
        wistorm_api._list('vehicle', { departId: depart }, '', '', '-createdAt', 0, 0, 1, -1, W.getCookie('auth_code'), true, function (veh) {
            var i = 0;
            if (veh.data.length) {
                veh.data.forEach(ele => {
                    if (ele.status == 1) { //出车
                        W.$ajax('mysql_api/list', {
                            table: 'ga_apply',
                            json_p: { car_num: ele.name, etm: 0 },
                            sorts: '-id'
                        }, function (res) {
                            ele.apply = res.data[0];
                            if (res.data[0]) {
                                wistorm_api._list('employee', { name: res.data[0].name }, '', '', '-createdAt', 0, 0, 1, -1, W.getCookie('auth_code'), true, function (emp) {
                                    i++;
                                    ele.driverMessage = emp.data[0];
                                    if (i == veh.data.length) {
                                        get_car(veh.data)
                                    }
                                })
                            } else {
                                i++;
                                // ele.driverMessage = emp.data[0];
                                if (i == veh.data.length) {
                                    get_car(veh.data)
                                }
                            }


                        })
                    } else {
                        i++;
                        if (i == veh.data.length) {
                            get_car(veh.data)
                        }
                    }
                })
            } else {
                get_car(veh.data)
            }
        })
        function get_car(res) {
            console.log(res, 'car')
            car_data = [];
            var user_car = [];
            res.forEach((ele, index) => {
                var op = {};
                if (ele.status == 1) {
                    ele.apply && ele.driverMessage ? op.label = ele.name + '(' + ele.apply.name + ele.driverMessage.tel + ')' : ele.apply ? op.label = ele.name + '(' + ele.apply.name + ')' : op.label = ele.name;
                } else {
                    op.label = ele.name
                }
                op.value = ele.objectId;
                car_data.push(op);
                ele.status == 0 ? user_car.push(ele) : null
            })
        }
    }

    //借车单位
    function other_depart() {
        $('#borrow_depart').on('click', function () {
            var depart_data = [];
            var _index = null;
            all_depart.forEach((ele, index) => {
                var op = {};
                if (ele.objectId != 1 && ele.objectId != _user.depart.objectId && ele.name != '车队' && ele.name != '修理厂') {
                    op.label = ele.name;
                    op.value = ele.objectId;
                    depart_data.push(op)
                }
            })
            _index = depart_data[0].value
            weui.picker(depart_data, {
                defaultValue: [_index],
                onConfirm: function (result) {
                    // form_option.depart = result[0].value;
                    delete_car();
                    get_carData(result[0].value);
                    $('#car_driver').show()
                    $('#borrow_depart .weui-cell__ft').text(result[0].label);
                    $('#borrow_depart .weui-cell__ft').css({ color: '#000' });
                    console.log(result, form_option)
                },
                id: 'borrow_depart'
            });
        });
    }

    function delete_car() {
        delete form_option.car_num;
        $('#select_car .weui-cell__ft').text('请选择');
        $('#select_car .weui-cell__ft').css({ color: '#ccc' });
    }

    function delete_depart() {
        // delete form_option.car_num
        $('#borrow_depart .weui-cell__ft').text('请选择');
        $('#borrow_depart .weui-cell__ft').css({ color: '#ccc' });
    }

    $('#select_car').on('click', function () {
        car_data.length ?
            weui.picker(car_data, {
                onChange: function (result) {
                    console.log(result);
                },
                onConfirm: function (result) {
                    // console.log(result);
                    if (result[0].label.indexOf('(') > -1) {
                        weui.alert('车辆正在使用中')
                    } else {
                        form_option.car_num = result[0].label;
                        vehicleId = result[0].value;
                        $('#select_car .weui-cell__ft').text(result[0].label);
                        $('#select_car .weui-cell__ft').css({ color: '#000' });
                    }

                },
                id: 'select_car'
            })
            :
            weui.alert('没有车辆选择')
            ;
    });

    //地址
    W.$ajax('/address', {}, address)
    function address(res) {
        console.log(res, 'address')
        var addr_data = [];
        var provi = [];
        var city = [];
        var addr = [];

        res.forEach((ele, index) => {
            var op = {}
            if (ele.level == 1) {
                op.label = ele.areaName;
                op.value = ele.id;
                provi.push(op);
                addr_data.push(op);
            } else if (ele.level == 2) {
                op.label = ele.areaName;
                op.value = ele.id;
                op.p = ele.parentId
                city.push(op);
            } else {
                op.label = ele.areaName;
                op.value = ele.id;
                op.p = ele.parentId;
                addr.push(op);
            }
        })

        city.forEach((ele, index) => {
            ele.children = [];
            addr.forEach((e, i) => {
                if (ele.value == e.p) {
                    delete e.p;
                    ele.children.push(e);
                }

            })
        })
        provi.forEach((ele, index) => {
            ele.children = [];
            city.forEach((e, i) => {
                if (ele.value == e.p) {
                    delete e.p;
                    ele.children.push(e);
                }
            })
        })
        console.log(provi, city, addr)
        // console.log(addr_data,'addr')
        $('#address').on('click', function () {
            weui.picker(provi, {
                depth: 3,
                defaultValue: [11, 177, 2164],
                onChange: function onChange(result) {
                    console.log(result);
                },
                onConfirm: function onConfirm(result) {
                    result[1].label == '温州市' ? is_kq = false : is_kq = true;
                    var text = result.reduce(function (pre, current) {
                        return pre.label ? pre.label + current.label : pre + current.label
                    })
                    form_option.province = text;
                    // console.log(text)
                    $('#address .weui-cell__ft').text(text);
                    $('#address .weui-cell__ft').css({ color: '#000' });
                    console.log(is_kq, '跨区')
                },
                id: 'address'
            });
        });

    }



    function all_depart(res) {
        console.log(res, 'depart')
        all_depart = res;
        var depart_data = [];
        res.forEach((ele, index) => {
            var op = {};
            op.label = ele.name;
            op.value = ele.objectId;
            depart_data.push(op);
        });
    }


    var op_arr = [];
    for (var i = 0; i < use_reason.length; i++) {
        var op_i = {};
        op_i.label = use_reason[i];
        op_i.value = i + 1;
        op_arr.push(op_i);
    }
    console.log(op_arr)
    $('#reason').on('click', function () {
        weui.picker(op_arr, {
            defaultValue: ['1'],
            onChange: function (result) {
                console.log(result);
            },
            onConfirm: function (result) {
                // console.log(result);
                form_option.days = result[0].label;
                var text = result[0].label;
                $('#reason .weui-cell__ft').text(text);
                $('#reason .weui-cell__ft').css({ color: '#000' })
            },
            id: 'reason'
        });
    });

    $('#user').on('change', function (e) {
        form_option.name = e.target.value;
    })
    $('#peer').on('change', function (e) {
        form_option.peer = e.target.value;
    })
    $('#driver').on('change', function (e) {
        form_option.driver = e.target.value;
    })
    $('#deta_addr').on('change', function (e) {
        form_option.address = e.target.value;
    })


    $('input[name="order"]').on('click', function (e) {
        form_option.night = e.target.value;
        console.log(form_option);
    });
    //局领导的地址
    $('input[name="address2"]').on('click', function (e) {
        console.log(e.target.value)
        form_option.address = e.target.value
    });


    //部门内的审批人
    function getAudit() {
        wistorm_api._list('employee', { departId: _user.depart.objectId, role: 12 }, '', '', '-createdAt', 0, 0, 1, -1, W.getCookie('auth_code'), true, function (emp) {
            console.log(emp, 'emp')
            var i = 0;
            emp.data.forEach(ele => {
                wistorm_api.getUserList({ objectId: ele.uid }, 'objectId,username,authData,createdAt', '-createdAt', '-createdAt', 0, 0, -1, W.getCookie('auth_code'), function (json) {
                    ele.userId = json.data[0].username;
                    i++;
                    if (i == emp.total) {
                        // showaudit(emp.data)
                        console.log(emp.data)
                        showauditer(emp.data)
                    }
                })
            })
        })
    }
    //所有部门的审批人
    function showauditer(data) {
        $('#addauditeres').empty();
        data.forEach((ele, index) => {
            var id = 'auditer_' + index
            var tr_content = `<span>
               <input type="checkbox" id=${id} name="allAuditer" value=${ele.userId} /> <label for=${id} style="position: relative;left: -4px;top: -1px;">${ele.name}</label></span>`
            $('#addauditeres').append(tr_content)
        })
        $('#auditer').show()
    }

    //审批人全选或者不选
    $("#changeselect").click(function () {
        $("input[name='allAuditer']").prop("checked", this.checked);
    });



    $('#toastBtn').on('click', function () {
        var data = [];
        var str = [];
        var select_arr = [];
        form_option.id = 0;
        form_option.cre_tm = ~~(new Date().getTime() / 1000);


        var audit_list = $('input[name="allAuditer"]')
        for (var o in audit_list) {
            audit_list[o].checked ? select_arr.push(audit_list[o].value) : null
        }

        console.log(select_arr)
        debugger;
        if (_user.employee) {
            if (_user.employee.role == 13) { //局领导
                // form_option.driver = 3;
                form_option.depart = _user.employee.departId;
                form_option.uid = _user.employee.uid;
                form_option.name = _user.employee.name;

                // form_option.estatus = 8;
                // form_option.is_sh = 2;
                form_option.role = role[_user.employee.role];
                // form_option.sp_status = 5;
                form_option.address = $('input[name="address2"]:checked').val();
                form_option.use_type = 3;
            } else { //局领导和驾驶员申请除外
                if (_user.employee.isDriver) {
                    // form_option.sp_status = 5;
                    if (!$('#user').val() && !form_option.name) {
                        weui.alert('请填写或选择使用人');
                        return false;
                    } else {
                        form_option.name = form_option.name || $('#user').val()
                    }
                    // form_option.driver = $('#driver').val();
                } else {
                    form_option.name = $('#user').val();
                    form_option.sp_status = 1;
                }
                form_option.driver = $('#driver').val();
                if (!form_option.name) {
                    weui.alert('请输入使用人');
                    return;
                }
                if (!form_option.use_type) {
                    weui.alert('请选择用车');
                    return false;
                } else {
                    if (!form_option.car_num && form_option.use_type != 3) {
                        weui.alert('请选择车辆');
                        return;
                    }
                }
                if (form_option.use_type == 1 || form_option.use_type == 2) {
                    if (!form_option.car_num) {
                        weui.alert('请选择车辆');
                        return;
                    }
                    if (!form_option.driver) {
                        weui.alert('请输入驾驶员');
                        return false;

                    }
                }
                if (!form_option.province) {
                    weui.alert('请选择地址');
                    return;
                }
                if (!form_option.days) {
                    weui.alert('请选择事由');
                    return;
                }

                if (!_user.employee.isDriver) {
                    if (!select_arr.length) {
                        weui.alert('请选择审核人');
                        return false;
                    }
                }


                if (_user.employee.role == 12) {
                    form_option.status = 1;
                    form_option.estatus = 2;

                } else {
                    if (form_option.night > 0 || is_kq) {
                        form_option.status = 3;
                        form_option.estatus = 2;
                    } else {
                        form_option.status = 1;
                        form_option.estatus = 2;
                    }
                }

            }

        }


        var spstatus_json = {
            id: 0,
            status: 1,
            isagree: 0,
            cre_tm: ~~(new Date().getTime() / 1000),
            sp_status: 1
        }
        if (_user.employee.role == 13 || syrid) {
            spstatus_json.status = 3;
            spstatus_json.isagree = 1;
            spstatus_json.uid = syruid ? syruid : _user.employee.uid;
            spstatus_json.sp_status = 5 //直接通过
            // form_option.estatus = 8;
            form_option.sp_status = 5 //直接通过
            form_option.is_sh = 2;
            form_option.status = 1;
            form_option.estatus = syrid ? 9 : 8
        }
        debugger;

        W.$ajax('mysql_api/create', {
            table: 'ga_apply',
            json_p: form_option,
        }, function (res) {
            console.log(res, 'res')
            spstatus_json.apply_id = res.id;
            W.$ajax('mysql_api/create', {
                table: 'ga_spstatus',
                json_p: spstatus_json,
            }, function (spst) {
                debugger;
                if (vehicleId) {
                    wistorm_api._update('vehicle', { objectId: vehicleId }, { status: 1 }, W.getCookie('auth_code'), true, function (veh) {
                        weui.alert('提交成功', function () {

                            if (_user.employee.role == 13) { //推送给车队队长
                                var i = 0;
                                vehicle_people.forEach(ele => {
                                    sendmessage(res.id, ele.user.username, form_option.name, '用车', 3, '', function () {
                                        i++;
                                        if (vehicle_people.length == i) {
                                            applyHide()
                                        }

                                    })
                                })
                            } else if (_user.employee.isDriver) {
                                var tel = _user.employee.name + '(' + _user.employee.tel + ')'
                                sendmessage(res.id, syrid, form_option.name, '用车', 1, tel, function () {
                                    applyHide()
                                })
                            } else {
                                var i = 0;
                                select_arr.forEach(ele => {
                                    sendmessage(res.id, ele, form_option.name, '用车', 2, '', function () {
                                        i++;
                                        if (i == select_arr.length) {
                                            applyHide()
                                        }
                                    })
                                })
                            }

                        });
                    });
                } else {
                    weui.alert('提交成功', function () {
                        if (_user.employee.role == 13) { //推送给车队队长
                            // sendmessage(res.id, vehicle_people[0].userid, form_option.name, '用车', 3, '', function () {
                            //     applyHide()
                            // })
                            var i = 0;
                            vehicle_people.forEach(ele => {
                                sendmessage(res.id, ele.user.username, form_option.name, '用车', 3, '', function () {
                                    i++;
                                    if (vehicle_people.length == i) {
                                        applyHide()
                                    }
                                })
                            })
                        } else if (_user.employee.isDriver) {
                            // var tel = _user.employee.name + '(' + _user.employee.tel + ')'
                            var tel = _user.employee.name + '(' + _user.employee.tel + (_user.employee.wechat ? '(' + _user.employee.wechat + ')' : '') + ')'
                            sendmessage(res.id, syrid, form_option.name, '用车', 1, tel, function () {
                                applyHide()
                            })
                        } else {
                            var i = 0;
                            select_arr.forEach(ele => {
                                sendmessage(res.id, ele, form_option.name, '用车', 2, '', function () {
                                    i++;
                                    if (i == select_arr.length) {
                                        applyHide()
                                    }
                                })
                            })
                        }
                    });
                }
            })
        })
    });

    function applyHide() {
        $('#pc_apply', window.parent.document).toggle('slow', function () {
            $('#pc_apply', window.parent.document).empty()
        })
    }
    function sendmessage(id, userid, username, title, type, tel, callback) {
        var titles = title || '用车申请'
        var str = 'http://jct.chease.cn' + '/my_list?applyid=' + id;
        if (type == 1) { //提交
            str += '&my=true'
        } else if (type == 2) { //审核
            str += '&auditing=true'
        } else if (type == 3) { //车队
            str += '&vehiclesend=true'
        }
        str += '&userid=' + userid
        var _desc = username + '的' + titles
        if (tel) {
            _desc += '\n驾驶员' + tel
        }
        var _op_data = { touser: userid, title: titles, desc: _desc, url: str, remark: "查看详情" };
        $.ajax({
            url: 'http://h5.bibibaba.cn/send_qywx.php',
            data: _op_data,
            dataType: 'jsonp',
            crossDomain: true,
            success: function (re) {
                callback()
            },
            error: function (err) {
                // console.log(err)
                callback()

            }
        })
    }


});