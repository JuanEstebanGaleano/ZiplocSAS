package ZiplocSAS.api.controller;

import ZiplocSAS.api.dto.ApiResponse;
import ZiplocSAS.api.dto.OperacionProgramadaDTO;
import ZiplocSAS.application.service.OperacionProgramadaService;
import ZiplocSAS.domain.model.OperacionProgramada;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;
/**
 * Controlador REST para pagos y transferencias programadas.
 */

@RestController
@RequestMapping("/programadas")
@RequiredArgsConstructor
public class OperacionProgramadaController {
    private final OperacionProgramadaService operacionProgramadaService;

    @PostMapping
    /**
     * Agenda una operacion para ejecutarse en una fecha futura o inmediata.
     *
     * @param dto datos de la operacion programada.
     * @return operacion guardada en la cola de prioridad.
     */
    public ResponseEntity<ApiResponse<OperacionProgramadaDTO>> programar(@RequestBody OperacionProgramadaDTO dto) {
        OperacionProgramada operacion = OperacionProgramada.builder()
                .fechaEjecucion(dto.getFechaEjecucion())
                .tipo(dto.getTipo())
                .valor(dto.getValor() == null ? 0.0 : dto.getValor())
                .billeteraOrigenId(dto.getBilleteraOrigenId())
                .billeteraDestinoId(dto.getBilleteraDestinoId())
                .prioridad(dto.getPrioridad() == null ? 0 : dto.getPrioridad())
                .build();

        OperacionProgramada creada = operacionProgramadaService.programar(operacion);
        return ResponseEntity.ok(ApiResponse.<OperacionProgramadaDTO>builder()
                .success(true)
                .message("Operacion programada")
                .data(mapToDTO(creada))
                .build());
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<OperacionProgramadaDTO>>> listarPendientes() {
        return ResponseEntity.ok(ApiResponse.<List<OperacionProgramadaDTO>>builder()
                .success(true)
                .data(operacionProgramadaService.listarPendientes().stream().map(this::mapToDTO).toList())
                .build());
    }

    @GetMapping("/procesadas")
    public ResponseEntity<ApiResponse<List<OperacionProgramadaDTO>>> listarProcesadas() {
        return ResponseEntity.ok(ApiResponse.<List<OperacionProgramadaDTO>>builder()
                .success(true)
                .data(operacionProgramadaService.listarProcesadas().stream().map(this::mapToDTO).toList())
                .build());
    }

    @PostMapping("/procesar")
    public ResponseEntity<ApiResponse<List<OperacionProgramadaDTO>>> procesar(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime hasta) {
        List<OperacionProgramadaDTO> procesadas = operacionProgramadaService.procesarPendientes(hasta)
                .stream()
                .map(this::mapToDTO)
                .toList();
        return ResponseEntity.ok(ApiResponse.<List<OperacionProgramadaDTO>>builder()
                .success(true)
                .message("Operaciones procesadas")
                .data(procesadas)
                .build());
    }

    private OperacionProgramadaDTO mapToDTO(OperacionProgramada operacion) {
        return OperacionProgramadaDTO.builder()
                .id(operacion.getId())
                .fechaEjecucion(operacion.getFechaEjecucion())
                .tipo(operacion.getTipo())
                .valor(operacion.getValor())
                .billeteraOrigenId(operacion.getBilleteraOrigenId())
                .billeteraDestinoId(operacion.getBilleteraDestinoId())
                .ejecutada(operacion.isEjecutada())
                .prioridad(operacion.getPrioridad())
                .build();
    }
}
