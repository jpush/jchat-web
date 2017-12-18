import { Component, OnInit, AfterViewInit, ElementRef, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { Router } from '@angular/router';
import { global, authPayload, StorageService, ApiService } from '../../services/common';
import { AppStore } from '../../app.store';
import { registerAction } from './actions';
import { Util } from '../../services/util';
import { appAction } from '../../actions';
import { mainAction } from '../main/actions';
declare function JMessage(obj?: Object): void;

@Component({
    selector: 'app-register',
    styleUrls: ['./register.component.scss'],
    templateUrl: './register.component.html'
})

export class RegisterComponent implements OnInit, AfterViewInit, OnDestroy {
    private info = {
        username: '',
        password: '',
        repeatPassword: ''
    };
    private tip = {
        usernameTip: '',
        passwordTip: '',
        repeatPasswordTip: ''
    };
    private registerStream$;
    private isButtonAvailable = false;
    private tipModal = {
        show: false,
        info: {}
    };
    constructor(
        private store$: Store<AppStore>,
        private router: Router,
        private storageService: StorageService,
        private elementRef: ElementRef,
        private apiService: ApiService
    ) {}
    public ngOnInit() {
        this.store$.dispatch({
            type: registerAction.init,
            payload: null
        });
        // JIM初始化
        this.store$.dispatch({
            type: mainAction.jimInit,
            payload: null
        });
        this.registerStream$ = this.store$.select((state) => {
            const registerState = state['registerReducer'];
            switch (registerState.actionType) {
                case registerAction.init:
                    this.init();
                    break;
                case registerAction.registerSuccess:
                    this.tipModal = registerState.tipModal;
                    break;
                default:
                    this.tip.usernameTip = registerState.usernameTip;
                    this.tip.passwordTip = registerState.passwordTip;
                    this.isButtonAvailable = registerState.isButtonAvailable;
                    this.tip.repeatPasswordTip = registerState.repeatPasswordTip;
            }
            return state;
        }).subscribe((state) => {
            // pass
        });
    }
    public ngAfterViewInit() {
        this.elementRef.nativeElement.querySelector('#registerUsername').focus();
    }
    public ngOnDestroy() {
        this.registerStream$.unsubscribe();
    }
    private register() {
        this.store$.dispatch({
            type: registerAction.register,
            payload: {
                username: this.info.username,
                password: this.info.password,
                repeatPassword: this.info.repeatPassword,
                isButtonAvailable: this.isButtonAvailable
            }
        });
    }
    private isButtonAvailableAction(type) {
        this.store$.dispatch({
            type: registerAction.isButtonAvailableAction,
            payload: {
                username: this.info.username,
                password: this.info.password,
                repeatPassword: this.info.repeatPassword
            }
        });
        // 当input keyup进行修改时清空提示语
        this.store$.dispatch({
            type: registerAction.emptyTip,
            payload: type
        });
    }
    private usernameBlur() {
        this.store$.dispatch({
            type: registerAction.isUsernameAvailableAction,
            payload: {
                username: this.info.username
            }
        });
    }
    private passwordBlur() {
        this.store$.dispatch({
            type: registerAction.password,
            payload: {
                password: this.info.password
            }
        });
    }
    private modalTipEmit() {
        this.tipModal.show = false;
        this.storageService.set('register-username', this.info.username);
        this.router.navigate(['/login']);
    }
    private init() {
        this.info = {
            username: '',
            password: '',
            repeatPassword: ''
        };
        this.tip = {
            usernameTip: '',
            passwordTip: '',
            repeatPasswordTip: ''
        };
        this.isButtonAvailable = false;
        this.tipModal = {
            show: false,
            info: {}
        };
    }
}
