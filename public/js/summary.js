/**
 * Created with JetBrains WebStorm.
 * User: Tom
 * Date: 17-12-06
 * Time: 下午11:33
 * 总览页面js
 */
//
var auth_code = $.cookie('auth_code');
var dealer_id = $.cookie('dealer_id');
var dealer_type = $.cookie('dealer_type');
var login_depart_id = $.cookie('login_depart_id');
var tree_path = $.cookie('tree_path');
var statChart;
var onlineChart;
var statusChart;

$(document).ready(function () {
    // windowResize();
    // $(window).resize(function () {
    //     windowResize();
    // });

    var htmlChange = function () {
        var height = $(window).height() - 80;
        $('#appArea').css({ "height": height + "px" });
    }
    htmlChange();
    $(window).resize(function () {
        htmlChange();
        statChart.resize();
        onlineChart.resize();
        statusChart.resize();
    });



    var id = setInterval(function () {
        if (!i18nextLoaded) {
            return;
        }
        loadCounter();
        loadStatChart();
        loadOnlineChart();
        loadStatusChart();
        clearInterval(id);
    }, 100);
});

// 加载计数
var loadCounter = function () {
    // 客户数
    var query = { treePath: '^' + tree_path };
    wistorm_api._count('customer', query, auth_code, true, function (json) {
        $('#customerCounter').html((json.count - 1) || 0);
    });
    // 部门数
    var query = ['9', '12'].indexOf(dealer_type) > -1 ? { uid: dealer_id, parentId: login_depart_id } : { uid: dealer_id };
    wistorm_api._count('department', query, auth_code, true, function (json) {
        $('#departCounter').html(json.count || 0);
    });
    // 成员数
    var query = ['9', '12'].indexOf(dealer_type) > -1 ? { companyId: dealer_id, departId: login_depart_id } : { companyId: dealer_id };
    wistorm_api._count('employee', query, auth_code, true, function (json) {
        $('#employeeCounter').html(json.count || 0);
    });
    // 目标数
    var query = ['9', '12'].indexOf(dealer_type) > -1 ? { uid: dealer_id, departId: login_depart_id } : { uid: dealer_id };
    wistorm_api._count('vehicle', query, auth_code, true, function (json) {
        $('#vehicleCounter').html(json.count || 0);
    });
    // 设备数
    var query = ['9', '12'].indexOf(dealer_type) > -1 ? { uid: 'none' } : { uid: dealer_id };
    wistorm_api._count('_iotDevice', query, auth_code, true, function (json) {
        $('#deviceCounter').html(json.count || 0);
    });
};

// 加载目标状态曲线
/**
 * @param {[*]} dateArray
 */
var drawStatChart = function (dateArray, mileArray, fuelArray) {
    // 基于准备好的dom，初始化echarts实例
    statChart = echarts.init(document.getElementById('stat'));

    // 指定图表的配置项和数据
    var option = {
        backgroundColor: '#fff',
        color: ['#5793f3', '#d14a61'],
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'cross',
                animation: false,
                label: {
                    backgroundColor: '#0D4286'
                }
            }
        },
        toolbox: {
            show: true,
            feature: {
                dataView: { show: true, readOnly: false },
                magicType: { show: true, type: ['line', 'bar'] },
                restore: { show: true },
                saveAsImage: { show: true }
            }
        },
        legend: {
            left: 'center',
            data: [i18next.t("summary.daily_mileage"), i18next.t("summary.daily_fuel")],
            textStyle: {
                color: "#000",
                fontsize: 5
            }
        },
        // dataZoom: [{
        //     show: false,
        //     realtime: true,
        //     start: 0,
        //     end: 5,
        //     // backgroundColor:'#d'
        //     textStyle: {
        //         color: "#000"
        //     }
        // }, {
        //     type: 'inside',
        //     realtime: true,
        //     start: 5,
        //     end: 85
        // }],
        grid: {
            show: true,
            top: '24%',
            left: '2%',
            right: '1%',
            bottom: '14%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            axisLine: {
                lineStyle: {
                    color: '#000'
                }
            },
            axisLabel: { //调整x轴的lable
                textStyle: {
                    color: '#000'
                }
            },
            splitLine: {
                show: true
            },
            data: dateArray
        },
        yAxis: [{
            boundaryGap: [0, '50%'],
            axisLine: {
                lineStyle: {
                    color: '#000'
                }
            },
            type: 'value',
            name: i18next.t("summary.mileage") + '(km)',
            position: 'left',
            offset: 0,
            splitNumber: 10,
            axisLabel: {
                formatter: '{value}',
                textStyle: {
                    color: '#000'
                }
            },
            splitLine: {
                show: false
            }
        }, {
            boundaryGap: [0, '50%'],
            axisLine: {
                lineStyle: {
                    color: '#000'
                }
            },
            splitLine: {
                show: false
            },
            type: 'value',
            name: i18next.t("summary.fuel") + '(L)',
            position: 'right',
            axisLabel: {
                formatter: '{value}'
            }
        }],
        series: [{
            name: i18next.t("summary.daily_mileage"),
            type: 'line',
            // step: 'middle',
            smooth: true,
            data: mileArray,
            yAxisIndex: 0
        }, {
            name: i18next.t("summary.daily_fuel"),
            type: 'line',
            // step: 'start',
            smooth: true,
            data: fuelArray,
            yAxisIndex: 1
        }]
    };

    // 使用刚指定的配置项和数据显示图表。
    statChart.setOption(option);
};
var getTripData = function (query_json) {
    // debugger;
    var group = {
        _id: { year: "$year", month: "$month", day: "$day" },
        distance: { $sum: "$distance" },
        fuel: { $sum: "$fuel" }
    };
    var sorts = '_id.year,_id.month,_id.day';

    wistorm_api._aggr("_iotTrip", query_json, group, sorts, 1, -1, auth_code, function (obj) {
        console.log(JSON.stringify(obj));
        if (obj.status_code === 0) {
            var dateArray = [];
            var mileArray = [];
            var fuelArray = [];
            for (var i = 0; i < obj.data.length; i++) {
                dateArray.push(obj.data[i]._id.year + '-' + obj.data[i]._id.month + '-' + obj.data[i]._id.day);
                mileArray.push(obj.data[i].distance.toFixed(1));
                fuelArray.push(obj.data[i].fuel.toFixed(1));
            }
            drawStatChart(dateArray, mileArray, fuelArray);
        }
    });
};
var loadStatChart = function () {
    var endTime = new Date();
    endTime.setDate(endTime.getDate() - 1);
    var startTime = new Date();
    startTime.setMonth(endTime.getMonth() - 1);
    if (['9', '12'].indexOf(dealer_type) > -1) {
        var query = { uid: dealer_id, departId: login_depart_id };
        wistorm_api._list('vehicle', query, 'did', 'did', 'did', 0, 0, 1, -1, auth_code, true, function (vehicles) {
            var dids = [];
            for (var i = 0; i < vehicles.total; i++) {
                if (vehicles.data[i].did !== '') {
                    dids.push(vehicles.data[i].did);
                }
            }
            var query_json = {
                did: dids.join("|"),
                endTime: startTime.format("yyyy-MM-dd") + "@" + endTime.format("yyyy-MM-dd") + ' 23:59:59',
                distance: '>0'
            };
            getTripData(query_json);
        });
    } else {
        var query_json = {
            uid: dealer_id.toString(),
            endTime: startTime.format("yyyy-MM-dd") + "@" + endTime.format("yyyy-MM-dd") + ' 23:59:59',
            distance: '>0'
        };
        getTripData(query_json);
    }
};

// 加载目标上线拼图
/**
 * @param {[*]} dataArray
 */
var drawOnlineChart = function (dataArray) {
    dataArray = dataArray || [
        { value: 10, name: i18next.t("monitor.online_status") },
        { value: 200, name: i18next.t("monitor.offline_status") },
        { value: 9, name: i18next.t('monitor.alert_status') }
    ];
    // 基于准备好的dom，初始化echarts实例
    onlineChart = echarts.init(document.getElementById('online'));

    // 指定图表的配置项和数据
    var option = {
        // title: {
        //     text: '上线统计',
        //     left: 'center'
        // },
        tooltip: {
            trigger: 'item',
            formatter: "{a} <br/>{b} : {c} ({d}%)"
        },
        legend: {
            // orient: 'vertical',
            // top: 'middle',
            bottom: 10,
            left: 'center',
            data: [i18next.t("monitor.online_status"), i18next.t('monitor.alert_status') , i18next.t("monitor.offline_status")]
        },
        series: [
            {
                type: 'pie',
                radius: '65%',
                center: ['50%', '50%'],
                selectedMode: 'single',
                data: dataArray,
                itemStyle: {
                    emphasis: {
                        shadowBlur: 10,
                        shadowOffsetX: 0,
                        shadowColor: 'rgba(0, 0, 0, 0.5)'
                    }
                }
            }
        ]
    };

    // 使用刚指定的配置项和数据显示图表。
    onlineChart.setOption(option);
};
var loadOnlineChart = function () {
    var query = {
        uid: dealer_id
    };
    if (['9', '12'].indexOf(dealer_type) > -1) {
        query['departId'] = login_depart_id;
    }

    wistorm_api._count('vehicle2', query, auth_code, true, function (obj) {
        console.log(obj);
        drawOnlineChart([
            { value: obj.online || 0, name: i18next.t("monitor.online_status") },
            { value: obj.offline || 0, name: i18next.t("monitor.offline_status") },
            { value: obj.alert || 0, name: i18next.t("monitor.alert_status") }
        ]);
    });
};

// 加载目标上线拼图
/**
 * @param {[*]} dataArray
 */
var drawStatusChart = function (dataArray) {
    dataArray = dataArray || [
        { value: 1548, name: i18next.t("summary.leisure") },
        { value: 535, name: i18next.t("summary.using") },
        { value: 535, name: i18next.t("summary.maintenance") }
    ];
    // 基于准备好的dom，初始化echarts实例
    statusChart = echarts.init(document.getElementById('status'));

    // 指定图表的配置项和数据
    var option = {
        // title: {
        //     text: '目标总数：221',
        //     left: 'center'
        // },
        tooltip: {
            trigger: 'item',
            formatter: "{a} <br/>{b} : {c} ({d}%)"
        },
        legend: {
            // orient: 'vertical',
            // top: 'middle',
            bottom: 10,
            left: 'center',
            data: [i18next.t("summary.leisure"), i18next.t("summary.using"), i18next.t("summary.maintenance")]
        },
        series: [
            {
                type: 'pie',
                radius: '65%',
                center: ['50%', '50%'],
                selectedMode: 'single',
                data: dataArray,
                itemStyle: {
                    emphasis: {
                        shadowBlur: 10,
                        shadowOffsetX: 0,
                        shadowColor: 'rgba(0, 0, 0, 0.5)'
                    }
                }
            }
        ]
    };

    // 使用刚指定的配置项和数据显示图表。
    statusChart.setOption(option);
};
var loadStatusChart = function () {
    var query = {
        uid: dealer_id
    };
    if (['9', '12', '13'].indexOf(dealer_type) > -1) {
        query['departId'] = login_depart_id;
    }
    var group = {
        _id: { status: "$status" },
        total: { $sum: 1 }
    };
    var sorts = '_id.status';

    wistorm_api._aggr("vehicle", query, group, sorts, 1, -1, auth_code, function (obj) {
        console.log(JSON.stringify(obj));
        var free = 0;
        var used = 0;
        var maintain = 0;
        if (obj.status_code === 0) {
            for (var i = 0; i < obj.data.length; i++) {
                if (obj.data[i]._id.status === 0) {
                    free = obj.data[i].total;
                } else if (obj.data[i]._id.status === 1) {
                    used = obj.data[i].total;
                } if (obj.data[i]._id.status === 2) {
                    maintain = obj.data[i].total;
                }
            }
            var dataArray = [
                { value: free, name: i18next.t("summary.leisure") },
                { value: used, name: i18next.t("summary.using") },
                { value: maintain, name: i18next.t("summary.maintenance") }
            ];
            drawStatusChart(dataArray);
        }
    });

};