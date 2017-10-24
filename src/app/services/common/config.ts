// JIM init配置
const randomStr = '404';
const appKey = '4f7aef34fb361292c566a1cd';
const masterkey = '';
const signature = '7db047a67a9d7293850ac69d14cc82bf';
const timestamp = 1507882399401;
export const authPayload = {
    appKey,
    masterkey,
    randomStr,
    flag: 1,
    signature,
    timestamp
};
// 自定义滚动条配置
import { PerfectScrollbarConfigInterface } from 'ngx-perfect-scrollbar';

export const PERFECT_SCROLLBAR_CONFIG: PerfectScrollbarConfigInterface = {
    suppressScrollX: true,
    minScrollbarLength: 40
};

// js中静态资源的路径
export const imgRouter = '../../../assets/images/emoji/';

// 消息列表中滚动加载的每页消息的条数
export const pageNumber = 20;
