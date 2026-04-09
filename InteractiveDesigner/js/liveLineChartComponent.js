function addLiveLineChartComponent(editor) {
  const domc = editor.DomComponents;
  const blockManager = editor.BlockManager;

  blockManager.add('live-areaspline-chart', {
    label: '📊 Live AreaSpline',
    category: 'Charts',
    attributes: { class: 'fa fa-area-chart' },
    content: { type: 'live-areaspline-chart' }
  });

  domc.addType('live-areaspline-chart', {
    model: {
      defaults: {
        tagName: 'div',
        draggable: true,
        droppable: false,
        'script-deps': 'https://code.highcharts.com/highcharts.js',
        traits: [
          {
            type: 'text',
            name: 'csvURL',
            label: 'CSV URL',
            default: 'https://demo-live-data.highcharts.com/time-data.csv'
          },
          {
            type: 'checkbox',
            name: 'enablePolling',
            label: 'Enable Polling',
            valueTrue: 'true',
            valueFalse: 'false',
            default: 'true'
          },
          {
            type: 'number',
            name: 'pollingInterval',
            label: 'Polling Interval (s)',
            default: 1,
            min: 1
          }
        ],
        style: {
          width: '100%',
          height: '400px',
          border: '1px solid #ccc',
          padding: '5px',
          position: 'relative'
        },
        components: `<div class="highchart-live-areaspline" style="width:100%;height:100%;"></div>`,
        script: function () {
          const initChart = () => {
            if (typeof Highcharts === 'undefined') {
              setTimeout(initChart, 500);
              return;
            }

            const container = this.querySelector('.highchart-live-areaspline');
            if (!container) {
              return;
            }

            if (container._chartInstance) {
              container._chartInstance.destroy();
            }

            const pollingEnabled = this.getAttribute('enablepolling') === 'true';
            let pollingInterval = parseInt(this.getAttribute('pollinginterval'), 10);
            if (isNaN(pollingInterval) || pollingInterval < 1) pollingInterval = 1;

            const chart = Highcharts.chart(container, {
              chart: {
                type: 'areaspline',
                animation: Highcharts.svg,
                marginRight: 10,
                events: {
                  load: function () {
                    const series = this.series[0];
                    const chartInstance = this;

                    if (pollingEnabled) {
                      chartInstance._pollingInterval = setInterval(function () {
                        const x = (new Date()).getTime();
                        const y = Math.random();
                        series.addPoint([x, y], true, true);
                      }, pollingInterval * 1000);
                    }
                  }
                }
              },
              title: { text: 'Live Random Data' },
              xAxis: { type: 'datetime' },
              yAxis: {
                title: { text: 'Value' },
                plotLines: [{ value: 0, width: 1, color: '#808080' }]
              },
              tooltip: {
                formatter: function () {
                  return '<b>' + this.series.name + '</b><br/>' +
                    Highcharts.dateFormat('%Y-%m-%d %H:%M:%S', this.x) + '<br/>' +
                    Highcharts.numberFormat(this.y, 2);
                }
              },
              legend: { enabled: false },
              exporting: { enabled: false },
              credits: { enabled: false },
              series: [{
                name: 'Random data',
                data: (function () {
                  const data = [];
                  const time = (new Date()).getTime();
                  for (let i = -9; i <= 0; i++) {
                    data.push({ x: time + i * 1000, y: Math.random() });
                  }
                  return data;
                })()
              }]
            });

            container._chartInstance = chart;

            if (typeof MutationObserver !== 'undefined') {
              const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                  mutation.removedNodes.forEach((node) => {
                    if (node === container.parentElement || (node.contains && node.contains(container))) {
                      if (chart._pollingInterval) {
                        clearInterval(chart._pollingInterval);
                      }
                      if (chart) {
                        chart.destroy();
                      }
                      observer.disconnect();
                    }
                  });
                });
              });

              if (container.parentElement) {
                observer.observe(container.parentElement, { childList: true });
              }
            }
          };

          if (typeof Highcharts === 'undefined') {
            const script = document.createElement('script');
            script.src = 'https://code.highcharts.com/highcharts.js';
            script.onload = initChart;
            script.onerror = () => console.error('Failed to load Highcharts');
            document.head.appendChild(script);
          } else {
            initChart();
          }
        }
      },

      init() {
        this.on('change:attributes', () => {
          this.trigger('change:script');
        });
      }
    },

    view: {
      onRender() {
        const script = this.model.get('script');
        if (script && typeof script === 'function') {
          const el = this.el;
          setTimeout(() => {
            script.bind(el).call();
          }, 100);
        }
      }
    }
  });
}