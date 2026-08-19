
// 从hash中截取agentCode
export const getAgentCodeFromHash = (hash) => {
  const query = hash.split('?')[1]
  
  if (!query) return ''

  let code = ''

  query.split('&').forEach(pair => {
    const arr = pair.split('=')
    if ((arr[0]) === 'agentCode') {
      code = arr[1]
    }
  })
  return code
}