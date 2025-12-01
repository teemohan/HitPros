$(function () {


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
      moq: $('.js-zkh-input').data('moq') || 1,
      mpq: $('.js-zkh-input').data('mpq') || 1,
      discountJson: mainProductUtils.formateDiscountJson('#js-nav-quick'),
      variantId: $('#js-nav-quick').data('variant-id'),
      quantity: $('.js-zkh-input').data('moq') || 1,
      sku: $('#js-product-quikbuy').data('sku') || '',
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
        isShow: true,
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
      // this.bindEvents()

      // 绑定滚动事件
      $(window).on('scroll', throttle(this.handleScroll.bind(this), 10));

      // 初始调用一次
      this.handleScroll();
    },
    handleScroll: function () {
      const scrollTop = $(window).scrollTop();
      const anchorSection = $('.js-anchor-section');
      const headerHeight = $('.site-header').outerHeight() || 0; // 考虑网站头部高度

      // 只有在宽度低于740px时才执行固定定位逻辑
      if (window.innerWidth >= 740) {
        return;
      }

      // 只在第一次调用时计算 anchorOffset
      if (!this.anchorOffset) {
        this.anchorOffset = anchorSection.offset().top;
      }

      // 当滚动超过锚点位置时，添加固定定位
      if (scrollTop > this.anchorOffset - headerHeight) {
        if (!anchorSection.hasClass('is-fixed')) {
          anchorSection.addClass('is-fixed');
          // 添加占位元素防止页面跳动
          if (!$('.anchor-placeholder').length) {
            $('<div class="anchor-placeholder" style="height:' + anchorSection.outerHeight() + 'px"></div>')
              .insertAfter(anchorSection);
          }
        }
      } else {
        if (anchorSection.hasClass('is-fixed')) {
          anchorSection.removeClass('is-fixed');
          $('.anchor-placeholder').remove();
        }
      }
    },
    renderNavTitle: function () {
      let str = '';
      let getArr = [];
      let str_css = 'text-white fb-md:text-121212 text-14 fb-md:text-16 fb-1700:text-18 cursor-pointer shrink-0 fb-1700:w-11r h-full items-center justify-center';
      this.showSection.forEach((item, index) => {
        const $dom = $(item.ele);
        if ($dom.length) {
          $dom.attr('id', item.id);
          getArr.push(item);
          const visibilityClass = item.categorize ? (item.isShow ? 'flex' : 'hidden') : (item.isShow ? 'hidden fb-md:flex' : 'hidden');
          str += `<li class="js-nav-box ${str_css} ${visibilityClass}">
            <a href="#${item.id}" class="js-nav-choose h-full flex items-center justify-center" data-desc="${item.desc}">
              <span class="hidden fb-md:inline">${item.pcCategorize}</span>
              <span class="fb-md:hidden">${item.categorize}</span>
            </a>
          </li>`;
        }
      });
      $('.js-product-anchor').html(str);
      if (getArr.length === 1 && (!getArr[0].categorize)) {
        $('.js-anchor-section').addClass('hidden fb-md:block');
      }
      if (getArr.length === 0) {
        $('.js-anchor-section').hide();
      }
      // mainProductUtils.checkElementDisplay('#judgeme_product_reviews', 10000, function (bol) {
      //   if (bol) {
      //     $('.js-review-container').removeClass('invisible')
      //     $('.sky-single-reviews').removeClass('invisible')
      //      $('.js-review-container').removeClass('h-0')
      //     $(`.js-nav-choose[data-desc='Reviews']`).closest('li').removeClass('hidden').addClass('flex');
      //   } else {
      //     $('.js-review-container').hide();
      //     $(`.js-nav-choose[data-desc='Reviews']`).closest('li').hide();
      //   }
      // });
    },
    // bindEvents: function () {
    //   $('.js-product-anchor').on('click', '.js-nav-choose', function (e) {
    //     if(window.innerWidth > 746) {
    //       e.preventDefault();
    //       productNavBar.currentSelectedItem = $(this).attr('href');
    //       const targetId = $(this).attr('href');
    //       const target = document.querySelector(targetId);
    //       if (target) {
    //         const headerHeight = $('.js-anchor-section').outerHeight() || 0;
    //         const targetPosition = $(target).offset().top - headerHeight
    //         window.scrollTo({
    //           top: targetPosition,
    //           behavior: 'smooth'
    //         });
    //       }
    //     }
    //   });
    // },
    initGumshoe: function () {
      if (this.gumshoeInstance && typeof this.gumshoeInstance.destroy === 'function') {
        this.gumshoeInstance.destroy();
      }
      this.gumshoeInstance = new Gumshoe('.js-nav-choose', {
        offset: 80,
        reflow: true,
        nested: true,
        throttle: 30,
        callback: ((nav) => {
          if (!nav) return;
          $('.js-product-anchor li').removeClass('active');
          $(nav).parent().addClass('active');
          this.currentSelectedItem = $(nav).attr('href');
        })
      });
    }
  };
  const pdpAddCart = {
    quantity: 1,
    productInfo: null,
    init: function () {
      this.productInfo = Object.assign({}, mainProductInfo.info);
      this.quantity = this.productInfo.moq;
      this.getTotalMoney();
      this.bindEvents();
    },
    changeQuantityCss: function () {
      const $discountSpaces = $('.js-discount-space');
      $discountSpaces.removeClass('discount-price-selected');
      const currentQuantity = this.quantity;
      $discountSpaces.each(function () {
        const $this = $(this);
        const min = parseInt($this.data('min')) || 1;
        const max = parseInt($this.data('max')) || Infinity;
        if (currentQuantity >= min && (isNaN(max) || currentQuantity <= max)) {
          $this.addClass('discount-price-selected');
          return false;
        }
      });
    },
    getTotalMoney: function () {
      const finalPrice = QuantityUtils.calculateTotalPrice(this.productInfo, this.quantity);
      // const finalPrice2 = QuantityUtils.calculateTotalPrice(this.productInfo, this.quantity, 'price1');
      $('.js-nav-current-price').html(finalPrice);
      // $('.js-nav-current-price2').html(finalPrice2);
      document.dispatchEvent(new CustomEvent('quantitySelectorUpdated', { detail: this.quantity }));
      this.changeQuantityCss()
    },
    decreaseQuantity: function () {
      const self = this;
      this.quantity = QuantityUtils.decreaseQuantity({
        $input: $('.js-zkh-input'),
        $plusBtn: $('.js-zkh-plus'),
        $minusBtn: $('.js-zkh-minus'),
        productInfo: this.productInfo,
        onQuantityChange: function (newQuantity) {
          self.quantity = newQuantity;
          self.getTotalMoney();
          $('.js-zkh-input').attr('data-demand', newQuantity)
        }
      });
    },
    increaseQuantity: function () {
      const self = this;
      this.quantity = QuantityUtils.increaseQuantity({
        $input: $('.js-zkh-input'),
        $plusBtn: $('.js-zkh-plus'),
        $minusBtn: $('.js-zkh-minus'),
        productInfo: this.productInfo,
        onQuantityChange: function (newQuantity) {
          self.quantity = newQuantity;
          self.getTotalMoney();
          $('.js-zkh-input').attr('data-demand', newQuantity)
        }
      });
    },
    bindEvents: function () {
      const self = this;
      $('.js-zkh-addtocart').click(function () {
        let $btn = $(this);
        const $input = $('.js-zkh-input')
        $btn.find('.js-btn-text').addClass('hidden');
        $btn.find('.js-btn-loading').removeClass('hidden');
        cartFormModule.addToCart({
          variantId: self.productInfo.variantId,
          quantity: $input.val() || self.quantity
        }, function () {
          $btn.find('.js-btn-text').removeClass('hidden');
          $btn.find('.js-btn-loading').addClass('hidden');
        });
      });
      $('.js-zkh-plus').click(function () {
        self.increaseQuantity();
      });
      $('.js-zkh-minus').click(function () {
        self.decreaseQuantity();
      });
      QuantityUtils.bindInputChangeEvent({
        $input: $('.js-zkh-input'),
        $plusBtn: $('.js-zkh-plus'),
        $minusBtn: $('.js-zkh-minus'),
        productInfo: self.productInfo,
        onQuantityChange: function (newQuantity) {
          self.quantity = newQuantity;
          $('.js-zkh-input').val(newQuantity);
          $('.js-zkh-input').attr('data-demand', newQuantity)
          self.getTotalMoney();
        }
      });
    }
  };
  productNavBar.init();
  pdpAddCart.init();

  let isInitialized = false;
  function throttle(fn, delay) {
    let timer = null;
    let lastTime = 0;
    return function () {
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
      // big b2b
      if (!window.themeVariables.userCompany.showCatalogPrice) {
        quickBuyElement.removeClass('hidden');
      }
      tidioChat.fadeOut();
      if (!isInitialized) {
        // quickBuy.init();
        isInitialized = true;
      }
    } else {
      quickBuyElement.addClass('hidden');
      tidioChat.fadeIn();
    }
    const $bottomAddCart = $(".js-bottom-addcart");
    const isBottomCartVisible = $bottomAddCart.is(':visible');
    const ispayment = $('.product-form__buy-buttons')
    const isButtonVisible = ispayment.length && FbIsInViewPort(ispayment[0]);
    if (window.innerWidth < 740) {
      if (!isButtonVisible) {
        $bottomAddCart.fadeIn();
      } else if (isButtonVisible && isBottomCartVisible) {
        $bottomAddCart.fadeOut();
      }
      // js-bottom-addcart 
    } else if (window.innerWidth > 740) {
      if (isBottomCartVisible) {
        $bottomAddCart.fadeOut();
      }
    }

    const header = $('#shopify-section-header');
    const isHeaderVisible = header.is(':visible');
    if (isMainPaymentVisible && !isHeaderVisible) {
      header.show();
    } else if (!isMainPaymentVisible && isHeaderVisible) {
      header.hide();
    }
  }
  handleVisibility();
  const throttledHandler = throttle(handleVisibility, 100);
  $(window).on('scroll resize', throttledHandler);
});