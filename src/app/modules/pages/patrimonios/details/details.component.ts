import { Subscription } from 'rxjs';
import { Component, ChangeDetectorRef, Input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PatrimonioService } from '../services/patrimonio.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PatrimonioResponse } from '../models/response/PatrimonioResponse';
import { Util } from 'src/app/modules/utils/Util';
import { Location } from '@angular/common';

@Component({
  selector: 'app-details',
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.scss']
})
export class DetailsComponent {
  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private patrimonioService: PatrimonioService,
    private _snackBar: MatSnackBar,
    private _location: Location,
    private ref: ChangeDetectorRef) {
  }

  protected idPatrimonio: number;
  @Input() patrimonio: PatrimonioResponse;

  protected obtemDetalhesDoPatrimonioPorIdSubscription$: Subscription;
  protected removeItem$: Subscription;

  ngAfterViewInit(): void {
    this.ref.detectChanges();
    this.realizaValidacaoDoIdPatrimonio();
    this.realizaObtencaoDeDadosDoPatrimonio();
  }

  ngOnDestroy(): void {
    if (Util.isNotObjectEmpty(this.obtemDetalhesDoPatrimonioPorIdSubscription$)) this.obtemDetalhesDoPatrimonioPorIdSubscription$.unsubscribe();
    if (Util.isNotObjectEmpty(this.removeItem$)) this.removeItem$.unsubscribe();
  }

  realizaValidacaoDoIdPatrimonio() {
    let id = this.activatedRoute.snapshot.paramMap.get('id')
    if (/^\d+$/.test(id)) this.idPatrimonio = parseInt(id);
    else {
      this.router.navigate(['/patrimonios']);
      this._snackBar.open("O patrimônio que você tentou acessar não existe", "Fechar", {
        duration: 3500
      });
    }
  }

  realizaObtencaoDeDadosDoPatrimonio() {
    this.obtemDetalhesDoPatrimonioPorIdSubscription$ = this.patrimonioService.obtemObjetoPorId(this.idPatrimonio).subscribe({
      next: (resposta => {
        this.patrimonio = resposta;
      }),
      error: () => {
        this.router.navigate(['/patrimonios']);
        this._snackBar.open("O patrimônio que você tentou acessar não existe", "Fechar", {
          duration: 3500
        });
      },
      complete: () => {
        console.log(this.patrimonio);
      }
    })
  }

  retornaParaTelaAnterior() {
    this._location.back();
  }

  redirecionaParaEdicao() {
    this.router.navigate(['patrimonios/update'], {
      queryParams: {
        id: this.idPatrimonio
      }
    });
  }

  imprimeItem() {
    window.print();
  }

  removeItem() {
    if (window.confirm('Tem certeza que deseja remover esse patrimônio?')) {
      this.removeItem$ = this.patrimonioService.removeObjetoPorId(this.idPatrimonio).subscribe(
        {
          next: () => {
            this._snackBar.open("Patrimônio excluído com sucesso", "Fechar", {
              duration: 3500
            });
          },
          complete: () => {
            this.retornaParaTelaAnterior();
          }
        }
      );
    }
  }

}
