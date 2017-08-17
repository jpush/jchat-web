import { Routes, RouterModule, PreloadAllModules } from '@angular/router';
import { MainCanActivate } from './services/common';

export const ROUTES: Routes = [
    {
        path: 'login',
        loadChildren: './pages/login#LoginModule'
    },
    {
        path: 'register',
        loadChildren: './pages/register#RegisterModule'
    },
    {
        path: 'main',
        canActivate: [MainCanActivate],
        loadChildren: './pages/main#MainModule'
    },
    {
        path: 'map/:pointer',
        loadChildren: './pages/map#MapModule'
    },
    {
        path: '',
        redirectTo: '/login',
        pathMatch: 'full'
    },
    {
        path: '**',
        redirectTo: '/login',
        pathMatch: 'full'
    }
];

export const routing = RouterModule.forRoot(ROUTES, {
    useHash: true
});
