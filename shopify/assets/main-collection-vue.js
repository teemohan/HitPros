
function throttle(fn, delay) {
  let lastCall = 0;
  return function(...args) {
    const now = new Date().getTime();
    if (now - lastCall < delay) return;
    lastCall = now;
    return fn.apply(this, args);
  };
}
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
      spuData: [],
      mobSpuData: [],
      categories: [],
      brands: [],
      wishlist: [],
      page: 1,
      hasMore: false,
      isLoading: false,
      isFirstScreenLoaded: false,
      firstScreenSize: 2,
      remainingDataLoaded: false,
      config: {
        apiBaseUrl: `${window.northsky?.api || ''}/openapi/adlink/product`,
        spuPageSize: 10,
        mobileThreshold: 741
      },
      collectionData: {
        handle: '',
        title: '',
        productCount: 0
      },
      observer: null,
      scrollObserver: null, 
      paginationInstances: [],
      skuPageSize: 6,
      currentSkuPages: {},
      brandExtra: [],
     
      cache: {
        processedTitle: null,
        isMobile: null,
        fullData: null
      }
    }
  },
  computed: {
   
    isMobile() {
     
      if (this.cache.isMobile === null) {
        const width = document.documentElement.clientWidth || document.body.clientWidth;
        this.cache.isMobile = width < this.config.mobileThreshold;
      }
      return this.cache.isMobile;
    },
    sortedBrands() {
      return [...this.brands].sort((a, b) => b.count - a.count);
    },
   
    processedTitle() {
     
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
    this.initData();
    this.renderFacet();
    this._throttledResize = throttle(() => {
      this.cache.isMobile = null;
    }, 200);
  },
  mounted() {
    this.$nextTick(() => {
      window.addEventListener('resize', this._throttledResize);
    });
  },
  beforeDestroy() {
    window.removeEventListener('resize', this._throttledResize);
    this.hideSketon()
    if (this.observer) {
      this.observer.disconnect();
    }
  },
  methods: {
    getPaginatedSkus(spuId) {
      const spu = this.spuData.find(item => item.spu === spuId);
      if (!spu) return [];
      const currentPage = this.currentSkuPages[spuId] || 1;
      const start = (currentPage - 1) * this.skuPageSize;
      const end = start + this.skuPageSize;
      return spu.skus.slice(start, end);
    },
    factMobFilter() {
      const filterDrawer = new FilterDrawer();
      filterDrawer.init();
      const mainEl = document.getElementById('main');
      if (mainEl) {
        mainEl.style.backgroundColor = '#EAEEF1';
      }
    },
    async initData() {
      if (this.isMobile) {
        try{
          await this.fetchCategories()
        } catch (error) {
        }
        if(this.categories.length <= 0) {
          await this.fetchSpuList(); 
          this.factMobFilter()
        } else {
          this.hideSketon()
        }
       
      } else {
        try{
          await this.fetchSpuList(); 
        } catch (error) { }
        this.fetchCategories();
      }
    },
    hideSketon() {
      const el = document.querySelector('.js-skeleton-screen');
      if(el) {
        el.style.display = 'none';
      }
      const el2 = document.querySelector('.js-collection-main');
      if (el2) {
        el2.classList.remove('hidden');
      }
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
      const query = this.getPriceFilterParams() 
      if (query.lowPrice || query.highPrice) {
        const inputs = document.querySelectorAll('.js-price-gte, .js-price-lte')
        inputs.forEach(input => {
          if (input.name === 'filter.v.price.gte' && query.lowPrice) {
            input.value = query.lowPrice
          } else if (input.name === 'filter.v.price.lte' && query.highPrice) {
            input.value = query.highPrice
          }
        })
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
        rootMargin: '200px 0px',
        threshold: 0.1
      });
      
      this.observer.observe(target);
    },
    async fetchCategories() {
      try {
        const title = this.processedTitle;
        const url = `${this.config.apiBaseUrl}/collection/collection/v2`;
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            c1: title,
            order: 1
          })
        });
        const result = await response.json();
        if (result.code === 200 && result.data) {
          this.categories = result.data || [];
          if(this.categories.length > 0) {
            this.creatCategoryList();
            const menudata = document.querySelector('.js-collecition-menu');
            if (menudata) {
              menudata.style.display = 'none';
            }
          } else {
            const menudata2 = document.querySelector('.js-topheader-mob');
            if(menudata2 && this.isMobile) {
              menudata2.style.display = 'none';
            }
          }
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Failed to fetch categories:', error);
        }
      }
    },
    updateWishlistStatus() {
      if (this.spuData.length === 0 || this.wishlist.length === 0) return;
      this.spuData.forEach((spu, spuIndex) => {
        spu.skus.forEach((sku, skuIndex) => {
          const isInWishlist = this.wishlist.some(item => item.variantId == sku.variantId)
          if (isInWishlist !== sku.isWish) {
            this.$set(this.spuData[spuIndex].skus[skuIndex], 'isWish', isInWishlist);
          }
        });
      });
    },
    showaddLoading(itemindex, libindex, bol) {
      if (this.spuData[itemindex]?.skus[libindex]) {
        const sku = this.spuData[itemindex].skus[libindex];
        this.$set(this.spuData[itemindex].skus[libindex], 'selected', bol);
      }
    },
    showMobLoading (libindex, bol) {
      if(this.mobSpuData[libindex]) {
        this.$set(this.mobSpuData[libindex], 'selected', bol);
      }
    },
    async addToCart(variantId, quantity, itemindex, libindex) {
      try {
        this.showaddLoading(itemindex, libindex, true);
        await cartFormModule.addToCart({
          variantId,
          quantity
        }, () => {
          this.showaddLoading(itemindex, libindex, false);
        });
      } catch (error) {
        // cartFormModule.handleAddToCart({ success: false, error });
        this.showaddLoading(itemindex, libindex, false);
      }
    },
    async mobAddToCart(variantId, quantity, libindex) {
      try {
        this.showMobLoading(libindex, true);
        await cartFormModule.addToCart({
          variantId,
          quantity
        }, () => {
          this.showMobLoading(libindex, false);
        });
      } catch (error) {
        // cartFormModule.handleAddToCart({ success: false, error });
        this.showMobLoading(libindex, false);
      }
    },
    observeLCP() {    
      if ('PerformanceObserver' in window) {
        const lcpObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          const lastEntry = entries[entries.length - 1];
          console.log('LCP:', lastEntry.startTime, 'Element:', lastEntry.element);
        });
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      }
    },
    customerDataLayer (list) {
      const listData = [];
      let totalIndex = (this.page - 1) * this.config.spuPageSize;
      for(const item of list) {
        for(let i = 0; i < item.skus.length; i++) {
          const sku = item.skus[i];
          listData.push({
            item_id: sku.skuCode,
            item_name: sku.title,
            price: sku.price,
            index: totalIndex + i + 1,
            item_brand: sku.brand,
            item_category: sku.category || '',
            currency: 'USD',
            quantity: sku.moq || 1
          });
        }
        totalIndex += item.skus.length;
      }
      const eventData = {
        event: 'view_item_list',
        category_name: this.collectionData.title.replace(/~/g, '>'),
        ecommerce: {
          item_list_id: 'collection_page_view',
          items: listData
        }
      }
      window.dataLayer.push(eventData);
    },
    async fetchData(pageNo, pageSize, isHighPriority = false) { 
      try {
        const urlbrand = this.selectedBrands();
        const params = {
          pageNo,
          pageSize,
          ...this.getPriceFilterParams(),
          brand: urlbrand || []
        };
        let url = `${this.config.apiBaseUrl}/collection/pagespu/v2`;
        if (this.collectionData.handle !== 'all') {
          params.c1 = this.processedTitle
        }
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        const fetchOptions = {
          signal: controller.signal
        };
       
        if (isHighPriority) {
          fetchOptions.headers = {
            'Priority': 'high',
            'X-Requested-With': 'XMLHttpRequest'
          };
        }
        const response = await fetch(url, {
          ...fetchOptions,
          method: 'POST',
          headers: {
            ...fetchOptions.headers,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(params)
        });
        clearTimeout(timeoutId);
        return await response.json();
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Failed to fetch data:', error);
        }
        throw error;
      }
    },
    processSpuData(data, updateWishlist = false) {
      if (!data || !data.list) return [];
      return data.list.map(item => ({
        ...item,
        skus: item.skus.map(sku => ({
          ...sku,
          price: sku.price.toFixed(2),
          quantity: sku.moq || 1,
          selected: false,
         
        }))
      }));
    },
    async fetchSpuList() {
      if (this.isLoading) return;
      try {
        this.isLoading = true;
        const result = await this.fetchData(this.page, this.config.spuPageSize);
        if (result.code === 200) {
          const newData = this.processSpuData(result.data, true);
          this.spuData = [...this.spuData, ...(newData || [])];
          this.mobSpuData = this.spuData.reduce((acc, item) => {
            return acc.concat(item.skus)
          }, [])
          if (result.data.extra && this.page == 1) {
            this.creatBrandList(result.data.extra);
          }
          this.hasMore = parseInt(result.data.total) > this.spuData.length;
          if(this.hasMore && this.page == 1) {
            this.initIntersectionObserver();
          }
          try {
            this.customerDataLayer(newData)
          } catch (error) {
            console.error('Failed gtm:', error);
          }
          this.page++;
        } else {
          document.documentElement.dispatchEvent(
            new CustomEvent('cart-notification:show', {
              bubbles: true,
              cancelable: true,
              detail: {
                status: 'error',
                error: result.msg || 'please try again later'
              },
            })
          );
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Failed to fetch SPU list:', error);
          throw error;
        }
      } finally {
        this.isLoading = false;
        this.hideSketon()
      }
    },
    getPriceFilterParams() {
      const params = new URLSearchParams(window.location.search);
      return {
        highPrice: parseFloat(params.get('filter.v.price.lte')) || null,
        lowPrice: parseFloat(params.get('filter.v.price.gte')) || null
      };
    },
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
    incrementQuantity(itemindex, libindex) {
      if (this.spuData[itemindex]?.skus[libindex]) {
        const sku = this.spuData[itemindex].skus[libindex];
        if (sku.quantity < 1000000) {
          const newQuantity = sku.quantity + (sku.mpq || 1);
          this.$set(this.spuData[itemindex].skus[libindex], 'quantity', newQuantity);
        }
      }
    },
    decrementQuantity(itemindex, libindex) {
      if (this.spuData[itemindex]?.skus[libindex]) {
        const sku = this.spuData[itemindex].skus[libindex];
        const moq = sku.moq || 1;
        const mpq = sku.mpq || 1;
        if (sku.quantity > moq) {
          const newQuantity = sku.quantity - mpq;
          this.$set(this.spuData[itemindex].skus[libindex], 'quantity', 
            newQuantity >= moq ? newQuantity : moq
          );
        }
      }
    },
    validateQuantity(itemindex, libindex) {
      if (this.spuData[itemindex]?.skus[libindex]) {
        const sku = this.spuData[itemindex].skus[libindex];
        let newQuantity = parseInt(sku.quantity);
        const moq = sku.moq || 1;
        const mpq = sku.mpq || 1;
       
        if (isNaN(newQuantity) || newQuantity < moq) {
          newQuantity = moq;
        } else if (newQuantity > 1000000) {
          newQuantity = 1000000;
        } else {
         
          const exceededMoq = newQuantity - moq;
          const remainder = exceededMoq % mpq;
          if (remainder !== 0) {
            newQuantity = moq + (Math.ceil(exceededMoq / mpq) * mpq);
          }
        }
        this.$set(this.spuData[itemindex].skus[libindex], 'quantity', newQuantity);
      }
    },
    selectedBrands() {
      const params = new URLSearchParams(window.location.search);
      return params.getAll('filter.p.m.product.brand');
    },
    creatCategoryList() {
      const categoryElements = this.categories.map((collection, index) => {
        const nextHandle = collection.name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-');
        return `<a href="/collections/${this.collectionData.handle}-${nextHandle}"
         class="flex flex-col items-center justify-center group py-2.5 transition duration-200 relative fb-sm:pt-6 fb-sm:pb-4 fb-sm:h-[244px] hover:bg-F3F8FC hover:border-none ${index > 5 ? 'fb-sm:border-b': 'fb-sm:border-t fb-sm:border-b'}  fb-sm:border-r  fb-sm:border-F0F0F0">
          <div class="w-full px-9 h-25 mb-4 fb-flex-center fb-sm:w-8.75r fb-sm:h-8.75r fb-sm:px-0">
              <img src="${collection?.img || ''}" alt="${collection.name}" width="100px" height="100px" class="h-full w-auto">
          </div>  
          <div class="px-4 text-13 text-main fb-sm:text-sm group-hover:underline font-bold text-center line-clamp-2 h-8 fb-sm:px-7 fb-sm:h-auto">
            ${collection.name}
          </div>
          <p class="w-full h-full border-[3px] absolute border-[#D3DEF1] hidden left-0 top-0 group-hover:block"></p>
        </a>`;
      });
      
      const categoryList = document.querySelector('.js-categories-list');
      const categoriesBox = document.querySelector('.js-categories');
      
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
      const filterDoms = document.querySelectorAll('.js-col-filter');
      if (!filterDoms.length) return;
     
      let filtertertml = '';
      this.brandExtra.forEach((item, index) => {
        const checkboxId = `filter.p.m.product.brand-${index + 1}`;
        filtertertml += `
          <div class="flex items-center text-xs">
            <input class="checkbox" class="w-4 h-4 border border-999999 rounded-sm fb-sm:w-5 fb-sm:h-5" type="checkbox" name="filter.p.m.product.brand" id="${checkboxId}" value="${item.brand}"
              ${item.disabled ? 'disabled' : ''} ${item.checked ? 'checked' : ''}
            >
            <label class="text-xs text-black fb-sm:text-sm" for="${checkboxId}">${item.brand} (${item.count})&lrm;</label>
          </div>
        `;
      });
     
      filterDoms.forEach(filterDom => {
        filterDom.innerHTML = filtertertml;
      });
    },
    renderFacet() {
      const debouncedReload = debounce(async () => {
        window.scrollTo({
          top: 0,
          behavior: 'smooth',
        });
       
        this.page = 1;
        this.spuData = [];
        this.hasMore = true;
        try {
          await this.fetchSpuList();
          if (this.observer) {
            this.observer.disconnect();
          }
          this.initIntersectionObserver();
        } catch (error) {
          console.error('Failed to reload data after filter change:', error);
        }
      }, 300);
      
      document.addEventListener('facet-rerender', debouncedReload);
    },
  }
});