export interface RegisterStore {
    actionType: string;
    isRegisterSuccess: boolean; // 是否注册成功
    usernameTip: string; // 用户名提示文本
    passwordTip: string; // 密码提示文本
    repeatPasswordTip: string; // 重复密码提示文本
    isButtonAvailable: boolean; // button是否可点击
    tipModal: {
        show: boolean,
        info: object
    }; // 注册成功后的模态框
};
