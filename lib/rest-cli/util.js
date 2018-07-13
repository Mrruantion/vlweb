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
var algorithm = 'aes-128-ecb';
var key = '78541561566';
var clearEncoding = 'utf8';
var cipherEncoding = 'hex';
var define = require('./define');

exports.getAuthCode = function (username) {
    var d = new Date();
    var d = d.format("yyyyMMdd");
    var auth_code = md5(username + d);
    return auth_code;
};

exports.getServiceEndDate = function () {
    var now = new Date();
    var service_end_date = new Date(now.getFullYear() + 1, now.getMonth(), 1);
    service_end_date = new Date(Date.parse(service_end_date) - (86400000 * 1));
    //console.log(service_end_date.toLocaleDateString());
    return service_end_date;
};

exports.dateAdd = function (src, sec) {
    var date = new Date(Date.parse(src) + sec * 1000);
    return date;
};

exports.dateAddEx = function (interval, number, d) {
    /*
     *   功能:实现VBScript的DateAdd功能.
     *   参数:interval,字符串表达式，表示要添加的时间间隔.
     *   参数:number,数值表达式，表示要添加的时间间隔的个数.
     *   参数:date,时间对象.
     *   返回:新的时间对象.
     *   var   now   =   new   Date();
     *   var   newDate   =   DateAdd( "d ",5,now);
     *---------------   DateAdd(interval,number,date)   -----------------
     */
    var date = new Date(d);
    switch (interval) {
        case "y":
        {
            date.setFullYear(date.getFullYear() + number);
            return date;
        }
        case "q":
        {
            date.setMonth(date.getMonth() + number * 3);
            return date;
        }
        case "m":
        {
            date.setMonth(date.getMonth() + number);
            return date;
        }
        case "w":
        {
            date.setDate(date.getDate() + number * 7);
            return date;
        }
        case "d":
        {
            date.setDate(date.getDate() + number);
            return date;
        }
        case "h":
        {
            date.setHours(date.getHours() + number);
            return date;
        }
        case "n":
        {
            date.setMinutes(date.getMinutes() + number);
            return date;
        }
        case "s":
        {
            date.setSeconds(date.getSeconds() + number);
            return date;
        }
        default:
        {
            date.setDate(date.getDate() + number);
            return date;
        }
    }
};

exports.dateDiff = function (d1, d2) {     //sDate1和sDate2是2004-10-18格式
    var mm = parseInt(Math.abs(d2 - d1) / 1000 / 60);    //把相差的毫秒数转换为分钟
    return mm;
};

exports.inArray = function (array, e) {
    var r = new RegExp(String.fromCharCode(2) + e + String.fromCharCode(2));
    return (r.test(String.fromCharCode(2) + array.join(String.fromCharCode(2)) + String.fromCharCode(2)));
};

function chr2Unicode(str) {
    if ('' != str) {
        var st, t, i;
        st = '';
        for (i = 1; i <= str.length; i++) {
            t = str.charCodeAt(i - 1).toString(16);
            if (t.length < 4)
                while (t.length < 4)
                    t = '0'.concat(t);
            t = t.slice(0, 2).concat(t.slice(2, 4));
            st = st.concat(t);
        }
        return (st.toUpperCase());
    }
    else {
        return ('');
    }
}

var md5 = function (content) {
    var hasher = crypto.createHash("md5");
    hasher.update(content, "utf8");
    return hasher.digest('hex');//hashmsg为加密之后的数据
};

exports.md5 = md5;

/*加密*/
var encodeAES = function (data) {
    var cipher = crypto.createCipher(algorithm, key);
    var cipherChunks = [];
    cipherChunks.push(cipher.update(data, clearEncoding, cipherEncoding));
    cipherChunks.push(cipher.final(cipherEncoding));
    return cipherChunks.join('');
};

exports.encodeAES = encodeAES;

/*解密*/
var decodeAES = function (data) {
    var decipher = crypto.createDecipher(algorithm, key);
    var plainChunks = [];
    plainChunks.push(decipher.update(data, cipherEncoding, clearEncoding));
    plainChunks.push(decipher.final(clearEncoding));
    return plainChunks.join('');
};

// 通过访问令牌获取对应的用户id
exports.getCustID = function (access_token) {
    var s = decodeAES(access_token);
    var cust_id = parseInt(s.split(",")[1]);
    return cust_id;
};

exports.decodeAES = decodeAES;

exports.ord = function (value) {
    if (value == true) {
        return 1;
    } else {
        return 0;
    }
};

// function _post(file_url, data, callback) {
//     try {
//         var post_data = JSON.stringify(data);
//         //var post_data = data;
//         var headers = {
//             //'Content-Type': 'application/json',
//             'Content-Type': 'application/x-www-form-urlencoded',
//             'Content-Length': post_data.length
//         };
//         var obj = url.parse(file_url);
//         var options = {
//             host: obj.hostname,
//             port: obj.port,
//             path: obj.path,
//             method: 'POST',
//             headers: headers
//         };
//         var req = http.request(options, function (res) {
//             console.log('STATUS: ' + res.statusCode);
//             if (res.statusCode == 200) {
//                 //console.log('HEADERS: ' + JSON.stringify(res.headers));
//                 res.setEncoding('utf8');
//                 var responseString = '';
//                 res.on('data', function (data) {
//                     responseString += data;
//                 });
//                 res.on('end', function () {
//                     var resultObject = JSON.parse(responseString);
//                     if (callback) {
//                         callback(resultObject);
//                     }
//                 });
//             } else {
//                 callback(null);
//             }
//         });
//
//         req.on('error', function (e) {
//             // TODO: handle error.
//             callback(null);
//         });
//         // write data to request body
//         req.write(post_data);
//         req.end();
//     } catch (e) {
//         callback(null);
//     }
// }

function _post(file_url, data, callback) {
    try {
        var post_data = JSON.stringify(data);
        //var post_data = data;
        var headers = {
            'Content-Type': 'application/json',
            'Content-Length': post_data.length
        };
        var obj = url.parse(file_url);
        var options = {
            host: obj.hostname,
            port: obj.port,
            path: obj.path,
            method: 'POST',
            headers: headers
        };
        var req = http.request(options, function (res) {
            console.log('STATUS: ' + res.statusCode);
            if (res.statusCode == 200) {
                //console.log('HEADERS: ' + JSON.stringify(res.headers));
                res.setEncoding('utf8');
                var responseString = '';
                res.on('data', function (data) {
                    responseString += data;
                });
                res.on('end', function () {
                    var resultObject = JSON.parse(responseString);
                    if (callback) {
                        callback(resultObject);
                    }
                });
            } else {
                callback(null);
            }
        });

        req.on('error', function (e) {
            // TODO: handle error.
            callback(null);
        });
        // write data to request body
        req.write(post_data);
        req.end();
    } catch (e) {
        callback(null);
    }
}

exports._post = _post;

function _postssl(file_url, data, callback) {
    try {
        var post_data = JSON.stringify(data);
        //var post_data = data;
        var headers = {
            //'Content-Type': 'application/json',
            'Content-Type': 'text/plain; charset:utf-8’',
            'Content-Length': post_data.length
        };
        var obj = url.parse(file_url);
        var options = {
            host: obj.hostname,
            port: 443,
            path: obj.path,
            method: 'POST',
            headers: headers
        };
        var req = https.request(options, function (res) {
            console.log('STATUS: ' + res.statusCode);
            if (res.statusCode == 200) {
                //console.log('HEADERS: ' + JSON.stringify(res.headers));
                res.setEncoding('utf8');
                var responseString = '';
                res.on('data', function (data) {
                    responseString += data;
                });
                res.on('end', function () {
                    var resultObject = JSON.parse(responseString);
                    if (callback) {
                        callback(resultObject);
                    }
                });
            } else {
                callback(null);
            }
        });
        req.on('error', function (e) {
            // TODO: handle error.
            callback(null);
        });
        // write data to request body
        req.write(post_data);
        req.end();
    } catch (e) {
        callback(null);
    }
}

exports._postssl = _postssl;

function _get(file_url, callback) {
    var result;
    http.get(file_url, function (res) {
        // console.log("Got response: " + res.statusCode);
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

function _put(file_url, data, callback) {
    try {
        var post_data = JSON.stringify(data);
        var headers = {
            'Content-Type': 'application/json',
            'Content-Length': post_data.length
        };
        var obj = url.parse(file_url);
        var options = {
            host: obj.hostname,
            port: obj.port,
            path: obj.path,
            method: 'PUT',
            headers: headers
        };
        var req = http.request(options, function (res) {
            console.log('STATUS: ' + res.statusCode);
            //console.log('HEADERS: ' + JSON.stringify(res.headers));
            res.setEncoding('utf8');
            var responseString = '';
            res.on('data', function (data) {
                responseString += data;
            });
            res.on('end', function () {
                var resultObject = JSON.parse(responseString);
                if (callback) {
                    callback(resultObject);
                }
            });
        });

        req.on('error', function (e) {
            // TODO: handle error.
            var resultObject = {
                status: define.API_STATUS_CONNECT_FAIL,
                content: e.toString()
            };
            if (callback) {
                callback(resultObject);
            }
        });
        // write data to request body
        req.write(post_data);
        req.end();
    } catch (e) {
        var resultObject = {
            status: define.API_STATUS_EXCEPTION,
            content: e.toString()
        };
        if (callback) {
            callback(resultObject);
        }
    }
}

exports._put = _put;

function _delete(file_url, callback) {
    try {
        var obj = url.parse(file_url);
        var options = {
            host: obj.hostname,
            port: obj.port,
            path: obj.path,
            method: 'DELETE'
        };
        var req = http.request(options, function (res) {
            console.log('STATUS: ' + res.statusCode);
            //console.log('HEADERS: ' + JSON.stringify(res.headers));
            res.setEncoding('utf8');
            var responseString = '';
            res.on('data', function (data) {
                responseString += data;
            });
            res.on('end', function () {
                var resultObject = JSON.parse(responseString);
                if (callback) {
                    callback(resultObject);
                }
            });
        });

        req.on('error', function (e) {
            // TODO: handle error.
            var resultObject = {
                status_code: define.API_STATUS_CONNECT_FAIL,
                content: e.toString()
            };
            if (callback) {
                callback(resultObject);
            }
        });
        // write data to request body
        //req.write(post_data);
        req.end();
    } catch (e) {
        var resultObject = {
            status_code: define.API_STATUS_EXCEPTION,
            content: e.toString()
        };
        if (callback) {
            callback(resultObject);
        }
    }
}

exports._del = _delete;

exports.pad = function (num, n) {
    var len = num.toString().length;
    while (len < n) {
        num = "0" + num;
        len++;
    }
    return num;
};

function clone(myObj) {
    if (typeof(myObj) != 'object' || myObj instanceof Date || myObj instanceof Array || myObj == null) return myObj;
    var newObj = new Object();
    for (var i in myObj) {
        newObj[i] = clone(myObj[i]);
    }
    return newObj;
}

//对象克隆
exports.clone = clone;


function encrypt(str, pwd) {
    if(pwd == null || pwd.length <= 0) {
        alert("Please enter a password with which to encrypt the message.");
        return null;
    }
    var prand = "";
    for(var i=0; i<pwd.length; i++) {
        prand += pwd.charCodeAt(i).toString();
    }
    var sPos = Math.floor(prand.length / 5);
    var mult = parseInt(prand.charAt(sPos) + prand.charAt(sPos*2) + prand.charAt(sPos*3) + prand.charAt(sPos*4) + prand.charAt(sPos*5));
    var incr = Math.ceil(pwd.length / 2);
    var modu = Math.pow(2, 31) - 1;
    if(mult < 2) {
        alert("Algorithm cannot find a suitable hash. Please choose a different password. \nPossible considerations are to choose a more complex or longer password.");
        return null;
    }
    var salt = Math.round(Math.random() * 1000000000) % 100000000;
    prand += salt;
    while(prand.length > 10) {
        prand = (parseInt(prand.substring(0, 10)) + parseInt(prand.substring(10, prand.length))).toString();
    }
    prand = (mult * prand + incr) % modu;
    var enc_chr = "";
    var enc_str = "";
    for(var i=0; i<str.length; i++) {
        enc_chr = parseInt(str.charCodeAt(i) ^ Math.floor((prand / modu) * 255));
        if(enc_chr < 16) {
            enc_str += "0" + enc_chr.toString(16);
        } else enc_str += enc_chr.toString(16);
        prand = (mult * prand + incr) % modu;
    }
    salt = salt.toString(16);
    while(salt.length < 8)salt = "0" + salt;
    enc_str += salt;
    return enc_str;
}

exports.encrypt = encrypt;