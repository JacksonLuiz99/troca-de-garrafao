import { Routes } from '@angular/router';
import { Admin } from './pages/admin';
import { Troca } from './pages/troca';

export const routes: Routes = [
  { path: '', component: Troca, title: 'Troca de Galão' },
  { path: 'admin', component: Admin, title: 'Administrador · Troca de Galão' },
  { path: '**', redirectTo: '' },
];
