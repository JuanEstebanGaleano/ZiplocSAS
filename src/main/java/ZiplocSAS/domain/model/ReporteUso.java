package ZiplocSAS.domain.model;

import lombok.*;

import java.time.LocalDateTime;
/**
 * Reporte agregado de uso financiero de un usuario.
 */

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReporteUso {
    private String id;
    private String usuarioId;
    private long totalTransacciones;
    private double montoTotalMovilizado;
    private LocalDateTime fechaInicio;
    private LocalDateTime fechaFin;
    private double promedioTransaccion;
    private long billeterasMasActivas;

    @Override
    public String toString() {
        return String.format("ReporteUso{id='%s', usuarioId='%s', totalTransacciones=%d, montoTotalMovilizado=%.2f}",
                id, usuarioId, totalTransacciones, montoTotalMovilizado);
    }
}

