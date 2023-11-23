export class PatrimonioRequest {

    dataEntrada: string;
    descricao: string;
    valor: number;
    tipoPatrimonio: string;

    constructor(item) {
        this.dataEntrada = item?.dataEntrada;
        this.descricao = item?.descricao;
        this.valor = item?.valor;
        this.tipoPatrimonio = item?.tipoPatrimonio;
    }
}