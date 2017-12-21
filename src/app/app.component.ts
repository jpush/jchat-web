import { Component, OnInit, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { appAction } from './actions';
import { global } from './services/common/global';
import '../assets/static/js/jmessage-sdk-web.2.5.0.min.js';
declare function JMessage(obj?: Object): void;

@Component({
    selector: 'my-app',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})

export class AppComponent implements OnInit, OnDestroy {
    private appStream$;
    private tipModal = {
        show: false,
        info: {}
    };
    constructor(
        private store$: Store<any>
    ) { }
    public ngOnInit() {
        // 创建JIM 对象
        global.JIM = new JMessage(
            {
                debug: true
            }
        );
        this.appStream$ = this.store$.select((state) => {
            const appState = state['appReducer'];
            switch (appState.actionType) {
                case appAction.errorApiTip:
                    this.errorApiTip(appState.errorApiTip);
                    break;
                case appAction.tipModal:
                    this.tipModal = appState.tipModal;
                    break;
                default:
            }
            return state;
        }).subscribe((state) => {
            // pass
        });
    }
    public ngOnDestroy() {
        this.appStream$.unsubscribe();
    }
    private modalTipEmit() {
        this.store$.dispatch({
            type: appAction.tipModal,
            payload: {
                show: false,
                info: {}
            }
        });
    }
    // api调用错误提示统一处理
    private errorApiTip(errorMsg) {
        if (errorMsg.hasOwnProperty('error')) {
            errorMsg = errorMsg.error;
        }
        let tip = errorMsg.text ? errorMsg.text + ' : ' : '';
        console.log('error', errorMsg);
        switch (errorMsg.code) {
            // 自定义提示语
            case -1:
                tip += errorMsg.myText ? errorMsg.myText : '';
                break;
            // 请求超时
            case -2:
                tip += '请求超时';
                break;
            case 880001:
                tip += '未知错误码';
                break;
            case 880002:
                tip += '参数不合法';
                break;
            case 880003:
                tip += '非法内容格式';
                break;
            case 880004:
                tip += '非法内容格式';
                break;
            case 880005:
                tip += '文件不存在';
                break;
            case 880006:
                tip += '注册之前先退出';
                break;
            case 880007:
                tip += '被限制注册';
                break;
            case 880008:
                tip += 'msg_id 非法';
                break;
            case 880101:
                tip += 'appkey不存在';
                break;
            case 880102:
                tip += '签名错误';
                break;
            case 880103:
                tip += '该用户不存在';
                break;
            case 880104:
                tip += '密码错误';
                break;
            case 880106:
                tip += '签名过期';
                break;
            case 880107:
                tip += '已经是登录状态';
                break;
            case 880109:
                tip += '重复登录操作';
                break;
            case 880110:
                tip += '多通道错误，更新sdk版本';
                break;
            case 880111:
                tip += '用户被禁用';
                break;
            case 880203:
                tip += '该用户不存在';
                break;
            case 880204:
                tip += '该群组不存在';
                break;
            case 880205:
                tip += '您不在该群组内';
                break;
            case 880206:
                tip += '消息大小超过限制';
                break;
            case 880207:
                tip += '您已被对方拉黑';
                break;
            case 880208:
                tip += '发送失败，此消息包含敏感词';
                break;
            case 880209:
                tip += '发送速度超过限制';
                break;
            case 880210:
                tip += '文件大小超过限制';
                break;
            case 880212:
                tip += '您被禁言了';
                break;
            case 880402:
                tip += '您没有创建群组的权限';
                break;
            case 880403:
                tip += '群数量到达上限';
                break;
            case 880404:
                tip += '群名字超过长度限制，创建失败';
                break;
            case 880405:
                tip += '群描述长度超过限制';
                break;
            case 880502:
                tip += '您不在该群组内';
                break;
            case 880602:
                tip += '添加的群成员为空';
                break;
            case 880603:
                tip += '您不在该群组内';
                break;
            case 880604:
                tip += '您没权限添加群成员';
                break;
            case 880606:
                tip += '成员列表中有用户没有被添加到群组的权限';
                break;
            case 880607:
                tip += '重复添加群成员';
                break;
            case 880608:
                tip += '群成员数量超过限制';
                break;
            case 880609:
                tip += '成员列表中存在成员的群组数量超过限制';
                break;
            case 880703:
                tip += '删除的群成员列表存在成员不属于该群组';
                break;
            case 880704:
                tip += '您没有删除群成员的权限';
                break;
            case 880705:
                tip += '成员列表中存在成员用户没权限删除';
                break;
            case 880803:
                tip += '群组名称长度超过限制';
                break;
            case 880804:
                tip += '群组描述长度超过限制';
                break;
            case 880903:
                tip += '成员列表中有成员不能被添加，添加失败';
                break;
            case 880904:
                tip += '重复添加';
                break;
            case 881002:
                tip += '成员列表中有不存在的成员';
                break;
            case 881101:
                tip += '该成员已处于免打扰状态';
                break;
            case 881102:
                tip += '该成员不处于免打扰状态';
                break;
            case 881103:
                tip += '该群组不存在';
                break;
            case 881104:
                tip += '用户不存在该群组中';
                break;
            case 881105:
                tip += '该群组已处于免打扰状态';
                break;
            case 881106:
                tip += '该群组不处于免打扰状态';
                break;
            case 881107:
                tip += '您已经设置了免打扰';
                break;
            case 881108:
                tip += '您没有设置免打扰';
                break;
            case 881201:
                tip += '群不存在，不能设置屏蔽';
                break;
            case 881202:
                tip += '您不在群里面，不能设置屏蔽';
                break;
            case 881203:
                tip += '您已经设置了屏蔽';
                break;
            case 881204:
                tip += '群未设置屏蔽';
                break;
            case 881301:
                tip += '该用户不存在';
                break;
            case 881302:
                tip += '你们已经是好友';
                break;
            case 881303:
                tip += '你们是非好友关系';
                break;
            case 881304:
                tip += '非法备注';
                break;
            case 881305:
                tip += '添加好友失败，邀请事件无效';
                break;
            case 881401:
                tip += '时间过长，不能撤回';
                break;
            case 881402:
                tip += '请求撤回方不是消息发送方';
                break;
            case 881403:
                tip += '消息不存在';
                break;
            case 881404:
                tip += '消息已经撤回';
                break;
            case 881501:
                tip += '用户不在聊天室';
                break;
            case 881502	:
                tip += '用户被禁止发消息';
                break;
            case 881503:
                tip += '聊天室不存在';
                break;
            case 881504:
                tip += '消息长度超出限制';
                break;
            case 881507:
                tip += '用户已经在聊天室';
                break;
            case 881508:
                tip += '超过聊天室人数限制';
                break;
            case 881602:
                tip += '目标用户未登录';
                break;
            case 881604:
                tip += '消息长度超出限制';
                break;
            case 882001:
                tip += '系统内部错误';
                break;
            case 882003:
                tip += '参数不合法';
                break;
            case 882004:
                tip += '无效授权';
                break;
            case 882005:
                tip += '系统繁忙，稍后重试';
                break;
            case 898000:
                tip += '服务器内部错误';
                break;
            case 898003:
                tip += '无效的参数';
                break;
            default:
                tip += '操作失败';
        }
        this.store$.dispatch({
            type: appAction.tipModal,
            payload: {
                show: true,
                info: {
                    title: '操作失败',
                    tip,
                    actionType: '[app] error api tip show',
                    success: 2
                }
            }
        });
    }
}
