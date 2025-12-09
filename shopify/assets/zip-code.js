const currencySymbols = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CNY: '¥',
  AUD: '$',
  CAD: '$',
  CHF: 'CHF',
  NZD: '$',
  INR: '₹',
  RUB: '₽',
  KRW: '₩',
  SGD: '$',
  HKD: '$',
  SEK: 'kr',
  NOK: 'kr',
  TRY: '₺',
  MXN: '$',
  BRL: 'R$',
  ZAR: 'R',
}
class Ajax {
  constructor() {
    this.baseURL = window.northsky.api;
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
        reject(new Error('Network request failed. Please retry.'));
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
const generateUUID = () => {
  return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
}
const MsgBox = {
  timer1: null,
  timer2: null,
  _html: '',
  ishow: false,
  init: function (msg, time) {
    if (this.ishow) {
      return false
    }
    this.ishow = true
    if ($('#markt-hotal').length > 0) {
      $('#markt-hotal').remove()
    }
    this.GenerateHtml(msg, time)
  },
  GenerateHtml: function (msg, time) {
    this._html = `<div id="markt-hotal">
          <div class="markt-toast_box">
              <p id="market-toast">${msg}</p>
          </div>
      </div>`
    $("body").append(this._html);
    this.event(time)
  },
  event: function (time) {
    let _this = this
    $('.markt-toast_box').css({ display: 'inline-block' })
    _this.timer1 = setTimeout(function () {
      // $('.markt-toast_box').css({animation: 'markethide 1.5s'} )
      _this.timer2 = setTimeout(function () {
        $('.markt-toast_box').css({ display: 'none' })
        _this.ishow = false
        clearTimeout(_this.timer2)
        _this.timer1 && clearTimeout(_this.timer1)
      }, 1400)
    }, time)
  }
}
// DataLayer Manager Factory
const DataLayerManagerFactory = (function () {
  const instances = new Map();
  class DataLayerManager {
    constructor(scopeId = 'default') {
      this.scopeId = scopeId;
      this.sessionId = generateUUID();
      this.viewedElements = new Set();
      this.dataLayer = [];
      this.observer = null;
      this.initialized = false;
      this.eventHandlers = new Map();
      this.recommend_module = '';
      this.datas = [];
      this.currentData = [];
      this.currentPage = 1;
      this.listName = ''
    }
    init() {
      if (this.initialized) return this;
      this.initialized = true;
      window.dataLayer = window.dataLayer || [];

      this.setupImpressionObserver();
      return this;
    }
    getUUid() {
      return this.sessionId;
    }
    setupEventListeners(element) {
      const clickHandler = (event) => {
        let target = event.target;
        while (target && target !== element) {
          if (target.tagName === 'A') {
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
      if (!linkElement) {
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
          if (entry.isIntersecting && !this.viewedElements.has(element) && this.hasValidDataLayerAttribute(element)) {
            this.viewedElements.add(element);
            const eventType = element.getAttribute('data-event-type');
            if (eventType === 'view_item_list') {
              this.handleItemListImpression(element);
              this.setupEventListeners(element);
              this.setPageListeners(element);
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
    handleNumber() {
      const width = window.innerWidth;
      if (width >= 1280) {
        return 5;
      } else if (width >= 1024) {
        return 4;
      } else if (width >= 768) {
        return 3;
      } else {
        return 2;
      }
    }
    handleItemListImpression(listElement) {
      this.recommend_module = listElement.getAttribute('data-recommend-module') || 'default';
      this.listName = listElement.getAttribute('data-list-name') || 'default_list';
      const maxItems = this.handleNumber(); // maxmin
      const items = listElement.querySelectorAll('[data-datalayer-item="true"]');
      Array.from(items).forEach((item, index) => {
        this.datas.push(this.extractItemData(item, index));
      });
      if (this.recommend_module.indexOf('pdp') > -1) {
        this.currentData = this.datas;
      } else {
        this.currentData = this.datas.slice(0, maxItems);
      }
      if (this.datas.length > 0) {
        this.pushToDataLayer({
          event: 'view_item_list',
          request_id: this.sessionId,
          rank_type: '',
          recommend_module: this.recommend_module,
          ecommerce: {
            item_list_id: this.listName,
            items: this.currentData
          }
        });
      }
    }
    setPageListeners(listElement) {
      const swiperContainer = listElement.closest('.js-guesslike-gtm') || listElement.querySelector('.js-guesslike-gtm');
      if (!swiperContainer) return;
      const prevButton = swiperContainer.querySelector('.swiper-button-prev');
      const nextButton = swiperContainer.querySelector('.swiper-button-next');
      if (nextButton) {
        const nextHandler = () => {
          this.handleSwiperNext();
        };
        this.eventHandlers.set(nextButton, nextHandler);
        nextButton.addEventListener('click', nextHandler);
      }
      if (prevButton) {
        const prevHandler = () => {
          this.handleSwiperPrev();
        };
        this.eventHandlers.set(prevButton, prevHandler);
        prevButton.addEventListener('click', prevHandler);
      }
    }
    handleSwiperNext() {
      const maxItems = this.handleNumber();
      const startIndex = this.currentPage * maxItems;
      const endIndex = startIndex + maxItems;
      if (startIndex < this.datas.length) {
        this.currentPage++;
        const newData = this.datas.slice(startIndex, endIndex);
        if (newData.length > 0) {
          this.pushToDataLayer({
            event: 'view_item_list',
            request_id: this.sessionId,
            rank_type: '',
            recommend_module: this.recommend_module,
            ecommerce: {
              item_list_id: this.listName,
              items: newData
            }
          });
        }
      }
    }
    handleSwiperPrev() {
      if (this.currentPage > 1) {
        this.currentPage--;
        const maxItems = this.handleNumber();
        const startIndex = (this.currentPage - 1) * maxItems;
        const endIndex = startIndex + maxItems;
        const prevData = this.datas.slice(startIndex, endIndex);
        if (prevData.length > 0) {
          this.pushToDataLayer({
            event: 'view_item_list',
            request_id: this.sessionId,
            rank_type: '',
            recommend_module: this.recommend_module,
            ecommerce: {
              item_list_id: this.listName,
              items: prevData
            }
          });
        }
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
    getInstance: function (scopeId = 'default') {
      if (!instances.has(scopeId)) {
        instances.set(scopeId, new DataLayerManager(scopeId));
      }
      return instances.get(scopeId);
    },
    // Get all instances
    getAllInstances: function () {
      return Array.from(instances.values());
    },

    // Remove instance by scope ID
    removeInstance: function (scopeId) {
      const instance = instances.get(scopeId);
      if (instance) {
        instance.destroy();
      }
    },
    // Remove all instances
    removeAllInstances: function () {
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
      if (data && data.country && (data.country == 'US' || data.country == 'us') && data.postal) {
        const localzip = (data.postal.length == 5) ? data.postal : '77380'
        callback(localzip)
        localStorage.setItem('customerZipCode', localzip)
      } else {
        callback('77380');
        localStorage.setItem('customerZipCode', '77380')
      }
    }).catch(err => {
      callback('77380');
      localStorage.setItem('customerZipCode', '77380')
    })
}
const throttleNew = (action, delay, context, iselapsed) => {
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
const zkhFormatMoney = (cents, format = '') => {
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
const skyFormatPriceDisplay = (price) => {
  const numPrice = parseFloat(price);
  if (isNaN(numPrice)) {
    return '<div class="relative h-8 inline-flex items-center justify-center text-main"><span class="font-bold px-3">0</span></div>';
  }
  const priceStr = numPrice.toFixed(2);
  const parts = priceStr.split('.');
  const dollars = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1,');
  const cents = parts[1];
  return `<div class="relative h-5 inline-flex items-center justify-center text-main">
    <span class="absolute top-0 left-0 text-12 font-bold">${window.northsky.currencySymbol}</span>
    <span class="font-bold px-2.5">${dollars}</span>
    <span class="absolute top-0 -right-2 text-12 font-bold">${cents}</span>
  </div>`;
}
const northSkyformatDate = (timestamp) => {
  const date = new Date(+timestamp);
  const year = date.getFullYear();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const month = monthNames[date.getMonth()];
  const day = date.getDate();
  let suffix = '';
  if (day >= 11 && day <= 13) {
    suffix = 'th';
  } else {
    switch (day % 10) {
      case 1: suffix = 'st'; break; // 1, 21, 31
      case 2: suffix = 'nd'; break; // 2, 22
      case 3: suffix = 'rd'; break; // 3, 23
      default: suffix = 'th'; break;
    }
  }
  return `${month} ${day}${suffix}, ${year}`;
}
window.northsky.updateZipCode = function (newZipCode) {
  window.northsky.customerZipCode = newZipCode;
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
    if (!zipCode || !zipCode.trim()) {
      throw new Error('ZIP Code is required');
    }
    if (zipCode.length !== 5) {
      throw new Error('Zip code must be 5 digits');
    }
    if (!sku) {
      throw new Error('SKU is required');
    }
    const zipResult = await new Promise((resolve, reject) => {
      getZipCode('US', zipCode, function (result) {
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
    window.northsky.updateZipCode(zipCode);
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
const mainProductUtils = {
  calculateTieredPrice: function (discountTiers, basePrice, quantity, type) {
    if (!Array.isArray(discountTiers) || discountTiers.length === 0) {
      const finalPrice = basePrice * quantity;
      return type === 'price1' ? skyFormatPriceDisplay(finalPrice) : zkhFormatMoney(finalPrice * 100);
    }
    const numericPrice = parseFloat(basePrice);
    const numericQuantity = parseInt(quantity);
    if (isNaN(numericPrice) || isNaN(numericQuantity) || numericQuantity <= 0) {
      return type === 'price1' ? skyFormatPriceDisplay(numericPrice || 0) : zkhFormatMoney((numericPrice || 0) * 100);
    }
    // 预处理和缓存有效的阶梯配置
    const validTiers = [];
    for (const tier of discountTiers) {
      const moq = parseInt(tier.moq);
      const discount = parseFloat(tier.discount);
      if (moq > 0 && discount > 0) {
        validTiers.push({ moq, discount });
      }
    }

    if (validTiers.length === 0) {
      const finalPrice = numericPrice * numericQuantity;
      return type === 'price1' ? skyFormatPriceDisplay(finalPrice) : zkhFormatMoney(finalPrice * 100);
    }
    // 按照 moq 从大到小排序
    validTiers.sort((a, b) => b.moq - a.moq);
    // 找到适用的折扣级别
    let finalPrice;
    let foundTier = false;
    for (const tier of validTiers) {
      if (numericQuantity >= tier.moq) {
        finalPrice = Math.round(tier.discount * numericQuantity * 100) / 100;
        foundTier = true;
        break;
      }
    }
    if (!foundTier) {
      finalPrice = numericPrice * numericQuantity;
    }
    return type === 'price1' ? skyFormatPriceDisplay(finalPrice) : zkhFormatMoney(finalPrice * 100);
  },

  computePrice: function (discountJson, basePrice, quantity, type) {
    return this.calculateTieredPrice(discountJson, basePrice, quantity, type);
  },
  computeJietiPrice: function (discountJson, basePrice, quantity, type) {
    let unitPrice = basePrice;
    if (discountJson && Array.isArray(discountJson) && discountJson.length > 0) {
      try {
        const sortedTiers = [...discountJson].sort((a, b) => parseInt(a.moq) - parseInt(b.moq));
        let applicableDiscount = null;
        for (const tier of sortedTiers) {
          const moq = parseInt(tier.moq);
          const discount = parseFloat(tier.discount);
          if (!isNaN(moq) && !isNaN(discount) && quantity >= moq) {
            applicableDiscount = discount;
          }
        }
        if (applicableDiscount !== null) {
          unitPrice = Math.round(applicableDiscount * 100) / 100;
        }
      } catch (error) {
        console.error('Error in computeJietiPrice:', error);
      }
    }
    if (type === 'price1') {
      return skyFormatPriceDisplay(unitPrice);
    } else {
      return zkhFormatMoney(unitPrice * 100);
    }
  },
  validateQuantity: function (inputValue, moq, mpq, maxQuantity = 1000000) {
    let newQuantity = parseInt(inputValue);
    if (isNaN(newQuantity) || newQuantity <= 0 || inputValue === '') {
      return moq;
    }
    if (newQuantity < moq) {
      return moq;
    }
    if (newQuantity > maxQuantity) {
      return maxQuantity;
    }
    const exceededMoq = newQuantity - moq;
    const remainder = exceededMoq % mpq;
    if (remainder !== 0) {
      return moq + (Math.ceil(exceededMoq / mpq) * mpq);
    }
    return newQuantity;
  },
  getCart: async function () {
    try {
      const response = await fetch('/cart.js');
      return await response.json();
    } catch (error) {
      console.error('Error getting cart data:', error);
      return { items: [] };
    }
  },
  throttle: function (func, wait, context, immediate) {
    let timeout;
    let args;
    let result;
    let previous = 0;

    const later = function () {
      previous = immediate === false ? 0 : Date.now();
      timeout = null;
      result = func.apply(context, args);
      if (!timeout) args = null;
    };

    return function () {
      const now = Date.now();
      const remaining = wait - (now - previous);
      args = arguments;

      if (remaining <= 0 || remaining > wait) {
        if (timeout) {
          clearTimeout(timeout);
          timeout = null;
        }
        previous = now;
        result = func.apply(context, args);
        if (!timeout) args = null;
      } else if (!timeout && immediate !== true) {
        timeout = setTimeout(later, remaining);
      }

      return result;
    };
  },
  formateDiscountJson: function (dom) {
    let discountJson = $(dom).data('discount') || null
    let newDiscountJson = []
    if (discountJson && discountJson.length > 0) {
      discountJson = discountJson.replace(/'/g, '"');
      try {
        newDiscountJson = JSON.parse(discountJson);
        return newDiscountJson;
      } catch (e) {
        console.error('Parsing error:', e);
      }
    }
    return newDiscountJson;
  },
  checkElementDisplay: function (selector, maxDuration = 10000, callback) {
    const startTime = Date.now();
    const intervalId = setInterval(() => {
      const element = document.querySelector(selector);
      if (element) {
        const height = element.offsetHeight;
        if (height > 120) {
          clearInterval(intervalId);
          callback && callback(true);
          return true;
        }
      }
      if (Date.now() - startTime >= maxDuration) {
        clearInterval(intervalId);
        callback && callback(false);
        return false;
      }
    }, 200);
    return intervalId;
  }
};
const cartFormModule = {
  maxQuantity: 1000000,
  async handleAddToCart(result) {
    try {
      let errorMsg = '';
      if (result.success) {
        document.documentElement.dispatchEvent(
          new CustomEvent('variant:added', {
            bubbles: true,
            detail: {
              variant: result.data.hasOwnProperty('items') ? result.data['items'][0] : result.data,
            },
          })
        );
        const cartResponse = await fetch(`${window.themeVariables.routes.cartUrl}.js`);
        const cartContent = await cartResponse.json();
        document.documentElement.dispatchEvent(
          new CustomEvent('cart:updated', {
            bubbles: true,
            detail: {
              cart: cartContent,
            },
          })
        );
        cartContent['sections'] = result.data['sections'];
        document.documentElement.dispatchEvent(
          new CustomEvent('cart:refresh', {
            bubbles: true,
            detail: {
              cart: cartContent,
              openMiniCart: true,
            },
          })
        );
      } else {
        const description = result.data?.description || '';
        if (description.endsWith('are in your cart.')) {
          errorMsg = 'Your cart already contains all available stock. Unable to add more';
        } else if (description.endsWith('to the cart.')) {
          errorMsg = 'The available stock has been added to your cart. The excess quantity beyond available stock cannot be added';
        }
        document.documentElement.dispatchEvent(
          new CustomEvent('cart-notification:show', {
            bubbles: true,
            cancelable: true,
            detail: {
              status: result.success ? 'success' : 'error',
              error: errorMsg || result.data?.description || '',
            },
          })
        );
      }
    } catch (error) {
      console.error('Failed to add to cart:', error);
      document.documentElement.dispatchEvent(
        new CustomEvent('cart-notification:show', {
          bubbles: true,
          cancelable: true,
          detail: {
            status: 'error',
            error: 'Failed to add to cart, please try again later',
          },
        })
      );
    }
  },
  async addToCart(query, callback) {
    try {
      const variantId = query.variantId;
      const formData = {
        items: [{ id: variantId, quantity: query.quantity }],
      };
      const cart = await mainProductUtils.getCart();
      if (cart.items.length > 0) {
        const existingItem = cart.items.find((item) => item.id == variantId);
        if (existingItem) {
          formData.items[0].properties = existingItem.properties;
          // const totalQuantity = parseFloat(existingItem.quantity) + parseFloat(query.quantity);
          // if (totalQuantity > parseFloat(cartFormModule.maxQuantity)) {
          //   this.handleAddToCart({ success: false, data: {description: 'Only 1000000 items were added to your cart due to availability.' } });
          //   return false;
          // }
        }
      }

      const response = await fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const resultObj = {
        success: response.ok,
        data: await response.json(),
        status: response.status,
      };
      this.handleAddToCart(resultObj);
    } catch (error) {
      console.error('Error adding to cart:', error);
      this.handleAddToCart({ success: false, data: { description: error } });
    } finally {
      callback && callback();
    }
  },
  validateQuantityInput: function ($input, info, callback) {
    if (!info) return;
    const inputValue = $input.val();
    const moq = info.moq || 1;
    const mpq = info.mpq || 1;
    const maxQuantity = this.maxQuantity;
    const newQuantity = mainProductUtils.validateQuantity(inputValue, moq, mpq, maxQuantity);
    $input.val(newQuantity);
    if (typeof callback === 'function') {
      callback(newQuantity);
    }
  }
};
const QuantityUtils = {
  /**
   * Increase quantity
   * @param {Object} config - Configuration object
   * @param {jQuery} config.$input - Input element
   * @param {jQuery} config.$plusBtn - Plus button element
   * @param {jQuery} config.$minusBtn - Minus button element
   * @param {Object} config.productInfo - Product information
   * @param {Function} config.onQuantityChange - Quantity change callback
   * @returns {number} New quantity value
   */
  increaseQuantity: function (config) {
    const { $input, $plusBtn, $minusBtn, productInfo, onQuantityChange } = config;
    if (!productInfo) return;
    const currentValue = parseInt($input.val());
    const moq = productInfo.moq || 1;
    const mpq = productInfo.mpq || 1;
    const maxQuantity = cartFormModule.maxQuantity;
    let newValue;
    if (currentValue < moq) {
      newValue = moq;
    } else {
      newValue = currentValue + mpq;
    }
    if (newValue > maxQuantity) {
      newValue = maxQuantity;
      $plusBtn.prop('disabled', true);
    } else {
      $plusBtn.prop('disabled', false);
    }
    $input.val(newValue);
    $minusBtn.prop('disabled', false);
    if (onQuantityChange) {
      onQuantityChange(newValue);
    }
    return newValue;
  },

  /**
   * Decrease quantity
   * @param {Object} config - Configuration object
   * @param {jQuery} config.$input - Input element
   * @param {jQuery} config.$plusBtn - Plus button element
   * @param {jQuery} config.$minusBtn - Minus button element
   * @param {Object} config.productInfo - Product information
   * @param {Function} config.onQuantityChange - Quantity change callback
   * @returns {number} New quantity value
   */
  decreaseQuantity: function (config) {
    const { $input, $plusBtn, $minusBtn, productInfo, onQuantityChange } = config;
    if (!productInfo) return;
    const currentValue = parseInt($input.val());
    const moq = productInfo.moq || 1;
    const mpq = productInfo.mpq || 1;
    let newValue;
    if (currentValue <= moq) {
      newValue = moq;
      $minusBtn.prop('disabled', true);
    } else {
      newValue = currentValue - mpq;
      if (newValue < moq) {
        newValue = moq;
        $minusBtn.prop('disabled', true);
      } else {
        $minusBtn.prop('disabled', false);
      }
    }
    $input.val(newValue);
    $plusBtn.prop('disabled', false);
    if (onQuantityChange) {
      onQuantityChange(newValue);
    }
    return newValue;
  },
  /**
   * Calculate total price
   * @param {Object} productInfo - Product information
   * @param {number} quantity - Quantity
   * @returns {string} Formatted price
   */
  calculateTotalPrice: function (productInfo, quantity, type = '') {
    const discountJson = productInfo.discountJson || null;
    return mainProductUtils.computePrice(discountJson, productInfo.price, quantity, type);
  },
  calculateJietiPrice: function (productInfo, quantity, type = '') {
    const discountJson = productInfo.discountJson || null;
    return mainProductUtils.computeJietiPrice(discountJson, productInfo.price, quantity, type);
  },
  /**
   * Bind quantity input change event
   * @param {Object} config - Configuration object
   * @param {jQuery} config.$input - Input element
   * @param {jQuery} config.$plusBtn - Plus button element
   * @param {jQuery} config.$minusBtn - Minus button element
   * @param {Object} config.productInfo - Product information
   * @param {Function} config.onQuantityChange - Quantity change callback
   */
  bindInputChangeEvent: function (config) {
    const { $input, $plusBtn, $minusBtn, productInfo, onQuantityChange } = config;
    $input.on('change', function () {
      cartFormModule.validateQuantityInput($(this), productInfo, function (newQuantity) {
        $minusBtn.prop('disabled', newQuantity <= productInfo.moq);
        $plusBtn.prop('disabled', newQuantity >= cartFormModule.maxQuantity);
        if (onQuantityChange) {
          onQuantityChange(newQuantity);
        }
      });
    });
  }
};

const skyLoginOut = () => {
  Cookies.remove('cart');
  // localStorage.clear();
  // sessionStorage.clear();
  const timestamp = new Date().getTime();
  if (window.themeVariables.userCompany.isB2b == 'true') {
    Cookies.set('logout', 1);
    window.location.replace(`${window.northsky.b2b_url}/logout?t=${timestamp}`);
  } else {
    window.location.replace(`/account/logout?t=${timestamp}`);
  }
}
