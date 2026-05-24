package ZiplocSAS.domain.model;

import ZiplocSAS.domain.enums.EstadoBilletera;
import ZiplocSAS.domain.enums.TipoBilletera;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.*;
/**
 * Billetera digital asociada a un usuario.
 *
 * <p>Conserva saldo, estado operativo, categoria y el historial de
 * transacciones que la involucran.</p>
 */

@Document(collection = "billeteras")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = "historialTransacciones")
public class Billetera {
    @Id
    private String id;
    private String nombre;
    private TipoBilletera tipo;
    private double saldo;
    private EstadoBilletera estado;
    private String usuarioId;
    private List<Transaccion> historialTransacciones;
}

