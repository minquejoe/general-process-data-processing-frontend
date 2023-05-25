<template>
	<div id="linechart" ref="line"></div>
</template>

<script setup lang="ts" name="myecharts">
import { ref,onMounted,watch,toRef} from "vue";
import * as echarts from "echarts";
const line = ref() // 使用ref创建虚拟DOM引用，使用时用main.value

const props=defineProps({
    xData:Array,
    yData:Array,
	legendName:Array,
	seriesName:String,
	pointName:String,
	lineName:String,
	// maxVaule:String,
})
const refYData = toRef(props,'yData')
const refXData = toRef(props,'xData')

var lineOption = {
	tooltip: {
		trigger: 'axis'
	},
	legend: {
		data:props.legendName,
	},
	xAxis: {
		data: ["","","","","","","","","",""]
	},
	yAxis: {
		// max:props.maxVaule,
	},
	series: [{
		name: props.seriesName,
		type: 'line',
		data: [0,0,0,0,0,0,0,0,0,0],
		itemStyle: {
			normal: {
				color: props.pointName, //改变折线点的颜色
				lineStyle: {
					color: props.lineName //改变折线颜色
				}
			}
		}
	}]
};


onMounted(
  () => {
	var lineChart = echarts.init(line.value);
    lineChart.setOption(lineOption);	
	watch([refXData.value,refYData.value],async([newX,newY])=>{
        console.log('watch')
        console.log('prop:',newY)
		lineChart.setOption({
			xAxis: {
				data: newX
			},
			series: [{
				data: newY
			}]
		});
	});
	
  }
);



</script>

<style scoped>
</style>