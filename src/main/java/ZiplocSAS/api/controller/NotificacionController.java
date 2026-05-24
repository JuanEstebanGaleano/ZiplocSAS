package ZiplocSAS.api.controller;

import ZiplocSAS.api.dto.ApiResponse;
import ZiplocSAS.application.service.NotificacionService;
import ZiplocSAS.domain.model.Alerta;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
/**
 * Controlador REST para consultar y despachar alertas de usuario.
 */

@RestController
@RequestMapping("/notificaciones")
@RequiredArgsConstructor
public class NotificacionController {
    private final NotificacionService notificacionService;

    @GetMapping("/{usuarioId}")
    public ResponseEntity<ApiResponse<List<Alerta>>> listar(@PathVariable String usuarioId) {
        return ResponseEntity.ok(ApiResponse.<List<Alerta>>builder()
                .success(true)
                .data(notificacionService.listarPorUsuario(usuarioId))
                .build());
    }

    @PostMapping("/{usuarioId}/despachar")
    public ResponseEntity<ApiResponse<Alerta>> despachar(@PathVariable String usuarioId) {
        return notificacionService.despachar(usuarioId)
                .map(alerta -> ResponseEntity.ok(ApiResponse.<Alerta>builder()
                        .success(true)
                        .data(alerta)
                        .build()))
                .orElse(ResponseEntity.ok(ApiResponse.<Alerta>builder()
                        .success(false)
                        .message("No hay notificaciones pendientes")
                        .build()));
    }

    @PutMapping("/{usuarioId}/{alertaId}/leer")
    public ResponseEntity<ApiResponse<Boolean>> marcarLeida(
            @PathVariable String usuarioId,
            @PathVariable String alertaId) {
        boolean marcada = notificacionService.marcarLeida(usuarioId, alertaId);
        return ResponseEntity.ok(ApiResponse.<Boolean>builder()
                .success(marcada)
                .data(marcada)
                .message(marcada ? "Notificacion marcada como leida" : "Notificacion no encontrada")
                .build());
    }
}
