import { Component, OnInit, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { appAction } from './actions';
import { global } from './services/common/global';
import '../assets/static/js/jmessage-sdk-web.2.4.0.min.js';
declare function JMessage(obj ?: Object): void;

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
    ) {}
    public ngOnInit() {
        // 创建JIM 对象
        global.JIM = new JMessage({
            debug: true,
            address : 'ws://183.232.25.91:9092',
            upload_file : 'http://183.232.42.208:8080/resource'
        });
        this.appStream$ = this.store$.select((state) => {
            let appState = state['appReducer'];
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
    private errorApiTip(errorMsg) {
        let name = errorMsg.text ? errorMsg.text + ': ' : '';
        let tip = '';
        if (errorMsg.hasOwnProperty('error')) {
            errorMsg = errorMsg.error;
        }
        switch (errorMsg.code) {
            case 880001:
                tip = `${name}未知错误码`;
                break;
            case 880002:
                tip = `${name}参数不合法`;
                break;
            case 880003:
                tip = `${name}非法内容格式`;
                break;
            case 880101:
                tip = `${name}appkey 不存在`;
                break;
            case 880102:
                tip = `${name}签名错误`;
                break;
            case 880103:
                tip = `${name}该用户不存在`;
                break;
            case 880104:
                tip = `${name}密码错误`;
                break;
            case 880203:
                tip = `${name}该用户不存在`;
                break;
            case 880204:
                tip = `${name}该群组不存在`;
                break;
            case 880205:
                tip = `${name}您不在该群组内`;
                break;
            case 880206:
                tip = `${name}消息大小超过限制`;
                break;
            case 880207:
                tip = `${name}您已被对方拉黑`;
                break;
            case 880208:
                tip = `${name}发送失败，此消息包含敏感词`;
                break;
            case 880402:
                tip = `${name}您没有创建群组的权限`;
                break;
            case 880403:
                tip = `${name}群数量到达上限`;
                break;
            case 880404:
                tip = `${name}群名字超过长度限制，创建失败`;
                break;
            case 880405:
                tip = `${name}群描述长度超过限制`;
                break;
            case 880502:
                tip = `${name}您不在该群组内`;
                break;
            case 880602:
                tip = `${name}添加的群成员为空`;
                break;
            case 880603:
                tip = `${name}您不在该群组内`;
                break;
            case 880604:
                tip = `${name}您没权限添加群成员`;
                break;
            case 880606:
                tip = `${name}成员列表中有用户没有被添加到群组的权限`;
                break;
            case 880608:
                tip = `${name}群成员数量超过限制`;
                break;
            case 880609:
                tip = `${name}成员列表中存在成员的群组数量超过限制`;
                break;
            case 880703:
                tip = `${name}删除的群成员列表存在成员不属于该群组`;
                break;
            case 880704:
                tip = `${name}您没有删除群成员的权限`;
                break;
            case 880705:
                tip = `${name}成员列表中存在成员用户没权限删除`;
                break;
            case 880803:
                tip = `${name}群组名称长度超过限制`;
                break;
            case 880804:
                tip = `${name}群组描述长度超过限制`;
                break;
            case 880903:
                tip = `${name}成员列表中有成员不能被添加，添加失败`;
                break;
            case 881002:
                tip = `${name}成员列表中有不存在的成员`;
                break;
            case 881101:
                tip = `${name}该成员已处于免打扰状态`;
                break;
            case 881102:
                tip = `${name}该成员不处于免打扰状态`;
                break;
            case 881103:
                tip = `${name}该群组不存在`;
                break;
            case 881104:
                tip = `${name}用户不存在该群组中`;
                break;
            case 881105:
                tip = `${name}该群组已处于免打扰状态`;
                break;
            case 881106:
                tip = `${name}该群组不处于免打扰状态`;
                break;
            case 881107:
                tip = `${name}您已经设置了免打扰`;
                break;
            case 881108:
                tip = `${name}您没有设置免打扰`;
                break;
            case 881201:
                tip = `${name}群不存在，不能设置屏蔽`;
                break;
            case 881202:
                tip = `${name}您不在群里面，不能设置屏蔽`;
                break;
            case 881203:
                tip = `${name}您已经设置了屏蔽`;
                break;
            case 881204:
                tip = `${name}群未设置屏蔽`;
                break;
            case 881301:
                tip = `${name}该用户不存在`;
                break;
            case 881302:
                tip = `${name}你们已经是好友`;
                break;
            case 881303:
                tip = `${name}你们是非好友关系`;
                break;
            case 881304:
                tip = `${name}非法备注`;
                break;
            case 881305:
                tip = `${name}添加好友失败：邀请事件无效`;
                break;
            case 881401:
                tip = `${name}发送时间过长，不能撤回`;
                break;
            case 881402:
                tip = `${name}请求撤回方不是消息发送方`;
                break;
            case 881403:
                tip = `${name}消息不存在`;
                break;
            case 881404:
                tip = `${name}消息已经撤回`;
                break;
            case 882001:
                tip = `${name}系统内部错误`;
                break;
            case 882003:
                tip = `${name}参数不合法`;
                break;
            case 882004:
                tip = `${name}无效授权`;
                break;
            case 882005:
                tip = `${name}系统繁忙，稍后重试`;
                break;
            case 898000:
                tip = `${name}服务器内部错误`;
                break;
            case 910000:
                tip = `${name}请求超时`;
                break;
            case 898003:
                tip = `${name}无效的参数`;
                break;
            default:
                tip = `${name}操作失败`;
        }
        this.store$.dispatch({
            type: appAction.tipModal,
            payload: {
                show: true,
                info: {
                    title: '操作失败',
                    tip,
                    actionType: '[login] error api tip show',
                    success: 2
                }
            }
        });
    }
}
