package ZiplocSAS.api.controller;

import ZiplocSAS.api.dto.ApiResponse;
import ZiplocSAS.application.service.SistemaRecompensas;
import ZiplocSAS.application.service.UsuarioService;
import ZiplocSAS.domain.model.Beneficio;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
/**
 * Controlador REST para consultar beneficios y canjear recompensas.
 */

@RestController
@RequestMapping("/recompensas")
@RequiredArgsConstructor
public class RecompensaController {
    private final SistemaRecompensas sistemaRecompensas;
    private final UsuarioService usuarioService;

    @GetMapping("/beneficios")
    public ResponseEntity<ApiResponse<List<Beneficio>>> listarBeneficios() {
        return ResponseEntity.ok(ApiResponse.<List<Beneficio>>builder()
                .success(true)
                .data(sistemaRecompensas.listarBeneficios())
                .build());
    }

    @GetMapping("/{usuarioId}/puntos")
    public ResponseEntity<ApiResponse<Integer>> obtenerPuntos(@PathVariable String usuarioId) {
        return usuarioService.buscarPorId(usuarioId)
                .map(usuario -> ResponseEntity.ok(ApiResponse.<Integer>builder()
                        .success(true)
                        .data(usuario.getPuntosAcumulados())
                        .build()))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{usuarioId}/nivel")
    public ResponseEntity<ApiResponse<String>> obtenerNivel(@PathVariable String usuarioId) {
        return usuarioService.buscarPorId(usuarioId)
                .map(usuario -> ResponseEntity.ok(ApiResponse.<String>builder()
                        .success(true)
                        .data(usuario.getNivel().name())
                        .build()))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{usuarioId}/canjear/{beneficioId}")
    public ResponseEntity<ApiResponse<Boolean>> canjearBeneficio(
            @PathVariable String usuarioId,
            @PathVariable String beneficioId) {

        boolean success = sistemaRecompensas.canjearBeneficio(usuarioId, beneficioId);
        return ResponseEntity.ok(ApiResponse.<Boolean>builder()
                .success(success)
                .message(success ? "Beneficio canjeado exitosamente" : "No se pudo canjear el beneficio")
                .data(success)
                .build());
    }
}
