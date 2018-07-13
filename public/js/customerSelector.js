/**
 * 客户选择框
 * Author: Eiby
 * Time: 2017-03-15
 * Desc: 用于其他页面选择客户之用
 */

var treeIcon = {
    '1': '/img/dealer_icon.png',
    '2': '/img/dealer_icon.png',
    '7': '/img/person_icon.png',
    '8': '/img/company_icon.png'
};

var customerSelector = function(input, onSelect){
    this.div = null;
    this.ul = null;
    this.input = input;
    this.uid = 0;
    this.showed = false;
    this.treeObj = null;
    this.selectedNode = null;
    this.onSelect = onSelect;
};

customerSelector.prototype.show = function(){
    this.div.style.display = 'block';
    this.showed = true;
};

customerSelector.prototype.hide = function(){
    this.div.style.display = 'none';
    this.showed = false;
};

customerSelector.prototype.init = function(){
    //创建选择框
    this.createDiv();

    // 初始化数据
    this.getData();

    //给input框绑定时间
    var _this = this;
    this.input.click(function (event) {
        event = event || window.event;
        event.stopPropagation();
        _this.div.style.left = _this.input.offset().left + 'px';
        _this.div.style.top = _this.input.offset().top + _this.input.height() + 11 + 'px';
        _this.div.style.width = _this.input.width() + 8 + 'px';
        _this.show();
    });

    this.input.keyup(function (e) {
        var curKey = e.which;
        if(!_this.showed && curKey != 13){
            _this.show();
        }
        function filter(node) {
            var key = _this.input.val();
            return (node.pId > 0 && key != "" && node.name.indexOf(key)>-1);
        }
        var node = _this.treeObj.getNodesByFilter(filter, true); // 仅查找一个节点
        if(node){
            _this.treeObj.selectNode(node);
            _this.selectedNode = node;
        }
        _this.input.focus();
    });

    this.input.keydown(function(e) {
        var curKey = e.which;
        if (curKey == 13) {
            _this.uid = _this.selectedNode.id;
            _this.input.val(_this.selectedNode.name);
            if(_this.onSelect){
                _this.onSelect(_this.uid, _this.selectedNode.name);
            }
            _this.hide();
        }
    });

    this.input.blur(function () {
        if(!_this.showed){
            _this.hide();
        }
    });

    $(_this.div).click(function(event){
        event = event || window.event;
        event.stopPropagation();
    });

    $(document).click(function(e){
        _this.hide();
    });
};

customerSelector.prototype.createDiv = function(){
    var div = document.createElement('div');
    div.className = 'customerSelector';
    div.id = 'customerSelectorDiv';
    div.style.position = 'absolute';
    div.style.display = 'none';
    var ul = document.createElement('ul');
    ul.id = 'customerSelector';
    ul.className = 'ztree';
    this.ul = ul;
    div.appendChild(ul);
    this.div = div;
    document.body.appendChild(div);
};

customerSelector.prototype.getData = function(){
    var dealer_id = $.cookie('dealer_id');
    var tree_path = $.cookie('tree_path');
    var query_json = {
        // parentId: dealer_id
        treePath: '^' + tree_path
    };
    var _this = this;
    wistorm_api._list('customer', query_json, 'objectId,name,treePath,parentId,uid,custType', 'custType,name', '-createdAt', 0, 0, 1, -1, auth_code, true, function(json){
        var onCustomerSelectClick = function(event, treeId, treeNode){
//        alert(treeNode.tree_path);
            if(treeNode.pId || treeNode.id == $.cookie('dealer_id')){
                _this.uid = treeNode.id;
                _this.input.val(treeNode.name);
                if(_this.onSelect){
                    _this.onSelect(_this.uid, treeNode.name);
                }
                _this.hide();
            }
        };

        var setting = {
            view: {showIcon: true},
            check: {enable: false, chkStyle: "checkbox"},
            data: {simpleData: {enable: true}},
            callback: {onClick: onCustomerSelectClick}
        };


        var selectArray = [];
        var uid = $.cookie('dealer_id');
        // selectArray.push({
        //     open: true,
        //     id: $.cookie('dealer_id'),
        //     pId: 0,
        //     name: '我的目标',
        //     icon: '/img/customer.png'
        // });
        // if($.cookie('dealer_type') == 1 || $.cookie('dealer_type') == 11){
        //     selectArray.push({
        //         open: true,
        //         id: '2',
        //         pId: 0,
        //         name: '代理商',
        //         icon: '/img/customer.png'
        //     });
        // }
        //
        // if($.cookie('dealer_type') == 1 || $.cookie('dealer_type') == 11 || $.cookie('dealer_type') == 2 || $.cookie('dealer_type') == 8) {
        //     selectArray.push({
        //         open: false,
        //         id: '8',
        //         pId: 0,
        //         name: '集团用户',
        //         icon: '/img/customer.png'
        //     });
        //     selectArray.push({
        //         open: false,
        //         id: '7',
        //         pId: 0,
        //         name: '个人用户',
        //         icon: '/img/customer.png'
        //     });
        // }

        // 创建三个分类的根节点
        for (var i = 0; i < json.data.length; i++) {
            selectArray.push({
                open: false,
                id: json.data[i]['uid'],
                pId: json.data[i]['parentId'],
                name: json.data[i]['name'],
                icon: treeIcon[json.data[i]['custType']]
            });
        }
        _this.treeObj = $.fn.zTree.init($(_this.ul), setting, selectArray);
    });
};