// "use strict";
$(document).ready(function () {

    // $('#dialogDiv').dialog("close")
    // $('.start_time').on('click',function() {
    //     // console.log(1)
    //     // console.log($('#dialogDiv').dialog)
    //     $('#dialogDiv').dialog()
    // })
    console.log(defalut)

    var _g = W.getSearch();
    var userid = $.cookie('username');
    var companyId = $.cookie('dealer_id')
    var _user1 = {};
    var pageSize = 10, pagenum = 1;
    // var type = 1; //1已提交/2已审核/3未审核
    var type = 0 //0我的提交记录、1科所队审批、2警务保障室领导、3局领导审批、4、车队审批、5用车查询、6用车记录删除
    var query_json = {};
    var features = []; //显示的列表
    var sp_status = defalut.use.status;

    getUser(); //获取用户信息

    // getUser();
    function getUser() {
        wistorm_api.getUserList({ username: userid }, '', '-createdAt', '-createdAt', 0, 0, -1, W.getCookie('auth_code'), function (json) {
            // debugger;
            if (json.data[0]) {
                _user1.user = json.data[0];
                wistorm_api._list('employee', { uid: _user1.user.objectId }, '', '', '-createdAt', 0, 0, 1, -1, W.getCookie('auth_code'), true, function (emp) {
                    _user1.employee = emp.data[0];
                    if (emp.data[0]) {
                        if (emp.data[0].roleId) {
                            wistorm_api._list('role', { objectId: emp.data[0].roleId }, '', '-createdAt', '-createdAt', 0, 0, 1, -1, W.getCookie('auth_code'), false, function (roles) {
                                // console.log(roles)
                                _user1.employee.rolename = roles.data[0] ? roles.data[0].name : null;
                                wistorm_api._list('department', { objectId: _user1.employee.departId }, '', '', '-createdAt', 0, 0, 1, -1, W.getCookie('auth_code'), true, function (dep) {
                                    _user1.depart = dep.data[0];
                                    // debugger;
                                    mainContral(_user1)
                                })
                            })
                        } else {
                            wistorm_api._list('department', { objectId: _user1.employee.departId }, '', '', '-createdAt', 0, 0, 1, -1, W.getCookie('auth_code'), true, function (dep) {
                                _user1.depart = dep.data[0];
                                mainContral(_user1)
                            })
                        }
                    } else {
                        mainContral(_user1)
                    }
                })
            }
        })
    }

    function mainContral(user) {
        // console.log(user);
        sessionStorage.setItem('user', JSON.stringify(user))
        getFeatures(); //获取用户显示页面
        GetDEPT(user)
    }


    function getFeatures() {
        $.ajax({
            url: '/getPage',
            success: function (res) {
                features = res.features.filter(ele => ele.pageId == 829901050789108700);
                showPage(features)
            }
        })
    }

    function showPage(data) {
        console.log(data)
        data.forEach(ele => {
            $('#' + ele.key).show().children().text(ele.name);
            // $('#' + ele.key +' a').text(ele.name)
            if (ele.key == 'first_approval' || ele.key == 'second_approval' || ele.key == 'third_approval' || ele.key == 'vehicleTeam_approval') {
                $('#useFlow').show()
            }
            if (ele.key == 'useRecordQuery' || ele.key == 'recordDelete') {
                $('#queryFlow').show();
            }
        })

        var allButton = ['myApplyRecord', 'first_approval', 'second_approval', 'third_approval', 'vehicleTeam_approval', 'useRecordQuery', 'recordDelete']
        for (var i = 0; i < data.length; i++) {
            if (allButton.indexOf(data[i].key) > -1) {
                // debugger;
                type = allButton.indexOf(data[i].key);
                break;
            }
        }
        // debugger;
        type = parseInt(W.getCookie('types')) || type;
        pagenum = parseInt(W.getCookie('pagenum')) || pagenum;
        autoGet(type);
        W.setCookie('types', '');
        W.setCookie('pagenum', '');
    }

    function autoGet(type) {
        switch (type) {
            case 0:
                myPushFun();
                break;
            case 1:
                first_approvalFun();
                break;
            case 2:
                second_approvalFun();
                break;
            case 3:
                third_approvalFun();
                break;
            case 4:
                vehicleTeam_approvalFun();
                break;
            case 5:
                useRecordQueryFun();
                break;
            case 6:
                useRecordQueryFun();
                break;
            default:
                break;
        }
    }

    $('#first_approval').on('click', function () {
        type = 1;
        pagenum = 1;
        console.log('科所队审批');
        first_approvalFun()
    })
    $('#second_approval').on('click', function () {
        type = 2;
        pagenum = 1;
        console.log('警务保障室领导审批');
        second_approvalFun()
    })
    $('#third_approval').on('click', function () {
        type = 3;
        pagenum = 1;
        console.log('局领导审批');
        third_approvalFun();
    })
    $('#vehicleTeam_approval').on('click', function () {
        type = 4;
        pagenum = 1;
        console.log('车队审批');
        vehicleTeam_approvalFun();
    })

    $('#myApplyRecord').on('click', function () {
        console.log('我的申请记录');
        type = 0;
        pagenum = 1;
        myPushFun();
    })
    $('#useVehicleApply').on('click', function () {
        console.log('用车申请')
        $('#pc_apply').toggle('normal', function () {
            toggle_Apply()
        })
    })

    $('#useRecordQuery').on('click', function () {
        console.log('用车查询')
        type = 5;
        pagenum = 1;
        useRecordQueryFun()
    })

    $('#recordDelete').on('click', function () {
        console.log('用车记录删除')
        type = 6;
        pagenum = 1;
        useRecordQueryFun()
    })


    //切换用车申请
    function toggle_Apply() {
        var _child = $('#pc_apply')[0].children;
        if (_child.length == 0) {
            $('#pc_apply').append(`
                    <div style="height:9%;background:#fafafa">
                        <span style="display:inline-block;height:100%;width:20%;position: relative;" id="back_apply">
                            <i class="iconfont icon-fanhui apply_back"></i>
                        </span>
                    </div>
                    <iframe frameborder=0 width="100%" height="91%" marginheight=0 marginwidth=0 scrolling=no src="/usecar_apply"></iframe>
                `)
            $('#back_apply').on('click', function () {
                $('#pc_apply').toggle('normal', function () {
                    toggle_Apply()
                })
            })
        } else {
            $('#pc_apply').empty()
        }
    }

    function myPushFun() {
        var query_json = { uid: '>0' }
        init_show()
        GetList(query_json)
    }

    function first_approvalFun() {
        var query_json = { sp_status: 1, estatus: 2 }
        init_show()
        GetList(query_json)
    }
    function second_approvalFun() {
        var query_json = { sp_status: 1, estatus: 4 }
        init_show()
        GetList(query_json)
    }
    function third_approvalFun() {
        var query_json = { sp_status: 1, estatus: 6 }
        init_show()
        GetList(query_json)
    }
    function vehicleTeam_approvalFun() {
        var query_json = { sp_status: 5, estatus: '8|9' }
        init_show()
        GetList(query_json)
    }

    function useRecordQueryFun() {
        var query_json = {}
        var name = $('#usename').val();
        var car_num = $('#cph').val();
        var depart = $('#select_depart').val();
        var cre_tm = $('#start_time').val();
        var etm = $('#end_time').val();
        var sp_status = $('#use_status').val();
        name ? query_json.name = name : null;
        car_num ? query_json.car_num = car_num : null;
        query_json.depart = depart ? depart : '>0|0';
        query_json.cre_tm = cre_tm ? ('>' + ~~(new Date(cre_tm).getTime() / 1000)) : '>0|0';
        query_json.etm = etm ? ('>' + ~~(new Date(etm).getTime() / 1000)) : '>0|0';
        query_json.sp_status = sp_status ? sp_status : '>0|0'
        console.log(query_json)
        init_show(true)
        GetList(query_json)
    }

    // function recordDeleteFun() {
    //     var query_json = {}
    //     init_show(true)
    //     GetList(query_json)
    // }


    function init_show(type) {
        if (type) {
            $('#statastic_query').show()
            $('#table_scroll')[0].style.height = window.innerHeight - 240 + 'px';
        } else {
            $('#statastic_query').hide()
            $('#table_scroll')[0].style.height = window.innerHeight - 200 + 'px';
        }
    }

    function GetList(json) {
        console.log(json)
        W.$ajax('mysql_api/list', {
            json_p: json,
            table: 'ga_apply',
            sorts: '-id',
            limit: pageSize,
            pageno: pagenum
        }, function (res) {
            if (res.data.length) {
                var i = 0;
                res.data.forEach(ele => {
                    W.$ajax('mysql_api/list', {
                        json_p: { apply_id: ele.id },
                        table: 'ga_spstatus',
                        sorts: 'status',
                    }, function (res1) {
                        console.log(res1, 'res')
                        ele.spstatus = res1.data
                        i++;
                        if (i == res.data.length) {
                            res.totalPage = ~~(res.total / pageSize);
                            res.total % pageSize > 0 ? res.totalPage += 1 : null;
                            Paging(res, type);
                            showList(res)
                        }
                    })
                })
            } else {
                $('#table_info').empty();
                $('#table_info').append(` <tr ><td colspan="11" style="text-align:center">没有数据！</td></tr>`)
                $('#page').text('')
            }
        })
    }

    //显示列表
    function showList(data) {
        $('#table_info').empty();
        data.data.forEach((ele, index) => {
            var eleValue = ele;
            if (eleValue.name) {
                var _href = './usecar_detail?applyid=' + eleValue.id;
                switch (type) {
                    case 0:
                        _href += '&my=' + true
                        break;
                    case 1:
                    case 2:
                    case 3:
                        _href += '&auditing=' + true;
                        break;
                    case 4:
                        _href += '&vehicleManage=' + true;
                        break;
                    case 5:
                        _href += '&query=' + true;
                        break;
                    case 6:
                        _href += '&delete=' + true;
                        break;
                    default:
                        break;
                }
                _href += '&type=' + type

                // var _status = 0;
                var name = eleValue.name
                var use_status = sp_status[eleValue.sp_status || 6]

                // _status == 1 ? use_status = '已通过' : _status == 2 ? use_status = '已还车' : _status == 3 ? use_status = '驳回' : _status == 4 ? use_status = '已撤销' : use_status = '审核中';
                // _status == 1 ? color_status = '' : _status == 2 ? color_status = '' : _status == 3 ? color_status = 'no_agree' : _status == 4 ? color_status = 'back' : color_status = 'auditing';
                var date = W.dateToString(new Date(parseInt(eleValue.cre_tm) * 1000))

                var tr_content = `
                    <tr class="">
                        <td> ${eleValue.id}</td>
                        <td> ${eleValue.days || ''}</td>
                        <td>${eleValue.name}</td>
                        <td>${eleValue.peer || ''}</td>
                        <td>${eleValue.province || ''} </td>
                        <td>${eleValue.address || ''}</td>
                        <td>${eleValue.night ? '是' : '否'}</td>
                        <td>${eleValue.car_num || ''}</td>
                        <td>${eleValue.driver || ''}</td>
                        <td>${use_status}</td>
                        <td><a href=${_href}>详情</a></td>
                    </tr>`
                $('#table_info').append(tr_content)
            }
        })
    }
    //分页
    function Paging(data, type) {
        $("#page").paging({
            pageNo: pagenum,
            totalPage: data.totalPage,
            totalSize: data.total,
            callback: function (num) {
                // alert(num)
                pagenum = num;
                W.setCookie('pagenum', pagenum)
                autoGet(type)
            }
        })
    }



    //查询按钮
    $('#query_button').on('click', function () {
        useRecordQueryFun()
    })

    //查询的部门选择列表
    function GetDEPT(_user) {
        $('#select_depart').empty();
        // debugger;
        var query_json = { uid: companyId }
        if (_user.depart) {
            query_json.objectId = _user.depart.objectId == 1 ? '>0' : _user.depart.objectId

            _user.depart.objectId == 1 ? $('#select_depart').append('<option value=">0">所有</option>') : null;
        } else {
            query_json.objectId = '>0';
            $('#select_depart').append('<option value=">0">所有</option>')
        }
        // debugger;
        wistorm_api._list('department', query_json, '', '', '-createdAt', 0, 0, 1, -1, W.getCookie('auth_code'), true, function (dep) {
            console.log(dep, 'query.depart');
            dep.data.forEach(ele => {
                var option = `<option value=${ele.objectId}>${ele.name}</option>`;
                $('#select_depart').append(option);
            })
        })
    }











    $('#add_j').on('click', function () {
        var pre = $('#cph').val();
        pre += '警';
        $('#cph').val(pre)
        W.set_text_value_position('cph', -1);
    })
    $('#cph').on('focus', function (e) {
        var _pre = $('#cph').val();
        if (_pre.indexOf('浙C') == -1) {
            $('#cph').val('浙C')
            W.set_text_value_position('cph', -1);
            e.stopPropagation()
        }
    })

    $('#selectid').on('change', function (e) {
        // console.log(e)
        // console.log(this.selectedIndex)
        console.log(this.value);
    })


    $('#Toggle_apply').on('click', function () {
        $('#pc_apply').toggle('normal', function () {
            toggle_Apply()
        })
    })

    function toggle_Apply() {
        var _child = $('#pc_apply')[0].children;
        if (_child.length == 0) {
            $('#pc_apply').append(`
                    <div style="height:40px;background:#fafafa;border-bottom:1px solid #ccc">
                        <span style="display:inline-block;height:100%;width:20%;position: relative;" id="back_apply">
                            <i class="iconfont icon-fanhui apply_back"></i>
                        </span>
                    </div>
                    <iframe frameborder=0 width="100%" height="91%" marginheight=0 marginwidth=0 scrolling=no src="/usecar_apply"></iframe>
                    `
            )
            $('#back_apply').on('click', function () {
                $('#pc_apply').toggle('normal', function () {
                    // console.log($('#pc_apply'), 'dd')
                    toggle_Apply()
                })
            })
        } else {
            $('#pc_apply').empty()
        }
    }




    $('.start_time').datetimepicker({
        language: $.cookie("lang"),
        weekStart: 1,
        todayBtn: 1,
        autoclose: 1,
        todayHighlight: 1,
        startView: 2,
        forceParse: 0,
        showMeridian: 1,
        minView: 2
    });
    // $('#start_time').val(new Date().format('yyyy-MM-dd'));
    $('.end_time').datetimepicker({
        language: $.cookie("lang"),
        weekStart: 1,
        todayBtn: 1,
        autoclose: 1,
        todayHighlight: 1,
        startView: 2,
        forceParse: 0,
        showMeridian: 1,
        minView: 2
    });
    // $('#end_time').val(new Date().format('yyyy-MM-dd'));


    // var init_query = function () {
    //     _department(_user1)
    // }

    // var _department = function (_user) {

    // }
    // var 

    // var f_query_json = function () {
    //     // query_json.
    // }


    var statastic_query = function (json) {
        W.$ajax('mysql_api/list', {
            json_p: json,
            table: 'ga_apply',
            sorts: '-id',
            limit: pageSize,
            pageno: pagenum
        }, function (res) {
            // console.log(res)
            if (res.data.length) {
                var i = 0;
                res.data.forEach(ele => {
                    W.$ajax('mysql_api/list', {
                        json_p: { apply_id: ele.id },
                        table: 'ga_spstatus',
                        sorts: 'status',
                    }, function (res1) {
                        ele.spstatus = res1.data
                        i++;
                        if (i == res.data.length) {
                            res.totalPage = ~~(res.total / pageSize);
                            res.total % pageSize > 0 ? res.totalPage += 1 : null;
                            getPage(res);
                            apply_table(res)
                            // console.log(res)
                        }
                    })
                })
            } else {
                $('#table_info').empty();
                $('#table_info').append(` <tr ><td colspan="11" style="text-align:center">没有数据！</td></tr>`)
                $('#page').text('')
            }
        })
    }




    //已提交列表
    function getVehicleApply(data) {
        W.$ajax('mysql_api/list', {
            json_p: { uid: data.employee ? data.employee.uid : '' },
            table: 'ga_apply',
            sorts: '-id',
            limit: pageSize,
            pageno: pagenum
        }, function (res) {
            // console.log(res)
            if (res.data.length) {
                var i = 0;
                res.data.forEach(ele => {
                    W.$ajax('mysql_api/list', {
                        json_p: { apply_id: ele.id },
                        table: 'ga_spstatus',
                        sorts: 'status',
                    }, function (res1) {
                        ele.spstatus = res1.data
                        i++;
                        if (i == res.data.length) {
                            res.totalPage = ~~(res.total / pageSize);
                            res.total % pageSize > 0 ? res.totalPage += 1 : null;
                            getPage(res);
                            apply_table(res)
                            console.log(res)
                        }
                    })
                })
            } else {
                $('#table_info').empty();
                $('#table_info').append(` <tr ><td colspan="11" style="text-align:center">没有数据！</td></tr>`)
                $('#page').text('')
            }
        })
    }
    //已审核列表
    function get_audited(data) {
        console.log(data, 'yishenhe')
        var option = { uid: data.employee.uid, apply_id: '>0', sp_status: '0|4|5|6' };
        getAuditList(option)
    }
    //未审核列表
    function get_auditing(data) {
        console.log(data, 'weishenhe')
        var option = { uid: data.employee.uid, apply_id: '>0', sp_status: '1' };
        getAuditList(option)
    }
    function getAuditList(option) {
        W.$ajax('mysql_api/list', {
            json_p: option,
            table: 'ga_spstatus',
            limit: pageSize,
            pageno: pagenum,
            sorts: '-id'
        }, function (res) {
            if (res.total) {
                var i = 0;
                res.data.forEach(ele => {
                    W.$ajax('mysql_api/list', {
                        table: 'ga_apply',
                        json_p: { id: ele.apply_id }
                    }, function (res1) {
                        ele.apply = res1.data
                        W.$ajax('mysql_api/list', {
                            json_p: { apply_id: ele.apply_id },
                            table: 'ga_spstatus',
                            sorts: 'status'
                        }, function (res2) {
                            i++;
                            if (ele.apply[0]) ele.apply[0].spstatus = res2.data;
                            if (i == res.data.length) {
                                console.log(res)
                                res.totalPage = ~~(res.total / pageSize);
                                res.total % pageSize > 0 ? res.totalPage += 1 : null;
                                getPage(res);
                                apply_table(res)
                            }
                        })
                    })
                })
            } else {
                $('#table_info').empty();
                $('#table_info').append(` <tr ><td colspan="11" style="text-align:center">没有数据！</td></tr>`)
                $('#page').text('')
            }
        })
    }
    //车队派车列表
    function getdriver() {
        W.$ajax('mysql_api/list', {
            json_p: { dirver: 3, estatus: 8 },
            table: 'ga_apply',
            sorts: '-id',
            limit: pageSize,
            pageno: pagenum
        }, function (res) {
            if (res.total) {
                var i = 0;
                res.data.forEach(ele => {
                    W.$ajax('mysql_api/list', {
                        json_p: { apply_id: ele.id },
                        table: 'ga_spstatus',
                        sorts: 'status'
                    }, function (res1) {
                        i++;
                        ele.spstatus = res1.data
                        if (i == res.data.length) {
                            console.log(res)
                            res.totalPage = ~~(res.total / pageSize);
                            res.total % pageSize > 0 ? res.totalPage += 1 : null;
                            getPage(res);
                            apply_table(res)
                        }
                    })
                })
            } else {
                $('#table_info').empty();
                $('#table_info').append(` <tr ><td colspan="11" style="text-align:center">没有数据！</td></tr>`)
                $('#page').text('')
            }

        })
    }
    //还车列表
    function get_backed(data) {
        wistorm_api._list('vehicle', { status: 1, uid: data.employee.companyId, departId: data.depart.objectId }, '', '', '-createdAt', 0, 0, 1, -1, $.cookie('auth_code'), true, function (veh) {
            if (veh.total) {
                var i = 0;
                veh.data.forEach(ele => {
                    W.$ajax('mysql_api/list', {
                        json_p: { car_num: ele.name, estatus: 8 },
                        table: 'ga_apply'
                    }, function (res) {
                        if (res.total) {
                            ele.apply = res.data
                            W.$ajax('mysql_api/list', {
                                json_p: { apply_id: res.data[0].id },
                                table: 'ga_spstatus'
                            }, function (res1) {
                                ele.apply[0].spstatus = res1.data;
                                i++;
                                if (i == veh.total) {
                                    apply_table(veh)
                                }
                            })
                        } else {
                            i++;
                            if (i == veh.total) {
                                apply_table(veh)
                            }
                        }

                    })
                })
            } else {
                $('#table_info').empty();
                $('#table_info').append(` <tr ><td colspan="11" style="text-align:center">没有数据！</td></tr>`)
                $('#page').text('')
            }

        })
    }

    //显示列表
    function apply_table(data) {
        $('#table_info').empty();
        data.data.forEach((ele, index) => {
            var eleValue = ele;
            if (ele.apply) {
                ele.apply[0] ? eleValue = ele.apply[0] : null
            }
            if (eleValue.name) {
                var _href = './usecar_detail?applyid=' + eleValue.id;
                // var _href/
                if (type == 1) {
                    _href += '&my=' + true;
                } else if (type == 2) {
                    _href += '&audited=' + true;
                } else if (type == 3) {
                    _href += '&auditing=' + true
                } else if (type == 4) { //派车
                    _href += '&give_car=' + true
                } else if (type == 5) {
                    _href += '&backing_car=' + true
                }
                var _status = 0;
                var name = eleValue.name
                console.log(index)
                if (eleValue.spstatus.length == 1) {
                    if (eleValue.spstatus[0].isagree == 1) {
                        _status = 1;
                        if (eleValue.etm) {
                            _status = 2;
                        }
                    } else {
                        _status = 0;
                    }
                    if (eleValue.spstatus[0].isagree == 2) {
                        _status = 3;
                    }
                    if (!eleValue.spstatus[0].isagree && eleValue.etm > 0) {
                        _status = 4;
                    }
                } else if (eleValue.spstatus.length == 3) {
                    if (eleValue.spstatus[0].isagree == 1 && eleValue.spstatus[1].isagree == 1 && eleValue.spstatus[2].isagree == 1) {
                        _status = 1;
                        if (eleValue.etm) {
                            _status = 2;
                        }
                    } else {
                        _status = 0;
                    }

                    if (eleValue.spstatus[0].isagree == 2 || eleValue.spstatus[1].isagree == 2 || eleValue.spstatus[2].isagree == 2) {
                        _status = 3;
                    }
                    if ((!eleValue.spstatus[0].isagree || !eleValue.spstatus[1].isagree || !eleValue.spstatus[2].isagree) && eleValue.etm > 0) {
                        _status = 4;
                    }
                }
                var use_status = '';
                // var color_status = '';
                _status == 1 ? use_status = '已通过' : _status == 2 ? use_status = '已还车' : _status == 3 ? use_status = '驳回' : _status == 4 ? use_status = '已撤销' : use_status = '审核中';
                // _status == 1 ? color_status = '' : _status == 2 ? color_status = '' : _status == 3 ? color_status = 'no_agree' : _status == 4 ? color_status = 'back' : color_status = 'auditing';
                var date = W.dateToString(new Date(parseInt(eleValue.cre_tm) * 1000))

                var tr_content = `<tr class="">
                    <td> ${index}</td>
                    <td> ${eleValue.days}</td>
                    <td>${eleValue.name}</td>
                    <td>${eleValue.peer}</td>
                    <td>${eleValue.province} </td>
                    <td>${eleValue.address || ''}</td>
                    <td>${eleValue.night ? '是' : '否'}</td>
                    <td>${eleValue.car_num}</td>
                    <td>${eleValue.driver}</td>
                    <td>${use_status}</td>
                    <td><a href=${_href}>详情</a></td>
                </tr>`
                $('#table_info').append(tr_content)
            }
        })
    }

    //分页
    function getPage(data) {
        $("#page").paging({
            pageNo: pagenum,
            totalPage: data.totalPage,
            totalSize: data.total,
            callback: function (num) {
                // alert(num)
                pagenum = num;
                if (type == 1) {
                    getVehicleApply(_user1)
                } else if (type == 2) {
                    get_audited(_user1)
                } else if (type == 3) {
                    get_auditing(_user1)
                }

            }
        })
    }
    //已提交
    $('#ytj').on('click', function () {
        pagenum = 1;
        type = 1;
        getVehicleApply(_user1)
    })
    //已审核
    $('#ysh').on('click', function () {
        pagenum = 1;
        type = 2
        get_audited(_user1)
    })
    //未审核
    $('#wsh').on('click', function () {
        pagenum = 1;
        type = 3;
        get_auditing(_user1)
    })
    //车队派车
    $('#cdpc').on('click', function () {
        pagenum = 1;
        type = 4;
        getdriver();
    })
    //车队还车
    $('#cdhc').on('click', function () {
        pagenum = 1;
        type = 5;
        get_backed(_user1)
    })





})