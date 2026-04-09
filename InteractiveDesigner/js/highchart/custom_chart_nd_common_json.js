function customChartCommonJson(editor) {
    // chart code start (Using Highcharts)
    editor.on('load', () => {
        const iframeHead = editor.Canvas.getDocument().head;

        const libs = [
            "https://cdn.jsdelivr.net/npm/highcharts@11/highcharts.js",
            "https://code.highcharts.com/highcharts-3d.js",
            "https://code.highcharts.com/highcharts-more.js",
            "https://code.highcharts.com/modules/data.js",
            "https://code.highcharts.com/modules/exporting.js",
            "https://code.highcharts.com/modules/accessibility.js",
            "https://cdn.jsdelivr.net/npm/highcharts@11/modules/drilldown.js",
            "https://code.highcharts.com/modules/export-data.js",
            "https://code.highcharts.com/modules/offline-exporting.js"
        ];

        libs.forEach(src => {
            const s = document.createElement("script");
            s.src = src;
            iframeHead.appendChild(s);
        });
    });

    const props_test_chart = (i) => i;
    const id_Trait = {
        name: "id",
        label: "Id",
    };

    const title_Trait = {
        name: "title",
        label: "Title",
    };

    const test_chart_Props = {
        name: "Chart",
        jsonpath: "",
    };

    const name_Trait = {
        changeProp: 1,
        type: "text",
        name: "name",
        label: "name",
        placeholder: "Chart Name",
    };

    const chartTitle_Trait = ["chartTitle"].map((name) => ({
        changeProp: 1,
        type: "text",
        label: "Chart Title",
        placeholder: "Enter Chart Title",
        name,
    }));

    const Select_title_Align_Trait = ["SelectTitleAlign"].map((name) => ({
        changeProp: 1,
        type: "select",
        label: "Select Title Align",
        options: [
            { value: 'left', label: 'Left' },
            { value: 'right', label: 'Right' },
            { value: 'center', label: 'Center' },
        ],
        default: 'left',
        name,
    }));

    const Select_chart_Trait = ["SelectChart"].map((name) => ({
        changeProp: 1,
        type: "select",
        label: "Select Chart",
        options: [
            { value: 'pie', label: 'Pie chart' },
            { value: 'line', label: 'Line chart' },
            { value: 'column', label: 'Column chart' },
            { value: 'bar', label: 'Bar chart' },
            { value: 'donut', label: 'Donut chart' },
            { value: 'scatter', label: 'Scatter chart' },
            { value: 'area', label: 'Area chart' },
            { value: 'bubble', label: 'Bubble chart' },
            { value: 'spiderweb', label: 'Spiderweb chart' },
            { value: 'candlestick', label: 'CandleStick chart' },
            { value: 'candlestick-live', label: 'Candlestick live chart' },
            { value: 'ohlc', label: 'OHLC chart' },
            { value: 'ohlc-live', label: 'OHLC live chart' },
            { value: 'line-column', label: 'Dual axis line and column chart' },
            { value: 'donut-3d', label: '3D Donut chart' },
            { value: 'pie-3d', label: '3D pie chart' },
            { value: 'column-3d', label: '3D Column chart' },
            { value: 'stacked-column', label: 'Stacked Column chart' },
            { value: 'stacked-bar', label: 'Stacked Bar chart' },
            { value: 'drilldown_pie', label: 'Drilldown Pie chart' },
            { value: 'drilldown_line', label: 'Drilldown Line chart' },
            { value: 'drilldown_bar', label: 'Drilldown Bar chart' },
        ],
        default: 'pie',
        name,
    }));

    const json_file_index_Trait = ["jsonFileIndex"].map((name) => ({
        changeProp: 1,
        type: "select",
        label: "Select DataSource File",
        options: [{ value: '0', name: 'Select File' }],
        name,
    }));

    const json_path_Trait = ["jsonpath"].map((name) => ({
        changeProp: 1,
        type: "text",
        label: "DataSource Path",
        placeholder: "Enter DataSource Path",
        name,
    }));

    const json_button_sugesstionTrait = ["jsonButtonSugesstionTrait"].map((name) => ({
        changeProp: 1,
        type: "button",
        label: "DataSource Suggestion",
        placeholder: "DataSource Suggestion",
        name,
        id: "json-suggestion-btn",
        text: "Suggestion",
        class: "json-suggestion-btn",
    }));

    const chart_yAxis_Trait = ["ChartyAxis"].map((name) => ({
        changeProp: 1,
        type: "text",
        placeholder: "yAxis",
        label: "Chart yAxis",
        name,
    }));

    const Select_chart_layout_Trait = ["SelectChartLayout"].map((name) => ({
        changeProp: 1,
        type: "select",
        label: "Select Chart Layout",
        options: [
            { value: 'horizontal', label: 'Horizontal' },
            { value: 'vertical', label: 'Vertical' },
        ],
        default: 'horizontal',
        name,
    }));

    const swap_axis_Trait = ["swapAxis"].map((name) => ({
        changeProp: 1,
        type: "select",
        label: "Swap X/Y Axis",
        options: [
            { value: 'false', label: 'Normal' },
            { value: 'true', label: 'Inverted' },
        ],
        default: 'false',
        name,
    }));

    const legend_colors_Trait = ["legendColors"].map((name) => ({
        changeProp: 1,
        type: "text",
        label: "Legend Colors",
        placeholder: "e.g., #FF0000,#00FF00,#0000FF",
        name,
    }));

    const legend_position_Trait = ["legendPosition"].map((name) => ({
        changeProp: 1,
        type: "select",
        label: "Legend Position",
        options: [
            { value: 'top', label: 'Top' },
            { value: 'middle', label: 'Middle' },
            { value: 'bottom', label: 'Bottom' },
        ],
        default: 'bottom',
        name,
    }));

    const legend_align_Trait = ["legendAlign"].map((name) => ({
        changeProp: 1,
        type: "select",
        label: "Legend Alignment",
        options: [
            { value: 'left', label: 'Left' },
            { value: 'center', label: 'Center' },
            { value: 'right', label: 'Right' },
        ],
        default: 'center',
        name,
    }));

    const getTraitsForChartType = (chartType) => {
        const baseTraits = [
            name_Trait,
            ...chartTitle_Trait,
            ...Select_title_Align_Trait,
            ...Select_chart_Trait,
            ...json_file_index_Trait,
            ...json_path_Trait,
            ...json_button_sugesstionTrait,
            ...chart_yAxis_Trait,
            ...Select_chart_layout_Trait,
            ...legend_colors_Trait,
            ...legend_position_Trait,
            ...legend_align_Trait,
        ];

        const invertibleCharts = [
            'bar', 'column', 'line', 'area', 'scatter',
            'stacked-column', 'stacked-bar', 'line-column', 'bubble'
        ];

        if (invertibleCharts.includes(chartType)) {
            baseTraits.splice(-1, 0, ...swap_axis_Trait);
        }

        return baseTraits;
    };
    const chartStateAttrMap = {
        name: 'data-chart-name',
        chartTitle: 'data-chart-title',
        SelectTitleAlign: 'data-chart-title-align',
        SelectChart: 'data-chart-type',
        jsonFileIndex: 'data-json-file-index',
        jsonpath: 'data-json-path',
        ChartyAxis: 'data-chart-y-axis',
        SelectChartLayout: 'data-chart-layout',
        swapAxis: 'data-chart-swap-axis',
        legendColors: 'data-chart-legend-colors',
        legendPosition: 'data-legend-position',
        legendAlign: 'data-legend-align',
    };
    const chartStateKeys = Object.keys(chartStateAttrMap);
    const buildChartTraits = (chartType) => [id_Trait, title_Trait, ...getTraitsForChartType(chartType || 'pie')];
    const getChartJsonFileIndex = (component) =>
        String(
            component?.get?.('jsonFileIndex') ??
            component?.get?.('json-file-index') ??
            component?.getAttributes?.()?.['data-json-file-index'] ??
            '0'
        ).trim() || '0';

    const setChartJsonFileIndex = (component, value, options = {}) => {
        if (!component || typeof component.set !== 'function') return;
        const nextValue = String(value == null ? '0' : value).trim() || '0';
        component.set('jsonFileIndex', nextValue, options);
        component.set('json-file-index', nextValue, options);
        if (typeof component.addAttributes === 'function') {
            component.addAttributes({ 'data-json-file-index': nextValue });
        }
    };

    const restoreChartStateFromAttributes = (component) => {
        const attrs = component && component.getAttributes ? component.getAttributes() : {};

        chartStateKeys.forEach((key) => {
            const attrName = chartStateAttrMap[key];
            const attrValue = attrs[attrName];
            if (attrValue !== undefined && attrValue !== null && attrValue !== '') {
                if (key === 'jsonFileIndex') {
                    setChartJsonFileIndex(component, String(attrValue), { silent: true });
                } else {
                    component.set(key, String(attrValue), { silent: true });
                }
            }
        });
    };

    const persistChartStateToAttributes = (component) => {
        if (!component || typeof component.addAttributes !== 'function') return;

        const attrsToAdd = {
            'data-gjs-type': 'custom_line_chart',
            'data-i_designer-type': 'custom_line_chart',
        };
        const attrsToRemove = [];

        chartStateKeys.forEach((key) => {
            const attrName = chartStateAttrMap[key];
            const value = key === 'jsonFileIndex' ? getChartJsonFileIndex(component) : component.get(key);
            if (value !== undefined && value !== null && String(value).trim() !== '') {
                attrsToAdd[attrName] = String(value);
            } else {
                attrsToRemove.push(attrName);
            }
        });

        component.addAttributes(attrsToAdd);
        if (typeof component.removeAttributes === 'function') {
            attrsToRemove.forEach((attrName) => component.removeAttributes(attrName));
        }
    };

    const all_Traits = getTraitsForChartType('pie');
    let jsonData = [];
    let common_json = null;
    try {
        common_json = JSON.parse(localStorage.getItem("common_json") || 'null');
    } catch (e) {
        common_json = null;
    }

    if (common_json !== null) {
        jsonData.length = 0;
        jsonData.push(common_json);
        jsonData = JSON.stringify(jsonData);
    }

    editor.Components.addType("custom_line_chart", {
        isComponent: (el) => {
            if (!el || !el.getAttribute) return false;
            if (el.getAttribute('data-gjs-type') === 'custom_line_chart') return { type: 'custom_line_chart' };
            if (el.getAttribute('data-i_designer-type') === 'custom_line_chart') return { type: 'custom_line_chart' };
            return false;
        },
        model: {
            defaults: props_test_chart({
                ...test_chart_Props,
                tagName: "figure",
                resizable: 1,
                jsonFileIndex: '0',
                'json-file-index': '0',
                custom_line_chartsrc: "https://cdn.jsdelivr.net/npm/highcharts@11/highcharts.js",
                droppable: 0,
                stylable: 1,
                attributes: {
                    'data-gjs-type': 'custom_line_chart',
                    'data-i_designer-type': 'custom_line_chart',
                    'data-legend-position': 'bottom',
                    'data-legend-align': 'center',
                    'data-chart-type': 'pie'
                },
                traits: buildChartTraits('pie'),
                style: {
                    padding: "2px",
                    width: "100%",
                },
                script: function () {

                    const initializeChart = () => {
                        if (!window.Highcharts) {
                            setTimeout(initializeChart, 500);
                            return;
                        }
                        const ctx = this.id;
                        const element = document.getElementById(ctx);

                        if (!element) {
                            return;
                        }

                        const existingChart = element.getAttribute('data-chart-initialized');
                        if (existingChart === 'true') {
                            return;
                        }
                        let chart_Title = "{[ chartTitle ]}" || "Chart Title";
                        let chart_Title_align = "{[ SelectTitleAlign ]}" || "left";
                        let JsonPath1 = "{[ jsonpath ]}" || "";
                        let chartType = "{[ SelectChart ]}" || "pie";
                        let chart_yAxis = "{[ ChartyAxis ]}" || "Values";
                        let chart_xAxis = "{[ ChartxAxis ]}" || "Values";
                        let chart_layout = "{[ SelectChartLayout ]}" || "horizontal";
                        let legend_position = (element.getAttribute && element.getAttribute('data-legend-position')) || "{[ legendPosition ]}" || "bottom";
                        let legend_align = (element.getAttribute && element.getAttribute('data-legend-align')) || "{[ legendAlign ]}" || "center";
                        if (legend_position.indexOf('[') >= 0) legend_position = 'bottom';
                        if (legend_align.indexOf('[') >= 0) legend_align = 'center';
                        let swapAxis = "{[ swapAxis ]}" === "true" || false;
                        let legendColors = "{[ legendColors ]}" || "";
                        let customColors = null;
                        if (legendColors && legendColors.trim()) {
                            customColors = legendColors.split(',')
                                .map(color => color.trim())
                                .filter(color => color && /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color));

                            if (customColors.length === 0) {
                                customColors = null;
                            }
                        }

                        let project_type = 'developmentJsonType';
                        let str = null;
                        let seriesData = {};
                        try {
                            if (!JsonPath1 || JsonPath1.indexOf('.') === -1) {
                                throw new Error('Invalid JsonPath1');
                            }
                            let jsonPath3 = JsonPath1;
                            const pathParts = jsonPath3.split('.');
                            const language = pathParts.shift();
                            const jsonPath = pathParts.join('.');

                            if (typeof project_type2 !== 'undefined' && project_type2 === 'downloadedJsonType') {
                                project_type = 'downloadedJsonType';
                            }

                            let commonJson = null;

                            if (project_type === 'developmentJsonType') {
                                let jsonFileIndex = "{[ jsonFileIndex ]}" || "0";

                                if (jsonFileIndex !== "0") {
                                    const filesRaw = localStorage.getItem('common_json_files');
                                    const files = (filesRaw || '').split(',').map(f => f.trim());
                                    const fileName = files[parseInt(jsonFileIndex) - 1];

                                    if (fileName) {
                                        const raw = localStorage.getItem(`common_json_${fileName}`);
                                        if (raw) {
                                            commonJson = JSON.parse(raw);
                                        }
                                    }
                                } else {
                                    const raw = localStorage.getItem('common_json');
                                    if (raw) {
                                        commonJson = JSON.parse(raw);
                                    }
                                }

                                if (commonJson && commonJson[language]) {
                                    let value = commonJson[language];
                                    jsonPath.split('.').forEach(k => value = value?.[k]);
                                    str = value;
                                }

                                if (str) {
                                    seriesData = typeof str === 'string' ? eval(str) : str;
                                }
                            } else if (project_type === 'downloadedJsonType') {
                                let jsonFileIndex = "{[ jsonFileIndex ]}" || "0";
                                const parsedJsonFileIndex = parseInt(jsonFileIndex, 10);
                                const exportedJsonPayload =
                                    typeof jsonData1 !== 'undefined' ? jsonData1 : null;

                                if (Array.isArray(exportedJsonPayload) && exportedJsonPayload.length) {
                                    if (Number.isFinite(parsedJsonFileIndex) && parsedJsonFileIndex > 0) {
                                        commonJson =
                                            exportedJsonPayload[parsedJsonFileIndex] ||
                                            exportedJsonPayload[parsedJsonFileIndex - 1] ||
                                            exportedJsonPayload[0];
                                    } else {
                                        commonJson = exportedJsonPayload[0];
                                    }
                                } else if (exportedJsonPayload && typeof exportedJsonPayload === 'object') {
                                    commonJson = exportedJsonPayload;
                                }

                                if (!commonJson) {
                                    if (jsonFileIndex !== "0") {
                                        const filesRaw = localStorage.getItem('common_json_files');
                                        const files = (filesRaw || '').split(',').map(f => f.trim());
                                        const fileName = files[parsedJsonFileIndex - 1];

                                        if (fileName) {
                                            const raw = localStorage.getItem(`common_json_${fileName}`);
                                            if (raw) {
                                                commonJson = JSON.parse(raw);
                                            }
                                        }
                                    } else {
                                        const raw = localStorage.getItem('common_json');
                                        if (raw) {
                                            commonJson = JSON.parse(raw);
                                        }
                                    }
                                }

                                if (commonJson && commonJson[language]) {
                                    let value = commonJson[language];
                                    jsonPath.split('.').forEach(k => value = value?.[k]);
                                    str = value;
                                }

                                if (str) {
                                    seriesData = typeof str === 'string' ? eval(str) : str;
                                }
                            }

                        } catch (e) {
                            seriesData = {};
                        }

                        let seriesData2 = {};

                        if (chartType === 'pie') {
                            if (!seriesData.series) {
                                seriesData = {
                                    "series": [{
                                        data: [{
                                            name: "Chrome",
                                            y: 70.67
                                        }, {
                                            name: "Edge",
                                            y: 14.77
                                        }, {
                                            name: "Firefox",
                                            y: 4.86
                                        }]
                                    }]
                                };
                            }
                            seriesData2 = {
                                chart: {
                                    plotBackgroundColor: null,
                                    plotBorderWidth: null,
                                    plotShadow: false,
                                    type: chartType,
                                    animation: false,
                                },
                                title: {
                                    text: chart_Title,
                                    align: chart_Title_align
                                },
                                series: seriesData.series,
                                tooltip: {
                                    pointFormat: "{series.name}: <b>{point.percentage:.1f}%</b>"
                                },
                                accessibility: {
                                    point: {
                                        valueSuffix: "%"
                                    }
                                },
                                legend: {
                                    enabled: true,
                                    layout: chart_layout || 'vertical',
                                    align: legend_align,
                                    verticalAlign: legend_position
                                },
                                credits: {
                                    enabled: false
                                },
                                plotOptions: {
                                    pie: {
                                        allowPointSelect: true,
                                        cursor: "pointer",
                                        colors: customColors,
                                        dataLabels: {
                                            enabled: false
                                        },
                                        showInLegend: true,
                                        animation: false
                                    }
                                },
                            };
                        }

                        if (chartType === 'bar') {
                            if (!seriesData.series) {
                                seriesData = {
                                    "xAxis": {
                                        "categories": ["Africa", "America", "Asia", "Europe", "Oceania"]
                                    },
                                    "series": [{
                                        "name": "Year 1990",
                                        "data": [631, 727, 3202, 721, 26]
                                    }, {
                                        "name": "Year 2000",
                                        "data": [814, 841, 3714, 726, 31]
                                    }, {
                                        "name": "Year 2010",
                                        "data": [1044, 944, 4170, 735, 40]
                                    }, {
                                        "name": "Year 2018",
                                        "data": [1276, 1007, 4561, 746, 42]
                                    }]
                                };
                            }
                            seriesData2 = {
                                chart: {
                                    plotBackgroundColor: null,
                                    plotBorderWidth: null,
                                    plotShadow: false,
                                    type: "bar",
                                    animation: false,
                                    inverted: swapAxis
                                },
                                title: {
                                    text: chart_Title,
                                    align: chart_Title_align
                                },
                                xAxis: {
                                    categories: seriesData.xAxis.categories,
                                    title: {
                                        text: null
                                    }
                                },
                                yAxis: {
                                    title: {
                                        text: chart_yAxis
                                    }
                                },
                                tooltip: {
                                    valueSuffix: " millions"
                                },
                                plotOptions: {
                                    bar: {
                                        dataLabels: {
                                            enabled: true
                                        },
                                        animation: false
                                    },
                                    colors: customColors,
                                },
                                legend: {
                                    layout: chart_layout,
                                    align: legend_align,
                                    verticalAlign: legend_position,
                                    x: -40,
                                    y: 80,
                                    floating: true,
                                    borderWidth: 1,
                                    backgroundColor: "#FFFFFF",
                                    shadow: true
                                },
                                credits: {
                                    enabled: false
                                },
                                series: seriesData.series,
                            };
                        }

                        if (chartType === 'line') {
                            if (!seriesData.series) {
                                seriesData = {
                                    "series": [{
                                        "name": "Installation & Developers",
                                        "data": [43934, 48656, 65165, 81827, 112143, 142383, 171533, 165174, 155157, 161454, 154610]
                                    }, {
                                        "name": "Manufacturing",
                                        "data": [24916, 37941, 29742, 29851, 32490, 30282, 38121, 36885, 33726, 34243, 31050]
                                    }]
                                };
                            }
                            seriesData2 = {
                                chart: {
                                    plotBackgroundColor: null,
                                    plotBorderWidth: null,
                                    plotShadow: false,
                                    type: "line",
                                    animation: false,
                                    inverted: swapAxis
                                },
                                title: {
                                    text: chart_Title,
                                    align: chart_Title_align
                                },
                                yAxis: {
                                    title: {
                                        text: chart_yAxis
                                    }
                                },
                                series: seriesData.series,
                                xAxis: {
                                    accessibility: {
                                        rangeDescription: ""
                                    }
                                },
                                legend: {
                                    layout: chart_layout,
                                    align: legend_align,
                                    verticalAlign: legend_position
                                },
                                plotOptions: {
                                    series: {
                                        label: {
                                            connectorAllowed: false
                                        },
                                        pointStart: 2010,
                                        colors: customColors,
                                        animation: false
                                    }
                                },
                                responsive: {
                                    rules: [{
                                        condition: {
                                            maxWidth: 500
                                        },
                                        chartOptions: {
                                            legend: {
                                                layout: chart_layout,
                                                align: legend_align,
                                                verticalAlign: legend_position
                                            }
                                        }
                                    }]
                                },
                                colors: null,
                                credits: { enabled: false }
                            };
                        }

                        if (chartType === 'column') {

                            const hasValidColumnData =
                                seriesData &&
                                Array.isArray(seriesData.series) &&
                                seriesData.xAxis &&
                                Array.isArray(seriesData.xAxis.categories);


                            if (!hasValidColumnData) {
                                seriesData = {
                                    xAxis: {
                                        categories: ["Africa", "America", "Asia"],
                                    },
                                    series: [{
                                        name: "Year 1990",
                                        data: [631, 727, 3202]
                                    }, {
                                        name: "Year 2000",
                                        data: [814, 841, 3714]
                                    }, {
                                        name: "Year 2010",
                                        data: [1044, 944, 4170]
                                    }]
                                };
                            }


                            if (seriesData.chart_Title) chart_Title = seriesData.chart_Title;
                            if (seriesData.chart_Title_align) chart_Title_align = seriesData.chart_Title_align;
                            if (seriesData.chart_yAxis) chart_yAxis = seriesData.chart_yAxis;
                            if (seriesData.chart_xAxis) chart_xAxis = seriesData.chart_xAxis;

                            seriesData2 = {
                                chart: {
                                    plotBackgroundColor: null,
                                    plotBorderWidth: null,
                                    plotShadow: false,
                                    type: "column",
                                    animation: false,
                                    inverted: swapAxis
                                },
                                title: {
                                    text: chart_Title,
                                    align: chart_Title_align
                                },
                                xAxis: {
                                    categories: seriesData.xAxis.categories,
                                    title: {
                                        text: chart_xAxis || null
                                    }
                                },
                                yAxis: {
                                    min: 0,
                                    title: {
                                        text: chart_yAxis
                                    },
                                    labels: {
                                        overflow: "justify"
                                    }
                                },
                                tooltip: {
                                    valueSuffix: ""
                                },
                                plotOptions: {
                                    column: {
                                        dataLabels: {
                                            enabled: true
                                        },
                                        animation: false
                                    },
                                    colors: customColors,
                                },
                                legend: {
                                    layout: chart_layout,
                                    align: legend_align,
                                    verticalAlign: legend_position,
                                    x: -40,
                                    y: 80,
                                    floating: true,
                                    borderWidth: 1,
                                    backgroundColor: "#FFFFFF",
                                    shadow: true
                                },
                                credits: {
                                    enabled: false
                                },
                                series: seriesData.series
                            };
                        }

                        if (chartType === 'stacked-column') {
                            if (!seriesData.series) {
                                seriesData = {
                                    "xAxis": {
                                        categories: ['Arsenal', 'Chelsea'],
                                    },
                                    "series": [{
                                        name: 'BPL',
                                        data: [3, 55]
                                    }, {
                                        name: 'FA Cup',
                                        data: [14, 8]
                                    }, {
                                        name: 'CL',
                                        data: [0, 2]
                                    }]
                                };
                            }
                            seriesData2 = {
                                chart: {
                                    type: 'column',
                                    animation: false,
                                    inverted: swapAxis
                                },
                                title: {
                                    text: chart_Title,
                                    align: chart_Title_align
                                },
                                xAxis: {
                                    categories: seriesData.xAxis.categories,
                                },
                                yAxis: {
                                    min: 0,
                                    title: {
                                        text: chart_yAxis
                                    },
                                    stackLabels: {
                                        enabled: true,
                                        style: {
                                            fontWeight: 'bold',
                                            color: 'gray',
                                            textOutline: 'none'
                                        }
                                    }
                                },
                                legend: {
                                    layout: chart_layout,
                                    align: legend_align,
                                    x: 70,
                                    verticalAlign: legend_position,
                                    y: 70,
                                    floating: true,
                                    backgroundColor: 'white',
                                    borderColor: '#CCC',
                                    borderWidth: 1,
                                    shadow: false
                                },
                                tooltip: {
                                    headerFormat: '<b>{point.x}</b><br/>',
                                    pointFormat: '{series.name}: {point.y}<br/>Total: {point.stackTotal}'
                                },
                                plotOptions: {
                                    column: {
                                        stacking: 'normal',
                                        dataLabels: {
                                            enabled: true
                                        },
                                        animation: false
                                    },
                                    colors: customColors,
                                },

                                series: seriesData.series
                            };
                        }

                        if (chartType === 'stacked-bar') {
                            if (!seriesData.series) {
                                seriesData = {
                                    "xAxis": {
                                        categories: ['2020/21', '2019/20', '2018/19'],
                                    },
                                    "series": [{
                                        name: 'Cristiano Ronaldo',
                                        data: [4, 4, 6]
                                    }, {
                                        name: 'Lionel Messi',
                                        data: [5, 3, 12]
                                    }, {
                                        name: 'Robert Lewandowski',
                                        data: [5, 15, 8]
                                    }]
                                };
                            }
                            seriesData2 = {
                                chart: {
                                    type: 'bar',
                                    animation: false,
                                    inverted: swapAxis
                                },
                                title: {
                                    text: chart_Title,
                                    align: chart_Title_align
                                },
                                xAxis: {
                                    categories: seriesData.xAxis.categories,
                                },
                                yAxis: {
                                    min: 0,
                                    title: {
                                        text: chart_yAxis
                                    }
                                },
                                legend: {
                                    reversed: true
                                },
                                plotOptions: {
                                    series: {
                                        stacking: 'normal',
                                        dataLabels: {
                                            enabled: true
                                        },
                                        animation: false
                                    },
                                    colors: customColors,
                                },

                                series: seriesData.series
                            };
                        }

                        if (chartType === 'drilldown_bar') {
                            if (!seriesData.series) {
                                seriesData = {
                                    "series": [{
                                        "name": "Browsers",
                                        "colorByPoint": true,
                                        "data": [{
                                            "name": "Chrome",
                                            "y": 61.04,
                                            "drilldown": "Chrome"
                                        }, {
                                            "name": "Safari",
                                            "y": 9.47,
                                            "drilldown": "Safari"
                                        }, {
                                            "name": "Other",
                                            "y": 11.02,
                                            "drilldown": null
                                        }]
                                    }],
                                    "drilldown": {
                                        "series": [{
                                            "name": "Chrome",
                                            "id": "Chrome",
                                            "data": [["v97.0", 36.89], ["v96.0", 18.16], ["v95.0", 0.54]]
                                        }, {
                                            "name": "Safari",
                                            "id": "Safari",
                                            "data": [["v15.3", 0.1], ["v15.2", 2.01], ["v15.1", 2.29]]
                                        }]
                                    }
                                };
                            }
                            seriesData2 = {
                                chart: {
                                    type: "bar",
                                    animation: false
                                },
                                title: {
                                    text: chart_Title,
                                    align: chart_Title_align
                                },

                                xAxis: {
                                    type: "category"
                                },
                                yAxis: {
                                    title: {
                                        text: chart_yAxis
                                    }
                                },
                                tooltip: {
                                    valueSuffix: ""
                                },
                                plotOptions: {
                                    series: {
                                        borderWidth: 0,
                                        dataLabels: {
                                            enabled: true,
                                            format: "{point.y:.1f}%"
                                        },
                                        animation: false,
                                        colors: customColors,
                                    }
                                },
                                legend: {
                                    enabled: false
                                },
                                credits: {
                                    enabled: false
                                },
                                series: seriesData.series,
                                drilldown: seriesData.drilldown
                            };
                        }

                        if (chartType === 'drilldown_pie') {
                            if (!seriesData.series) {
                                seriesData = {
                                    "series": [{
                                        "name": "Browsers",
                                        "colorByPoint": true,
                                        "data": [{
                                            "name": "Chrome",
                                            "y": 61.04,
                                            "drilldown": "Chrome"
                                        }, {
                                            "name": "Safari",
                                            "y": 9.47,
                                            "drilldown": "Safari"
                                        }]
                                    }],
                                    "drilldown": {
                                        "series": [{
                                            "name": "Chrome",
                                            "id": "Chrome",
                                            "data": [["v97.0", 36.89], ["v96.0", 18.16], ["v95.0", 0.54]]
                                        }, {
                                            "name": "Safari",
                                            "id": "Safari",
                                            "data": [["v15.3", 0.1], ["v15.2", 2.01]]
                                        }]
                                    }
                                };
                            }
                            seriesData2 = {
                                chart: {
                                    type: "pie",
                                    animation: false
                                },
                                title: {
                                    text: chart_Title,
                                    align: chart_Title_align
                                },

                                tooltip: {
                                    pointFormat: "{series.name}: <b>{point.percentage:.1f}%</b>"
                                },
                                accessibility: {
                                    point: {
                                        valueSuffix: "%"
                                    }
                                },
                                legend: {
                                    enabled: true,
                                    layout: chart_layout || 'vertical',
                                    align: legend_align,
                                    verticalAlign: legend_position
                                },
                                credits: {
                                    enabled: false
                                },
                                plotOptions: {
                                    pie: {
                                        allowPointSelect: true,
                                        cursor: "pointer",
                                        dataLabels: {
                                            enabled: false
                                        },
                                        colors: customColors,
                                        showInLegend: true,
                                        animation: false
                                    }
                                },
                                series: seriesData.series,
                                drilldown: seriesData.drilldown
                            };
                        }

                        if (chartType === 'drilldown_line') {
                            if (!seriesData.series) {
                                seriesData = {
                                    "series": [{
                                        "name": "Things",
                                        "colorByPoint": true,
                                        "data": [{
                                            "name": "Animals",
                                            "y": 5,
                                            "drilldown": "animals"
                                        }, {
                                            "name": "Fruits",
                                            "y": 2,
                                            "drilldown": "fruits"
                                        }]
                                    }],
                                    "drilldown": {
                                        "series": [{
                                            "id": "animals",
                                            "data": [["Cats", 4], ["Dogs", 2], ["Cows", 1]]
                                        }, {
                                            "id": "fruits",
                                            "data": [["Apples", 4], ["Oranges", 2]]
                                        }]
                                    }
                                };
                            }
                            seriesData2 = {
                                chart: {
                                    type: "line",
                                    animation: false
                                },
                                title: {
                                    text: chart_Title,
                                    align: chart_Title_align
                                },

                                yAxis: {
                                    title: {
                                        text: chart_yAxis
                                    }
                                },
                                series: seriesData.series,
                                drilldown: seriesData.drilldown,
                                xAxis: {
                                    accessibility: {
                                        rangeDescription: ""
                                    }
                                },
                                legend: {
                                    layout: chart_layout,
                                    align: legend_align,
                                    verticalAlign: legend_position
                                },
                                plotOptions: {
                                    series: {
                                        label: {
                                            connectorAllowed: false
                                        },
                                        pointStart: 2010,
                                        animation: false,
                                        colors: customColors,
                                    }
                                },
                                responsive: {
                                    rules: [{
                                        condition: {
                                            maxWidth: 500
                                        },
                                        chartOptions: {
                                            legend: {
                                                layout: chart_layout,
                                                align: legend_align,
                                                verticalAlign: legend_position
                                            }
                                        }
                                    }]
                                },
                                credits: { enabled: false },
                            };
                        }

                        if (chartType === 'donut') {
                            if (!seriesData || !Array.isArray(seriesData.series)) {
                                seriesData = {
                                    series: [{
                                        name: 'Accounts',
                                        colorByPoint: true,
                                        innerSize: '75%',
                                        data: [
                                            { name: 'Savings', y: 0.44, color: '#F5A623' },
                                            { name: 'Deposits', y: 99.56, color: '#FFFF33' }
                                        ]
                                    }]
                                };
                            }

                            const finalTitle = seriesData.chart_Title || chart_Title;
                            const finalTitleAlign = seriesData.chart_Title_align || chart_Title_align;

                            const isVertical = seriesData.orientation === 'vertical';
                            const startAngle = isVertical ? 0 : 90;
                            const endAngle = isVertical ? 360 : 450;


                            const showCenterLabel = seriesData.showCenterLabel !== false;

                            seriesData2 = {
                                chart: {
                                    type: 'pie',
                                    animation: false,
                                    events: {
                                        render() {
                                            const chart = this;
                                            const series = chart.series[0];

                                            if (!showCenterLabel) {
                                                if (chart.customCenterLabel) {
                                                    chart.customCenterLabel.destroy();
                                                    chart.customCenterLabel = null;
                                                }
                                                return;
                                            }

                                            if (!chart.customCenterLabel) {
                                                chart.customCenterLabel = chart.renderer.label(
                                                    'Out of<br/><strong>100%</strong>'
                                                )
                                                    .css({
                                                        color: '#000000',
                                                        textAlign: 'center'
                                                    })
                                                    .add();
                                            }

                                            const label = chart.customCenterLabel;
                                            const bbox = label.getBBox();

                                            const x = chart.plotLeft + series.center[0] - bbox.width / 2;
                                            const y = chart.plotTop + series.center[1] - bbox.height / 2;

                                            label.attr({ x, y });
                                            label.css({
                                                fontSize: (series.center[2] / 10) + 'px'
                                            });
                                        }
                                    }
                                },

                                title: {
                                    text: finalTitle,
                                    align: finalTitleAlign
                                },

                                accessibility: {
                                    point: { valueSuffix: '%' }
                                },

                                tooltip: {
                                    pointFormat: '{point.name}: <b>{point.percentage:.2f}%</b>'
                                },

                                legend: {
                                    enabled: true,
                                    align: legend_align,
                                    verticalAlign: legend_position,
                                    layout: chart_layout
                                },

                                plotOptions: {
                                    pie: {
                                        startAngle: startAngle,
                                        endAngle: endAngle
                                    },
                                    series: {
                                        allowPointSelect: true,
                                        cursor: 'pointer',
                                        borderRadius: 8,
                                        colors: customColors,


                                        dataLabels: [
                                            { enabled: false },
                                            { enabled: false }
                                        ],

                                        showInLegend: true
                                    }
                                },

                                series: seriesData.series,
                                credits: { enabled: false }
                            };
                        }

                        if (chartType === 'scatter') {
                            if (!seriesData.series) {
                                seriesData = {
                                    series: [
                                        {
                                            name: 'Basketball',
                                            marker: { symbol: 'circle' },
                                            data: [
                                                [2.01, 98], [2.05, 104], [2.00, 95], [2.10, 110], [2.02, 102]
                                            ]
                                        },
                                        {
                                            name: 'Triathlon',
                                            marker: { symbol: 'triangle' },
                                            data: [
                                                [1.75, 65], [1.80, 70], [1.78, 68], [1.82, 72], [1.76, 67]
                                            ]
                                        },
                                        {
                                            name: 'Volleyball',
                                            marker: { symbol: 'square' },
                                            data: [
                                                [1.90, 85], [1.88, 82], [1.95, 90], [1.92, 88], [1.87, 84]
                                            ]
                                        }
                                    ]
                                };
                            }

                            seriesData2 = {
                                chart: {
                                    type: 'scatter',
                                    animation: false,
                                    zooming: {
                                        type: 'xy'
                                    },
                                    inverted: swapAxis
                                },
                                title: {
                                    text: chart_Title || 'Olympics athletes by height and weight',
                                    align: chart_Title_align || 'center'
                                },
                                xAxis: {
                                    title: { text: 'Height' },
                                    labels: { format: '{value} m' },
                                    startOnTick: true,
                                    endOnTick: true,
                                    showLastLabel: true
                                },
                                yAxis: {
                                    title: { text: 'Weight' },
                                    labels: { format: '{value} kg' }
                                },
                                legend: {
                                    enabled: true,
                                    layout: chart_layout || 'vertical',
                                    align: legend_align,
                                    verticalAlign: legend_position
                                },
                                tooltip: {
                                    pointFormat: 'Height: {point.x} m <br/> Weight: {point.y} kg'
                                },
                                plotOptions: {
                                    scatter: {
                                        marker: {
                                            radius: 2.5,
                                            symbol: 'circle',
                                            states: {
                                                hover: {
                                                    enabled: true,
                                                    lineColor: 'rgb(100,100,100)'
                                                }
                                            }
                                        },
                                        states: {
                                            hover: {
                                                marker: {
                                                    enabled: false
                                                }
                                            }
                                        },
                                        jitter: { x: 0.005 }
                                    },
                                    colors: customColors,
                                },

                                series: seriesData.series,
                                credits: { enabled: false }
                            };
                        }

                        if (chartType === 'area') {
                            if (!seriesData.series) {
                                seriesData = {
                                    series: [{
                                        name: 'Asia',
                                        data: [502, 635, 809, 947, 1402, 3634, 5268]
                                    }, {
                                        name: 'Africa',
                                        data: [106, 107, 111, 133, 221, 767, 1766]
                                    }, {
                                        name: 'Europe',
                                        data: [163, 203, 276, 408, 547, 729, 628]
                                    }, {
                                        name: 'America',
                                        data: [18, 31, 54, 156, 339, 818, 1201]
                                    }, {
                                        name: 'Oceania',
                                        data: [2, 2, 2, 6, 13, 30, 46]
                                    }]
                                };
                            }

                            seriesData2 = {
                                chart: {
                                    type: 'area',
                                    animation: false,
                                    inverted: swapAxis
                                },
                                title: {
                                    text: chart_Title || 'Historic and Estimated Population Growth by Region',
                                    align: chart_Title_align || 'center'
                                },
                                xAxis: {
                                    allowDecimals: false,
                                    labels: {
                                        formatter: function () {
                                            return this.value;
                                        }
                                    },
                                    accessibility: {
                                        rangeDescription: 'Range: 1750 to 2050'
                                    },
                                    categories: ['1750', '1800', '1850', '1900', '1950', '2000', '2050']
                                },
                                yAxis: {
                                    title: {
                                        text: 'Population (millions)'
                                    },
                                    labels: {
                                        formatter: function () {
                                            return this.value / 1000 + 'B';
                                        }
                                    }
                                },
                                tooltip: {
                                    pointFormat: '{series.name} had <b>{point.y:,.0f}</b><br/> people in {point.category}'
                                },
                                plotOptions: {
                                    area: {
                                        stacking: 'normal',
                                        lineColor: '#666666',
                                        lineWidth: 1,
                                        marker: {
                                            lineWidth: 1,
                                            lineColor: '#666666'
                                        }
                                    },
                                    colors: customColors,
                                },
                                legend: {
                                    layout: chart_layout || 'vertical',
                                    align: legend_align,
                                    verticalAlign: legend_position
                                },

                                series: seriesData.series,
                                credits: { enabled: false }
                            };
                        }

                        if (chartType === 'bubble') {
                            if (!seriesData.series) {
                                seriesData = {
                                    series: [{
                                        colorByPoint: true,
                                        data: [
                                            { x: 95, y: 95, z: 13.8, name: 'BE', country: 'Belgium' },
                                            { x: 86.5, y: 102.9, z: 14.7, name: 'DE', country: 'Germany' },
                                            { x: 80.8, y: 91.5, z: 15.8, name: 'FI', country: 'Finland' },
                                            { x: 80.4, y: 102.5, z: 12, name: 'NL', country: 'Netherlands' },
                                            { x: 80.3, y: 86.1, z: 11.8, name: 'SE', country: 'Sweden' },
                                            { x: 78.4, y: 70.1, z: 16.6, name: 'ES', country: 'Spain' },
                                            { x: 74.2, y: 68.5, z: 14.5, name: 'FR', country: 'France' },
                                            { x: 73.5, y: 83.1, z: 10, name: 'NO', country: 'Norway' },
                                            { x: 71, y: 93.2, z: 24.7, name: 'UK', country: 'United Kingdom' },
                                            { x: 69.2, y: 57.6, z: 10.4, name: 'IT', country: 'Italy' },
                                            { x: 68.6, y: 20, z: 16, name: 'RU', country: 'Russia' },
                                            { x: 65.5, y: 126.4, z: 35.3, name: 'US', country: 'United States' },
                                            { x: 65.4, y: 50.8, z: 28.5, name: 'HU', country: 'Hungary' },
                                            { x: 63.4, y: 51.8, z: 15.4, name: 'PT', country: 'Portugal' },
                                            { x: 64, y: 82.9, z: 31.3, name: 'NZ', country: 'New Zealand' }
                                        ]
                                    }]
                                };
                            }

                            seriesData2 = {
                                chart: {
                                    type: 'bubble',
                                    animation: false,
                                    plotBorderWidth: 1,
                                    zooming: {
                                        type: 'xy'
                                    },
                                    inverted: swapAxis
                                },
                                title: {
                                    text: chart_Title || 'Sugar and fat intake per country',
                                    align: chart_Title_align || 'center'
                                },

                                accessibility: {
                                    point: {
                                        valueDescriptionFormat:
                                            '{index}. {point.name}, fat: {point.x}g, sugar: {point.y}g, obesity: {point.z}%.'
                                    }
                                },
                                xAxis: {
                                    gridLineWidth: 1,
                                    title: { text: 'Daily fat intake' },
                                    labels: { format: '{value} gr' },
                                    plotLines: [{
                                        dashStyle: 'dot',
                                        width: 2,
                                        value: 65,
                                        label: {
                                            rotation: 0,
                                            y: 15,
                                            style: { fontStyle: 'italic' },
                                            text: 'Safe fat intake 65g/day'
                                        },
                                        zIndex: 3
                                    }],
                                    accessibility: {
                                        rangeDescription: 'Range: 60 to 100 grams.'
                                    }
                                },
                                yAxis: {
                                    startOnTick: false,
                                    endOnTick: false,
                                    title: { text: 'Daily sugar intake' },
                                    labels: { format: '{value} gr' },
                                    maxPadding: 0.2,
                                    plotLines: [{
                                        dashStyle: 'dot',
                                        width: 2,
                                        value: 50,
                                        label: {
                                            align: 'right',
                                            style: { fontStyle: 'italic' },
                                            text: 'Safe sugar intake 50g/day',
                                            x: -10
                                        },
                                        zIndex: 3
                                    }],
                                    accessibility: {
                                        rangeDescription: 'Range: 0 to 160 grams.'
                                    }
                                },
                                legend: {
                                    enabled: false
                                },
                                tooltip: {
                                    useHTML: true,
                                    headerFormat: '<table>',
                                    pointFormat:
                                        '<tr><th colspan="2"><h3>{point.country}</h3></th></tr>' +
                                        '<tr><th>Fat intake:</th><td>{point.x}g</td></tr>' +
                                        '<tr><th>Sugar intake:</th><td>{point.y}g</td></tr>' +
                                        '<tr><th>Obesity (adults):</th><td>{point.z}%</td></tr>',
                                    footerFormat: '</table>',
                                    followPointer: true
                                },
                                plotOptions: {
                                    series: {
                                        dataLabels: {
                                            enabled: true,
                                            format: '{point.name}'
                                        }
                                    },
                                    colors: customColors,
                                },
                                series: seriesData.series,
                                credits: { enabled: false }
                            };
                        }

                        if (chartType === 'spiderweb') {
                            if (!seriesData.series) {
                                seriesData = {
                                    series: [
                                        {
                                            name: 'Allocated Budget',
                                            data: [43000, 19000, 60000, 35000, 17000, 10000],
                                            pointPlacement: 'on'
                                        },
                                        {
                                            name: 'Actual Spending',
                                            data: [50000, 39000, 42000, 31000, 26000, 14000],
                                            pointPlacement: 'on'
                                        }
                                    ]
                                };
                            }

                            seriesData2 = {
                                chart: {
                                    polar: true,
                                    type: 'line',
                                    animation: false
                                },
                                title: {
                                    text: chart_Title || 'Budget vs spending',
                                    x: -80,
                                    align: chart_Title_align || 'center'
                                },

                                accessibility: {
                                    description:
                                        'A spiderweb chart compares the allocated budget against actual spending. Each spoke represents a department. The chart shows departments like Marketing and IT overspending the most.'
                                },
                                pane: {
                                    size: '80%'
                                },
                                xAxis: {
                                    categories: [
                                        'Sales',
                                        'Marketing',
                                        'Development',
                                        'Customer Support',
                                        'Information Technology',
                                        'Administration'
                                    ],
                                    tickmarkPlacement: 'on',
                                    lineWidth: 0
                                },
                                yAxis: {
                                    gridLineInterpolation: 'polygon',
                                    lineWidth: 0,
                                    min: 0
                                },
                                tooltip: {
                                    shared: true,
                                    pointFormat:
                                        '<span style="color:{series.color}">{series.name}: <b>${point.y:,.0f}</b><br/>'
                                },
                                legend: {
                                    layout: chart_layout || 'vertical',
                                    align: legend_align,
                                    verticalAlign: legend_position
                                },
                                responsive: {
                                    rules: [{
                                        condition: {
                                            maxWidth: 500
                                        },
                                        chartOptions: {
                                            title: {
                                                x: 0
                                            },
                                            legend: {
                                                align: legend_align,
                                                verticalAlign: legend_position,
                                                layout: 'horizontal'
                                            },
                                            pane: {
                                                size: '70%'
                                            }
                                        }
                                    }]
                                },
                                series: seriesData.series,
                                credits: { enabled: false }
                            };
                        }

                        if (chartType === 'candlestick') {
                            if (!seriesData.series) {
                                seriesData = {
                                    series: [{
                                        type: 'candlestick',
                                        name: 'AAPL',
                                        data: [
                                            [Date.UTC(2024, 4, 1), 140.0, 145.0, 138.0, 143.0],
                                            [Date.UTC(2024, 4, 2), 143.0, 147.0, 141.0, 146.5],
                                            [Date.UTC(2024, 4, 3), 146.5, 150.0, 145.0, 148.0],
                                            [Date.UTC(2024, 4, 4), 148.0, 149.0, 144.0, 145.0],
                                            [Date.UTC(2024, 4, 5), 145.0, 146.0, 140.0, 142.0]
                                        ]
                                    }]
                                };
                            }

                            seriesData2 = {
                                chart: {
                                    type: 'candlestick',
                                    animation: false
                                },
                                title: {
                                    text: chart_Title || 'AAPL Stock Price (Demo)',
                                    align: chart_Title_align || 'center'
                                },
                                xAxis: {
                                    type: 'datetime'
                                },
                                yAxis: {
                                    title: {
                                        text: 'Stock Price'
                                    }
                                },
                                tooltip: {
                                    split: true,
                                    valueDecimals: 2
                                },
                                plotOptions: {
                                    series: {
                                        color: customColors ? customColors[0] : '#d32f2f',
                                        upColor: customColors ? customColors[1] : '#388e3c'
                                    }
                                },
                                series: seriesData.series,
                                responsive: {
                                    rules: [{
                                        condition: {
                                            maxWidth: 500
                                        },
                                        chartOptions: {
                                            xAxis: {
                                                labels: {
                                                    rotation: -45
                                                }
                                            }
                                        }
                                    }]
                                },
                                credits: {
                                    enabled: false
                                }
                            };
                        }

                        if (chartType === 'candlestick-live') {
                            const symbol = 'btcusdt';
                            const interval = '1m';

                            seriesData = {
                                series: [{
                                    type: 'candlestick',
                                    name: 'BTC/USDT',
                                    id: 'live-series',
                                    data: []
                                }]
                            };

                            seriesData2 = {
                                chart: {
                                    type: 'candlestick',
                                    events: {
                                        load: function () {
                                            const chart = this;
                                            const series = chart.get('live-series');

                                            fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol.toUpperCase()}&interval=${interval}&limit=100`)
                                                .then(res => res.json())
                                                .then(data => {
                                                    const ohlc = data.map(d => [
                                                        d[0],
                                                        parseFloat(d[1]),
                                                        parseFloat(d[2]),
                                                        parseFloat(d[3]),
                                                        parseFloat(d[4]),
                                                    ]);
                                                    series.setData(ohlc, true, false, false);
                                                });


                                            const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol}@kline_${interval}`);

                                            ws.onmessage = function (event) {
                                                const msg = JSON.parse(event.data);
                                                const k = msg.k;

                                                const point = [
                                                    k.t,
                                                    parseFloat(k.o),
                                                    parseFloat(k.h),
                                                    parseFloat(k.l),
                                                    parseFloat(k.c)
                                                ];

                                                const last = series.data[series.data.length - 1];
                                                if (last && last.x === point[0]) {

                                                    last.update({
                                                        open: point[1],
                                                        high: point[2],
                                                        low: point[3],
                                                        close: point[4]
                                                    }, true, false);
                                                } else {

                                                    series.addPoint(point, true, series.data.length > 100);
                                                }
                                            };
                                        }
                                    }
                                },
                                title: {
                                    text: chart_Title || 'Live BTC/USDT Candlestick Chart',
                                    align: chart_Title_align || 'center'
                                },

                                xAxis: {
                                    type: 'datetime'
                                },
                                yAxis: {
                                    title: {
                                        text: 'Price'
                                    }
                                },
                                tooltip: {
                                    split: true,
                                    valueDecimals: 2
                                },
                                plotOptions: {
                                    candlestick: {
                                        color: customColors ? customColors[0] : '#d32f2f',
                                        upColor: customColors ? customColors[1] : '#388e3c'
                                    }
                                },
                                series: seriesData.series,
                                credits: {
                                    enabled: false
                                }
                            };
                        }

                        if (chartType === 'ohlc') {
                            seriesData = {
                                series: [{
                                    type: 'ohlc',
                                    name: 'Demo OHLC',
                                    id: 'ohlc-static-series',
                                    data: [
                                        [Date.UTC(2023, 7, 1), 100, 110, 90, 105],
                                        [Date.UTC(2023, 7, 2), 105, 115, 95, 100],
                                        [Date.UTC(2023, 7, 3), 100, 108, 97, 107],
                                        [Date.UTC(2023, 7, 4), 107, 112, 102, 104],
                                        [Date.UTC(2023, 7, 5), 104, 118, 100, 117]
                                    ]
                                }]
                            };

                            seriesData2 = {
                                chart: {
                                    type: 'ohlc'
                                },
                                title: {
                                    text: chart_Title || 'Static OHLC Chart',
                                    align: chart_Title_align || 'center'
                                },

                                xAxis: {
                                    type: 'datetime'
                                },
                                yAxis: {
                                    title: {
                                        text: 'Price'
                                    }
                                },
                                tooltip: {
                                    split: true,
                                    valueDecimals: 2
                                },
                                plotOptions: {
                                    ohlc: {
                                        color: customColors ? customColors[0] : '#d32f2f',
                                        upColor: customColors ? customColors[1] : '#388e3c'
                                    }
                                },
                                series: seriesData.series,
                                credits: {
                                    enabled: false
                                }
                            };
                        }

                        if (chartType === 'ohlc-live') {
                            const symbol = 'btcusdt';
                            const interval = '1m';

                            seriesData = {
                                series: [{
                                    type: 'ohlc',
                                    name: 'BTC/USDT',
                                    id: 'live-ohlc-series',
                                    data: []
                                }]
                            };

                            seriesData2 = {
                                chart: {
                                    type: 'ohlc',
                                    events: {
                                        load: function () {
                                            const chart = this;
                                            const series = chart.get('live-ohlc-series');

                                            fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol.toUpperCase()}&interval=${interval}&limit=100`)
                                                .then(res => res.json())
                                                .then(data => {
                                                    const ohlc = data.map(d => [
                                                        d[0],
                                                        parseFloat(d[1]),
                                                        parseFloat(d[2]),
                                                        parseFloat(d[3]),
                                                        parseFloat(d[4])
                                                    ]);
                                                    series.setData(ohlc, true, false, false);
                                                });

                                            const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol}@kline_${interval}`);

                                            ws.onmessage = function (event) {
                                                const msg = JSON.parse(event.data);
                                                const k = msg.k;

                                                const point = [
                                                    k.t,
                                                    parseFloat(k.o),
                                                    parseFloat(k.h),
                                                    parseFloat(k.l),
                                                    parseFloat(k.c)
                                                ];

                                                const last = series.data[series.data.length - 1];
                                                if (last && last.x === point[0]) {
                                                    last.update({
                                                        open: point[1],
                                                        high: point[2],
                                                        low: point[3],
                                                        close: point[4]
                                                    }, true, false);
                                                } else {
                                                    series.addPoint(point, true, series.data.length > 100);
                                                }
                                            };
                                        }
                                    }
                                },
                                title: {
                                    text: chart_Title || 'Live BTC/USDT OHLC Chart',
                                    align: chart_Title_align || 'center'
                                },

                                xAxis: {
                                    type: 'datetime'
                                },
                                yAxis: {
                                    title: {
                                        text: 'Price'
                                    }
                                },
                                tooltip: {
                                    split: true,
                                    valueDecimals: 2
                                },
                                plotOptions: {
                                    ohlc: {
                                        color: customColors ? customColors[0] : '#d32f2f',
                                        upColor: customColors ? customColors[1] : '#388e3c'
                                    }
                                },
                                series: seriesData.series,
                                credits: {
                                    enabled: false
                                }
                            };
                        }

                        if (chartType === 'line-column') {
                            if (!seriesData.series) {
                                seriesData = {
                                    series: [{
                                        name: 'Precipitation',
                                        type: 'column',
                                        yAxis: 1,
                                        data: [45.7, 37.0, 28.9, 17.1, 39.2, 18.9, 90.2, 78.5, 74.6, 18.7, 17.1, 16.0],
                                        tooltip: {
                                            valueSuffix: ' mm'
                                        }
                                    }, {
                                        name: 'Temperature',
                                        type: 'spline',
                                        data: [-11.4, -9.5, -14.2, 0.2, 7.0, 12.1, 13.5, 13.6, 8.2, -2.8, -12.0, -15.5],
                                        tooltip: {
                                            valueSuffix: '°C'
                                        }
                                    }]
                                };
                            }

                            seriesData2 = {
                                chart: {
                                    zooming: { type: 'xy' },
                                    animation: false,
                                    inverted: swapAxis
                                },
                                title: {
                                    text: chart_Title || 'Karasjok weather, 2023',
                                    align: chart_Title_align || 'left'
                                },

                                xAxis: [{
                                    categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                                        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                                    crosshair: true
                                }],
                                yAxis: [{
                                    labels: {
                                        format: '{value}°C'
                                    },
                                    title: {
                                        text: 'Temperature'
                                    },
                                    lineColor: Highcharts.getOptions().colors[1],
                                    lineWidth: 2
                                }, {
                                    title: {
                                        text: 'Precipitation'
                                    },
                                    labels: {
                                        format: '{value} mm'
                                    },
                                    lineColor: Highcharts.getOptions().colors[0],
                                    lineWidth: 2,
                                    opposite: true
                                }],
                                tooltip: {
                                    shared: true
                                },
                                legend: {
                                    align: legend_align,
                                    verticalAlign: legend_position
                                },
                                series: seriesData.series,
                                responsive: {
                                    rules: [{
                                        condition: {
                                            maxWidth: 500
                                        },
                                        chartOptions: {
                                            legend: {
                                                layout: chart_layout || 'horizontal',
                                                align: legend_align,
                                                verticalAlign: legend_position
                                            }
                                        }
                                    }]
                                },
                                credits: {
                                    enabled: false
                                }
                            };
                        }

                        if (chartType === 'donut-3d') {
                            if (!seriesData.series) {
                                seriesData = {
                                    series: [{
                                        name: 'Medals',
                                        data: [
                                            ['Norway', 16],
                                            ['Germany', 12],
                                            ['USA', 8],
                                            ['Sweden', 8],
                                            ['Netherlands', 8],
                                            ['ROC', 6],
                                            ['Austria', 7],
                                            ['Canada', 4],
                                            ['Japan', 3]
                                        ]
                                    }]
                                };
                            }

                            seriesData2 = {
                                chart: {
                                    type: 'pie',
                                    options3d: {
                                        enabled: true,
                                        alpha: 45
                                    },
                                    animation: false
                                },
                                title: {
                                    text: chart_Title || 'Beijing 2022 gold medals by country',
                                    align: chart_Title_align || 'center'
                                },

                                subtitle: {
                                    text: '3D donut in Highcharts'
                                },
                                plotOptions: {
                                    pie: {
                                        innerSize: 100,
                                        depth: 45,
                                        colors: customColors
                                    }
                                },
                                series: seriesData.series,
                                responsive: {
                                    rules: [{
                                        condition: {
                                            maxWidth: 500
                                        },
                                        chartOptions: {
                                            legend: {
                                                enabled: false
                                            }
                                        }
                                    }]
                                },
                                credits: {
                                    enabled: false
                                }
                            };
                        }

                        if (chartType === 'pie-3d') {
                            if (!seriesData.series) {
                                seriesData = {
                                    series: [{
                                        type: 'pie',
                                        name: 'Share',
                                        data: [
                                            ['Samsung', 23],
                                            ['Apple', 18],
                                            {
                                                name: 'Xiaomi',
                                                y: 12,
                                                sliced: true,
                                                selected: true
                                            },
                                            ['Oppo*', 9],
                                            ['Vivo', 8],
                                            ['Others', 30]
                                        ]
                                    }]
                                };
                            }

                            seriesData2 = {
                                chart: {
                                    type: 'pie',
                                    options3d: {
                                        enabled: true,
                                        alpha: 45,
                                        beta: 0
                                    },
                                    animation: false
                                },
                                title: {
                                    text: chart_Title || 'Global smartphone shipments market share, Q1 2022',
                                    align: chart_Title_align || 'center'
                                },

                                accessibility: {
                                    point: {
                                        valueSuffix: '%'
                                    }
                                },
                                tooltip: {
                                    pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
                                },
                                plotOptions: {
                                    pie: {
                                        allowPointSelect: true,
                                        cursor: 'pointer',
                                        depth: 35,
                                        colors: customColors,
                                        dataLabels: {
                                            enabled: true,
                                            format: '{point.name}'
                                        }
                                    }
                                },
                                series: seriesData.series,
                                responsive: {
                                    rules: [{
                                        condition: {
                                            maxWidth: 500
                                        },
                                        chartOptions: {
                                            legend: {
                                                enabled: false
                                            }
                                        }
                                    }]
                                },
                                credits: {
                                    enabled: false
                                }
                            };
                        }

                        if (chartType === 'column-3d') {
                            if (!seriesData.series) {
                                seriesData = {
                                    series: [{
                                        type: 'column',
                                        data: [
                                            ['Toyota', 1795],
                                            ['Volkswagen', 1242],
                                            ['Volvo', 1074],
                                            ['Tesla', 832],
                                            ['Hyundai', 593],
                                            ['MG', 509],
                                            ['Skoda', 471],
                                            ['BMW', 442],
                                            ['Ford', 385],
                                            ['Nissan', 371]
                                        ],
                                        colorByPoint: true
                                    }]
                                };
                            }

                            seriesData2 = {
                                chart: {
                                    type: 'column',
                                    options3d: {
                                        enabled: true,
                                        alpha: 15,
                                        beta: 15,
                                        depth: 50,
                                        viewDistance: 25
                                    },
                                    animation: false
                                },
                                title: {
                                    text: chart_Title || 'Sold passenger cars in Norway by brand, May 2024',
                                    align: chart_Title_align || 'center'
                                },

                                xAxis: {
                                    type: 'category'
                                },
                                yAxis: {
                                    title: {
                                        enabled: false
                                    }
                                },
                                tooltip: {
                                    headerFormat: '<b>{point.key}</b><br>',
                                    pointFormat: 'Cars sold: {point.y}'
                                },
                                legend: {
                                    enabled: false
                                },
                                plotOptions: {
                                    column: {
                                        depth: 25,
                                        colorByPoint: !customColors
                                    },
                                    colors: customColors,
                                },
                                series: seriesData.series,
                                responsive: {
                                    rules: [{
                                        condition: {
                                            maxWidth: 500
                                        },
                                        chartOptions: {
                                            xAxis: {
                                                labels: {
                                                    rotation: -45
                                                }
                                            }
                                        }
                                    }]
                                },
                                credits: {
                                    enabled: false
                                }
                            };
                        }
                        element.setAttribute('data-chart-initialized', 'true');

                        try {
                            if (window.Highcharts) {
                                const existingChart = window.Highcharts.charts.find(chart =>
                                    chart && chart.container && chart.container.id === ctx
                                );
                                if (existingChart) {
                                    existingChart.destroy();
                                }

                                const chart = window.Highcharts.chart(ctx, seriesData2);

                                element.chartInstance = chart;
                                element.setAttribute('data-chart-ready', 'true');
                                element.setAttribute('data-chart-initialized', 'true');

                                setTimeout(() => {
                                    if (chart && chart.reflow) {
                                        chart.reflow();
                                    }
                                }, 100);
                            }
                        } catch (error) {
                            console.error('Error creating Highcharts chart:', error);
                            element.innerHTML = '<div style="padding: 20px; text-align: center; color: #666;">Chart could not be rendered</div>';
                        }
                    };

                    const loadHighcharts = () => {
                        const chartType = "{[ SelectChart ]}" || "pie";
                        const highchartsCoreSrc = "{[ custom_line_chartsrc ]}" || "https://cdn.jsdelivr.net/npm/highcharts@11/highcharts.js";
                        const isDrilldownChart = chartType.includes('drilldown');
                        const hasDrilldownSupport = () => !!(
                            window.Highcharts &&
                            window.Highcharts.Chart &&
                            typeof window.Highcharts.Chart.prototype.addSeriesAsDrilldown === 'function'
                        );
                        const getHighchartsModuleSrc = (moduleFile) => {
                            if (highchartsCoreSrc.indexOf('/highcharts.js') !== -1) {
                                return highchartsCoreSrc.replace('/highcharts.js', '/modules/' + moduleFile);
                            }
                            if (highchartsCoreSrc.indexOf('/highstock.js') !== -1) {
                                return highchartsCoreSrc.replace('/highstock.js', '/modules/' + moduleFile);
                            }
                            return "https://cdn.jsdelivr.net/npm/highcharts@11/modules/" + moduleFile;
                        };
                        const waitForDrilldownSupport = (done) => {
                            let settled = false;
                            let supportTimer = null;
                            let timeoutTimer = null;
                            const finish = () => {
                                if (settled) {
                                    return;
                                }
                                settled = true;
                                if (supportTimer) {
                                    clearInterval(supportTimer);
                                }
                                if (timeoutTimer) {
                                    clearTimeout(timeoutTimer);
                                }
                                done();
                            };

                            if (hasDrilldownSupport()) {
                                finish();
                                return finish;
                            }

                            supportTimer = setInterval(() => {
                                if (hasDrilldownSupport()) {
                                    finish();
                                }
                            }, 100);

                            timeoutTimer = setTimeout(() => {
                                finish();
                            }, 3000);

                            return finish;
                        };

                        const ensureDrilldownModule = () => {
                            if (!isDrilldownChart || hasDrilldownSupport()) {
                                return Promise.resolve();
                            }

                            if (window.__iDesignerHighchartsDrilldownPromise) {
                                return window.__iDesignerHighchartsDrilldownPromise;
                            }

                            window.__iDesignerHighchartsDrilldownPromise = new Promise((drillResolve) => {
                                const finalizeWhenReady = waitForDrilldownSupport(() => {
                                    window.__iDesignerHighchartsDrilldownPromise = null;
                                    drillResolve();
                                });
                                const existingDrilldownScript = document.querySelector('script[src*="modules/drilldown.js"]');

                                if (existingDrilldownScript) {
                                    existingDrilldownScript.addEventListener('load', finalizeWhenReady, { once: true });
                                    existingDrilldownScript.addEventListener('error', finalizeWhenReady, { once: true });
                                    return;
                                }

                                const drilldownScript = document.createElement("script");
                                drilldownScript.src = getHighchartsModuleSrc("drilldown.js");
                                drilldownScript.onload = finalizeWhenReady;
                                drilldownScript.onerror = finalizeWhenReady;
                                document.head.appendChild(drilldownScript);
                            });

                            return window.__iDesignerHighchartsDrilldownPromise;
                        };

                        const ensureHighchartsCore = () => {
                            if (window.Highcharts) {
                                return Promise.resolve();
                            }

                            if (window.__iDesignerHighchartsCorePromise) {
                                return window.__iDesignerHighchartsCorePromise;
                            }

                            window.__iDesignerHighchartsCorePromise = new Promise((resolve, reject) => {
                                const checkHighcharts = setInterval(() => {
                                    if (window.Highcharts) {
                                        clearInterval(checkHighcharts);
                                        resolve();
                                    }
                                }, 100);

                                const existingHighchartsScript = document.querySelector('script[src*="highstock.js"], script[src*="highcharts.js"]');

                                if (!existingHighchartsScript) {
                                    const script = document.createElement("script");
                                    script.src = highchartsCoreSrc;

                                    script.onload = () => {
                                        clearInterval(checkHighcharts);
                                        resolve();
                                    };

                                    script.onerror = () => {
                                        clearInterval(checkHighcharts);
                                        window.__iDesignerHighchartsCorePromise = null;
                                        reject(new Error('Failed to load Highcharts'));
                                    };

                                    document.head.appendChild(script);
                                } else {
                                    existingHighchartsScript.addEventListener('load', () => {
                                        clearInterval(checkHighcharts);
                                        resolve();
                                    }, { once: true });
                                    existingHighchartsScript.addEventListener('error', () => {
                                        clearInterval(checkHighcharts);
                                        window.__iDesignerHighchartsCorePromise = null;
                                        reject(new Error('Failed to load Highcharts'));
                                    }, { once: true });
                                }
                            });

                            return window.__iDesignerHighchartsCorePromise;
                        };

                        return ensureHighchartsCore().then(() => ensureDrilldownModule());
                    };

                    const init = async () => {
                        try {
                            await loadHighcharts();
                            setTimeout(initializeChart, 200);
                        } catch (error) {
                            console.error('Failed to load Highcharts:', error);
                            const element = document.getElementById(this.id);
                            if (element) {
                                element.innerHTML = '<div style="padding: 20px; text-align: center; color: #d32f2f;">Failed to load chart library. Please refresh the page.</div>';
                            }
                        }
                    };

                    init();

                    const element = document.getElementById(this.id);
                    if (element && !element._chartCleanupRegistered) {
                        element._chartCleanupRegistered = true;

                        if (typeof MutationObserver !== 'undefined') {
                            const observer = new MutationObserver((mutations) => {
                                mutations.forEach((mutation) => {
                                    mutation.removedNodes.forEach((node) => {
                                        if (node === element || (node.contains && node.contains(element))) {
                                            if (element.chartInstance) {
                                                element.chartInstance.destroy();
                                                element.chartInstance = null;
                                            }
                                            observer.disconnect();
                                        }
                                    });
                                });
                            });

                            if (element.parentNode) {
                                observer.observe(element.parentNode, { childList: true });
                            }
                        }
                    }
                },

            }),
            init() {
                const rebuildTraitsForCurrentChart = (silent = false) => {
                    const chartType = this.get('SelectChart') || 'pie';
                    this.set('traits', buildChartTraits(chartType), silent ? { silent: true } : undefined);
                };

                const restorePersistedChartState = () => {
                    restoreChartStateFromAttributes(this);
                    rebuildTraitsForCurrentChart(true);
                    persistChartStateToAttributes(this);
                };

                this.restorePersistedChartState = restorePersistedChartState;
                restorePersistedChartState();

                const refreshJsonFileTrait = () => {
                    const trait = this.getTrait('jsonFileIndex');
                    if (!trait) return;

                    const opts = getJsonFileOptions();
                    trait.set('options', opts);

                    if (!opts.length) {
                        this.set({ 'jsonFileIndex': '', 'jsonpath': '' });
                        const jsonPathTrait = this.getTrait('jsonpath');
                        if (jsonPathTrait) {
                            jsonPathTrait.set('options', []);
                            jsonPathTrait.set('value', '');
                            if (jsonPathTrait.view && jsonPathTrait.view.render) jsonPathTrait.view.render();
                        }
                        if (trait.view && trait.view.render) trait.view.render();
                        return;
                    }

                    const current = getChartJsonFileIndex(this);
                    const stillExists = opts.some(o => String(o.value) === current);
                    const nextVal = stillExists ? current : String(opts[0].value);

                    trait.set('value', nextVal);
                    setChartJsonFileIndex(this, nextVal);

                    if (trait.view && trait.view.render) trait.view.render();

                    if (nextVal !== current) {
                        this.trigger('change:jsonFileIndex');
                    }
                };

                this.refreshJsonFileTraitOptions = refreshJsonFileTrait;
                refreshJsonFileTrait();

                const onFilesUpdated = () => refreshJsonFileTrait();
                window.addEventListener('common-json-files-updated', onFilesUpdated);

                this.once('remove', () => {
                    window.removeEventListener('common-json-files-updated', onFilesUpdated);
                });

                this.on('change:SelectChart', () => {
                    rebuildTraitsForCurrentChart();
                    persistChartStateToAttributes(this);

                    setTimeout(() => {
                        const trait = this.getTrait('jsonFileIndex');
                        if (trait) {
                            const opts = getJsonFileOptions();
                            trait.set('options', opts);

                            const currentVal = getChartJsonFileIndex(this);
                            const stillExists = opts.some(o => String(o.value) === currentVal);

                            if (stillExists) {
                                trait.set('value', currentVal);
                            } else if (opts.length > 0) {
                                trait.set('value', String(opts[0].value));
                                setChartJsonFileIndex(this, String(opts[0].value));
                            }

                            if (trait.view && trait.view.render) {
                                trait.view.render();
                            }
                        }

                        const jsonBtnWrapper = document.querySelector('.i_designer-trt-trait__wrp-json-suggestion-btn');
                        if (jsonBtnWrapper) {
                            const jsonBtn = jsonBtnWrapper.querySelector('.i_designer-btn-prim');
                            if (jsonBtn) {
                                jsonBtn.id = 'json-suggestion-btn-custom-line-chart';
                                const newJsonBtn = jsonBtn.cloneNode(true);
                                jsonBtn.parentNode.replaceChild(newJsonBtn, jsonBtn);
                                newJsonBtn.addEventListener('click', function () {
                                    openSuggestionJsonModalChartTable('chart');
                                });
                            }
                        }
                    }, 100);
                });
                this.on('change:jsonFileIndex change:jsonpath', () => {
                    persistChartStateToAttributes(this);
                    this.trigger("change:script");
                });
                const syncLegendDataAttrs = () => {
                    const pos = this.get('legendPosition') || 'bottom';
                    const align = this.get('legendAlign') || 'center';
                    this.addAttributes({ 'data-legend-position': pos, 'data-legend-align': align });
                };
                syncLegendDataAttrs();
                this.on('change:legendPosition change:legendAlign', () => {
                    syncLegendDataAttrs();
                    try {
                        const doc = editor.Canvas && editor.Canvas.getDocument && editor.Canvas.getDocument();
                        if (!doc) return;
                        const el = doc.getElementById(this.id);
                        const align = this.get('legendAlign') || 'center';
                        const verticalAlign = this.get('legendPosition') || 'bottom';
                        const layout = this.get('SelectChartLayout') || 'vertical';
                        if (el && el.chartInstance) {
                            el.chartInstance.update({ legend: { enabled: true, layout, align, verticalAlign } }, true);
                        } else {
                            this.trigger("change:script");
                        }
                    } catch (e) {
                        console.warn('Chart legend update:', e);
                        this.trigger("change:script");
                    }
                });
                const allPossibleTraits = [
                    name_Trait,
                    ...chartTitle_Trait,
                    ...Select_title_Align_Trait,
                    ...Select_chart_Trait,
                    ...json_path_Trait,
                    ...json_button_sugesstionTrait,
                    ...chart_yAxis_Trait,
                    ...Select_chart_layout_Trait,
                    ...swap_axis_Trait,
                    ...legend_colors_Trait,
                    ...legend_position_Trait,
                    ...legend_align_Trait,
                ];

                const events = allPossibleTraits
                    .filter(i => ["strings"].indexOf(i.name) < 0)
                    .map(i => `change:${i.name}`)
                    .join(" ");

                this.on(events, () => {
                    persistChartStateToAttributes(this);
                    this.highchartsInitialized = false;
                    this.trigger("change:script");
                });
            },
        },
    });



    function addCustomLineChartType(editor) {
        editor.Blocks.add("custom_line_chart", {
            label: "Chart",
            category: "Charts",
            attributes: { class: "fa fa-bar-chart" },
            content: { type: "custom_line_chart" },
        });
    }

    addCustomLineChartType(editor);

    // Chart code ended    
    // Json data to all fields code start (option button is at below of setting for each component)
    const styleManager = editor.StyleManager;
    let common_json_file_name_value = localStorage.getItem('common_json_file_name');
    let common_json_file_name_text = '';
    if (common_json_file_name_value !== null && typeof jsonData !== 'undefined' && jsonData.length !== 0) {
        common_json_file_name_text = 'Already Added File : ' + common_json_file_name_value;
    }

    editor.on('load', (block) => {
        var jsonF = document.getElementById("jsonFileUpload");
        jsonF.addEventListener("click", jsonFileUploads, true);
    })

    // Json/XML file upload options function
    function jsonFileUploads() {
        let existingFileNames = localStorage.getItem('common_json_files');
        let displayFileNames = '';

        if (existingFileNames) {
            const namesArray = existingFileNames.split(',').map(n => n.trim());
            displayFileNames = 'Already Added Files <br><ul style="margin:5px 0; padding-left:18px;">';
            namesArray.forEach(name => {
                displayFileNames += `
                <li style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 5px;">
                    <span>${name}</span>
                    <button onclick="deleteJsonFile('${name}')" style="background: #ff4444; color: white; border: none; padding: 2px 6px; border-radius: 3px; cursor: pointer; font-size: 12px;">✕</button>
                </li>
            `;
            });
            displayFileNames += '</ul>';
        }

        editor.Modal.setTitle('Import Json/XML File');
        editor.Modal.setContent(`
        <div class="new-table-form">
            <div style="padding-bottom:10px">${displayFileNames}</div>
            <div> 
                <input type="file" class="form-control popupinput2" 
                       accept="application/json,.xml,.json" multiple
                       style="width:95%"  
                       name="importJsonInputFile" id="importJsonInputFile">
            </div>  
            <input id="import-input-json-file" class="popupaddbtn" type="button" value="Add" data-component-id="c1006">
        </div>
    `);
        editor.Modal.open();
        document.getElementById("import-input-json-file").addEventListener("click", importInputJsonFile, true);
    }

    function importInputJsonFile() {
        const input = document.getElementById('importJsonInputFile');
        const files = input.files;

        if (files.length > 0) {
            const orderedFiles = Array.from(files);
            let processedCount = 0;
            let newFileNames = [];
            const processedJsonByName = {};

            let existingFileNames = localStorage.getItem('common_json_files');
            let allFileNames = existingFileNames ? existingFileNames.split(',').map(f => f.trim()) : [];

            if (typeof window.X2JS === 'undefined') {
                const script = document.createElement('script');
                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/x2js/1.2.0/xml2json.min.js';
                script.onload = function () {
                    processFiles();
                };
                document.head.appendChild(script);
            } else {
                processFiles();
            }

            function normalizeXMLtoJSON(obj, parentKey = '') {
                if (obj === null || obj === undefined) {
                    return obj;
                }

                if (Array.isArray(obj)) {
                    return obj.map(item => normalizeXMLtoJSON(item, parentKey));
                }

                if (typeof obj !== 'object') {
                    return obj;
                }

                const normalized = {};

                for (let key in obj) {
                    if (!obj.hasOwnProperty(key)) continue;

                    const value = obj[key];

                    if (key === '__text' && Object.keys(obj).length === 1) {
                        return value;
                    }

                    if (key === 'item' && Object.keys(obj).length === 1) {
                        return normalizeXMLtoJSON(value, key);
                    }

                    if (value && typeof value === 'object') {
                        if (value.item !== undefined) {
                            if (Array.isArray(value.item)) {
                                normalized[key] = value.item.map(item => normalizeXMLtoJSON(item, key));
                            } else {
                                normalized[key] = [normalizeXMLtoJSON(value.item, key)];
                            }
                        }
                        else if (value.__text !== undefined && Object.keys(value).length === 1) {
                            normalized[key] = value.__text;
                        }
                        else if (value.__text !== undefined) {
                            const textValue = value.__text;
                            if (!isNaN(textValue) && textValue !== '') {
                                normalized[key] = Number(textValue);
                            } else {
                                normalized[key] = textValue;
                            }
                        }
                        else if (Array.isArray(value)) {
                            normalized[key] = value.map(item => normalizeXMLtoJSON(item, key));
                        }
                        else {
                            normalized[key] = normalizeXMLtoJSON(value, key);
                        }
                    } else {
                        if (typeof value === 'string' && !isNaN(value) && value !== '') {
                            normalized[key] = Number(value);
                        } else {
                            normalized[key] = value;
                        }
                    }
                }

                return normalized;
            }

            function processFiles() {
                Array.from(files).forEach((file) => {
                    const reader = new FileReader();
                    const fileExtension = file.name.split('.').pop().toLowerCase();

                    reader.onload = function (e) {
                        try {
                            let code;

                            if (fileExtension === 'xml') {
                                const x2js = new X2JS();
                                const xmlDoc = new DOMParser().parseFromString(e.target.result, 'text/xml');
                                const xmlJson = x2js.xml2json(xmlDoc);

                                code = normalizeXMLtoJSON(xmlJson);

                            } else {
                                code = JSON.parse(e.target.result);
                            }

                            localStorage.setItem(`common_json_${file.name}`, JSON.stringify(code));
                            processedJsonByName[file.name] = code;

                            if (!allFileNames.includes(file.name)) {
                                allFileNames.push(file.name);
                            }
                            newFileNames.push(file.name);
                        } catch (err) {
                            console.error('Error processing file:', file.name, err);
                            alert('Invalid file format in: ' + file.name);
                        }

                        processedCount++;
                        if (processedCount === files.length) {
                            const preferredFile = orderedFiles[orderedFiles.length - 1];
                            const preferredFileName = preferredFile ? preferredFile.name : '';
                            const preferredJson =
                                processedJsonByName[preferredFileName] ??
                                processedJsonByName[newFileNames[newFileNames.length - 1]];

                            if (preferredJson) {
                                localStorage.setItem('common_json', JSON.stringify(preferredJson));
                                localStorage.setItem('common_json_file_name', preferredFileName || newFileNames[newFileNames.length - 1] || '');
                            }

                            localStorage.setItem('common_json_files', allFileNames.join(', '));
                            window.dispatchEvent(new CustomEvent('common-json-files-updated'));

                            common_json_file_name_text = 'Already Added File(s): ' + allFileNames.join(', ');

                            updateFileIndexOptionsImmediate();
                            refreshAllComponentsWithJson(editor);
                            setTimeout(() => {
                                alert('File(s) Imported');
                                editor.Modal.close();

                                // if (typeof updateComponentsWithNewJson === 'function') {
                                //     updateComponentsWithNewJson(editor);
                                // }
                            }, 150);
                        }
                    };

                    reader.readAsText(file);
                });
            }
        } else {
            alert('No file selected');
        }
    }
    function refreshAllComponentsWithJson(editor) {
        if (typeof window.rebindAllDatasourceComponents === 'function') {
            window.rebindAllDatasourceComponents('chart-json-import');
            return;
        }

        console.group('%c[JSON REFRESH] START', 'color:#4caf50;font-weight:bold');

        const allComponents = editor.DomComponents.getComponents();
        console.log('Total root components:', allComponents.length);

        function safeParseJSON(json, source) {
            try {
                return JSON.parse(json);
            } catch (e) {
                console.error(`❌ JSON parse failed (${source})`, e);
                return null;
            }
        }

        function updateComponentRecursively(component, depth = 0) {
            const indent = '—'.repeat(depth);
            const compId = component.getId();
            const compType = component.get('type');

            console.group(
                `%c${indent}▶ Component`,
                'color:#03a9f4;font-weight:bold',
                { id: compId, type: compType }
            );

            const jsonPath = component.get('my-input-json');
            const fileIndex = component.get('json-file-index') || '0';

            console.log('jsonPath:', jsonPath);
            console.log('fileIndex:', fileIndex);

            if (!jsonPath || !jsonPath.trim()) {
                console.log('⏭ No jsonPath → skipping component');
                console.groupEnd();
                return;
            }

            if (!['text', 'formatted-rich-text', 'custom-heading'].includes(compType)) {
                console.log('⏭ Unsupported component type');
                console.groupEnd();
                return;
            }

            let commonJson = null;

            /* =========================
               JSON SOURCE RESOLUTION
            ==========================*/
            if (fileIndex !== '0') {
                console.log('Using multi-file JSON source');

                const rawFiles = localStorage.getItem('common_json_files');
                if (!rawFiles) {
                    console.warn('⚠️ common_json_files missing');
                } else {
                    const fileNames = rawFiles.split(',').map(f => f.trim());
                    const selectedFile = fileNames[parseInt(fileIndex) - 1];

                    console.log('Resolved file name:', selectedFile);

                    if (!selectedFile) {
                        console.warn('⚠️ Invalid file index');
                    } else {
                        const jsonString = localStorage.getItem(`common_json_${selectedFile}`);
                        if (!jsonString) {
                            console.warn(`⚠️ JSON not found for file: ${selectedFile}`);
                        } else {
                            commonJson = safeParseJSON(jsonString, selectedFile);
                        }
                    }
                }
            } else {
                console.log('Using default common_json');
                const jsonString = localStorage.getItem('common_json');
                if (!jsonString) {
                    console.warn('⚠️ common_json missing');
                } else {
                    commonJson = safeParseJSON(jsonString, 'common_json');
                }
            }

            if (!commonJson) {
                console.warn('⛔ commonJson unavailable → aborting component update');
                console.groupEnd();
                return;
            }

            /* =========================
               CONTENT RESOLUTION
            ==========================*/
            const jsonPaths = jsonPath.split(',').map(p => p.trim());
            const rawContent =
                component.get('raw-content') ||
                component.get('content') ||
                '';

            console.log('Raw content:', rawContent);
            console.log('Resolved JSON paths:', jsonPaths);

            try {
                if (rawContent.includes('{') && rawContent.includes('}')) {
                    console.log('🧩 Template mode detected');

                    let updatedContent = rawContent;

                    jsonPaths.forEach(path => {
                        console.group(`Path → ${path}`);

                        const parts = path.split('.');
                        const lang = parts[0];
                        const remainingPath = parts.slice(1).join('.');

                        console.log('Language:', lang);
                        console.log('JSON Path:', remainingPath);

                        try {
                            const fullPath = `commonJson.${lang}.${remainingPath}`;
                            console.log('Eval path:', fullPath);

                            const value = eval(fullPath);

                            if (value !== undefined && value !== null) {
                                const placeholder = `{${remainingPath}}`;
                                const escaped = placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

                                updatedContent = updatedContent.replace(
                                    new RegExp(escaped, 'g'),
                                    value
                                );

                                console.log('✔ Replaced', placeholder, '→', value);
                            } else {
                                console.warn('⚠️ Value undefined/null');
                            }
                        } catch (err) {
                            console.error('❌ Eval error', err);
                        }

                        console.groupEnd();
                    });

                    if (compType === 'formatted-rich-text') {
                        component.set('raw-content', updatedContent, { silent: true });
                        component.updateContent?.();
                        console.log('✔ formatted-rich-text updated');
                    } else {
                        component.view.el.innerHTML = updatedContent;
                        console.log('✔ DOM innerHTML updated');
                    }

                } else {
                    console.log('📌 Direct binding mode');

                    const firstPath = jsonPaths[0];
                    const parts = firstPath.split('.');
                    const lang = parts[0];
                    const remainingPath = parts.slice(1).join('.');

                    const evalPath = `commonJson.${lang}.${remainingPath}`;
                    console.log('Eval path:', evalPath);

                    const value = eval(evalPath);

                    if (value !== undefined && value !== null) {
                        if (compType === 'formatted-rich-text') {
                            component.set('raw-content', String(value), { silent: true });
                            component.updateContent?.();
                            console.log('✔ formatted-rich-text set');
                        } else {
                            component.view.el.innerHTML = value;
                            console.log('✔ DOM value set');
                        }
                    } else {
                        console.warn('⚠️ Value undefined/null');
                    }
                }
            } catch (e) {
                console.error('🔥 Component processing failed', e);
            }

            /* =========================
               CHILD COMPONENTS
            ==========================*/
            const children = component.components();
            if (children && children.length > 0) {
                console.log(`🔽 Recursing into ${children.length} children`);
                children.each(child => updateComponentRecursively(child, depth + 1));
            } else {
                console.log('⏹ No children');
            }

            console.groupEnd();
        }

        allComponents.each(component => updateComponentRecursively(component));

        console.groupEnd();
    }

    function updateFileIndexOptionsImmediate() {
        const newOptions = getJsonFileOptions();
        const jsonSector = styleManager.getSector('JSON');
        const selectedComponent = editor.getSelected && editor.getSelected();

        if (jsonSector) {
            const fileIndexProperty = jsonSector.getProperty('json-file-index');
            if (fileIndexProperty) {
                fileIndexProperty.set('options', newOptions);

                const selectElement = document.querySelector('.i_designer-sm-property__json-file-index select');
                if (selectElement) {
                    const currentValue = selectElement.value;
                    selectElement.innerHTML = '';
                    newOptions.forEach(option => {
                        const optionElement = document.createElement('option');
                        optionElement.value = option.value;
                        optionElement.textContent = option.name;
                        selectElement.appendChild(optionElement);
                    });

                    if (Array.from(selectElement.options).some(opt => opt.value === currentValue)) {
                        selectElement.value = currentValue;
                    }
                }
            }
        }

        if (selectedComponent?.get?.('type') === 'custom_line_chart') {
            selectedComponent.refreshJsonFileTraitOptions?.();
            if (editor.TraitManager) {
                setTimeout(() => editor.TraitManager.render(), 0);
            }
        }
    }

    function getJsonFileOptions() {
        let storedFileNames = localStorage.getItem('common_json_files');
        const options = [{ value: '0', name: 'Select File' }];

        if (!storedFileNames) {
            const derived = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (!key || key === 'common_json' || key === 'common_json_files') continue;
                if (key.startsWith('common_json_')) {
                    derived.push(key.replace('common_json_', ''));
                }
            }
            if (derived.length) {
                storedFileNames = derived.join(', ');
            }
        }

        if (storedFileNames) {
            const fileNames = storedFileNames.split(',').map(f => f.trim());
            fileNames.forEach((fileName, index) => {
                options.push({ value: (index + 1).toString(), name: fileName });
            });
        }
        return options;
    }

    function updateFileIndexOptions() {
        const newOptions = getJsonFileOptions();
        const jsonSector = styleManager.getSector('JSON');
        const selectedComponent = editor.getSelected && editor.getSelected();

        if (jsonSector) {
            const fileIndexProperty = jsonSector.getProperty('json-file-index');
            if (fileIndexProperty) {
                fileIndexProperty.set('options', newOptions);
                const selectElement = document.querySelector('.i_designer-sm-property__json-file-index select');
                if (selectElement) {
                    selectElement.innerHTML = '';

                    newOptions.forEach(option => {
                        const optionElement = document.createElement('option');
                        optionElement.value = option.value;
                        optionElement.textContent = option.name;
                        selectElement.appendChild(optionElement);
                    });
                }

                setTimeout(() => {
                    editor.StyleManager.render();
                    ensureJsonSuggestionButton();
                }, 100);
            }
        }

        if (selectedComponent?.get?.('type') === 'custom_line_chart') {
            selectedComponent.refreshJsonFileTraitOptions?.();
            if (editor.TraitManager) {
                setTimeout(() => editor.TraitManager.render(), 0);
            }
        }
    }

    function ensureJsonSuggestionButton() {
        setTimeout(() => {
            const jsonSector = document.querySelector('.i_designer-sm-sector__JSON');
            if (jsonSector) {
                const existingButton = document.getElementById('json-suggestion-btn');
                if (!existingButton) {
                    const jsonPathInput = jsonSector.querySelector('.i_designer-fields');
                    if (jsonPathInput) {
                        const button = document.createElement('button');
                        button.innerHTML = 'DataSource Suggestion';
                        button.id = 'json-suggestion-btn';
                        button.style.marginLeft = '0px';
                        jsonPathInput.parentNode.appendChild(button);
                        button.addEventListener('click', function () {
                            openSuggestionJsonModal();
                        });
                    }
                }
            }
        }, 200);
    }

    function deleteJsonFile(fileName) {
        if (confirm(`Are you sure you want to delete "${fileName}"?`)) {
            localStorage.removeItem(`common_json_${fileName}`);
            const deletedWasDefault = localStorage.getItem('common_json_file_name') === fileName;

            let existingFileNames = localStorage.getItem('common_json_files');
            if (existingFileNames) {
                let fileArray = existingFileNames.split(',').map(f => f.trim());
                fileArray = fileArray.filter(name => name !== fileName);

                if (fileArray.length > 0) {
                    if (deletedWasDefault) {
                        const nextDefaultFile = fileArray[fileArray.length - 1];
                        const nextDefaultJson = localStorage.getItem(`common_json_${nextDefaultFile}`);
                        if (nextDefaultJson) {
                            localStorage.setItem('common_json', nextDefaultJson);
                            localStorage.setItem('common_json_file_name', nextDefaultFile);
                        }
                    }

                    localStorage.setItem('common_json_files', fileArray.join(', '));
                    window.dispatchEvent(new CustomEvent('common-json-files-updated', {
                        detail: { action: 'delete', key: fileName }
                    }));

                    common_json_file_name_text = 'Already Added File(s): ' + fileArray.join(', ');
                } else {
                    localStorage.removeItem('common_json');
                    localStorage.removeItem('common_json_file_name');
                    localStorage.removeItem('common_json_files');
                    common_json_file_name_text = '';
                }
            }

            updateFileIndexOptions();

            editor.Modal.close();
            setTimeout(() => {
                jsonFileUploads();
            }, 100);

            alert(`"${fileName}" has been deleted successfully!`);
        }
    }

    window.deleteJsonFile = deleteJsonFile;

    styleManager.addSector('JSON', {
        name: 'JSON',
        open: false,
        properties: [
            {
                name: 'File Index',
                property: 'json-file-index',
                type: 'select',
                options: getJsonFileOptions(),
                onChange: handleFileIndexChange,
            },
            {
                name: 'DataSource Path',
                property: 'my-input-json',
                type: 'text',
                onChange: handleJsonPathChange,
            },
        ]
    });

    function tokenizeBoundJsonPath(path) {
        if (path == null) return [];

        return String(path)
            .trim()
            .replace(/\[\s*(\d+)\s*\]/g, '.$1')
            .replace(/\[\s*['"]([^'"\]]+)['"]\s*\]/g, '.$1')
            .replace(/^\./, '')
            .split('.')
            .map(token => token.trim())
            .filter(Boolean);
    }

    function resolveBoundJsonValue(commonJson, fullPath) {
        const tokens = tokenizeBoundJsonPath(fullPath);
        if (!commonJson || !tokens.length) return undefined;

        let currentValue = commonJson;
        tokens.forEach(token => {
            if (currentValue !== null && currentValue !== undefined) {
                currentValue = currentValue[token];
            } else {
                currentValue = undefined;
            }
        });

        return currentValue;
    }

    function getBoundPlaceholderCandidates(commonJson, fullPath) {
        const tokens = tokenizeBoundJsonPath(fullPath);
        if (!tokens.length) return [];

        let nestedTokens = tokens;
        if (tokens.length > 1 && commonJson && commonJson[tokens[0]] != null) {
            nestedTokens = tokens.slice(1);
        }

        const lastNamedToken = [...nestedTokens]
            .reverse()
            .find(token => !/^\d+$/.test(String(token)));

        const candidates = [];

        if (lastNamedToken) {
            candidates.push(String(lastNamedToken));
        }

        const normalizedNestedPath = nestedTokens.map(token => String(token)).join('.');
        if (normalizedNestedPath) {
            candidates.push(normalizedNestedPath);
        }

        const originalTokens = String(fullPath || '')
            .trim()
            .split('.')
            .map(token => token.trim())
            .filter(Boolean);

        const originalNestedPath =
            originalTokens.length > 1 && commonJson && commonJson[originalTokens[0]] != null
                ? originalTokens.slice(1).join('.')
                : originalTokens.join('.');

        if (originalNestedPath) {
            candidates.push(originalNestedPath);
        }

        return [...new Set(candidates.filter(Boolean))];
    }

    function handleFileIndexChange(event) {
        const selectedComponent = editor.getSelected();
        if (selectedComponent) {
            const fileIndexSelect = document.querySelector('.i_designer-sm-property__json-file-index select');
            const nextFileIndex = fileIndexSelect ? (fileIndexSelect.value || '0') : '0';
            const componentType = selectedComponent.get?.('type');

            if (componentType === 'custom_line_chart') {
                setChartJsonFileIndex(selectedComponent, nextFileIndex, { silent: true });
                if (typeof selectedComponent.refreshJsonFileTraitOptions === 'function') {
                    selectedComponent.refreshJsonFileTraitOptions();
                }
                selectedComponent.highchartsInitialized = false;
                selectedComponent.trigger?.('change:script');
            } else if (fileIndexSelect) {
                selectedComponent.set('json-file-index', nextFileIndex, { silent: true });
            }

            selectedComponent.set('my-input-json', '', { silent: true });
            if (selectedComponent.addAttributes) {
                selectedComponent.addAttributes({ 'data-json-file-index': nextFileIndex });
            }
            if (selectedComponent.removeAttributes) {
                selectedComponent.removeAttributes('my-input-json');
            }
            setTimeout(() => {
                editor.TraitManager.render();
            }, 50);
        }
    }

    function handleJsonPathChange(event) {
        if (event.value) {
            const selectedComponent = editor.getSelected();
            const componentType = selectedComponent?.get('type');

            if (componentType === 'text' || componentType === 'formatted-rich-text' || componentType === 'custom-heading') {
                const storedTemplateText =
                    typeof getComponentTemplateText === 'function'
                        ? getComponentTemplateText(selectedComponent)
                        : (selectedComponent?.get?.('templateText') || '');
                const content =
                    storedTemplateText ||
                    selectedComponent?.get('raw-content') ||
                    selectedComponent?.get('content');
                if (content !== undefined) {
                    try {
                        let fileIndex = '0';
                        const fileIndexSelect = document.querySelector('.i_designer-sm-property__json-file-index select');
                        if (fileIndexSelect) {
                            fileIndex = fileIndexSelect.value || '0';
                        }
                        if (componentType === 'custom_line_chart') {
                            setChartJsonFileIndex(selectedComponent, fileIndex, { silent: true });
                        } else {
                            selectedComponent.set('json-file-index', fileIndex, { silent: true });
                        }
                        selectedComponent.set('my-input-json', event.value, { silent: true });
                        if (selectedComponent.addAttributes) {
                            selectedComponent.addAttributes({
                                'my-input-json': event.value,
                                'data-json-file-index': fileIndex
                            });
                        }
                        let commonJson;

                        if (fileIndex !== '0') {
                            const fileNames = (localStorage.getItem('common_json_files') || "").split(',').map(f => f.trim());
                            const selectedFile = fileNames[parseInt(fileIndex) - 1];
                            const jsonString = localStorage.getItem(`common_json_${selectedFile}`);
                            if (jsonString) {
                                commonJson = JSON.parse(jsonString);
                            }
                        } else {
                            commonJson = JSON.parse(localStorage.getItem("common_json"));
                        }

                        if (commonJson) {
                            const jsonPaths = event.value.split(',').map(path => path.trim()).filter(Boolean);

                            if (content.includes('{') && content.includes('}')) {
                                const templateSource = storedTemplateText || String(content);
                                if (typeof setComponentTemplateText === 'function') {
                                    setComponentTemplateText(selectedComponent, templateSource);
                                } else {
                                    selectedComponent.set?.('templateText', templateSource, { silent: true });
                                }

                                let updatedContent = templateSource;
                                jsonPaths.forEach(jsonPath => {
                                    try {
                                        const value = resolveBoundJsonValue(commonJson, jsonPath);

                                        if (value !== undefined && value !== null) {
                                            const placeholderCandidates = getBoundPlaceholderCandidates(commonJson, jsonPath);
                                            placeholderCandidates.forEach((placeholderToken) => {
                                                const placeholder = `{${placeholderToken}}`;
                                                updatedContent = updatedContent.replace(
                                                    new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
                                                    String(value)
                                                );
                                            });
                                        }
                                    } catch (e) {
                                        console.warn(`Error evaluating path ${jsonPath}:`, e);
                                    }
                                });

                                if (componentType === 'formatted-rich-text') {
                                    selectedComponent.set('raw-content', updatedContent, { silent: true });
                                    selectedComponent.set('my-input-json', event.value, { silent: true });
                                    selectedComponent.updateContent();
                                } else {
                                    selectedComponent.set('content', updatedContent, { silent: true });
                                    const componentView = selectedComponent.view;
                                    if (componentView) {
                                        componentView.el.innerHTML = updatedContent;
                                    }
                                }
                            } else {
                                const jsonPath = jsonPaths[0];
                                const value = resolveBoundJsonValue(commonJson, jsonPath);

                                if (value !== undefined && value !== null) {
                                    if (componentType === 'formatted-rich-text') {
                                        selectedComponent.set('raw-content', String(value), { silent: true });
                                        selectedComponent.set('my-input-json', event.value, { silent: true });
                                        selectedComponent.updateContent();
                                    } else {
                                        selectedComponent.set('content', String(value), { silent: true });
                                        const componentView = selectedComponent.view;
                                        if (componentView) {
                                            componentView.el.innerHTML = value;
                                        }
                                    }
                                }
                            }

                            setTimeout(() => {
                                editor.TraitManager.render();
                            }, 100);
                        }
                    } catch (e) {
                        console.error("Error evaluating DataSource path:", e);
                    }
                }
            }
        }
    }

    editor.on('load', function () {
        const jsonSector = document.querySelector('.i_designer-sm-sector__JSON');
        if (jsonSector) {
            const jsonPathInput = jsonSector.querySelector('.i_designer-fields');
            if (jsonPathInput) {
                const button = document.createElement('button');
                button.innerHTML = 'DataSource Suggestion';
                button.id = 'json-suggestion-btn';
                button.style.marginLeft = '0px';
                jsonPathInput.parentNode.appendChild(button);
                button.addEventListener('click', function () {
                    openSuggestionJsonModal();
                });
            }
        }
    });

    function extractMetaDataKeys(obj, prefix = '') {
        let keys = [];
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                let newKey;
                if (Array.isArray(obj)) {
                    newKey = `${prefix}[${key}]`;
                } else {
                    newKey = prefix ? `${prefix}.${key}` : key;
                }
                keys.push(newKey);
                if (typeof obj[key] === 'object' && obj[key] !== null) {
                    keys = keys.concat(extractMetaDataKeys(obj[key], newKey));
                }
            }
        }
        return keys;
    }

    function openSuggestionJsonModal() {
        const selectedComponent = editor.getSelected();
        let fileIndex = '0';
        const fileIndexSelect = document.querySelector('.i_designer-sm-property__json-file-index select');
        if (fileIndexSelect) {
            fileIndex = fileIndexSelect.value || '0';
        }

        if (fileIndex === '0' && selectedComponent) {
            fileIndex = selectedComponent.get('json-file-index') || '0';
        }

        if (fileIndex === '0') {
            alert('Please select a JSON file first');
            return;
        }

        const fileNames = (localStorage.getItem('common_json_files') || "")
            .split(',').map(f => f.trim());
        const selectedFile = fileNames[parseInt(fileIndex) - 1];
        const jsonString = localStorage.getItem(`common_json_${selectedFile}`);

        if (!jsonString) {
            alert('Selected DataSource file not found');
            return;
        }

        const commonJson = JSON.parse(jsonString);

        const topLevelKeys = Object.keys(commonJson);

        let modalContent = `
        <div class="new-table-form">
        <div style="padding-bottom:10px">
            <input type="text" id="searchInput" placeholder="Search json">
        </div>
        <div class="suggestion-results" style="height: 200px; overflow: hidden; overflow-y: scroll;">
        `;

        topLevelKeys.forEach(key => {
            modalContent += `<div class="suggestion language-option" data-value="${key}" data-type="language">${key}</div>`;
        });

        modalContent += `
      </div>
    </div>
  `;

        editor.Modal.setTitle('DataSource Suggestion');
        editor.Modal.setContent(modalContent);
        editor.Modal.open();

        document.getElementById("searchInput").addEventListener("input", function () {
            filterSuggestions(this.value);
        });

        const suggestionItems = document.querySelectorAll('.suggestion');
        suggestionItems.forEach(item => {
            item.addEventListener('click', function () {
                const selectedValue = this.getAttribute('data-value');
                const dataType = this.getAttribute('data-type');

                if (dataType === 'language') {
                    showLanguageKeys(selectedValue, commonJson);
                } else {
                    const inputField = document.querySelector('.i_designer-sm-property__my-input-json input');
                    if (inputField) {
                        inputField.value = selectedValue;
                        var event = new Event('change', {
                            bubbles: true,
                            cancelable: true
                        });
                        inputField.dispatchEvent(event);
                    }
                    editor.Modal.close();
                }
            });
        });
    }

    function showLanguageKeys(language, commonJson) {
        const metaDataKeys = extractMetaDataKeys(commonJson[language]);

        let modalContent = `
            <div class="new-table-form">
            <div style="padding-bottom:10px">
                <button id="backBtn" style="margin-right: 10px;">← Back</button>
                <input type="text" id="searchInput" placeholder="Search json">
            </div>
            <div style="padding-bottom:10px">
                <label>
                <input type="checkbox" id="multipleKeysCheckbox" style="margin-right: 5px;">
                Select multiple keys
                </label>
            </div>
            <div class="suggestion-results" style="height: 200px; overflow: hidden; overflow-y: scroll;">
        `;

        metaDataKeys.forEach(key => {
            const fullPath = `${language}.${key}`;
            modalContent += `<div class="suggestion" data-value="${fullPath}" data-type="key">${key}</div>`;
        });

        modalContent += `
      </div>
    </div>
  `;

        editor.Modal.setContent(modalContent);

        document.getElementById("backBtn").addEventListener("click", function () {
            openSuggestionJsonModal();
        });

        document.getElementById("searchInput").addEventListener("input", function () {
            filterSuggestions(this.value);
        });

        const suggestionItems = document.querySelectorAll('.suggestion');
        let selectedKeys = new Set();

        suggestionItems.forEach(item => {
            item.addEventListener('click', function () {
                const selectedValue = this.getAttribute('data-value');
                const multipleMode = document.getElementById('multipleKeysCheckbox').checked;

                if (multipleMode) {
                    if (selectedKeys.has(selectedValue)) {
                        selectedKeys.delete(selectedValue);
                        this.style.backgroundColor = '';
                        this.style.color = '';
                    } else {
                        selectedKeys.add(selectedValue);
                        this.style.backgroundColor = '#007bff';
                        this.style.color = 'white';
                    }
                } else {
                    const inputField = document.querySelector('.i_designer-sm-property__my-input-json input');
                    if (inputField) {
                        inputField.value = selectedValue;
                        var event = new Event('change', {
                            bubbles: true,
                            cancelable: true
                        });
                        inputField.dispatchEvent(event);
                    }
                    editor.Modal.close();
                }
            });
        });

        document.getElementById('multipleKeysCheckbox').addEventListener('change', function () {
            const applyBtn = document.getElementById('applyMultipleKeys');
            if (this.checked && !applyBtn) {
                const btnContainer = document.createElement('div');
                btnContainer.style.paddingTop = '10px';
                btnContainer.innerHTML = '<button id="applyMultipleKeys" style="background: #007bff; color: white; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer;">Apply Selected Keys</button>';
                document.querySelector('.new-table-form').appendChild(btnContainer);

                document.getElementById('applyMultipleKeys').addEventListener('click', function () {
                    const inputField = document.querySelector('.i_designer-sm-property__my-input-json input');
                    if (inputField && selectedKeys.size > 0) {
                        inputField.value = Array.from(selectedKeys).join(', ');
                        var event = new Event('change', {
                            bubbles: true,
                            cancelable: true
                        });
                        inputField.dispatchEvent(event);
                    }
                    editor.Modal.close();
                });
            } else if (!this.checked && applyBtn) {
                applyBtn.parentElement.remove();
                selectedKeys.clear();
                suggestionItems.forEach(item => {
                    item.style.backgroundColor = '';
                    item.style.color = '';
                });
            }
        });
    }

    function filterSuggestions(query) {
        const suggestionResults = document.querySelector('.suggestion-results');
        const metaDataKeys = Array.from(suggestionResults.children);
        metaDataKeys.forEach(key => {
            if (key.textContent.toLowerCase().includes(query.toLowerCase())) {
                key.style.display = "block";
            } else {
                key.style.display = "none";
            }
        });
    }

    editor.on('component:selected', (component) => {
        if (component?.get?.('type') === 'custom_line_chart') {
            component.restorePersistedChartState?.();
            component.refreshJsonFileTraitOptions?.();
            component.highchartsInitialized = false;

            setTimeout(() => {
                if (editor.TraitManager && editor.getSelected?.() === component) {
                    editor.TraitManager.render();
                }
            }, 0);

            setTimeout(() => {
                const jsonBtnWrapper = document.querySelector('.i_designer-trt-trait__wrp-json-suggestion-btn');
                if (jsonBtnWrapper) {
                    const jsonBtn = jsonBtnWrapper.querySelector('.i_designer-btn-prim');
                    if (jsonBtn) {
                        jsonBtn.id = 'json-suggestion-btn-custom-line-chart';
                        jsonBtn.addEventListener('click', function () {
                            openSuggestionJsonModalChartTable('chart');
                        });
                    } else {
                        console.error('DataSource Suggestion button not found');
                    }
                } else {
                    console.error('DataSource Suggestion button within the selected component');
                }
            }, 1000);
        }
    });

    // chart json data addition function
    function openSuggestionJsonModalChartTable(type) {
        const selectedComponent = editor.getSelected();

        let fileIndex = getChartJsonFileIndex(selectedComponent);

        if (fileIndex === '0') {
            alert('Please select a DataSource file first from the chart traits');
            return;
        }

        const fileNames = (localStorage.getItem('common_json_files') || "")
            .split(',').map(f => f.trim());
        const selectedFile = fileNames[parseInt(fileIndex) - 1];
        const jsonString = localStorage.getItem(`common_json_${selectedFile}`);

        if (!jsonString) {
            alert('Selected Source file not found');
            return;
        }

        const commonJson = JSON.parse(jsonString);
        const topLevelKeys = Object.keys(commonJson);

        let modalContent = `
            <div class="new-table-form">
            <div style="padding-bottom:10px">
                <input type="text" id="searchInput" placeholder="Search json">
            </div>
            <div class="suggestion-results" style="height: 200px; overflow: hidden; overflow-y: scroll;">
        `;

        topLevelKeys.forEach(key => {
            modalContent += `<div class="suggestion language-option" data-value="${key}" data-type="language">${key}</div>`;
        });

        modalContent += `
            </div>
            </div>
        `;

        editor.Modal.setTitle('DataSource Suggestion - Select Language');
        editor.Modal.setContent(modalContent);
        editor.Modal.open();
        document.getElementById("searchInput").addEventListener("input", function () {
            filterSuggestions(this.value);
        });

        const suggestionItems = document.querySelectorAll('.suggestion');
        suggestionItems.forEach(item => {
            item.addEventListener('click', function () {
                const selectedValue = this.getAttribute('data-value');
                const dataType = this.getAttribute('data-type');

                if (dataType === 'language') {
                    showLanguageKeysForChart(selectedValue, commonJson, type);
                }
            });
        });
    }

    function showLanguageKeysForChart(language, commonJson, type) {
        const metaDataKeys = extractMetaDataKeys(commonJson[language]);

        let modalContent = `
            <div class="new-table-form">
            <div style="padding-bottom:10px">
                <button id="backBtn" style="margin-right: 10px;">← Back</button>
                <input type="text" id="searchInput" placeholder="Search json">
            </div>
            <div class="suggestion-results" style="height: 200px; overflow: hidden; overflow-y: scroll;">
        `;

        metaDataKeys.forEach(key => {
            const fullPath = `${language}.${key}`;
            modalContent += `<div class="suggestion" data-value="${fullPath}" data-type="key">${key}</div>`;
        });

        modalContent += `
            </div>
            </div>
        `;

        editor.Modal.setContent(modalContent);
        document.getElementById("backBtn").addEventListener("click", function () {
            openSuggestionJsonModalChartTable(type);
        });

        document.getElementById("searchInput").addEventListener("input", function () {
            filterSuggestions(this.value);
        });

        const suggestionItems = document.querySelectorAll('.suggestion');
        suggestionItems.forEach(item => {
            item.addEventListener('click', function () {
                const selectedValue = this.getAttribute('data-value');

                if (type === 'chart') {
                    const selectedComponent = editor.getSelected();
                    if (selectedComponent) {
                        selectedComponent.set('jsonpath', selectedValue);

                        selectedComponent.highchartsInitialized = false;
                        selectedComponent.trigger('change:script');

                        setTimeout(() => {
                            const inputField = document.querySelector('.i_designer-trt-trait__wrp-jsonpath input');
                            if (inputField) {
                                inputField.value = selectedValue;
                            }
                        }, 100);
                    }
                }

                editor.Modal.close();
            });
        });
    }

    setTimeout(() => {
        var language = document.getElementById("multiLanguage");
        language.addEventListener("click", languageChange, true);
    }, 2000);
    let custom_language = localStorage.getItem('language');
    if (custom_language === null) {
        custom_language = 'english';
    }
    let language_value = localStorage.getItem('language');
    let language_text = '';
    if (language_value !== null && language_value !== undefined) {
        language_text = 'Already Added Language: ' + language_value;
    }

    function languageChange() {
        editor.Modal.setTitle('Language');
        editor.Modal.setContent(`<div class="new-table-form">
            <div style="padding-bottom:10px">
            ${language_text}
            </div>
            <div> 
            <select class="form-control class="popupaddbtn"" style="width:95%"  name="singleLanguageName" id="singleLanguageName">
            <option value="english">English</option>
            <option value="hindi">Hindi</option>
            <option value="tamil">Tamil</option>
            </select> 
            </div>  
            <input id="saveLanguageChange" type="button" value="Add" class="popupaddbtn" data-component-id="c1006">
            </div>
            </div>
            `);
        editor.Modal.open();
        var el = document.getElementById("saveLanguageChange");
        el.addEventListener("click", ChangeLanguage, true);
    }

    function ChangeLanguage() {
        languageNames = document.getElementById('singleLanguageName').value;
        if (languageNames === null || languageNames === undefined || languageNames === '') {
            alert('Language required');
            return false;
        }
        localStorage.setItem('language', languageNames);
        custom_language = languageNames;
        var css = editor.getCss();
        var regex = /#(\w+)\s*{[^}]*my-input-json:(.*?);[^}]*}/g;
        var pairs = [];
        var match;
        while ((match = regex.exec(css)) !== null) {
            var id = match[1];
            var value = match[2];
            pairs.push({ id: id, value: value });
        }
        setTimeout(function () {
            var html = editor.getHtml();
            var parser = new DOMParser();
            var doc = parser.parseFromString(html, 'text/html');
            for (var i = 0; i < pairs.length; i++) {
                let str = 'jsonData[0].' + custom_language + '.' + pairs[i].value;
                value = eval(str);
                var ccid = pairs[i].id;
                var myDiv = doc.getElementById(ccid);
                myDiv.textContent = value;
            }
            var updatedHtml = doc.documentElement.outerHTML;
            var styleEl = doc.createElement('style');
            styleEl.innerHTML = css;
            doc.head.appendChild(styleEl);
            editor.setComponents(updatedHtml);
            editor.setStyle(css);
        }, 500);
        editor.Modal.close();
    }
    const jsonData1 = JSON.parse(localStorage.getItem("common_json"));
    if (jsonData1 !== null) {
        jsonData.length = 0;
        jsonData = [];
        jsonData.push(jsonData1);
    }
    // function updateComponentsWithNewJson(editor) {
    //     var styleTags2 = editor.getCss();
    //     var jsonDataNew = {};
    //     var styleContent = styleTags2;
    //     var regex = /#(\w+)\s*{\s*[^{}]*my-input-json:\s*([^;]+)\s*;[^{}]*}/g;
    //     var matches;
    //     while ((matches = regex.exec(styleContent)) !== null) {
    //         var divId = matches[1];
    //         var jsonKey = matches[2];
    //         var lang = jsonKey;
    //         jsonDataNew[divId] = lang;
    //     }
    //     let updateDivContenthtml = editor.getHtml();
    //     if (custom_language === null) {
    //         custom_language = 'english';
    //     }
    //     for (var divId in jsonDataNew) {
    //         var jsonKey2 = jsonDataNew[divId];
    //         const str = 'jsonData1[0].' + custom_language + '.' + jsonKey2;
    //         var value = eval(str);
    //         if (divId && value) {
    //             var parser = new DOMParser();
    //             var doc = parser.parseFromString(updateDivContenthtml, 'text/html');
    //             var myDiv = doc.getElementById(divId);
    //             if (myDiv) {
    //                 myDiv.textContent = value;
    //                 var component = editor.getWrapper().find(`#${divId}`)[0];
    //                 if (component) {
    //                     component.components(value);
    //                 }
    //             }
    //         }
    //     }

    //     editor.getWrapper().find('[data-i_designer-type="custom_line_chart"]').forEach(chart => {
    //         chart.highchartsInitialized = false;
    //         chart.trigger('change:script');
    //     });

    // }

    // Image Json Data Addition code    
    function openJsonImageSelector() {
        const fileNames = localStorage.getItem('common_json_files');

        if (!fileNames) {
            alert('No JSON files uploaded. Please upload a JSON file first.');
            return;
        }

        const fileArray = fileNames.split(',').map(f => f.trim());

        let modalContent = `
            <div class="new-table-form" style="width: 500px; min-height: 350px;">
            <div style="padding-bottom:10px">
                <label style="font-weight: bold;">Step 1: Select JSON File</label>
            </div>
            <div style="padding-bottom:10px">
                <select id="jsonFileSelector" class="form-control" style="width:100%">
                <option value="0">-- Select File --</option>
        `;

        fileArray.forEach((fileName, index) => {
            modalContent += `<option value="${index + 1}">${fileName}</option>`;
        });

        modalContent += `
                </select>
            </div>
            <div id="languageSection" style="display:none; padding-bottom:10px;">
                <label style="font-weight: bold;">Step 2: Select Language</label>
                <div id="languageList" class="suggestion-results" style="height: 150px; overflow-y: auto; border: 1px solid #ddd; margin-top: 10px;"></div>
            </div>
            <div id="keySection" style="display:none; padding-bottom:10px;">
                <label style="font-weight: bold;">Step 3: Select Image Key</label>
                <div style="padding: 5px 0;">
                <button id="backToLanguageBtn" style="padding: 5px 10px; font-size: 12px;">← Back to Languages</button>
                </div>
                <input type="text" id="searchInput" placeholder="Search image keys" style="width:100%; margin-bottom: 10px;">
                <div id="keyList" class="suggestion-results" style="height: 150px; overflow-y: auto; border: 1px solid #ddd;"></div>
            </div>
            </div>
        `;

        editor.Modal.setTitle('Select Image from JSON');
        editor.Modal.setContent(modalContent);
        editor.Modal.open();

        document.getElementById('jsonFileSelector').addEventListener('change', function () {
            const fileIndex = this.value;

            if (fileIndex === '0') {
                document.getElementById('languageSection').style.display = 'none';
                document.getElementById('keySection').style.display = 'none';
                return;
            }

            const selectedFile = fileArray[parseInt(fileIndex) - 1];
            const jsonString = localStorage.getItem(`common_json_${selectedFile}`);

            if (!jsonString) {
                alert('Selected JSON file not found');
                return;
            }

            const commonJson = JSON.parse(jsonString);
            showLanguagesInSameModal(commonJson, selectedFile);
        });
    }

    function showLanguagesInSameModal(commonJson, selectedFileName) {
        const topLevelKeys = Object.keys(commonJson);

        document.getElementById('languageSection').style.display = 'block';
        document.getElementById('keySection').style.display = 'none';

        const languageList = document.getElementById('languageList');
        languageList.innerHTML = '';

        topLevelKeys.forEach(key => {
            const div = document.createElement('div');
            div.className = 'suggestion language-option';
            div.setAttribute('data-value', key);
            div.textContent = key;
            div.style.cssText = 'padding: 8px; cursor: pointer; border-bottom: 1px solid #eee;';

            div.addEventListener('mouseenter', function () {
                this.style.background = '#f0f0f0';
            });

            div.addEventListener('mouseleave', function () {
                this.style.background = '';
            });

            div.addEventListener('click', function () {
                const selectedLanguage = this.getAttribute('data-value');
                showKeysInSameModal(selectedLanguage, commonJson, selectedFileName);
            });

            languageList.appendChild(div);
        });
    }

    function showKeysInSameModal(language, commonJson, selectedFileName) {
        const metaDataKeys = extractMetaDataKeys(commonJson[language]);

        document.getElementById('languageSection').style.display = 'none';
        document.getElementById('keySection').style.display = 'block';

        const keyList = document.getElementById('keyList');
        keyList.innerHTML = '';

        metaDataKeys.forEach(key => {
            const fullPath = `${language}.${key}`;
            const div = document.createElement('div');
            div.className = 'suggestion';
            div.setAttribute('data-value', fullPath);
            div.setAttribute('data-language', language);
            div.textContent = key;
            div.style.cssText = 'padding: 8px; cursor: pointer; border-bottom: 1px solid #eee;';

            div.addEventListener('mouseenter', function () {
                this.style.background = '#f0f0f0';
            });

            div.addEventListener('mouseleave', function () {
                this.style.background = '';
            });

            div.addEventListener('click', function () {
                const selectedValue = this.getAttribute('data-value');
                const selectedLanguage = this.getAttribute('data-language');
                loadImageToAssetManager(selectedValue, selectedLanguage, commonJson);
            });

            keyList.appendChild(div);
        });

        document.getElementById('backToLanguageBtn').addEventListener('click', function () {
            showLanguagesInSameModal(commonJson, selectedFileName);
        });

        document.getElementById('searchInput').addEventListener('input', function () {
            const searchValue = this.value.toLowerCase();
            const suggestions = keyList.querySelectorAll('.suggestion');

            suggestions.forEach(item => {
                if (item.textContent.toLowerCase().includes(searchValue)) {
                    item.style.display = 'block';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    }

    function loadImageToAssetManager(jsonPath, language, commonJson) {
        try {
            const pathParts = jsonPath.split('.');
            const remainingPath = pathParts.slice(1);

            let imageValue = commonJson[language];

            for (let i = 0; i < remainingPath.length; i++) {
                const key = remainingPath[i];

                if (key.includes('[') && key.includes(']')) {
                    const arrayKey = key.substring(0, key.indexOf('['));
                    const arrayIndex = key.match(/\[(\d+)\]/)[1];
                    imageValue = imageValue[arrayKey][arrayIndex];
                } else {
                    imageValue = imageValue[key];
                }

                if (imageValue === undefined || imageValue === null) {
                    alert('No image value found at this path');
                    return;
                }
            }

            if (!imageValue || typeof imageValue !== 'string') {
                alert('Invalid image value. Must be a string (URL, base64, or filename)');
                return;
            }

            imageValue = imageValue.trim();

            let imageSrc = '';

            if (imageValue.startsWith('data:image')) {
                imageSrc = imageValue;
            }

            else if (imageValue.startsWith('http://') || imageValue.startsWith('https://')) {
                imageSrc = imageValue;
            }

            else if (imageValue.startsWith('./') || imageValue.startsWith('../')) {
                imageSrc = imageValue;
            }

            else {
                const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico'];
                const hasImageExtension = imageExtensions.some(ext =>
                    imageValue.toLowerCase().endsWith(ext)
                );

                if (hasImageExtension) {
                    imageSrc = `./${imageValue}`;
                } else {
                    alert('Invalid image format. Please provide a valid image URL, base64 string, or filename with extension.');
                    return;
                }
            }

            editor.Modal.close();

            const assetManager = editor.AssetManager;
            assetManager.add({
                src: imageSrc,
                name: remainingPath.join('.'),
                type: 'image'
            });

            setTimeout(() => {
                editor.runCommand('open-assets');
            }, 300);

        } catch (error) {
            console.error('Error loading image from JSON:', error);
            alert('Error loading image. Please check the JSON path and value format.\n\nError: ' + error.message);
        }
    }

    window.openJsonImageSelector = openJsonImageSelector;
}
