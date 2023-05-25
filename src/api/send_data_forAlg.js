// 参考：https://juejin.cn/post/6992229072751460365
import request from '../utils/request_forAlg.js'

export function sendData(address, obj) {
    return request({  //利用我们封装好的request发送请求
        url: address,//请求地址 已经去除前面request中baseUrl相同的内容
        method: 'POST',//请求方法
        data: obj//向后端传递数据
    })
}
