import { Component } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { TableTd } from 'src/app/modules/shared/tabela/models/TableTd';
import { TableTh } from 'src/app/modules/shared/tabela/models/TableTh';
import { Util } from 'src/app/modules/utils/Util';
import { fadeInOutAnimation } from 'src/app/shared/animations';
import { PatrimonioService } from '../services/patrimonio.service';
import { PatrimonioResponse } from '../models/response/PatrimonioResponse';
import { PatrimonioPageObject } from '../models/response/PatrimonioPageObject';

@Component({
  selector: 'app-view',
  templateUrl: './view.component.html',
  styleUrls: ['./view.component.scss'],
  animations: [fadeInOutAnimation]
})
export class ViewComponent {
  getPatrimonios$: Subscription;
  removeSubscription$: Subscription;
  removeEmMassaSubscription$: Subscription;
  geraRelatorio$: Subscription;

  buscaPatrimonios: FormControl = new FormControl();

  itensSelecionadosNaTabela: PatrimonioResponse[] = JSON.parse(localStorage.getItem("itensSelecionadosNaTabela") || '[]');
  pageObject: PatrimonioPageObject = JSON.parse(localStorage.getItem("pageable") || 'null');

  botaoCheckAllHabilitado: boolean = JSON.parse(localStorage.getItem("checkAll") || 'false');

  constructor(private patrimonioService: PatrimonioService,
    private _snackBar: MatSnackBar) { }

  ngAfterViewInit(): void {
    console.log('AfterviewInit');
    this.invocaRequisicaoHttpGetParaAtualizarObjetos();
    if (Util.isNotObjectEmpty(this.pageObject)) this.pageObject.pageNumber = 0;

  }

  ngOnDestroy(): void {
    if (this.getPatrimonios$ != undefined) this.getPatrimonios$.unsubscribe();
    if (this.removeSubscription$ != undefined) this.removeSubscription$.unsubscribe();
    if (this.removeEmMassaSubscription$ != undefined) this.removeEmMassaSubscription$.unsubscribe();
    if (this.geraRelatorio$ != undefined) this.geraRelatorio$.unsubscribe();
  }

  obtemThsTabela(): TableTh[] {
    let thsTabela: TableTh[] = []
    thsTabela.push(
      {
        campo: 'DESCRIÇÃO',
        hidden: null
      },
      {
        campo: 'VALOR',
        hidden: null
      },
      {
        campo: 'TIPO',
        hidden: null
      },
      {
        campo: 'AQUISIÇÃO',
        hidden: null
      }
    );

    return thsTabela;
  }

  obtemTdsTabela(): TableTd[] {
    let tdsTabela: TableTd[] = []
    tdsTabela.push(
      {
        campo: 'descricao',
        hidden: null,
        maxLength: 30,
        type: 'string',
        titleCase: true,
        tableTdCustomClasses: [],
      },
      {
        campo: 'valor',
        hidden: null,
        maxLength: 18,
        type: 'money',
        titleCase: false,
        tableTdCustomClasses: [],
      },
      {
        campo: 'tipoPatrimonio',
        hidden: null,
        maxLength: 30,
        type: 'string',
        titleCase: true,
        tableTdCustomClasses: [
          {
            value: 'Ativo',
            className: 'green_span'
          },
          {
            value: 'Passivo',
            className: 'red_span'
          },
          {
            value: 'A receber',
            className: 'yellow_span'
          },
        ]
      },
      {
        campo: 'dataEntrada',
        hidden: null,
        maxLength: 10,
        type: 'date',
        titleCase: false,
        tableTdCustomClasses: []
      }
    );

    return tdsTabela;
  }

  invocaRequisicaoHttpGetParaAtualizarObjetos() {
    let buscaObjetosParam = this.buscaPatrimonios.value != null && this.buscaPatrimonios.value != '' ? this.buscaPatrimonios.value : null;
    this.getPatrimonios$ = this.patrimonioService.consultaObjetos(buscaObjetosParam, this.pageObject).subscribe(
      {
        next: (response: PatrimonioPageObject) => {
          let sortDirection = this.pageObject == null ? this.pageObject = undefined : this.pageObject.sortDirection;
          response.content.forEach(objeto => {
            objeto.options = {
              detalhesHabilitado: true,
              editarHabilitado: true,
              removerHabilitado: true
            }
          })
          this.pageObject = response;
          this.pageObject.sortDirection = sortDirection;
          if (this.pageObject.sortDirection == undefined) this.pageObject.sortDirection = 'DESC';
        },
        error: () => {
          this.pageObject = null;
        },
        complete: () => {
          console.log(this.pageObject);
          this.checkObjetosQueEstaoNoLocalStorageDeObjetosSelecionados();
        }
      });
  }

  checkObjetosQueEstaoNoLocalStorageDeObjetosSelecionados() {
    this.itensSelecionadosNaTabela.forEach(itemSelecionado => {
      let index: number = this.pageObject.content.findIndex(itemEncontrado => itemEncontrado.id === itemSelecionado.id);
      if (index != -1) this.pageObject.content[index].checked = true;
    })
  }

  recebeSolicitacaoDeAtualizacaoDaTabela() {
    this.invocaRequisicaoHttpGetParaAtualizarObjetos();
  }

  recebeBuscaFormControl(busca: FormControl) {
    this.buscaPatrimonios = busca;
  }

  recebeQtdItensPorPaginaAlterada(pageSize: number) {
    this.pageObject.pageNumber = 0;
    this.pageObject.pageSize = pageSize;
    this.invocaRequisicaoHttpGetParaAtualizarObjetos();
  }

  recebeObjetoPageableInfoAtualizadoPosTypeAhead(pageableObject: any) {
    this.pageObject = pageableObject;
  }

  recebeAtualizacaoNosChecksDaTabela(itensSelecionados: any[]) {
    this.itensSelecionadosNaTabela = itensSelecionados;
  }

  recebePageNumberAtualizado(paginaAtualizada: number) {
    this.pageObject.pageNumber = paginaAtualizada;
    this.invocaRequisicaoHttpGetParaAtualizarObjetos();
  }

  recebeSolicitacaoDeExclusao(id: number) {
    this.removeSubscription$ = this.patrimonioService.removeObjetoPorId(id).subscribe(
      {
        next: () => {
          this._snackBar.open("Patrimônio Excluído com sucesso", "Fechar", {
            duration: 3500
          });
        },
        error: () => {
          this.invocaRequisicaoHttpGetParaAtualizarObjetos()
        },
        complete: () => {
          let objetoRemovido: PatrimonioResponse[] = this.itensSelecionadosNaTabela.filter(patrimonio => patrimonio.id == id);
          if (objetoRemovido.length == 1) this.itensSelecionadosNaTabela.splice(this.itensSelecionadosNaTabela.indexOf(objetoRemovido[0]), 1);
          this.invocaRequisicaoHttpGetParaAtualizarObjetos()
        }
      }
    );
  }

  recebeSolicitacaoDeExclusaoDeObjetosEmMassa(ids: number[]) {
    this.removeEmMassaSubscription$ = this.patrimonioService.removeObjetosEmMassa(ids).subscribe(
      {
        next: () => {
          this._snackBar.open("Patrimônios Excluídos com sucesso", "Fechar", {
            duration: 3000
          });
        },
        error: () => {
          this.invocaRequisicaoHttpGetParaAtualizarObjetos();
        },
        complete: () => {
          ids.forEach(idSelecionadoNaTabela => {
            let objetoRemovido: PatrimonioResponse[] = this.itensSelecionadosNaTabela.filter(patrimonio => patrimonio.id == idSelecionadoNaTabela);
            if (objetoRemovido.length == 1) this.itensSelecionadosNaTabela.splice(this.itensSelecionadosNaTabela.indexOf(objetoRemovido[0]), 1);
          })
          this.invocaRequisicaoHttpGetParaAtualizarObjetos();
          this._snackBar.open(ids.length > 1
            ? "Patrimônios removidos com sucesso"
            : "Patrimônio removido com sucesso", "Fechar", {
            duration: 3500
          })
        }
      }
    );
  }

  recebeSolicitacaoDeRelatorio(ids: number[]) {
    this.geraRelatorio$ = this.patrimonioService.obtemRelatorioPdf(ids);
  }
}
