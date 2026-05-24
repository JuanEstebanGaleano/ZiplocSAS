package ZiplocSAS.api.dto;

import ZiplocSAS.domain.enums.NivelUsuario;
import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.time.LocalDateTime;

/**
 * DTO for Usuario requests/responses
 */
/**
 * DTO de entrada y salida para usuarios.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UsuarioDTO {
    private String id;
    private String nombre;
    private String email;
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    @JsonAlias({"password", "clave"})
    private String contrasena;
    private String telefono;
    private NivelUsuario nivel;
    private Integer puntosAcumulados;
    private LocalDateTime fechaRegistro;
}

