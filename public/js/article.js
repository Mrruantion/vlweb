/**
 * Created with JetBrains WebStorm.
 * User: 1
 * Date: 13-8-26
 * Time: 下午11:33
 * To change this template use File | Settings | File Templates.
 */

var article_flag = 1;   //1: 新增  2: 修改
var validator_article;
var editor, mobileToolbar, toolbar;
var table_article;
var article_id = "";

// 客户详细信息
function articleInfo(_id){
    // var wistorm_api = new WiStormAPI(app_key, app_secret, 'json', '2.0', 'md5', dev_key);
    var auth_code = $.cookie('auth_code');
    var query_json = {
        _id: _id
    };
    wistorm_api._get('article', query_json, '_id,title,type,summary,author,img,content,createdAt', auth_code, true, articleInfoSuccess);
}

var articleInfoSuccess = function(json) {
    //alert(json);
    validator_article.resetForm();
    if (json.data.createdAt) {
        json.data.createdAt = NewDate(json.data.createdAt);
        json.data.createdAt = json.data.createdAt.format("yyyy-MM-dd hh:mm:ss");
    }
    initFrmArticle("编辑文章", 2, json.data.type, json.data.title, json.data.summary, json.data.author, json.data.img, json.data.content, json.data.createdAt);
    $("#divArticle").dialog("open");
};

// 初始化目标信息窗体
var initFrmArticle = function (title, flag, type, artTitle, summary, author, img, content, createdAt) {
    $("#divArticle").dialog("option", "title", title);
    article_flag = flag;
    $('#type').val(type.toString());
    $('#title').val(artTitle);
    $('#summary').val(summary);
    $('#author').val(author);
    $('#img').val(img);
    $('#imgShow').attr("src",img);
    editor.setValue(content);
    if(article_flag == 1){
        $('#pnlDate').hide();
    }else{
        $('#createdAt').val(createdAt);
        $('#createdAt').attr("disabled","disabled");
        $('#pnlDate').show();
    }
};

var article_type = ['最新活动', '公司新闻', '消息广告', '常见问题', '预留', '预留', '预留', '预留', '预留', '首页广告'];

// 数据查询
//http://admin.wisegps.cn/open/customer/active_gps_data?access_token=bba2204bcd4c1f87a19ef792f1f68404&username=gzzlyl&time=0&map_type=BAID
var names = [];
var dataQuerySuccess = function (json) {
    for (var i = 0; i < json.data.length; i++) {
        if (json.data[i].createdAt != undefined) {
            json.data[i].createdAt = NewDate(json.data[i].createdAt);
            json.data[i].createdAt = json.data[i].createdAt.format("yyyy-MM-dd hh:mm:ss");
        }
        json.data[i].type = article_type[json.data[i].type];
        names.push(json.data[i].title);
    }

    var _columns = [
        {"mData": "title", "sClass": "ms_left"},
        {"mData": "type", "sClass": "center"},
        {"mData": "summary", "sClass": "ms_left"},
        {"mData": "author", "sClass": "center"},
        {"mData": "createdAt", "sClass": "center"},
        {
            "mData": null, "sClass": "center", "bSortable": false, "fnRender": function (obj) {
            return "<a href='#' title='编辑'><i class='icon-edit' _id='" + obj.aData._id + "'></i></a>&nbsp&nbsp<a href='#' title='推送'><i class='icon-share' _objectId='" + obj.aData.objectId + "' _title='" + obj.aData.title + "' _summary='" + obj.aData.summary + "' _img='" + obj.aData.img + "'></i></a>&nbsp&nbsp<a href='#' title='删除'><i class='icon-remove' _id='" + obj.aData._id + "'></i></a>";
        }
        }
    ];
    var objTable = {
        "bInfo": true,
        "bLengthChange": false,
        "bProcessing": true,
        "bServerSide": false,
        "bFilter": false,
        "bSort": false,
        "aaData": json.data,
        "aoColumns": _columns,
        //"sDom":"<'row'r>t<'row'<'pull-right'p>>",
        "sPaginationType": "bootstrap",
        "oLanguage": {"sUrl": 'css/lang.txt'}
    };

    $('#articleKey').typeahead({
        source: function (query, process) {
            process(names);
        }
    });

    if (table_article) {
        table_article.fnClearTable();
        table_article.fnAddData(json.data);
    } else {
        table_article = $("#article_list").dataTable(objTable);
        windowResize();
    }
};

var articleQuery = function() {
    var dealerId = $.cookie('dealer_id');
    // var wistorm_api = new WiStormAPI(app_key, app_secret, 'json', '2.0', 'md5', dev_key);
    var key = '';
    var auth_code = $.cookie('auth_code');
    if($("#articleKey").val() != '搜索文章'){
        key = $("#articleKey").val();
    }
    var query_json;
    if(key != ""){
        query_json = {
            uid: dealerId,
            title: '^' + key
        };
    }else{
        query_json = {
            uid: dealerId
        };
    }
    wistorm_api._list('article', query_json, '_id,objectId,title,type,summary,img,author,createdAt', '-createdAt', '-createdAt', 0, 0, 1, -1, auth_code, true, dataQuerySuccess)
};

// 新增文章
var articleAdd = function () {
    var dealerId = $.cookie('dealer_id');
    var title = $("#title").val();
    var type = $("#type").val();
    var summary = $("#summary").val();
    var img = $("#img").val();
    var author = $("#author").val();
    var content = editor.getValue();
    var createdAt = new Date();
    var auth_code = $.cookie('auth_code');
    // var wistorm_api = new WiStormAPI(app_key, app_secret, 'json', '2.0', 'md5', dev_key);
    var create_json = {
        uid: dealerId,
        title: title,
        type: type,
        summary: summary,
        img: img,
        author: author,
        content: content,
        createdAt: createdAt
    };
    wistorm_api._createPost('article', create_json, auth_code, true, articleAddSuccess);
};

var articleAddSuccess = function (json) {
    if (json.status_code == 0) {
        $("#divArticle").dialog("close");
        articleQuery();
    } else {
        alert("新增文章失败，请稍后再试");
    }
};

// 修改目标
var articleEdit = function () {
    var title = $("#title").val();
    var type = $("#type").val();
    var summary = $("#summary").val();
    var img = $("#img").val();
    var author = $("#author").val();
    var content = editor.getValue();
    var createdAt = new Date();
    var auth_code = $.cookie('auth_code');
    // var wistorm_api = new WiStormAPI(app_key, app_secret, 'json', '2.0', 'md5', dev_key);
    var query_json = {
        _id: article_id
    };
    var update_json = {
        title: title,
        type: type,
        summary: summary,
        img: img,
        author: author,
        content: content,
        updatedAt: createdAt
    };
    wistorm_api._updatePost('article', query_json, update_json, auth_code, true, articleEditSuccess);
};

var articleEditSuccess = function (json) {
    if (json.status_code == 0) {
        $("#divArticle").dialog("close");
        articleQuery();
    } else {
        alert("修改文章失败，请稍后再试");
    }
};

// 新增目标
var articleDelete = function (_id) {
    // var wistorm_api = new WiStormAPI(app_key, app_secret, 'json', '2.0', 'md5', dev_key);
    var query_json = {
        _id: article_id
    };
    var auth_code = $.cookie('auth_code');
    wistorm_api._delete('article', query_json, auth_code, true, articleDeleteSuccess);
};

var articleDeleteSuccess = function (json) {
    if (json.status_code == 0) {
        articleQuery();
    } else {
        _alert("删除文章失败，请稍后再试");
    }
};

function windowResize() {
    //高度变化改变(要重新计算_browserheight)
    windowHeight = $(window).height() - 215;
    // 如果宽度小于390，则设置表格为简易显示模式，并且客户列表高度改为300px
    windowWidth = $(window).width();
}

$(document).ready(function () {
    $("#alert").hide();

    // Initialize placeholder
    $.Placeholder.init();

    Simditor.locale = 'en-US';
    toolbar = ['title', 'bold', 'italic', 'underline', 'color', '|', 'ol', 'ul', 'blockquote', '|', 'link', 'image', 'hr', '|', 'indent', 'outdent', 'alignment'];
    mobileToolbar = ["bold", "underline", "strikethrough", "color", "ul", "ol"];
    if (mobilecheck()) {
        toolbar = mobileToolbar;
    }
    editor = new Simditor({
        textarea: $('#content'),
        placeholder: '这里输入文字...',
        toolbar: toolbar,
        pasteImage: true,
        defaultImage: 'assets/images/image.png',
        upload: location.search === '?upload' ? {
            url: '/upload'
        } : false
    });

    windowResize();

    g_AjxUploadImg($("#image"), $("#imgShow"), $("#img"));

    // 加载文章
    articleQuery();

    $("#addArticle").click(function () {
        initFrmArticle("新增文章", 1, 0, "", "", "", "/img/no_photo.png", "");
        validator_article.resetForm();
        $("#divArticle").dialog("open");
    });

    $('#divArticle').dialog({
        autoOpen: false,
        width: 1000,
        buttons: {
            "保存": function () {
                $('#frmArticle').submit();
            },
            "取消": function () {
                validator_article.resetForm();
                $(this).dialog("close");
            }
        }
    });

    $('#frmArticle').submit(function () {
        if ($('#frmArticle').valid()) {
            if (article_flag == 1) {
                articleAdd();
            } else {
                articleEdit();
            }
        }
        return false;
    });

    validator_article = $('#frmArticle').validate(
        {
            rules: {
                title: {
                    required: true
                },
                summary: {
                    required: true
                },
                author: {
                    required: true
                },
                content: {
                    minlength: 10,
                    required: true
                }
            },
            messages: {
                title: {required: "请输入文章标题"},
                summary: {required: "请输入文章概要"},
                author: {required: "请输入作者"},
                content: {minlength: "文章内容不能小于10个字", required: "请输入文章内容"}
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

    //图片上传
    function g_AjxUploadImg(btn, img, hidPut) {
        var wistorm_api = new WiStormAPI(app_key, app_secret, 'json', '2.0', 'md5', dev_key);
        console.log(window.location.href);
        var uploadUrl = wistorm_api.upload(location.origin + '/callback');
        var button = btn, interval;
        // new AjaxUpload(button, {
        //     action: uploadUrl,
        //     data: {},
        //     name: 'image',
        //     responseType: true,
        //     onSubmit: function(file, ext) {
        //         if (!(ext && /^(jpg|JPG|png|PNG|gif|GIF)$/.test(ext))) {
        //             alert("您上传的图片格式不对，请重新选择！");
        //             return false;
        //         }
        //     },
        //     onComplete: function(file, response) {
        //         flagValue = response;
        //         if (flagValue == "1") {
        //             alert("您上传的图片格式不对，请重新选择！");
        //         }
        //         else if (flagValue == "2") {
        //             alert("您上传的图片大于200K，请重新选择！");
        //         }
        //         else if (flagValue == "3") {
        //             alert("图片上传失败！");
        //         }
        //         else {
        //             hidPut.value = response;
        //             img.src = response;
        //         }
        //     }
        // });
        $('#image').change(function () {
            $.ajaxFileUpload({
                url:uploadUrl,
                secureuri:false,
                dataType: 'json',
                fileElementId:'image',//file标签的id
                data:{},//一同上传的数据
                success: function (data, status) {
                    //把图片替换
                    $('#img').val(data.small_file_url);
                    $('#imgShow').attr("src",data.small_file_url);
                },
                error: function (data, status, e) {
                    alert(e);
                }
            });
        });

        $('#btnUpload').click(function () {
            $('#image').click();
        });

        // //实现图片慢慢浮现出来的效果
        // $("img").load(function () {
        //     //图片默认隐藏
        //     $(this).hide();
        //     //使用fadeIn特效
        //     $(this).fadeIn("5000");
        // });
        // // 异步加载图片，实现逐屏加载图片
        // $(".scrollLoading").scrollLoading();
    }

    $(document).on("click", "#article_list .icon-remove", function () {
        article_id = $(this).attr("_id");
        if (CloseConfirm('你确认删除选择文章吗？')) {
            articleDelete(article_id);
        }
    });

    $(document).on("click", "#article_list .icon-edit", function () {
        article_id = $(this).attr("_id");
        articleInfo(article_id);
    });

    $(document).on("click", "#article_list .icon-share", function () {
        if (CloseConfirm('你确认群发此消息吗？')) {
            var id = $(this).attr("_objectId");
            var title = $(this).attr("_title");
            var summary = $(this).attr("_summary");
            var img = $(this).attr("_img");
            var data = {
                type: 0,  //0:通知 1:报警
                subType: 0, //type为0时, subType:0 最新活动 1 公司新闻 2 消息公告,  type为1时, subType为报警类型
                id: parseInt(id),
                title: title,
                summary: summary,
                img: img
            };
            wistorm_api.sendPush('', title, summary, img, data, function(obj){
                if (obj.status_code == 0) {
                    _ok("群发消息成功");
                } else {
                    _alert("群发消息失败，请稍后再试");
                }
            });
        }
    });

    $('#articleKey').keydown(function(e){
        var curKey = e.which;
        if(curKey == 13){
            articleQuery();
            return false;
        }
    });
});


