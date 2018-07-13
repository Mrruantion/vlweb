$(document).ready(function () {


    var _g = W.getSearch();
    var _user = JSON.parse(sessionStorage.getItem('user'));
    debugger;
    W.setCookie('types', _g.type || '')
    // W.setCookie('pagenum', _g.pagenum || '')
    window._user = _user;
    var sendname = '';
    var historyRepairinfo = [];
    var hqry = [];
    var deletefirst = null;

    var role = defalut.repairrole;
    var wx = defalut.repair._wx;
    var _LB = defalut.repair._LB;
    var _HPZL = defalut.repair._HPZL;
    var app_state = defalut.repair.STATE;

    var role1 = {
        9: '普通成员',
        12: '部门领导',
        13: '公司领导'

    }

    if (_user) {
        get_apply2()
    }

    // console.log(_user, 'user')
    // get_apply2()
    function get_apply2() {
        W.$ajax('mysql_api/list', {
            json_p: { XLH: _g.applyid },
            sorts: 'XLH',
            table: 'ga_apply2'
        }, function (res) {
            wistorm_api._list('department', { objectId: res.data[0].DEPT }, '', '', '-createdAt', 0, 0, 1, -1, W.getCookie('auth_code'), true, function (dep) {
                // console.log(json)
                res.data[0].department = dep.data[0];
                gethistory(res.data[0].HPHM)
                gethq(res.data[0].SQR) //获取申请人信息
                // res.data[0].spstatus = res1.data
                W.$ajax('mysql_api/list', {
                    json_p: { XLH: _g.applyid },
                    sorts: 'ID',
                    table: 'ga_repairinfo'
                }, function (res2) {
                    res.data[0].repairinfo = res2.data;
                    W.$ajax('mysql_api/list', {
                        json_p: { apply2_id: _g.applyid },
                        sorts: 'status',
                        table: 'ga_spstatus'
                    }, function (res1) {
                        var i = 0;
                        if (!res1.data.length) {
                            res.data[0].spstatus = res1.data;
                            mainContral(res.data[0]);
                            gethistory(res.data[0])
                        } else {
                            res1.data.forEach(ele => {
                                wistorm_api._list('employee', { uid: ele.uid }, '', '', '-createdAt', 0, 0, 1, -1, W.getCookie('auth_code'), true, function (emp) {
                                    wistorm_api.getUserList({ objectId: ele.uid }, 'objectId,username,authData,createdAt', '-createdAt', '-createdAt', 0, 0, -1, W.getCookie('auth_code'), function (json) {
                                        json.data[0] ? emp.data[0].userid = json.data[0].username : null;
                                        ele.user = emp.data;
                                        i++;
                                        if (i == res1.data.length) {
                                            res.data[0].spstatus = res1.data;
                                            mainContral(res.data[0]);
                                            gethistory(res.data[0])
                                        }
                                    })
                                })
                            })
                        }
                    })
                })
            })
        })
    }
    function gethq(data) {
        wistorm_api._list('employee', { name: data }, '', '', '-createdAt', 0, 0, 1, -1, W.getCookie('auth_code'), true, function (emp) {
            emp.data.forEach(ele => {
                wistorm_api.getUserList({ objectId: ele.uid }, 'objectId,username,authData,createdAt', '-createdAt', '-createdAt', 0, 0, -1, W.getCookie('auth_code'), function (json) {
                    ele.user = json.data[0];
                    hqry.push(ele);
                    console.log(hqry, 'hqry')
                })
            })
        })
    }
    //获取号码号牌的历史记录
    function gethistory(data) {
        W.$ajax('mysql_api/list', {
            json_p: { HPHM: data.HPHM },
            table: 'ga_apply2',
            sorts: '-XLH',
        }, function (res) {
            console.log(res, 'res')
            var i = 0;
            res.data.forEach(ele => {
                W.$ajax('mysql_api/list', {
                    json_p: { XLH: ele.XLH },
                    sorts: 'ID',
                    table: 'ga_repairinfo'
                }, function (res3) {
                    ele.repairinfo = res3.data;
                    W.$ajax('mysql_api/list', {
                        json_p: { apply2_id: ele.XLH },
                        table: 'ga_spstatus',
                        sorts: 'status'
                    }, function (res2) {
                        ele.spstatus = res2.data;
                        i++;
                        if (i == res.data.length) {
                            // console.log(res)
                            historyRepairinfo = res.data;
                            historyRepairinfo = historyRepairinfo.filter(ele => ele.XLH != data.XLH)
                            show_repairinfo(data.repairinfo)
                        }
                    })
                })

            })
        })
    }

    function mainContral(data) {
        console.log(data)
        show_apply(data);
        operation(data);
    }

    function show_apply(data) {
        console.log(data)
        var apply = data;
        // var sp_status = data.spstatus[0].sp_status
        var wxlx = ''
        apply.WXLX.split('').forEach(ele => {
            wxlx += (wx[ele] + '、')
        })
        wxlx = wxlx.slice(0, -1)
        $('#name').text(data.SQR + '的车修')
        $('#HPHM').text(apply.HPHM);
        $('#HPZL').text(_HPZL[apply.HPZL])
        $('#YJJED').text(apply.YJJED)
        $('#WXLX').text(wxlx)
        $('#SQR').text(apply.SQR);
        $('#DEPT').text(apply.department.name);
        $('#SQSJ').text(W.dateToString(W.date(apply.SQSJ)));
        $('#STATE').text(app_state[apply.STATE]);
        $('#DQLC').text(defalut.repair.LC[apply.DQLC]);
        $('#XGLC').text(defalut.repair.LC[apply.XGLC]);
        $('#WXDW').text(apply.WXDW);
        $('#ZJE').text(apply.ZJE);
        $('#JCRQ').text(apply.JCRQ || '');
        $('#CCRQ').text(apply.CCRQ || '');
        $('#JZR').text(apply.JZR || '');
        $('#JSR').text(apply.JSR || '');
        $('#WXDWLXDH').text(apply.WXDWLXDH);
        $('#_spstatus').text(app_state[apply.STATE])
        show_repairinfo(data.repairinfo) //列出维修明细
        show_audit(data.spstatus)       //列出审核人明细
    }


    function show_repairinfo(data) {
        console.log(data)
        $('#repair_info').empty();
        data.forEach((ele, index) => {
            // console.log(historyRepairinfo, '')
            var history_arr = [];
            historyRepairinfo.forEach(rep => {
                var d = rep.repairinfo.filter(rep1 => rep1.XMMC.indexOf(ele.XMMC) > -1);
                // console.log(d)
                if (d.length) {
                    history_arr.push(rep)
                }
            })
            console.log(history_arr, 'history_arr')
            var tr1 = `<select style="width:50%;border-radius:2px">`
            history_arr.forEach(ele => {
                tr1 += `<option>${ele.SQR + '&nbsp;&nbsp;' + W.dateToString(W.date(ele.SQSJ))}</option>`
            })
            tr1 += '</select>'
            var tr_content = `<tr class="info">
                    <th>${_LB[ele.LB]}</th>
                    <th>${ele.XMBH || ''}</th>
                    <th ${history_arr.length ? 'style="color:red"' : null}>${ele.XMMC || ''} </th>
                    <th>${history_arr.length ? tr1 : ''}</th>
                    <th>${ele.SL || ''}</th>
                    <th>${ele.DJ || ''}</th>
                    <th>${ele.JE}</th>
                </tr>`;
            $('#repair_info').append(tr_content)
        })
    }
    //审核流程
    function show_audit(data) {
        $('#auditer').empty();
        data.forEach((ele, index) => {
            var isagree = ''
            ele.isagree ? ele.isagree == 1 ? isagree = '同意' : isagree = '驳回' : isagree = '审核中'

            var tr_content = `<tr class="tr_b_b1">
                    <th>${role[ele.status]}审批</th>
                    <th>${isagree}</th>
                    <th>${ele.user[0] ? ele.user[0].name : ''} </th>
                    <th>${ele.advice ? ele.advice : ''}</th>
                    <th>${W.dateToString(new Date((ele.cre_tm * 1000)))}</th>
                </tr>`
            $('#auditer').append(tr_content)
        })
    }

    function operation(data) {
        console.log(data, 'data')
        sendname = data.SQR;
        var spstatus_status = 0;


        if (_user.employee) {
            if (_user.employee.isDriver || _user.depart.name == '修理厂' || _user.employee.name == data.SQR) { //司机或修理厂
                if (_g.my && data.STATE == 3) {
                    $('#my_button').show();
                    $('#resubmit').show();
                } else if (_g.my && data.STATE == 1) {
                    if (data.spstatus.length) {
                        if (data.spstatus[0].isagree == 0) {
                            $('#my_button').show();
                            $('#resubmit').show();
                        }
                    }
                }
            }
        }

        // debugger;
        if (_g.auditing && data.STATE == 1) { //审核中
            if (data.spstatus.length == 2 && data.SPJB == 13) {
                $('#istakezgy').show();
            }
            if (data.DQLC == 2) {
                if (_user.employee.role == 12 && _user.employee.departId == data.DEPT && (!_user.employee.rolename || _user.employee.rolename == '部门领导')) {
                    spstatus_status = 1
                    $('#other_button').show();
                }
            } else if (data.DQLC == 4) {
                if (_user.employee.role == 12 && _user.employee.rolename == '警务保障室领导') {
                    spstatus_status = 2
                    $('#other_button').show();
                }
            } else if (data.DQLC == 6) {
                if (_user.employee.role == 13) {
                    spstatus_status = 3
                    $('#other_button').show();
                }
            } else if (data.DQLC == 3) {
                if (_user.employee.isInCharge) {
                    spstatus_status = 4
                    $('#other_button').show();
                }
            }
        }
        if (_g.reimburse && data.STATE == 5 && data.DQLC == 0) { //报销审批
            $('#reimburse_button').show()
        }
        if (_g.delete && _g.type == 8) {
            $('#delete_button').show();
        }
        $('#delete_button').on('click', function () {
            weui.confirm('确认删除', function () {
                W.$ajax('mysql_api/delete', {
                    table: 'ga_apply2',
                    json_p: { XLH: _g.applyid }
                }, function (res) {
                    W.$ajax('mysql_api/delete', {
                        table: 'ga_spstatus',
                        json_p: { apply2_id: _g.applyid }
                    }, function (res1) {
                        W.$ajax('mysql_api/delete', {
                            table: 'ga_repairinfo',
                            json_p: { XLH: _g.applyid }
                        }, function (res2) {
                            if (data.STATE == 1) {
                                wistorm_api._update('vehicle', { name: data.HPHM }, { status: 0 }, W.getCookie('auth_code'), true, function (veh) {
                                    history.back();
                                })
                            } else {
                                history.back();
                            }
                        })
                    })
                })
            })

        })


        var is_zgy = $('input[name="zgy1"]:checked').val()


        //撤销
        $('#backout').on('click', function () {
            W.$ajax('mysql_api/update', {
                json_p: { XLH: _g.applyid },
                update_json: { DQLC: 'A', XGLC: 'A', STATE: 0 },
                table: 'ga_apply2',
            }, function (res) {
                W.$ajax('mysql_api/update', {
                    json_p: { apply2_id: _g.applyid },
                    update_json: { sp_status: 0 },
                    table: 'ga_spstatus'
                }, function (res2) {
                    wistorm_api._update('vehicle', { name: data.HPHM }, { status: 0 }, W.getCookie('auth_code'), true, function (veh) {
                        // console.log(1)
                        history.go(0)
                    })
                })
            })
        })
        // //重新提交
        // $('#resubmit').on('click', function () {
        //     top.location = './fix_apply?resubmit=true&applyid=' + _g.applyid
        // })


        //通过
        $('#agree').on('click', function () {
            var sendid = '';
            var sendname = data.SQR;
            var newTime = ~~(new Date().getTime() / 1000)
            if (data.SPJB == 11) { //一级审批
                // var etm = ~~(new Date().getTime() / 1000)
                W.$ajax('mysql_api/update', {
                    json_p: { XLH: _g.applyid },
                    update_json: { DQLC: 0, XGLC: 'A', STATE: 5 },
                    table: 'ga_apply2'
                }, function (res) {
                    console.log(res)
                    W.$ajax('mysql_api/update', {
                        json_p: { apply2_id: _g.applyid },
                        update_json: { isagree: 1, sp_status: 5, uid: _user.user.objectId, sp_tm: newTime },
                        table: 'ga_spstatus'
                    }, function (us) {
                        wistorm_api._update('vehicle', { name: data.HPHM }, { status: 0 }, W.getCookie('auth_code'), true, function (veh) {
                            debugger;
                            sendmessage(_g.applyid, hqry[0].user.username, data.SQR, '申请通过', 1, function () {
                                history.go(0)
                            })
                        })
                    })
                })
            } else if (data.SPJB == 12) { //二级审批
                if (_user.employee.role == 12 && _user.employee.rolename == "警务保障室领导") {
                    W.$ajax('mysql_api/update', {
                        json_p: { XLH: _g.applyid },
                        update_json: { DQLC: 0, XGLC: 'A', STATE: 5 },
                        table: 'ga_apply2'
                    }, function (res) {
                        W.$ajax('mysql_api/update', {
                            json_p: { status: spstatus_status, apply2_id: _g.applyid },
                            update_json: { isagree: 1, uid: _user.user.objectId, sp_tm: newTime },
                            table: 'ga_spstatus'
                        }, function (res1) {
                            W.$ajax('mysql_api/update', {
                                json_p: { apply2_id: _g.applyid },
                                update_json: { sp_status: 5 },
                                table: 'ga_spstatus'
                            }, function (res2) {
                                wistorm_api._update('vehicle', { name: data.HPHM }, { status: 0 }, W.getCookie('auth_code'), true, function (veh) {
                                    sendmessage(_g.applyid, hqry[0].user.username, data.SQR, '申请通过', 1, function () {
                                        history.go(0)
                                    })
                                })
                            })
                        })
                    })
                } else if (_user.employee.role == 12) {
                    wistorm_api._list('department', { isSupportDepart: true, uid: _user.employee.companyId }, '', '', '-createdAt', 0, 0, 1, -1, W.getCookie('auth_code'), true, function (dep) {
                        wistorm_api._list('employee', { departId: dep.data[0].objectId, role: 12 }, '', '', '-createdAt', 0, 0, 1, -1, W.getCookie('auth_code'), true, function (emp) {
                            var i = 0;
                            emp.data.forEach(ele => {
                                wistorm_api.getUserList({ objectId: ele.uid }, 'objectId,username,authData,createdAt', '-createdAt', '-createdAt', 0, 0, -1, W.getCookie('auth_code'), function (json) {
                                    ele.user = json.data[0]
                                    wistorm_api._list('role', { objectId: ele.roleId }, '', '-createdAt', '-createdAt', 0, 0, 1, -1, W.getCookie('auth_code'), false, function (roles) {
                                        ele.rolename = roles.data ? roles.data[0].name : null;
                                        i++;
                                        if (i == emp.data.length) {
                                            selectAuditer(emp.data, 2, true)
                                        }
                                    })
                                })
                            })
                        })
                    })
                }

            } else if (data.SPJB == 13) { //三级审批
                if (_user.employee.role == 13) {
                    W.$ajax('mysql_api/update', {
                        json_p: { XLH: _g.applyid },
                        update_json: { DQLC: 0, XGLC: 'A', STATE: 5 },
                        table: 'ga_apply2'
                    }, function (res) {
                        W.$ajax('mysql_api/update', {
                            json_p: { status: 3, apply2_id: _g.applyid },
                            update_json: { isagree: 1, uid: _user.user.objectId, sp_tm: newTime },
                            table: 'ga_spstatus'
                        }, function (res1) {
                            W.$ajax('mysql_api/update', {
                                json_p: { apply2_id: _g.applyid },
                                update_json: { sp_status: 5 },
                                table: 'ga_spstatus'
                            }, function (res2) {
                                wistorm_api._update('vehicle', { name: data.HPHM }, { status: 0 }, W.getCookie('auth_code'), true, function (veh) {
                                    sendmessage(_g.applyid, hqry[0].user.username, data.SQR, '申请通过', 1, function () {
                                        history.go(0)
                                    })
                                })
                            })
                        })
                    })
                } else if (_user.employee.role == 12 || _user.employee.isInCharge) {
                    if (data.spstatus.length == 1) {
                        wistorm_api._list('department', { isSupportDepart: true, uid: _user.employee.companyId }, '', '', '-createdAt', 0, 0, 1, -1, W.getCookie('auth_code'), true, function (dep) {
                            wistorm_api._list('employee', { departId: dep.data[0].objectId, role: 12 }, '', '', '-createdAt', 0, 0, 1, -1, W.getCookie('auth_code'), true, function (emp) {
                                var i = 0;
                                emp.data.forEach(ele => {
                                    wistorm_api.getUserList({ objectId: ele.uid }, 'objectId,username,authData,createdAt', '-createdAt', '-createdAt', 0, 0, -1, W.getCookie('auth_code'), function (json) {
                                        ele.user = json.data[0]
                                        wistorm_api._list('role', { objectId: ele.roleId }, '', '-createdAt', '-createdAt', 0, 0, 1, -1, W.getCookie('auth_code'), false, function (roles) {
                                            ele.rolename = roles.data ? roles.data[0].name : null;
                                            i++;
                                            if (i == emp.data.length) {
                                                selectAuditer(emp.data, 2)
                                            }
                                        })
                                    })
                                })
                            })
                        })
                    } else if (data.spstatus.length == 2 || data.spstatus.length == 3) {
                        if (data.spstatus.length == 2 && is_zgy) {
                            wistorm_api._list('employee', { isInCharge: true, companyId: _user.employee.companyId }, '', '', '-createdAt', 0, 0, 1, -1, W.getCookie('auth_code'), true, function (emp) {
                                wistorm_api.getUserList({ objectId: emp.data[0].uid }, 'objectId,username,authData,createdAt', '-createdAt', '-createdAt', 0, 0, -1, W.getCookie('auth_code'), function (json) {
                                    sendid = json.data[0].username;
                                    W.$ajax('mysql_api/update', {
                                        json_p: { XLH: _g.applyid },
                                        update_json: { DQLC: 3, XGLC: 6 },
                                        table: 'ga_apply2'
                                    }, function (res) {
                                        W.$ajax('mysql_api/update', {
                                            json_p: { status: 2, apply2_id: _g.applyid },
                                            update_json: { isagree: 1, uid: _user.user.objectId, sp_tm: newTime },
                                            table: 'ga_spstatus'
                                        }, function (res) {
                                            var append_spstatus = {
                                                id: 0,
                                                isagree: 0,
                                                uid: emp.data[0].uid,
                                                cre_tm: ~~(new Date().getTime() / 1000),
                                                apply2_id: _g.applyid,
                                                sp_status: 1,
                                                status: 4
                                            }
                                            W.$ajax('mysql_api/create', {
                                                json_p: append_spstatus,
                                                table: 'ga_spstatus'
                                            }, function (res1) {
                                                sendmessage(_g.applyid, sendid, sendname, '', 2, function () {
                                                    history.go(0)
                                                })
                                            })
                                        })
                                    })
                                })
                            })
                        } else {
                            wistorm_api._list('employee', { departId: '1', role: 13 }, '', '', '-createdAt', 0, 0, 1, -1, W.getCookie('auth_code'), true, function (emp) {
                                var i = 0;
                                emp.data.forEach(ele => {
                                    // wistorm_api.getUserList({ objectId: ele.uid }, 'objectId,username,authData,createdAt', '-createdAt', '-createdAt', 0, 0, -1, W.getCookie('auth_code'), function (json) {
                                    //     ele.user = json.data[0];
                                    //     i++;
                                    //     if (i == emp.data.length) {
                                    //         console.log(emp.data)
                                    //         selectAuditer(emp.data, 3)
                                    //     }
                                    // })
                                    wistorm_api.getUserList({ objectId: ele.uid }, 'objectId,username,authData,createdAt', '-createdAt', '-createdAt', 0, 0, -1, W.getCookie('auth_code'), function (json) {
                                        ele.user = json.data[0]
                                        wistorm_api._list('role', { objectId: ele.roleId }, '', '-createdAt', '-createdAt', 0, 0, 1, -1, W.getCookie('auth_code'), false, function (roles) {
                                            ele.rolename = roles.data ? roles.data[0].name : null;
                                            i++;
                                            if (i == emp.data.length) {
                                                selectAuditer(emp.data, 3)
                                            }
                                        })
                                    })
                                })
                            })
                        }
                    }
                }
            }

        })
        //驳回（审批不通过）
        $('#reject').on('click', function () {
            var etm = ~~(new Date().getTime() / 1000)
            W.$ajax('mysql_api/update', {
                json_p: { XLH: _g.applyid },
                update_json: { DQLC: 'A', XGLC: 'A', STATE: 4 },
                table: 'ga_apply2'
            }, function (res) {
                console.log(res)
                W.$ajax('mysql_api/update', {
                    json_p: { apply2: _g.applyid, status: spstatus_status },
                    update_json: { isagree: 2, uid: _user.employee.uid },
                    table: 'ga_spstatus'
                }, function (us) {
                    console.log(us)
                    W.$ajax('mysql_api/update', {
                        json_p: { apply2_id: _g.applyid },
                        update_json: { sp_status: 0, },
                        table: 'ga_spstatus'
                    }, function (u_s) {
                        console.log(u_s)
                        wistorm_api._update('vehicle', { name: data.HPHM }, { status: 0 }, W.getCookie('auth_code'), true, function (veh) {
                            console.log(veh)
                            sendmessage(_g.applyid, hqry[0].user.username, data.SQR, '申请驳回', 1, function () {
                                history.go(0)
                            })
                        });
                    })
                })
            })
        })


        $('#reimburse').on('click', function () {
            // console.log(1)
            W.$ajax('mysql_api/update', {
                json_p: { XLH: _g.applyid },
                update_json: { DQLC: 'A', XGLC: 'A', STATE: 6 },
                table: 'ga_apply2',
            }, function (res) {
                W.$ajax('mysql_api/update', {
                    json_p: { apply2_id: _g.applyid },
                    update_json: { sp_status: 6 },
                    table: 'ga_spstatus'
                }, function (res2) {
                    // wistorm_api._update('vehicle', { name: data.HPHM }, { status: 0 }, $.cookie('auth_code'), true, function (veh) {
                    // console.log(1)
                    history.go(0)
                    // })
                })
            })
        })
    }

    function selectAuditer(data, type, isover) {
        console.log(data, type, 'dfd')
        if (type == 2) {
            data = data.filter(ele => ele.rolename && ele.rolename == '警务保障室领导')
        }
        $('#nextAuditer').empty();
        var append_spstatus = {};
        var sendid = null;
        var _index = null;
        data.forEach((ele, index) => {
            var _id = 'add' + index;
            var checked = 'checked';
            // ele.responsibility.indexOf('1') > -1 ? _index = index : index == 0 ? _index = index : ''
            var tr_content = `
                    <div class="weui-cell weui-cell_access" >
                        <input type="checkbox" value=${ele.user.username} style="margin-right:5px" name='select_auditer' id=${_id} />
                        <div class="weui-cell__hd" style="position: relative;margin-right: 10px;">
                            <img src="/img/1.png" style="width: 50px;display: block">
                        </div>
                        <div class="weui-cell__bd">
                            <label for=${_id}>
                                <p>`+ ele.name + `</p>
                                <p style="font-size: 13px;color: #888888;">`+ role1[ele.role] + `</p>
                            </label>
                        </div>
                    </div>
                `
            $('#nextAuditer').append(tr_content);
        })

        append_spstatus = {
            id: 0,
            isagree: 0,
            uid: '',
            cre_tm: ~~(new Date().getTime() / 1000),
            apply2_id: _g.applyid,
            sp_status: 1
        }
        type == 1 ? append_spstatus.status = 1 : type == 2 ? append_spstatus.status = 2 : type == 3 ? append_spstatus.status = 3 : null;
        // sendid = data[_index].user.username;
        $('#androidDialog1').fadeIn(200);
        $('#audit_cancle').on('click', function () {
            $('#androidDialog1').fadeOut(200);
        })
        $('#audit_commit').on('click', function () {
            debugger;
            console.log(append_spstatus, 'spstatus')
            var update_json = {};
            if (type == 1) {
                update_json.DQLC = 2;
                update_json.XGLC = 4;
                update_json.STATE = 1;
                if (isover) {
                    update_json.DQLC = 2;
                    update_json.XGLC = 0;
                    update_json.STATE = 1;
                }
            } else if (type == 2) {
                update_json.DQLC = 4;
                update_json.XGLC = 6;
                if (isover) {
                    update_json.DQLC = 4;
                    update_json.XGLC = 0;
                }
            } else if (type == 3) {
                update_json.DQLC = 6;
                update_json.XGLC = 0
            }
            // console.log(update_json)
            var _addauditer = $('input[name="select_auditer"]')
            var _auditer = []; //推送人id
            for (var o in _addauditer) {
                _addauditer[o].checked ? _auditer.push(_addauditer[o].value) : null
            }
            if (!_auditer.length) {
                weui.alert('请选择审批人')
            }
            W.$ajax('mysql_api/update', {
                json_p: { XLH: _g.applyid },
                update_json: update_json,
                table: 'ga_apply2'
            }, function (res) {
                if (type == 1) {
                    W.$ajax('mysql_api/create', {
                        json_p: append_spstatus,
                        table: 'ga_spstatus'
                    }, function (res2) {
                        var _i = 0;
                        _auditer.forEach(ele => {
                            sendmessage(_g.applyid, ele, sendname, '', 2, function () {
                                _i++;
                                if (_i == _auditer.length) {
                                    history.go(0)
                                }
                            })
                        })
                    })
                } else { //type = 2、3 
                    debugger;
                    var _status = '';
                    var now = ~~(new Date().getTime() / 1000)
                    if (type == 2) {
                        _status = 1
                    } else if (type == 3 && _user.employee.isInCharge) {
                        _status = 4
                    } else if (type == 3) {
                        _status = 2
                    }
                    W.$ajax('mysql_api/update', {
                        json_p: { apply2_id: _g.applyid, status: _status },
                        update_json: { isagree: 1, sp_tm: now, uid: _user.user.objectId },
                        table: 'ga_spstatus'
                    }, function (res1) {
                        W.$ajax('mysql_api/create', {
                            json_p: append_spstatus,
                            table: 'ga_spstatus'
                        }, function (res2) {
                            var _i = 0;
                            _auditer.forEach(ele => {
                                sendmessage(_g.applyid, ele, sendname, '', 2, function () {
                                    _i++;
                                    if (_i == _auditer.length) {
                                        history.go(0)
                                    }
                                })
                            })
                        })
                    })
                }
            })
        })
    }

    function sendmessage(id, userid, name, ti, type, callback) {
        var titles = ti || '车修申请'
        var str = 'http://jct.chease.cn' + '/fix_detail?applyid=' + id;
        if (type == 1) { //提交
            str += '&my=true'
        } else if (type == 2) { //审核
            str += '&auditing=true'
        }
        str += '&userid=' + userid
        var _desc = name + '维修申请'
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
                callback()
            }
        })
    }


})