<template>
    <div>
        <div class="crumbs">
            <el-breadcrumb separator="/">
                <el-breadcrumb-item>
                    <i class="el-icon-lx-cascades"></i> 时频分析
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
                        v-if="Object.keys(alg_selected.key_default)[idx] in alg_selected.key_options">
                        {{ alg_selected.key_options[Object.keys(alg_selected.key_default)[idx]] }}
                    </el-tag>
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
            alg_selected: {},
            alg_output: '',
            alg_dic: [
                {
                    name: '小波包分析',
                    params: ['母小波', '分析层级', '填充方式', '小波包树节点排列方式'],
                    key_default: { 'wavlet': 'db3', 'level': 3, 'mode': 'zero', 'order': 'freq' },
                    key_options: { 'wavlet': 'haar, db, sym, coif, bior, rbio, dmey, gaus, mexh, morl, cgau, shan, fbsp, cmor家族', 'level': '整数或 max（不推荐）', 'mode': 'zero, constant, symmetric, periodic', 'order': 'natural 或 freq' },
                    output_form: '[各节点小波重构结果, 各节点小波系数]',
                    address: '/time_freq_dom_/get_wavpack',
                },
                {
                    name: '经验小波分析',
                    params: ['信号分量数', '是否采用对数频率', '区间划分方式', '式划分数量不足 N 时是否完成', '滤波方式', '滤波长度', '高斯滤波标准差'],
                    key_default: { 'N': 5, 'log': 0, 'detect': 'locmax', 'completion': 0, 'reg': 'none', 'lengthFilter': 10, 'sigmaFilter': 1, },
                    key_options: { 'log': '0 或 1', 'detect': 'locmax：最大值之间的中点,locmaxmin：最大值之间的最小值,locmaxminf：原始谱最大值之间的最小值', 'completion': '0 或 1', 'reg': 'none, gaussian, average' },
                    output_form: '[信号分量, 滤波器组（频域）, 标准化至pi的划分边界]',
                    address: '/time_freq_dom_/get_ewt',
                },
                {
                    name: '提升小波分析（TODO）',
                    params: [],
                    key_default: {},
                    key_options: {},
                    output_form: '[低频, 高频]',
                    address: '/time_freq_dom_/get_lwt',
                },
                {
                    name: 'EMD',
                    params: [],
                    key_default: {},
                    key_options: {},
                    output_form: '[imf1, imf2, ..., imfn]',
                    address: '/time_freq_dom_/get_emd',
                },
                {
                    name: 'Hilbert谱+边际谱',
                    params: ['采样频率', '频率轴划分区间数'],
                    key_default: { 'fs': 256, 'intervals': 100, },
                    key_options: {},
                    output_form: '频率坐标, HHT结果, 边际谱',
                    address: '/time_freq_dom_/get_hht',
                },
                {
                    name: '短时傅里叶',
                    params: ['采样频率', '窗函数', '窗长度', '重叠点数'],
                    key_default: { 'fs': 256, 'window': 'hann', 'nperseg': 128, 'noverlap': 64, },
                    key_options: {},
                    output_form: '频率分辨坐标, 每窗时间坐标, 对应每窗stft变换实值',
                    address: '/time_freq_dom_/get_stfs',
                },
                {
                    name: '随机数~U(0,1)',
                    params: ['数量'],
                    key_default: { 'num': 1 },
                    key_options: {},
                    output_form: undefined,
                    address: '/time_freq_dom_/get_rnd',
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

                // console.log(res.data);

                if (typeof (res.data) === 'number') {
                    this.alg_output = res.data
                } else {
                    if (res.data === null) {
                        this.alg_output = 'Null';
                    } else {
                        this.alg_output = JSON.stringify(res.data);
                    }
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
    },

    setup() {

    },
    mounted() {
        this.init_incomeChart();
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
