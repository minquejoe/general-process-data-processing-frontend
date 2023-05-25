<template>
    <div>
        <div class="crumbs">
            <el-breadcrumb separator="/">
                <el-breadcrumb-item>
                    <i class="el-icon-lx-cascades"></i> 时域分析
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
            inputValue: '',
            plt_idx: 0,
            plt_data_outcome: [],
            alg_selected: {},
            alg_output: '',
            alg_dic: [
                {
                    name: '加窗',
                    params: ['窗函数', '（高斯窗）函数标准差'],
                    key_default: { 'win_name': 'hamming', 'std': 0.65 },
                    key_options: { 'win_name': 'hamming, hann, triang, boxcar, gaussian等' },
                    address: '/time_dom_/mul_win',
                    showplt: true,
                },
                {
                    name: '信号分帧',
                    params: ['每帧长度', '重叠率', '补零保留最后帧'],
                    key_default: { 'fame_len': 256, 'overlap_rate': 0, 'drop_last': 1 },
                    key_options: { 'drop_last': '0:不保留 或 1:保留' },
                    output_form: '[frame1, frame2, ..., framen]',
                    address: '/time_dom_/spt_frm',
                    showplt: false,
                },
                {
                    name: '滑动平均',
                    params: ['平均长度'],
                    key_default: { 'scale': 4 },
                    key_options: {},
                    address: '/time_dom_/sld_avg',
                    showplt: true,
                },
                {
                    name: '卷积',
                    params: ['目标', '输出方式'],
                    key_default: { 'cov_with': '0, 0', 'mode': 'same' },
                    key_options: { 'mode': 'full: 完全离散线性卷积 || valid: 输出仅包含那些不依赖于零填充的元素 || same: 输出与原始数据的尺寸相同, 以full输出为中心' },
                    address: '/time_dom_/get_cov',
                    showplt: true,
                },
                {
                    name: '升采样',
                    params: ['增加采样倍数', '插值方式'],
                    key_default: { 'ins_rate': 1, 'mode': 'zero' },
                    key_options: { 'mode': 'zero: 零插值, linear: 线性插值, ffill: 用前一个值填充, bfill: 用后一个值填充' },
                    address: '/time_dom_/up_samp',
                    showplt: true,
                },
                {
                    name: '降采样',
                    params: ['间隔'],
                    key_default: { 'gap': 1 },
                    key_options: {},
                    address: '/time_dom_/down_samp',
                    showplt: true,
                },
                {
                    name: '交叉关联分析',
                    params: ['目标'],
                    key_default: { 'target': '0, 0' },
                    key_options: {},
                    output_form: '[与目标波形的交叉相关系数, 对应相关系数的偏移度]',
                    address: '/time_dom_/crs_crr',
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
