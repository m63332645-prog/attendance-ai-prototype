/**
 * 定义一种js和cordova插件之间相互调用的桥接模式。
 * jsCallCordovaPlugin 通过自定义的native协议名加上其他所需的参数，包括插件名，方法名，参数等，如果要操作打开的窗口，如关闭窗口，刷新等，需要传入jsCallCordovaPlugin('browser','close或reload',null)
 * cordovaCallJs 通过在主项目中调用 executeScript({code:"javascript:CordovaBridge.cordovaCallJs('插件名','方法名','调用原生插件后取得的结果')"}); 将结果回传给 miniSite，再由miniSite广播到各个业务场景
 */
// (function(){
//   "use strict";
window.CordovaBridge = {};

/**
 * 定义js向java调用的对象
 * 调用cordova插件，需传入插件名称和插件需要的参数
 */
window.CordovaBridge.jsCallCordovaPlugin = function (pluginName, actionName, params) {
  var _param = '';
  if (params && params != null) {
    _param = JSON.stringify(params);
  }
  window.location.href = 'native://' + pluginName + '?action=' + actionName + '&&param=' + encodeURI(_param);
};

/**
 * 定义java向js回传的数据并将数据通过事件广播出去
 * 事件名为插件名称+操作名称 如：media.startRecord 表示监听媒体插件里面的开始录音
 */
window.CordovaBridge.cordovaCallJs = function (pluginName, actionName, returnValue) {
  var myEvent = new CustomEvent(pluginName + "." + actionName, {
    detail: {
      data: returnValue
    },
    bubbles: false,
    cancelable: false
  });
  document.dispatchEvent(myEvent);
};
// 查看客户详情
export function customerCordova(clientNum) {
  window.CordovaBridge.jsCallCordovaPlugin('main', 'native', {
    url: "HolderClientDetailPage",
    params: {
      clientNum: clientNum
    }
  });

}

// 查看被保人客户详情
export function recognizeeCordova(clientNum) {
  window.CordovaBridge.jsCallCordovaPlugin('main', 'native', {
    url: "HolderClientDetailPage",
    params: {
      clientNum: clientNum,
      clientThirdPage: 1,
      clientRole: "I"
    }
  });
}

// 查看保单详情
export function noteCordova(username, polNum) {
  window.CordovaBridge.jsCallCordovaPlugin("main", "native", {
    url: "PolicyDetailsPage",
    params: {
      agentCode: username,
      policyNO: polNum
    }
  });

}

// 查看理赔详情
export function claimCordova(item) {
  window.CordovaBridge.jsCallCordovaPlugin("main", "native", {
    url: "ClientClaimDetailPage",
    params: {
      polNum: item.policyID,
      posNum: item.posNum,
      clmStatCode: item.claimsStatus,
      from: "thirdPage",

    }
  })
}
// 跳转理赔照会列表
export function jumpNoteCordova(item) {
  window.CordovaBridge.jsCallCordovaPlugin("main", "native", {
    url: "ClientPdfListPage",
    params: {
      claim: item,
      from: "thirdPage",
    }
  })
}

// 跳转至课程详情页面
export function courseDetailCordova(item) {
  window.CordovaBridge.jsCallCordovaPlugin('main', 'native', {
    url: "LessonDetailPage",
    params: {
      lessonId: item.courseId, //传课程Id
      from: 'thirdPage'
    }
  })
}

// 唤起消息推送权限
export const wakeMsgPermission = () => {
  window.CordovaBridge.jsCallCordovaPlugin('permission', 'getPush', null)
}

// 退出到App
export const backApp = () => {
  window.CordovaBridge.jsCallCordovaPlugin('browser', 'close');
}

// 保存图片到相册，url为图片地址
export const savePhoto = (url) => {
  // console.log(url,'savePhotosavePhotosavePhotosavePhotosavePhoto')
  window.CordovaBridge.jsCallCordovaPlugin('photo', 'savePhotoForUrl', { url });
}
// 保存图片到相册，url为图片地址-客户权益部分保存 安卓不显示回调
export const savePhotoForUrl = (url) => {
  console.log(url,'savePhotosavePhotosavePhotosavePhotosavePhoto')
  window.CordovaBridge.jsCallCordovaPlugin('photo', 'savePhoto', { url });
}

/**
 * 分享到微信、朋友圈
 * options: {
 *   scene: 0分享给朋友 1分享到朋友圈
 *   id: 'send-link-thumb-remote',
 *   data: {
 *     link: 链接地址
 *     thumb: 图片地址
 *     shortName: 标题
 *     description: 描述
 *   }
 * }
 */
export const shareToWechat = (options) => {
  window.CordovaBridge.jsCallCordovaPlugin('wechat', 'share', options);
}

// 使用 App 打开 pdf
export const openPDF = ({ url, fileName }) => {
  window.CordovaBridge.jsCallCordovaPlugin('pdf', 'open', {
    url,
    fileName
  })
}

// 使用 App 打开文件
export const openFile = (options) => {
  window.CordovaBridge.jsCallCordovaPlugin('fileTransfer', 'getfile', options);
}


// 打开客户详情
export function goHolderClientDetailPage(clientNum,clientRole) {
  window.CordovaBridge.jsCallCordovaPlugin('main', 'native', {
    url: "HolderClientDetailPage",
    params: {
      clientNum: clientNum,
      clientThirdPage: 1,
      clientRole: clientRole,
      from:'thirdPage',
      isRoot:true
    }
  });
}

// 跳转至受益人详情
export function goBeneficiaryDetailPage(beneficiary,index) {
  window.CordovaBridge.jsCallCordovaPlugin('main', 'native', {
    url: "BeneficiaryDetailPage",
    params: {
      beneficiary: beneficiary,
      index: index,
      from:'thirdPage'
    }
  });
}
//跳转信息捆绑页面
export function goBundlePlanPage(id) {
  window.CordovaBridge.jsCallCordovaPlugin('main', 'native', {
    url: "BundlePlanPage",
    params: {
      id: id,
      from:'thirdPage'
    }
  });
}
//跳转至附加利益保障
export function goExtraBenefitPage(id) {
  window.CordovaBridge.jsCallCordovaPlugin('main', 'native', {
    url: "ExtraBenefitPage",
    params: {
      id: id,
      from:'thirdPage'
    }
  });
}
//跳转至贷款记录(累积贷款金额)
export function goLoanRecordPage(id,currentLoanRate) {
  window.CordovaBridge.jsCallCordovaPlugin('main', 'native', {
    url: "LoanRecordPage",
    params: {
      id: id,
      currentLoanRate:currentLoanRate,
      from:'thirdPage'
    }
  });
}
//跳转至万能险详情
export function goUniversalAccountDetailPage(id,rulUniversallimitAmount,displayInd,basePlanCode) {
  window.CordovaBridge.jsCallCordovaPlugin('main', 'native', {
    url: "UniversalAccountDetailPage",
    params: {
      id: id,
      rulUniversallimitAmount:rulUniversallimitAmount,
      displayInd:displayInd,
      basePlanCode:basePlanCode,
      from:'thirdPage'
    }
  });
}
//跳转至投连账户详情
export function goAccountListPage(id) {
  window.CordovaBridge.jsCallCordovaPlugin('main', 'native', {
    url: "AccountListPage",
    params: {
      id: id,
      from:'thirdPage'
    }
  });
}

//跳转至银行转账详情
export function goTransferRecordsPage(id) {
  window.CordovaBridge.jsCallCordovaPlugin('main', 'native', {
    url: "TransferRecordsPage",
    params: {
      id: id,
      from:'thirdPage'
    }
  });
}

//跳转内勤团队业绩
export function goToUnitPerformanceNeiqin(params) {
  window.CordovaBridge.jsCallCordovaPlugin('main', 'native', {
    url: "TeamPerformanceInhousePage",
    params: {
      token : params.token,
      agentCode: params.agentCode,
      device: params.device,
      isSale: params.isSale,
      isMultiCity: params.isMultiCity,
      from:'thirdPage'
    }
  });
}

// 跳转至日程
export function goToSchedulePage() {
  window.CordovaBridge.jsCallCordovaPlugin('main', 'native', {
    url: "ScheduleListPage",
    params: {
      from:'thirdPage'
    }
  });
}

// 获取手机定位
export const geoloaction = (options) => {
  window.CordovaBridge.jsCallCordovaPlugin('geoloaction', 'share', options);
}
// 获取键盘高度
export const getKeyboard = () => {
  window.CordovaBridge.jsCallCordovaPlugin('keyboard', 'clientHeight');
}

// 打开手机百度app
export function goToBaidu(params) {
  window.CordovaBridge.jsCallCordovaPlugin('goBaidu', 'goBaidu', {
    params
  });
}
