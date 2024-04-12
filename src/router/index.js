import { createRouter, createWebHistory } from "vue-router";

const asyncRoutes = [
  {
    path: "/",
    redirect: "/index"
  },
  {
    path: "/index",
    name: "home",
    component: () => import("@/views/index.vue")
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes: asyncRoutes
});

export default router;
