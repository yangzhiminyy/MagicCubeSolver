// 测试 cube-solver 的 API
// 检查它是否接受 cubestring 或 scramble

const { solve } = require('cube-solver');

console.log('测试 cube-solver API');
console.log('='.repeat(60));

// 测试1: 使用 cubestring（54字符）
const cubestring = 'UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB';
console.log('\n测试1: 使用 cubestring');
console.log('输入:', cubestring);
try {
  const result1 = solve(cubestring, 'kociemba');
  console.log('结果:', result1);
  console.log('类型:', typeof result1);
} catch (error) {
  console.error('错误:', error.message);
}

// 测试2: 使用 scramble（移动序列）
const scramble = "R U R' U'";
console.log('\n测试2: 使用 scramble');
console.log('输入:', scramble);
try {
  const result2 = solve(scramble, 'kociemba');
  console.log('结果:', result2);
  console.log('类型:', typeof result2);
} catch (error) {
  console.error('错误:', error.message);
}

// 测试3: 使用单步 R 的 cubestring
const rCubestring = 'UUFUUFUUFRRRRRRRRRFFDFFDFFDDDBDDBDDBLLLLLLLLLUBBUBBUBB';
console.log('\n测试3: 使用单步 R 的 cubestring');
console.log('输入:', rCubestring);
try {
  const result3 = solve(rCubestring, 'kociemba');
  console.log('结果:', result3);
  console.log('类型:', typeof result3);
} catch (error) {
  console.error('错误:', error.message);
}
