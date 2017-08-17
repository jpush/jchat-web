
export interface LoginStore {
    isLoginSuccess: boolean; // 是否登陆成功
    loginTip: string; // 登陆提示文本,
    isButtonAvailable: boolean; // 是否登陆按钮可用
    actionType: string;
    userInfo: {
        username: string,
        password: string
    };
    loginRemember: boolean;
};
