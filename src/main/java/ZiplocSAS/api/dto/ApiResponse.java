package ZiplocSAS.api.dto;

import lombok.*;

/**
 * Generic API Response wrapper
 */
/**
 * Envoltorio generico para respuestas estandarizadas de la API.
 *
 * @param <T> tipo de dato transportado en la respuesta.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApiResponse<T> {
    private Boolean success;
    private String message;
    private T data;
    private String error;
}

