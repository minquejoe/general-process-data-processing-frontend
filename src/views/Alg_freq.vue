<template>
    <div>
        <div class="crumbs">
            <el-breadcrumb separator="/">
                <el-breadcrumb-item>
                    <i class="el-icon-lx-cascades"></i> 频域分析
                </el-breadcrumb-item>
            </el-breadcrumb>
        </div>
        <div class="container">
            <div class="handle-box">
                <el-select v-model="plt_data.name" @change="updateVal" placeholder="选择数据" class="handle-select mr10">
                    <el-option v-for="opt in plt_data" :key="opt.name" :label="opt.name" :value="opt.name">
                    </el-option>
                </el-select>
                <el-input v-model="inputValue" placeholder="原始数据" class="handle-input mr10"></el-input>
                <el-button @click="use_data" type="primary" icon="check">使用</el-button>
            </div>

            <!-- 输入数据预览图 -->
            <div class="echart-box">
                <div class="echart" ref="incomeChart"></div>
            </div>


            <!-- 算法设置部分 -->
            <div class="handle-box">
                <el-select v-model="alg_dic.name" @change="updateAlg" placeholder="选择算法" class="handle-select mr10">
                    <el-option v-for="opt in alg_dic" :key="opt.name" :label="opt.name" :value="opt.name">
                    </el-option>
                </el-select>

                <el-button @click="send_data" type="primary" icon="arrow-right" class="mr10">计算</el-button>
            </div>
            <el-form>
                <el-form-item v-for="(param, idx) in alg_selected.params" :label="param">
                    <el-input class="mr10 handle-input-param"
                        v-model="alg_selected[Object.keys(alg_selected.key_default)[idx]]" :placeholder="param"></el-input>
                    <el-tag class="tag-paramOptions"
                        v-if="Object.keys(alg_selected.key_default)[idx] in alg_selected.key_options">{{
                            alg_selected.key_options[Object.keys(alg_selected.key_default)[idx]] }}</el-tag>
                </el-form-item>
            </el-form>

            <!-- 输出部分 -->
            <el-form>
                <el-form-item label="输出：">
                    <el-input v-model="alg_output" placeholder="结果" class="handle-output mr10" :readonly="true"></el-input>
                </el-form-item>
                <el-tag class="tag-paramOptions" v-show="alg_selected.output_form !== undefined">{{
                    (alg_selected.output_form) }}</el-tag>
            </el-form>

            <!-- Echart 输出 -->
            <div class="echart-box" v-show="alg_selected.showplt === true">
                <div class="echart" ref="outcomeChart"></div>
            </div>
        </div>
    </div>
</template>

<script>
import { sendData } from '../api/send_data_forAlg';
import * as echarts from "echarts";

export default {
    name: "basetable",
    data() {
        return {
            incomeChart: null,
            outcomeChart: null,
            inputValue: '',
            plt_idx: 0,
            plt_data_outcome: [],
            alg_selected: {},
            alg_output: '',
            alg_dic: [
                {
                    name: 'DCT变换',
                    params: [],
                    key_default: {},
                    key_options: {},
                    address: '/freq_dom_/get_dct',
                    showplt: true,
                },
                {
                    name: 'Gabor变换',
                    params: ['采样频率', '窗函数标准差', '窗长度', '重叠率'],
                    key_default: { 'fs': 256, 'std': 0.65, 'nperseg': 256, 'noverlap': 128 },
                    key_options: {},
                    output_form: '[频率分辨坐标, 每窗时间坐标, 对应每窗stft变换实值]',
                    address: '/freq_dom_/get_gabor',
                    showplt: false,
                },
                {
                    name: '数字滤波',
                    params: ['滤波类型', '采样频率', '截止频率1', '截止频率2', '滤波器阶数',],
                    key_default: { 'filt_type': 'lowpass', 'fs': 256, 'fc1': 16, 'fc2': 32, 'filter_od': 3, },
                    key_options: { 'filt_type': '‘lowpass’, ‘highpass’, ‘bandpass’, ‘bandstop’', 'fc2': '带通带阻用', },
                    address: '/freq_dom_/dig_filt',
                    showplt: true,
                },
                {
                    name: '维纳滤波',
                    params: [],
                    key_default: {},
                    key_options: {},
                    address: '/freq_dom_/wie_filt',
                    showplt: true,
                },
                {
                    name: '卡尔曼滤波',
                    params: [],
                    key_default: {},
                    key_options: {},
                    address: '/freq_dom_/kal_filt',
                    showplt: true,
                },
                {
                    name: '自适应滤波',
                    params: ['目标波', '滤波器阶数', '步长因子',],
                    key_default: { 'dn': '0, 0', 'M': 8, 'mu': 1e-3 },
                    key_options: { 'dn': '数据长度需要与源数据一致' },
                    output_form: '[结果, 更新权重使用的误差值]',
                    address: '/freq_dom_/lms_filt',
                    showplt: false,
                },
                {
                    name: '傅里叶谐波分析',
                    params: ['采样频率', '主要波强度阈值', '频率坐标是否缩放2pi倍'],
                    key_default: { 'fs': 256, 'cut': 0.1, 'flag_xd2pi': 0 },
                    key_options: { 'cut': '(0, 1]，相对强度', 'flag_xd2pi': '0 或 1' },
                    output_form: '[主要波频率, 主要波相对强度]',
                    address: '/freq_dom_/get_harm',
                    showplt: false,
                },
                {
                    name: '降噪',
                    params: ['方法', '（SVD）保留奇异值百分比', '（中值法）滤波器长度',],
                    key_default: { 'method': 'svd', 'ratio': 0.01, 'kernel_size': 5 },
                    key_options: { 'method': 'svd: SVD法 | med: 中值法', 'kernel_size': '需为奇数' },
                    address: '/freq_dom_/denoise',
                    showplt: true,
                },
                {
                    name: '功率谱',
                    params: ['计算方式', '（多窗谱法）窗函数', '（多窗谱法）窗长度', '（多窗谱法）重叠点数', '频率坐标是否缩放2pi倍'],
                    key_default: { 'method': 'periodogram', 'window': 'hamming', 'nperseg': 256, 'noverlap': 128, 'flag_xd2pi': 0 },
                    key_options: { 'method': 'periodogram:周期图法 | welch: 多窗谱法', 'flag_xd2pi': '0 或 1' },
                    output_form: '[频率轴, 信号功率谱密度]',
                    address: '/freq_dom_/get_psd',
                    showplt: false,
                },
            ],
            plt_data: [
                {
                    value: Array.from({ length: 150 }, (_, i) => Math.cos(i / 4) * 10 + 10),
                    seq: Array.from({ length: 150 }, (_, i) => ''),
                    name: 'general',
                },
                {
                    value: Array.from({ length: 150 }, (_, i) => (Math.cos(i / 4) + Math.random()) * 10 + 10),
                    seq: Array.from({ length: 150 }, (_, i) => ''),
                    name: 'noise',
                },
            ],
        }
    },


    methods: {
        use_data() {
            if (this.inputValue != '') {
                // 将文本框内的数字转换为数组
                const numbers = String(this.inputValue).split(',').map(Number);
                // Array.from()方法要求有 length 属性
                const values = this.plt_data.map(obj => obj.value)
                if (!values.some(v => JSON.stringify(v) === JSON.stringify(numbers))) {
                    this.plt_data.push({
                        value: numbers,
                        seq: Array.from({ length: numbers.length }, (_, i) => ''),
                        name: 'user ' + String(this.plt_data.length - 2),
                    });
                    this.plt_idx = this.plt_data.length - 1;
                } else {
                    this.plt_idx = values.findIndex(v => JSON.stringify(v) === JSON.stringify(numbers))
                }

                // 更新输入图表
                var option = this.incomeChart.getOption();
                option.series[0].data = Object.entries(this.plt_data[this.plt_idx].value);
                this.incomeChart.setOption(option)
            }
        },
        updateVal(val) {
            let selected = this.plt_data.find(opt => opt.name == val);
            this.inputValue = selected ? selected.value.join(', ') : '';
        },
        updateAlg(name) {
            let selected = this.alg_dic.find(opt => opt.name == name);
            this.alg_selected = {};

            // this.alg_selected = JSON.parse(JSON.stringify(selected));
            for (const [key, value] of Object.entries(selected)) {
                if (key === 'key_default') {
                    for (const [param, default_val] of Object.entries(value)) {
                        this.alg_selected[param] = default_val;
                    }
                }
                this.alg_selected[key] = value;
            }
        },
        send_data() {
            let send_dict = this.alg_selected;
            send_dict["data"] = this.inputValue.split(',').map(Number);
            sendData(this.alg_selected.address, send_dict).then((res) => {

                // console.log(typeof(res.data));

                if (typeof (res.data) === 'number') {
                    this.alg_output = res.data
                } else {
                    if (res.data === null) {
                        this.alg_output = 'Null';
                    } else if (typeof (res.data) === 'string') {
                        this.alg_output = res.data;
                    } else {
                        this.alg_output = JSON.stringify(res.data);
                    }
                }

                // then 是异步执行，更新结果图表放在内部，确保获取到数据再更新
                this.plt_data_outcome = res.data;
                if (this.alg_selected.showplt === true) {
                    var option = this.outcomeChart.getOption();
                    option.series[0].data = Object.entries(this.plt_data_outcome);
                    this.outcomeChart.setOption(option)
                }
            })
        },
        init_incomeChart() {
            this.incomeChart = echarts.init(this.$refs.incomeChart);
            let option = {
                // Set the title
                title: {
                    text: '数据预览',
                    left: 'center',
                },
                // Set the legend
                legend: {
                    // 此处 name 只是起引用作用
                    // data: [{name: 'Series 1'}]
                    right: '5%'
                },
                xAxis: {
                    show: false,
                    type: 'value',
                },
                yAxis: {
                    type: 'value'
                },
                series: [
                    {
                        symbol: 'none',
                        data: [],
                        type: 'line'
                    },
                ]
            };
            this.incomeChart.setOption(option);
        },
        init_outcomeChart() {
            this.outcomeChart = echarts.init(this.$refs.outcomeChart);
            let option = {
                // Set the title
                title: {
                    text: '结果预览',
                    left: 'center',
                },
                // Set the legend
                legend: {
                    // 此处 name 只是起引用作用
                    // data: [{name: 'Series 1'}]
                    right: '5%'
                },
                xAxis: {
                    show: false,
                    type: 'value',
                },
                yAxis: {
                    type: 'value'
                },
                series: [
                    {
                        symbol: 'none',
                        data: [],
                        type: 'line'
                    },
                ]
            };
            this.outcomeChart.setOption(option);
        },
    },

    setup() {

    },

    mounted() {
        this.init_incomeChart();
        this.init_outcomeChart();
    },
};
</script>

<style scoped>
.handle-box {
    margin-bottom: 20px;
}

.handle-select {
    width: 180px;
}

.handle-input {
    width: 650px;
}

.handle-output {
    width: 900px;
}

.handle-input-param {
    width: 150px;
}

.mr10 {
    margin-right: 10px;
}

.echart-box {
    display: inline-block;
}

.echart {
    width: 1000px;
    height: 300px;
}
</style>



