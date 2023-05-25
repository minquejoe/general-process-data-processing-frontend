<template>
    <div>
        <div class="crumbs">
            <el-breadcrumb separator="/">
                <el-breadcrumb-item>
                    <i class="el-icon-lx-cascades"></i> 统计分析
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
                    <el-input class="handle-input-param" v-model="alg_selected[Object.keys(alg_selected.key_default)[idx]]"
                        :placeholder="param"></el-input>
                </el-form-item>
            </el-form>

            <!-- 输出部分 -->
            <el-form>
                <el-form-item label="输出：">
                    <el-input v-model="alg_output" placeholder="结果" class="handle-output mr10" :readonly="true"></el-input>
                </el-form-item>
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
            inputValue: '',
            plt_idx: 0,
            alg_selected: {},
            alg_output: '',
            alg_dic: [
                { name: '最大值', params: [], key_default: {}, address: '/statistic_/get_max', },
                { name: '最小值', params: [], key_default: {}, address: '/statistic_/get_min', },
                { name: '平均值', params: [], key_default: {}, address: '/statistic_/get_avg', },
                { name: '中位数', params: [], key_default: {}, address: '/statistic_/get_mid', },
                { name: '计数', params: [], key_default: {}, address: '/statistic_/get_len', },
                { name: '求和', params: [], key_default: {}, address: '/statistic_/get_sum', },
                { name: '求积', params: [], key_default: {}, address: '/statistic_/get_cup', },
                { name: '方差', params: [], key_default: {}, address: '/statistic_/get_std', },
                { name: 'n阶距', params: ['阶数'], key_default: { 'order': 3 }, address: '/statistic_/get_mnt', },
                { name: '峰峰值', params: [], key_default: {}, address: '/statistic_/get_pp', },
                { name: '相关系数', params: [], key_default: {}, address: '/statistic_/get_ppc', },
                { name: '概率（分位数）', params: ['计算区间数'], key_default: { 'interval': 10 }, address: '/statistic_/get_qtl', },
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
                if (typeof (res.data) === 'number') {
                    this.alg_output = res.data
                } else {
                    if (res.data === null) {
                        this.alg_output = 'Null';
                    } else {
                        this.alg_output = res.data.join(', ');
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
