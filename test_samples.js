/**
 * 毕业论文测试样本集 (共 30 个 JavaScript 函数)
 * 分为三类：基础算法类 (1-10)、数据处理类 (11-20)、业务逻辑类 (21-30)
 * 这些样本用于验证 LLM 生成单元测试的准确性、通过率及覆盖率。
 */

// ==========================================
// 第一类：基础算法类 (10个)
// ==========================================

/**
 * 1. 斐波那契数列 (递归实现)
 */
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

/**
 * 2. 快速排序
 */
function quickSort(arr) {
  if (arr.length <= 1) return arr;
  const pivot = arr[arr.length - 1];
  const left = [];
  const right = [];
  for (let i = 0; i < arr.length - 1; i++) {
    if (arr[i] < pivot) left.push(arr[i]);
    else right.push(arr[i]);
  }
  return [...quickSort(left), pivot, ...quickSort(right)];
}

/**
 * 3. 二分查找
 */
function binarySearch(arr, target) {
  let left = 0;
  let right = arr.length - 1;
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return -1;
}

/**
 * 4. 冒泡排序
 */
function bubbleSort(arr) {
  const n = arr.length;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
      }
    }
  }
  return arr;
}

/**
 * 5. 判断是否为质数
 */
function isPrime(num) {
  if (num <= 1) return false;
  for (let i = 2; i <= Math.sqrt(num); i++) {
    if (num % i === 0) return false;
  }
  return true;
}

/**
 * 6. 阶乘 (迭代实现)
 */
function factorial(n) {
  if (n < 0) return undefined;
  let res = 1;
  for (let i = 2; i <= n; i++) res *= i;
  return res;
}

/**
 * 7. 字符串反转
 */
function reverseString(str) {
  return str.split('').reverse().join('');
}

/**
 * 8. 查找数组中的最大值
 */
function findMax(arr) {
  if (arr.length === 0) return undefined;
  return Math.max(...arr);
}

/**
 * 9. 判断回文字符串
 */
function isPalindrome(str) {
  const cleanStr = str.replace(/[^A-Za-z0-9]/g, '').toLowerCase();
  return cleanStr === cleanStr.split('').reverse().join('');
}

/**
 * 10. 数组去重
 */
function uniqueArray(arr) {
  return [...new Set(arr)];
}

// ==========================================
// 第二类：数据处理类 (10个)
// ==========================================

/**
 * 11. URL 参数解析
 */
function parseQueryParams(url) {
  const params = {};
  const search = url.split('?')[1];
  if (!search) return params;
  search.split('&').forEach(pair => {
    const [key, value] = pair.split('=');
    params[decodeURIComponent(key)] = decodeURIComponent(value || '');
  });
  return params;
}

/**
 * 12. 邮箱格式校验 (简单正则)
 */
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

/**
 * 13. 深拷贝 (JSON 序列化简易版)
 */
function deepCloneSimple(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * 14. 格式化日期 (YYYY-MM-DD)
 */
function formatDate(date) {
  const d = new Date(date);
  let month = '' + (d.getMonth() + 1);
  let day = '' + d.getDate();
  const year = d.getFullYear();
  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;
  return [year, month, day].join('-');
}

/**
 * 15. 驼峰命名转连字符命名 (camelCase -> camel-case)
 */
function camelToKebab(str) {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

/**
 * 16. 展平嵌套数组
 */
function flattenArray(arr) {
  return arr.reduce((acc, val) => 
    Array.isArray(val) ? acc.concat(flattenArray(val)) : acc.concat(val), []
  );
}

/**
 * 17. 对象数组按属性排序
 */
function sortByProperty(arr, prop) {
  return [...arr].sort((a, b) => (a[prop] > b[prop] ? 1 : -1));
}

/**
 * 18. 统计字符串中各字符出现频率
 */
function getCharFrequency(str) {
  const freq = {};
  for (let char of str) {
    freq[char] = (freq[char] || 0) + 1;
  }
  return freq;
}

/**
 * 19. 截断字符串并添加省略号
 */
function truncateString(str, num) {
  if (str.length <= num) return str;
  return str.slice(0, num) + '...';
}

/**
 * 20. 判断对象是否为空
 */
function isEmptyObject(obj) {
  return Object.keys(obj).length === 0 && obj.constructor === Object;
}

// ==========================================
// 第三类：业务逻辑类 (10个)
// ==========================================

/**
 * 21. 购物车总价计算 (含折扣和税费)
 */
function calculateCartTotal(items, discountCode) {
  let subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  if (discountCode === 'SAVE10') subtotal *= 0.9;
  const tax = subtotal * 0.08;
  return parseFloat((subtotal + tax).toFixed(2));
}

/**
 * 22. 用户权限校验
 */
function hasPermission(user, requiredRole, action) {
  if (!user || !user.roles) return false;
  if (user.roles.includes('admin')) return true;
  if (user.roles.includes(requiredRole)) {
    return user.permissions && user.permissions.includes(action);
  }
  return false;
}

/**
 * 23. 密码强度校验 (长度、数字、大小写字母)
 */
function checkPasswordStrength(password) {
  if (password.length < 8) return 'weak';
  const hasNumber = /\d/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  if (hasNumber && hasUpper && hasLower) return 'strong';
  if ((hasNumber && hasUpper) || (hasNumber && hasLower) || (hasUpper && hasLower)) return 'medium';
  return 'weak';
}

/**
 * 24. 计算两点间距离 (地理坐标)
 */
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // 地球半径 km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(2));
}

/**
 * 25. 分页逻辑计算
 */
function getPagination(totalItems, currentPage, pageSize) {
  const totalPages = Math.ceil(totalItems / pageSize);
  const start = (currentPage - 1) * pageSize;
  const end = Math.min(start + pageSize, totalItems);
  return {
    currentPage,
    totalPages,
    startIndex: start,
    endIndex: end,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1
  };
}

/**
 * 26. 提取文本中的手机号
 */
function extractPhoneNumbers(text) {
  const regex = /1[3-9]\d{9}/g;
  return text.match(regex) || [];
}

/**
 * 27. 将金额数字转换为大写 (简版)
 */
function convertToChineseCurrency(num) {
  const digits = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖'];
  const units = ['', '拾', '佰', '仟', '万', '拾', '佰', '仟', '亿'];
  let str = Math.floor(num).toString();
  let res = '';
  for (let i = 0; i < str.length; i++) {
    const n = parseInt(str[i]);
    res += digits[n] + units[str.length - i - 1];
  }
  return res + '元整';
}

/**
 * 28. 生成指定长度的随机字符串
 */
function generateRandomId(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let res = '';
  for (let i = 0; i < length; i++) {
    res += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return res;
}

/**
 * 29. 模拟登录请求参数处理
 */
function prepareLoginParams(username, password) {
  return {
    username: username.trim().toLowerCase(),
    password: btoa(password), // 模拟 base64 加密
    timestamp: Date.now()
  };
}

/**
 * 30. 计算两个日期之间的天数差
 */
function getDaysDiff(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2 - d1);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// 导出模块 (CommonJS 规范，方便 Jest 使用)
module.exports = {
  fibonacci, quickSort, binarySearch, bubbleSort, isPrime, factorial, reverseString, findMax, isPalindrome, uniqueArray,
  parseQueryParams, validateEmail, deepCloneSimple, formatDate, camelToKebab, flattenArray, sortByProperty, getCharFrequency, truncateString, isEmptyObject,
  calculateCartTotal, hasPermission, checkPasswordStrength, getDistance, getPagination, extractPhoneNumbers, convertToChineseCurrency, generateRandomId, prepareLoginParams, getDaysDiff
};
