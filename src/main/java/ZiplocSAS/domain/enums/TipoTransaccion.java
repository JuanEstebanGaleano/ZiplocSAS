package ZiplocSAS.domain.enums;
/**
 * Tipos de movimientos financieros soportados por la plataforma.
 */

public enum TipoTransaccion {
    RECARGA("Deposit funds"),
    RETIRO("Withdrawal"),
    TRANSFERENCIA("Transfer between wallets"),
    PAGO_PROGRAMADO("Scheduled payment");

    private final String descripcion;

    TipoTransaccion(String descripcion) {
        this.descripcion = descripcion;
    }

    public String getDescripcion() {
        return descripcion;
    }
}
