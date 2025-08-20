$(function () {

  // Initialize Vue after DOM is fully loaded
  const getInitPrice2 = () => {
    let basePrice = $('#js-nav-quick').data('price') || 0
    if (basePrice) {
      basePrice = typeof basePrice == 'string' ? parseFloat(basePrice.replace(/,/g, '')) : parseFloat(basePrice);
    }
    return basePrice
  }
  const skypdp = {
      price: getInitPrice2(),
      moq: $('.js-zkh-input').data('moq') || 1,
      mpq: $('.js-zkh-input').data('mpq') || 1,
      discountJson: mainProductUtils.formateDiscountJson('#js-nav-quick'),
      variantId: $('#js-nav-quick').data('variant-id'),
      quantity: $('.js-zkh-input').data('moq') || 1,
      sku: $('#js-product-quikbuy').data('sku') || '',
  };
  function initDelivery () {
    new Vue({
      el: '#delevery-date',
      delimiters: ['${', '}'],
      data() {
        const validateZipCode = (rule, value, callback) => {
          if (!value) {
            return callback(new Error('ZIP Code is required'));
          } else if (value.length !== 5 || isNaN(value)) {
            return callback(new Error('ZIP Code must be 5 digits'));
          } else {
            callback()
          }
        };
        return {
          loading: false,
          isEstimateShow: false,
          stockDateStart: 0,
          stockDateEnd: 0,
          deleveryRes: null,
          ruleForm: {
            zipCode: window.northsky.customerZipCode || ''
          },
          rules: {
            zipCode: [{ validator: validateZipCode, trigger: 'blur' }],
          },
          debounceTimer: null
        };
      },
      created() {
        if(this.ruleForm.zipCode) {
          this.isEstimateShow = true
          this.getInitData('', true);
        } else {
          try {
            getLocalZipCode((value)=> {
              this.ruleForm.zipCode = value;
              this.isEstimateShow = true
              this.getInitData('', true);
            })
          } catch (error) {
          }
        }
      },
      mounted () {
        document.addEventListener('quantitySelectorUpdated', this.quantityChanged);
      },
      methods: {
        quantityChanged(item) {
          if (this.ruleForm.zipCode && this.isEstimateShow) {
            this.deleveryRes = null;
            if (this.debounceTimer) {
              clearTimeout(this.debounceTimer);
            }
            this.debounceTimer = setTimeout(() => {
              this.getInitData(item.detail, false);
            }, 500);
          }
        },
        gobackzip() {
          this.isEstimateShow = false;
        },
        formatDate(timestamp, timezoneOffset = -5) {
          return northSkyformatDate(timestamp, timezoneOffset = -5)
        },
        async getInitData(number, bol) {
           let quantity = 1;
          try {
            this.deleveryRes = null;
            if(!number) {
              const quantitySelector = '.js-quantity-input';
              quantity = +$('.js-quantity-input').attr('data-demand') || 1
           } else {
              quantity = +number
            }
            if(this.isEstimateShow) {
             $('.js-shipping-form-skeleton').show()
            }
            const result = await getDeliveryEstimate({
              zipCode: this.ruleForm.zipCode,
              sku: skypdp.sku,
              quantity: quantity,
              onLoadingChange: (loading) => {
                this.loading = loading;
              },
              onError: (error) => {
                $('.js-shipping-form').removeClass('hidden')
                $('.js-shipping-form-skeleton').hide()
                this.isEstimateShow = false
                if(bol) {
                  return false
                }
                this.$message({
                  showClose: true,
                  message: error.message || 'Failed to get delivery estimate. Please try again.',
                  type: 'error',
                });
              },
              onSuccess: (result) => {
                this.deleveryRes = result.deliveryData;
                this.stockDateStart = result.stockDateStart;
                this.stockDateEnd = result.stockDateEnd;
                this.isEstimateShow = true;
                $('.js-shipping-form').removeClass('hidden')
                $('.js-shipping-form-skeleton').hide()
              }
            });
            return result;
          } catch (error) {
            this.loading = loading;
            console.error('Error fetching delivery data:', error);
          }
        },
        handleComputedDeleveryDate() {
          this.$refs.ruleForm.validate((valid) => {
            if (valid) {
              this.getInitData('', false);
            }
          });
        },
      },
      beforeDestroy() {
        document.removeEventListener('quantitySelectorUpdated', this.quantityChanged);
        if (this.debounceTimer) {
          clearTimeout(this.debounceTimer);
        }
      }
    });
  }
  initDelivery()
  function initReviewApp() {
    new Vue({
      delimiters: ['${', '}'],
      el: '#js-review-section',
      data() {
        return {
          // Tab switching state: 'first' for product reviews, 'second' for store reviews
          activeName: 'first',
          // SKU product review data
          skuTotalScore: 0,
          skuTotalReviews: 0,
          shopTotalReviews: 0,
          // Store review independent data
          storeAfterFilterTotal: 0,
          // Loading and UI states
          isLoading: false,
          afterFilterTotal: 0, // Product reviews filtered total count
          allReviews: [], // Store all loaded product reviews
          allStoreReviews: [], // Store all loaded store reviews
          isViewLess: false, // Flag for View Less state
          showMediaModal: false, // Video modal visibility
          currentMediaUrl: '', // Current video URL for modal
          currentMediaType: '',
          // Initialization flags
          isInitSku: true,
          isInitStroe: true,
          // API query parameters for product reviews
          paramQuery: {
            pageNo: 1,
            pageSize: 3,
            orderAndFilter: 1,
            sku: skypdp.sku, // Test data, do not modify
          },
          // API query parameters for store reviews
          shopQuery: {
            pageNo: 1,
            pageSize: 3,
            orderAndFilter: 1
          },
          // Star rating percentage data
          percentJson: [],
          value: "1", // Product reviews sort value
          storeValue: "1", // Store reviews sort value
          // Review brief data for external sources
          reviewBrief: [
            {
              "source": "trustpilot",
              "rating": 4.5,
              "totalReview": 169
            },
            {
              "source": "google",
              "rating": 4.6,
              "totalReview": 174
            }
          ],
          // Sort options for reviews
          sortArr: [
            {
              name: 'Most Recent',
              value: "1"
             },
              {
              name: 'Highest Rating',
              value: "2"
             },
             {
              name: 'Lowest Rating',
              value: "3"
             },
             {
              name: 'Only Pictures',
              value: "4"
             },
             {
              name: 'Pictures First',
              value: "5"
             },
             {
              name: 'Videos First',
              value: "6"
             }
          ]
        }
      },
      computed: {
        // Get currently displayed reviews based on active tab
        displayedReviews() {
          if (this.activeName === 'first') {
            if (this.isViewLess) {
              return this.allReviews.slice(0, this.paramQuery.pageSize);
            }
            return this.allReviews
          } else {
            // For store reviews, return current page data (already paginated from server)
            return this.allStoreReviews;
          }
        },
        // Check if there are more reviews to load
        hasMoreReviews() {
          if (this.activeName === 'first') {
            if (this.isViewLess) {
              return this.allReviews.length > this.paramQuery.pageSize;
            }
            return this.allReviews.length < this.afterFilterTotal;
          } else {
            // For store reviews, check if current page has data
            return this.allStoreReviews.length > 0;
          }
        },
        // Get current page for store reviews
        currentStorePage() {
          return this.shopQuery.pageNo;
        },
        // Get total pages for store reviews
        storeTotalPages() {
          return Math.ceil(this.storeAfterFilterTotal / this.shopQuery.pageSize);
        }
      },
      watch: {
        // Watch product reviews sort value changes
        value(newVal) {
          if (this.activeName === 'first') {
            this.resetAndLoadReviews();
          }
        },
        // Watch store reviews sort value changes
        storeValue(newVal) {
          if (this.activeName === 'second') {
            this.resetAndLoadReviews();
          }
        }
      },
      created() {
        // Component created lifecycle hook
      },
      mounted() {
        // Initially show skeleton screen
        this.isLoading = true;
        // Load product and store reviews by default
        this.getReviewCount();
        this.getStoreReviewCount();
        
        // Add keyboard event listener
        document.addEventListener('keydown', this.handleKeydown);
      },
      beforeDestroy() {
        // Remove keyboard event listener
        document.removeEventListener('keydown', this.handleKeydown);
      },
      methods: {
        // Handle tab click to switch between product and store reviews - only for display and hide
        handleClick(tab) {
          if (this.activeName !== tab.name) {
            this.activeName = tab.name;
            this.isViewLess = false;
          }
        },
        // Format count based on total reviews percentage
        formatPercent(count) {
          if (this.skuTotalReviews == 0) return '0';
          return `${Math.round((count / 100) * this.skuTotalReviews)}`;
        },
        // Calculate star rating percentages based on review counts
        calculatePercentages(starCounts, totalReviews = null) {
          const total = totalReviews || this.skuTotalReviews;
          return starCounts.map(item => ({
            rating: item.rating,
            percentage: total > 0 ? Math.round((item.count / total) * 100) : 0,
            ratingCount: item.count
          })).sort((a, b) => b.rating - a.rating);
        },

        // Reset pagination and reload reviews based on current tab
        async resetAndLoadReviews() {
          this.isLoading = true;
          
          if (this.activeName === 'first') {
            // Product reviews
            this.paramQuery.pageNo = 1;
            this.allReviews = [];
            this.paramQuery.orderAndFilter = parseInt(this.value);
            await this.getReviewCount();
          } else {
            // Store reviews
            this.shopQuery.pageNo = 1;
            this.allStoreReviews = [];
            this.shopQuery.orderAndFilter = parseInt(this.storeValue);
            await this.getStoreReviewCount();
          }
          
          this.isViewLess = false;
        },
        // Render rate HTML by cloning content from header rate view
        renderRateHtml() {
          const reviewContainer = $('.sky-single-reviews');
          const sourceRateView = $('.js-pdp-header-rateview').first();
          if (reviewContainer.length && sourceRateView.length && this.skuTotalReviews > 0) {
            const clonedContent = sourceRateView.html();
            reviewContainer.html(clonedContent).removeClass('hidden');
          }
        },
        // Get product review count and data from API
        async getReviewCount() {
          try {
            this.isLoading = true;
            const res = await kkAjax.post('/openapi/adlink/product/review', this.paramQuery);
            if (res && res.data) {
              const data = res.data;
              this.afterFilterTotal = data.afterFilterTotal || 0;
              if(this.isInitSku) {
                this.skuTotalReviews = data.totalReviews || 0;
                this.skuTotalScore = data.totalScore || 0;
                if(data.starCounts) {
                   this.percentJson = this.calculatePercentages(data.starCounts);
                }
                this.isInitSku = false
                this.$nextTick(() => {
                  this.renderRateHtml()
                });
                $('.js-review-customer').removeClass('hidden')
                // $(`.js-nav-choose[data-desc='Reviews']`).closest('li').removeClass('hidden').addClass('flex');
              }
              if (data.reviews) {
                if (this.paramQuery.pageNo == 1) {
                  this.allReviews = [...data.reviews];
                } else {
                  this.allReviews = [...this.allReviews, ...data.reviews];
                }
              }
              
              this.updateViewMoreState();
            } else {
              this.activeName = 'second'
            }
          } catch (error) {
            console.error('Failed to load review data:', error);
          } finally {
            $('.js-review-animate').addClass('hidden')
            this.isLoading = false;
          }
        },
        // Load more reviews based on current active tab
        async loadMoreReviews() {
          if (this.activeName === 'first') {
            // Load more product reviews
            this.paramQuery.pageNo += 1;
            await this.getReviewCount();
          } else {
            // Load more store reviews
            this.shopQuery.pageNo += 1;
            await this.getStoreReviewCount();
          }
        },
        // Reset to first page view state
        resetToFirstPage() {
          this.isViewLess = true;
          this.updateViewMoreState();
        },
        // Update view more state based on current reviews and total
        updateViewMoreState() {
          this.showViewMore = this.hasMoreReviews;
        },
        // Handle view more button click
        async handleViewMore() {
          if (this.isViewLess) {
            // If in View Less state, directly show loaded reviews
            this.isViewLess = false;
            this.updateViewMoreState();
          } else {
            // Otherwise load more reviews
            await this.loadMoreReviews();
          }
        },
        // Handle view less button click
        handleViewLess() {
          this.resetToFirstPage();
        },
        // Render review HTML for external review sources
        renderReviewHtml() {
          // Hide all skeleton screens
          $('.js-trustpiolt-skeleton, .js-google-skeleton').addClass('hidden');
          this.reviewBrief.forEach(item => {
            const str_html = ` <span>Score ${item.rating}</span> <span class="w-0.5 border-r border-EAEEF1"></span><span> ${item.totalReview > 1 ? item.totalReview + ' reviews' : 'review'}</span>`
            if(item.source == 'trustpilot') {
              $('.js-trustpiolt-review').html(str_html).removeClass('hidden');
            } else if(item.source == 'google') {
              $('.js-google-review').html(str_html).removeClass('hidden');
            }
          });
          // If no corresponding data, show default content and hide skeleton
          const hasTrustpilot = this.reviewBrief.some(item => item.source === 'trustpilot');
          const hasGoogle = this.reviewBrief.some(item => item.source === 'google');
          if (!hasTrustpilot) {
            $('.js-trustpiolt-skeleton').addClass('hidden');
            $('.js-trustpiolt-review').removeClass('hidden');
          }
          if (!hasGoogle) {
            $('.js-google-skeleton').addClass('hidden');
            $('.js-google-review').removeClass('hidden');
          }
        },
        // Get store review count and data from API
        async getStoreReviewCount() {
          try {
            this.isLoading = true;
            const res = await kkAjax.post('/openapi/adlink/store/review', this.shopQuery);
            if (res && res.data) {
              const data = res.data;
              this.storeAfterFilterTotal = data.afterFilterTotal || 0;
              if(this.isInitStroe) {
                this.isInitStroe = false;
                this.reviewBrief = data.reviewBrief
                this.shopTotalReviews = data.reviewBrief.reduce((total, review) => total + review.totalReview, 0);
                this.$nextTick(() => {
                  this.renderReviewHtml()
                });
                $('.js-review-customer').removeClass('hidden')
              }
              if (data.reviews) {
                // For store reviews pagination, replace current page data
                this.allStoreReviews = [...data.reviews];
              }
              this.updateViewMoreState();
            } else {
              if(this.isInitStroe) {
                $(`.js-nav-choose[data-desc='Reviews']`).closest('li').hide();
              }
            }
          } catch (error) {
            if(this.isInitStroe) {
              $(`.js-nav-choose[data-desc='Reviews']`).closest('li').hide();
            }
          } finally {
            $('.js-review-animate').addClass('hidden')
            this.isLoading = false;
          }
        },
        // pauseOtherVideos(event) {
        //   const currentVideo = event.target;
        //   const allVideos = document.querySelectorAll('#js-review-section video');
        //   allVideos.forEach(video => {
        //     if (video !== currentVideo && !video.paused) {
        //       video.pause();
        //     }
        //   });
        // },
        // Open video modal with specified video URL
        openMediaModal(mediaUrl, mediaType, index) {
          this.currentMediaUrl = mediaUrl;
          this.currentMediaType = mediaType;
          this.showMediaModal = true;
          // Prevent background scrolling
          document.body.style.overflow = 'hidden';
        },
        // Close video modal and reset state
        closeMediaModal() {
          this.showMediaModal = false;
          this.currentMediaUrl = '';
          this.currentMediaType = '';
          // Restore background scrolling
          document.body.style.overflow = '';
          // Pause video if it exists
          if (this.$refs.modalVideo) {
            this.$refs.modalVideo.pause();
          }
        },
        // Handle keyboard events for modal control
        handleKeydown(event) {
          // ESC key closes video modal
          if (event.key === 'Escape' && this.showMediaModal) {
            this.closeVideoModal();
          }
        },
        // Handle store review pagination change
        async handleStorePageChange(page) {
          this.shopQuery.pageNo = page;
          this.allStoreReviews = []
          await this.getStoreReviewCount();
          // Scroll to the top of the review section after successful data loading
          this.$nextTick(() => {
            const reviewSection = document.getElementById('review-content-tab');
            if (reviewSection) {
              reviewSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          });
        }
      }
    });
  }
  initReviewApp();
      function initProductCompare () {
      const productCompare = new Vue({
        el: '#product-compare',
        delimiters: ['${', '}'],
        data() {
          return {
            compareData: [],
            openCompare: false,
            maxDiscount: 50, // Default value, will be updated from API
            comparisonType: 1,
            hasModel: false,
          }
        },
        async created() {
          await this.initialData()
        },
        methods: {
          async initialData() {
            // Simulate data loading process
            try{
              const res = await kkAjax.get(`/openapi/adlink/product/compare?sku=${skypdp.sku}`);
              if (res && res.data && res.data.length > 0) {
                const currentPrice = skypdp.price; // This should be the actual current product price
                this.compareData = res.data.map((item)=> {
                  item.percentage = (item.percentage * 100).toFixed(0)
                  item.absoluteOff = parseFloat(item.absoluteOff).toFixed(2)
                  if(item.model && !this.hasModel) {
                    this.hasModel = true
                  }
                  return item
                })
                this.comparisonType = res.data[0].comparisonType
                this.maxDiscount = res.data[0].comparisonType == 1 ? res.data[0].absoluteOff : res.data[0].percentage
                document.querySelector('.js-product-compare-content').classList.remove('hidden')
              }
            } catch (error) {
            } finally {
              document.querySelector('.js-product-compare-skenon').classList.add('hidden')
            }
          },
          pullMore() {
            this.openCompare = !this.openCompare
          }
        }
      })
    }
    initProductCompare()
})