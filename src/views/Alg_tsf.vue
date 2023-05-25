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
            outcomeChart: null,
            inputValue: '',
            plt_idx: 0,
            plt_data_outcome: [],
            plt_data_pred: [],
            alg_selected: {},
            alg_output: '',
            alg_dic: [
                {
                    name: 'LSTM',
                    params: ['序列长度', '训练集比例'],
                    key_default: { 'seq_len': 50, 'train_ratio': 0.98 },
                    key_options: { 'seq_len': '测试数据长度为 1000', 'train_ratio': '较为耗时，不建议修改' },
                    address: '/tsf/lstm',
                    output_form: '[预测值, 目标值, RMSE]',
                    showplt: true,
                },
                {
                    name: 'ELM',
                    params: ['序列长度', '训练集比例', '隐含层节点数'],
                    key_default: { 'seq_len': 50, 'train_ratio': 0.8, 'L': 30 },
                    key_options: { 'seq_len': '测试数据长度为 1000' },
                    address: '/tsf/elm',
                    output_form: '[预测值, 目标值, RMSE]',
                    showplt: true,
                },
                {
                    name: 'SVR(RBF)',
                    params: ['序列长度', '训练集比例', 'gamma', 'C'],
                    key_default: { 'seq_len': 50, 'train_ratio': 0.8, 'gamma': 0.001, 'C': 10 },
                    key_options: { 'seq_len': '测试数据长度为 1000' },
                    address: '/tsf/svr',
                    output_form: '[预测值, 目标值, RMSE]',
                    showplt: true,
                },
            ],
        }
    },


    methods: {
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
                this.plt_data_outcome = res.data[0];
                if (this.alg_selected.showplt === true) {
                    var option = this.outcomeChart.getOption();
                    option.series[1].data = Object.entries(this.plt_data_outcome);
                    this.outcomeChart.setOption(option)
                }
                this.plt_data_pred = res.data[1];
                if (this.alg_selected.showplt === true) {
                    var option = this.outcomeChart.getOption();
                    option.series[0].data = Object.entries(this.plt_data_pred);
                    this.outcomeChart.setOption(option)
                }
            })
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
                        name: '真实值',
                        symbol: 'none',
                        data: [],
                        type: 'line'
                    },
                    {
                        // 图例名称在此定义
                        name: '预测值',
                        symbol: 'none',
                        data: [],
                        type: 'line',
                    }
                ]
            };
            this.outcomeChart.setOption(option);
        }
    },

    setup() {
    },

    mounted() {
        this.init_outcomeChart()
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


