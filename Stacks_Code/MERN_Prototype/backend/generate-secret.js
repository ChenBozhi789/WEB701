// 生成 JWT Secret 的工具脚本
// 使用方法: node generate-secret.js

const crypto = require('crypto');

// 生成 64 字节（512 位）的随机字符串，转换为 base64 格式
const secret = crypto.randomBytes(64).toString('base64');

console.log('\n=== 生成的 JWT Secret ===');
console.log(secret);
console.log('\n=== 使用方法 ===');
console.log('将上面的字符串复制到 .env 文件中：');
console.log('JWT_SECRET=' + secret);
console.log('\n⚠️  重要提示：');
console.log('1. 这个 secret 只显示一次，请立即保存');
console.log('2. 不要分享给任何人');
console.log('3. 不要提交到 Git 仓库');
console.log('4. 生产环境和开发环境应该使用不同的 secret\n');

