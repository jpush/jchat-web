import { LoginStore } from './pages/login/stores';
import { RegisterStore } from './pages/register/stores';
import { MainStore } from './pages/main/stores';

export interface AppStore {
    loginReducer: LoginStore;
    registerReducer: RegisterStore;
    mainReducer: MainStore;
};
