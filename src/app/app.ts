import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { PLANILHA_URL } from './config';
import { EscalaService } from './escala.service';

@Component({
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  selector: 'app-root',
  templateUrl: './app.html',
})
export class App {
  protected readonly escala = inject(EscalaService);
  protected readonly planilhaUrl = PLANILHA_URL;

  constructor() {
    this.escala.carregar();
  }
}
