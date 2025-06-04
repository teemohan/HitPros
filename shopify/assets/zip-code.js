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

// 优化的懒加载指令
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
        // Use requestAnimationFrame to optimize rendering performance
        requestAnimationFrame(() => {
          el.classList.add('loaded');
        });
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
(function() {
  // Create placeholder image
  const placeholder = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
  
  // Store all lazy loading image elements
  let lazyImages = [];
  
  // Store IntersectionObserver instance
  let observer = null;
  
  /**
   * Load image
   * @param {HTMLImageElement} img - Image element
   */
  function loadImage(img) {
    const src = img.dataset.src;
    if (!src) return;
    
    // Preload with new image object
    const imgLoader = new Image();
    imgLoader.onload = function() {
      img.src = src;
      // Use requestAnimationFrame to optimize rendering performance
      requestAnimationFrame(function() {
        img.classList.add('loaded');
        img.removeAttribute('data-src'); // Clean up data attribute
      });
    };
    
    imgLoader.onerror = function() {
      console.log('Image loading failed:', src);
      img.src = placeholder;
    };
    
    imgLoader.src = src;
  }
  
  /**
   * Handle IntersectionObserver callback
   * @param {IntersectionObserverEntry[]} entries - Observer entries
   * @param {IntersectionObserver} observer - Observer instance
   */
  function handleIntersect(entries, observer) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        const img = entry.target;
        
        // Use requestIdleCallback to load images during browser idle time
        if ('requestIdleCallback' in window) {
          requestIdleCallback(function() {
            loadImage(img);
          }, { timeout: 2000 });
        } else {
          loadImage(img);
        }
        
        // Stop observing loaded images
        observer.unobserve(img);
        
        // Remove from lazy loading array
        lazyImages = lazyImages.filter(function(lazyImg) {
          return lazyImg !== img;
        });
      }
    });
  }
  
  /**
   * Create IntersectionObserver
   */
  function createObserver() {
    const options = {
      root: null, // Use viewport as root
      rootMargin: '100px 0px', // Start loading 100px ahead
      threshold: 0.1 // Trigger when 10% of image enters viewport
    };
    
    // 如果已经存在观察者，则不重新创建
    if (!observer) {
      observer = new IntersectionObserver(handleIntersect, options);
    }
    
    // Start observing all lazy loading images
    lazyImages.forEach(function(img) {
      observer.observe(img);
    });
  }
  
  /**
   * Fallback: Handle lazy loading with scroll events
   */
  function lazyLoadFallback() {
    let active = false;
    
    function lazyLoad() {
      if (active === false) {
        active = true;
        
        setTimeout(function() {
          lazyImages.forEach(function(img) {
            if ((img.getBoundingClientRect().top <= window.innerHeight && 
                img.getBoundingClientRect().bottom >= 0) && 
                getComputedStyle(img).display !== 'none') {
              
              loadImage(img);
              
              // Remove from lazy loading array
              lazyImages = lazyImages.filter(function(lazyImg) {
                return lazyImg !== img;
              });
              
              // Remove event listeners if all images are loaded
              if (lazyImages.length === 0) {
                document.removeEventListener('scroll', lazyLoad);
                window.removeEventListener('resize', lazyLoad);
                window.removeEventListener('orientationchange', lazyLoad);
              }
            }
          });
          
          active = false;
        }, 200);
      }
    }
    
    // Add event listeners
    document.addEventListener('scroll', lazyLoad);
    window.addEventListener('resize', lazyLoad);
    window.addEventListener('orientationchange', lazyLoad);
    
    // Initial check
    lazyLoad();
  }
  
  /**
   * Initialize lazy loading
   * @param {string} selector - Selector, defaults to '.js-lazy-image'
   * @param {HTMLElement} container - Optional container to search within, defaults to document
   */
  function initLazyLoad(selector, container) {
    selector = selector || '.js-lazy-image';
    container = container || document;
    
    // Get all lazy loading images
    const newImages = Array.from(container.querySelectorAll(selector + '[data-src]'));
    
    // Filter out already processed images
    const unprocessedImages = newImages.filter(img => {
      return !lazyImages.includes(img) && !img.classList.contains('loaded');
    });
    
    // Set placeholder image for new images
    unprocessedImages.forEach(function(img) {
      img.src = placeholder;
    });
    
    // Add new images to the tracking array
    lazyImages = [...lazyImages, ...unprocessedImages];
    
    // Return if no images found
    if (lazyImages.length === 0) return;
    
    // Check IntersectionObserver support
    if ('IntersectionObserver' in window) {
      createObserver();
    } else {
      // Fallback to scroll events
      lazyLoadFallback();
    }
  }
  
  /**
   * Observe DOM changes to detect dynamically added images
   */
  function observeDOMChanges() {
    if (!('MutationObserver' in window)) return;
    
    const observer = new MutationObserver(function(mutations) {
      let shouldRefresh = false;
      
      mutations.forEach(function(mutation) {
        // Check for added nodes
        if (mutation.addedNodes && mutation.addedNodes.length > 0) {
          shouldRefresh = true;
        }
      });
      
      if (shouldRefresh) {
        // Reinitialize lazy loading for the whole document
        initLazyLoad();
      }
    });
    
    // Start observing the document for DOM changes
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  window.refreshLazyLoad = function(selector, container) {
    initLazyLoad(selector, container);
  };

  // Auto initialize when DOM is ready
  document.addEventListener('DOMContentLoaded', function() {
    initLazyLoad();
    observeDOMChanges();
  });
})();

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
          item_list_id: "recommended_product_click",
          recommend_module: this.recommend_module,
          ecommerce: { 
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

