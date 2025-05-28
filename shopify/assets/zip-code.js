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