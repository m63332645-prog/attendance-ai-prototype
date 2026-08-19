import { getZhonghongID } from '@/services/api'
import { getAgentCodeFromHash } from '@/utils/utils'


let agentCode = getAgentCodeFromHash(window.location.hash)

if (!agentCode) {
  // 从待办里进入团险没有在链接上携带agentCode
  agentCode = sessionStorage.getItem('agentCode')
}


getZhonghongID({ agentCode }).then(res => {
  const zhonghongID = res

  if (!zhonghongID) {
    console.log('中宏ID不存在')
    return
  }

  const sensors = window['sensorsDataAnalytic201505']

  if (!sensors) {
    console.log('sensorsDataAnalytic201505 不存在')
    return
  }
  sensors.init({
    name: 'sensors',
    server_url: process.env.VUE_APP_SENSORS_URL,
    //is_track_single_page: true,
    show_log: true, // 是否允许控制台打印查看埋点数据
    heatmap: {
      clickmap: 'default',
      scroll_notice_map: 'default',
    }
  })
  sensors.use('PageLeave')
  // sensors.registerPage({
  //   platform_type: 'AMA3.0',
  //   product_platform: '宏掌门',
  //   event: 'AMAClick',
  //   business_name: '考勤'
  // })
  // 判断是否在Mafa App中运行
  // const isMafaApp = window.MafaJSAPI && typeof window.MafaJSAPI.isMafaApp === 'function' && window.MafaJSAPI.isMafaApp()
  // console.log('isMafaApp', isMafaApp);

  sensors.registerPage({
    platform_type: 'H5',
    product_platform: 'AMA3.0',
    business_name: '考勤',
    agent_code: agentCode
  })
  sensors.login(zhonghongID)
  sensors.quick('autoTrack')

  // 挂到window上
  window.sensorsH5 = sensors

}).catch(err => {
  console.log(err)
})