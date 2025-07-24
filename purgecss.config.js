module.exports = {
  content: ['./shopify/**/*.{liquid,js}'],
  css: ['./shopify/assets/*.css'],
  output: './copy/assets/purged/',
  safelist: [
    // 保护 Swiper 相关类名
    /^swiper-/,
    // 保护 Element UI 相关类名
    /^el-/,
    // 保护 Vue 相关类名
    /^vue-/,
    // 保护 JavaScript 动态添加的类名
    /^js-/,
    // 保护第三方插件类名
    'flickity',
    'photoswipe',
    // 保护伪元素
    /::?before/,
    /::?after/,
    // 保护常用工具类
    'hidden',
    'block',
    'flex',
    'grid',
    'active',
    'open',
    'closed',
    // 保护响应式类名
    /^sm:/,
    /^md:/,
    /^lg:/,
    /^xl:/,
    // 保护状态类名
    /^hover:/,
    /^focus:/,
    /^active:/
  ]
};
