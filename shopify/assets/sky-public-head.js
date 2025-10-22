$(function() {
   async function getTree () {
    try {
      const response = await fetch(`${window.northsky.api}/openapi/adlink/product/collection/tree`, {
        method: 'GET',
      });
      const { data } = await response.json();
      localStorage.setItem('all-category', JSON.stringify(data));
      document.dispatchEvent(new CustomEvent('tree-get', { detail: {
        data,
      }}));
    } catch (err) {
      console.error(err);
    }
   }
   getTree();
   function mobInitVue() {
      new Vue({
        el: '#mobile-menu-nav',
        delimiters: ['${', '}'],
        mounted() {
          this.getAllList();
        },
        data() {
          return {
            menuData: [], // Store complete menu data
            currentLevel: 1,
            levelHistory: [1], // Used to record level history
            menuPath: [], // Store menu items on current path
            currentMenuData: [], // Current level menu data
            isLocalizationOpen: false,
            localizationData: {
              mode: '', // 'country', 'language', 'currency'
              currentList: [],
              country: {
                current: { name: 'United States', code: 'US', currency: 'USD' },
                list: [
                  { name: 'United States', code: 'US', currency: 'USD' },
                  { name: 'France', code: 'FR', currency: 'EUR €' },
                  { name: 'Germany', code: 'DE', currency: 'EUR €' },
                  { name: 'Switzerland', code: 'CH', currency: 'CHF CHF' },
                  { name: 'Belgium', code: 'BE', currency: 'EUR €' },
                  { name: 'Luxembourg', code: 'LU', currency: 'EUR €' },
                  { name: 'Netherlands', code: 'NL', currency: 'EUR €' },
                  { name: 'Austria', code: 'AT', currency: 'EUR €' },
                  { name: 'Italy', code: 'IT', currency: 'EUR €' },
                  { name: 'Spain', code: 'ES', currency: 'EUR €' },
                  { name: 'Poland', code: 'PL', currency: 'PLN zł' },
                  { name: 'Czechia', code: 'CZ', currency: 'CZK Kč' },
                  { name: 'Hungary', code: 'HU', currency: 'HUF Ft' }
                ]
              },
              language: {
                current: { name: 'English', code: 'en', endonym: 'English' },
                list: [
                  { name: 'English', code: 'en', endonym: 'English' },
                  { name: 'Spanish', code: 'es', endonym: 'Español' },
                  { name: 'German', code: 'de', endonym: 'Deutsch' },
                  { name: 'Italian', code: 'it', endonym: 'Italiano' },
                  { name: 'Portuguese', code: 'pt', endonym: 'Português' },
                  { name: 'Russian', code: 'ru', endonym: 'Русский' },
                ]
              },
              currency: {
                current: { code: 'USD', symbol: '$' },
                list: [
                  { code: 'USD', symbol: '$' },
                  { code: 'EUR', symbol: '€' },
                  { code: 'CHF', symbol: 'CHF' }
                ]
              }
            }
          }
        },
        methods: {
          closeMenu() {
            this.resetData();
            $('body').removeClass('no-scroll');
            $('.mobile-menu-nav').removeClass('nav-open');
          },
          resetData() {
            this.currentLevel = 1;
            this.levelHistory = [1];
            this.menuPath = [];
            this.currentMenuData = this.menuData;
            this.isLocalizationOpen = false;
            this.localizationData.mode = '';
            this.localizationData.currentList = [];
          },
          openLocalization(mode) {
            this.isLocalizationOpen = true;
            this.localizationData.mode = mode;
            this.localizationData.currentList = this.localizationData[mode].list;
          },
          handleLocalizationSelect(item) {
            this.localizationData[this.localizationData.mode].current = item;
            // 这里添加实际的本地化切换逻辑
            this.isLocalizationOpen = false;
            this.localizationData.mode = '';
          },
          goBack() {
            if (this.isLocalizationOpen) {
              this.isLocalizationOpen = false;
              this.localizationData.mode = '';
              return;
            }
            if (this.levelHistory.length > 1) {
              this.levelHistory.pop();
              this.menuPath.pop();
              this.currentLevel = this.levelHistory[this.levelHistory.length - 1];
              this.updateCurrentMenuData();
            }
          },
          getCurrentTitle() {
            if (this.isLocalizationOpen) {
              const titles = {
                country: 'Select Country',
                language: 'Select Language',
                currency: 'Select Currency'
              };
              return titles[this.localizationData.mode];
            }
            return this.getCurrentLevelTitle();
          },
          handleMenuClick(menu) {
            if (this.hasChildren(menu)) {
              // Has submenu, enter next level
              this.menuPath.push(menu);
              this.currentLevel++;
              this.levelHistory.push(this.currentLevel);
              this.updateCurrentMenuData();
            } else {
              // No submenu, navigate to collection page
              this.navToCollection(menu);
            }
          },
          hasChildren(menu) {
            return menu.children && menu.children.length > 0;
          },
          isLastLevel() {
            // Check if all menu items at current level have no submenus
            return this.currentMenuData.every(menu => !this.hasChildren(menu));
          },
          updateCurrentMenuData() {
            let data = this.menuData;
            // Get current level data based on path
            for (let i = 0; i < this.menuPath.length; i++) {
              const pathItem = this.menuPath[i];
              const foundItem = data.find(item => item.handle === pathItem.handle);
              if (foundItem && foundItem.children) {
                data = foundItem.children;
              }
            }
            this.currentMenuData = data.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
          },
          getCurrentMenuData() {
            return this.currentMenuData;
          },
          getCurrentLevelTitle() {
            if (this.menuPath.length === 0) {
              return 'Product Categories';
            }
            return this.menuPath[this.menuPath.length - 1].name;
          },
          navToCollection(menu) {
            window.location.href = `/collections/${menu.handle}`;
          },
          getAllList() {
            function generateHandles(data, parentHandle = '') {
              return data.map(item => {
                const handle = item.name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-');
                const fullHandle = parentHandle ? `${parentHandle}-${handle}` : handle;
                if (item.children && item.children.length > 0) {
                  item.children = generateHandles(item.children, fullHandle);
                }
                item.handle = fullHandle;
                return item;
              });
            }
            document.addEventListener('tree-get', ({ detail }) => {
              this.menuData = generateHandles(detail.data).sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
              this.currentMenuData = this.menuData;
              $('.mobile-menu-nav').show();
            });
          }
        }
      })
    }
    mobInitVue()
    
    function pcInitVue() {
      new Vue({
        el: '#pc-menu-nav',
        mounted() {
          this.getAllList();
        },
        data() {
          return {
            menuData: [], // Store complete menu data
            visibleLevels: [], // Store currently visible level data
            hoverPath: [], // Store current hover path
            maxVisibleLevels: 4 // Maximum 3 columns displayed simultaneously
          }
        },
        methods: {
          closeMenu() {
            this.resetData();
            $('body').removeClass('no-scroll');
            $('.pc-menu-nav').removeClass('nav-open');
          },
          getCurrentCategoryName(levelIndex) {
            if (levelIndex === 0) {
              return 'All Categories';
            } else if (this.hoverPath[levelIndex - 1]) {
              return this.hoverPath[levelIndex - 1].name;
            }
            return ''
          },
          resetData() {
            this.clearAllSelections();
            this.hoverPath = [];
            this.visibleLevels = [{
              data: this.menuData,
              level: 1
            }];
          },
          clearAllSelections() {
            const clearSelection = (items) => {
              items.forEach(item => {
                item.isSelected = false;
                if (item.children) {
                  clearSelection(item.children);
                }
              });
            };
            clearSelection(this.menuData);
          },
          hasChildren(menu) {
            return menu.children && menu.children.length > 0;
          },
          isLastLevel(levelData) {
            // Check if all menu items at current level have no submenus
            return levelData.every(menu => !this.hasChildren(menu));
          },
          navToCollection(menu) {
            window.location.href = `/collections/${menu.handle}`;
          },
          handleNextMenu(menu, level) {
            // Clear selection status of current level and subsequent levels
            this.clearSelectionsFromLevel(level);
            
            // Set current menu as selected
            menu.isSelected = true;
            
            // Update hover path
            this.hoverPath = this.hoverPath.slice(0, level - 1);
            this.hoverPath.push(menu);
            
            // Update visible levels
            this.updateVisibleLevels();
          },
          clearSelectionsFromLevel(fromLevel) {
            if (fromLevel === 1) {
              this.menuData.forEach(menu => {
                menu.isSelected = false;
              });
            } else if (fromLevel > 1 && this.hoverPath[fromLevel - 2]) {
              const parentMenu = this.hoverPath[fromLevel - 2];
              if (parentMenu.children) {
                parentMenu.children.forEach(menu => {
                  menu.isSelected = false;
                });
              }
            }
            for (let i = fromLevel - 1; i < this.hoverPath.length; i++) {
              if (this.hoverPath[i]) {
                this.clearChildrenSelections(this.hoverPath[i]);
              }
            }
          },
          clearChildrenSelections(parentMenu) {
            if (parentMenu.children) {
              parentMenu.children.forEach(child => {
                child.isSelected = false;
                this.clearChildrenSelections(child);
              });
            }
          },
          updateVisibleLevels() {
            this.visibleLevels = [];
            
            // First level always visible
            this.visibleLevels.push({
              data: this.menuData.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase())),
              level: 1
            });
            
            // Add subsequent levels based on hover path
            let currentData = this.menuData;
            for (let i = 0; i < this.hoverPath.length && i < this.maxVisibleLevels - 1; i++) {
              const hoveredItem = this.hoverPath[i];
              const foundItem = currentData.find(item => item.handle === hoveredItem.handle);
              
              if (foundItem && foundItem.children && foundItem.children.length > 0) {
                this.visibleLevels.push({
                  data: foundItem.children.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase())),
                  level: i + 2
                });
                currentData = foundItem.children;
              } else {
                break;
              }
            }
          },
          async getAllList() {
            function generateHandles(data, parentHandle = '') {
              return data.map(item => {
                const handle = item.name
                  .toLowerCase()
                  .replace(/[^a-z0-9\s-]/g, '')
                  .trim()
                  .replace(/\s+/g, '-')
                  .replace(/-+/g, '-');
                
                const fullHandle = parentHandle ? `${parentHandle}-${handle}` : handle;
                
                if (item.children && item.children.length > 0) {
                  item.children = generateHandles(item.children, fullHandle);
                }
                
                item.handle = fullHandle;
                item.isSelected = false;
                return item;
              });
            }
            
            document.addEventListener('tree-get', ({ detail }) => {
              this.menuData = generateHandles(detail.data).sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
              this.visibleLevels = [{
                data: this.menuData,
                level: 1
              }];
            });
          }
        }
      })
    }
    pcInitVue()

    $.fn.headerMenuHover = function(options) {
      var settings = $.extend({
        showClass: 'js-header-item-show',
        contentClass: 'js-content-show',
        hoverDelay: 100,
        hideDelay: 200
      }, options);
      
      return this.each(function() {
        var $trigger = $(this);
        var $dropdown = $trigger.find('.' + settings.showClass);
        var $content = $dropdown.find('.' + settings.contentClass);
        var showTimer, hideTimer;
        
        // Mouse enters trigger element
        $trigger.on('mouseenter', function() {
          clearTimeout(hideTimer);
          showTimer = setTimeout(function() {
            $dropdown.removeClass('invisible opacity-0').addClass('visible opacity-100');
            $('body').addClass('no-scroll');
          }, settings.hoverDelay);
        });
        
        // Mouse leaves trigger element
        $trigger.on('mouseleave', function() {
          clearTimeout(showTimer);
          hideTimer = setTimeout(function() {
            $dropdown.removeClass('visible opacity-100').addClass('invisible opacity-0');
            $('body').removeClass('no-scroll');
          }, settings.hideDelay);
        });
        
        // Mouse enters dropdown menu area
        $dropdown.on('mouseenter', function() {
          clearTimeout(hideTimer);
        });
        
        // Mouse moves within dropdown menu area
        $dropdown.on('mousemove', function(e) {
          // Check if mouse is within content area
          var isInContent = $content.is(e.target) || $content.has(e.target).length > 0;
          
          if (!isInContent) {
            // Mouse not in content area, hide menu
            clearTimeout(showTimer);
            $dropdown.removeClass('visible opacity-100').addClass('invisible opacity-0');
            $('body').removeClass('no-scroll');
          }
        });
        $dropdown.on('mouseleave', function() {
          hideTimer = setTimeout(function() {
            $dropdown.removeClass('visible opacity-100').addClass('invisible opacity-0');
            $('body').removeClass('no-scroll');
          }, settings.hideDelay);
        });
      });
    };
    $(document).ready(function() {
      $('.js-main-hover').headerMenuHover({
        hoverDelay: 150,
        hideDelay: 300
      });
    });
    function getWishCount() {
      if (window.northsky && window.northsky.customerId) {
        const customerId = window.northsky.customerId;
        
        fetch(`${window.northsky.api}/wish/nums?customerId=${customerId}`)
          .then(response => {
            if (!response.ok) {
              throw new Error('Network response was not ok');
            }
            return response.json();
          })
          .then(data => {
            const $wishLen = $('.wish-len');
            if (data && data.data && data.data.nums) {
              const nums = data.data.nums;
              const displayText = nums > 99 ? '99+' : nums.toString();
              $wishLen.css('display', 'flex')
                      .removeClass('hidden')
                      .text(displayText);
            } else {
              $wishLen.addClass('hidden');
            }
          })
          .catch(error => {
            console.error('Error fetching wish count:', error);
            $('.wish-len').addClass('hidden');
          });
      }
    }
    getWishCount();
    document.addEventListener('wish-refreash', function() {
      getWishCount();
    });

  // Mobile menu operations
  $('.mobile-menu-action').click(function() {
    $('.mobile-menu-nav').addClass('nav-open');
    $('body').addClass('no-scroll');
  });

  // Mobile main menu operations  
  $('#menu-list').on('click', function() {
    $('body').addClass('no-scroll');
    $('#mobile_main_nav1').addClass('nav-open');
  });

  // Footer JavaScript
  // Footer module - includes newsletter and toggle functionality
  const footer = {
    button: document.querySelector('.newsleftter-btn') || '',
    emailInput: document.querySelector('.newsletter-input-row .input__field') || '',
    boundToggleHandler: null,
    
    init: function () {
      // Bind the toggle handler once to maintain reference
      this.boundToggleHandler = this.toggleHandler.bind(this);
      this.initNewsletter();
      this.initToggle();
    },
    
    // Initialize newsletter functionality
    initNewsletter: function () {
      if (this.button && this.emailInput) {
        this.button.addEventListener('click', () => {
          const email = this.emailInput.value;
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          
          if (emailRegex.test(email)) {
            // Send GTM event
            if (typeof dataLayer !== 'undefined') {
              dataLayer.push({
                'event': 'custom_subscribe_submitted',
                'email_submitted': email,
              });
            }
            this.emailInput.value = '';
          } else {
            this.emailInput.value = 'Please enter a valid email address.';
          }
        });
      }
      // Handle email input focus events
      const inputEl = document.querySelector('input[name="contact[email]"]');
      if (inputEl) {
        inputEl.addEventListener('focus', () => {
          const errorBanner = document.querySelector('.banner--error');
          if (errorBanner) {
            errorBanner.style.display = 'none';
          }
        });
      }
      
      // Handle URL parameters and page scrolling
      this.handleUrlParams();
    },
    initToggle: function () {
      this.handleFooterToggle();
      let resizeTimeout;
      $(window).on('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          this.handleFooterToggle();
        }, 250);
      });
    },
    // Handle URL parameters
    handleUrlParams: function () {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('customer_posted') === 'true' || urlParams.get('contact[tags]') === 'newsletter') {
        const url = window.location.href;
        const newUrl = url.split('?')[0];
        window.history.replaceState(null, null, newUrl);
        document.documentElement.scrollTop = document.body.scrollTop = Math.max(
          document.body.scrollHeight,
          document.documentElement.scrollHeight
        );
      }
    },
    
    // Handle footer toggle - jQuery版本
    handleFooterToggle: function () {
      const winWidth = $(window).width();
      const $footerTitles = $('.footer__item-title');
      $footerTitles.off('click.footerToggle');
      if (winWidth <= 1200) {
        $footerTitles
          .css('cursor', 'pointer')
          .on('click.footerToggle', this.toggleHandler.bind(this));
      } else {
        $footerTitles
          .css('cursor', 'default')
          .removeClass('open')
          .each(function() {
            const $title = $(this);
            const $content = $title.closest('.footer__item').find('.footer__item-content');
            const $icon = $title.find('.details_icon');
            
            $content.css('display', '');
            $icon.css('transform', '');
          });
      }
    },
    
    toggleHandler: function (event) {
      event.preventDefault();
      event.stopPropagation();
      const $title = $(event.currentTarget);
      const $content = $title.closest('.footer__item').find('.footer__item-content');
      const $icon = $title.find('.details_icon');
      if ($content.length === 0) return;
      const isOpen = $title.hasClass('open');
      if (isOpen) {
        $title.removeClass('open');
        $content.hide();
        $icon.css('transform', 'rotate(0deg)');
      } else {
        $title.addClass('open');
        $content.show();
        $icon.css('transform', 'rotate(180deg)');
      }
    },
    bindEvents: function () {
      // Add other footer related event bindings here
    }
  };
  footer.init();
  const getThirdLogin = {
    config: {
      getShopConfig() {
        const shopName = window.Shopify?.shop || '';
        if (shopName.includes('testhitpros')) {
          return {
            redirect_uri: 'https://testhitpros.myshopify.com/pages/auth-callback',
            google: {
              client_id: '838599206616-j0ebmno6fnbgic0jc3336blt4970tm8t.apps.googleusercontent.com',
              auth_url: 'https://accounts.google.com/o/oauth2/v2/auth'
            },
            facebook: {
              client_id: '658317203932179',
              auth_url: 'https://www.facebook.com/v19.0/dialog/oauth'
            }
          };
        } else {
          return {
            redirect_uri: 'https://northskysupply.com/pages/auth-callback',
            google: {
              client_id: '534992916289-jp6n2quspp6c5tcg242s6e3voiiak0fj.apps.googleusercontent.com',
              auth_url: 'https://accounts.google.com/o/oauth2/v2/auth'
            },
            facebook: {
              client_id: '1484031379702309',
              auth_url: 'https://www.facebook.com/v19.0/dialog/oauth'
            }
          };
        }
      }
    },
    getReturnUrl() {
      let returnTo = document.referrer;
      if (returnTo.includes('/account/register')) {
        returnTo = window.location.origin + '/account?slug=account-info';
      }
      const urlParams = new URLSearchParams(window.location.search);
      const checkoutUrl = urlParams.get('checkout_url');
      return checkoutUrl || returnTo || window.location.origin + '/account';
    },

    login(provider) {
      const config = this.config.getShopConfig();
      const providerConfig = config[provider];
      if (!providerConfig) {
        console.error(`Provider ${provider} not supported`);
        return;
      }
      const returnUrl = this.getReturnUrl();
      const params = new URLSearchParams({
        client_id: providerConfig.client_id,
        redirect_uri: config.redirect_uri,
        response_type: 'code',
        state: JSON.stringify({ source: provider, returnTo: returnUrl })
      });
      if (provider === 'google') {
        params.append('scope', 'email profile');
        params.append('access_type', 'offline');
      } else if (provider === 'facebook') {
        params.append('scope', 'public_profile,email');
      }
      window.location.href = providerConfig.auth_url + '?' + params.toString();
    },
    init() {
      $(document).off('click.thirdLogin', '.js-third-navlogin');
      $(document).on('click.thirdLogin', '.js-third-navlogin', (e) => {
        e.preventDefault();
        const $button = $(e.currentTarget);
        const provider = $button.data('provider');
        if (provider) {
          this.login(provider);
        }
      })
    }
  };
  getThirdLogin.init();

  const getShopRate = {
    shopQuery: {
      pageNo: 1,
      pageSize: 3,
      orderAndFilter: 1
    },
    reviewBrief: [],
    init: function () {
      this.getStoreReviewCount();
    },
    renderReviewHtml: function () {

    },
    getStoreReviewCount: async function() {
      try {
        this.isLoading = true;
        const res = await kkAjax.post('/openapi/adlink/store/review', this.shopQuery);
        if (res && res.data) {
          console.log("res", res)
          const data = res.data;
          this.reviewBrief = res.data.reviewBrief || []
          console.log("this.reviewBrief", this.reviewBrief)
          this.renderReviewHtml()
        } else {
      
        }
      } catch (error) {
        
      } finally {
      }
    }
  }
  // getShopRate.init()
  $('.js-copy-email').click(function() {
    const email = $(this).data('email');
    navigator.clipboard.writeText(email).then(() => {
      MsgBox && MsgBox.init('Email copied to clipboard!', 2000)
    }).catch(err => {
      MsgBox && MsgBox.init('Copy failed!', 2000)
    });
  })
})