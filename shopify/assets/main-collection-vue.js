// 添加节流函数，优化频繁触发的事件
function throttle(fn, delay) {
  let lastCall = 0;
  return function(...args) {
    const now = new Date().getTime();
    if (now - lastCall < delay) return;
    lastCall = now;
    return fn.apply(this, args);
  };
}

// 添加防抖函数，优化输入和搜索等操作
function debounce(fn, delay) {
  let timer = null;
  return function(...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}
new Vue({
  delimiters: ['[[', ']]'],
  el: '#zkh-collection-list',
  data() {
    return {
      // 数据状态
      spuData: [],
      categories: [],
      brands: [],
      wishlist: [],
      page: 1,
      hasMore: false,
      isLoading: false,
      // 配置
      config: {
        apiBaseUrl: `${window.zkh?.api || ''}/openapi/adlink/product`,
        spuPageSize: 10,
        mobileThreshold: 741
      },
      
      // DOM相关数据
      collectionData: {
        handle: '',
        title: '',
        productCount: 0
      },
      observer: null,
      paginationInstances: [],
      skuPageSize: 6, // 每页显示6个SKU
      currentSkuPages: {}, // 记录每个SPU的当前页码 {spuId: page}
      brandExtra: [],
      // 添加缓存对象
      cache: {
        processedTitle: null,
        isMobile: null,
        wishlistMap: new Map() // 使用Map优化心愿单查找
      }
    }
  },
  computed: {
    // 处理后的品牌数据
    isMobile() {
      // 缓存计算结果，避免频繁计算
      if (this.cache.isMobile === null) {
        const width = document.documentElement.clientWidth || document.body.clientWidth;
        this.cache.isMobile = width < this.config.mobileThreshold;
      }
      return this.cache.isMobile;
    },
    sortedBrands() {
      return [...this.brands].sort((a, b) => b.count - a.count);
    },
    // 处理后的分类标题
    processedTitle() {
      // 缓存计算结果
      if (this.cache.processedTitle === null && this.collectionData.title) {
        const parts = this.collectionData.title.split('~');
        this.cache.processedTitle = parts[parts.length - 1].trim();
      }
      return this.cache.processedTitle || '';
    },
    paginatedSpuData() {
      return this.spuData.map(spu => {
        const currentPage = this.currentSkuPages[spu.spu] || 1;
        const start = (currentPage - 1) * this.skuPageSize;
        const end = start + this.skuPageSize;
        return {
          ...spu,
          paginatedSkus: spu.skus.slice(start, end),
          totalSkus: spu.skus.length,
          totalPages: Math.ceil(spu.skus.length / this.skuPageSize)
        };
      });
    }
  },
  created() {
    this.initCollectionData();
    this.loadInitialData();
    this.renderFacet();
    
    // 使用节流函数优化窗口大小变化事件
    this._throttledResize = throttle(() => {
      // 重置缓存
      this.cache.isMobile = null;
    }, 200);
  },
  mounted() {
    if (!this.observer) {
      this.$nextTick(() => {
        this.initIntersectionObserver();
        window.addEventListener('resize', this._throttledResize);
      });
    }
  },
  destroyed() {
    if (this.observer) {
      this.observer.disconnect();
    }
    window.removeEventListener('resize', this._throttledResize);
  },
  methods: {
    // 获取分页后的SKU数据
    getPaginatedSkus(spuId) {
      const spu = this.spuData.find(item => item.spu === spuId);
      if (!spu) return [];
      
      const currentPage = this.currentSkuPages[spuId] || 1;
      const start = (currentPage - 1) * this.skuPageSize;
      const end = start + this.skuPageSize;
      
      return spu.skus.slice(start, end);
    },
    
    handleSkuPageChange(spuId, page) {
      this.$set(this.currentSkuPages, spuId, page);
    },
    
    initCollectionData() {
      const el = document.getElementById('keep-collection-style');
      if (el) {
        this.collectionData = {
          handle: el.dataset.handle || '',
          title: el.dataset.title || '',
          productCount: parseInt(el.dataset.productCount) || 0
        };
      }
    },
    
    async loadMore() {
      if (this.isLoading) return;
      
      try {
        await this.fetchSpuList();
      } catch (error) {
        console.error('lade more:', error);
      }
    },
    
    initIntersectionObserver() {
      // 如果已有观察器，先断开
      if (this.observer) {
        this.observer.disconnect();
      }
      const target = document.getElementById('keep-collection-style');
      if (!target) return;
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !this.isLoading && this.hasMore) {
            this.loadMore();
          }
        });
      }, {
        rootMargin: '200px 0px', // 提前200px触发加载更多
        threshold: 0.1
      });
      
      this.observer.observe(target);
    },
    
    // 加载初始数据
    async loadInitialData() {
      try {
        await this.fetchWishlist();
        
        if (document.documentElement.clientWidth > this.config.mobileThreshold) {
          await Promise.all([
            this.fetchSpuList(),
            this.fetchCategories()
          ]);
        } else {
          await this.fetchCategories();
          if (this.categories.length === 0) {
            await this.fetchSpuList();
            const menudata = document.querySelector('.collecition-menu');
            if (menudata) {
              menudata.style.display = 'flex';
            }
          }
        }
      } catch (error) {
        console.error('Initial data loading failed:', error);
      } finally {
        const el = document.querySelector('.product-facet__product-list-wrapper');
        if (el) {
          el.classList.remove('zkh-collection-block');
        }
      }
    },
    
    // 获取分类数据
    async fetchCategories() {
      try {
        const title = this.processedTitle;
        const url = `${this.config.apiBaseUrl}/collection/collection?c1=${encodeURIComponent(title)}&order=1`;
        
        // 使用AbortController优化请求
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时
        
        const response = await fetch(url, {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        const result = await response.json();
        if (result.code === 200 && result.data && result.data.length > 0) {
          // Transform category data and generate URL-friendly names
          this.categories = result.data || [];
          this.creatCategoryList();
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Failed to fetch categories:', error);
        }
      }
    },
    
    // 获取心愿单
    async fetchWishlist() {
      if (!window.zkh?.customerId) return;
      
      try {
        const response = await fetch(`${window.zkh.api}/wish/list`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            page: 1,
            pageSize: 1000,
            customerId: window.zkh.customerId
          })
        });
        
        const result = await response.json();
        if (result.code === 200 && result.data?.list) {
          this.wishlist = result.data.list;
          
          // 创建心愿单Map以优化查找
          this.cache.wishlistMap.clear();
          this.wishlist.forEach(item => {
            this.cache.wishlistMap.set(item.variantId, true);
          });
        }
      } catch (error) {
        console.error('Failed to fetch wishlist:', error);
      }
    },
    
    async getCart() {
      try {
        const response = await fetch('/cart.js');
        return await response.json();
      } catch (error) {
        console.error('Error getting cart data:', error);
        return { items: [] };
      }
    },
    
    showaddLoading(itemindex, libindex, bol) {
      if (this.spuData[itemindex]?.skus[libindex]) {
        const sku = this.spuData[itemindex].skus[libindex];
        this.$set(this.spuData[itemindex].skus[libindex], 'selected', bol);
      }
    },
    
    // 添加到购物车 - 保持原有功能不变
    async addToCart(variantId, quantity, itemindex, libindex) {
      try {
        this.showaddLoading(itemindex, libindex, true);
        const formData = {
          items: [{ id: variantId, quantity }],
        };
        // Set product properties
        const cart = await this.getCart();
        if (cart.items.length > 0) {
          const existingItem = cart.items.find((item) => item.id == variantId);
          if (existingItem) {
            formData.items[0].properties = existingItem.properties;
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
        this.handleAddToCart({ success: false, error });
      } finally {
        this.showaddLoading(itemindex, libindex, false);
      }
    },
    
    // 处理添加到购物车结果 - 保持原有功能不变
    async handleAddToCart(result) {
      try {
        let errorMsg = '';
        if (result.success) {
          // Trigger product added event
          document.documentElement.dispatchEvent(
            new CustomEvent('variant:added', {
              bubbles: true,
              detail: {
                variant: result.data.hasOwnProperty('items') ? result.data['items'][0] : result.data,
              },
            })
          );
          // Update cart
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
          // Handle error messages
          const description = result.data?.description || '';
          if (description.endsWith('are in your cart.')) {
            errorMsg = 'Your cart already contains all available stock. Unable to add more';
          } else if (description.endsWith('to the cart.')) {
            errorMsg = 'The available stock has been added to your cart. The excess quantity beyond available stock cannot be added';
          }
        }
        // Show notification
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
      } catch (error) {
        console.error('Failed to add to cart:', error);
        // Show error notification
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
    
    // 优化SPU列表获取方法
    async fetchSpuList() {
      if (this.isLoading) return;
      
      try {
        this.isLoading = true;
        const urlbrand = this.selectedBrands();
        const params = {
          pageNo: this.page,
          pageSize: this.config.spuPageSize,
          ...this.getPriceFilterParams(),
          brand: urlbrand.join(',')
        };
        
        let url = `${this.config.apiBaseUrl}/collection/pagespu`;
        if (this.collectionData.handle !== 'all') {
          params.c1 = encodeURIComponent(this.processedTitle);
        }
        
        // 使用AbortController优化请求
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15秒超时
        
        const response = await fetch(`${url}?${new URLSearchParams(params)}`, {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        const result = await response.json();
        if (result.code === 200) {
          // 优化数据处理，使用Map提高查找效率
          const changelist = result.data.list && result.data.list.map(item => ({
            ...item,
            skus: item.skus.map(sku => ({
              ...sku,
              price: sku.price.toFixed(2),
              quantity: 1,
              selected: false,
              isWish: this.cache.wishlistMap.has(sku.variantId)
            }))
          }));
          
          if (this.page === 1) {
            this.creatBrandList(result.data.extra || []);
          }
          
          this.spuData = [...this.spuData, ...(changelist || [])];
          this.hasMore = parseInt(result.data.total) > (this.spuData.length);
          this.page++;
        } else {
          document.documentElement.dispatchEvent(
            new CustomEvent('cart-notification:show', {
              bubbles: true,
              cancelable: true,
              detail: {
                status: 'error',
                error: result.msg || 'Please refresh and try again.'
              },
            })
          );
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Failed to fetch SPU list:', error);
          throw error; // 抛出错误以便loadMore方法捕获
        }
      } finally {
        this.isLoading = false;
      }
    },
    
    // 获取价格筛选参数
    getPriceFilterParams() {
      const params = new URLSearchParams(window.location.search);
      return {
        highPrice: params.get('filter.v.price.lte') || '',
        lowPrice: params.get('filter.v.price.gte') || ''
      };
    },
    
    // 处理品牌筛选
    handleBrandFilter(event) {
      const brand = event.target.value;
      const url = new URL(window.location.href);
      const params = new URLSearchParams(url.search);
      
      if (event.target.checked) {
        params.append('filter.p.m.product.brand', brand);
      } else {
        const brands = params.getAll('filter.p.m.product.brand');
        params.delete('filter.p.m.product.brand');
        brands.filter(b => b !== brand).forEach(b => params.append('filter.p.m.product.brand', b));
      }
      
      url.search = params.toString();
      window.location.href = url.toString();
    },
    
    async toggleFavorite(lib, itemindex, libindex) {
      if (!window.zkh?.customerId) {
        window.location.href = '/account/login';
        return false;
      }
      
      try {
        const action = lib.isWish ? 'clear' : 'save';
        const response = await fetch(`${window.zkh.api}/wish/${action}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: lib.productId,
            sku: lib.skuCode,
            customerId: window.zkh?.customerId,
            productNum: 1,
          })
        });
        
        const result = await response.json();
        if (result.code === 200) {
          this.changeWishStatus(itemindex, libindex);
          document.dispatchEvent(new CustomEvent('wish-refreash'));
        }
        return false;
      } catch (error) {
        console.error('Toggle favorite failed:', error);
        return false;
      }
    },
    
    changeWishStatus(itemindex, libindex) {
      if (this.spuData[itemindex]?.skus[libindex]) {
        const sku = this.spuData[itemindex].skus[libindex];
        this.$set(this.spuData[itemindex].skus[libindex], 'isWish', !sku.isWish);
        
        // 更新缓存的心愿单Map
        if (!sku.isWish) {
          this.cache.wishlistMap.set(sku.variantId, true);
        } else {
          this.cache.wishlistMap.delete(sku.variantId);
        }
      }
    },
    
    incrementQuantity(itemindex, libindex) {
      if (this.spuData[itemindex]?.skus[libindex]) {
        const sku = this.spuData[itemindex].skus[libindex];
        if (sku.quantity < 1000000) {
          this.$set(this.spuData[itemindex].skus[libindex], 'quantity', sku.quantity + 1);
        }
      }
    },
    
    decrementQuantity(itemindex, libindex) {
      if (this.spuData[itemindex]?.skus[libindex]) {
        const sku = this.spuData[itemindex].skus[libindex];
        if (sku.quantity > 1) {
          this.$set(this.spuData[itemindex].skus[libindex], 'quantity', sku.quantity - 1);
        }
      }
    },
    
    validateQuantity(itemindex, libindex) {
      if (this.spuData[itemindex]?.skus[libindex]) {
        const sku = this.spuData[itemindex].skus[libindex];
        let newQuantity = sku.quantity;
        
        if (isNaN(newQuantity) || newQuantity < 1) {
          newQuantity = 1;
        } else if (newQuantity > 1000000) {
          newQuantity = 1000000;
        }
        
        this.$set(this.spuData[itemindex].skus[libindex], 'quantity', newQuantity);
      }
    },
    
    selectedBrands() {
      const params = new URLSearchParams(window.location.search);
      return params.getAll('filter.p.m.product.brand');
    },
    
    creatCategoryList() {
      const categoryElements = this.categories.map((collection) => {
        const nextHandle = collection.name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-');
        return `<a href="/collections/${this.collectionData.handle}-${nextHandle}" class="product-categories-item">
          <img src="${collection?.img || ''}" alt="${collection.name}" width="146" height="146">
          <span>${collection.name}</span>
        </a>`;
      });
      
      const categoryList = document.querySelector('.product-categories-list');
      const categoriesBox = document.querySelector('.categories');
      
      if (categoriesBox) {
        categoriesBox.style.display = 'block';
      }
      
      if (categoryList) {
        categoryList.innerHTML = categoryElements.join('');
      }
    },
    
    creatBrandList(brand) {
      if (!brand || brand.length <= 0) {
        return false;
      }
      
      const urlbrand = this.selectedBrands();
      const urlBrandStr = urlbrand.join(',');
      
      this.brandExtra = [...brand]
        .sort((a, b) => b.count - a.count)
        .map((item, index) => ({
          id: `filter.p.m.product.brand-${index + 1}`,
          brand: item.brand,
          count: item.count,
          disabled: item.count === 0,
          checked: urlBrandStr.includes(item.brand)
        }));
      
      let filtertertml = '';
      const filterDom = document.querySelector('.js-col-filter');
      
      if (!filterDom) return;
      
      this.brandExtra.forEach((item, index) => {
        const checkboxId = `filter.p.m.product.brand-${index + 1}`;
        filtertertml += `
          <div class="checkbox-container ol-my-14">
            <input class="checkbox" type="checkbox" name="filter.p.m.product.brand" id="${checkboxId}" value="${item.brand}"
              ${item.disabled ? 'disabled' : ''} ${item.checked ? 'checked' : ''}
            >
            <label for="${checkboxId}">${item.brand} (${item.count})&lrm;</label>
          </div>
        `;
      });
      
      filterDom.innerHTML = filtertertml;
    },
    
    renderFacet() {
      const debouncedReload = debounce(async () => {
        window.scrollTo({
          top: 0,
          behavior: 'smooth',
        });
        // 重置分页和数据
        this.page = 1;
        this.spuData = [];
        this.hasMore = true;
        
        try {
          // 重新加载初始数据
          await this.fetchSpuList();
          // 重新初始化滚动监听
          if (this.observer) {
            this.observer.disconnect();
          }
          this.initIntersectionObserver();
        } catch (error) {
          console.error('Failed to reload data after filter change:', error);
        }
      }, 300);
      
      document.addEventListener('facet-rerender', debouncedReload);
    }
  }
});