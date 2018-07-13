/**
 * Created with JetBrains WebStorm.
 * User: 1
 * Date: 13-8-26
 * Time: 下午11:33
 * To change this template use File | Settings | File Templates.
 */

var auth_code = $.cookie('auth_code');
var tabType = 1;
var _edit_cust_name = "";
var rechargeDiv;
var oldOpenId = '';
var wxBindIntervalId;
// 初始化账号信息窗体
var initFrmAccount = function (title) {
    $("#divAccount").dialog("option", "title", title);
    $('#account_old_password').val("");
    $('#account_password').val("");
    $('#account_password2').val("");
};

// 修改密码
var AccountEdit = function () {
    var auth_code = $.cookie('auth_code');
    var username = $.cookie('username');    //用户名
    var old_password = $('#account_old_password').val();  //旧密码
    var new_password = $('#account_password').val();  //旧密码

    // var sendUrl = $.cookie('Host') + "dealer/user/password?auth_code=" + auth_code;
    // var sendData = {
    //     user_name: username,
    //     old_password: hex_md5(old_password),
    //     new_password: hex_md5(new_password),
    //     dealer_type: parseInt($.cookie("dealer_type"))
    // };
    // var sendObj = { type:"PUT", url:sendUrl, data:sendData, success:function (json) {
    //     AccountEditSuccess(json);
    // }, error:OnError };
    // ajax_function(sendObj);
    var query_json = {
        username: username,
        password: hex_md5(old_password)
    };

    var update_json = {
        password: hex_md5(new_password)
    };

    wistorm_api.update(query_json, update_json, auth_code, AccountEditSuccess);
};

var AccountEditSuccess = function (json) {
    if (json.status_code === 0) {
        _ok(i18next.t("account.modify_success"));
        $("#divAccount").dialog("close");
    } else {
        _alert(i18next.t("account.modify_fail"));
    }
};

// 退出事件
var exit_success = function exit_success(json) {
    $.cookie("mapType", "");
    $.cookie("msgcount", "");
    $.cookie('Login', null);
    // location.href = "/";
    var href = '/'
    if ($.cookie("lang")) {
        href += `?lang=${$.cookie("lang")}`
    }
    location.href = href
};

// 获取报警统计
var undealAlert = function (uid, callback) {
    // 获取uid名下所有设备
    var query = {
        uid: uid.toString(),
        status: 0
    };
    wistorm_api._count('_iotAlert', query, auth_code, true, function (obj) {
        var count = obj.status_code === 0 ? obj.count : 0;
        callback(count);
    });
};

var alertBadge = document.getElementById('alertBadge');
var warnVoice = document.getElementById('warnVoice');
var voice = document.getElementById('voice');
var countChange = sessionStorage.getItem('countChange');
var is_firstVoice = sessionStorage.getItem('is_firstVoice') == 'false' ? false : true;
var is_voice = sessionStorage.getItem('is_voice') == 'false' ? false : true;

var getAlertCount = function () {
    var dealerId = $.cookie('dealer_id');
    undealAlert(dealerId, function (count) {
        console.log('alert count: ' + count);
        alertBadge.innerHTML = count > 9 ? '..' : count;
        alertBadge.style.display = count > 0 ? 'block' : 'none';
        if (is_voice) {
            if (is_firstVoice && count) {
                addEmbed();
                countChange = count;
                is_firstVoice = false;
                sessionStorage.setItem('is_firstVoice', is_firstVoice)
            } else if (countChange && countChange != count) {
                addEmbed();
                countChange = count;
            }
        } else {
            changeVoice(true)
        }
        sessionStorage.setItem('countChange', countChange)
    });
};



voice.addEventListener('click', () => changeVoice(false))

function changeVoice(other_change) {
    var classIcon = $('#voice').attr('class');
    if (other_change) {
        classIcon = 'icon iconfont icon-voiceoff'
    } else {
        if (classIcon.indexOf('icon-voiceoff') > -1) {
            classIcon = classIcon.replace('icon-voiceoff', 'icon-voiceon');
            is_voice = true;
            getAlertCount();

        } else {
            classIcon = classIcon.replace('icon-voiceon', 'icon-voiceoff');
            $('#warnVoice').html('');
            is_voice = false;
        }
    }
    sessionStorage.setItem('is_voice', is_voice)
    $('#voice').attr('class', classIcon);
}

function addEmbed() {
    $('#warnVoice').html('');
    var surl = '../voice/ALARM3.WAV';
    $("#warnVoice").html("<embed src='" + surl + "' autostart=true loop=false height=0px width=0px>")
}



function _accountGetCustomer() {
    var cust_id = $.cookie('dealer_id');
    var user_type = $.cookie('dealer_type');
    // user_type != 1 ? $('#date_fee').hide() : $('#date_fee').show();

    var query_json = {
        uid: cust_id
    };
    wistorm_api._get('customer', query_json, 'name,contact,tel,treePath,other', auth_code, true, function (json) {
        if (json.status_code === 0 && json.data) {
            _edit_cust_name = json.data.name;
            $('#_cust_name').val(json.data.name);
            $('#_contacter').val(json.data.contact);
            $('#_contacter_tel').val(json.data.tel);
            $('#current_month_fee').val(0);
            $('#current_year_fee').val(0);
            $('#2m_year_fee').val(0);
            $('#5m_year_fee').val(0);
            $('#30m_year_fee').val(0);
            $('#100m_year_fee').val(0);

            if (json.data.other) {
                $('#current_month_fee').val(json.data.other.monthFee || 0);
                $('#current_year_fee').val(json.data.other.yearFee || 0);
                if (json.data.other.flow) {
                    if (json.data.other.flow[2]) {
                        $('#2m_year_fee').val(json.data.other.flow[2].yearFee || 0);
                    }
                    if (json.data.other.flow[5]) {
                        $('#5m_year_fee').val(json.data.other.flow[5].yearFee || 0);
                    }
                    if (json.data.other.flow[30]) {
                        $('#30m_year_fee').val(json.data.other.flow[30].yearFee || 0);
                    }
                    if (json.data.other.flow[100]) {
                        $('#100m_year_fee').val(json.data.other.flow[100].yearFee || 0);
                    }
                }
            }

            var treePath = json.data.treePath;
            var trees = treePath.split(",");
            trees = trees.filter(function (value) {
                return value !== "";
            });
            var query_json = {
                uid: trees.join("|")
            };
            var parent_month_fee = 0;
            var parent_year_fee = 0;
            var parentYearFee2 = parentYearFee5 = parentYearFee30 = parentYearFee100 = 0;
            wistorm_api._list('customer', query_json, 'uid,other', 'uid', 'uid', 0, 0, 1, -1, auth_code, true, function (custs) {
                if (custs.status_code === 0 && custs.total > 0) {
                    for (var i = 0; i < custs.total; i++) {
                        // if (custs.data[i].uid !== cust_id) {
                        //     parent_month_fee += parseFloat(custs.data[i].other.monthFee || 0);
                        //     parent_year_fee += parseFloat(custs.data[i].other.yearFee || 0);
                        // }
                        if (custs.data[i].uid == cust_id) {
                            // parent_month_fee += (custs.data[i].other ? parseFloat(custs.data[i].other.parentMonthFee || 0) : 0)
                            // parent_year_fee += (custs.data[i].other ? parseFloat(custs.data[i].other.parentYearFee || 0) : 0)
                            if (custs.data[i].other) {
                                parent_month_fee += parseFloat(custs.data[i].other.parentMonthFee || 0);
                                parent_year_fee += parseFloat(custs.data[i].other.parentYearFee || 0);
                                if (custs.data[i].other.flow) {
                                    if (custs.data[i].other.flow[2]) {
                                        parentYearFee2 += parseFloat(custs.data[i].other.flow[2].parentYearFee || 0)
                                    }
                                    if (custs.data[i].other.flow[5]) {
                                        parentYearFee5 += parseFloat(custs.data[i].other.flow[5].parentYearFee || 0)
                                    }
                                    if (custs.data[i].other.flow[30]) {
                                        parentYearFee30 += parseFloat(custs.data[i].other.flow[30].parentYearFee || 0)
                                    }
                                    if (custs.data[i].other.flow[100]) {
                                        parentYearFee100 += parseFloat(custs.data[i].other.flow[100].parentYearFee || 0)
                                    }
                                }
                            }
                        } else {
                            // parent_month_fee += (custs.data[i].other ? parseFloat(custs.data[i].other.parentMonthFee || 0) : 0) + (custs.data[i].other ? parseFloat(custs.data[i].other.monthFee || 0) : 0)
                            // parent_year_fee += (custs.data[i].other ? parseFloat(custs.data[i].other.parentYearFee || 0) : 0) + (custs.data[i].other ? parseFloat(custs.data[i].other.yearFee || 0) : 0)
                            if (custs.data[i].other) {
                                parent_month_fee += parseFloat(custs.data[i].other.parentMonthFee || 0) + parseFloat(custs.data[i].other.monthFee || 0);
                                parent_year_fee += parseFloat(custs.data[i].other.parentYearFee || 0) + parseFloat(custs.data[i].other.yearFee || 0);
                                if (custs.data[i].other.flow) {
                                    if (custs.data[i].other.flow[2]) {
                                        parentYearFee2 += parseFloat(custs.data[i].other.flow[2].parentYearFee || 0) + parseFloat(custs.data[i].other.flow[2].yearFee || 0);
                                    }
                                    if (custs.data[i].other.flow[5]) {
                                        parentYearFee5 += parseFloat(custs.data[i].other.flow[5].parentYearFee || 0) + parseFloat(custs.data[i].other.flow[5].yearFee || 0);
                                    }
                                    if (custs.data[i].other.flow[30]) {
                                        parentYearFee30 += parseFloat(custs.data[i].other.flow[30].parentYearFee || 0) + parseFloat(custs.data[i].other.flow[30].yearFee || 0);
                                    }
                                    if (custs.data[i].other.flow[100]) {
                                        parentYearFee100 += parseFloat(custs.data[i].other.flow[100].parentYearFee || 0) + parseFloat(custs.data[i].other.flow[100].yearFee || 0);
                                    }
                                }
                            }
                        }
                    }
                    $('#parent_month_fee').html(parent_month_fee.toFixed(2));
                    $('#parent_year_fee').html(parent_year_fee.toFixed(2));
                    $('#2mparent_year_fee').text(parentYearFee2);
                    $('#5mparent_year_fee').text(parentYearFee5);
                    $('#30mparent_year_fee').text(parentYearFee30);
                    $('#100mparent_year_fee').text(parentYearFee100);
                }
            });
        }
    });
}

// 编辑客户
var _accountUpdateCustomer = function () {
    var auth_code = $.cookie('auth_code');
    var cust_id = $.cookie('dealer_id');
    var cust_name = $('#_cust_name').val(); //用户名称，只有当用户类型为集团用户时有效，需判断用户名是否存在
    var contacter = $('#_contacter').val(); //姓名
    var contacter_tel = $('#_contacter_tel').val();  //手机号码


    var query_json = {
        uid: cust_id
    };
    var update_json = {
        name: cust_name,
        contact: contacter,
        tel: contacter_tel,
    };
    wistorm_api._update('customer', query_json, update_json, auth_code, true, function (json) {
        if (json.status_code == 0) {
            $("#divAccount").dialog("close");
        } else {
            _alert(i18next.t("customer.msg_edit_fail"));
        }
    });
};


var accountUpdateFee = function () {
    var auth_code = $.cookie('auth_code');
    var cust_id = $.cookie('dealer_id');
    var month_fee = parseFloat($("#current_month_fee").val() || 0);
    var year_fee = parseFloat($("#current_year_fee").val() || 0);
    var year_fee2M = parseFloat($('#2m_year_fee').val() || 0);
    var year_fee5M = parseFloat($('#5m_year_fee').val() || 0);
    var year_fee30M = parseFloat($('#30m_year_fee').val() || 0);
    var year_fee100M = parseFloat($('#100m_year_fee').val() || 0);
    var query_json = {
        uid: cust_id
    };
    var update_json = {
        'other.monthFee': month_fee,
        'other.yearFee': year_fee,
        'other.flow.2.yearFee': year_fee2M,
        'other.flow.5.yearFee': year_fee5M,
        'other.flow.30.yearFee': year_fee30M,
        'other.flow.100.yearFee': year_fee100M
    };
    wistorm_api._update('customer', query_json, update_json, auth_code, true, function (json) {
        if (json.status_code == 0) {
            $("#divAccount").dialog("close");
        } else {
            _alert(i18next.t("customer.msg_edit_fail"));
        }
    });
}

var setValidator = function (tabType) {
    switch (tabType) {
        case 1:
            validator_account = $('#frmAccount').validate(
                {
                    rules: {
                        _cust_name: {
                            minlength: 2,
                            required: true,
                            remote: {
                                url: "/exists", //后台处理程序
                                type: "get", //数据发送方式
                                dataType: "json", //接受数据格式
                                data: {
                                    auth_code: function () {
                                        return $.cookie('auth_code');
                                    },
                                    query_type: function () {
                                        return 5;
                                    },
                                    old_value: function () {
                                        return _edit_cust_name;
                                    },
                                    value: function () {
                                        return $('#_cust_name').val();
                                    }
                                }
                            }
                        }
                    },
                    messages: {
                        cust_name: { minlength: i18next.t("customer.cust_name_minlength"), required: i18next.t("customer.cust_name_required"), remote: i18next.t("customer.cust_name_remote") }
                    },
                    highlight: function (element) {
                        $(element).closest('.control-group').removeClass('success').addClass('error');
                    },
                    success: function (element) {
                        element
                            .text('OK!').addClass('valid')
                            .closest('.control-group').removeClass('error').addClass('success');
                        //alert('success');
                    }
                });
            break;
        case 2:
            validator_account = $('#frmAccount').validate(
                {
                    rules: {
                        account_old_password: {
                            minlength: 6,
                            required: true
                        },
                        account_password: {
                            minlength: 6,
                            required: true
                        },
                        account_password2: {
                            minlength: 6,
                            required: true,
                            equalTo: "#account_password"
                        }
                    },
                    messages: {
                        account_old_password: { minlength: i18next.t("acount.old_password_minlength"), required: i18next.t("acount.old_password_required") },
                        account_password: { minlength: i18next.t("acount.new_password_minlength"), required: i18next.t("acount.new_password_required") },
                        account_password2: { required: i18next.t("acount.password2_required"), minlength: i18next.t("acount.password2_minlength"), equalTo: i18next.t("acount.password2_equalTo") }
                    },
                    highlight: function (element) {
                        $(element).closest('.control-group').removeClass('success').addClass('error');
                    },
                    success: function (element) {
                        element
                            .text('OK!').addClass('valid')
                            .closest('.control-group').removeClass('error').addClass('success');
                        //alert('success');
                    }
                });
            break;
    }
};

var getAmount = function () {
    var query = {
        objectId: $.cookie('dealer_id')
    }
    wistorm_api.get(query, '', auth_code, function (user) {
        // console.log(user)
        $('#balance').text(parseFloat(user.data.balance).toFixed(2));
        $('#frozenBalance').text(parseFloat(user.data.frozenBalance).toFixed(2));
        var drawAmount = parseFloat(user.data.balance).toFixed(2) - parseFloat(user.data.balance).toFixed(2) * 0.006 - 0.01;
        $('#drawWarn span').text(drawAmount.toFixed(2))
    })
}

var WxBind = function () {
    var query = {
        objectId: $.cookie('dealer_id')
    }
    wistorm_api.getUserList(query, 'authData', 'createdAt', 'createdAt', 0, 0, -1, auth_code, function (res) {
        // console.log(res)
        if (res.status_code == 0 && res.data.length) {
            if (res.data[0].authData) {
                if (res.data[0].authData.openid) {
                    $('#amountWithdraw').removeAttr('disabled');
                    $('#drawText').text('');
                    $('#unbindWxBtn').show();
                    $('#bindWxBtn').hide();
                    $('#bindWxLabel').text('解绑微信');
                    $('#bindWxNameDiv').show();
                    $('#bindWxName img').attr('src', res.data[0].authData.weixin.headimgurl)
                    $('#bindWxName span').text(res.data[0].authData.nickname)
                } else {
                    // res.data[0].authData.openid = '';
                    $('#bindWxBtn').show();
                    $('#unbindWxBtn').hide();
                    $('#bindWxLabel').text('绑定微信')
                    $('#amountWithdraw').attr('disabled', 'disabled');
                    $('#drawText').text('请在账号信息中绑定您的微信账号再进行提现');
                    $('#bindWxNameDiv').hide();
                }
                if (res.data[0].authData.openid != oldOpenId) {
                    if (wxBindIntervalId) {
                        clearInterval(wxBindIntervalId);
                        wxBindIntervalId = undefined;
                        if (rechargeDiv) {
                            $(rechargeDiv).remove()
                        }
                    }
                }
                oldOpenId = res.data[0].authData.openid || '';
            } else {
                oldOpenId = '';
                $('#bindWxBtn').show();
                $('#unbindWxBtn').hide();
                $('#bindWxLabel').text('绑定微信')
                $('#amountWithdraw').attr('disabled', 'disabled');
                $('#drawText').text('请在账号信息中绑定您的微信账号再进行提现');
                $('#bindWxNameDiv').hide();
            }
        }
    })
}

var showQRCodeClose = function () {
    if (wxBindIntervalId) {
        clearInterval(wxBindIntervalId);
    }
    if (watchBalance) {
        clearInterval(watchBalance);
    }
}

var showQRCode = function (link, type) {
    var iframe = document.createElement('iframe');
    iframe.src = link;
    iframe.frameborder = 'no';
    iframe.body = '0';
    iframe.scrolling = 'no';
    iframe.allowtransparency = "yes";
    iframe.height = '320';
    iframe.width = '400';
    iframe.style.border = '0';

    if (rechargeDiv) {
        $(rechargeDiv).remove();
    }
    var title = '提现';
    switch (type) {
        case 1: title = '充值'
            break;
        case 2: title = "提现";
            break;
        case 3: title = "绑定"; iframe.height = '200';
            break;
        case 4: title = "解绑"; iframe.height = '200';
            break;
        default:
            break;
    }
    rechargeDiv = document.createElement('div');
    var input = document.createElement('input');
    input.type = 'hidden';
    input.autofocus = true;

    rechargeDiv.style.padding = '0px';
    $(rechargeDiv).append(input)
    $(rechargeDiv).append(iframe)
    $(rechargeDiv).dialog({
        autoOpen: false,
        width: 'auto',
        height: 'auto',
        resizable: false,
        close: showQRCodeClose,
        title: i18next.t('account.recharge')
    });
    // $(rechargeDiv).dialog("option", "title", i18next.t('account.recharge'));
    var nextClass = $(rechargeDiv).next().attr('class');
    $(rechargeDiv).next().removeClass(nextClass);

    $(rechargeDiv).dialog("option", 'title', title)
    // isDraw ? $(rechargeDiv).dialog("option", 'title', '提现') : $(rechargeDiv).dialog("option", 'title', '充值');
    $(rechargeDiv).dialog("open");
}

$(document).ready(function () {
    var timerAlertCount = function () {
        getAlertCount();
        setTimeout(function () {
            timerAlertCount();
        }, 60000);
    };
    // 获取报警计数
    timerAlertCount();

    //设置dealer_name
    $("#dealer_name").html($.cookie('username'));
    $("#btnExit").click(function () {
        var ExitMsg = i18next.t("system.exit");
        if (CloseConfirm(ExitMsg)) {
            var exitUrl = '/logout';
            var exitObj = { type: "GET", url: exitUrl, data: null, success: exit_success, error: OnError };
            ajax_function(exitObj);
        }
    });

    $("#dealer_name").click(function () {
        initFrmAccount(i18next.t("account.my_account"));
        $("#divAccount").dialog("open");
        getAmount();
        WxBind();
    });

    $('#acountTab a').click(function (e) {
        tabType = parseInt($(this).attr('value'));
        setValidator(tabType);
        // alert(tabType);
    });

    $('#rechargeBtn').on('click', function () {
        var amount = $('#rechargeAmount').val().trim();
        var adminUser = $.cookie('adminUser');
        var amountRegx = /^\d+(\.\d{1,2})?$/
        if (amount == '') {
            _alert('请输入充值金额！');
            return;
        }
        if (!amountRegx.test(amount)) {
            _alert('请输入正确的充值金额！');
            return;
        }
        var _link = 'http://h5.bibibaba.cn/pay/wicare/wxpayv3/index.php?'
            + 'total=' + amount
            + '&adminUser=' + adminUser
            + '&orderType=2'
            + '&uid=' + $.cookie('dealer_id')
            + '&subject=充值&body=充值&tradeType=NATIVE&productId=chargePC&deviceInfo=WEB';
        showQRCode(_link, 1)
        // $(document).remove(iframe)
        // window.open(_link,"_blank","toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=yes, resizable=no, copyhistory=yes, width=400, height=296, left=120, top=120")
    });

    $('#amountWithdraw').on('click', function () {
        var amount = $('#rechargeAmount').val().trim();
        var amountRegx = /^\d+(\.\d{1,2})?$/
        if (amount == '') {
            _alert('请输入提现金额！');
            return;
        }
        if (!amountRegx.test(amount)) {
            _alert('请输入正确的提现金额！');
            return;
        }
        var _uid = $.cookie('dealer_id');
        var _body = `提现${amount}元`;
        var eAccess = encodeURIComponent(auth_code)
        // var _link = `http://h5.bibibaba.cn/pay/wicare/wxpayv3/withdrawreq.php?uid=${_uid}&body=${_body}&total=${amount}`
        // var _link = `http://h5.bibibaba.cn/pay/wicare/wxpayv3/withdrawreq.php?token=${eAccess}&body=${_body}&total=${amount}`
        var _link = `http://h5.bibibaba.cn/pay/wicare/wxpayv3/scanreq.php?action=withdraw&token=${eAccess}&body=${_body}&total=${amount}`
        showQRCode(_link, 2)
    });

    var bindWxFun = function (link, type) {
        var txtName = $.cookie('name');
        var txtPwd = hex_md5($("#bindWx").val())
        if (!$("#bindWx").val()) {
            _alert('请输入本平台密码')
            return false
        }
        wistorm_api.login(txtName, txtPwd, function (user) {
            if (user.status_code === 0) {
                var _link = link
                showQRCode(_link, type)
            } else {
                _alert('密码错误');
            }
        })
    }
    $('#bindWxBtn').click(function () {
        // var password = $('#bindWx').val();
        var eAccess = encodeURIComponent(auth_code)
        var _link = `http://h5.bibibaba.cn/pay/wicare/wxpayv3/scanreq.php?action=bind&token=${eAccess}`;
        bindWxFun(_link, 3)
        wxBindIntervalId = setInterval(WxBind, 3000)
    })

    $('#unbindWxBtn').click(function () {
        var eAccess = encodeURIComponent(auth_code)
        var _link = `http://h5.bibibaba.cn/pay/wicare/wxpayv3/scanreq.php?action=unbind&token=${eAccess}`;
        bindWxFun(_link, 4);
        wxBindIntervalId = setInterval(WxBind, 3000)
    })


    var accountId = setInterval(function () {
        if (!i18nextLoaded) {
            return;
        }
        var buttons = {};
        buttons[i18next.t("system.save")] = function () {
            $('#frmAccount').submit();
        };
        buttons[i18next.t("system.cancel")] = function () {
            validator_account.resetForm();
            $(this).dialog("close");
        };
        // Dialog Simple
        $('#divAccount').dialog({
            autoOpen: false,
            width: 480,
            buttons: buttons
        });

        $('#frmAccount').submit(function () {
            if ($('#frmAccount').valid()) {
                switch (tabType) {
                    case 1:
                        _accountUpdateCustomer();
                        break;
                    case 2:
                        AccountEdit();
                        break;
                    case 4:
                        accountUpdateFee();
                        break;
                }
            }
            return false;
        });

        clearInterval(accountId);
        setValidator(1);
        _accountGetCustomer();
    }, 100);
});