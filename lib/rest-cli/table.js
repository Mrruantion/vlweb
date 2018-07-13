/**
 * Created by 1 on 2017/2/8.
 */
var WiStormAPI = require('./wistorm');
var define = require('./define');
var Fiber = require('fibers');

var dev_key = "59346d400236ab95e95193f35f3df6a4";
var app_key = "3cea92bd76089d5ebea86613c8dbd067";
var app_secret = "000daf0bd5827b47e3fbd861ad4fcbb3";

var wistorm_api = new WiStormAPI(app_key, app_secret, 'json', '2.0', 'md5', dev_key);

var _TABLE = function(name, desc, options){
    this._table = {};
    var options = options || {};
    this._table.name = name;
    this._table.desc = desc;
    this._table.isSystem = options.isSystem || false;
    this._table.isApi = options.isApi || false;
    this._table.isPrivate = options.isPrivate || true;
    this._table.cacheField = options.cacheField || 'createdAt';
    this._table.fieldDefine = [];
    this._table.indexDefine = [];
    this._table.creator = 0;
    this.access_token = '';
};

_TABLE.prototype.addField = function(name, desc, type, options){
    var options = options || {};
    var field = {
        name: name,
        desc: desc,
        type: type,
        default: options.default || '',
        display: options.display || '',
        primary: options.primary || false,
        query: options.query || true,
        unique: options.unique || false,
        validations: options.validations || {},
        messages: options.messages || {}
    };
    this._table.fieldDefine.push(field);
};

_TABLE.prototype.addIndex = function(index){
    this._table.indexDefine.push(index);
};

_TABLE.prototype.save = function(){
    var _this = this;
    // 添加新表
    Fiber(function() {
        var fiber = Fiber.current;
        wistorm_api.getToken('13316560478', 'e10adc3949ba59abbe56e057f20f883e', 1, function (obj) {
            _this.access_token = obj.access_token;
            fiber.run();
        });
        Fiber.yield();

        var isExist = false;
        var query = {
            name: _this._table.name
        };
        wistorm_api._get("table", query, "objectId", _this.access_token, function(obj){
            isExist = obj.status_code == 0 && obj.data != null;
            fiber.run();
        });
        Fiber.yield();
        if(isExist){
            wistorm_api._update("table", query, _this._table, _this.access_token, function(obj){
                if(obj.status_code == 0 && obj.nModified == 1){
                    console.log(_this._table.name + '更新成功!');
                }else{
                    console.log(_this._table.name + '更新失败!');
                }
                fiber.run();
            });
        }else{
            wistorm_api._create("table", _this._table, _this.access_token, function (obj) {
                if(obj.status_code == 0){
                    console.log(_this._table.name + '新增成功!');
                }else{
                    console.log(_this._table.name + '新增失败!');
                }
                fiber.run();
            });
        }
        Fiber.yield();
        // 更新云端服务加载
        wistorm_api._refreshTable(_this.access_token, function(obj){
            console.log(_this._table.name + '服务加载成功!');
        });
    }).run();
};

// 文章表
var article = new _TABLE('article', '文章表');
article.addField('uid', '用户ID', 'Number');
article.addField('type', '类型', 'Number');
article.addField('title', '标题', 'String');
article.addField('img', '预览图片', 'String');
article.addField('summary', '概要', 'String');
article.addField('content', '内容', 'String');
article.addField('author', '作者', 'String');
article.addField('readCount', '阅读数', 'Number');
article.addIndex({uid: 1});
article.addIndex({name: 1});
article.save();

// 服务网点
var branch = new _TABLE('branch', '服务网点表');
branch.addField('uid', '用户ID', 'Number');
branch.addField('name', '网点名称', 'String');
branch.addField('contact', '联系人', 'String');
branch.addField('tel', '固定电话', 'String');
branch.addField('mobile', '手机', 'String');
branch.addField('city', '城市', 'String');
branch.addField('address', '地址', 'String');
branch.addField('lon', '网点经度', 'Number');
branch.addField('lat', '网点纬度', 'Number');
branch.addIndex({uid: 1});
branch.addIndex({name: 1});
branch.save();
