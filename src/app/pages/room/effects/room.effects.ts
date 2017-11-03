import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Actions, Effect, toPayload } from '@ngrx/effects';
import { Store, Action } from '@ngrx/store';
import { AppStore } from '../../../app.store';
import { roomAction } from '../actions';
import { global } from '../../../services/common/global';

@Injectable()

export class RoomEffect {

}