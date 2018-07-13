/**
 * Created with JetBrains WebStorm.
 * User: 1
 * Date: 13-8-26
 * Time: 下午11:28
 * To change this template use File | Settings | File Templates.
 */
var customer_selected = null;
var customer_flag = 1;  //1: 新增  2: 修改
var vehicle_flag = 1;   //1: 新增  2: 修改
var edit_cust_name = '';
var edit_obj_name = '';
var edit_sim = '';
var edit_serial = '';
var vehicle_table;
var cust_id = 0;
var uid = 0;
var parent_cust_id = 0;
var cust_name = "";
var user_name = "";
var obj_id = 0;
var tree_path = '';
var level = 0;
var validator_customer;
var validator_vehicle;

function windowResize() {
//高度变化改变(要重新计算_browserheight)
    windowHeight = $(window).height() - 160;
    $("#customerTree").css({"height":windowHeight + "px"});
    // 如果宽度小于390，则设置表格为简易显示模式，并且客户列表高度改为300px
    windowWidth = $(window).width();
    if (windowWidth < 770) {
        if(typeof setVehicleTable != "undefined") {
            setVehicleTable(true);
        }
        $("#customer_list").css({"height":"120px"});
        $("#customer-tool").removeClass("input-append");
        $("#customerKey").addClass("input-block-level");
        $("#customerKey").removeClass("input-xsmall");
        $("#addCustomer").addClass("btn-block");
    } else {
        if(typeof setVehicleTable != "undefined"){
            setVehicleTable(false);
        }
        $("#customer-tool").addClass("input-append");
        $("#customerKey").removeClass("input-block-level");
        $("#customerKey").addClass("input-xsmall");
        $("#addCustomer").removeClass("btn-block");
    }
}
$(document).ready(function () {
    $("#alert").hide();

    // Initialize placeholder
    $.Placeholder.init();

    windowResize();
    $(window).resize(function () {
        windowResize();
    });
    customerQuery();

    $(document).on("click", "#customer_list li", function () {
        if ($(this).hasClass("active")) {
            //alert("actived");

        } else {
            if (customer_selected) {
                $(customer_selected).removeClass("active");
            }
            $(this).addClass("active");
            customer_selected = $(this);
        }

        //加载客户下的目标
        cust_id = parseInt($(this).attr("cust_id"));
        parent_cust_id = parseInt($(this).attr("parent_cust_id"));
        tree_path = $(this).attr("tree_path");
        cust_name = $(this).attr("cust_name");
        level = parseInt($(this).attr("level"));
        if(typeof vehicleQuery != "undefined"){
            vehicleQuery(cust_id, tree_path);
        }else{
            messageQuery(cust_id, parent_cust_id);
        }
    });

    $(document).on("click", "#customer_list .icon-remove", function () {
        cust_id = parseInt($(this).attr("cust_id"));
        cust_name = $(this).attr("cust_name");
        tree_path = $(this).attr("tree_path");
        if (CloseConfirm('你确认删除客户[' + cust_name + ']吗？')) {
            customerDelete(cust_id, tree_path);
        }
    });

    $(document).on("click", "#vehicle_list .icon-retweet", function () {
        var obj_id = parseInt($(this).attr("obj_id"));
        var obj_name = $(this).attr("obj_name");
        var cust_id = parseInt($(this).attr("cust_id"));
        vehicleCustomerList(obj_id, obj_name, cust_id);
    });

    $(document).on("click", "#vehicle_list .icon-remove", function () {
        obj_id = parseInt($(this).attr("obj_id"));
        obj_name = $(this).attr("obj_name");
        if (CloseConfirm('你确认删除目标[' + obj_name + ']吗？')) {
            vehicleDelete(obj_id);
        }
    });

    $(document).on("click", "#vehicle_list .icon-edit", function () {
        obj_id = parseInt($(this).attr("obj_id"));
        vehicleInfo(obj_id);
    });


    $(document).on("click", "#vehicle_list .icon-list-alt", function () {
        device_id = $(this).attr("device_id");
        logInfo(device_id);
    });

    //$(document).on("dblclick", "#customer_list li", function () {
    //    // 获取客户信息
    //    cust_id = parseInt($(this).attr("cust_id"));
    //    customerInfo(cust_id);
    //});

    $("#checkAll").click(function () {
        //alert($('#checkAll').prop("checked"));
        $("[type='checkbox']").prop("checked", $('#checkAll').prop("checked"));//全选
    });

    $("#searchVehicle").click(function () {
        vehicleQuery(uid, tree_path);
    });

    $('#vehicleKey').keydown(function(e){
        var curKey = e.which;
        if(curKey == 13){
            vehicleQuery(uid, tree_path);
            return false;
        }
    });

    $('#dataKey').keydown(function(e){
        var curKey = e.which;
        if(curKey == 13){
            $('#vehicle_list').dataTable( {
                "search": {
                    "search": $('#dataKey').val()
                }
            });
        }
    });

    $("#sendMessage").click(function () {
        if(parent_cust_id == 0){
            alert("请选择用户");
            return;
        }
        if($("#content").val() == "输入要发送的内容"){
            alert("请输入消息内容");
            $("#content").focus();
            return;
        }
        var ExitMsg = "你确定向该用户发送消息吗？";
        if (CloseConfirm(ExitMsg)) {
            var parent_customer = getLocalCustomerInfo(parent_cust_id);
            var content = $("#content").val();
            if(parent_cust_id == 1){
                messageBroadCast(cust_id, cust_name, content);
            }else{
                messageSend(parent_cust_id, parent_customer.cust_name, cust_id, content);
            }
        }
    });

    $("#addCustomer").click(function () {
        var title = "新增客户";
        initFrmCustomer(title, 1, "", "", "", 1, "", "", "1");
        validator_customer.resetForm();
        $("#divCustomer").dialog("open");
    });

    $("#dealer_name").click(function () {
        initFrmAccount("我的账户");
        $("#divAccount").dialog("open");
    });

    $("#addVehicle").click(function () {
        if(uid == 0){
            alert("请选择客户。");
            return;
        }
        var service_end_date = new Date();
        service_end_date = new Date(Date.parse(service_end_date) + (86400000 * 31));
        service_end_date = service_end_date.format("yyyy-MM-dd");
        initFrmVehicle("新增目标(所属用户: " + cust_name + ")", 1, "", "", "", "", service_end_date);
        validator_vehicle.resetForm();
        $("#divVehicle").dialog("open");
    });

    // Dialog Simple
    $('#divCustomer').dialog({
        autoOpen:false,
        width:650,
        buttons:{
            "保存":function () {
                $('#frmCustomer').submit();
            },
            "取消":function () {
                validator_customer.resetForm();
                $(this).dialog("close");
            }
        }
    });

    $("#frmCustomer").submit(function () {
        if ($('#frmCustomer').valid()) {
            if (customer_flag == 1) {
                customerAdd();
            } else {
                customerEdit();
            }
        }
        return false;
    });

    // 更换所属用户窗口
    $('#divCustomerList').dialog({
        autoOpen:false,
        width:650,
        buttons:{
            "保存":function () {
                $('#frmCustomerList').submit();
            },
            "取消":function () {
                $(this).dialog("close");
            }
        }
    });

    $('#frmCustomerList').submit(function () {
        var obj_id = parseInt($("#change_obj_id").val());
        var cust_id = parseInt($("#change_cust_id").val());
        vehicleChangeCustomer(obj_id, cust_id);
        return false;
    });

    // Dialog Simple
    $('#divVehicle').dialog({
        autoOpen:false,
        width:650,
        buttons:{
            "保存":function () {
                $('#frmVehicle').submit();
            },
            "取消":function () {
                validator_vehicle.resetForm();
                $(this).dialog("close");
            }
        }
    });

    $('#frmVehicle').submit(function () {
        if ($('#frmVehicle').valid()) {
            if(vehicle_flag == 1){
                vehicleAdd();
            }else{
                vehicleEdit();
            }
        }
        return false;
    });

    // Dialog Simple
    $('#divAccount').dialog({
        autoOpen:false,
        width:650,
        buttons:{
            "保存":function () {
                $('#frmAccount').submit();
            },
            "取消":function () {
                validator_vehicle.resetForm();
                $(this).dialog("close");
            }
        }
    });

    $('#frmAccount').submit(function () {
        if ($('#frmAccount').valid()) {
                AccountEdit();
        }
        return false;
    });

    $("#searchCustomer").click(function () {
        // customerQuery();
        var treeObj = $.fn.zTree.getZTreeObj("customerTree");
        var node = treeObj.getNodeByParam("name", $('#customerKey').val(), null);
        treeObj.selectNode(node);
        $('#selCustName').html(node.name);
        vehicleQuery(node.id, '');
    });

    $('#customerKey').keydown(function(e){
        var curKey = e.which;
        if(curKey == 13){
            //alert('ok');
            //customerQuery();
            // var customer = searchLocalCustomerInfoByName($('#customerKey').val());
            // if(customer){
            //     var node = $('#customerTree').tree('getNodeById', customer.cust_id);
            //     $('#customerTree').tree('scrollToNode', node);
            //     $('#customerTree').tree('selectNode', node);
            //     vehicleQuery(customer.cust_id, customer.tree_path);
            // }
            // return false;
            $("#searchCustomer").click();
            return false;
        }
    });

    $('#service').change(function(){
        var service_type = parseInt($(this).children('option:selected').val());
        var day = 0;
        switch(service_type){
            case 1: day = 31; break;
            case 2: day = 93; break;
            case 3: day = 182; break;
            case 4: day = 365; break;
            case 5: day = 730; break;
        }
        var service_end_date = new Date();
        service_end_date = new Date(Date.parse(service_end_date) + (86400000 * day));
        service_end_date = service_end_date.format("yyyy-MM-dd");
        $('#service_end_date').val(service_end_date);
    });

    validator_customer = $('#frmCustomer').validate(
        {
            rules:{
                username:{
                    minlength:4,
                    required:true,
                    remote:{
                        url:"/exists", //后台处理程序
                        type:"get", //数据发送方式
                        dataType:"json", //接受数据格式
                        data:{
                            auth_code:function () {
                                return $.cookie('auth_code');
                            },
                            query_type:function () {
                                return 6;
                            },
                            value:function () {
                                return $('#username').val();
                            }
                        }
                    }
                },
                password:{
                    minlength:6,
                    required:true
                },
                password2:{
                    minlength:6,
                    required:true,
                    equalTo:"#password"
                },
                cust_name:{
                    minlength:4,
                    required:true,
                    remote:{
                        url:"/exists", //后台处理程序
                        type:"get", //数据发送方式
                        dataType:"json", //接受数据格式
                        data:{
                            auth_code:function () {
                                return $.cookie('auth_code');
                            },
                            query_type:function () {
                                return 5;
                            },
                            old_value:function () {
                                return edit_cust_name;
                            },
                            value:function () {
                                return $('#cust_name').val();
                            }
                        }
                    }
                }
            },
            messages:{
                username:{minlength:"登陆账号必须超过4个字符", required:"请输入登陆账号", remote:"登陆账号已存在"},
                password:{minlength:"登录密码必须超过6个字符", required:"请输入登录密码"},
                password2:{required:"请输入确认密码", minlength:"确认密码必须超过6个字符", equalTo:"两次输入密码不一致"},
                cust_name:{minlength:"客户名称必须超过4位", required:"请输入客户名称", remote:"客户名称已存在"}
            },
            highlight:function (element) {
                $(element).closest('.control-group').removeClass('success').addClass('error');
            },
            success:function (element) {
                element
                    .text('OK!').addClass('valid')
                    .closest('.control-group').removeClass('error').addClass('success');
                //alert('success');
            }
        });

    validator_vehicle = $('#frmVehicle').validate(
        {
            rules:{
                obj_name:{
                    minlength:4,
                    required:true,
                    remote:{
                        url:"/exists", //后台处理程序
                        type:"get", //数据发送方式
                        dataType:"json", //接受数据格式
                        data:{
                            auth_code:function () {
                                return $.cookie('auth_code');
                            },
                            query_type:function () {
                                return 4;
                            },
                            value:function () {
                                return $('#obj_name').val();
                            },
                            old_value:function(){
                                return edit_obj_name;
                            }
                        }
                    }
                },
                device_id:{
                    minlength:6,
                    required:true,
                    remote:{
                        url:"exists", //后台处理程序
                        type:"get", //数据发送方式
                        dataType:"json", //接受数据格式
                        data:{
                            auth_code:function () {
                                return $.cookie('auth_code');
                            },
                            query_type:function () {
                                return 2;
                            },
                            value:function () {
                                return $('#device_id').val();
                            }
                        }
                    }
                },
                sim:{
                    rangelength:[11, 13],
                    required:true,
                    remote:{
                        url:"exists", //后台处理程序
                        type:"get", //数据发送方式
                        dataType:"json", //接受数据格式
                        data:{
                            auth_code:function () {
                                return $.cookie('auth_code');
                            },
                            query_type:function () {
                                return 1;
                            },
                            value:function () {
                                return $('#sim').val();
                            },
                            old_value: function(){
                                return edit_sim;
                            }
                        }
                    }
                },
                serial:{
                    remote:{
                        url:"/exists", //后台处理程序
                        type:"get", //数据发送方式
                        dataType:"json", //接受数据格式
                        data:{
                            auth_code:function () {
                                return $.cookie('auth_code');
                            },
                            query_type:function () {
                                return 3;
                            },
                            value:function () {
                                return $('#serial').val();
                            },
                            old_value: function(){
                                return edit_serial;
                            }
                        }
                    }
                }
            },
            messages:{
                obj_name:{minlength:"目标名称必须超过4位", required:"请输入目标名称", remote:"目标名称已存在"},
                device_id:{minlength:"设备ID必须超过6位", required:"请输入设备ID", remote:"设备ID已被其他目标绑定"},
                sim:{rangelength:"SIM卡号必须为11到13位", required:"请输入SIM卡号", remote:"SIM卡号已被其他目标使用"},
                serial:{remote:"终端条码已存在"}
            },
            highlight:function (element) {
                $(element).closest('.control-group').removeClass('success').addClass('error');
            },
            success:function (element) {
                element
                    .text('OK!').addClass('valid')
                    .closest('.control-group').removeClass('error').addClass('success');
                //alert('success');
            }
        });

    validator_account = $('#frmAccount').validate(
        {
            rules:{
                account_old_password:{
                    minlength:6,
                    required:true
                },
                account_password:{
                    minlength:6,
                    required:true
                },
                account_password2:{
                    minlength:6,
                    required:true,
                    equalTo:"#account_password"
                }
            },
            messages:{
                account_old_password:{minlength:"密码必须超过6位", required:"请输入旧密码"},
                account_password:{minlength:"登录密码必须超过6个字符", required:"请输入登录密码"},
                account_password2:{required:"请再次输入确认密码", minlength:"确认密码必须超过6个字符", equalTo:"两次输入密码不一致"}
            },
            highlight:function (element) {
                $(element).closest('.control-group').removeClass('success').addClass('error');
            },
            success:function (element) {
                element
                    .text('OK!').addClass('valid')
                    .closest('.control-group').removeClass('error').addClass('success');
                //alert('success');
            }
        });
});