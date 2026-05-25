package ZiplocSAS.application.service;

import ZiplocSAS.domain.enums.NivelUsuario;
import ZiplocSAS.domain.enums.NivelRiesgo;
import ZiplocSAS.domain.enums.TipoAlerta;
import ZiplocSAS.domain.enums.TipoEvento;
import ZiplocSAS.domain.model.Billetera;
import ZiplocSAS.domain.model.EventoAuditoria;
import ZiplocSAS.domain.model.Usuario;
import ZiplocSAS.infrastructure.repository.EventoAuditoriaRepository;
import ZiplocSAS.infrastructure.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.UUID;
/**
 * Servicio de aplicacion para usuarios, autenticacion y fidelizacion.
 */

@Service
@RequiredArgsConstructor
public class UsuarioService {
    private final PlataformaContext context;
    private final NotificacionService notificacionService;
    private final UsuarioRepository usuarioRepository;
    private final EventoAuditoriaRepository eventoAuditoriaRepository;
    private final PasswordService passwordService;

    public synchronized Usuario crear(Usuario usuario) {
        return crear(usuario, usuario == null ? null : usuario.getPasswordHash());
    }

    /**
     * Registra un usuario nuevo, normaliza su email y almacena la contrasena hasheada.
     *
     * @param usuario datos personales del usuario.
     * @param contrasena contrasena en texto plano recibida en el registro.
     * @return usuario persistido y sincronizado con las estructuras en memoria.
     */
    public synchronized Usuario crear(Usuario usuario, String contrasena) {
        validarUsuario(usuario);
        validarContrasena(contrasena);
        validarEmailDisponible(usuario.getEmail(), null);
        usuario.setId(UUID.randomUUID().toString());
        usuario.setPasswordHash(passwordService.generarHash(contrasena));
        usuario.setFechaRegistro(LocalDateTime.now());
        usuario.setPuntosAcumulados(Math.max(0, usuario.getPuntosAcumulados()));
        usuario.setNivel(calcularNivel(usuario.getPuntosAcumulados()));
        usuario.setWallets(new ArrayList<>());
        usuario.setActivo(true);  // ← AGREGAR ESTA LÍNEA

        Usuario guardado = usuarioRepository.save(usuario);
        sincronizarUsuario(guardado);
        return guardado;
    }

    /**
     * Autentica un usuario y registra el evento de auditoria correspondiente.
     *
     * @param email correo electronico del usuario.
     * @param contrasena contrasena en texto plano.
     * @return usuario autenticado.
     */
    public Usuario login(String email, String contrasena) {
        String emailNormalizado = normalizarEmail(email);
        if (estaVacio(emailNormalizado) || !emailNormalizado.contains("@")) {
            throw new CredencialesInvalidasException("Email o contrasena incorrectos");
        }
        if (estaVacio(contrasena)) {
            throw new CredencialesInvalidasException("Email o contrasena incorrectos");
        }

        Usuario usuario = usuarioRepository.findByEmail(emailNormalizado)
                .orElseThrow(() -> new CredencialesInvalidasException("Email o contrasena incorrectos"));

        if (!passwordService.verificar(contrasena, usuario.getPasswordHash())) {
            registrarEventoAcceso(usuario.getId(), TipoEvento.ACCESO_DENEGADO, NivelRiesgo.MEDIO, "Intento de login rechazado");
            throw new CredencialesInvalidasException("Email o contrasena incorrectos");
        }

        sincronizarUsuario(usuario);
        registrarEventoAcceso(usuario.getId(), TipoEvento.LOGIN, NivelRiesgo.BAJO, "Login exitoso");
        return usuario;
    }

    public Optional<Usuario> buscarPorId(String usuarioId) {
        Optional<Usuario> usuario = usuarioRepository.findById(usuarioId);
        usuario.ifPresent(this::sincronizarUsuario);
        return usuario.or(() -> Optional.ofNullable(context.getTablaUsuarios().buscar(usuarioId)));
    }

    public List<Usuario> listarTodos() {
        List<Usuario> usuarios = new ArrayList<>(usuarioRepository.findAll());
        if (usuarios.isEmpty()) {
            usuarios = context.getTablaUsuarios().obtenerTodos();
        } else {
            usuarios.forEach(this::sincronizarUsuario);
        }
        usuarios.sort(Comparator.comparing(Usuario::getFechaRegistro, Comparator.nullsLast(Comparator.naturalOrder())));
        return usuarios;
    }

    public synchronized Usuario actualizar(Usuario usuario) {
        return actualizar(usuario, null);
    }

    public synchronized Usuario actualizar(Usuario usuario, String nuevaContrasena) {
        Usuario existente = obtenerObligatorio(usuario.getId());
        if (usuario.getWallets() == null) {
            usuario.setWallets(existente.getWallets());
        }
        if (usuario.getFechaRegistro() == null) {
            usuario.setFechaRegistro(existente.getFechaRegistro());
        }
        //usuario.setActivo(existente.isActivo());
        usuario.setPuntosAcumulados(Math.max(0, usuario.getPuntosAcumulados()));
        usuario.setNivel(calcularNivel(usuario.getPuntosAcumulados()));
        if (estaVacio(nuevaContrasena)) {
            usuario.setPasswordHash(existente.getPasswordHash());
        } else {
            validarContrasena(nuevaContrasena);
            usuario.setPasswordHash(passwordService.generarHash(nuevaContrasena));
        }

        validarUsuario(usuario);
        validarEmailDisponible(usuario.getEmail(), usuario.getId());
        Usuario guardado = usuarioRepository.save(usuario);
        sincronizarUsuario(guardado);
        return guardado;
    }

    public synchronized void eliminar(String usuarioId) {
        Usuario usuario = obtenerObligatorio(usuarioId);
        if (usuario.getWallets() != null && !usuario.getWallets().isEmpty()) {
            throw new IllegalArgumentException("No se puede eliminar un usuario con billeteras asociadas");
        }
        context.getTablaUsuarios().eliminar(usuarioId);
        context.getArbolFidelizacion().eliminar(usuarioId);
        usuarioRepository.deleteById(usuarioId);
    }

    /**
     * Incrementa los puntos del usuario y recalcula su nivel de fidelizacion.
     *
     * @param usuarioId identificador del usuario.
     * @param puntos cantidad de puntos a sumar.
     * @return usuario actualizado.
     */
    public synchronized Usuario incrementarPuntos(String usuarioId, int puntos) {
        Usuario usuario = obtenerObligatorio(usuarioId);
        NivelUsuario nivelAnterior = usuario.getNivel();
        usuario.setPuntosAcumulados(usuario.getPuntosAcumulados() + Math.max(0, puntos));
        usuario.setNivel(calcularNivel(usuario.getPuntosAcumulados()));
        Usuario guardado = usuarioRepository.save(usuario);
        sincronizarUsuario(guardado);

        if (nivelAnterior != guardado.getNivel()) {
            notificacionService.crear(
                    usuarioId,
                    TipoAlerta.BENEFICIO_DISPONIBLE,
                    "Ascenso de nivel a " + guardado.getNivel().name()
            );
        }
        return guardado;
    }

    public synchronized Usuario descontarPuntos(String usuarioId, int puntos) {
        Usuario usuario = obtenerObligatorio(usuarioId);
        usuario.setPuntosAcumulados(Math.max(0, usuario.getPuntosAcumulados() - Math.max(0, puntos)));
        usuario.setNivel(calcularNivel(usuario.getPuntosAcumulados()));
        Usuario guardado = usuarioRepository.save(usuario);
        sincronizarUsuario(guardado);
        return guardado;
    }

    public List<Usuario> buscarPorRangoPuntos(int minPuntos, int maxPuntos) {
        return listarTodos().stream()
                .filter(usuario -> usuario.getPuntosAcumulados() >= minPuntos)
                .filter(usuario -> usuario.getPuntosAcumulados() <= maxPuntos)
                .sorted(Comparator.comparingInt(Usuario::getPuntosAcumulados))
                .toList();
    }

    public List<Usuario> topPorPuntos(int limite) {
        return listarTodos().stream()
                .sorted(Comparator.comparingInt(Usuario::getPuntosAcumulados).reversed())
                .limit(Math.max(0, limite))
                .toList();
    }

    Usuario obtenerObligatorio(String usuarioId) {
        return buscarPorId(usuarioId)
                .orElseThrow(() -> new NoSuchElementException("Usuario no encontrado: " + usuarioId));
    }

    NivelUsuario calcularNivel(int puntos) {
        if (puntos > 5000) {
            return NivelUsuario.PLATINO;
        }
        if (puntos > 1000) {
            return NivelUsuario.ORO;
        }
        if (puntos > 500) {
            return NivelUsuario.PLATA;
        }
        return NivelUsuario.BRONCE;
    }

    private void validarUsuario(Usuario usuario) {
        if (usuario == null) {
            throw new IllegalArgumentException("El usuario es obligatorio");
        }
        if (estaVacio(usuario.getNombre())) {
            throw new IllegalArgumentException("El nombre del usuario es obligatorio");
        }
        if (estaVacio(usuario.getEmail()) || !usuario.getEmail().contains("@")) {
            throw new IllegalArgumentException("El email del usuario no es valido");
        }
        usuario.setEmail(normalizarEmail(usuario.getEmail()));
        if (usuario.getWallets() == null) {
            usuario.setWallets(new ArrayList<Billetera>());
        }
    }

    private void validarContrasena(String contrasena) {
        if (estaVacio(contrasena)) {
            throw new IllegalArgumentException("La contrasena del usuario es obligatoria");
        }
        if (contrasena.trim().length() < 6) {
            throw new IllegalArgumentException("La contrasena debe tener al menos 6 caracteres");
        }
    }

    private void validarEmailDisponible(String email, String usuarioIdActual) {
        usuarioRepository.findByEmail(email)
                .filter(usuario -> usuarioIdActual == null || !usuario.getId().equals(usuarioIdActual))
                .ifPresent(usuario -> {
                    throw new IllegalArgumentException("Ya existe un usuario registrado con el email: " + email);
                });
    }

    private boolean estaVacio(String valor) {
        return valor == null || valor.trim().isEmpty();
    }

    private String normalizarEmail(String email) {
        return email == null ? null : email.trim().toLowerCase(Locale.ROOT);
    }

    private void sincronizarUsuario(Usuario usuario) {
        context.getTablaUsuarios().insertar(usuario);
        context.getArbolFidelizacion().insertar(usuario);
    }

    private void registrarEventoAcceso(String usuarioId, TipoEvento tipoEvento, NivelRiesgo nivelRiesgo, String descripcion) {
        EventoAuditoria evento = EventoAuditoria.builder()
                .id(UUID.randomUUID().toString())
                .usuarioId(usuarioId)
                .tipoEvento(tipoEvento)
                .nivelRiesgo(nivelRiesgo)
                .descripcion(descripcion)
                .fecha(LocalDateTime.now())
                .revisado(false)
                .build();
        context.getEventosAuditoria().add(evento);
        eventoAuditoriaRepository.save(evento);
    }
}
