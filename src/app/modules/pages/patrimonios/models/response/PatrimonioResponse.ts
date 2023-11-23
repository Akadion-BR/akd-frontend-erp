import { TableOptions } from "src/app/modules/shared/tabela/models/TableOptions";

export class PatrimonioResponse {
    id?: number;
    dataCadastro?: string;
    horaCadastro?: string;
    dataEntrada?: string;
    descricao?: string;
    valor?: number;
    tipoPatrimonio?: string;
    checked?: boolean;
    expanded?: boolean;
    options?: TableOptions;

    constructor(item) {
        this.id = item?.id;
        this.dataCadastro = item?.dataCadastro;
        this.horaCadastro = item?.horaCadastro;
        this.dataEntrada = item?.dataEntrada;
        this.descricao = item?.descricao;
        this.valor = item?.valor;
        this.tipoPatrimonio = item?.tipoPatrimonio;
        this.options = {
            detalhesHabilitado: true,
            editarHabilitado: true,
            removerHabilitado: true
        }
    }

    isChecked(): boolean {
        return this.checked;
    }
}