package ZiplocSAS.domain.model;

import ZiplocSAS.domain.enums.NivelUsuario;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.*;
/**
 * Usuario registrado en la plataforma de billeteras digitales.
 *
 * <p>Almacena datos de identidad, credenciales protegidas, nivel de
 * fidelizacion, puntos acumulados y billeteras asociadas.</p>
 */

@Document(collection = "usuarios")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {"wallets", "passwordHash"})
public class Usuario {
    @Id
    private String id;
    private String nombre;
    @Indexed(unique = true)
    private String email;
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String passwordHash;
    private String telefono;
    private NivelUsuario nivel;
    private int puntosAcumulados;
    private LocalDateTime fechaRegistro;
    private List<Billetera> wallets;
}

