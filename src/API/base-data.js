import getData from "./index.js";

// 尼斯分类45大类
export function niceAllType(params) {
  return getData(params, "product/niceAllType", "post");
}
// 尼斯分类下级
export function queryNiceListByFirst(params) {
  return getData(params, "product/queryNiceListByFirst", "post");
}
// 尼斯分类搜索
export function queryNiceListByName(params) {
  return getData(params, "product/queryNiceListByName", "post");
}
