$(function () {
  const mainProductUtils = {
    computePrice: function(discountJson, basePrice, quantity) {
      let finalPrice;
      if (discountJson && discountJson.length > 0) {
        try {
          let applicableDiscount = null;
          for (let i = 0; i < discountJson.length; i++) {
            if (quantity >= parseInt(discountJson[i].moq)) {
              applicableDiscount = parseFloat(discountJson[i].discount);
            }
          }
          if (applicableDiscount) {
            let discountedUnitPrice = Math.round(basePrice * applicableDiscount * 100) / 100;
            finalPrice = Math.round(discountedUnitPrice * quantity * 100) / 100;
          } else {
            finalPrice = Math.round(quantity * basePrice * 100) / 100;
          }
        } catch (e) {
          console.error('Parsing error:', e);
          finalPrice = Math.round(quantity * basePrice * 100) / 100;
        }
      } else {
        finalPrice = Math.round(quantity * basePrice * 100) / 100;
      }
      return zkhFormatMoney(finalPrice * 100);
    },
    validateQuantity: function(inputValue, moq, mpq, maxQuantity = 1000000) {
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
    getCart: async function() {
      try {
        const response = await fetch('/cart.js');
        return await response.json();
      } catch (error) {
        console.error('Error getting cart data:', error);
        return { items: [] };
      }
    },
    throttle: function(func, wait, context, immediate) {
      let timeout;
      let args;
      let result;
      let previous = 0;
      
      const later = function() {
        previous = immediate === false ? 0 : Date.now();
        timeout = null;
        result = func.apply(context, args);
        if (!timeout) args = null;
      };
      
      return function() {
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
    formateDiscountJson: function(dom) {
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
  const getInitPrice = () => {
    let basePrice = $('#js-nav-quick').data('price') || 0
    if (basePrice) {
      basePrice = typeof basePrice == 'string' ? parseFloat(basePrice.replace(/,/g, '')) : parseFloat(basePrice);
    }
    return basePrice
  }
  const mainProductInfo = {
    info: {
      price: getInitPrice(),
      moq: $('.js-nav-current-input').data('moq') || 1,
      mpq: $('.js-nav-current-input').data('mpq') || 1,
      discountJson: mainProductUtils.formateDiscountJson('#js-nav-quick'),
      variantId: $('#js-nav-quick').data('variant-id'),
      quantity: $('.js-nav-current-input').data('moq') || 1,
      sku: $('#js-product-quikbuy').data('sku') || '',
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
          console.log("existingItem", existingItem)
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
    validateQuantityInput: function($input, info, callback) {
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
    },
    computed_price: function(discountJson, basePrice, quantity) {
      return mainProductUtils.computePrice(discountJson, basePrice, quantity);
    }
  };
  const productNavBar = {
    gumshoeInstance: null,
    currentSelectedItem: null,
    showSection: [
      {
        ele: '.js-highlights-section',
        isShow: true,
        id: 'js-highlights-section',
        desc: "Highlights",
        pcCategorize: 'Product Highlights',
        categorize: 'Highlights'
      },
      {
        ele: '.js-addition-detail',
        isShow: true,
        id: 'js-addition-section',
        desc: "Details",
        pcCategorize: 'Additional Details',
        categorize: 'Details'
      },
      {
        ele: '.js-download-file',
        isShow: true,
        id: 'js-download-section',
        desc: "Files",
        pcCategorize: 'User Documents',
        categorize: 'Files'
      },
      {
        ele: '.js-brand-about',
        isShow: true,
        id: 'js-brand-section',
        desc: "Brand",
        pcCategorize: 'About the Brand',
        categorize: ''
      },
      {
        ele: '.js-review-rate',
        isShow: false,
        id: 'js-review-section',
        desc: "Reviews",
        pcCategorize: 'See Reviews',
        categorize: 'Reviews'
      }
    ],
    init: function () {
      this.renderNavTitle();
      // this.bindEvents();
      this.initGumshoe();
    },
    renderNavTitle: function () {
      let str = '';
      let getArr = [];
      let str_css = 'text-white fb-sm:text-black text-14 fb-sm:text-16 fb-1700:text-18 cursor-pointer shrink-0 fb-1700:w-11r h-full items-center justify-center';
      this.showSection.forEach((item, index) => {
        const $dom = $(item.ele);
        if ($dom.length) {
          $dom.attr('id', item.id);
          getArr.push(item);
          const visibilityClass = item.categorize ? (item.isShow ? 'flex' : 'hidden') : (item.isShow ? 'hidden fb-sm:flex' : 'hidden');
          str += `<li class="js-nav-box ${str_css} ${visibilityClass}">
            <a href="#${item.id}" class="js-nav-choose h-full flex items-center justify-center" data-desc="${item.desc}">
              <span class="hidden fb-sm:inline">${item.pcCategorize}</span>
              <span class="fb-sm:hidden">${item.categorize}</span>
            </a>
          </li>`;
        }
      });
      $('.js-product-anchor').html(str);
      if (getArr.length === 1 && (!getArr[0].categorize)) {
        $('.js-anchor-section').addClass('hidden fb-sm:block');
      }
      if (getArr.length === 0) {
        $('.js-anchor-section').hide();
      }
      mainProductUtils.checkElementDisplay('#judgeme_product_reviews', 10000, function (bol) {
        if (bol) {
          $('.js-review-container').removeClass('invisible')
          $('.zkh-single-reviews').removeClass('invisible')
           $('.js-review-container').removeClass('h-0')
          $(`.js-nav-choose[data-desc='Reviews']`).closest('li').removeClass('hidden').addClass('flex');
        } else {
          $('.js-review-container').hide();
          $(`.js-nav-choose[data-desc='Reviews']`).closest('li').hide();
        }
      });
    },
    bindEvents: function () {
      // $('.js-product-anchor').on('click', '.js-nav-choose', function (e) {
      //   e.preventDefault();
      //   $('.js-nav-choose').parent().removeClass('active');
      //   $(this).parent().addClass('active');
      //   productNavBar.currentSelectedItem = $(this).attr('href');
      //   const targetId = $(this).attr('href');
      //   const target = document.querySelector(targetId);
      //   if (target) {
      //     const headerHeight = $('.shopify-section--header').outerHeight() || 0;
      //     const targetPosition = $(target).offset().top - 150
      //     window.scrollTo({
      //       top: targetPosition,
      //       behavior: 'smooth'
      //     });
      //   }
      // });
    },
    initGumshoe: function () {
      if (this.gumshoeInstance && typeof this.gumshoeInstance.destroy === 'function') {
        this.gumshoeInstance.destroy();
      }
      this.gumshoeInstance = new Gumshoe('.js-nav-choose', {
        offset: 80,
        reflow: true,
        nested: true, 
        throttle: 30,
        callback: ((nav)=> {
           if (!nav) return;
          $('.js-product-anchor li').removeClass('active');
          $(nav).parent().addClass('active');
          this.currentSelectedItem = $(nav).attr('href');
        })
      });
    }
  };
  const navQuickBuy = {
    quantity: 1,
    productInfo: null,
    init: function() {
      this.productInfo = Object.assign({}, mainProductInfo.info);
      this.quantity = this.productInfo.moq;
      this.getTotalMoney();
      this.bindEvents();
    },
    getTotalMoney: function() {
      const discountJson = this.productInfo.discountJson || [];
      const finalPrice = cartFormModule.computed_price(discountJson, this.productInfo.price, this.quantity);
      $('.js-nav-current-price').html(finalPrice);
    },
    decreaseQuantity: function() {
      if (!this.productInfo) return;
      const $input = $('.js-nav-current-input');
      const currentValue = parseInt($input.val());
      const moq = this.productInfo.moq || 1;
      const mpq = this.productInfo.mpq || 1;
      let newValue;
      if (currentValue <= moq) {
        newValue = moq;
      } else {
        newValue = currentValue - mpq;
        if (newValue < moq) {
          newValue = moq;
        }
      }
      $input.val(newValue);
      $('.js-nav-quick-minus').prop('disabled', newValue <= moq);
      this.quantity = newValue;
      this.getTotalMoney();
    },
    increaseQuantity: function() {
      if (!this.productInfo) return;
      const $input = $('.js-nav-current-input');
      const currentValue = parseInt($input.val());
      const moq = this.productInfo.moq || 1;
      const mpq = this.productInfo.mpq || 1;
      const maxQuantity = cartFormModule.maxQuantity;
      let newValue;
      if (currentValue < moq) {
        newValue = moq;
      } else {
        newValue = currentValue + mpq;
      }
      if (newValue > maxQuantity) {
        newValue = maxQuantity;
        $('.js-nav-quick-plus').prop('disabled', true);
      }
      $input.val(newValue);
      $('.js-nav-quick-minus').prop('disabled', false);
      this.quantity = newValue;
      this.getTotalMoney();
    },
    bindEvents: function() {
      const self = this;
      $('.js-navquickbuy-addtocart').click(function() {
        let $btn = $(this);
        const $input = $('.js-nav-current-input')
        $btn.find('.js-btn-text').addClass('hidden');
        $btn.find('.js-btn-loading').removeClass('hidden');
        cartFormModule.addToCart({
          variantId: self.productInfo.variantId,
          quantity: $input.val() || self.quantity
        }, function() {
          $btn.find('.js-btn-text').removeClass('hidden');
          $btn.find('.js-btn-loading').addClass('hidden');
        });
      });
      $('.js-nav-quick-plus').click(function() {
        self.increaseQuantity();
      });
      $('.js-nav-quick-minus').click(function() {
        self.decreaseQuantity();
      });
      $('.js-nav-current-input').on('change', function() {
        const $input = $('.js-nav-current-input')
        cartFormModule.validateQuantityInput($(this), self.productInfo, function(newQuantity) {
          $('.js-nav-quick-minus').prop('disabled', newQuantity <= self.productInfo.moq);
          $('.js-nav-quick-plus').prop('disabled', newQuantity >= cartFormModule.maxQuantity);
          self.quantity = newQuantity;
          $input.val(newQuantity)
          self.getTotalMoney();
        });
      });
    }
  };
  const quickBuy = {
    sku: '',
    selectionAttrs: [],
    availableAttrs: [],
    selectedValues: [],
    productInfo: null,
    currentInfo: null,
    productId: '',
    quantity: 1,
    init: function() {
      this.productInfo = Object.assign({}, mainProductInfo.info);
      this.currentInfo = Object.assign({}, mainProductInfo.info);
      this.quantity = this.productInfo.moq || 1;
      this.getTotalMoney();
      if (this.productInfo.sku) {
        this.getSelectionAttrs();
        this.bindEvents();
      }
    },
    shouldHideAttributeSelector(selectionAttrs) {
      return (
        selectionAttrs.find((item) => item.attrName === 'match') ||
        selectionAttrs.length === 0 ||
        (selectionAttrs.length === 1 && selectionAttrs[0].values.length <= 1)
      );
    },
    getSelectionAttrs: async function() {
      try {
        const res = await kkAjax.get(`/spu/selection-attrs/other?sku=${this.productInfo.sku}`);
        if (res.code === 200 && res.data) {
          this.selectionAttrs = res.data.selectionAttrs || [];
          this.availableAttrs = res.data.availableAttrs || [];
          
          if (this.shouldHideAttributeSelector(this.selectionAttrs)) {
            $('#js-quickbuy-selectedbox').hide();
            $('#js-view-product-details').hide();
            return false;
          }
          this.selectedValues = new Array(this.selectionAttrs.length).fill('');
          this.calculateCurrentSkuAttrs();
          this.renderSelects();
        }
      } catch (err) {
        console.error('Failed to fetch selection attributes:', err);
      }
    },
    async getProductData(info) {
      // try {
      //   const res = await kkAjax.get(`/spu/selection-attrs/other?sku=${id}`);
      //   if (res.code === 200 && res.data) {
      //     this.quantity = this.productInfo.moq || 1;
      //     this.productInfo = Object.assign({}, res.data.sku);
      //     console.log("this.productInfo",  this.productInfo)
      //     this.updateProductInfo();
      //   }
      // } catch (error) {
      //   console.error('Failed to fetch product data:', error);
      // }
      this.productInfo = Object.assign({}, info);
      this.productInfo.moq = parseInt(this.productInfo.moq) || 1;
      this.productInfo.mpq = parseInt(this.productInfo.mpq) || 1;
      this.quantity = this.productInfo.moq;
      this.productInfo.sku = info.skuCode || '';
      this.productInfo.discountJson = this.productInfo.quantityDiscount || 0;
      // $('.js-current-img').attr('src', this.productInfo.image).on('load', function() {
      //   $(this).show();
      // }).on('error', function() {
      //   console.error('Failed to load product image');
      // });
      $('.js-current-img').attr('src', '')
      $('.js-current-img').attr('src', this.productInfo.image)
      // $('.js-current-input').attr('value', parseInt(this.productInfo.moq) );
      $('.js-current-input').val(this.productInfo.moq);
      $('#js-quickbuy-price').text(parseFloat(this.productInfo.price).toFixed(2))
      if(this.productInfo.salesUnit) {
        $('#js-quickbuy-unit').text('/' + this.productInfo.salesUnit || '');
      }
      if(this.productInfo.model) {
        $('.js-current-model').html('Model: ' + this.productInfo.model || '');
      }
      if(this.productInfo.skuCode == this.currentInfo.sku) {
        $('#js-view-product-details').hide();
      } else {
        $('#js-view-product-details').show();
      }
      this.getTotalMoney();
      this.openDisabled();
    },
    getTotalMoney: function() {
      const discountJson = this.productInfo.discountJson || null;
      const finalPrice = cartFormModule.computed_price(discountJson, this.productInfo.price, this.quantity);
      $('.js-current-price').html(finalPrice);
    },
    calculateCurrentSkuAttrs: function() {
      if (!this.productInfo.sku || !this.availableAttrs || this.availableAttrs.length === 0) return;
      const currentSkuAttrs = this.availableAttrs.find(item => item.skuCode === this.productInfo.sku);
      if (currentSkuAttrs && currentSkuAttrs.attrs) {
        this.selectedValues = [...currentSkuAttrs.attrs];
      }
    },
    renderSelects: function() {
      if (!this.selectionAttrs || this.selectionAttrs.length === 0) return;
      let html = '';
      for (let i = 0; i < Math.min(2, this.selectionAttrs.length); i++) {
        const attr = this.selectionAttrs[i];
        html += `
          <div class="mb-1.5 fb-big:mb-3 last:mb-0 flex flex-col">
            <label class="text-12 w-full text-left text-main">${attr.attrName}:</label>
            <div class="relative w-8r fb-big:w-12r h-8 mt-1.5">
              <select 
                class="quick-buy-select border border-D3DEF1 rounded-sm w-full h-full text-14 font-bold  focus:border-main focus:border-none pl-2 pr-8 fb-big:pr-10 text-main cursor-pointer appearance-none"
                data-attr-name="${attr.attrName}"
                data-attr-index="${i}"
              >
               ${i > 0 ?"<option value=''>Please select</option>" : ""} 
                ${this.getOptionsHtml(attr, i)}
              </select>
              <div class="pointer-events-none flex absolute right-2 fb-big:right-3 top-0 w-2.5 h-full  items-center justify-center">
                <svg width="14" height="10" viewBox="0 0 14 10" fill="none" xmlns="http://www.w3.org/2000/svg" class="mx-auto">
                  <path d="M8.12627 5.172L12.5127 0.572266L14 2.14698L7.10895 9.42663L0.032792 2.18874C-0.0211316 2.12483 0.000598849 2.08563 0.032792 2.02002C0.213881 1.64764 1.14508 0.985542 1.40585 0.572265L6.03369 5.25722L6.9999 6.20676L8.12627 5.172Z" fill="#0A2B6F"/>
                </svg>
              </div>
            </div>
          </div>
        `;
      }
      $('#js-quickbuy-selectedbox').html(html);
      this.setSelectDefaultValues();
    },
    setSelectDefaultValues: function() {
      if (!this.selectedValues || this.selectedValues.length === 0) return;
      if (this.selectedValues[0]) {
        $(`#js-quickbuy-selectedbox select[data-attr-index="0"]`).val(this.selectedValues[0]);
      }
      this.updateSecondSelect();
      if (this.selectedValues.length > 1 && this.selectedValues[1]) {
        $(`#js-quickbuy-selectedbox select[data-attr-index="1"]`).val(this.selectedValues[1]);
      }
    },
    getOptionsHtml: function(attr, attrIndex) {
      if (!attr || !attr.values) return '';
      if (attrIndex === 0) {
        return attr.values.map(value => 
          `<option value="${value}">${value}</option>`
        ).join('');
      }
      if (attrIndex === 1 && this.selectedValues[0]) {
        const availableValues = this.getAvailableValuesForSecondAttr();
        return attr.values
          .filter(value => availableValues.includes(value))
          .map(value => 
            `<option value="${value}">${value}</option>`
          ).join('');
      }
      return '';
    },
    getAvailableValuesForSecondAttr: function() {
      if (!this.availableAttrs || this.availableAttrs.length === 0 || !this.selectedValues[0]) {
        return [];
      }
      return this.availableAttrs
        .filter(item => item.attrs && item.attrs[0] === this.selectedValues[0])
        .map(item => item.attrs[1])
        .filter(Boolean);
    },
    getDisabled: function() {
      $('#js-quickbuy-add-to-cart').prop('disabled', true);
    },
    openDisabled: function() {
      $('#js-quickbuy-add-to-cart').prop('disabled', false);
    },
    checkAndRedirectToSku: function() {
      const requiredSelectionCount = this.selectionAttrs.length;
      const validSelections = this.selectedValues.filter((val, index) => {
        return index < requiredSelectionCount ? (val && val !== '') : true;
      });
      if (validSelections.length < requiredSelectionCount) {
        this.getDisabled();
        return;
      }
      const matchedSku = this.availableAttrs.find(item => {
        if (!item.attrs) return false;
        for (let i = 0; i < requiredSelectionCount; i++) {
          if (i >= item.attrs.length || item.attrs[i] !== this.selectedValues[i]) {
            return false;
          }
        }
        return true;
      });
      if (matchedSku && matchedSku.skuCode) {
        // console.log('matchedSku', matchedSku);
        this.getProductData(matchedSku);
      } else {
        this.getDisabled();
      }
    },
    increaseQuantity: function() {
      if (!this.productInfo) return;
      const $input = $('.js-current-input');
      const currentValue = parseInt($input.val());
      const moq = this.productInfo.moq || 1;
      const mpq = this.productInfo.mpq || 1;
      let newValue;
      if (currentValue < moq) {
        newValue = moq;
      } else {
        newValue = currentValue + mpq;
      }
      const maxQuantity = cartFormModule.maxQuantity;
      if (newValue > maxQuantity) {
        newValue = maxQuantity;
        $('.js-quick-plus').prop('disabled', true);
      } else {
        $('.js-quick-plus').prop('disabled', false);
      }
      $input.val(newValue);
      $('.js-quick-minus').prop('disabled', false);
      this.quantity = newValue;
      this.getTotalMoney();
    },
    decreaseQuantity: function() {
      if (!this.productInfo) return;
      const $input = $('.js-current-input');
      const currentValue = parseInt($input.val());
      const moq = this.productInfo.moq || 1;
      const mpq = this.productInfo.mpq || 1;
      let newValue;
      if (currentValue <= moq) {
        newValue = moq;
        $('.js-quick-minus').prop('disabled', true);
      } else {
        newValue = currentValue - mpq;
        if (newValue < moq) {
          newValue = moq;
          $('.js-quick-minus').prop('disabled', true);
        } else {
          $('.js-quick-minus').prop('disabled', false);
        }
      }
      $input.val(newValue);
      $('.js-quick-plus').prop('disabled', false);
      this.quantity = newValue;
      this.getTotalMoney();
    },
    bindEvents: function() {
      const self = this;
      $(document).on('change', '#js-quickbuy-selectedbox select[data-attr-index="0"]', function() {
        const selectedValue = $(this).val();
        self.selectedValues[0] = selectedValue;
        self.selectedValues[1] = '';
        self.updateSecondSelect();
        if (selectedValue) {
          self.checkAndRedirectToSku();
        } else {
          self.getDisabled();
        }
      });
      $(document).on('change', '#js-quickbuy-selectedbox select[data-attr-index="1"]', function() {
        const selectedValue = $(this).val();
        self.selectedValues[1] = selectedValue;
        
        if (selectedValue) {
          self.checkAndRedirectToSku();
        } else {
          self.getDisabled();
        }
      });
      $('#js-view-product-details').click(function() {
        if (self.productInfo.sku) {
          window.location.href = `/products/${self.productInfo.sku}`;
        }
      });
      $('#js-quickbuy-add-to-cart').click(function() {
        let $btn = $(this);
        $btn.find('.js-btn-text').addClass('hidden');
        $btn.find('.js-btn-loading').removeClass('hidden');
        const $input = $('.js-current-input')
        cartFormModule.addToCart({
          variantId: self.productInfo.variantId,
          quantity: $input.val() || self.quantity
        }, function() {
          $btn.find('.js-btn-text').removeClass('hidden');
          $btn.find('.js-btn-loading').addClass('hidden');
        });
      });
      $('.js-quick-plus').click(function() {
        self.increaseQuantity();
      });
      $('.js-quick-minus').click(function() {
        self.decreaseQuantity();
      });
      $('.js-current-input').on('change', function() {
        // const $input = $('.js-current-input')
        cartFormModule.validateQuantityInput($(this), self.productInfo, function(newQuantity) {
          $('.js-quick-minus').prop('disabled', newQuantity <= self.productInfo.moq);
          $('.js-quick-plus').prop('disabled', newQuantity >= cartFormModule.maxQuantity);
          self.quantity = newQuantity;
          // $input.val(newQuantity)
          self.getTotalMoney();
        });
      });
    },
    updateSecondSelect: function() {
      if (this.selectionAttrs.length < 2) return;
      const $secondSelect = $('#js-quickbuy-selectedbox select[data-attr-index="1"]');
      if ($secondSelect.length === 0) return;
      const availableValues = this.getAvailableValuesForSecondAttr();
      const attr = this.selectionAttrs[1];
      let html = '<option value="">Please select</option>';
      if (attr && attr.values) {
        html += attr.values
          .filter(value => availableValues.includes(value))
          .map(value => `<option value="${value}">${value}</option>`)
          .join('');
      }
      $secondSelect.html(html);
    }
  };
  productNavBar.init();
  navQuickBuy.init();
  // quickBuy.init();
  let isInitialized = false;
  function throttle(fn, delay) {
    let timer = null;
    let lastTime = 0;
    return function() {
      const now = Date.now();
      if (now - lastTime >= delay) {
        fn.apply(this, arguments);
        lastTime = now;
      }
    }
  }
  function handleVisibility() {
    const quickBuyElement = $('#js-product-quikbuy');
    const mainPaymentContainer = $('.js-cus-product');
    const isMainPaymentVisible = mainPaymentContainer.length && FbIsInViewPort(mainPaymentContainer[0]);
    const shouldShowQuickBuy = window.innerWidth > 1700 && !isMainPaymentVisible;
    const tidioChat = $("#tidio-chat");
    if (shouldShowQuickBuy) {
      quickBuyElement.fadeIn();
      tidioChat.fadeOut();
      if (!isInitialized) {
        quickBuy.init();
        isInitialized = true;
      }
    } else {
      quickBuyElement.fadeOut(); 
      tidioChat.fadeIn();
    }
    if(window.innerWidth < 740) {
      const $bottomAddCart = $(".js-bottom-addcart");
      const isBottomCartVisible = $bottomAddCart.is(':visible');
      if (!isMainPaymentVisible && !isBottomCartVisible) {
        $bottomAddCart.fadeIn();
      } else if (isMainPaymentVisible && isBottomCartVisible) {
        $bottomAddCart.fadeOut();
      }
      // js-bottom-addcart 
    } else if(window.innerWidth > 740) {
    }
    const header = $('#shopify-section-header');
    const isHeaderVisible = header.is(':visible');
    if(isMainPaymentVisible && !isHeaderVisible) {
      header.show();
    } else if(!isMainPaymentVisible && isHeaderVisible) {
      header.hide(); 

    }
   
  }
  handleVisibility();
  const throttledHandler = throttle(handleVisibility, 100);
  $(window).on('scroll resize', throttledHandler);
});