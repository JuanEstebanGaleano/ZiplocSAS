package ZiplocSAS.domain.model;

import ZiplocSAS.domain.enums.EstadoTransaccion;
import ZiplocSAS.domain.enums.NivelRiesgo;
import ZiplocSAS.domain.enums.TipoTransaccion;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
/**
 * Movimiento financiero procesado por la plataforma.
 *
 * <p>Representa recargas, retiros, transferencias y pagos programados, junto
 * con estado, puntos generados y nivel de riesgo calculado.</p>
 */

@Document(collection = "transacciones")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Transaccion {
    @Id
    private String id;
    private LocalDateTime fecha;
    private TipoTransaccion tipo;
    private double valor;
    private String billeteraOrigenId;
    private String billeteraDestinoId;
    private EstadoTransaccion estado;
    private int puntosGenerados;
    private NivelRiesgo nivelRiesgo;

    @Override
    public String toString() {
        return String.format("Transaccion{id='%s', fecha=%s, tipo=%s, valor=%.2f, estado=%s}",
                id, fecha, tipo, valor, estado);
    }
}

