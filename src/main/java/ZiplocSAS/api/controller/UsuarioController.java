package ZiplocSAS.api.controller;

import ZiplocSAS.api.dto.ApiResponse;
import ZiplocSAS.api.dto.LoginDTO;
import ZiplocSAS.api.dto.UsuarioDTO;
import ZiplocSAS.application.service.UsuarioService;
import ZiplocSAS.domain.model.Usuario;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;
/**
 * Controlador REST para registro, autenticacion y consulta de usuarios.
 */

@RestController
@RequestMapping("/usuarios")
@RequiredArgsConstructor
public class UsuarioController {
    private final UsuarioService usuarioService;

    @PostMapping
    /**
     * Crea un usuario nuevo con credenciales seguras.
     *
     * @param dto datos de registro recibidos desde el cliente.
     * @return usuario creado sin exponer el hash de contrasena.
     */
    public ResponseEntity<ApiResponse<UsuarioDTO>> crear(@RequestBody UsuarioDTO dto) {
        Usuario usuario = Usuario.builder()
                .nombre(dto.getNombre())
                .email(dto.getEmail())
                .telefono(dto.getTelefono())
                .build();

        Usuario creado = usuarioService.crear(usuario, dto.getContrasena());
        return ResponseEntity.ok(ApiResponse.<UsuarioDTO>builder()
                .success(true)
                .message("Usuario creado exitosamente")
                .data(mapToDTO(creado))
                .build());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UsuarioDTO>> obtenerPorId(@PathVariable String id) {
        return usuarioService.buscarPorId(id)
                .map(usuario -> ResponseEntity.ok(ApiResponse.<UsuarioDTO>builder()
                        .success(true)
                        .data(mapToDTO(usuario))
                        .build()))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/login")
    /**
     * Autentica un usuario por email y contrasena.
     *
     * @param dto credenciales de acceso.
     * @return usuario autenticado si las credenciales son validas.
     */
    public ResponseEntity<ApiResponse<UsuarioDTO>> login(@RequestBody LoginDTO dto) {
        Usuario usuario = usuarioService.login(dto.getEmail(), dto.getContrasena());
        return ResponseEntity.ok(ApiResponse.<UsuarioDTO>builder()
                .success(true)
                .message("Login exitoso")
                .data(mapToDTO(usuario))
                .build());
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<UsuarioDTO>>> listarTodos() {
        List<UsuarioDTO> usuarios = usuarioService.listarTodos()
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.<List<UsuarioDTO>>builder()
                .success(true)
                .data(usuarios)
                .build());
    }

    @GetMapping("/puntos/rango")
    public ResponseEntity<ApiResponse<List<UsuarioDTO>>> listarPorRangoPuntos(
            @RequestParam int min,
            @RequestParam int max) {
        List<UsuarioDTO> usuarios = usuarioService.buscarPorRangoPuntos(min, max)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.<List<UsuarioDTO>>builder()
                .success(true)
                .data(usuarios)
                .build());
    }

    @GetMapping("/top-puntos")
    public ResponseEntity<ApiResponse<List<UsuarioDTO>>> topPorPuntos(
            @RequestParam(defaultValue = "10") int limite) {
        List<UsuarioDTO> usuarios = usuarioService.topPorPuntos(limite)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.<List<UsuarioDTO>>builder()
                .success(true)
                .data(usuarios)
                .build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<UsuarioDTO>> actualizar(@PathVariable String id, @RequestBody UsuarioDTO dto) {
        return usuarioService.buscarPorId(id)
                .map(usuario -> {
                    usuario.setNombre(dto.getNombre());
                    usuario.setEmail(dto.getEmail());
                    usuario.setTelefono(dto.getTelefono());
                    Usuario actualizado = usuarioService.actualizar(usuario, dto.getContrasena());
                    return ResponseEntity.ok(ApiResponse.<UsuarioDTO>builder()
                            .success(true)
                            .message("Usuario actualizado")
                            .data(mapToDTO(actualizado))
                            .build());
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> eliminar(@PathVariable String id) {
        usuarioService.eliminar(id);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Usuario eliminado")
                .build());
    }

    private UsuarioDTO mapToDTO(Usuario usuario) {
        return UsuarioDTO.builder()
                .id(usuario.getId())
                .nombre(usuario.getNombre())
                .email(usuario.getEmail())
                .telefono(usuario.getTelefono())
                .nivel(usuario.getNivel())
                .puntosAcumulados(usuario.getPuntosAcumulados())
                .fechaRegistro(usuario.getFechaRegistro())
                .build();
    }
}
