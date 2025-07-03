class Ajax {
  constructor() {
    this.baseURL = window.zkh.api;
    this.timeout = 100000;
    this.headers = {
      'Content-Type': 'application/json'
    };
  }
  // Set base URL for all requests
  setBaseURL(url) {
    this.baseURL = url;
    return this;
  }
  // Set default headers
  setHeaders(headers) {
    this.headers = { ...this.headers, ...headers };
    return this;
  }
  // Set request timeout
  setTimeout(timeout) {
    this.timeout = timeout;
    return this;
  }
  // Main request method
  request(options) {
    return new Promise((resolve, reject) => {
      const {
        method = 'GET',
        url,
        data = null,
        headers = {},
        timeout = this.timeout
      } = options;

      // Get token from localStorage
      // const token = JSON.parse(localStorage.memberUserInfo || '{}').token || '';
      
      // Create XMLHttpRequest instance
      const xhr = new XMLHttpRequest();
      
      // Combine base URL with request URL
      const fullURL = this.baseURL + url;
      
      // Open request
      xhr.open(method, fullURL, true);
      
      // Set timeout
      xhr.timeout = timeout;
      
      // Set headers
      const finalHeaders = {
        ...this.headers,
        ...headers
      };
      
      // if (token) {
      //   finalHeaders.Authorization = token;
      //   finalHeaders.token = token;
      // }
      
      Object.entries(finalHeaders).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value);
      });

      // Setup handlers
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 800) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (e) {
            reject(new Error('Invalid JSON response'));
          }
        } else {
          reject(new Error(xhr.statusText || 'Request failed'));
        }
      };

      xhr.onerror = () => {
        reject(new Error('Please check your network and retry.'));
      };

      xhr.ontimeout = () => {
        reject(new Error('Network request timed out. Please check your network and retry.'));
      };

      // Send request
      xhr.send(data ? JSON.stringify(data) : null);
    });
  }
  // Convenience methods for different HTTP methods
  get(url, config = {}) {
    return this.request({ ...config, method: 'GET', url });
  }
  post(url, data, config = {}) {
    return this.request({ ...config, method: 'POST', url, data });
  }
  put(url, data, config = {}) {
    return this.request({ ...config, method: 'PUT', url, data });
  }
  delete(url, config = {}) {
    return this.request({ ...config, method: 'DELETE', url });
  }
}
// Create instance
const kkAjax = new Ajax();

Vue.directive('lazy', {
  inserted: el => {
    // Create placeholder image
    const placeholder = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
    // Save original image URL
    const src = el.dataset.src;
    // Set placeholder image
    el.setAttribute('src', placeholder);
    
    function loadImage() {
      if (!src) return;
      
      // Preload with new image object
      const img = new Image();
      img.onload = () => {
        el.src = src;
        
        // 使用setTimeout确保图片有足够时间渲染
        setTimeout(() => {
          // 检查图片是否真的加载成功
          if (el.complete && el.naturalWidth > 0) {
            el.classList.add('loaded');
          } else {
            // 如果图片未成功加载，重试一次
            el.src = src + '?retry=' + new Date().getTime();
            setTimeout(() => {
              if (el.complete && el.naturalWidth > 0) {
                el.classList.add('loaded');
              } else {
                // 如果重试后仍然失败，使用占位图
                console.log('Image loading failed after retry:', src);
                el.src = placeholder;
              }
            }, 500);
          }
        }, 100);
      };
      
      img.onerror = () => {
        console.log('Image loading failed');
        el.src = placeholder;
      };
      
      img.src = src;
    }

    function handleIntersect(entries, observer) {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Use requestIdleCallback to load images during browser idle time
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
        rootMargin: '100px 0px', // Start loading 100px ahead
        threshold: 0.1
      };
      const observer = new IntersectionObserver(handleIntersect, options);
      observer.observe(el);
    }

    if ('IntersectionObserver' in window) {
      createObserver();
    } else {
      loadImage(); // For browsers that don't support IntersectionObserver, load image directly
    }
  }
});

// DataLayer Manager Factory
const DataLayerManagerFactory = (function() {
  const instances = new Map();
  class DataLayerManager {
    constructor(scopeId = 'default') {
      this.scopeId = scopeId;
      this.sessionId = this.generateUUID();
      this.viewedElements = new Set();
      this.dataLayer = [];
      this.observer = null;
      this.initialized = false;
      this.eventHandlers = new Map();
      this.recommend_module = '';
      this.datas = [];
    }

    init() {
      if (this.initialized) return this;
      this.initialized = true;
      window.dataLayer = window.dataLayer || [];
     
      this.setupImpressionObserver();
      return this;
    }
    generateUUID() {
      return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
      );
    }
    setupEventListeners(element) {
      const clickHandler = (event) => {
        let target = event.target;
        while (target && target !== element) {
          console.log("target", target)
          if (target.tagName === 'A' ){
            this.handleProductLinkClick(target);
            break;
          }
          target = target.parentElement;
        }
      };
      this.eventHandlers.set(element, clickHandler);
      element.addEventListener('click', clickHandler);
    }
    hasValidDataLayerAttribute(element) {
      return element?.getAttribute('data-datalayer') === 'true' && 
             element?.getAttribute('data-scope-id') === this.scopeId;
    }

    handleProductLinkClick(linkElement) {
      if(!linkElement) {
        return false
      }
      const sku_code = linkElement.getAttribute('data-sku')
      const itemData = this.datas.find(item => 
        sku_code && sku_code == item.item_id
      );
        this.pushToDataLayer({
          event: 'select_item',
          request_id: this.sessionId,
          recommend_module: this.recommend_module,
          ecommerce: { 
            item_list_id: "recommended_product_click",
            items: itemData
          }
        });
    }

    setupImpressionObserver() {
      if (!('IntersectionObserver' in window)) return;
      if (this.observer) {
        this.observer.disconnect();
      }
      this.observer = new IntersectionObserver(
        entries => entries.forEach(entry => {
          const element = entry.target;
          if (entry.isIntersecting && 
              !this.viewedElements.has(element) && 
              this.hasValidDataLayerAttribute(element)) {
            this.viewedElements.add(element);
            const eventType = element.getAttribute('data-event-type');
            if (eventType === 'view_item_list') {
              this.handleItemListImpression(element);
              this.setupEventListeners(element);
            }
          }
        }),
        { threshold: 0.5 }
      );

      try {
        document.querySelectorAll(`[data-datalayer="true"][data-scope-id="${this.scopeId}"]`)
          .forEach(element => this.observer.observe(element));
      } catch (error) {
        console.error(`Error setting up impression observer for scope ${this.scopeId}:`, error);
      }
    }
    handleItemListImpression(listElement) {
      this.recommend_module = listElement.getAttribute('data-recommend-module') || 'default';
      const listName = listElement.getAttribute('data-list-name') || 'default_list';
      listElement.querySelectorAll('[data-datalayer-item="true"]')
        .forEach((item, index) => this.datas.push(this.extractItemData(item, index)));
      if (this.datas.length > 0) {
        this.pushToDataLayer({
          event: 'view_item_list',
          request_id: this.sessionId,
          rank_type: '',
          recommend_module: this.recommend_module,
          ecommerce: {
            item_list_id: listName,
            items: this.datas
          }
        });
      }
    }
    extractItemData(element, index) {
      try {
        return {
          item_id: element.getAttribute('data-sku') || element.getAttribute('data-product-id') || '',
          item_name: element.getAttribute('data-product-title') || '',
          index: index + 1,
        };
      } catch {
        return {};
      }
    }
    pushToDataLayer(data) {
      try {
        const scopedData = { 
          ...data, 
          scope_id: this.scopeId 
        };
        this.dataLayer.push(scopedData);
        if (window.dataLayer) {
          window.dataLayer.push(scopedData);
        }
      } catch (error) {
        console.error(`Error pushing to dataLayer for scope ${this.scopeId}:`, error);
      }
    }

    getDataLayer() {
      return this.dataLayer;
    }

    refresh() {
      this.setupImpressionObserver();
      return this;
    }
    destroy() {
      if (this.observer) {
        this.observer.disconnect();
      }
      this.eventHandlers.forEach((handler, element) => {
        if (element instanceof Element) {
          element.removeEventListener('click', handler);
        }
      });
      this.eventHandlers.clear();
      this.viewedElements.clear();
      this.dataLayer = [];
      this.initialized = false;
      instances.delete(this.scopeId);
    }
  }
  return {
    // Get instance by scope ID, create if not exists
    getInstance: function(scopeId = 'default') {
      if (!instances.has(scopeId)) {
        instances.set(scopeId, new DataLayerManager(scopeId));
      }
      return instances.get(scopeId);
    },
    // Get all instances
    getAllInstances: function() {
      return Array.from(instances.values());
    },
    
    // Remove instance by scope ID
    removeInstance: function(scopeId) {
      const instance = instances.get(scopeId);
      if (instance) {
        instance.destroy();
      }
    },
    
    // Remove all instances
    removeAllInstances: function() {
      instances.forEach(instance => instance.destroy());
    }
  };
})();

const getZipCode = (countryCode, value, callback) => {
  if (!value) return callback({ valid: false, message: 'ZIP Code is required', input: { country: countryCode, zip: value } });
  kkAjax.post('/zipcode/query', { countryCode, zipcode: value })
    .then(({ code, data }) => callback({
      valid: data.valid,
      lookup: data?.zipcodeDetails || { adminCode1: '', adminName1: '' },
      message: data?.msg || '',
      input: { country: countryCode, zip: value }
    }))
    .catch(error => callback({ valid: false, message: error.message, input: { country: countryCode, zip: value } }));
};
const getLocalZipCode = (callback) => {
    fetch(`https://ipinfo.io/json/?token=5eb142213a9cfb`)
    .then(res => res.json())
    .then(data => {
      console.log("data", data)
      if (data && data.country && (data.country == 'US' || data.country == 'us') && data.postal) {
        const localzip = (data.postal.length == 5) ? data.postal : '77380'
        callback(localzip)
        localStorage.setItem('customerZipCode', localzip)
      } else {
        callback('77380');
         localStorage.setItem('customerZipCode', '77380')
      }
    }).catch( err => {
       callback('77380');
        localStorage.setItem('customerZipCode', '77380')
    })
}
const throttleNew = (action, delay, context, iselapsed)=> {
  let timeout = null;
  let lastRun = 0;
  return function () {
    if (timeout) {
      if (iselapsed) {
        return;
      } else {
        clearTimeout(timeout);
        timeout = null;
      }
    }
    let elapsed = Date.now() - lastRun;
    let args = arguments;
    if (iselapsed && elapsed >= delay) {
      runCallback();
    } else {
      timeout = setTimeout(runCallback, delay);
    }
    /**
     * 执行回调
     */
    function runCallback() {
      lastRun = Date.now();
      timeout = false;
      action.apply(context, args);
    }
  }
}
const FbIsInViewPort = (element) => {
  const offset = element.getBoundingClientRect();
  const offsetTop = offset.top;
  const offsetBottom = offset.bottom;
  const offsetHeight = offset.height;
  const windowHeight = window.innerHeight;
  if ((offsetTop <= windowHeight && offsetTop >= 0) || (offsetBottom >= 0 && offsetBottom <= windowHeight) || (offsetTop <= 0 && offsetBottom >= windowHeight)) { 
    return true;
  } else {
    return false;
  }
}

const zkhFormatMoney = (cents, format = '') =>{
  if (typeof cents === 'string') {
    cents = cents.replace('.', '');
  }
  const placeholderRegex = /\{\{\s*(\w+)\s*\}\}/,
    formatString = format || window.themeVariables.settings.moneyFormat;
  function defaultTo(value2, defaultValue) {
    return value2 == null || value2 !== value2 ? defaultValue : value2;
  }
  function formatWithDelimiters(number, precision, thousands, decimal) {
    precision = defaultTo(precision, 2);
    thousands = defaultTo(thousands, ',');
    decimal = defaultTo(decimal, '.');
    if (isNaN(number) || number == null) {
      return 0;
    }
    number = (number / 100).toFixed(precision);
    let parts = number.split('.'),
      dollarsAmount = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1' + thousands),
      centsAmount = parts[1] ? decimal + parts[1] : '';
    return dollarsAmount + centsAmount;
  }
  let value = '';
  switch (formatString.match(placeholderRegex)[1]) {
    case 'amount':
      value = formatWithDelimiters(cents, 2);
      break;
    case 'amount_no_decimals':
      value = formatWithDelimiters(cents, 0);
      break;
    case 'amount_with_space_separator':
      value = formatWithDelimiters(cents, 2, ' ', '.');
      break;
    case 'amount_with_comma_separator':
      value = formatWithDelimiters(cents, 2, '.', ',');
      break;
    case 'amount_with_apostrophe_separator':
      value = formatWithDelimiters(cents, 2, "'", '.');
      break;
    case 'amount_no_decimals_with_comma_separator':
      value = formatWithDelimiters(cents, 0, '.', ',');
      break;
    case 'amount_no_decimals_with_space_separator':
      value = formatWithDelimiters(cents, 0, ' ');
      break;
    case 'amount_no_decimals_with_apostrophe_separator':
      value = formatWithDelimiters(cents, 0, "'");
      break;
  }
  if (formatString.indexOf('with_comma_separator') !== -1) {
    return formatString.replace(placeholderRegex, value);
  } else {
    return formatString.replace(placeholderRegex, value);
  }
}

window.zkh.updateZipCode = function(newZipCode) {
  window.zkh.customerZipCode = newZipCode;
  document.dispatchEvent(new CustomEvent('zipcode-updated', { detail: newZipCode }));
};
async function getDeliveryEstimate({
  zipCode,
  sku,
  quantity = 1,
  onLoadingChange = null,
  onError = null,
  onSuccess = null
}) {
  if (onLoadingChange) onLoadingChange(true);
  try {
    // Validate zip code
    const zipResult = await new Promise((resolve, reject) => {
      getZipCode('US', zipCode, function(result) {
        if (result?.valid) {
          resolve(result);
        } else {
          reject(new Error('Invalid ZIP code'));
        }
      });
    });

    const deliveryParam = {
      MATNR: sku,
      ZQTY: quantity,
      Z004: zipResult.lookup.adminName1,
      Z002: 'US',
      POST_CODE2: zipCode
    };
    if (deliveryParam.MATNR == 0) {
      throw new Error('Sold out');
    }
    const res = await kkAjax.post('/openapi/adlink/delivery-calculation', deliveryParam);
    res.availableInventoryCount = res.availableInventoryCount || 0;
    const result = {
      deliveryData: res,
      stockDateStart: null,
      stockDateEnd: null
    };

    if (res.transitInventoryDeliveryTimeStampMin) {
      result.stockDateStart = +res.transitInventoryDeliveryTimeStampMin;
    } else if (res.outOfStockDeliveryTimeStampMin) {
      result.stockDateStart = +res.outOfStockDeliveryTimeStampMin;
    }
    
    if (res.outOfStockDeliveryTimeStampMax) {
      result.stockDateEnd = +res.outOfStockDeliveryTimeStampMax;
    } else if (res.transitInventoryDeliveryTimeStampMax) {
      result.stockDateEnd = +res.transitInventoryDeliveryTimeStampMax;
    }
    localStorage.setItem('customerZipCode', zipCode);
    window.zkh.updateZipCode(zipCode);
    if (onSuccess) onSuccess(result);
    return result;
  } catch (error) {
    console.error('Error fetching delivery data:', error);
    if (onError) onError(error);
    throw error;
  } finally {
    if (onLoadingChange) onLoadingChange(false);
  }
}
