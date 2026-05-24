package ZiplocSAS.api.controller;

import ZiplocSAS.api.dto.ApiResponse;
import ZiplocSAS.application.service.CredencialesInvalidasException;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.NoSuchElementException;
/**
 * Manejador centralizado de excepciones para respuestas HTTP consistentes.
 */

@RestControllerAdvice
public class ApiExceptionHandler {

    /**
     * Convierte recursos inexistentes en respuestas 404.
     *
     * @param ex excepcion lanzada por servicios o repositorios.
     * @return respuesta estandarizada con detalle del recurso faltante.
     */
    @ExceptionHandler(NoSuchElementException.class)
    public ResponseEntity<ApiResponse<Void>> notFound(NoSuchElementException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.<Void>builder()
                .success(false)
                .message("Recurso no encontrado")
                .error(ex.getMessage())
                .build());
    }

    @ExceptionHandler({
            IllegalArgumentException.class,
            HttpMessageNotReadableException.class,
            MethodArgumentNotValidException.class,
            MethodArgumentTypeMismatchException.class
    })
    /**
     * Convierte errores de validacion y parseo en respuestas 400.
     *
     * @param ex excepcion de validacion de entrada.
     * @return respuesta estandarizada para solicitudes invalidas.
     */
    public ResponseEntity<ApiResponse<Void>> badRequest(Exception ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.<Void>builder()
                .success(false)
                .message("Solicitud invalida")
                .error(ex.getMessage())
                .build());
    }

    /**
     * Reporta violaciones de indices unicos de MongoDB como solicitud invalida.
     *
     * @param ex excepcion de clave duplicada.
     * @return respuesta estandarizada de error 400.
     */
    @ExceptionHandler(DuplicateKeyException.class)
    public ResponseEntity<ApiResponse<Void>> duplicateKey(DuplicateKeyException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.<Void>builder()
                .success(false)
                .message("Solicitud invalida")
                .error("Ya existe un usuario registrado con ese email")
                .build());
    }

    /**
     * Convierte credenciales incorrectas en respuestas 401.
     *
     * @param ex excepcion de autenticacion.
     * @return respuesta estandarizada de no autorizado.
     */
    @ExceptionHandler(CredencialesInvalidasException.class)
    public ResponseEntity<ApiResponse<Void>> unauthorized(CredencialesInvalidasException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.<Void>builder()
                .success(false)
                .message("Credenciales invalidas")
                .error(ex.getMessage())
                .build());
    }

    /**
     * Captura errores no esperados para evitar respuestas sin formato.
     *
     * @param ex excepcion no clasificada.
     * @return respuesta estandarizada de error interno.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> internalError(Exception ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ApiResponse.<Void>builder()
                .success(false)
                .message("Error interno")
                .error(ex.getMessage())
                .build());
    }
}
