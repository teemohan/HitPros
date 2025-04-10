/**
 * Minified by jsDelivr using Terser v5.19.2.
 * Original file: /gh/zipcodes/zipcodes.js@1.3.0/zipcodes.js
 *
 * Do NOT use SRI with dynamically generated files! More information: https://www.jsdelivr.com/using-sri-with-dynamic-files
 */
// var getZipCode=function(_,d,a){var A={AD:0,AR:2,AS:0,AT:2,AU:2,AX:0,AZ:0,BD:1,BE:1,BG:1,BM:0,BR:1,BY:1,CA:1,CH:1,CO:1,CR:0,CZ:2,DE:2,DK:1,DO:0,DZ:2,EE:0,ES:2,FI:1,FO:0,FR:2,GB:2,GF:0,GG:0,GL:0,GP:0,GT:0,GU:0,HR:1,HU:1,IE:0,IM:0,IN:3,IS:0,IT:2,JE:0,JP:3,KR:2,LI:0,LK:1,LT:2,LU:1,LV:1,MC:0,MD:1,MH:0,MK:0,MP:0,MQ:0,MT:0,MX:3,MY:1,MW:0,NC:0,NL:1,NO:1,NZ:1,PH:1,PK:2,PL:2,PM:0,PR:0,PT:3,RE:0,RO:2,RU:2,SE:2,SG:3,SI:0,SJ:0,SK:1,SM:0,TH:0,TR:2,UA:2,US:2,UY:1,VA:0,VI:0,WF:0,YT:0,ZA:1},e={AD:/^(([a-zA-Z]{2}\d{3})|(\d{4}))$/,AM_AZ_BJ_BY_CN_IN_KG_KZ_MN_RO_RS_RU_SG_TJ_TM_UZ:/^[0-9]{6}$/,AR:/^((\d{4})|([a-zA-Z]{1}\d{4}[a-zA-Z]{3}))$/,AS_BA_CS_CU_DE_DZ_EE_ES_FI_FM_GF_GP_GT_GU_HR_IC_ID_IL_IT_KE_KW_LT_MA_ME_MH_MM_MP_MQ_MX_MY_PK_PM_PR_PS_PW_RE_SA_SM_TH_TR_UA_UY_VI_VN_YU_ZM:/^[0-9]{5}$/,AT_AU_BD_BE_BG_CH_CX_CY_DK_GL_GW_HU_LI_LU_MD_MK_MZ_NO_NZ_PH_SD_SI_TN_VE_XK_ZA:/^[0-9]{4}$/,BM:/^[a-zA-Z]{2}\s\d{2}$/,BN:/^[a-zA-Z]{2}\d{4}$/,BR:/^(\d{5})(-\d{3})?$/,CA:/^[ABCEGHJKLMNPRSTVXY]{1}\d{1}[A-Z]{1} *\d{1}[A-Z]{1}\d{1}$/,CZ_GR_SE_SK:/^[0-9]{3}\s?[0-9]{2}$/,FO:/^([a-zA-Z]{2}-)?(\d{3})?$/,FR:/^((0[1-9])|([1-8][0-9])|(9[0-8])|(2A)|(2B))[0-9]{3}$/,GB:/^GIR?0AA|[A-PR-UWYZ]([0-9]{1,2}|([A-HK-Y][0-9]|[A-HK-Y][0-9]([0-9]|[ABEHMNPRV-Y]))|[0-9][A-HJKS-UW])?[0-9][ABD-HJLNP-UW-Z]{2}$/,GE:/^((\d{4})|(\d{6}))$/,IE:/^(([a-zA-Z]{2}(\s(([a-zA-Z0-9]{1})|(\d{2})))?)|([a-zA-Z]{3}))$/,IS_MG:/^[0-9]{3}$/,JP:/^\d{3}(-\d{4})?$/,KR:/^\d{3}(-)?\d{3}$/,LV:/^([a-zA-Z]{2}-)?(\d{4})$/,MT:/^[a-zA-Z]{3}\s\d{2,4}$/,MV:/^\d{4,5}$/,MW:/^\d{6,7}$/,NL:/^(\d{4})\s?[a-zA-Z]{2}$/,PL:/^\d{2}(-)?\d{3}$/,PT:/^\d{4}(-)?\d{3}$/,SZ:/^[a-zA-Z]{1}\d{3}$/,TW:/^\d{3}(\d{2})?$/,US:/^\d{5}(-\d{4})?$/},M=["countryCode","postalCode","placeName","adminName1","adminCode1","adminName2","adminCode2","adminName3","adminCode3","latitude","longitude","accuracy"],i=null;if(void 0!==e[_=_&&_.toLocaleUpperCase()])i=e[_];else for(var o in e)if(e.hasOwnProperty(o)&&o.indexOf(_)>0){i=e[o];break}var n={input:{country:_,zip:d},lookup:{},pattern:i,validPattern:i&&i.test(d),validLookup:!1,valid:!1};if(!n.pattern||n.validPattern)if(void 0!==A[_]){"US"===_&&5===d.indexOf("-")&&(d=d.substring(0,d.indexOf("-"))),window.zipCodesCallback=function(_){if(void 0!==_[d]){for(var A=0,e=M.length;A<e;A++)n.lookup[M[A]]=_[d][A];n.validLookup=!0,n.valid=!0}a(n)};o=A[_]>0?d.toUpperCase().replace(/[^0-9A-Z]/g,"").substr(0,A[_]):0;var Z=document.createElement("script");Z.src="https://"+_+".zipcodes.gdn/min/"+o+".jsonp",document.body.appendChild(Z)}else n.valid=!0,a(n)};
//# sourceMappingURL=/sm/bee382b86273393cdadfce9c92856b7b4e6b18e84a519f8e3384b7961f8e7566.map

async function getStateByZip(zipCode) {
    const apiUrl = `https://api.zippopotam.us/us/${zipCode}`;
  
    try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error('Invalid ZIP Code or API Error');
      }
      const data = await response.json();
      const state = data.places[0]['state']; // 获取州名称
      return state;
    } catch (error) {
      console.error('Error:', error.message);
      return 'Unable to fetch state for the given ZIP Code';
    }
}

// 优化的懒加载指令
Vue.directive('lazy', {
  inserted: el => {
    // 创建占位图片
    const placeholder = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
    // 保存原始图片URL
    const src = el.dataset.src;
    // 设置占位图
    el.setAttribute('src', placeholder);
    
    function loadImage() {
      if (!src) return;
      
      // 使用新图片对象预加载
      const img = new Image();
      img.onload = () => {
        el.src = src;
        // 使用requestAnimationFrame优化渲染性能
        requestAnimationFrame(() => {
          el.classList.add('loaded');
        });
      };
      
      img.onerror = () => {
        console.log('图片加载失败');
        el.src = placeholder;
      };
      
      img.src = src;
    }

    function handleIntersect(entries, observer) {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // 使用requestIdleCallback在浏览器空闲时加载图片
          if ('requestIdleCallback' in window) {
            requestIdleCallback(() => loadImage(), { timeout: 2000 });
          } else {
            loadImage();
          }
          observer.unobserve(el);
        }
      });
    }

    function createObserver() {
      const options = {
        root: null,
        rootMargin: '100px 0px', // 提前100px开始加载
        threshold: 0.1
      };
      const observer = new IntersectionObserver(handleIntersect, options);
      observer.observe(el);
    }

    if ('IntersectionObserver' in window) {
      createObserver();
    } else {
      loadImage(); // 对于不支持 IntersectionObserver 的浏览器，直接加载图片
    }
  }
});