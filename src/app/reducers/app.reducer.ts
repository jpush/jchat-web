import { appAction } from '../actions';
interface AppStore {
    actionType: string;
    errorApiTip: object;
    tipModal: object;
}
const appInit = {
    actionType: '',
    errorApiTip: {},
    tipModal: {}
};
export const appReducer = (state: AppStore = appInit, {type, payload}) => {
    state.actionType = type;
    switch (type) {
        case appAction.errorApiTip:
            state.errorApiTip = payload;
            break;
        case appAction.tipModal:
            state.tipModal = payload;
            break;
        default:
    }
    return state;
};
