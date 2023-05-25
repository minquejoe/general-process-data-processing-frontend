import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router';
import { usePermissStore } from '../store/permiss';
import Home from '../views/home.vue';

const routes: RouteRecordRaw[] = [
    {
        path: '/',
        redirect: '/alg_stat',
    },
    {
        path: '/',
        name: 'Home',
        component: Home,
        children: [
            {
                path: '/alg_stat',
                name: 'alg_stat',
                meta: {
                    title: '统计分析'
                },
                component: () => import(/* webpackChunkName: "alg_stat" */ '../views/Alg_stat.vue')
            },

            {
                path: '/alg_time',
                name: 'alg_time',
                meta: {
                    title: '时域分析'
                },
                component: () => import(/* webpackChunkName: "alg_time" */ '../views/Alg_time.vue')
            },

            {
                path: '/alg_freq',
                name: 'alg_freq',
                meta: {
                    title: '频域分析'
                },
                component: () => import(/* webpackChunkName: "alg_freq" */ '../views/Alg_freq.vue')
            },

            {
                path: '/alg_time_freq',
                name: 'alg_time_freq',
                meta: {
                    title: '时频分析'
                },
                component: () => import(/* webpackChunkName: "alg_time_freq" */ '../views/Alg_time_freq.vue')
            },
            
            {
                path: '/alg_tsf',
                name: 'alg_tsf',
                meta: {
                    title: '时间序列预测'
                },
                component: () => import(/* webpackChunkName: "alg_tsf" */ '../views/Alg_tsf.vue')
            }

        ],
    },
    {
        path: '/login',
        name: 'Login',
        meta: {
            title: '登录',
        },
        component: () => import(/* webpackChunkName: "login" */ '../views/login.vue'),
    },
    {
        path: '/403',
        name: '403',
        meta: {
            title: '没有权限',
        },
        component: () => import(/* webpackChunkName: "403" */ '../views/403.vue'),
    },
];

const router = createRouter({
    history: createWebHashHistory(),
    routes,
});

router.beforeEach((to, from, next) => {
    document.title = `${to.meta.title} | vue-manage-system`;
    const role = localStorage.getItem('ms_username');
    const permiss = usePermissStore();
    if (!role && to.path !== '/login') {
        next('/login');
    } else if (to.meta.permiss && !permiss.key.includes(to.meta.permiss)) {
        // 如果没有权限，则进入403
        next('/403');
    } else {
        next();
    }
});

export default router;
