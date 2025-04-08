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