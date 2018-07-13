// function csMenu(_object, _menu) {
//     this.IEventHander = null;
//     this.IFrameHander = null;
//     this.IContextMenuHander = null;

//     this.Show = function (_menu) {
//         var e = window.event || event;
//         // if (e.button == 2) { //button == 2莳为右键
//         if (window.document.all) { //兼容ie
//             this.IContextMenuHander = function () {
//                 // console.log(e.target)
//                 return false;
//             };
//             document.attachEvent("oncontextmenu", this.IContextMenuHander);
//         }
//         else {
//             this.IContextMenuHander = document.oncontextmenu;
//             document.oncontextmenu = function () {
//                 // console.log(e.target)
//                 // if(e.target.id )
//                 return false;
//             };
//         }

//         window.csMenu$Object = this;
//         this.IEventHander = function () { window.csMenu$Object.Hide(_menu); };

//         if (window.document.all) //兼容ie
//             document.attachEvent("onmousedown", this.IEventHander);
//         else
//             document.addEventListener("mousedown", this.IEventHander, false);

//         _menu.style.left = e.clientX + 'px';
//         _menu.style.top = e.clientY + 'px';
//         _menu.style.display = "";

//         if (this.IFrameHander) { //
//             var _iframe = document.getElementById(this.IFrameHander);
//             _iframe.style.left = e.clientX;
//             _iframe.style.top = e.clientY;
//             _iframe.style.height = _menu.offsetHeight;
//             _iframe.style.width = _menu.offsetWidth;
//             _iframe.style.display = "";
//         }
//         // }
//     };

//     this.Hide = function (_menu) {
//         var e = window.event || event;
//         var _element = e.srcElement;
//         do {
//             if (_element == _menu) {
//                 return false;
//             }
//         }
//         while ((_element = _element.offsetParent));

//         if (window.document.all)
//             document.detachEvent("on" + e.type, this.IEventHander);
//         else
//             document.removeEventListener(e.type, this.IEventHander, false);

//         if (this.IFrameHander) {
//             var _iframe = document.getElementById(this.IFrameHander);
//             _iframe.style.display = "none";
//         }

//         _menu.style.display = "none";

//         if (window.document.all) //兼容ie
//             document.detachEvent("oncontextmenu", this.IContextMenuHander);
//         else
//             document.oncontextmenu = this.IContextMenuHander;
//     };

//     this.initialize = function (_object, _menu) {
//         window._csMenu$Object = this;
//         var _eventHander = function (e) {
//             // console.log(e)
//             if (e.button == 2) {
//                 window._csMenu$Object.Show(_menu);
//             }

//         };

//         _menu.style.position = "absolute";
//         _menu.style.display = "none";
//         _menu.style.zIndex = "1000000";

//         if (window.document.all) {
//             var _iframe = document.createElement('iframe');
//             document.body.insertBefore(_iframe, document.body.firstChild);
//             _iframe.id = _menu.id + "_iframe";
//             this.IFrameHander = _iframe.id;

//             _iframe.style.position = "absolute";
//             _iframe.style.display = "none";
//             _iframe.style.zIndex = "999999";
//             _iframe.style.border = "0px";
//             _iframe.style.height = "0px";
//             _iframe.style.width = "0px";

//             _object.attachEvent("onmouseup", _eventHander);
//         }
//         else { //当在元素上放松鼠标按钮时，会发生 mouseup 事件。
//             _object.addEventListener("mouseup", _eventHander, false);
//         }
//     };

//     this.initialize(_object, _menu);
// }

function csMenu(_target, _menu, treeId) {
    this._menu = _menu;
    this._target = _target;
    this.treeId = treeId;
    this.IContextMenuHander = null;

    var _this = this;
    this.init = function () {
        var _eventHander = function (e) {
            if (e.button == 2) {
                _this.show(e);
            }
        }
        _this._menu.css({ position: 'absolute', display: 'none', zIndex: '100000' });
        // _this._target.on('mouseup', _eventHander)
        _this._target.on('contextmenu', function (e) {
            _this.show(e);
            return false
        })
    }
    this.show = function (event) {
        var e = window.event || event;
        var left = e.clientX + 'px';
        var top = e.clientY + 'px';
        // _this._menu.css({ display: 'block', left: left, top: top });
        this.IEventHander = function (e) { _this.hide(e); };
        // this.IContextMenuHander = document.oncontextmenu;
        // document.oncontextmenu = function () {
        console.log(e.target);
        var name, treeObj, node, pTree_path, pUid;
        if (e.target.id.indexOf('_span') > -1) {
            name = e.target.innerHTML;
            treeObj = $.fn.zTree.getZTreeObj(_this.treeId);
            node = treeObj.getNodeByParam("name", name, null);
            pTree_path = node.treePath;
            pTree_path = pTree_path.slice(0, pTree_path.indexOf(node.id))
            $.cookie('rightId', node.id);
            $.cookie('rightName', node._name);
            $.cookie('rightTree_path', pTree_path);
            $.cookie('rightPUid', node.pId)
            console.log(node)
            _this._menu.css({ display: 'block', left: left, top: top });
        } else {
            _this.hide(e)
        }

        // }
        document.addEventListener("mousedown", this.IEventHander, false);

    }
    this.hide = function (event) {
        var e = window.event || event;
        var _element = e.srcElement || e.target;
        if (_element.offsetParent == _this._menu[0]) {
            return false
        }
        _this._menu.css({ position: 'absolute', display: 'none', zIndex: '100000' });
        document.removeEventListener(e.type, this.IEventHander, false);
        // document.oncontextmenu = null;
    }

    this.init(_menu)
}