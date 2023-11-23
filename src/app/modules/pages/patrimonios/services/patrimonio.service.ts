import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { API_CONFIG } from 'src/app/config/api-config';
import { PatrimonioRequest } from '../models/request/PatrimonioRequest';
import { Observable, catchError, map, retry, throwError } from 'rxjs';
import { PatrimonioResponse } from '../models/response/PatrimonioResponse';
import { PatrimonioPageObject } from '../models/response/PatrimonioPageObject';

@Injectable({
  providedIn: 'root'
})
export class PatrimonioService {

  constructor(private http: HttpClient, private _snackBar: MatSnackBar) { }

  private httpOptions = {
    params: new HttpParams({
    }),
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': API_CONFIG.devToken
    }),
    body: null
  }

  public atualizaObjeto(id: number, request: PatrimonioRequest): Observable<PatrimonioResponse> {
    this.httpOptions.body = null;
    return this.http.put<PatrimonioResponse>(`${API_CONFIG.baseUrl}api/sistema/v1/patrimonios/${id}`, request, this.httpOptions).pipe(
      map(resposta => new PatrimonioResponse(resposta)),
    )
  }

  public salvarNovo(request: PatrimonioRequest): Observable<PatrimonioResponse> {
    this.httpOptions.body = null;
    return this.http.post<PatrimonioResponse>(`${API_CONFIG.baseUrl}api/sistema/v1/patrimonios`, request, this.httpOptions).pipe(
      map(resposta => new PatrimonioResponse(resposta)),
    )
  }

  public obtemObjetoPorId(id: number): Observable<PatrimonioResponse> {
    this.httpOptions.params = new HttpParams();
    this.httpOptions.body = null;
    return this.http.get<PatrimonioResponse>(`${API_CONFIG.baseUrl}api/sistema/v1/patrimonios/${id}`, this.httpOptions).pipe(
      map((resposta) => new PatrimonioResponse(resposta))
    )
  }

  public consultaObjetos(valorBusca: string, pageObject: PatrimonioPageObject): Observable<PatrimonioPageObject> {
    this.httpOptions.params = new HttpParams();
    this.httpOptions.body = null;
    this.buildRequestParams(valorBusca);
    this.buildPageableParams(pageObject);
    return this.http.get<PatrimonioPageObject>(`${API_CONFIG.baseUrl}api/sistema/v1/patrimonios`, this.httpOptions).pipe(
      map(resposta => new PatrimonioPageObject(resposta)),
      catchError((error: HttpErrorResponse) => {
        this.implementaLogicaDeCapturaDeErroNaListagemDeItens(error);
        console.log(error);
        return throwError(() => new HttpErrorResponse(error));
      }),
      retry({ count: 20, delay: 10000 })
    )
  }

  public removeObjetosEmMassa(listaDeIds: number[]) {
    this.httpOptions.body = listaDeIds;
    return this.http.delete(`${API_CONFIG.baseUrl}api/sistema/v1/patrimonios`, this.httpOptions).pipe(
      catchError((httpErrorResponse: HttpErrorResponse) => {
        this.implementaLogicaDeCapturaDeErroNaExclusaoDeItens(httpErrorResponse);
        return throwError(() => new HttpErrorResponse(httpErrorResponse));
      })
    )
  }

  public removeObjetoPorId(id: number): Observable<PatrimonioResponse> {
    this.httpOptions.body = null;
    return this.http.delete<PatrimonioResponse>(`${API_CONFIG.baseUrl}api/sistema/v1/patrimonios/${id}`, this.httpOptions).pipe(
      map(resposta => new PatrimonioResponse(resposta)),
      catchError((httpErrorResponse: HttpErrorResponse) => {
        this.implementaLogicaDeCapturaDeErroNaExclusaoDeItens(httpErrorResponse);
        return throwError(() => new HttpErrorResponse(httpErrorResponse));
      })
    )
  }

  public obtemRelatorioPdf(listaDeIds: number[]): any {
    this.http.post(`${API_CONFIG.baseUrl}api/sistema/v1/patrimonios/relatorio`, listaDeIds, { headers: this.httpOptions.headers, responseType: "blob" })
      .subscribe(
        ((response) => {
          let blob = new Blob([response], { type: 'application/pdf' });
          let fileURL = URL.createObjectURL(blob);
          let tagUrlRelatorio = document.createElement('a');
          tagUrlRelatorio.href = fileURL;
          tagUrlRelatorio.target = '_blank';
          tagUrlRelatorio.download = 'akadion-patrimonios-' + new Date().getTime().toString() + '.pdf';
          document.body.appendChild(tagUrlRelatorio);
          tagUrlRelatorio.click();
        })
      );
  }

  private implementaLogicaDeCapturaDeErroNaListagemDeItens(error) {
    if (error.status == 403) {
      /*  Quando implantar ng-guard, implementar meio de não permitir duplicidade de acesso nesse método,
       pois o de metadados e o de obtenção paginada irão acessa-lo em caso de erro de servidor. Uma boa
       ideia para resolver esse problema, seria verificar se existe algum token ativo no localstorage para
       acessar a condição do método */
      console.log('Sem autorização, elaborar lógica de logout e redirect no método');
    }
    else {
      this._snackBar.open("Houve uma falha de comunicação com o servidor", "Fechar", {
        duration: 12000
      });
    }
  }

  private implementaLogicaDeCapturaDeErroNaExclusaoDeItens(error: HttpErrorResponse) {
    if (error.status == 403) {
      /*  Quando implantar ng-guard, implementar meio de não permitir duplicidade de acesso nesse método,
       pois o de metadados e o de obtenção paginada irão acessa-lo em caso de erro de servidor. Uma boa
       ideia para resolver esse problema, seria verificar se existe algum token ativo no localstorage para
       acessar a condição do método */
      console.log('Sem autorização, elaborar lógica de logout e redirect no método');
    }
    else if (error.status == 400) {
      this._snackBar.open(error.error.error, "Fechar", {
        duration: 3500
      });
    }
    else {
      this._snackBar.open("Houve uma falha de comunicação com o servidor", "Fechar", {
        duration: 3500
      });
    }
  }

  private buildRequestParams(busca: string) {
    if (busca != null && busca != undefined && busca != '') {
      this.httpOptions.params = this.httpOptions.params.set('busca', busca)
    }
  }

  private buildPageableParams(pageableInfo: PatrimonioPageObject) {
    if (pageableInfo != null) {
      this.httpOptions.params = this.httpOptions.params.set('page', pageableInfo.pageNumber);
      this.httpOptions.params = this.httpOptions.params.set('size', pageableInfo.pageSize);
      this.httpOptions.params = this.httpOptions.params.set('sort', 'dataCadastro,' + pageableInfo.sortDirection);
      this.httpOptions.params = this.httpOptions.params.append('sort', 'horaCadastro,' + pageableInfo.sortDirection);
    }
    else {
      this.httpOptions.params = this.httpOptions.params.set('page', 0);
      this.httpOptions.params = this.httpOptions.params.set('size', 10);
      this.httpOptions.params = this.httpOptions.params.set('sort', 'dataCadastro,DESC');
      this.httpOptions.params = this.httpOptions.params.append('sort', 'horaCadastro,DESC');
    }
  }
}
