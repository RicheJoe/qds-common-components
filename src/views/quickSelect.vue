<template>
  <div class="nice-classify-wrapper">
    <div class="left">
      <div class="search-btn">
        <el-input
          placeholder="输入商品/服务名称"
          v-model="filterText"
          @keyup.enter.native="filterTreeData(filterText)"
        >
          <i slot="suffix" class="el-icon-search" @click="filterTreeData(filterText)"></i>
        </el-input>
      </div>
      <div class="tree-wrapper scroll" v-loading="loading">
        <el-tree
          class="filter-tree"
          :data="niceData"
          :props="defaultProps"
          :filter-node-method="filterNode"
          node-key="cgId"
          :load="loadNode"
          :default-checked-keys="defaultCheckedKeys"
          lazy
          show-checkbox
          @node-click="handleNodeClick"
          ref="tree"
        >
          <template #default="{ node, data }">
            <span class="span-ellipsis">
              <span :title="node.label">{{ node.label }}</span>
            </span>
          </template>
        </el-tree>
      </div>
    </div>
    <div class="right">
      <div class="header">
        <div v-if="niceClassedList.length" class="choice">
          已选<span>{{ niceClassedList.length }}</span
          >类,共 <span>{{ subNumber }}</span
          >小项,预计费用 <span>{{ totalItemNumber * 32 }}</span
          >元
        </div>
        <div v-else>已选商标类别</div>
        <div>
          <span class="tips">超过10项每加1项加32元</span>
          <span @click="clearAll" class="clearAll">清空已选</span>
        </div>
      </div>
      <div class="right-selected-box scroll">
        <div v-for="first in niceClassedList" :key="first.zid">
          <h4 v-if="first.rightList.length">
            <div class="class-type">
              <label v-if="first.cgName.includes('第')">{{ first.cgName }}</label>
              <label v-else>第{{ first.cgNum }}类 {{ first.cgName }}</label>
            </div>
            <div class="choiced">
              <span class="sbrand" v-if="first.sameSum && first.similarSum"
                >为您检测到{{ first.sameSum }}条相同商标，{{ first.similarSum }}条近似商标</span
              >
              <span class="nbrand" v-if="first.sameSum == 0"
                >为您检测到{{ first.sameSum }}条相同商标，{{ first.similarSum }}条近似商标</span
              >
              <span>
                已选
                <span>{{ first.cgNumber }}</span
                >项
              </span>
              <i
                class="el-icon-delete"
                @click="deleteCategories(first.cgId, '', first.cgNum, true)"
              ></i>
            </div>
          </h4>
          <ul v-if="first.rightList.length">
            <li v-for="group in first.rightList" :key="group.zid">
              <template v-if="group.rightList && group.rightList.length">
                <label>{{ group.cgNum }}：</label>
                <div class="small-box">
                  <span v-for="small in group.rightList" :key="small.zid">
                    {{ small.cgNum }}
                    {{ small.cgName.split(" ")[small.cgName.split(" ").length - 1] }}
                    <i class="close" @click="deleteCategories(small.cgId, '', small.cgNum)"></i>
                  </span>
                </div>
              </template>
            </li>
          </ul>
        </div>
        <div v-show="!niceClassedList.length" class="no-data">
          <img src="@/assets/img/no-data.png" />
          <span>请点击左侧选择商标类别</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from "vue";
import { niceAllType, queryNiceListByFirst, queryNiceListByName } from "@/API/base-data.js";
import { ElMessage, ElMessageBox, ElInput, ElTree } from "element-plus";

const filterText = ref("");
const niceData = ref([]);
// 尼斯分类45大类
const queryNiceAllType = async () => {
  const res = await niceAllType({});
  res.list.forEach(item => {
    item.cgName = `第${item.cgNum}类 ${item.cgName}`;
  });
  niceData.value = res.list;
  console.log(niceData.value, "nice");
};

const loading = ref(false);
const niceClassedList = ref([]);

const tree = ref(null);
// 树组件数据
const defaultCheckedKeys = ref([]);
const defaultCheckedCgNums = ref([]);
const defaultProps = {
  children: "cgList",
  label: "cgName",
  isLeaf: "leaf"
};
const filterNode = async (value, data) => {
  if (!value) return true;
  return data.cgName.indexOf(value) !== -1;
};

const loadNode = async (node, resolve) => {
  const data = node.data;
  if (node.level !== 0) {
    const treeData = await queryNiceListByFirstFn(data.cgId);

    setTimeout(() => {
      resolve(treeData);
    }, 500);
  }
};
const handleNodeClick = (data, node) => {
  if (node.level == 3) {
    let firstData = node.parent.parent.data;
    let secondData = node.parent.data;
    let defaultRepeatFlag = false;
    if (!node.checked) {
      defaultCheckedCgNums.value.forEach(item => {
        if (item.cgNum == data.cgNum && item.cgName.trim() == data.cgName.trim()) {
          ElMessage.warning({ message: "已选择该项，请不要重复添加" });
          defaultRepeatFlag = true;
        }
      });
      if (defaultRepeatFlag) return;
      node.checked = true;
      defaultCheckedKeys.value.push(data.cgId);
      defaultCheckedCgNums.value.push({
        cgName: data.cgName,
        cgNum: data.cgNum
      });
      const firstItem = {
        cgId: firstData.cgId,
        cgName: firstData.cgName,
        cgNum: firstData.cgNum,
        rightList: [],
        sameSum: firstData.sameSum,
        similarSum: firstData.similarSum
      };
      const groupItem = {
        cgId: secondData.cgId,
        cgName: secondData.cgName,
        cgNum: secondData.cgNum,
        rightList: []
      };
      const smallItem = {
        cgId: data.cgId,
        cgName: data.cgName,
        cgNum: data.cgNum
      };
      const hasFirst = niceClassedList.value.some(first => first.cgId == firstItem.cgId);
      !hasFirst && niceClassedList.value.push(firstItem);
      niceClassedList.value.forEach(first => {
        if (first.cgId == firstItem.cgId) {
          const hasGroup = first.rightList.some(group => group.cgId == groupItem.cgId);
          !hasGroup && first.rightList.push(groupItem);
        }
        first.rightList.forEach(group => {
          if (group.cgId == groupItem.cgId) {
            const hasSmall = group.rightList.some(small => small.cgId == smallItem.cgId);
            !hasSmall && group.rightList.push(smallItem);
          }
        });
      });

      console.log(niceClassedList.value, "niceClassedList");
      dealData();
    } else {
      deleteCategories(data.cgId, node);
    }
  }
};
// 尼斯分类下级
const queryNiceListByFirstFn = async cgId => {
  const params = {
    cgId,
    containThree: 1 // 是否查询小项 0是不查询 1是查询
  };
  const res = await queryNiceListByFirst(params);
  res.forEach(item => {
    item.cgName = `${item.cgNum} ${item.cgName}`;
    if (item.cgList == "") {
      item.leaf = true;
    }
  });
  // if (niceData.value.length) {
  //   niceData.value = res || [];
  // } else {
  //   return res || [];
  // }
  return res;
};
// 尼斯分类搜索
const queryNiceListByNameFn = async cgName => {
  const params = {
    cgName,
    containOther: 0
  };
  loading.value = true;
  const { cgList } = await queryNiceListByName(params);
  cgList.forEach(item => {
    item.cgName = `第${item.cgNum}类 ${item.cgName}`;
    item.cgList.forEach(group => {
      group.cgName = `${group.cgNum} ${group.cgName}`;
      group.cgList.forEach(small => {
        small.cgName = `${small.cgNum} ${small.cgName}`;
      });
    });
  });
  loading.value = false;
  niceData.value = cgList;
};

//删除选择的
const deleteCategories = (cgId, node, cgNum, flag) => {
  ElMessageBox.confirm("确定要删除吗?", "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  })
    .then(() => {
      let tempKeys = [];
      let tempCgNums = [];
      niceClassedList.value.forEach((first, i) => {
        if (first.cgId == cgId) {
          niceClassedList.value.splice(i, 1);
        }
        first.rightList.forEach((group, j) => {
          if (group.cgId == cgId) {
            first.rightList.splice(j, 1);
            if (first.rightList.length == 0) {
              niceClassedList.value.splice(i, 1);
            }
          }
          group.rightList &&
            group.rightList.forEach((small, k) => {
              tempKeys.push(small.cgId);
              tempCgNums.push({
                cgNum: small.cgNum,
                cgName: small.cgName
              });
              if (small.cgId == cgId) {
                group.rightList.splice(k, 1);
                if (group.rightList.length == 0) {
                  first.rightList.splice(j, 1);
                }
              }
            });
        });
      });
      dealData();
      if (flag) {
        defaultCheckedKeys.value = defaultCheckedKeys.value.filter(
          item => !tempKeys.includes(item)
        );
        defaultCheckedCgNums.value = [defaultCheckedCgNums.value].filter(x =>
          [...tempCgNums].every(y => y.cgNum !== x.cgNum && y.cgName !== x.cgName)
        );
      }
      if (node) {
        node.checked = false;
        defaultCheckedCgNums.value = defaultCheckedCgNums.value.filter(
          item => item.cgNum != node.data.cgNum
        );
      }
      if (cgNum) {
        defaultCheckedCgNums.value = defaultCheckedCgNums.value.filter(item => item.cgNum != cgNum);
      }
      defaultCheckedKeys.value = defaultCheckedKeys.value.filter(item => item != cgId);
      tree.value.setCheckedKeys(defaultCheckedKeys.value);
    })
    .catch(() => {
      node && (node.checked = true);
      console.log("取消");
    });
};

//清空
const clearAll = () => {
  ElMessageBox.confirm("确定要清空全部吗?", "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  })
    .then(() => {
      clear();
    })
    .catch(() => {
      console.log("取消");
    });
};
const clear = () => {
  niceClassedList.value = [];
  defaultCheckedKeys.value = [];
  defaultCheckedCgNums.value = [];
  tree.value.setCheckedKeys([]);
  let nodesMap = tree.value.store.nodesMap;
  for (let key in nodesMap) {
    nodesMap[key].expanded = false;
  }
  subNumber.value = 0;
};
const subNumber = ref(0);
const cgInfoNumAll = ref(0);
const totalItemNumber = ref(0);
const dealData = () => {
  subNumber.value = 0;
  cgInfoNumAll.value = 0;
  niceClassedList.value.forEach(val => {
    cgInfoNumAll.value = 0;
    for (let i = 0; i < val.rightList.length; i++) {
      cgInfoNumAll.value += val.rightList[i].rightList.length;
    }
    val.cgNumber = cgInfoNumAll.value;
  });
  niceClassedList.value.forEach(item => {
    subNumber.value += item.cgNumber;
  });
};

watch(
  niceClassedList,
  val => {
    totalItemNumber.value = 0;
    console.log("watch", val);
    val.forEach(item => {
      if (item.cgNumber && item.cgNumber <= 10) {
        totalItemNumber.value += 10;
      } else {
        totalItemNumber.value += item.cgNumber;
      }
    });
  },
  { deep: true }
);
onMounted(() => {
  queryNiceAllType();
});
</script>

<script>
export default {
  name: "quickSelect"
};
</script>
<style scoped lang="scss">
.nice-classify-wrapper {
  width: 1200px;
  border: 1px solid #ccc;
  height: 470px;
  font-size: 13px;
  display: flex;
  font {
    padding: 0 2px;
    color: #ff7200;
  }
  .left {
    width: 280px;
    border-right: 1px solid #ccc;
    .search-btn {
      height: 40px;
      display: flex;
      justify-content: center;
      align-items: center;
      color: #222;
      ::v-deep .el-input {
        width: 260px;
        .el-input__inner {
          height: 32px;
          line-height: 32px;
          font-size: 12px;
          color: #222;
        }
        .el-input-group__append {
          padding: 0 10px;
          background-color: #ffffff;
        }
      }
    }
    .tree-wrapper {
      overflow-y: auto;
      margin: 4px 0;
      height: 422px;
      ::v-deep .el-tree-node {
        .span-ellipsis {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          width: 100%;
        }
        .el-tree-node__label {
          color: #222;
        }
        .is-leaf + .el-checkbox .el-checkbox__inner {
          display: inline-block;
          margin-right: 6px;
        }
        .is-leaf + .is-checked + .span-ellipsis {
          &::before {
            content: "";
            width: 14px;
            height: 14px;
            background: url(@/assets/img/icon-selected.png) no-repeat center;
            margin-right: 6px;
            background-size: cover;
            display: inline-block;
          }
        }
        .el-checkbox .el-checkbox__inner {
          display: none;
        }
      }
      ::v-deep .el-tree-node__children {
        .el-tree-node__label {
          font-size: 12px;
          color: #333;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          width: 100%;
        }
        .el-tree-node__content {
          padding-left: 16px !important;
        }
      }
      ::v-deep .el-tree-node__content > label.el-checkbox {
        margin-right: 0px;
        display: none;
      }
    }
  }
  .right {
    flex: 1;
    .tips {
      color: #999;
      font-size: 12px;
      margin-right: 4px;
    }
    .header {
      border-bottom: 1px solid #e4e4e4;
      background: #f9f9f9;
      height: 40px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-left: 16px;
      box-sizing: border-box;
      div:nth-of-type(1) {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      div:nth-of-type(2) {
        width: 234px;
        .tips {
          width: 130px;
          display: inline-block;
        }
      }
      .clearAll {
        color: #222;
        font-weight: bold;
        width: 100px;
        height: 39px;
        line-height: 39px;
        background: #ffffff;
        border-left: 1px solid #e4e4e4;
        border-bottom: 1px solid #e4e4e4;
        text-align: center;
        text-decoration: underline;
        display: inline-block;
        cursor: pointer;
      }
    }
    .right-selected-box {
      padding: 8px 12px;
      height: calc(100% - 40px);
      font-size: 12px;
      overflow: auto;
      box-sizing: border-box;
      h4 {
        padding-left: 24px;
        line-height: 32px;
        background-color: #f9f9f9;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-weight: bold;
        color: #333;
        .choiced {
          display: flex;
          justify-content: center;
          align-content: center;
          margin-right: 8px;
          .sbrand {
            color: #ff4422;
            padding-right: 12px;
            font-weight: normal;
          }
          .nbrand {
            color: #999999;
            padding-right: 12px;
            font-weight: normal;
          }
          .el-icon-delete {
            margin-left: 10px;
            color: #ccc;
            font-size: 17px;
            line-height: 30px;
            cursor: pointer;
          }
        }
        .class-type {
          span {
            font-size: 12px;
            color: #666;
          }
        }
      }
      ul {
        margin-top: 12px;
        li {
          padding-left: 14px;
          display: flex;
          label {
            display: inline-block;
            margin-top: 5px;
            padding-right: 0;
            width: 50px;
            color: #999;
          }
          .small-box {
            display: inline-block;
            vertical-align: top;
            flex: 1;

            span {
              display: inline-block;
              position: relative;
              margin-right: 8px;
              margin-bottom: 4px;
              padding: 4px 8px;
              border: 1px solid transparent;
              color: #666;
              .close {
                display: none;
                position: absolute;
                top: -6px;
                right: -6px;
                width: 13px;
                height: 13px;
                background: url(@/assets/img/icon-small-delete.png) no-repeat 0 center;
                overflow: hidden;
                background-size: cover;
                cursor: pointer;
              }
              &:hover {
                border-color: #ff9900;
                .close {
                  display: block;
                }
              }
            }
          }
        }
        .history,
        .inline {
          display: inline-block;
          width: auto !important;
        }
      }
      .no-data {
        display: flex;
        flex-direction: column;
        width: 100%;
        height: 100%;
        justify-content: center;
        align-items: center;
        color: #999;
        font-size: 14px;
        img {
          width: 200px;
          margin-bottom: 10px;
        }
      }
    }
  }
}
</style>