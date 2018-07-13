$(document).ready(function () {


    var _g = W.getSearch();
    console.log(_g)
    var _user = JSON.parse(sessionStorage.getItem('user'));
    var _val = $('input[name="order"]:checked').val();
    var _apply2 = {
        option: {},
        spstatus: []
    };
    sessionStorage.setItem('clmx', JSON.stringify({}))
    var clmc_arr = [];  //存储历史维修明细记录
    var clmx_option = {}; //单个维修明细
    var reapplyform = null;
    // var ksd_arr = []; //部门后勤
    var ksd_arr = []; //车辆所在部门科所队领导
    var sqrid = '';
    var repairdepart = []; //存储维修厂
    var isover = false;
    var bxq = '';
    var role = {
        9: '民警',
        12: '部门领导',
        13: '局领导',
    }

    if (_g.resubmit) {
        get_apply2()
    }
    function resubmit(data) {
        // W.$ajax('')
        console.log(data)
        reapplyform = data;
        var _wxlx = data.WXLX.split('');
        $('input[name="order"]')[data.TYPE || 0].checked = true;
        $('#fdj').prop('checked', _wxlx.indexOf('A') > -1)
        $('#dp').prop('checked', _wxlx.indexOf('B') > -1)
        $('#dl').prop('checked', _wxlx.indexOf('C') > -1)
        $('#lt').prop('checked', _wxlx.indexOf('D') > -1)
        $('#wk').prop('checked', _wxlx.indexOf('E') > -1)
        $('#qt').prop('checked', _wxlx.indexOf('Z') > -1)
        $('#check2000').prop('checked', data.YJJED == '2000以内');
        $('#check2500').prop('checked', data.YJJED == '2000--3000');
        $('#check3000').prop('checked', data.YJJED == '3000以上');
        $('#jcrq .weui-cell__ft').text(data.JCRQ);
        $('#ccrq .weui-cell__ft').text(data.CCRQ);
        $('#jcrq .weui-cell__ft').css({ color: '#000' });
        $('#ccrq .weui-cell__ft').css({ color: '#000' });
        $('#applyer').val(data.SQR)
        $('#HPHM').val(data.HPHM);
        $('#wxdh').val(data.WXDWLXDH);
        $('#all_je').text(data.ZJE);
        $('#jzr').val(data.JZR);
        $('#jsr').val(data.JSR);
        $('#bz').val(data.REMARK)
        sessionStorage.setItem('clmx', JSON.stringify({ clmx_arr: data.repairinfo }))
        show_wxmx({ clmx_arr: data.repairinfo })
        vehicleMessage(data.HPHM)
    }

    function get_apply2() {
        W.$ajax('mysql_api/list', {
            json_p: { XLH: _g.applyid },
            sorts: 'XLH',
            table: 'ga_apply2'
        }, function (res) {
            wistorm_api._list('department', { objectId: res.data[0].DEPT }, '', '', '-createdAt', 0, 0, 1, -1, W.getCookie('auth_code'), true, function (dep) {
                W.$ajax('mysql_api/list', {
                    json_p: { XLH: _g.applyid },
                    sorts: 'ID',
                    table: 'ga_repairinfo'
                }, function (res2) {
                    res.data[0].repairinfo = res2.data;
                    // console.log(res.data[0])
                    resubmit(res.data[0])
                })
            })
        })
    }

    // getAudit(_val)
    Array.prototype.uniques = function () {
        var res = [];
        var json = {};
        for (var i = 0; i < this.length; i++) {
            if (!json[this[i].XMMC]) {
                res.push(this[i].XMMC);
                json[this[i].XMMC] = 1;
            }
        }
        return res;
    }

    W.$ajax('mysql_api/list', {
        json_p: { ID: '>0' },
        table: 'ga_repairinfo'
    }, function (res) {
        clmc_arr = res.data.uniques();
    })

    firstshow()
    //判别司机和修理厂输入
    function firstshow() {
        if (_user.employee) {
            if (_user.depart.name == '修理厂') {
                _apply2.option.WXDW = _user.employee.name;
                _apply2.option.WXDWLXDH = _user.employee.tel;
                $('#wxdw .weui-cell__ft').text(_user.employee.name);
                $('#wxdw .weui-cell__ft').css({ color: '#000' });
                $('#wxdh').val(_user.employee.tel)
                // RepairDepart(_user.employee.objectId)
            } else {
                RepairDepart()
                $('#applyer').val(_user.employee.name)
            }
        } else {
            RepairDepart()
        }


    }

    //获取修理厂信息
    function RepairDepart(defalut) {
        wistorm_api._list('department', { name: '修理厂' }, '', '', '-createdAt', 0, 0, 1, -1, W.getCookie('auth_code'), true, function (dep) {
            wistorm_api._list('employee', { departId: dep.data[0].objectId }, '', '', '-createdAt', 0, 0, 1, -1, W.getCookie('auth_code'), true, function (emp) {
                var repairdepart1 = emp.data;
                emp.data.forEach(ele => {
                    var op = {
                        label: ele.name,
                        value: ele.objectId
                    }
                    repairdepart.push(op)
                })
                $('#wxdw').on('click', function () {
                    weui.picker(repairdepart, {
                        defaultValue: [defalut],
                        onConfirm: function (result) {
                            var _thistel = repairdepart1.filter(ele => ele.objectId == result[0].value);
                            _apply2.option.WXDW = result[0].label;
                            _apply2.option.WXDWLXDH = _thistel[0].tel;
                            $('#wxdw .weui-cell__ft').text(result[0].label);
                            $('#wxdw .weui-cell__ft').css({ color: '#000' });
                            $('#wxdh').val(_thistel[0].tel)
                        },
                        id: 'wxdw'
                    });
                })

            })
        })
    }

    //输入申请人判断是否存在此人
    $('#applyer').on('change', function () {
        console.log(this.value)
        wistorm_api._list('employee', { name: this.value }, '', '', '-createdAt', 0, 0, 1, -1, W.getCookie('auth_code'), true, function (emp) {
            wistorm_api.getUserList({ objectId: emp.data[0].uid }, 'objectId,username,authData,createdAt', '-createdAt', '-createdAt', 0, 0, -1, W.getCookie('auth_code'), function (json) {
                // console.log(emp)
                if (!emp.total) {
                    weui.alert('该申请人不存在')
                }
                sqrid = json.data[0].username;
            })

        })
    })
    //自动填写表单浙C
    $('#HPHM').on('focus', function () {
        $('#HPHM').val('浙C')
        W.set_text_value_position('HPHM', -1);
    })

    $('#HPHM').on('input', function () {
        this.value.trim() ? vehicleMessage(this.value.trim()) : showVehicleMessage()

    })
    //输入车牌后获取信息
    function vehicleMessage(name) {
        wistorm_api._list('vehicle', { name: name }, '', '', '-createdAt', 0, 0, 1, -1, W.getCookie('auth_code'), true, function (veh) {
            veh.data[0] ? wistorm_api._list('department', { objectId: veh.data[0].departId }, '', '', '-createdAt', 0, 0, 1, -1, W.getCookie('auth_code'), true, function (dep) {
                veh.data[0].department = dep.data[0];
                // console.log(veh.data, 'dep')
                showVehicleMessage(veh.data[0])
            }) : showVehicleMessage()
        })
    }

    //输入车牌号码显示
    function showVehicleMessage(data) {
        console.log(data, ksd_arr)
        if (data) {
            _apply2.option.HPHM = data.name
            _apply2.option.HPZL = '02';
            _apply2.option.DEPT = data.departId;
            _apply2.option.SQR = data.department.name
            // var _hpzl = _this_car.plate_type == '02' ? '小型汽车' : '大型汽车'
            var _hpzl = '小型汽车'
            var _clxh = data.model;
            var _date = W.date(data.buyDate)
            var _time = _date.getTime();
            var _nowTime = Date.parse(new Date());
            var all_Month = parseInt((_nowTime - _time) / (1000 * 60 * 60 * 24 * 30));
            var _year = _date.getFullYear()
            var _month = _date.getMonth() + 1;
            var _dates = _date.getDate();
            var _gmrq = _year + '-' + _month + '-' + _dates;
            var _synx = '已使用' + ~~(all_Month / 12) + '年';
            $('#hmzl').text(_hpzl);
            $('#cpxh').text(_clxh);
            $('#gmrq').text(_gmrq);
            $('#synx').text(_synx);
            $('#show_carnumber').show();
            $('#depart').val(data.department.name)
            // $('#depart .weui-cell__ft').text(data.department.name);
            // $('#depart .weui-cell__ft').css({color:'#000'})
            gethq(data.department.objectId);
        } else {
            $('#hmzl').text('');
            $('#cpxh').text('');
            $('#gmrq').text('');
            $('#synx').text('');
            $('#show_carnumber').hide();
            $('#depart').val('')
            // $('#depart .weui-cell__ft').text('')
            // $('#depart .weui-cell__ft').css({color:'#ccc'})
        }
    }




    //获取全部部门
    function other_depart(data) {
        $('#depart').on('click', function () {
            var depart_data = [];
            var _index = null;
            data.forEach((ele, index) => {
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
                    $('#depart .weui-cell__ft').text(result[0].label);
                    $('#depart .weui-cell__ft').css({ color: '#000' });

                    getvihicle(result[0].value)
                    _apply2.option.DEPT = result[0].value;
                    ksd_arr = [];
                    gethq(result[0].value)
                },
                id: 'depart'
            });
        });
    }

    //获取科所队审批人员
    function gethq(data) {
        wistorm_api._list('employee', { departId: data, role: 12 }, '', '', '-createdAt', 0, 0, 1, -1, W.getCookie('auth_code'), true, function (emp) {
            var i = 0;
            emp.data.forEach(ele => {
                // if (ele.responsibility.indexOf('4') > -1) {
                wistorm_api.getUserList({ objectId: ele.uid }, 'objectId,username,authData,createdAt', '-createdAt', '-createdAt', 0, 0, -1, W.getCookie('auth_code'), function (json) {
                    ele.user = json.data[0];
                    ksd_arr.push(ele);
                    i++;
                    if (i == emp.data.length) {
                        // console.log(ksd_arr, 'ksd_arr')
                        // selectAuditer(ksd_arr)
                    }
                })
            })
        })
    }



    //获取部门车辆
    function getvihicle(id) {
        wistorm_api._list('vehicle', { departId: id }, '', '', '-createdAt', 0, 0, 1, -1, W.getCookie('auth_code'), true, function (dep) {
            console.log(dep, 'dep')
            var op_arr = [];
            dep.data.forEach((ele, index) => {
                var wx_op = {
                    label: ele.name,
                    value: index
                };
                if (ele.status == 1) {
                    wx_op.label += '(出车中)'
                } else if (ele.status == 2) {
                    wx_op.label += '(维保中)'
                }
                op_arr.push(wx_op)

            });
            $('#hphm').on('click', function () {
                weui.picker(op_arr, {
                    onChange: function (result) {
                        // console.log(result);
                    },
                    onConfirm: function (result) {
                        console.log(dep.data[result[0].value], 'd');
                        var _this_car = dep.data[result[0].value];
                        _apply2.option.HPZL = '02';
                        // var _hpzl = _this_car.plate_type == '02' ? '小型汽车' : '大型汽车'
                        var _hpzl = '小型汽车'
                        var _clxh = _this_car.model;
                        var _date = W.date(_this_car.buyDate)
                        var _time = _date.getTime();
                        var _nowTime = Date.parse(new Date());
                        var all_Month = parseInt((_nowTime - _time) / (1000 * 60 * 60 * 24 * 30));
                        var _year = _date.getFullYear()
                        var _month = _date.getMonth() + 1;
                        var _dates = _date.getDate();
                        var _gmrq = _year + '-' + _month + '-' + _dates;
                        var _synx = '已使用' + ~~(all_Month / 12) + '年'
                        // console.log()
                        $('#hmzl').text(_hpzl);
                        $('#cpxh').text(_clxh);
                        $('#gmrq').text(_gmrq);
                        $('#synx').text(_synx);
                        $('#show_carnumber').show();
                        var text = result[0].label;

                        _apply2.option.HPHM = text;
                        $('#hphm .weui-cell__ft').text(text);
                        $('#hphm .weui-cell__ft').css({ color: '#000' })
                    },
                    id: 'hphm'
                });
            });
        })
    }


    $('#jcrq').on('click', function () {
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
                _apply2.option.JCRQ = val
                $('#jcrq .weui-cell__ft').empty();
                $('#jcrq .weui-cell__ft').text(date);
                $('#jcrq .weui-cell__ft').css({ color: '#000' });
                // console.log(result);
            }
        });
    })
    $('#ccrq').on('click', function () {
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
                // console.log(date)
                _apply2.option.CCRQ = val
                $('#ccrq .weui-cell__ft').empty();
                $('#ccrq .weui-cell__ft').text(date);
                $('#ccrq .weui-cell__ft').css({ color: '#000' });
                // console.log(result);
            }
        });
    })
    // //保修期
    // function Warranty(defalut) {
    //     if (defalut) {
    //         $('#bxq .weui-cell__ft').empty();
    //         $('#bxq .weui-cell__ft').text(defalut);
    //         $('#bxq .weui-cell__ft').css({ color: '#000' });
    //     }
    //     $('#bxq').on('click', function () {
    //         var defal = defalut ? defalut.split('-') : [new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate()]
    //         weui.datePicker({
    //             start: new Date(),
    //             end: new Date().getFullYear() + 10,
    //             defaultValue: defal,
    //             onConfirm: function (result) {
    //                 var date = '';
    //                 var val = '';
    //                 result.forEach((ele, index) => {
    //                     date += ele.label;
    //                     index < 2 ? val += ele.value + '-' : val += ele.value
    //                 })
    //                 bxq = val;
    //                 $('#bxq .weui-cell__ft').empty();
    //                 $('#bxq .weui-cell__ft').text(date);
    //                 $('#bxq .weui-cell__ft').css({ color: '#000' });
    //             }
    //         });
    //     })
    // }

    //添加明细
    $('#add_repairInfo').on('click', function () {
        // console.log(_apply2.option.HPHM,'22')
        if (!_apply2.option.HPHM) {
            weui.alert('请输入车牌号码')
            return false
        }
        $('#container').hide();
        $('#repair_info').show();
        $('#clmx_delete').hide();
        // Warranty(bxq)
        var state = { 'page_id': 1, 'user_id': 5 };
        var title = '添加明细';
        var url = 'fix_apply#add_repair';
        history.pushState(state, title, url);
        window.addEventListener('popstate', function (e) {
            // console.log(e);
            $('#container').show();
            $('#repair_info').hide();
            mxempty();
        });
    })

    //初始化维修明细
    function mxempty() {
        $('#clbh').val('');
        $('#clmc').val('');
        $('#clsl').val('');
        $('#cldj').val('');
        $('#clje').val('');
        $('#wxbz').val('');
        $('#bxq1').val('');
        // bxq = '';
        $('#bxq .weui-cell__ft').empty();
        $('#bxq .weui-cell__ft').text('请选择');
        $('#bxq .weui-cell__ft').css({ color: '#ccc' });
    }

    //零件是否过期
    function isExpire(val) {
        W.$ajax('mysql_api/list', {
            json_p: { VEHICLE: _apply2.option.HPHM, XMMC: val },
            table: 'ga_repairinfo',
            sorts: 'ID'
        }, function (res) {
            console.log(res, 'dfd')
            debugger;
            var now = new Date().format('yyyy-MM-dd');

            // var now = [new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate()]
            // console.log(now.join('-'))
            // new Date().format('yyyy-MM-dd')

            for (var i = 0; i < res.data.length; i++) {
                var pass = res.data[i].CRE_TM ? res.data[i].CRE_TM.split('-') : null;
                var month = parseInt(pass[1]) + parseInt(res.data[i].BXQ);
                if (month > 12) {
                    pass[1] = month - 13;
                    pass[0] = parseInt(pass[0]) + 1;
                }
                if (pass.join('-') > now) {
                    weui.alert('该零件在' + res.data[i].CRE_TM + '更换过，保修期为' + res.data[i].BXQ + '个月，还在保修期，请备注说明更换原因');
                    break;
                }
            }
        })

    }
    //明细名称
    $('#clmc').on('input', function () {
        isExpire(this.value.trim())
        console.log(this.value, 22);
        var show_clmc_list = [];
        var _this = this;
        show_clmc_list = clmc_arr.filter(ele => ele.includes(this.value));
        console.log(show_clmc_list);
        $('#clmc_list').empty();

        for (var i = 0; i < 5; i++) {
            if (show_clmc_list[i]) {
                var _id = `list${i}`
                var tr_content = `<div id="list${i}" style="font-size:16px">${show_clmc_list[i]}</div>`;
                $('#clmc_list').append(tr_content);

                $(`#${_id}`).on('click', function () {
                    console.log($(`#${this.id}`).text())
                    var _text = $(`#${this.id}`).text();
                    isExpire(_text)
                    $('#clmc').val(_text);
                    show_clmc_list = [];
                    $('#clmc_list').hide()
                })
            }
        }
        if (this.value.length) {
            $('#clmc_list').show();
        } else {
            $('#clmc_list').hide();
        }
    })
    //点击任意方位隐藏
    $('body').bind('click', function (event) {
        // IE支持 event.srcElement ， FF支持 event.target    
        var evt = event.srcElement ? event.srcElement : event.target;
        if (evt.id == 'clmc_list') return; // 如果是元素本身，则返回
        else {
            $('#clmc_list').hide(); // 如不是则隐藏元素
        }
    });

    //明细保存
    $('#clmx_save').on('click', function () {
        var is_details = location.hash;
        var details_index = parseInt(is_details.slice(-1));
        clmx_option.XMBH = $('#clbh').val();
        clmx_option.XMMC = $('#clmc').val();
        clmx_option.SL = $('#clsl').val();
        clmx_option.DJ = $('#cldj').val();
        clmx_option.JE = $('#clje').val();
        clmx_option.LB = $('input[name="lb"]:checked').val();
        clmx_option.REMARK = $('#wxbz').val();
        clmx_option.BXQ = $('#bxq1').val();;
        // if(!bxq)
        if (clmx_option.LB == 2) {
            if (!clmx_option.XMMC) {
                weui.alert('请填写材料名称')
                return false;
            }
            if (!clmx_option.SL) {
                weui.alert('请填写数量');
                return false;
            }
            if (!clmx_option.DJ) {
                weui.alert('请填写单价');
                return false;
            }
            if (!clmx_option.BXQ) {
                weui.alert('请填写保修期');
                return false;
            }
        } else {
            if (!clmx_option.JE) {
                weui.alert('请填写金额');
                return false;
            }
        }

        // if(!clmx_option.JE){
        //     weui.alert('请填写金额')
        // }
        console.log(clmx_option, 'option')
        var clmx_arr = sessionStorage.getItem('clmx') ? JSON.parse(sessionStorage.getItem('clmx')) : {};
        !clmx_arr.clmx_arr ? clmx_arr.clmx_arr = [] : null;
        var _i;
        if (is_details.includes('details')) {
            _i = details_index;
        } else {
            _i = clmx_arr.clmx_arr ? clmx_arr.clmx_arr.length : 0;
        }
        clmx_arr.clmx_arr[_i] = clmx_option;
        sessionStorage.setItem('clmx', JSON.stringify(clmx_arr));
        history.back();
        show_wxmx(clmx_arr)
    })
    //明细删除
    $('#clmx_delete').on('click', function () {
        var is_details = location.hash;
        var details_index = parseInt(is_details.slice(-1));
        var clmx_arr = sessionStorage.getItem('clmx') ? JSON.parse(sessionStorage.getItem('clmx')) : {};
        clmx_arr.clmx_arr.splice(details_index, 1);
        sessionStorage.setItem('clmx', JSON.stringify(clmx_arr));
        // console.log(location);
        // debugger;
        history.back();
        show_wxmx(clmx_arr)
    })
    //明细返回
    $('#clmx_back').on('click', function () {
        history.back();
        mxempty()
    })

    //列出维修明细
    function show_wxmx(data) {
        var _all_je = 0;
        $('#show_clli').empty();
        data.clmx_arr.forEach((ele, index) => {
            var _lb;
            _all_je += parseFloat(ele.JE);
            ele.LB == 1 ? _lb = '工时费' : _lb = '材料费'

            var tr_content = `<div style="position:relative">
                    <a class="weui-cell weui-cell_access cell" href="javascript:;" style="padding:0;line-height:3;font-size:16px" id="xq_${index}">
                        <div class="weui-cell__bd" style="flex:1">
                            <div class="placeholder t_a_c">${_lb}</div>
                        </div>
                        <div class="weui-cell__bd slh">
                            <div class="placeholder t_a_c slh">${ele.XMMC}</div>
                        </div>
                        <div class="weui-cell__bd">
                            <div class="placeholder t_a_c">${ele.JE}</div>
                        </div>
                        <div class="weui-cell__bd">
                        </div>
                    </a>
                    <span class="" style="position: absolute;right: 36px;top:10px;" id="delete_${index}">
                        <i class="weui-icon-cancel icon-delete" style="font-size:20px;color:red"></i>
                    </span>
                </div>`
            $('#show_clli').append(tr_content);
            $('#xq_' + index).on('click', function () {
                // console.log(index)
                $('#container').hide();
                $('#repair_info').show();
                var state = { 'page_id': 1, 'user_id': 5 };
                var title = '明细详情';
                var url = 'fix_apply#details_' + index;
                history.pushState(state, title, url);
                window.addEventListener('popstate', function (e) {
                    // console.log(e);
                    $('#container').show();
                    $('#repair_info').hide();
                });
                var _thisArr = data.clmx_arr[index];
                $('#clmx_delete').show();

                // $("#lb").find("input[name='lb']").removeAttr("checked");
                console.log($("#gsf"))
                $("#gsf")[0].checked = false;
                $('#clf')[0].checked = false;
                console.log($("#lb").find("input[name='lb']"))
                // console.log($("#lb").find("input[name='lb']"))
                if (_thisArr.LB == 1) {
                    // $("#gsf").attr("checked", 'checked');
                    $("#gsf")[0].checked = true;
                } else if (_thisArr.LB == 2) {
                    $('#clf')[0].checked = true;
                    // $("#clf").attr("checked", 'checked');
                }
                changevalue(_thisArr.LB)
                console.log($('input[name="lb"]:checked').val())
                $('#clbh').val(_thisArr.XMBH);
                $('#clmc').val(_thisArr.XMMC);
                $('#clsl').val(_thisArr.SL);
                $('#cldj').val(_thisArr.DJ);
                $('#clje').val(_thisArr.JE);
                $('#wxbz').val(_thisArr.REMARK);
                $('#bxq1').val(_thisArr.BXQ)
                // bxq = _thisArr.BXQ;
                // Warranty(_thisArr.BXQ)

            })
            $('#delete_' + index).on('click', function () {
                // console.log(index);
                data.clmx_arr.splice(index, 1);
                sessionStorage.setItem('clmx', JSON.stringify(data));
                show_wxmx(data)
            })
        });
        $('#all_je').text(_all_je)
        if (data.clmx_arr.length) {
            $('#show_clli').prepend(`<div class="weui-flex" style="background:#ececec;line-height:3">
                    <div class="weui-flex__item">
                        <div class="placeholder t_a_c">类别</div>
                    </div>
                    <div class="weui-flex__item">
                        <div class="placeholder t_a_c">材料名称</div>
                    </div>
                    <div class="weui-flex__item">
                        <div class="placeholder t_a_c">金额</div>
                    </div>
                    <div class="weui-flex__item">
                        <div class="placeholder t_a_c">操作</div>
                    </div>
                </div>`);
            $('#show_clli').show();
        }
    }
    //数量*单价
    $('#clsl').on('input', function () {
        var _dj = $('#cldj').val();
        if (this.value && _dj) {
            var _je = this.value * _dj
            $('#clje').val(_je)
        } else {
            $('#clje').val('')
        }
    })
    // 单价*数量
    $('#cldj').on('input', function () {
        var _sl = $('#clsl').val();
        if (this.value && _sl) {
            var _je = this.value * _sl
            $('#clje').val(_je)
        } else {
            $('#clje').val('')
        }
    })

    //根据类别
    $('input[name="lb"]').on('click', function (e) {
        // console.log(e.target.value)
        changevalue(e.target.value)
        // form_option.address = e.target.value
    });
    //类别不同隐藏或显示填写框
    function changevalue(val) {
        if (val == 1) {
            $('#clmc1').hide();
            $('#number1').hide();
            $('#clsl1').hide();
            $('#cldj1').hide();
            $('#clje').removeAttr('disabled')
            $('#bxq12').parent().hide();
        } else {
            $('#clmc1').show();
            $('#number1').show();
            $('#clsl1').show();
            $('#cldj1').show();
            $('#bxq12').parent().show();
            $('#clje').attr('disabled', true)
        }
    }




    //提交表单
    $('#submit').on('click', function () {


        var repair_info = JSON.parse(sessionStorage.getItem('clmx'))
        if (repair_info.clmx_arr) {
            if (!repair_info.clmx_arr.length) {
                weui.alert('请添加维修明细');
                return false
            }
        } else {
            weui.alert('请添加维修明细');
            return false
        }
        console.log(repair_info, 'repari')
        var _checkVal = [];
        // console.log($('input[name="wxlx1"]'))
        var wxlx1 = $('input[name="wxlx1"]')
        for (var o in wxlx1) {
            wxlx1[o].checked ? _checkVal.push(wxlx1[o].value) : null
        }

        // console.log(_checkVal)
        // $('input[name="wxlx1"]').forEach(ele => {
        //     ele.checked ? _checkVal.push(ele.value) : null
        // })
        _apply2.option.TYPE = $('input[name="order"]:checked').val();
        _apply2.option.WXLX = _checkVal.join('');
        _apply2.option.SQR = $('#applyer').val()
        _apply2.option.SQSJ = W.dateToString(new Date());

        _apply2.option.WXDWLXDH = $('#wxdh').val();
        _apply2.option.ZJE = $('#all_je').text();
        _apply2.option.jZR = $('#jzr').val();
        _apply2.option.JSR = $('#jsr').val();
        // _apply2.option.WXDW = $('#wxdw').val();
        _apply2.option.REMARK = $('#bz').val()
        // _apply2.option.DEPT = _user.depart.id;
        _apply2.option.STATE = 1; //明细录入
        _apply2.option.DQLC = 2;
        // _apply2.spstatus = apend_data;
        // _apply2.repair_info = repair_info;
        console.log(_apply2, repair_info)
        if (!_apply2.option.SQR) {
            weui.alert('请输入申请人');
            return false;
        }
        if (!_apply2.option.HPHM) {
            weui.alert('请选择号码号牌');
            return false;
        }
        if (!_apply2.option.WXDW) {
            weui.alert('请输入维修单位');
            return false;
        }
        if (!_apply2.option.WXLX) {
            weui.alert('请选择维修类型');
            return false;
        }
        if (!ksd_arr.length) {
            weui.alert('没有部门领导');
            return false;
        }


        var yjjed_type = $('input[name="price"]:checked').val();
        var yjjed;
        // console.log(_checkVal.join(''))
        if (yjjed_type == 0) {
            if (_apply2.option.ZJE > 2000) {
                weui.alert('维修金额超出预计金额');
                return false;
            }
            yjjed = '2000以内';
            isover = true;
            _apply2.option.SPJB = 11;
            _apply2.option.XGLC = 0;
        } else if (yjjed_type == 1) {
            isover = false;
            if (_apply2.option.ZJE < 2000) {
                weui.alert('维修金额少于预计金额');
                return false;
            } else if (_apply2.option.ZJE > 3000) {
                weui.alert('维修金额大于预计金额');
                return false;
            }
            isover = false;
            yjjed = '2000--3000';
            _apply2.option.SPJB = 12;
            _apply2.option.XGLC = 4;
        } else if (yjjed_type == 2) {
            if (_apply2.option.ZJE < 3000) {
                weui.alert('维修金额少于预计金额');
                return false;
            }
            yjjed = '3000以上';
            _apply2.option.SPJB = 13;
            _apply2.option.XGLC = 4;
        }
        _apply2.option.YJJED = yjjed;
        console.log(_apply2.option)
        var option = Object.assign({}, reapplyform, _apply2.option)
        delete option.repairinfo
        delete option.XLH
        console.log(option, repair_info)

        selectAuditer(ksd_arr, option, repair_info.clmx_arr)
    })

    //提交并选择审核人
    function selectAuditer(data, apply_json, repairinfo_arr) {
        console.log(data, 'dfd')
        $('#nextAuditer').empty();
        var append_spstatus = {};
        var sendid = null;
        var _index = null;
        data.forEach((ele, index) => {
            var _id = 'add' + index;
            var checked = 'checked';
            ele.responsibility.indexOf('1') > -1 ? _index = index : index == 0 ? _index = index : ''
            var tr_content = `
                    <div class="weui-cell weui-cell_access" >
                        <input type="checkbox" style="margin-right:5px" value=${index} name='add' id=${_id} ` + (ele.responsibility.indexOf('1') > -1 ? checked : index == 0 ? checked : '') + `/>
                        <div class="weui-cell__hd" style="position: relative;margin-right: 10px;">
                            <img src="js/merge/img/1.png" style="width: 50px;display: block">
                        </div>
                        <div class="weui-cell__bd">
                            <p>`+ ele.name + `</p>
                            <p style="font-size: 13px;color: #888888;">`+ role[ele.role] + `</p>
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
            sp_status: 1,
            status: 1
        }
        $('#androidDialog1').fadeIn(200);
        $('#audit_cancle').on('click', function () {
            $('#androidDialog1').fadeOut(200);
        })

        $('#audit_commit').on('click', function () {
            var wxlx1 = $('input[name="add"]')
            var _auditer = []; //推送人id
            for (var o in wxlx1) {
                wxlx1[o].checked ? _auditer.push(wxlx1[o].value) : null
            }
            if (!_auditer.length) {
                weui.alert('请选项审批人')
            }
            console.log(_auditer);
            console.log(apply_json, repairinfo_arr)
            if (_g.resubmit) {
                W.$ajax('mysql_api/update', {
                    json_p: { XLH: _g.applyid },
                    update_json: apply_json,
                    table: 'ga_apply2'
                }, function (res) {
                    wistorm_api._update('vehicle', { name: apply_json.HPHM }, { status: 2 }, W.getCookie('auth_code'), true, function (veh) {
                        W.$ajax('mysql_api/delete', {
                            json_p: { XLH: _g.applyid },
                            table: 'ga_repairinfo'
                        }, function (del) {
                            var i = 0;
                            var CRE_TM = new Date().format('yyyy-MM-dd');
                            repairinfo_arr.forEach(ele => {
                                var creatop = Object.assign({}, ele, { XLH: _g.applyid, VEHICLE: apply_json.HPHM, CRE_TM: CRE_TM });
                                W.$ajax('mysql_api/create', {
                                    json_p: creatop,
                                    table: 'ga_repairinfo'
                                }, function (res1) {
                                    i++;
                                    if (i == repairinfo_arr.length) {
                                        W.$ajax('mysql_api/delete', {
                                            json_p: { apply2_id: _g.applyid },
                                            table: 'ga_spstatus'
                                        }, function (_spdel) {
                                            W.$ajax('mysql_api/create', {
                                                json_p: append_spstatus,
                                                table: 'ga_spstatus'
                                            }, function (_sps) {
                                                var j = 0;
                                                _auditer.forEach(ele => {
                                                    sendmessage(_g.applyid, data[ele].user.username, apply_json.SQR, '', 2, function () {
                                                        j++
                                                        if (j == _auditer.length) {
                                                            sendmessage(_g.applyid, sqrid, apply_json.SQR, '', 2, function () {
                                                                top.location = '/repaircar_detail?applyid=' + _g.applyid + '&my=true'
                                                            })
                                                        }
                                                    })
                                                })
                                            })
                                        })
                                    }
                                })
                            })
                        })
                    })
                })
            } else {
                W.$ajax('mysql_api/create', {
                    json_p: apply_json,
                    table: 'ga_apply2'
                }, function (res) {
                    append_spstatus.apply2_id = res.id
                    wistorm_api._update('vehicle', { name: apply_json.HPHM }, { status: 2 }, W.getCookie('auth_code'), true, function (veh) {
                        var i = 0;
                        repairinfo_arr.forEach(ele => {
                            var CRE_TM = new Date().format('yyyy-MM-dd');
                            var creatop = Object.assign({}, ele, { XLH: res.id, VEHICLE: apply_json.HPHM, CRE_TM: CRE_TM });
                            W.$ajax('mysql_api/create', {
                                json_p: creatop,
                                table: 'ga_repairinfo'
                            }, function (res1) {
                                i++;
                                if (i == repairinfo_arr.length) {
                                    W.$ajax('mysql_api/create', {
                                        json_p: append_spstatus,
                                        table: 'ga_spstatus'
                                    }, function (_sps) {
                                        var j = 0;
                                        _auditer.forEach(ele => {
                                            sendmessage(res.id, data[ele].user.username, apply_json.SQR, '', 2, function () {
                                                j++
                                                if (j == _auditer.length) {
                                                    sendmessage(_g.applyid, sqrid, apply_json.SQR, '', 2, function () {
                                                        top.location = '/repaircar_detail?applyid=' + res.id + '&my=true'
                                                    })
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
                // console.log(err)
                callback()

            }
        })
    }



})