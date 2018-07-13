$(document).ready(function () {

    var _g = W.getSearch();
    // console.log(defalut, 'default')
    var _userid = $.cookie('username');
    var companyId = $.cookie('dealer_id');
    var pageSize = 10, pagenum = 1;
    // var type = 1; //1已提交2已审核3未审核4科所队审批5警务保障室审批6局领导审批7专管员审批
    var type = 0; //0、我的维修记录、1科所队、2警务保障室、3局领导、4专管员、5报销、6维保记录、7事故查询、8维保记录删除、
    var _user = {};
    var lc = defalut.repair.LC;
    var wx = defalut.repair._wx;
    var app_state = defalut.repair.STATE;
    var _HPZL = defalut.repair._HPZL;
    // var lc = {
    //     1: '维修申请',
    //     2: '科所队领导审批',
    //     3: '专管员审批',
    //     4: '警务保障室领导审批',
    //     6: '局领导审批',
    //     9: '维修信息录入',
    //     0: '待报销',
    //     'A': '已结束'
    // }
    // var wx = {
    //     A: '发动机',
    //     B: '地盘',
    //     C: '电路',
    //     D: '轮胎',
    //     E: '外壳',
    //     Z: '其他',
    // }
    // var app_state = {
    //     0: '撤销',
    //     1: '审批中',
    //     3: '明细录入',
    //     4: '审批驳回',
    //     5: '待报销',
    //     6: '已结束'
    // }
    // var _HPZL = {
    //     '01': '大型汽车',
    //     '02': '小型汽车'
    // }
    getUser();
    function getUser() {
        wistorm_api.getUserList({ username: _userid }, '', '-createdAt', '-createdAt', 0, 0, -1, W.getCookie('auth_code'), function (json) {
            // debugger;
            if (json.data[0]) {
                _user.user = json.data[0];
                wistorm_api._list('employee', { uid: _user.user.objectId }, '', '', '-createdAt', 0, 0, 1, -1, W.getCookie('auth_code'), true, function (emp) {
                    _user.employee = emp.data[0];
                    if (emp.data[0]) {
                        if (emp.data[0].roleId) {
                            wistorm_api._list('role', { objectId: emp.data[0].roleId }, '', '-createdAt', '-createdAt', 0, 0, 1, -1, W.getCookie('auth_code'), false, function (roles) {
                                // console.log(roles)
                                _user.employee.rolename = roles.data[0] ? roles.data[0].name : null;
                                wistorm_api._list('department', { objectId: _user.employee.departId }, '', '', '-createdAt', 0, 0, 1, -1, W.getCookie('auth_code'), true, function (dep) {
                                    _user.depart = dep.data[0];
                                    debugger;
                                    mainContral(_user)
                                })
                            })
                        } else {
                            wistorm_api._list('department', { objectId: _user.employee.departId }, '', '', '-createdAt', 0, 0, 1, -1, W.getCookie('auth_code'), true, function (dep) {
                                _user.depart = dep.data[0];
                                mainContral(_user)
                            })
                        }
                    } else {
                        mainContral(_user)
                    }
                })
            }
        })
    }
    var mainContral = function (user) {
        console.log(user);
        sessionStorage.setItem('user', JSON.stringify(user))
        GetDEPT(user, getFeatures) //获取查询的单位
        // getFeatures(); //获取用户显示页面

    }

    // getFeatures(); //获取用户显示页面
    // getUser(); //获取用户信息
    function getFeatures() {
        $.ajax({
            url: '/getPage',
            success: function (res) {
                features = res.features.filter(ele => ele.pageId == 829901050789109800);
                showPage(features)
            }
        })
    }
    function showPage(data) {
        data.forEach(ele => {
            $('#' + ele.key).show().children().text(ele.name);
            // $('#' + ele.key +' a').text(ele.name)
            if (ele.key == 'first_approval' || ele.key == 'second_approval' || ele.key == 'third_approval' || ele.key == 'incharge_approval' || ele.key == 'financial_approval') {
                $('#fixFlow').show()
            }
            if (ele.key == 'repairRecordQuery' || ele.key == 'accidentRecordQuery' || ele.key == 'recordDelete') {
                $('#queryFlow').show();
            }
        })

        var allButton = ['myRecord', 'first_approval', 'second_approval', 'third_approval', 'incharge_approval', 'financial_approval', 'repairRecordQuery', 'accidentRecordQuery', 'recordDelete']
        for (var i = 0; i < data.length; i++) {
            if (allButton.indexOf(data[i].key) > -1) {
                // debugger;
                type = allButton.indexOf(data[i].key);
                break;
            }
        }
        debugger;
        type = parseInt(W.getCookie('types')) || type;
        pagenum = parseInt(W.getCookie('pagenum')) || 1;
        autoGet(type);
        W.setCookie('types', '');
        W.setCookie('pagenum', '')
        // console.log(type)
        // $('#fixFlow').show()
        // $('#first_approval').show();
        // $('#second_approval').show();
        // $('#third_approval').show();
        // $('#incharge_approval').show();
        // $('#financial_approval').show();

        // $('#queryFlow').show();
        // $('#repairRecordQuery').show();
        // $('#accidentRecordQuery').show();
        // $('#recordDelete').show();
        // $('#repair_apply').show();
        // $('#myRecord').show();
        // $('#accident_apply').show();
        // console.log(data)
    }

    function autoGet(type) {
        switch (type) {
            case 0:
                myRecordFun();
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
                incharge_approvalFun();
                break;
            case 5:
                financial_approvalFun();
                break;
            case 6:
                repairRecordQueryFun();
                break;
            case 7:
                accidentRecordQueryFun();
                break;
            case 8:
                repairRecordQueryFun();
                break;
            default:
                break;
        }
    }


    $('#first_approval').on('click', function () {
        console.log('科所队审批');
        type = 1;
        pagenum = 1;
        first_approvalFun();
    })

    $('#second_approval').on('click', function () {
        console.log('警务保障室领导');
        type = 2;
        pagenum = 1;
        second_approvalFun();
    })
    $('#third_approval').on('click', function () {
        console.log('局领导审批');
        type = 3;
        pagenum = 1;
        third_approvalFun();
    })
    $('#incharge_approval').on('click', function () {
        console.log('专管员审批');
        type = 4;
        pagenum = 1;
        incharge_approvalFun();
    })
    $('#financial_approval').on('click', function () {
        console.log('报销审批');
        type = 5;
        pagenum = 1;
        financial_approvalFun();
    })

    $('#myRecord').on('click', function () {
        console.log('我的维修记录');
        type = 0;
        pagenum = 1;
        myRecordFun()
    })

    $('#repairRecordQuery').on('click', function () {
        console.log('维修记录查询')
        type = 6;
        pagenum = 1
        repairRecordQueryFun()
    });
    $('#accidentRecordQuery').on('click', function () {
        console.log('事故记录查询');
        type = 7;
        pagenum = 1
        accidentRecordQueryFun()
    });
    $('#recordDelete').on('click', function () {
        console.log('维保记录删除')
        type = 8;
        pagenum = 1;
        repairRecordQueryFun()
    });


    $('#repair_apply').on('click', function () {
        console.log('维修申请');
        toggleFun('#pc_fix_apply', 'back', '/repaircar_apply')
    });
    $('#accident_apply').on('click', function () {
        console.log('事故申报');
        toggleFun('#accident', 'back1', '/repair_accident')
    });
    //显示申请表单
    function toggleFun(selector, id, href) {
        $(selector).toggle('slow', function () {
            toggleApply(selector, id, href)
        })
    }
    //显示申请表单
    function toggleApply(selector, backid, href) {
        var _child = $(selector)[0].children;
        if (_child.length == 0) {
            $(selector).append(
                ` <div style="height:40px;background:#fafafa;border-bottom:1px solid #ccc">
                        <span style="display:inline-block;height:100%;width:20%;position: relative;" id=${backid}>
                                <i class="iconfont icon-fanhui apply_back"></i>
                            </span>
                    </div>
                    <iframe frameborder=0 width="100%" height="91%" marginheight=0 marginwidth=0 scrolling=no src=${href}></iframe>
                    `
            )
            $('#' + backid).on('click', function () {
                $(selector).toggle('normal', function () {
                    toggleApply(selector, backid, href)
                })
            })
        } else {
            $(selector).empty()
        }
    }

    function myRecordFun() {
        console.log('我的维修记录');
        var query_json;
        query_json = _user.depart ? (_user.depart.name == '修理厂' ? { WXDW: _user.employee.name } : { DEPT: _user.depart.objectId }) : { DEPT: '>0' }
        init_show(false)
        // debugger;
        approveTableShow(query_json)
    }

    function first_approvalFun() {
        console.log('科所队审批')
        var query_json = { STATE: 1, DQLC: 2 };
        init_show(false)
        approveTableShow(query_json)
    }
    function second_approvalFun() {
        console.log('警务保障室审批')
        var query_json = { STATE: 1, DQLC: 4 };
        init_show(false)
        approveTableShow(query_json)
    }
    function third_approvalFun() {
        console.log('局领导审批');
        var query_json = { STATE: 1, DQLC: 6 };
        init_show(false)
        approveTableShow(query_json)
    }
    function incharge_approvalFun() {
        console.log('专管员审批');
        var query_json = { STATE: 1, DQLC: 3 };
        init_show(false)
        approveTableShow(query_json)
    }
    function financial_approvalFun() {
        console.log('报销审批');
        var query_json = { STATE: 5, DQLC: 0 };
        init_show(false)
        approveTableShow(query_json)
    }

    function repairRecordQueryFun() {
        console.log('维保查询')
        debugger;
        init_show(true, true);
        var query_json = {};
        var car_num = $('#cph').val();
        var depart = $('#select_depart').val();
        var sp_status = $('#fix_status').val();
        // query_json.SQR = name ? name : '>0';
        query_json.HPHM = car_num ? car_num : '>0';
        query_json.DEPT = depart ? depart : '>0|0';
        query_json.STATE = sp_status
        approveTableShow(query_json)
    }

    function accidentRecordQueryFun() {
        console.log('事故查询')
        var query_json = {}
        var car_num = $('#cph').val();
        var depart = $('#select_depart').val();
        // var sp_status = $('#fix_status').val();
        // query_json.SQR = name ? name : '>0';
        query_json.HPHM = car_num ? car_num : '>0';
        query_json.DEPT = depart ? depart : '>0|0';
        // query_json.STATE = sp_status
        // var query_json = { DEPT: '0' }
        init_show(true, false)
        accidentFun(query_json)
    }


    function init_show(isshow, is_fix) {
        if (isshow) {
            $('#statastic_query').show()
            $('#table_scroll').hide();
            $('#table_scroll1').hide()
            if (is_fix) {
                $('#table_scroll').show();
                $('#status').show()
                $('#table_scroll')[0].style.height = window.innerHeight - 240 + 'px';
            } else {
                $('#table_scroll1').show();
                $('#status').hide()
                $('#table_scroll1')[0].style.height = window.innerHeight - 240 + 'px';
            }
        } else {
            $('#statastic_query').hide();
            $('#table_scroll').show()
            $('#table_scroll')[0].style.height = window.innerHeight - 200 + 'px';
        }
    }
    //获取维保数据
    function approveTableShow(option) {
        W.$ajax('mysql_api/list', {
            json_p: option,
            table: 'ga_apply2',
            sorts: '-SQSJ',
            limit: pageSize,
            pageno: pagenum
        }, function (res) {
            console.log(res, 'res')
            if (res.data.length) {
                var i = 0;
                res.data.forEach(ele => {
                    W.$ajax('mysql_api/list', {
                        json_p: { apply2_id: ele.XLH },
                        table: 'ga_spstatus',
                        sorts: 'status'
                    }, function (res2) {
                        ele.spstatus = res2.data;
                        i++;
                        if (i == res.data.length) {
                            res.totalPage = ~~(res.total / pageSize);
                            res.total % pageSize > 0 ? res.totalPage += 1 : null;
                            Paging(res, type);
                            apply_table(res.data)
                        }
                    })
                })
            } else {
                $('#repair_info').empty();
                $('#repair_info').append(` <tr ><td colspan="13" style="text-align:center">没有数据！</td></tr>`)
                $('#page').text('')
            }

        })
    }
    //获取事故数据
    function accidentFun(option) {
        W.$ajax('mysql_api/list', {
            json_p: option,
            sorts: 'XLH',
            table: 'ga_accident',
            limit: pageSize,
            pageno: pagenum
        }, function (res) {
            console.log(res)
            if (res.data.length) {
                res.totalPage = ~~(res.total / pageSize);
                res.total % pageSize > 0 ? res.totalPage += 1 : null;
                apply_table1(res.data)
                Paging(res, type)
            } else {
                $('#repair_info1').empty();
                $('#repair_info1').append(` <tr ><td colspan="11" style="text-align:center">没有数据！</td></tr>`)
                $('#page').text('')
            }

        })
    }
    // function 

    function Paging(data, type) {
        $("#page").paging({
            pageNo: pagenum,
            totalPage: data.totalPage,
            totalSize: data.total,
            callback: function (num) {
                pagenum = num;
                W.setCookie('pagenum', pagenum)
                autoGet(type)
            }
        })
    }

    //显示维保信息列表
    function apply_table(data) {
        console.log(data, 'table')
        $('#repair_info').empty();
        var is_resubmit = false;
        // var is_commit = false;
        if (_user.employee) {
            if ((_user.employee.isDriver || _user.depart.name == '修理厂') && type == 0) {
                is_resubmit = true;
            }
        }
        if (data.length) {
            data.forEach((ele, index) => {
                var _ele = ele;
                var disabled = _ele.DQLC == 2 ? true : false;
                var is_again = _ele.TYPE == 1 && type == 0 ? true : false;
                if (_ele.WXLX) {
                    var wxlx = ''
                    _ele.WXLX.split('').forEach(e => {
                        wxlx += (wx[e] + '、')
                    })
                    wxlx = wxlx.slice(0, -1)
                    var _href = "./repaircar_detail?applyid=" + _ele.XLH;
                    var _href1 = './repaircar_apply?resubmit=true&applyid=' + _ele.XLH
                    var appid = _ele.XLH;
                    var HPHM = _ele.HPHM;
                    switch (type) {
                        case 0:
                            _href += '&my=' + true;
                            break;
                        case 1:
                        case 2:
                        case 3:
                        case 4:
                            _href += '&auditing=' + true
                            break;
                        case 5:
                            _href += '&reimburse=' + true
                            break;
                        case 6:
                            _href += '&query=' + true;
                            break;
                        case 7:
                            break;
                        case 8:
                            _href += '&delete=' + true;
                            break;
                        default:
                            break;
                    }

                    _href += '&type=' + type

                    var xianqin = 'xianqin_' + index;
                    var resubmit = 'resubmit_' + index;
                    var next_report = 'finish_' + index;
                    // debugger;
                    // var XKG = index;
                    var tr_content = `<tr class="">
                            <td>${_ele.XLH}</td>
                            <td>${_ele.TYPE ? '保养' : '维修'}</td>
                            <td>${_ele.HPHM}</td>
                            <td>${_HPZL[_ele.HPZL]}</td>
                            <td>${wxlx} </td>
                            <td>${_ele.YJJED}</td>
                            <td>${_ele.SQR}</td>
                            <td>${W.dateToString(W.date(_ele.SQSJ))}</td>
                            <td>${app_state[_ele.STATE]}</td>
                            <td>${lc[_ele.DQLC]}</td>
                            <td>${lc[_ele.XGLC]}</td>
                            <td>${_ele.ZJE}</td>
                            <td> 
                                <button class="btn btn-default" id=${xianqin} type="button" style="line-height:15px;padding:4px 5px">详情</button>
                                ${is_resubmit ? `<button class="btn btn-default" id=${resubmit} ${!disabled ? 'disabled' : null} type="button" style="line-height:15px;padding:4px 5px">重新提交</button>` : ``}
                                ${is_again ? `<button class="btn btn-default" id=${next_report} type="button" style="line-height:15px;padding:4px 5px">下次保养</button>` : ``}
                            </td>
                        </tr>`

                    $('#repair_info').append(tr_content);
                    // console.log(`#${xianqin}`)
                    $(`#${xianqin}`).on('click', function () {
                        top.location = _href;
                    })
                    $(`#${resubmit}`).on('click', function () {
                        toggleFun('#pc_fix_apply', 'back', _href1)
                    })
                    $(`#${next_report}`).on('click', function () {
                        wistorm_api._list('vehicle', { name: HPHM }, '', '', '-createdAt', 0, 0, 1, -1, W.getCookie('auth_code'), true, function (res) {
                            $('.maintainExpireIn').datetimepicker({
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
                            $('#maintainExpireIn').val(new Date(res.data[0].maintainExpireIn).format('yyyy-MM-dd'));
                            $('#maintainMileage').val(res.data[0].maintainMileage || '')
                            // console.log(res)
                        })
                        $('#androidDialog1').fadeIn(200);
                        $('#audit_cancle').on('click', function () {
                            $('#androidDialog1').fadeOut(200);
                        })
                        $('#audit_commit').on('click', function () {
                            var update_json = {};
                            update_json.maintainExpireIn = $('#maintainExpireIn').val();
                            update_json.maintainMileage = $('#maintainMileage').val();
                            console.log(HPHM)
                            wistorm_api._update('vehicle', { name: HPHM }, update_json, $.cookie('auth_code'), true, function (res) {
                                // console.log(res)
                                $('#androidDialog1').fadeOut(200);
                            })
                            // console.log(update_json, 'update_json')
                            // $('#androidDialog1').fadeOut(200);
                        })
                        // console.log(appid,HPHM)
                        // toggleFun('#pc_fix_apply', 'back', _href1)
                    })

                }

            })
        }

    }
    //显示事故信息列表
    function apply_table1(data) {
        console.log(data, 'table')
        $('#repair_info1').empty();
        if (data.length) {
            data.forEach((ele, index) => {
                var _ele = ele;
                var tr_content = `<tr class="">
                        <td>${index}</td>
                        <td>${_ele.HPHM || ''}</td>
                        <td>${W.dateToString(W.date(_ele.CXS)) || ''}</td>
                        <td>${_ele.CXDD || ''}</td>
                        <td>${_ele.ZRR || ''}</td>
                        <td>${_ele.ZRFC || ''}</td>
                        <td>${_ele.PCJE || ''}</td>
                        <td>${_ele.RYPCF || ''}</td>
                        <td>${_ele.BZ || ''}</td>
                    </tr>`
                $('#repair_info1').append(tr_content)
            })
        }
    }

    // $('.maintainExpireIn').data

    //查询的部门选择列表
    function GetDEPT(_user, callback) {
        $('#select_depart').empty();
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
            callback();
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

    $('#query_button').on('click', function () {
        pagenum = 1;
        autoGet(type)
    })


    // $('.maintainExpireIn').datetimepicker({
    //     language: $.cookie("lang"),
    //     weekStart: 1,
    //     todayBtn: 1,
    //     autoclose: 1,
    //     todayHighlight: 1,
    //     startView: 2,
    //     forceParse: 0,
    //     showMeridian: 1,
    //     minView: 2
    // });
    // $('#start_time').val(new Date().format('yyyy-MM-dd'));
    // $('#wxjlcx').on('click', function () {
    //     $('#status').show()
    //     $('#query').show();
    //     console.log(1)
    // })
    // $('#sgcx').on('click', function () {
    //     $('#status').hide()
    //     $('#query').show();
    //     console.log(2)
    // })

    // function autoget(user) {
    //     var option = {}
    //     if (_user.depart.name == '修理厂') {
    //         option = { WXDW: _user.employee.name }
    //     } else {
    //         option = { DEPT: _user.depart.objectId };
    //         if (_user.employee.role == 12 || _user.employee.role == 13) {
    //             $('#ldshow').show();
    //         }
    //     }

    //     if (_user.employee.responsibility.indexOf('4') > -1) {
    //         $('#sgsb').show();
    //     }
    //     if (_user.employee.responsibility.indexOf('5') > -1) {
    //         $('#dbx').show();
    //         $('#Toggle_apply').hide();
    //     }
    //     if (_user.employee.isInCharge) {
    //         $('#Toggle_accident').show();
    //         $('#glyshow').show();
    //         $('#ldshow').show();
    //         $('#sgsb').show();
    //     }

    //     pagenum = 1;
    //     if (type == 1) {
    //         getapply(option)
    //     } else if (type == 2) {
    //         get_audited(user)
    //     } else if (type == 3) {
    //         get_auditing(user)
    //     }
    // }



    // function getapply(option) {
    //     $('#table_scroll').show();
    //     $('#table_scroll1').hide();
    //     W.$ajax('mysql_api/list', {
    //         json_p: option,
    //         table: 'ga_apply2',
    //         sorts: '-XLH',
    //         limit: pageSize,
    //         pageno: pagenum
    //     }, function (res) {
    //         console.log(res, 'res')
    //         var i = 0;
    //         res.data.forEach(ele => {
    //             W.$ajax('mysql_api/list', {
    //                 json_p: { apply2_id: ele.XLH },
    //                 table: 'ga_spstatus',
    //                 sorts: 'status'
    //             }, function (res2) {
    //                 ele.spstatus = res2.data;
    //                 i++;
    //                 if (i == res.data.length) {
    //                     res.totalPage = ~~(res.total / pageSize);
    //                     res.total % pageSize > 0 ? res.totalPage += 1 : null;
    //                     getPage(res);
    //                     apply_table(res.data)
    //                 }
    //             })
    //         })
    //     })
    // }

    // function get_audited(data) {
    //     var option = { uid: _user.employee.uid, sp_status: '0|4|5|6', apply2_id: '>0' }
    //     audit(option)
    // }

    // function get_auditing(data) {
    //     var option = { uid: _user.employee.uid, sp_status: '1', apply2_id: '>0' }
    //     audit(option)
    // }

    // function getfist() {
    //     var option = { status: 1, sp_status: 1, apply2_id: '>0', isagree: 0 }
    //     audit(option)
    // }
    // function getsecond() {
    //     var option = { status: 2, sp_status: 1, apply2_id: '>0', isagree: 0 }
    //     audit(option)
    // }
    // function getthird() {
    //     var option = { status: 3, sp_status: 1, apply2_id: '>0', isagree: 0 }
    //     audit(option)
    // }
    // function getfour() {
    //     var option = { status: 4, sp_status: 1, apply2_id: '>0', isagree: 0 }
    //     audit(option)
    // }

    // function audit(option) {
    //     $('#table_scroll').show();
    //     $('#table_scroll1').hide();
    //     W.$ajax('mysql_api/list', {
    //         json_p: option,
    //         table: 'ga_spstatus',
    //         sorts: '-cre_tm',
    //         limit: pageSize,
    //         pageno: pagenum
    //     }, function (res) {
    //         console.log(res, 'dd')
    //         var i = 0
    //         if (res.data.length) {
    //             res.data.forEach(ele => {
    //                 W.$ajax('mysql_api/list', {
    //                     json_p: { XLH: ele.apply2_id },
    //                     table: 'ga_apply2',
    //                     sorts: 'XLH'
    //                 }, function (res1) {
    //                     // console.log(res1)
    //                     if (res1.total) {
    //                         ele.apply = res1.data[0]
    //                         W.$ajax('mysql_api/list', {
    //                             json_p: { apply2_id: ele.apply2_id },
    //                             table: 'ga_spstatus'
    //                         }, function (res3) {
    //                             res1.data[0].spstatus = res3.data;
    //                             i++;
    //                             ele.apply = res1.data[0]
    //                             if (i == res.data.length) {
    //                                 res.totalPage = ~~(res.total / pageSize);
    //                                 res.total % pageSize > 0 ? res.totalPage += 1 : null;
    //                                 apply_table(res.data);
    //                                 getPage(res)
    //                             }
    //                         })
    //                     } else {
    //                         i++;
    //                         if (i == res.data.length) {
    //                             res.totalPage = ~~(res.total / pageSize);
    //                             res.total % pageSize > 0 ? res.totalPage += 1 : null;
    //                             apply_table(res.data);
    //                             getPage(res)
    //                         }
    //                     }
    //                 })
    //             })
    //         } else {
    //             $('#repair_info').empty();
    //             $('#repair_info').append(` <tr ><td colspan="11" style="text-align:center">没有数据！</td></tr>`)
    //             $('#page').text('')
    //         }
    //     })
    // }

    // //分页
    // function getPage(data, str) {
    //     var page = 'page';
    //     str ? page = str : page
    //     $("#" + page).paging({
    //         pageNo: pagenum,
    //         totalPage: data.totalPage,
    //         totalSize: data.total,
    //         callback: function (num) {
    //             // alert(num)
    //             pagenum = num;
    //             var option = {}
    //             if (type == 1) {

    //                 if (_user.depart.name == '修理厂') {
    //                     option = { WXDW: _user.employee.name }
    //                 } else {
    //                     option = { DEPT: _user.depart.objectId };
    //                 }
    //                 getapply(option)
    //             } else if (type == 2) {
    //                 get_audited(_user)
    //             } else if (type == 3) {
    //                 get_auditing(_user)
    //             } else if (type == 4) {
    //                 getfist()
    //             } else if (type == 5) {
    //                 getsecond()
    //             } else if (type == 6) {
    //                 getthird()
    //             } else if (type == 7) {
    //                 getfour()
    //             } else if (type == 8) {
    //                 shigu()
    //             } else if (type == 9) {
    //                 option = { STATE: 5 }
    //                 getapply(option)
    //             }

    //         }
    //     })
    // }

    // //已提交
    // $('#ytj').on('click', function () {
    //     // $('.dropdown-toggle1').empty();
    //     // $('.dropdown-toggle1').append(`已提交
    //     // <strong class="caret"></strong>`);
    //     var option = {}
    //     if (_user.depart.name == '修理厂') {
    //         option = { WXDW: _user.employee.name }
    //     } else {
    //         option = { DEPT: _user.depart.objectId };
    //     }
    //     type = 1;
    //     pagenum = 1;
    //     getapply(option)
    // })



    // //已审核
    // $('#ysh').on('click', function () {
    //     // $('.dropdown-toggle1').empty();
    //     // $('.dropdown-toggle1').append(`已审核
    //     // <strong class="caret"></strong>`)
    //     pagenum = 1;
    //     type = 2
    //     get_audited(_user)
    // })
    // //未审核
    // $('#wsh').on('click', function () {
    //     // $('.dropdown-toggle1').empty();
    //     // $('.dropdown-toggle1').append(`未审核
    //     // <strong class="caret"></strong>`);
    //     pagenum = 1;
    //     type = 3;
    //     get_auditing(_user)
    //     // get_audited(_user)
    // })

    // $('#ksd').on('click', function () {
    //     pagenum = 1;
    //     type = 4;
    //     getfist()
    // })
    // $('#hqk').on('click', function () {
    //     pagenum = 1;
    //     type = 5;
    //     getsecond()
    // })
    // $('#jld').on('click', function () {
    //     pagenum = 1;
    //     type = 6;
    //     getthird()
    // })
    // $('#zgy').on('click', function () {
    //     pagenum = 1;
    //     type = 7;
    //     getfour()
    // })

    // $('#sgsb').on('click', function () {
    //     pagenum = 1;
    //     type = 8;
    //     $('#table_scroll').hide();
    //     $('#table_scroll1').show();
    //     shigu()

    // })
    // function shigu() {
    //     W.$ajax('mysql_api/list', {
    //         json_p: { DEPT: _user.employee.departId },
    //         sorts: 'XLH',
    //         table: 'ga_accident',
    //         limit: pageSize,
    //         pageno: pagenum
    //     }, function (res) {
    //         console.log(res)
    //         res.totalPage = ~~(res.total / pageSize);
    //         res.total % pageSize > 0 ? res.totalPage += 1 : null;
    //         // apply_table(res.data);
    //         apply_table1(res.data)
    //         getPage(res, 'page1')
    //     })
    // }

    // $('#bxsp').on('click', function () {
    //     var option = {}
    //     option = { STATE: 5 }
    //     type = 9;
    //     pagenum = 1;
    //     getapply(option)
    // })

    // $('#Toggle_apply').on('click', function () {
    //     fix_apply()
    // })
    // function fix_apply(data) {
    //     $('#pc_fix_apply').toggle('slow', function () {
    //         // console.log($('#pc_fix_apply'));
    //         toggle_Apply(data);
    //     })
    // }

    // $('#Toggle_accident').on('click', function () {
    //     $('#accident').toggle('slow', function () {

    //         toggle_Apply1();
    //     })
    // })
    // function toggle_Apply1() {
    //     var _child = $('#accident')[0].children;
    //     if (_child.length == 0) {
    //         $('#accident').append(`<div style="height:9%;background:#fafafa">
    //                 <span style="display:inline-block;height:100%;width:20%;position: relative;" id="back_apply1">
    //                         <i class="iconfont icon-fanhui apply_back"></i>
    //                     </span>
    //                 </div>
    //                     <iframe frameborder=0 width="100%" height="91%" marginheight=0 marginwidth=0 scrolling=no src="/repair_accident"></iframe>`)
    //         $('#back_apply1').on('click', function () {
    //             $('#accident').toggle('normal', function () {
    //                 // console.log($('#pc_apply'), 'dd')
    //                 toggle_Apply1()
    //             })
    //         })
    //     } else {
    //         $('#accident').empty()
    //     }
    // }
    // function toggle_Apply(data) {
    //     var href = data ? data : '/repaircar_apply';
    //     var _child = $('#pc_fix_apply')[0].children;
    //     if (_child.length == 0) {
    //         $('#pc_fix_apply').append(`<div style="height:9%;background:#fafafa">
    //         <span style="display:inline-block;height:100%;width:20%;position: relative;" id="back_apply">
    //             <i class="iconfont icon-fanhui apply_back"></i>
    //         </span>
    //     </div>
    //     <iframe frameborder=0 width="100%" height="91%" marginheight=0 marginwidth=0 scrolling=no src=${href}></iframe>`)
    //         $('#back_apply').on('click', function () {
    //             $('#pc_fix_apply').toggle('normal', function () {
    //                 // console.log($('#pc_apply'), 'dd')
    //                 toggle_Apply()
    //             })
    //         })
    //     } else {
    //         $('#pc_fix_apply').empty()
    //     }
    // }

    // $('#liucheng').on('click', function () {
    //     $('#androidDialog1').fadeIn(200);
    //     $('#audit_cancle').on('click', function () {
    //         $('#androidDialog1').fadeOut(200);
    //     })
    //     $('#audit_commit').on('click', function () {
    //         $('#androidDialog1').fadeOut(200);
    //     })
    // })


})