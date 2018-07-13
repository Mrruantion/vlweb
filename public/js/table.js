/**
 * 数据列表控件
 * Author: Eiby
 * Time: 2017-03-14
 * Desc: 用于其他页面创建自定义表格
 */

/*
构造函数
参数:
div: 容器元素实例
tableName: 操作的数据表名称
fields: 操作及显示的字段
{
    title: '报警类型',    //列表题
    width: '20px',       //宽度
    name: 'alertType',   //列对应的字段
    className: 'center', //列对应的类名
    display: '',         //显示类型
         TextBox: 文本框
         CheckBox: 选择框
         ButtonTextBox: 带按钮文本框
         Select: 选择框
         DatePicker: 日期选择框
         TimePicker: 时间选择框
         DateTimePicker: 日期时间选择框
         UserDefined: 自定义  如果为自定义, 则需要传入render函数
         None: 不显示
    render: function (obj) {}
}
searchElem: 搜索框对应实例
searchField: 搜索字段
listButtons: 操作按钮
{
    get: true,
    edit: true,
    delete: true
}
userDefineButtons:
[
{
    title: '处理',
    className: 'icon-check'
}
]
 */

var _dataTable = function (div, tableName, fields, condition, sort, searchElem, searchField, listButtons, userDefineButtons, lookup) {
    this.div = div;
    this._table = null;
    this.tableElem = null;
    this.tableName = tableName;
    this.fields = fields;
    this.condition = condition;
    this.lookup = lookup;
    this.sort = sort;
    this.sFields = '';
    this.exportObj = {
        fields: '',
        titles: '',
        displays: '',
        map: 'BAIDU'
    };
    this.exportUrl = '';
    this.searchElem = searchElem;
    this.searchField = searchField;
    this.listButtons = listButtons;
    this.userDefineButtons = userDefineButtons;
};

_dataTable.prototype.setExportFields = function (fields) {
    this.exportObj.fields = fields;
};

_dataTable.prototype.setExportTitles = function (titles) {
    this.exportObj.titles = titles;
};

_dataTable.prototype.setExportDisplays = function (displays) {
    this.exportObj.displays = displays;
};

_dataTable.prototype.setExportMap = function (map) {
    this.exportObj.map = map;
};

_dataTable.prototype.createHeader = function () {
    this.clear();
    var table = document.createElement('table');
    table.id = this.tableName + '_list';
    table.className = 'table table-hover table-striped table-bordered';
    table.style.width = '100%';
    // 创建表头
    var thead = document.createElement('thead');
    var tr = document.createElement('tr');
    for (var i = 0; i < this.fields.length; i++) {
        var th = document.createElement('th');
        th.style.width = this.fields[i].width;
        if (this.fields[i].display === 'CheckBox') {
            th.innerHTML = '<input id="checkAll" type="checkbox">';
        } else if (this.fields[i].display !== 'None') {
            th.innerHTML = this.fields[i].title;
        }
        if (this.fields[i].display !== 'None') {
            tr.appendChild(th);
            this.exportObj.fields += this.fields[i].name + ',';
            this.exportObj.titles += this.fields[i].title + ',';
        }
        this.sFields += this.fields[i].name + ',';
    }
    if (this.exportObj.fields !== '') {
        this.exportObj.fields = this.exportObj.fields.substr(0, this.exportObj.fields.length - 1);
    }
    if (this.exportObj.titles !== '') {
        this.exportObj.titles = this.exportObj.titles.substr(0, this.exportObj.titles.length - 1);
    }
    if (this.listButtons.show) {
        var th = document.createElement('th');
        th.style.width = '100px';
        th.innerHTML = i18next.t("table.op") || '操作';
        tr.appendChild(th);
    }
    thead.appendChild(tr);
    table.appendChild(thead);
    // 创建表体
    var tbody = document.createElement('tbody');
    table.appendChild(tbody);
    this.tableElem = table;
    this.div.append(table);
};

_dataTable.prototype.fnServerData = function (query, afterSend, beforeSend, lookup) {
    var _this = this;
    var _query = query ? query : this.condition;
    var _lookup = lookup ? lookup : this.lookup;
    return function retrieveData(sSource, aoData, fnCallback) {
        if (_this.tableName == '') {
            var page_count = aoData[4].value;
            var page_no = (aoData[3].value / page_count) + 1;
            var json = {};
            json.page_count = page_count;
            json.page_no = page_no;
            json.sEcho = aoData[0].value;
            json.iTotalRecords = 0;
            json.iTotalDisplayRecords = 0;
            json.aaData = [];

            if (beforeSend) {
                beforeSend(json, fnCallback); //发送之前对处理进行处理
            } else {
                fnCallback(json); //服务器端返回的对象的returnObject部分是要求的格式
            }
            if (afterSend) {
                afterSend(json);
            }
        } else {
            var auth_code = $.cookie('auth_code');
            var page_count = aoData[4].value;
            var page_no = (aoData[3].value / page_count) + 1;
            var sort = _this.sort;
            if (aoData[10].value > 0) {
                if (aoData[11].value === 'asc') {
                    sort = _this.fields[aoData[10].value].name;
                } else {
                    sort = '-' + _this.fields[aoData[10].value] ? sort : _this.fields[aoData[10].value].name ;
                }
            }
            var url = '';
            if (_lookup) {
                url = wistorm_api._lookupUrl(_this.tableName, _lookup, _query, _this.sFields, sort, sort, page_no, page_count, auth_code, true);
            } else {
                url = wistorm_api._listUrl(_this.tableName, _query, _this.sFields, sort, sort, 0, 0, page_no, page_count, auth_code, true);
            }
            if (_this.exportObj.displays !== '') {
                _this.exportUrl = wistorm_api._exportUrl(_this.tableName, _query, _this.exportObj.fields, _this.exportObj.titles, _this.exportObj.displays, sort, sort, _this.exportObj.map || 'BAIDU', auth_code);
            }
            $.ajax({
                "type": "GET",
                "contentType": "application/json",
                "url": url,
                "dataType": "json",
                "data": null, //以json格式传递
                "success": function (json) {
                    json.sEcho = aoData[0].value;
                    json.iTotalRecords = json.total;
                    json.iTotalDisplayRecords = json.total;
                    json.aaData = json.data;
                    // 设置导出按钮是否显示
                    if ($('#export').length > 0) {
                        if (_this.exportUrl === '' || json.total === 0) {
                            $('#export').hide();
                        } else {
                            $('#export').show();
                        }
                    }
                    if (beforeSend) {
                        beforeSend(json, fnCallback); //发送之前对处理进行处理
                    } else {
                        fnCallback(json); //服务器端返回的对象的returnObject部分是要求的格式
                    }
                    if (afterSend) {
                        afterSend(json);
                    }
                }
            });
        }

    }
};

_dataTable.prototype.query = function (query, afterSend, beforeSend, lookup) {
    var _columns = [];
    for (var i = 0; i < this.fields.length; i++) {
        var col = {};
        if (this.fields[i].display == 'CheckBox') {
            var getRender = function (name) {
                var _name = name;
                return function (obj) {
                    var data = obj.aData ? obj.aData : obj;
                    return "<input type='checkbox' value='" + data[_name] + "'>";
                };
            };
            var render = getRender(this.fields[i].name);
            col = {
                "mData": null,
                "sClass": this.fields[i].className,
                "bSortable": false,
                "fnRender": render
            };
        } else if (this.fields[i].display == 'UserDefined') {
            col = {
                "mData": null,
                "sClass": this.fields[i].className,
                "fnRender": this.fields[i].render
            };
        } else {
            col = {
                "mData": this.fields[i].name,
                "sClass": this.fields[i].className
            };
        }
        if (this.fields[i].display != 'None') {
            _columns.push(col);
        }
    }
    var getButtonRender = function (obj) {
        var _listButtons = obj.listButtons || { edit: true, delete: true };
        var _userDefineButtons = obj.userDefineButtons;
        return function (obj) {
            var html = '';
            var data = obj.aData ? obj.aData : obj;
            if (_listButtons.edit) {
                html += "<a href='#' title='" + i18next.t("table.edit") + "'><i class='icon-edit' objectId='" + data.objectId + "'></i></a>&nbsp&nbsp";
            }
            if (_listButtons.delete) {
                html += "<a href='#' title='" + i18next.t("table.delete") + "'><i class='icon-remove' objectId='" + data.objectId + "'></i></a>&nbsp&nbsp";
            }
            if (_userDefineButtons && _userDefineButtons.length > 0) {
                for (var i = 0; i < _userDefineButtons.length; i++) {
                    html += "<a href='#' title='" + _userDefineButtons[i].title + "'><i class='" + _userDefineButtons[i].className + "' objectId='" + data.objectId + "'></i></a>&nbsp&nbsp";
                }
            }
            return html;
        };
    };
    if (this.listButtons.show) {
        var render = getButtonRender(this);
        var buttonCol = {
            "mData": null,
            "sClass": "center",
            "bSortable": false,
            "fnRender": render
        };
        _columns.push(buttonCol);
    }

    var lang = i18next.language || 'en';
    var objTable = {
        "bDestroy": true,
        "bInfo": false,
        "iDisplayLength": 10,
        "bLengthChange": false,
        "bProcessing": true,
        "bServerSide": true,
        "bFilter": false,
        "aoColumns": _columns,
        "sDom": "<'row'r>t<'row'<'pull-right'p>>",
        "sPaginationType": "bootstrap",
        "oLanguage": { "sUrl": 'css/' + lang + '.txt' },
        "sAjaxSource": "",
        "fnServerData": this.fnServerData(query, afterSend, beforeSend, lookup)
    };
    this._table = $(this.tableElem).dataTable(objTable);
    if (_tableResize) {
        setTimeout(function () {
            _tableResize();
        }, 1000);
    }
};

_dataTable.prototype.clear = function () {
    this.div.html('');
};

_dataTable.prototype.add = function () {

};

_dataTable.prototype.edit = function () {

};

_dataTable.prototype.delete = function () {

};
