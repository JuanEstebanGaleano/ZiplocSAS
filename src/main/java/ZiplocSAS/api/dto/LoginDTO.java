package ZiplocSAS.api.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
/**
 * DTO con credenciales de inicio de sesion.
 */

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginDTO {
    private String email;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    @JsonAlias({"password", "clave"})
    private String contrasena;
}
