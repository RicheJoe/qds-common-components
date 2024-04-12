// 搜索关键词高亮显示
export function brightKeyword(keyword, val) {
  if (val.indexOf(keyword) !== -1) {
    //判断这个字段中是否包含keyword
    //如果包含的话，就把这个字段中的那一部分进行替换成html字符
    return val.replace(
      keyword,
      `<span style='color:#FF6600'>${keyword}</span>`
    );
  } else {
    return val;
  }
}

/**
 * @description 树形结构化数组 根据parentid 递归
 * @param {*} list  要结构换的数组
 * @param {*} option
 * id  该层级最顶级的id  对应业务 省市区  省级的parent为 3347
 * parentId  父子关系的key值
 * sortKey  排序
 * @returns []
 */
export function flat2nest(list, option = {}) {
  const { id = 3347, parentId = "parent", sortKey = "id" } = option;
  let res = list
    .filter(item => item[parentId] === id)
    .sort((a, b) => a[sortKey] - b[sortKey])
    .map(item => ({
      ...item,
      children:
        flat2nest(list, { id: item.id }).length > 0
          ? flat2nest(list, { id: item.id })
          : []
    }));
  return res;
}
