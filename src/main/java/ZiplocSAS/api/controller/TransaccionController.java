package ZiplocSAS.api.controller;

import ZiplocSAS.api.dto.ApiResponse;
import ZiplocSAS.api.dto.TransaccionDTO;
import ZiplocSAS.application.service.TransaccionService;
import ZiplocSAS.domain.enums.TipoTransaccion;
import ZiplocSAS.domain.model.Transaccion;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;
/**
 * Controlador REST para crear, consultar y revertir transacciones.
 */

@RestController
@RequestMapping("/transacciones")
@RequiredArgsConstructor
public class TransaccionController {
    private final TransaccionService transaccionService;

    @PostMapping
    /**
     * Crea una transaccion segun el tipo indicado en el DTO.
     *
     * @param dto datos de la transaccion solicitada.
     * @return transaccion procesada con estado, puntos y riesgo.
     */
    public ResponseEntity<ApiResponse<TransaccionDTO>> crear(@RequestBody TransaccionDTO dto) {
        Transaccion transaccion = Transaccion.builder()
                .tipo(dto.getTipo())
                .valor(dto.getValor() == null ? 0.0 : dto.getValor())
                .billeteraOrigenId(dto.getBilleteraOrigenId())
                .billeteraDestinoId(dto.getBilleteraDestinoId())
                .build();

        Transaccion creada = transaccionService.crear(transaccion);
        return ResponseEntity.ok(ApiResponse.<TransaccionDTO>builder()
                .success(true)
                .message("Transaccion creada exitosamente")
                .data(mapToDTO(creada))
                .build());
    }

    @PostMapping("/recargar")
    public ResponseEntity<ApiResponse<TransaccionDTO>> recargar(@RequestBody TransaccionDTO dto) {
        dto.setTipo(TipoTransaccion.RECARGA);
        return crear(dto);
    }

    @PostMapping("/retirar")
    public ResponseEntity<ApiResponse<TransaccionDTO>> retirar(@RequestBody TransaccionDTO dto) {
        dto.setTipo(TipoTransaccion.RETIRO);
        return crear(dto);
    }

    @PostMapping("/transferir")
    /**
     * Atajo HTTP para crear transferencias entre billeteras.
     *
     * @param dto billetera origen, destino y valor.
     * @return resultado de la transferencia.
     */
    public ResponseEntity<ApiResponse<TransaccionDTO>> transferir(@RequestBody TransaccionDTO dto) {
        dto.setTipo(TipoTransaccion.TRANSFERENCIA);
        return crear(dto);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TransaccionDTO>> obtenerPorId(@PathVariable String id) {
        return transaccionService.buscarPorId(id)
                .map(transaccion -> ResponseEntity.ok(ApiResponse.<TransaccionDTO>builder()
                        .success(true)
                        .data(mapToDTO(transaccion))
                        .build()))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/billetera/{billeteraId}")
    public ResponseEntity<ApiResponse<List<TransaccionDTO>>> listarPorBilletera(@PathVariable String billeteraId) {
        List<TransaccionDTO> transacciones = transaccionService.listarPorBilletera(billeteraId)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.<List<TransaccionDTO>>builder()
                .success(true)
                .data(transacciones)
                .build());
    }

    @GetMapping("/mayor-valor")
    public ResponseEntity<ApiResponse<List<TransaccionDTO>>> mayoresValores(
            @RequestParam(defaultValue = "10") int limite) {
        List<TransaccionDTO> transacciones = transaccionService.mayoresValores(limite)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.<List<TransaccionDTO>>builder()
                .success(true)
                .data(transacciones)
                .build());
    }

    @PostMapping("/{id}/revertir")
    public ResponseEntity<ApiResponse<Boolean>> revertir(@PathVariable String id) {
        boolean reverted = transaccionService.revertir(id);
        return ResponseEntity.ok(ApiResponse.<Boolean>builder()
                .success(reverted)
                .message(reverted ? "Transaccion revertida" : "No se pudo revertir")
                .data(reverted)
                .build());
    }

    @PostMapping("/revertir-ultima")
    public ResponseEntity<ApiResponse<TransaccionDTO>> revertirUltima() {
        return transaccionService.revertirUltima()
                .map(transaccion -> ResponseEntity.ok(ApiResponse.<TransaccionDTO>builder()
                        .success(true)
                        .message("Ultima transaccion revertida")
                        .data(mapToDTO(transaccion))
                        .build()))
                .orElse(ResponseEntity.ok(ApiResponse.<TransaccionDTO>builder()
                        .success(false)
                        .message("No hay transacciones reversibles")
                        .build()));
    }

    private TransaccionDTO mapToDTO(Transaccion transaccion) {
        return TransaccionDTO.builder()
                .id(transaccion.getId())
                .fecha(transaccion.getFecha())
                .tipo(transaccion.getTipo())
                .valor(transaccion.getValor())
                .billeteraOrigenId(transaccion.getBilleteraOrigenId())
                .billeteraDestinoId(transaccion.getBilleteraDestinoId())
                .estado(transaccion.getEstado())
                .puntosGenerados(transaccion.getPuntosGenerados())
                .nivelRiesgo(transaccion.getNivelRiesgo())
                .build();
    }
}
