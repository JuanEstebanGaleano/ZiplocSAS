package ZiplocSAS.application.service;
/**
 * Excepcion de negocio usada cuando un login no puede autenticarse.
 */

public class CredencialesInvalidasException extends RuntimeException {
    public CredencialesInvalidasException(String message) {
        super(message);
    }
}
