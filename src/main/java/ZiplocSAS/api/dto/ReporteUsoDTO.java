package ZiplocSAS.api.dto;

import lombok.*;

import java.time.LocalDateTime;

/**
 * DTO for ReporteUso requests/responses
 */
/**
 * DTO con metricas agregadas de actividad por usuario.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReporteUsoDTO {
    private String id;
    private String usuarioId;
    private Long totalTransacciones;
    private Double montoTotalMovilizado;
    private LocalDateTime fechaInicio;
    private LocalDateTime fechaFin;
    private Double promedioTransaccion;
    private Long billeterasMasActivas;
}

