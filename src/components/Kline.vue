<template>
    <div id="chart_container"></div>
</template>

<script>
import Datafeed from './chartApi/'
export default {
    name: 'Kline',
    data() {
        return {
            props: {
                symbol: 'BitMEX:XBTUSD',
                interval: '1',
                containerId: 'chart_container',
                libraryPath: '/charting_library/',
                chartsStorageUrl: 'https://saveload.tradingview.com',
                chartsStorageApiVersion: '1.1',
                clientId: 'tradingview.com',
                userId: 'public_user_id',
                fullscreen: false,
                autosize: true,
                studiesOverrides: {
                    // "symbolWatermarkProperties.color": "rgba(0, 0, 0, 0)"
                }
            }
        }
    },
    mounted() {
        const widgetOptions = {
			debug: false,
			supports_search: true,
			symbol: this.props.symbol,
			datafeed: Datafeed,
			timezone: 'Asia/Shanghai',
			interval: this.props.interval,
			container_id: this.props.containerId,
			library_path: this.props.libraryPath,
			indicators_file_name: this.props.libraryPath + 'static/customIndicators.js',
			locale: 'zh',
			disabled_features: ['use_localstorage_for_settings'],
			enabled_features: ['study_templates'],
			charts_storage_url: this.props.chartsStorageUrl,
			charts_storage_api_version: this.props.chartsStorageApiVersion,
			client_id: this.props.clientId,
			user_id: this.props.userId,
			fullscreen: this.props.fullscreen,
			autosize: this.props.autosize,
			studies_overrides: this.props.studiesOverrides,
            theme: 'Light',
			overrides: {
				
			}
		};
        window.TradingView.onready(() => {
			const widget = window.tvWidget = new window.TradingView.widget(widgetOptions);

			widget.onChartReady(() => {
				console.log('Chart has loaded!')

				// widget.chart().createStudy('Equity', false, false);

				// 默认指标
				widget.chart().createStudy('MACD', false, true);
				// 创建均线
				widget.chart().createStudy('Moving Average', false, false, [20, 'close', 0], null, {
					'Plot.color': '#00BFFF',
					'Plot.linewidth': 2
				})
				widget.chart().createStudy('Moving Average', false, false, [120, 'close', 0], null, {
					'Plot.color': '#FF00FF',
					'Plot.linewidth': 2
				})
				widget.chart().createStudy('Moving Average', false, false, [720, 'close', 0], null, {
					'Plot.color': '#FFA500',
					'Plot.linewidth': 2
				})
				// // 画线
				// widget.chart().createMultipointShape([
				// 	{time: 1554091200, price: 4100},
				// 	{time: 1554102000, price: 4200}
				// ], {
				// 	shape: 'trend_line'
				// })
				
			});
		});
    }
}
</script>

<style>
    #chart_container {
        height: calc(100vh);
    }
</style>

