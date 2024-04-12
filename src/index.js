import { App } from "vue";
import { brightKeyword, flat2nest } from "@/utils/index";

//导出的公共方法
const common_utils = { brightKeyword, flat2nest };

// 导出的公共组件
import quickSelect from "@/views/quickSelect.vue";

//按需导出
export { quickSelect, common_utils };

//批量引入
const coms = [quickSelect]; //数组内的组件批量导出
const install = function (app) {
  coms.forEach(com => {
    app.component(com.name, com);
  });
};
export default {
  install
};
