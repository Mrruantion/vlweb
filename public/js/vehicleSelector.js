/**
 * 目标选择框
 * Author: Eiby
 * Time: 2017-03-15
 * Desc: 用于其他页面选择目标之用
 */

var vehicleSelector = function (input, onSelect) {
    this.div = null;
    this.ul = null;
    this.input = input;
    this.vehicleId = 0;
    this.did = '';
    this.workType = 0; //设备类型
    this.showed = false;
    this.treeObj = null;
    this.selectedNode = null;
    this.loading = false;
    this.onSelect = onSelect;
};

vehicleSelector.prototype.show = function () {
    this.div.style.display = 'block';
    this.showed = true;
};

vehicleSelector.prototype.hide = function () {
    this.div.style.display = 'none';
    this.showed = false;
};

vehicleSelector.prototype.init = function () {
    this.loading = true;
    //创建选择框
    this.createDiv();

    // 初始化数据
    // this.getData();

    //给input框绑定时间
    var _this = this;
    this.input.click(function (event) {
        event = event || window.event;
        event.stopPropagation();
        _this.div.style.left = _this.input.offset().left + 'px';
        _this.div.style.top = _this.input.offset().top + _this.input.height() + 11 + 'px';
        _this.div.style.width = _this.input.width() + 5 + 'px';
        if (!_this.loading) {
            _this.show();
        }
    });

    this.input.keyup(function (e) {
        if (!_this.treeObj) {
            return;
        }
        var curKey = e.which;
        // if(!_this.showed && curKey != 13){
        //     if(!_this.loading){
        //         _this.show();
        //     }
        // }
        function filter(node) {
            var key = _this.input.val().toUpperCase();
            return (node.pId > 0 && key != "" && node.name.indexOf(key) > -1);
        }
        var node = _this.treeObj.getNodesByFilter(filter, true); // 仅查找一个节点
        if (node) {
            _this.treeObj.selectNode(node);
            _this.selectedNode = node;
        }
        _this.input.focus();
    });

    this.input.keydown(function (e) {
        if (!_this.treeObj) {
            return;
        }
        var curKey = e.which;
        if (curKey == 13) {
            var key = _this.input.val();
            if (_this.selectedNode && key !== '') {
                _this.vehicleId = _this.selectedNode.id;
                _this.did = _this.selectedNode.did;
                _this.workType = _this.selectedNode.workType || 0;
                _this.objectType = _this.selectedNode.objectType || 0;
                _this.input.val(_this.selectedNode.name);
                if (_this.onSelect) {
                    _this.onSelect(_this.vehicleId, _this.did, _this.selectedNode.name, _this.workType, _this.objectType);
                }
            } else {
                _this.onSelect('', '', '', 0);
            }
            _this.hide();
        }
    });

    this.input.blur(function () {
        if (!_this.showed) {
            _this.hide();
        }
    });

    $(_this.div).click(function (event) {
        event = event || window.event;
        event.stopPropagation();
    });

    $(document).click(function (e) {
        _this.hide();
    });
    this.loading = false;
};

vehicleSelector.prototype.createDiv = function () {
    var div = document.createElement('div');
    var r = parseInt(Math.random() * 10);
    div.className = 'customerSelector';
    div.id = 'vehicleSelectorDiv' + r;
    div.style.position = 'absolute';
    div.style.display = 'none';
    var ul = document.createElement('ul');
    ul.id = 'vehicleSelector' + r;
    ul.className = 'ztree';
    this.ul = ul;
    div.appendChild(ul);
    this.div = div;
    document.body.appendChild(div);
};

vehicleSelector.prototype.getData = function (uid, name) {
    var query_json = {
        uid: uid,
        vehicleName: '<>null'
    };
    var _this = this;
    wistorm_api._list('_iotDevice', query_json, 'objectId,vehicleId,vehicleName,did,workType,objectType', '-createdAt', '-createdAt', 0, 0, 1, -1, auth_code, true, function (json) {
        var onSelectClick = function (event, treeId, treeNode) {
            //        alert(treeNode.tree_path);
            if (treeNode.pId) {
                _this.vehicleId = treeNode.id;
                _this.did = treeNode.did;
                _this.workType = treeNode.workType || 0;
                _this.objectType = treeNode.objectType;
                _this.input.val(treeNode.name);
                if (_this.onSelect) {
                    _this.onSelect(_this.vehicleId, _this.did, treeNode.name, _this.workType, _this.objectType);
                }
                _this.hide();
            }
        };

        var setting = {
            view: { showIcon: true },
            check: { enable: false, chkStyle: "checkbox" },
            data: { simpleData: { enable: true } },
            callback: { onClick: onSelectClick }
        };


        var selectArray = [];
        selectArray.push({
            open: true,
            id: '1',
            pId: 0,
            name: name,
            icon: '/img/customer.png'
        });

        // 创建三个分类的根节点
        for (var i = 0; i < json.data.length; i++) {
            selectArray.push({
                open: false,
                id: json.data[i]['vehicleId'],
                pId: '1',
                name: json.data[i]['vehicleName'],
                did: json.data[i]['did'],
                workType: json.data[i]['workType'],
                objectType: json.data[i]['objectType']
            });
        }
        _this.treeObj = $.fn.zTree.init($(_this.ul), setting, selectArray);
    });
};