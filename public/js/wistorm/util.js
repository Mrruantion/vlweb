/**
 * Created with JetBrains WebStorm.
 * User: Administrator
 * Date: 12-9-22
 * Time: 下午4:10
 * To change this template use File | Settings | File Templates.
 */
var url = require("url");
var crypto = require('crypto');
var http = require("http");
var https = require("https");
var define = require('./define');

var md5 = function (content) {
    var hasher = crypto.createHash("md5");
    hasher.update(content, "utf8");
    return hasher.digest('hex');//hashmsg为加密之后的数据
};

exports.md5 = md5;

function _get(file_url, callback) {
    var result;
    http.get(file_url, function (res) {
        console.log("Got response: " + res.statusCode);
        res.setEncoding('utf8');
        var responseString = '';
        res.on('data', function (data) {
            responseString += data;
        });
        res.on('end', function () {
            try {
                var resultObject = JSON.parse(responseString);
                result = resultObject;
            } catch (e) {
                result = responseString;
            }
            callback(result);
        });
    }).on('error', function (e) {
        console.log("Got error: " + e.message);
        var resultObject = {
            status_code: define.API_STATUS_CONNECT_FAIL,
            content: e.toString()
        };
        result = resultObject;
        callback(result);
    });
}

exports._get = _get;
