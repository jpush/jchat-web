
export interface LoginStore {
    isLoginSuccess: boolean;
    loginTip: string;
    isButtonAvailable: boolean;
    actionType: string;
    userInfo: {
        username: string,
        password: string
    };
    loginRemember: boolean;
};
