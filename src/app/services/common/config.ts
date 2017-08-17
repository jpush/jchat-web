// JIM init配置
const randomStr = '404';
const appKey = '4f7aef34fb361292c566a1cd';
const masterkey = '054d6103823a726fc12d0466';

export const authPayload = {
    appKey,
    randomStr,
    flag: 1,
    masterkey
};
// 自定义滚动条配置
import { PerfectScrollbarConfigInterface } from 'ngx-perfect-scrollbar';

export const PERFECT_SCROLLBAR_CONFIG: PerfectScrollbarConfigInterface = {
  suppressScrollX: true,
  minScrollbarLength: 40
};

// js中静态资源的路径
export const imgRouter = '../../../assets/images/emoji/';

