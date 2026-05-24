package ZiplocSAS.api.controller;

import ZiplocSAS.api.dto.ApiResponse;
import ZiplocSAS.api.dto.BilleteraDTO;
import ZiplocSAS.application.service.BilleteraService;
import ZiplocSAS.domain.model.Billetera;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;
/**
 * Controlador REST para administrar billeteras digitales de los usuarios.
 */

@RestController
@RequestMapping("/billeteras")
@RequiredArgsConstructor
public class BilleteraController {
    private final BilleteraService billeteraService;

    @PostMapping
    /**
     * Crea una billetera asociada a un usuario existente.
     *
     * @param dto datos iniciales de la billetera.
     * @return billetera creada con saldo y estado inicial.
     */
    public ResponseEntity<ApiResponse<BilleteraDTO>> crear(@RequestBody BilleteraDTO dto) {
        Billetera billetera = Billetera.builder()
                .nombre(dto.getNombre())
                .tipo(dto.getTipo())
                .saldo(dto.getSaldo() == null ? 0.0 : dto.getSaldo())
                .estado(dto.getEstado())
                .usuarioId(dto.getUsuarioId())
                .build();

        Billetera creada = billeteraService.crear(billetera);
        return ResponseEntity.ok(ApiResponse.<BilleteraDTO>builder()
                .success(true)
                .message("Billetera creada exitosamente")
                .data(mapToDTO(creada))
                .build());
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<BilleteraDTO>>> listarTodas() {
        List<BilleteraDTO> billeteras = billeteraService.listarTodas()
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.<List<BilleteraDTO>>builder()
                .success(true)
                .data(billeteras)
                .build());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BilleteraDTO>> obtenerPorId(@PathVariable String id) {
        return billeteraService.buscarPorId(id)
                .map(billetera -> ResponseEntity.ok(ApiResponse.<BilleteraDTO>builder()
                        .success(true)
                        .data(mapToDTO(billetera))
                        .build()))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/usuario/{usuarioId}")
    /**
     * Lista las billeteras pertenecientes a un usuario.
     *
     * @param usuarioId identificador del propietario.
     * @return billeteras asociadas al usuario.
     */
    public ResponseEntity<ApiResponse<List<BilleteraDTO>>> listarPorUsuario(@PathVariable String usuarioId) {
        List<BilleteraDTO> billeteras = billeteraService.listarPorUsuario(usuarioId)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.<List<BilleteraDTO>>builder()
                .success(true)
                .data(billeteras)
                .build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<BilleteraDTO>> actualizar(@PathVariable String id, @RequestBody BilleteraDTO dto) {
        return billeteraService.buscarPorId(id)
                .map(billetera -> {
                    billetera.setNombre(dto.getNombre());
                    billetera.setTipo(dto.getTipo());
                    billetera.setEstado(dto.getEstado());
                    Billetera actualizada = billeteraService.actualizar(billetera);
                    return ResponseEntity.ok(ApiResponse.<BilleteraDTO>builder()
                            .success(true)
                            .message("Billetera actualizada")
                            .data(mapToDTO(actualizada))
                            .build());
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/saldo")
    public ResponseEntity<ApiResponse<Double>> obtenerSaldo(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.<Double>builder()
                .success(true)
                .data(billeteraService.obtenerSaldo(id))
                .build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> eliminar(@PathVariable String id) {
        billeteraService.eliminar(id);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Billetera eliminada")
                .build());
    }

    private BilleteraDTO mapToDTO(Billetera billetera) {
        return BilleteraDTO.builder()
                .id(billetera.getId())
                .nombre(billetera.getNombre())
                .tipo(billetera.getTipo())
                .saldo(billetera.getSaldo())
                .estado(billetera.getEstado())
                .usuarioId(billetera.getUsuarioId())
                .build();
    }
}
