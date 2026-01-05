// 测试反向移动法
// 模拟一个简单的打乱序列，然后测试反向是否能还原

const moves = ['R', 'U', 'F']
console.log('原始打乱序列:', moves)

// 反向移动法逻辑
const reversed = []
for (let i = moves.length - 1; i >= 0; i--) {
  const move = moves[i]
  if (move.endsWith("'")) {
    reversed.push(move.slice(0, -1))
  } else if (move.endsWith('2')) {
    reversed.push(move)
  } else {
    reversed.push(move + "'")
  }
}

console.log('反向序列:', reversed)
console.log('期望结果: ["F\'", "U\'", "R\'"]')
console.log('匹配:', JSON.stringify(reversed) === JSON.stringify(["F'", "U'", "R'"]))
