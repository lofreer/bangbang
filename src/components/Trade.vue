<template>
    <div class="trade">
        <div class="menu">
            <ul class="symbol">
                <li v-for="item in symbols" v-bind:class="{active: symbol === item.value}" v-on:click="symbolChange(item.value, item.exchange)">
                    {{item.key}}
                </li>
            </ul>
            <ul class="interval">
                <li v-for="item in intervals" v-bind:class="{active: interval === item.value}" v-on:click="intervalChange(item.value)">
                    {{item.key}}
                </li>
            </ul>
        </div>
        <div id="chart"></div>
    </div>
</template>

<script>
import echarts from 'echarts/lib/echarts' // 引入基本模板
import 'echarts/lib/chart/line'
import 'echarts/lib/chart/bar'
import 'echarts/lib/chart/candlestick'
import 'echarts/lib/component/dataZoom'
import 'echarts/lib/component/legendScroll'
import 'echarts/lib/component/tooltip'
import 'echarts/lib/component/title'
import moment from 'moment'
export default {
    name: 'Trade',
    data() {
        return {
            symbols: [
                {key: 'XBT', value: 'XBTUSD', exchange: 'BitMEX'},
                {key: 'ETH', value: 'ETHUSD', exchange: 'BitMEX'},
                {key: 'BTC', value: 'BTCUSDT', exchange: 'Binance'},
                {key: 'ETH', value: 'ETHUSDT', exchange: 'Binance'}
            ],
            symbol: 'XBTUSD',
            intervals: [
                {key: '1M', value: 1},
                {key: '3M', value: 3},
                {key: '5M', value: 5},
                {key: '15M', value: 15},
                {key: '30M', value: 30},
                {key: '1H', value: 60},
                {key: '2H', value: 120},
                {key: '4H', value: 240},
                {key: '6H', value: 360},
                {key: '12H', value: 720},
                {key: '1D', value: 1440},
            ],
            interval: 15,
            exchange: 'BitMEX',
            timer: null,
            trades: [],
            // 初始化空对象  
            chart: null,  
            // 初始化图表配置  
            options: {
                title: {
                    text: `BitMEX:ETHUSD 交易数据展示`,
                    subtext: '数据来自BitMEX',
                    x: 'center',
                    subtextStyle: {
                        color: '#00da3c', 
                        fontSize: 14 
                    }
                },
                legend: {
                    // x: 'center',
                    top: 2,
                    right: 5,
                    data: ['买入', '卖出', 'K线', 'MA20', 'MA120', 'MA720'],
                    selected: {
                        'MA20': true,
                        'MA120': true,
                        'MA720': true,
                        '买入': true,
                        '卖出': true,
                        'K线': true
                    }
                },
                tooltip: {
                    trigger: 'axis',
                    axisPointer: {
                        type: 'cross'
                    },
                    textStyle: {
                        align: 'left'
                    },
                    formatter: (params) => {
                        let dataIndex = params[0].dataIndex
                        let prev = this.trades[dataIndex-1]
                        let last = this.trades[dataIndex]
                        let str = ''
                        str += `${moment(last.timestamp).format('M/D HH:mm')}<br/><br/>`
                        str += `价格：${last.close}<br/>`
                        str += `交易量：${last.volume}<br/>`
                        str += `买入：${last.buy_size}<br/>`
                        str += `卖出：${last.sell_size}<br/>`

                        if (last.position) {
                            str += `持仓量：${last.position}<br/>`
                        }

                        if (last.position && prev) {
                            if (last.position > prev.position) {
                                str += '<br/>'
                                if (last.buy_size > last.sell_size) {
                                    str += `换手：${last.volume - (last.position - prev.position)}<br/>`
                                    str += `多头加仓：+${last.position - prev.position}<br/>`
                                } else if (last.buy_size < last.sell_size) {
                                    str += `换手：${last.volume - (last.position - prev.position)}<br/>`
                                    str += `空头加仓：+${last.position - prev.position}<br/>`
                                } else {
                                    str += `换手：${last.volume - (last.position - prev.position)}<br/>`
                                    str += `加仓：+${last.position - prev.position}<br/>`
                                }
                            } else if (last.position < prev.position) {
                                str += '<br/>'
                                if (last.buy_size > last.sell_size) {
                                    str += `换手：${last.volume - (prev.position - last.position)}<br/>`
                                    str += `空头减仓：-${prev.position - last.position}<br/>`
                                } else if (last.buy_size < last.sell_size) {
                                    str += `换手：${last.volume - (prev.position - last.position)}<br/>`
                                    str += `多头减仓：-${prev.position - last.position}<br/>`
                                } else {
                                    str += `换手：${last.volume - (prev.position - last.position)}<br/>`
                                    str += `减仓：-${prev.position - last.position}<br/>`
                                }
                            }
                        }
                        str += `<br/>开：${last.open}<br/>`
                        str += `高：${last.high}<br/>`
                        str += `低：${last.low}<br/>`
                        str += `收：${last.close}<br/>`
                        let temps = this.trades.slice(0, dataIndex+1)
                        let ma20 = this.ma(temps.map(item => item.close), 20)
                        let ma120 = this.ma(temps.map(item => item.close), 120)
                        let ma720 = this.ma(temps.map(item => item.close), 720)
                        if (ma20.length) {
                            str += `<br/>MA20：${ma20.slice(-1)[0]}`
                        }
                        if (ma120.length) {
                            str += `<br/>MA120：${ma120.slice(-1)[0]}`
                        }
                        if (ma720.length) {
                            str += `<br/>MA720：${ma720.slice(-1)[0]}`
                        }
                        return str
                    }
                },
                toolbox: {
                    feature: {
                        dataZoom: {
                            yAxisIndex: 'none'
                        },
                        restore: {},
                        saveAsImage: {}
                    }
                },
                axisPointer: {
                    link: {xAxisIndex: 'all'}
                },
                dataZoom: [
                    {
                        show: true,
                        realtime: true,
                        start: 88,
                        end:100,
                        xAxisIndex: [0, 1]
                    },
                    {
                        type: 'inside',
                        realtime: true,
                        start: 88,
                        end: 100,
                        xAxisIndex: [0, 1]
                    }
                ],
                grid: [{
                    left: 90,
                    right: 60,
                    height: '37%'
                }, {
                    left: 90,
                    right: 60,
                    top: '53%',
                    height: '37%'
                }],
                xAxis : [
                    {
                        type : 'category',
                        boundaryGap : false,
                        // axisLine: {onZero: true},
                        data: [],
                        axisLine: { lineStyle: { color: '#777' } }
                    },
                    {
                        gridIndex: 1,
                        type : 'category',
                        boundaryGap : false,
                        axisLine: {onZero: false},
                        data: [],
                        axisLine: { lineStyle: { color: '#777' } }
                        // position: 'top'
                    }
                ],
                yAxis : [
                    {
                        type: 'value',
                        name: '交易量',
                        min: function (value) {
                            return parseInt(value.min - value.min * 0.001)
                        },
                        max: function (value) {
                            return parseInt(value.max + value.max * 1)
                        },
                        splitLine: {
                            show: false
                        },
                        axisLabel: {
                            formatter: (value) => {
                                return Math.round(value / 1000000) + 'M'
                            }
                        },
                        axisLine: { lineStyle: { color: '#777' } }
                    },
                    {
                        name : 'K线',
                        type : 'value',                        
                        min: function (value) {
                            return parseInt(value.min - value.min * 0.005)
                        },
                        max: function (value) {
                            return parseInt(value.max + value.max * 0.005)
                        },
                        axisLine: { lineStyle: { color: '#777' } }
                        // splitLine: {
                        //     show: false
                        // 
                    },
                    {
                        gridIndex: 1,
                        name : '持仓量',
                        type : 'value',
                        position: 'left',
                        min: function (value) {
                            return parseInt(value.min - value.min * 0.005)
                        },
                        max: function (value) {
                            return parseInt(value.max + value.max * 0.005)
                        },
                        axisLabel: {
                            formatter: (value) => {
                                return Math.round(value / 1000000) + 'M'
                            }
                        },
                        axisLine: { lineStyle: { color: '#777' } },
                        // inverse: true
                        splitLine: {
                            show: false
                        }
                    },
                    {
                        gridIndex: 1,
                        name : '价格',
                        type : 'value',
                        position: 'right',
                        min: function (value) {
                            return parseInt(value.min - value.min * 0.005)
                        },
                        max: function (value) {
                            return parseInt(value.max + value.max * 0.005)
                        },
                        axisLine: { lineStyle: { color: '#777' } }
                        // splitLine: {
                        //     show: false
                        // }
                    }
                ],
                series : [
                    {
                        name:'卖出',
                        type:'bar',
                        // xAxisIndex: 0,
                        // yAxisIndex: 2,
                        stack: '交易量',
                        data:[],
                        itemStyle:{
                            normal:{
                                color:'#ec0000'
                            }
                        }
                    },
                    {
                        name:'买入',
                        type:'bar',
                        // xAxisIndex: 0,
                        // yAxisIndex: 2,
                        stack: '交易量',
                        data:[],
                        itemStyle:{
                            normal:{
                                color:'#3CB371'
                            }
                        }
                    },
                    {
                        name:'K线',
                        type:'candlestick',
                        xAxisIndex: 0,
                        yAxisIndex: 1,
                        zlevel: 10,
                        symbolSize: 8,
                        hoverAnimation: false,
                        data:[],
                        // symbol:'circle',
                        showSymbol: false,
                        itemStyle: {
                            color: '#00da3c',
                            color0: '#FF4500',
                            borderColor: '#00da3c',
                            borderColor0: '#FF4500'
                        }
                    },
                    {
                        name:'持仓量',
                        type:'line',
                        xAxisIndex: 1,
                        yAxisIndex: 2,
                        symbolSize: 8,
                        hoverAnimation: false,
                        data: [],
                        // symbol:'circle',
                        showSymbol: false,
                        itemStyle: {
                            normal: {
                                color: "#4682B4",
                                lineStyle: {
                                    color: "#4682B4"
                                }
                            }
                        }
                    },
                    {
                        name:'价格',
                        type:'line',
                        zlevel: 10,
                        xAxisIndex: 1,
                        yAxisIndex: 3,
                        symbolSize: 8,
                        hoverAnimation: false,
                        data: [],
                        // symbol:'circle',
                        showSymbol: false,
                        itemStyle: {
                            normal: {
                                color: "#FF4500",
                                lineStyle: {
                                    color: "#FF4500"
                                }
                            }
                        }
                    },
                    {
                        name:'MA20',
                        type:'line',
                        xAxisIndex: 0,
                        yAxisIndex: 1,
                        data:[],
                        hoverAnimation: false,
                        symbolSize: 8,
                        showSymbol: false,
                        itemStyle:{
                            normal:{
                                color:'#DAA520',
                                lineStyle: {
                                    color: "#DAA520",
                                    width: 1.2
                                }
                            }
                        }
                    },
                    {
                        name:'MA120',
                        type:'line',
                        xAxisIndex: 0,
                        yAxisIndex: 1,
                        zlevel: 9,
                        data:[],
                        hoverAnimation: false,
                        symbolSize: 8,
                        showSymbol: false,
                        itemStyle:{
                            normal:{
                                color:'#2894FF',
                                lineStyle: {
                                    color: "#2894FF",
                                    width: 1.2
                                }
                            }
                        }
                    },
                    {
                        name:'MA720',
                        type:'line',
                        xAxisIndex: 0,
                        yAxisIndex: 1,
                        data:[],
                        hoverAnimation: false,
                        symbolSize: 8,
                        showSymbol: false,
                        itemStyle:{
                            normal:{
                                color:'#BA55D3',
                                lineStyle: {
                                    color: "#BA55D3",
                                    width: 1.2
                                }
                            }
                        }
                    }
                ]
            }
        }
    },
    methods: {
        fetchTrades() {
            let api = 'http://47.99.99.240:2000/trade'
            this.$http({
                url: api,
                params: {
                    exchange: this.exchange,
                    symbol: this.symbol,
                    limit: 1500,
                    size: this.interval
                }
            }).then(body => {
                body = body.data
                let data = this.trades = body.data
                this.setChartOptions(data)
                this.options.legend.selected['K线'] = true
                this.chart.clear()
                this.chart.setOption(this.options)

                clearTimeout(this.timer)
                this.timer = setTimeout(() => {
                    this.fetchTradePush()
                }, 3 * 1000)
            })
        },
        fetchTradePush() {
            let api = 'http://47.99.99.240:2000/trade'
            this.$http({
                url: api,
                params: {
                    exchange: this.exchange,
                    symbol: this.symbol,
                    limit: 6,
                    size: this.interval
                }
            }).then(body => {
                body = body.data
                let data = body.data.slice(3)
                let first = data[0]

                let splitIndex = this.trades.findIndex(item => item.timestamp === first.timestamp && item.position === first.position)
                if (splitIndex === -1) {
                    this.fetchTrades()
                    return
                }
                
                let temps = this.trades.slice(0, splitIndex)
                data = this.trades = temps.concat(data)

                this.setChartOptions(data)                
                this.chart.setOption(this.options)
                

                clearTimeout(this.timer)
                this.timer = setTimeout(() => {
                    this.fetchTradePush()
                }, 3 * 1000)
            })
        },
        setChartOptions(data) {
            let last = data[data.length-1]
            let prev = data[data.length-2]

            if (!prev) {
                return
            }

            let isUp = last.close > prev.close
            let subText = `最后成交价：${last.close}`

            if (last.position > prev.position) {
                if (last.buy_size > last.sell_size) {
                    subText += ` | 换手：${last.volume - (last.position - prev.position)}`
                    subText += ` | 多头加仓：+${last.position - prev.position}`
                } else if (last.buy_size < last.sell_size) {
                    subText += ` | 换手：${last.volume - (last.position - prev.position)}`
                    subText += ` | 空头加仓：+${last.position - prev.position}`
                } else {
                    subText += ` | 换手：${last.volume - (last.position - prev.position)}`
                    subText += ` ${last.position - prev.position}`
                }
            } else if (last.position < prev.position) {
                if (last.buy_size > last.sell_size) {
                    subText += ` | 换手：${last.volume - (prev.position - last.position)}`
                    subText += ` | 空头减仓：-${prev.position - last.position}`
                } else if (last.buy_size < last.sell_size) {
                    subText += ` | 换手：${last.volume - (prev.position - last.position)}`
                    subText += ` | 多头减仓：-${prev.position - last.position}`
                } else {
                    subText += ` | 换手：${last.volume - (prev.position - last.position)}`
                    subText += ` -${prev.position - last.position}`
                }
            }

            if (!last.position) {
                subText += ` | 买入：${last.buy_size}`
                subText += ` | 卖出：${last.sell_size}`
            }

            let positions = data.map(item => {
                if (item.position === 0) {
                    return '-'
                }
                return item.position
            })

            // title更新
            document.title = `${last.close} ${last.symbol}_${last.exchange}`

            this.options.title.text = `${this.exchange}:${this.symbol} 交易数据展示`
            this.options.title.subtext = subText
            this.options.title.subtextStyle.color = isUp ? '#00da3c' : '#FF4500'

            this.options.xAxis[0].data = data.map(item => moment(item.timestamp).format('M/D HH:mm'))
            this.options.xAxis[1].data = data.map(item => moment(item.timestamp).format('M/D HH:mm'))
            
            this.options.series[0].data = data.map(item => item.sell_size)
            this.options.series[1].data = data.map(item => item.buy_size)
            this.options.series[2].data = data.map(item => [item.open, item.close, item.low, item.high])
            this.options.series[3].data = positions
            this.options.series[4].data = data.map(item => item.close)
            this.options.series[5].data = this.ma(data.map(item => item.close), 20)
            this.options.series[6].data = this.ma(data.map(item => item.close), 120)
            this.options.series[7].data = this.ma(data.map(item => item.close), 720)              
        },
        draw() {
            // 绘图方法  
            this.chart = echarts.init(document.getElementById('chart'))  
            // 皮肤添加同一般使用方式  
            this.chart.showLoading(); 
            this.chart.setOption(this.options)
            this.chart.hideLoading()  

            this.chart.on('datazoom', (params) => {
                this.options.dataZoom[0].start = params.start
                this.options.dataZoom[0].end = params.end
                this.options.dataZoom[1].start = params.start
                this.options.dataZoom[1].end = params.end
            })

            this.chart.on('legendselectchanged', (params) => {
                this.options.legend.selected = params.selected
            })

            window.onresize = () => {
                this.chart.resize()
            }
        },
        symbolChange(symbol, exchange) {
            this.symbol = symbol
            this.exchange = exchange
            this.fetchTrades()
        },
        intervalChange(interval) {
            this.interval = interval
            this.fetchTrades()
        },
        ma(data, n = 5) {
            let result = []
            for (let i = 0, len = data.length; i < len; i++) {
                if (i < n) {
                    result.push('-')
                    continue
                }
                let sum = 0
                for (let j = 0; j < n; j++) {
                    sum += data[i - j]
                }
                result.push((sum / n))
            }
            return result
        }
    },
    mounted() {
        this.draw()
        this.fetchTrades()
    }
}
</script>

<style>
    .trade {
        width: 100%;
        height: 100%;
    }
    #chart {
        width: 100%;
        height: 100%;
    }
    .menu {
        position: fixed;
        z-index: 100;
        left: 0;
        top: 50%;
        transform: translate(0, -50%);
        font-size: 14px;
    }
    .menu > ul {
        list-style: none;
        padding: 0;
    }
    .menu li {
        padding: 5px;
        cursor: pointer;
        background: #f2f2f2;
    }
    .menu li.active {
        color: #fff;
        background: #666;
    }
    .menu li.active:hover {
        color: #fff;
        background: #666;
    }
    .menu li:hover {
        background: #d2d2d2;
    }
    .symbol {
        /* border-bottom: 1px solid #d2d2d2; */
        margin: 0;
        margin-bottom: 10px; 
    }
    .interval {
        margin: 0;
    }
</style>


