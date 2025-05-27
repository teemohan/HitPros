/**
 * DataLayer管理器 - 处理所有GTM埋点相关逻辑
 */
class DataLayerManager {
  constructor() {
    this.initialized = false;
    this.sessionId = this.generateUUID();
    this.viewedElements = new Set();
  }
  /**
   * 初始化埋点管理器
   */
  init() {
    if (this.initialized) return;
    
    // 确保dataLayer存在
    window.dataLayer = window.dataLayer || [];
    
    // 设置全局事件监听
    this.setupEventListeners();
    
    // 设置曝光监听
    this.setupImpressionObserver();

    this.initialized = true;
    console.log('DataLayer Manager initialized');
  }
  /**
   * 生成UUID
   */
  generateUUID() {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
  }
  /**
   * 设置事件监听器
   */
  setupEventListeners() {
    // 使用事件委托监听点击事件
    document.body.addEventListener('click', (event) => {
      let target = event.target;
      
      // 向上查找最近的带有data-datalayer属性的元素
      while (target && target !== document.body) {
        if (target.hasAttribute('data-datalayer') || target.hasAttribute('data-datalayer-item')) {
          const eventType = target.getAttribute('data-event-type') || 'select_item';
          this.handleEvent(eventType, target);
          break;
        }
        target = target.parentElement;
      }
    });

    // 监听表单提交
    document.body.addEventListener('submit', (event) => {
      const form = event.target;
      if (form.hasAttribute('data-datalayer')) {
        const eventType = form.getAttribute('data-event-type') || 'form_submit';
        this.handleEvent(eventType, form);
      }
    });
  }
  setupImpressionObserver() {
    if (!('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const element = entry.target;
          // 确保元素只触发一次曝光事件
          if (!this.viewedElements.has(element)) {
            this.viewedElements.add(element);
            const eventType = element.getAttribute('data-event-type');
            if (eventType) {
              this.handleEvent(eventType, element);
            }
            // 如果是列表，处理列表中的项目
            if (eventType === 'view_item_list') {
              this.handleItemListImpression(element);
            }
          }
        }
      });
    }, {
      threshold: 0.5
    });
    document.querySelectorAll('[data-datalayer="true"]').forEach(element => {
      observer.observe(element);
    });
  }
  handleItemListImpression(listElement) {
    const items = [];
    const listName = listElement.getAttribute('data-list-name') || 'default_list';
    listElement.querySelectorAll('[data-datalayer-item="true"]').forEach((item, index) => {
      items.push(this.extractItemData(item, index));
    });
    if (items.length > 0) {
      console.log('Pushing item list to dataLayer:', items);
      this.pushToDataLayer({
        event: 'view_item_list',
        request_id: this.sessionId,
        recommend_module: listElement.getAttribute('data-recommend-module') || 'default',
        ecommerce: {
          item_list_id: listName,
          item_list_name: listName,
          items: items
        }
      });
    }
  }
  handleEvent(eventType, element) {
    switch (eventType) {
      case 'select_item':
        this.handleSelectItem(element);
        break;
      case 'view_item':
        this.handleViewItem(element);
        break;
      case 'add_to_cart':
        this.handleAddToCart(element);
        break;
      case 'form_submit':
        this.handleFormSubmit(element);
        break;
      default:
        this.handleCustomEvent(eventType, element);
    }
  }
  handleSelectItem(element) {
    const listElement = this.findParentWithAttribute(element, 'data-event-type', 'view_item_list');
    const listName = listElement ? listElement.getAttribute('data-list-name') : 'default_list';
    
    const itemData = this.extractItemData(element, 0);
    
    this.pushToDataLayer({
      event: 'select_item',
      request_id: this.sessionId,
      ecommerce: {
        item_list_id: listName,
        item_list_name: listName,
        items: [itemData]
      }
    });
  }
  handleViewItem(element) {
    const itemData = this.extractItemData(element, 0);
    
    this.pushToDataLayer({
      event: 'view_item',
      request_id: this.sessionId,
      ecommerce: {
        items: [itemData]
      }
    });
  }
  handleAddToCart(element) {
    const itemData = this.extractItemData(element, 0);
    itemData.quantity = parseInt(element.getAttribute('data-item-quantity') || '1');
    
    this.pushToDataLayer({
      event: 'add_to_cart',
      request_id: this.sessionId,
      ecommerce: {
        items: [itemData]
      }
    });
  }
  handleFormSubmit(form) {
    const formData = {
      form_id: form.getAttribute('data-form-id') || form.id || 'unknown_form',
      form_name: form.getAttribute('data-form-name') || 'Form Submission'
    };
    
    this.pushToDataLayer({
      event: 'form_submit',
      request_id: this.sessionId,
      form_data: formData
    });
  }
  handleCustomEvent(eventType, element) {
    const eventData = {};
    Array.from(element.attributes)
      .filter(attr => attr.name.startsWith('data-') && !attr.name.startsWith('data-datalayer'))
      .forEach(attr => {
        const key = attr.name.replace('data-', '').replace(/-([a-z])/g, (g) => g[1].toUpperCase());
        eventData[key] = attr.value;
      });
    
    this.pushToDataLayer({
      event: eventType,
      request_id: this.sessionId,
      ...eventData
    });
  }
  extractItemData(element, index) {
    return {
      item_id: element.getAttribute('data-product-id') || '',
      item_name: element.getAttribute('data-product-name') || '',
      item_brand: element.getAttribute('data-item-brand') || '',
      item_category: element.getAttribute('data-item-category') || '',
      item_variant: element.getAttribute('data-var-id') || '',
      price: parseFloat(element.getAttribute('data-price') || '0'),
      quantity: 1,
      index: index + 1,
      sku_code: element.getAttribute('data-sku') || element.getAttribute('data-product-id') || ''
    };
  }
  findParentWithAttribute(element, attrName, attrValue) {
    let parent = element.parentElement;
    while (parent) {
      if (parent.getAttribute(attrName) === attrValue) {
        return parent;
      }
      parent = parent.parentElement;
    }
    return null;
  }
  pushToDataLayer(data) {
    if (window.dataLayer) {
      console.log('Pushing to dataLayer:', data);
      window.dataLayer.push(data);
    }
  }
}
const dataLayerManager = new DataLayerManager();
document.addEventListener('DOMContentLoaded', () => {
  dataLayerManager.init();
});
window.dataLayerManager = dataLayerManager;