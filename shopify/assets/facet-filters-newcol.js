class FilterDrawer {
  constructor(options) {
    // 默认配置
    const defaults = {
      filterButtonsSelector: '.ffn-filter-btn',
      drawerSelector: '#ffn-col-drawer',
      filterItemSelector: '#ffn-col-item',
      drawerContentSelector: '.js-ffb-col-content',
      filterContentsSelector: '.filter-content',
      clearBtnSelector: '#col-clearBtn',
      applyBtnSelector: '#col-applyBtn'
    };
   // 合并配置
   this.options = { ...defaults, ...options };
   // 初始化元素引用
   this.filterButtons = null;
   this.drawer = null;
   this.filterItem = null;
   this.drawerContent = null;
   this.filterContents = null;
   this.clearBtn = null;
   this.applyBtn = null;
    
    // 绑定方法的this上下文
    this.setDrawerPosition = this.setDrawerPosition.bind(this);
    this.resetButtonStyles = this.resetButtonStyles.bind(this);
    this.openDrawer = this.openDrawer.bind(this);
    this.closeDrawer = this.closeDrawer.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.handleScroll = this.handleScroll.bind(this);
    this.handleFilterButtonClick = this.handleFilterButtonClick.bind(this);
    this.handleDrawerBackgroundClick = this.handleDrawerBackgroundClick.bind(this);
    this.handleClearBtnClick = this.handleClearBtnClick.bind(this);
    this.handleApplyBtnClick = this.handleApplyBtnClick.bind(this);
    this.buildFilterUrl = this.buildFilterUrl.bind(this);
  }
  init() {
    // 获取DOM元素
    this.filterButtons = document.querySelectorAll(this.options.filterButtonsSelector);
    this.drawer = document.querySelector(this.options.drawerSelector);
    this.filterItem = document.querySelector(this.options.filterItemSelector);
    this.drawerContent = document.querySelector(this.options.drawerContentSelector);
    this.filterContents = document.querySelectorAll(this.options.filterContentsSelector);
    this.clearBtn = document.querySelector(this.options.clearBtnSelector);
    this.applyBtn = document.querySelector(this.options.applyBtnSelector);
    
    // 如果必要的元素不存在，则不初始化
    if (!this.drawer || !this.filterItem || !this.drawerContent) {
      return;
    }
    this.addEventListeners();
  }
  addEventListeners() {
    window.addEventListener('resize', this.handleResize);
    window.addEventListener('scroll', this.handleScroll);
    this.filterButtons.forEach(button => {
      button.addEventListener('click', this.handleFilterButtonClick);
    });
    this.drawer.addEventListener('click', this.handleDrawerBackgroundClick);
    if (this.clearBtn) {
      this.clearBtn.addEventListener('click', this.handleClearBtnClick);
    }
    if (this.applyBtn) {
      this.applyBtn.addEventListener('click', this.handleApplyBtnClick);
    }
  }
  
  removeEventListeners() {
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('scroll', this.handleScroll);
    this.filterButtons.forEach(button => {
      button.removeEventListener('click', this.handleFilterButtonClick);
    });
    this.drawer.removeEventListener('click', this.handleDrawerBackgroundClick);
    if (this.clearBtn) {
      this.clearBtn.removeEventListener('click', this.handleClearBtnClick);
    }
    if (this.applyBtn) {
      this.applyBtn.removeEventListener('click', this.handleApplyBtnClick);
    }
  }
  setDrawerPosition() {
    const filterItemRect = this.filterItem.getBoundingClientRect();
    const topPosition = filterItemRect.bottom;
    const windowHeight = window.innerHeight;
    const drawerHeight = windowHeight - topPosition;
    
    this.drawer.style.top = `${topPosition}px`;
    this.drawer.style.height = `${drawerHeight}px`;
  }
  resetButtonStyles() {
    this.filterButtons.forEach(btn => {
      btn.classList.remove('bg-darkmain', '!text-white', '!border-darkmain');
      // Reset SVG rotation
      const svg = btn.querySelector('svg');
      if (svg) {
        svg.style.transform = 'rotate(0deg)';
        svg.style.transition = 'transform 0.3s ease';
      }
    });
  }
  showLoadingBar() {
    this.triggerEvent(document.documentElement, 'theme:loading:start');
  }
  hideLoadingBar() {
    this.triggerEvent(document.documentElement, 'theme:loading:end');
  }
  triggerEvent(element, eventName) {
    const event = new CustomEvent(eventName);
    element.dispatchEvent(event);
  }
  openDrawer(filterType, button) {
    this.setDrawerPosition();
    this.resetButtonStyles();
    // Update button styles
    button.classList.add('bg-darkmain', '!text-white', '!border-darkmain');
    // Rotate the SVG icon 180 degrees
    const svg = button.querySelector('svg');
    if (svg) {
      svg.style.transform = 'rotate(90deg)';
      svg.style.transition = 'transform 0.3s ease';
    }
    this.filterContents.forEach(content => {
      content.classList.add('hidden');
    });
    
    const activeContent = document.getElementById(`${filterType}-filter-content`);
    if (activeContent) {
      activeContent.classList.remove('hidden');
    }
    
    // 显示弹窗
    this.drawer.classList.remove('opacity-0', 'invisible');
    this.drawer.classList.add('opacity-100');
    
    // 内容区域动画
    this.drawerContent.classList.remove('translate-y-[-20px]');
    this.drawerContent.classList.add('translate-y-0');
    
    // 禁止背景滚动
    document.body.style.overflow = 'hidden';
  }
  closeDrawer() {
    // 先执行内容区域动画
    this.drawerContent.classList.remove('translate-y-0');
    this.drawerContent.classList.add('translate-y-[-20px]');
    this.drawer.classList.remove('opacity-100');
    this.drawer.classList.add('opacity-0', 'invisible');
    document.body.style.overflow = '';
    // 关闭弹窗时重置按钮样式
    this.resetButtonStyles();
  }
  handleResize() {
    if (!this.drawer.classList.contains('invisible')) {
      this.setDrawerPosition();
    }
  }
  handleScroll() {
    if (!this.drawer.classList.contains('invisible')) {
      this.setDrawerPosition();
    }
  }
handleFilterButtonClick(event) {
  const button = event.currentTarget;
  const filterType = button.getAttribute('data-filter-type');
  const svg = button.querySelector('svg');
  this.openDrawer(filterType, button);
}
  handleDrawerBackgroundClick(event) {
    // 检查点击的元素是否在内容区域之外
    if (!this.drawerContent.contains(event.target)) {
      this.closeDrawer();
    }
  }
  handelEmptyInput(input) {
    const inputs = this.drawer.querySelectorAll('input');
    let hasSelectedFilters = false;
    inputs.forEach(input => {
      if ((input.type === 'checkbox' && input.checked) || 
          (input.type === 'number' && input.value !== '')) {
        hasSelectedFilters = true;
      }
    });
    return hasSelectedFilters;
  }
  handleClearBtnClick() {
    // Check if any filters are selected
    const hasSelectedFilters = this.handelEmptyInput();
    console.log("hasSelectedFilters", hasSelectedFilters);
    // If no filters are selected, just close the drawer
    if (!hasSelectedFilters) {
      this.closeDrawer();
      return;
    }
    const inputs = this.drawer.querySelectorAll('input');
    inputs.forEach(input => {
      if (input.type === 'checkbox') {
        input.checked = false;
      } else if (input.type === 'number') {
        input.value = '';
      }
    });
    try {
      const currentUrl = new URL(window.location.href);
      const pathWithoutQuery = currentUrl.origin + currentUrl.pathname;
      history.replaceState({}, '', pathWithoutQuery);
      this.showLoadingBar();
      document.dispatchEvent(new CustomEvent('facet-rerender'));
      this.hideLoadingBar();
    } catch (e) {
      if (e.name === 'AbortError') {
        return;
      }
      console.error('筛选器处理错误:', e);
    }
    this.closeDrawer();
  }
  buildFilterUrl() {
    // 获取当前页面URL
    const currentUrl = new URL(window.location.href);
    const searchParams = new URLSearchParams();
    // 获取价格范围并确保验证
    const priceMinInput = document.getElementById('price-min');
    const priceMaxInput = document.getElementById('price-max');
    const minPrice = priceMinInput?.value || '';
    const maxPrice = priceMaxInput?.value || '';
    
    // 添加价格参数
    if (minPrice) {
      searchParams.append('filter.v.price.gte', minPrice);
    }
    if(maxPrice) {
      searchParams.append('filter.v.price.lte', maxPrice);
    }
    
    // 获取选中的品牌
    const brandCheckboxes = document.querySelectorAll('#brand-filter-content input[type="checkbox"]:checked');
    brandCheckboxes.forEach(checkbox => {
      const brandName = checkbox.value || checkbox.dataset.brand || checkbox.id.replace('brand-', '');
      searchParams.append('filter.p.m.product.brand', brandName);
    });
    
    // 保留其他可能的查询参数（如排序、页码等）
    for (const [key, value] of currentUrl.searchParams.entries()) {
      if (!key.startsWith('filter.')) {
        searchParams.append(key, value);
      }
    }
    
    return searchParams.toString();
  }
  handleApplyBtnClick(event) {
    try {
      const filterParams = this.buildFilterUrl();
      const currentUrl = new URL(window.location.href);
      const pathWithoutQuery = currentUrl.origin + currentUrl.pathname;
      const newUrl = filterParams ? `${pathWithoutQuery}?${filterParams}` : pathWithoutQuery;
      console.log("newUrl", newUrl);
      history.replaceState({}, '', newUrl);
      this.showLoadingBar();
      document.dispatchEvent(new CustomEvent('facet-rerender'));
      this.hideLoadingBar();
      } catch (e) {
        if (e.name === 'AbortError') {
          return;
        }
        console.error('筛选器处理错误:', e);
      }
      this.closeDrawer();
    }
  destroy() {
    this.removeEventListeners();
    // 清空引用
    this.filterButtons = null;
    this.drawer = null;
    this.filterItem = null;
    this.drawerContent = null;
    this.filterContents = null;
    this.clearBtn = null;
    this.applyBtn = null;
  }
}