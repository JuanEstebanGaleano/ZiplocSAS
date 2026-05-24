package ZiplocSAS.api.controller;

import ZiplocSAS.api.dto.ApiResponse;
import ZiplocSAS.api.dto.GrafoAnaliticaDTO;
import ZiplocSAS.api.dto.ReporteUsoDTO;
import ZiplocSAS.api.dto.UsuarioActivoDTO;
import ZiplocSAS.application.service.ServicioAnalitica;
import ZiplocSAS.domain.model.Billetera;
import ZiplocSAS.domain.model.Transaccion;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
/**
 * Expone reportes, rankings y vistas de analitica para el frontend.
 */

@RestController
@RequestMapping("/analitica")
@RequiredArgsConstructor
public class AnaliticaController {
    private final ServicioAnalitica servicioAnalitica;

    @GetMapping("/reporte/{usuarioId}")
    /**
     * Genera un resumen de uso para un usuario especifico.
     *
     * @param usuarioId identificador del usuario analizado.
     * @return reporte con volumen, promedio y rango temporal de transacciones.
     */
    public ResponseEntity<ApiResponse<ReporteUsoDTO>> generarReporte(@PathVariable String usuarioId) {
        return ResponseEntity.ok(ApiResponse.<ReporteUsoDTO>builder()
                .success(true)
                .message("Reporte generado")
                .data(servicioAnalitica.generarReporte(usuarioId))
                .build());
    }

    @GetMapping("/top-billeteras")
    public ResponseEntity<ApiResponse<List<Billetera>>> obtenerTopBilleteras() {
        return ResponseEntity.ok(ApiResponse.<List<Billetera>>builder()
                .success(true)
                .data(servicioAnalitica.billeterasConMayorUso())
                .build());
    }

    @GetMapping("/usuarios-activos")
    /**
     * Lista usuarios ordenados por actividad e incluye sus puntos acumulados.
     *
     * @return lista plana de usuarios activos para tablas del frontend.
     */
    public ResponseEntity<List<UsuarioActivoDTO>> usuariosActivos() {
        return ResponseEntity.ok(servicioAnalitica.usuariosActivosResumen());
    }

    @GetMapping("/auditoria/{usuarioId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> consultarAuditoria(@PathVariable String usuarioId) {
        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder()
                .success(true)
                .data(servicioAnalitica.consultarAuditoria(usuarioId))
                .build());
    }

    @GetMapping("/frecuencia-tipos")
    public ResponseEntity<ApiResponse<Map<?, Long>>> frecuenciaPorTipo() {
        return ResponseEntity.ok(ApiResponse.<Map<?, Long>>builder()
                .success(true)
                .data(servicioAnalitica.frecuenciaPorTipo())
                .build());
    }

    @GetMapping("/categorias-activas")
    public ResponseEntity<ApiResponse<Map<?, Long>>> categoriasMasActivas() {
        return ResponseEntity.ok(ApiResponse.<Map<?, Long>>builder()
                .success(true)
                .data(servicioAnalitica.categoriasMasActivas())
                .build());
    }

    @GetMapping("/monto-total")
    public ResponseEntity<ApiResponse<Double>> montoTotal(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime inicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fin) {
        return ResponseEntity.ok(ApiResponse.<Double>builder()
                .success(true)
                .data(servicioAnalitica.montoTotalMovilizado(inicio, fin))
                .build());
    }

    @GetMapping("/grafo/{usuarioId}")
    /**
     * Devuelve el grafo global de transferencias en formato de nodos y enlaces.
     *
     * @param usuarioId usuario usado para validar existencia antes del analisis.
     * @return estructura JSON con nodos y aristas referenciadas por id.
     */
    public ResponseEntity<GrafoAnaliticaDTO> analizarGrafo(@PathVariable String usuarioId) {
        return ResponseEntity.ok(servicioAnalitica.grafoTransferencias(usuarioId));
    }

    @GetMapping("/transacciones-mayor-valor")
    public ResponseEntity<ApiResponse<List<Transaccion>>> transaccionesMayorValor(
            @RequestParam(defaultValue = "10") int limite) {
        return ResponseEntity.ok(ApiResponse.<List<Transaccion>>builder()
                .success(true)
                .data(servicioAnalitica.transaccionesMayorValor(limite))
                .build());
    }

    @GetMapping("/rendimiento/{usuarioId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> compararRendimiento(@PathVariable String usuarioId) {
        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder()
                .success(true)
                .data(servicioAnalitica.compararRendimiento(usuarioId))
                .build());
    }
}
