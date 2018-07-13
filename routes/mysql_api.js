

exports.list = function (req, res) {
    var query = req.query;
    var db = req.con;
    var table = query.table;
    var json_p = query.json_p;
    var sorts = query.sorts;
    var pagesize = query.limit;
    var pagenum = query.pageno;
    var condition = '';
    var same_Con1 = [];

    for (o in json_p) {
        if (o != '__proto__') {
            if (json_p[o].includes('|')) {
                same_Con1 = json_p[o].split('|');
                var same_sq = '';
                same_Con1.forEach((e, i) => {
                    if (i == 0) {
                        if (e.includes('>')) {
                            e = e.slice(1, e.length);
                            same_sq += '(' + o + '>"' + e + '" or '
                        } else if (e.includes('<')) {
                            e = e.slice(1, e.length);
                            same_sq += '(' + o + '<"' + e + '" or '
                        } else if (e.includes('^')) {
                            e = e.slice(1, e.length);
                            same_sq += '(' + o + ' like "%' + e + '%" or '
                        } else {
                            same_sq += '(' + o + '="' + e + '" or '
                        }
                    } else if (i == same_Con1.length - 1) {
                        if (e.includes('>')) {
                            e = e.slice(1, e.length);
                            same_sq += o + '>"' + e + '" ) and '
                        } else if (e.includes('<')) {
                            e = e.slice(1, e.length);
                            same_sq += o + '<"' + e + '" ) and '
                        } else if (e.includes('^')) {
                            e = e.slice(1, e.length);
                            same_sq += o + ' like "%' + e + '%" ) and '
                        } else {
                            same_sq += o + '="' + e + '" ) and '
                        }
                    } else {
                        if (e.includes('>')) {
                            e = e.slice(1, e.length);
                            same_sq += o + '>"' + e + '" or '
                        } else if (e.includes('<')) {
                            e = e.slice(1, e.length);
                            same_sq += o + '<"' + e + '" or '
                        } else if (e.includes('^')) {
                            e = e.slice(1, e.length);
                            same_sq += o + ' like "%' + e + '%" or '
                        } else {
                            same_sq += o + '="' + e + '" or '
                        }
                    }

                });
                condition += same_sq;
            } else {
                var e = json_p[o];
                if (e.includes('>')) {
                    e = e.slice(1, e.length);
                    condition += o + '>"' + e + '" and ';
                } else if (e.includes('<')) {
                    e = e.slice(1, e.length);
                    condition += o + '<"' + e + '" and ';
                } else if (e.includes('^')) {
                    e = e.slice(1, e.length);
                    condition += o + ' like "%' + e + '%" and ';
                } else {
                    condition += o + '="' + e + '" and ';
                }
            }
        }

    }

    condition = condition.slice(0, -4);
    var sql = 'select * from ' + table + ' where ' + condition;
    db.query(sql, function (err, row) {
        console.log(err, 'err')
        var data = {};
        // try {
        if (err) {
            data.status = -1
        } else {
            data.total = row.length;
            sql = sql + 'order by ' + sorts;
            data.status = 0;
            if (pagesize > 0) {
                sql = sql + ' limit ' + (pagenum - 1) * pagesize + ',' + pagesize;
                db.query(sql, function (err1, rows) {
                    data.data = rows;
                    res.json(data);
                })
            } else {
                db.query(sql, function (err1, rows) {
                    data.data = rows;
                    console.log(rows, 'row')
                    res.json(data);
                })
            }
        }
    })
}

exports.update = function (req, res) {
    var query = req.query;
    var db = req.con;
    var table = query.table;
    var json_p = query.json_p;
    var update_json = query.update_json;
    var set = ' set ';
    var up = 'where ';
    var sql = 'update ' + table;
    for (var o in update_json) {
        if (o != '__proto__')
            set += o + ' = "' + update_json[o] + '" , '
    }
    for (var o in json_p) {
        if (o != '__proto__')
            up += o + ' = "' + json_p[o] + '" and ';
    }
    up = up.slice(0, -4)
    set = set.slice(0, -2);
    sql += set + up;
    db.query(sql, function (err, row) {
        var data = {};
        if (err) {
            data.status = -1
        } else {
            data.status = 0
        }
        res.json(data)
    })
}

exports.create = function (req, res) {
    var db = req.con;
    var query = req.query;
    var table = query.table
    var json_p = query.json_p;
    var condit = [];
    var conVal = '';
    for (var o in json_p) {
        if (o != '__proto__') {
            condit.push(o);
            conVal += ' "' + json_p[o] + '" , '
        }

    }
    conVal = conVal.slice(0, -2)
    var sql = 'insert into ' + table + ' ( ' + condit.join(',') + ' ) value (' + conVal + ')'
    db.query(sql, function (err, row) {
        if (err) {
            console.log(err)
            res.json({ status: -1 })
        } else {
            res.json({ status: 0, id: row.insertId })
        }
    })
}


exports.delete = function (req, res) {
    var query = req.query;
    var db = req.con;
    var table = query.table;
    var json_p = query.json_p;
    // var sorts = query.sorts;
    // var pagesize = query.limit;
    // var pagenum = query.pageno;
    var condition = '';
    var same_Con1 = [];

    for (o in json_p) {
        // debugger
        if (o != '__proto__') {
            if (json_p[o].includes('|')) {
                same_Con1 = json_p[o].split('|');
                var same_sq = '';
                same_Con1.forEach((e, i) => {
                    if (i == 0) {
                        if (e.includes('>')) {
                            e = e.slice(1, e.length);
                            same_sq += '(' + o + '>"' + e + '" or '
                        } else if (e.includes('<')) {
                            e = e.slice(1, e.length);
                            same_sq += '(' + o + '<"' + e + '" or '
                        } else if (e.includes('^')) {
                            e = e.slice(1, e.length);
                            same_sq += '(' + o + ' like "%' + e + '%" or '
                        } else {
                            same_sq += '(' + o + '="' + e + '" or '
                        }
                    } else if (i == same_Con1.length - 1) {
                        if (e.includes('>')) {
                            e = e.slice(1, e.length);
                            same_sq += o + '>"' + e + '" ) and '
                        } else if (e.includes('<')) {
                            e = e.slice(1, e.length);
                            same_sq += o + '<"' + e + '" ) and '
                        } else if (e.includes('^')) {
                            e = e.slice(1, e.length);
                            same_sq += o + ' like "%' + e + '%" ) and '
                        } else {
                            same_sq += o + '="' + e + '" ) and '
                        }
                    } else {
                        if (e.includes('>')) {
                            e = e.slice(1, e.length);
                            same_sq += o + '>"' + e + '" or '
                        } else if (e.includes('<')) {
                            e = e.slice(1, e.length);
                            same_sq += o + '<"' + e + '" or '
                        } else if (e.includes('^')) {
                            e = e.slice(1, e.length);
                            same_sq += o + ' like "%' + e + '%" or '
                        } else {
                            same_sq += o + '="' + e + '" or '
                        }
                    }

                });
                condition += same_sq;
            } else {
                var e = json_p[o];
                if (e.includes('>')) {
                    e = e.slice(1, e.length);
                    condition += o + '>"' + e + '" and ';
                } else if (e.includes('<')) {
                    e = e.slice(1, e.length);
                    condition += o + '<"' + e + '" and ';
                } else if (e.includes('^')) {
                    e = e.slice(1, e.length);
                    condition += o + ' like "%' + e + '%" and ';
                } else {
                    condition += o + '="' + e + '" and ';
                }
            }
        }

    }
    condition = condition.slice(0, -4);
    var sql = 'delete from ' + table + ' where ' + condition;
    db.query(sql, function (err, row) {
        console.log(err, 'err')
        var data = {};
        // try {
        if (err) {
            data.status = -1
        } else {
            data.status = 0;
        }
        res.json(data);
    })
}