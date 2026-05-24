package ZiplocSAS.domain.enums;
/**
 * Categorias funcionales que puede tener una billetera.
 */

public enum TipoBilletera {
    AHORRO("Savings pocket"),
    AHORROS("Savings Account"),
    GASTOS_DIARIOS("Daily expenses"),
    COMPRAS("Purchases"),
    TRANSPORTE("Transport"),
    CORRIENTE("Checking Account"),
    INVERSION("Investment Account"),
    CREDITO("Credit Account");

    private final String descripcion;

    TipoBilletera(String descripcion) {
        this.descripcion = descripcion;
    }

    public String getDescripcion() {
        return descripcion;
    }
}
