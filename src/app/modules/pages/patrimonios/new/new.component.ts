import { DatePipe, Location } from '@angular/common';
import { ChangeDetectorRef, Component, ElementRef, ViewChild } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Util } from 'src/app/modules/utils/Util';
import { fadeInOutAnimation } from 'src/app/shared/animations';
import { PatrimonioService } from '../services/patrimonio.service';
import { PatrimonioRequest } from '../models/request/PatrimonioRequest';
import { PatrimonioResponse } from '../models/response/PatrimonioResponse';
import { SelectOption } from 'src/app/modules/shared/inputs/models/select-option';

@Component({
  selector: 'app-new',
  templateUrl: './new.component.html',
  styleUrls: ['./new.component.scss'],
  animations: [fadeInOutAnimation]
})
export class NewComponent {

  constructor(private formBuilder: FormBuilder,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private _snackBar: MatSnackBar,
    private datePipe: DatePipe,
    private location: Location,
    private patrimonioService: PatrimonioService,
    private ref: ChangeDetectorRef) { }

  @ViewChild('inputValor') inputValor: ElementRef;

  protected dadosPatrimonio: FormGroup = this.createForm();

  protected patrimonioRequest: PatrimonioRequest;
  protected patrimonioPreAtualizacao: PatrimonioResponse;

  titulo: string = 'Cadastrar novo patrimônio';
  idPatrimonio: number = null;

  private criaNovoPatrimonioSubscription$: Subscription;
  private obtemPatrimonioPorIdSubscription$: Subscription;
  private atualizaPatrimonioSubscription$: Subscription;

  ngOnInit() {
    this.activatedRoute.queryParamMap.subscribe((params) => {
      if (params.has('id')) {
        this.titulo = 'Editar patrimônio';
        let id = params.get('id');
        if (/^\d+$/.test(id)) {
          this.idPatrimonio = parseInt(id);
          this.inicializaPatrimonio(parseInt(id));
        }
        else {
          this.router.navigate(['/patrimonios']);
          this._snackBar.open("O patrimônio que você tentou editar não existe", "Fechar", {
            duration: 3500
          });
        }
      }
    });
  }

  ngAfterViewInit(): void {
    this.ref.detectChanges();
  }

  ngOnDestroy(): void {
    if (this.criaNovoPatrimonioSubscription$ != undefined) this.criaNovoPatrimonioSubscription$.unsubscribe();
    if (this.obtemPatrimonioPorIdSubscription$ != undefined) this.obtemPatrimonioPorIdSubscription$.unsubscribe();
    if (this.atualizaPatrimonioSubscription$ != undefined) this.atualizaPatrimonioSubscription$.unsubscribe();
  }

  private createForm(): FormGroup {
    return this.formBuilder.group({
      descricao: [
        '',
        [
          Validators.required,
          Validators.maxLength(50)
        ]
      ],
      valor: [
        '',
        [
          Validators.required,
          Validators.min(1),
          Validators.max(999999999)
        ]
      ],
      tipoPatrimonio: [
        'ATIVO',
        [
          Validators.required
        ]
      ],
      dataEntrada: [
        Util.getDiaMesAnoAtual(),
        [
          Validators.required,
          this.customValidatorDataEntrada()
        ]
      ],
    });
  }

  protected getValueAtributoDadosPatrimonio(atributo: string): any {
    if (Util.isObjectEmpty(this.dadosPatrimonio)) return null;
    return this.dadosPatrimonio.controls[atributo].value;
  }

  protected geraOptionsTipoPatrimonio(): SelectOption[] {
    let options: SelectOption[] = [
      {
        text: 'Ativo',
        value: 'ATIVO'
      },
      {
        text: 'Passivo',
        value: 'PASSIVO'
      },
      {
        text: 'A receber',
        value: 'A_RECEBER'
      }
    ]
    return options;
  }

  protected getHoje(): string {
    return Util.getDiaMesAnoAtual();
  }

  protected realizaTratamentoValor(evento) {

    if (evento.data == '-') {
      this.dadosPatrimonio.controls['valor'].setValue(0);
    }

    if (this.getValueAtributoDadosPatrimonio('valor') != null) {
      if (this.getValueAtributoDadosPatrimonio('valor') < 0 || this.getValueAtributoDadosPatrimonio('valor').toString().includes('-')) {
        this.dadosPatrimonio.controls['valor'].setValue(0);
      }
      if (this.inputValor.nativeElement.value.toString().startsWith('0')) {
        this.dadosPatrimonio.controls['valor'].setValue(this.getValueAtributoDadosPatrimonio('valor'));
      }

      let inputValorSplitted = this.inputValor.nativeElement.value.toString().split(".")
      if (inputValorSplitted.length == 2) {
        if (inputValorSplitted[1].length > 2) {
          this.dadosPatrimonio.controls['valor'].setValue(parseFloat(inputValorSplitted[0] + '.' + inputValorSplitted[1].slice(0, 2)));
        }
      }
    }
  }

  customValidatorDataEntrada(): ValidatorFn {

    return (formGroup: AbstractControl): ValidationErrors | null => {
      if (this.getValueAtributoDadosPatrimonio('dataEntrada') == null)
        return null;

      if (Util.isEmptyString(this.getValueAtributoDadosPatrimonio('dataEntrada'))) {
        return null;
      }

      let today: Date = new Date();
      today.setHours(0, 0, 0, 0);

      let minDate: Date = new Date();
      minDate.setFullYear(1900);

      let splittedDataInput: any[] = this.getValueAtributoDadosPatrimonio('dataEntrada').split('-');
      let dataEntradaInput = new Date(splittedDataInput[0], splittedDataInput[1] - 1, splittedDataInput[2]);

      if (dataEntradaInput > today
        || (dataEntradaInput.getFullYear() < minDate.getFullYear())
        || dataEntradaInput.toString() == 'Invalid Date') {
        return { nameWrong: true };
      }

      return null;
    }
  }

  inicializaPatrimonio(id: number) {
    this.obtemPatrimonioPorIdSubscription$ = this.patrimonioService.obtemObjetoPorId(id).subscribe({
      next: (response: PatrimonioResponse) => {
        this.patrimonioPreAtualizacao = response;
      },
      complete: () => {
        this.patrimonioRequest = {
          dataEntrada: this.patrimonioPreAtualizacao.dataEntrada,
          descricao: this.patrimonioPreAtualizacao.descricao,
          valor: this.patrimonioPreAtualizacao.valor,
          tipoPatrimonio: this.patrimonioPreAtualizacao.tipoPatrimonio
        }
        this.setupValoresFormulario();
        this.setupValidatorsFormulario();
      }
    })
  }

  setupValoresFormulario() {
    this.dadosPatrimonio.setValue(
      {
        dataEntrada: this.patrimonioPreAtualizacao.dataEntrada,
        descricao: this.patrimonioPreAtualizacao.descricao,
        valor: this.patrimonioPreAtualizacao.valor,
        tipoPatrimonio: this.patrimonioPreAtualizacao.tipoPatrimonio
      }
    )
  }

  setupValidatorsFormulario() {
    // TODO
  }

  retornaParaTelaAnterior() {
    this.location.back();
  }

  protected solicitarEnvioDeFormulario() {
    if (this.dadosPatrimonio.valid) this.direcionaEnvioDeFormulario();
    else {
      this.dadosPatrimonio.markAllAsTouched();
      this._snackBar.open('Ops! Algum campo está incorreto. Revise o formulário e tente novamente.', "Fechar", {
        duration: 3500
      })
    }
  }

  construirObjeto() {
    this.patrimonioRequest = {
      dataEntrada: Util.isNotEmptyString(this.getValueAtributoDadosPatrimonio('dataEntrada'))
        ? this.getValueAtributoDadosPatrimonio('dataEntrada')
        : null,
      descricao: Util.isNotEmptyString(this.getValueAtributoDadosPatrimonio('descricao'))
        ? this.getValueAtributoDadosPatrimonio('descricao')
        : null,
      valor: Util.isNotEmptyString(this.getValueAtributoDadosPatrimonio('valor'))
        ? this.getValueAtributoDadosPatrimonio('valor')
        : null,
      tipoPatrimonio: Util.isNotEmptyString(this.getValueAtributoDadosPatrimonio('tipoPatrimonio'))
        ? this.getValueAtributoDadosPatrimonio('tipoPatrimonio')
        : null,
    }
  }

  public direcionaEnvioDeFormulario() {
    this.construirObjeto();
    if (Util.isNotEmptyString(this.getValueAtributoDadosPatrimonio('dataEntrada')))
      this.patrimonioRequest.dataEntrada = this.datePipe.transform(this.getValueAtributoDadosPatrimonio('dataEntrada'), "yyyy-MM-dd");

    if (this.dadosPatrimonio.valid) {
      if (Util.isEmptyNumber(this.idPatrimonio)) this.enviaFormularioCriacao();
      else this.enviaFormularioAtualizacao();
    }
  }

  private enviaFormularioCriacao() {
    this.criaNovoPatrimonioSubscription$ =
      this.patrimonioService.salvarNovo(this.patrimonioRequest).subscribe({
        error: error => {
          this._snackBar.open("Ocorreu um erro ao cadastrar o patrimônio", "Fechar", {
            duration: 3500
          })
        },
        complete: () => {
          this.router.navigate(['/patrimonios']);
          this._snackBar.open("Patrimônio cadastrado com sucesso", "Fechar", {
            duration: 3500
          });
        }
      });
  }

  private enviaFormularioAtualizacao() {
    this.atualizaPatrimonioSubscription$ =
      this.patrimonioService.atualizaObjeto(this.idPatrimonio, this.patrimonioRequest).subscribe({
        error: error => {
          this._snackBar.open("Ocorreu um erro ao atualizar o patrimônio", "Fechar", {
            duration: 3500
          })
        },
        complete: () => {
          this.router.navigate(['/patrimonios']);
          this._snackBar.open("Patrimônio atualizado com sucesso", "Fechar", {
            duration: 3500
          });
        }
      });
  }

}
