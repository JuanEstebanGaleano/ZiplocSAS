package ZiplocSAS.application.service;

import ZiplocSAS.domain.model.Usuario;
import ZiplocSAS.infrastructure.repository.EventoAuditoriaRepository;
import ZiplocSAS.infrastructure.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UsuarioServiceTest {

    @Mock
    private NotificacionService notificacionService;

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private EventoAuditoriaRepository eventoAuditoriaRepository;

    private UsuarioService usuarioService;
    private PasswordService passwordService;

    @BeforeEach
    void setUp() {
        passwordService = new PasswordService();
        usuarioService = new UsuarioService(new PlataformaContext(), notificacionService, usuarioRepository,
                eventoAuditoriaRepository, passwordService);
    }

    @Test
    void crearRechazaEmailDuplicado() {
        Usuario existente = Usuario.builder()
                .id("usuario-existente")
                .nombre("Existente")
                .email("ana@example.com")
                .build();
        Usuario nuevo = Usuario.builder()
                .nombre("Ana")
                .email(" ANA@example.com ")
                .build();

        when(usuarioRepository.findByEmail("ana@example.com")).thenReturn(Optional.of(existente));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> usuarioService.crear(nuevo, "secreto123"));

        assertEquals("Ya existe un usuario registrado con el email: ana@example.com", ex.getMessage());
        verify(usuarioRepository, never()).save(any(Usuario.class));
    }

    @Test
    void crearNormalizaEmailAntesDeGuardar() {
        Usuario nuevo = Usuario.builder()
                .nombre("Ana")
                .email(" ANA@example.com ")
                .build();

        when(usuarioRepository.findByEmail("ana@example.com")).thenReturn(Optional.empty());
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(invocation -> invocation.getArgument(0));

        usuarioService.crear(nuevo, "secreto123");

        ArgumentCaptor<Usuario> captor = ArgumentCaptor.forClass(Usuario.class);
        verify(usuarioRepository).save(captor.capture());
        assertEquals("ana@example.com", captor.getValue().getEmail());
    }

    @Test
    void crearGuardaHashDeContrasena() {
        Usuario nuevo = Usuario.builder()
                .nombre("Ana")
                .email("ana@example.com")
                .build();

        when(usuarioRepository.findByEmail("ana@example.com")).thenReturn(Optional.empty());
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(invocation -> invocation.getArgument(0));

        usuarioService.crear(nuevo, "secreto123");

        ArgumentCaptor<Usuario> captor = ArgumentCaptor.forClass(Usuario.class);
        verify(usuarioRepository).save(captor.capture());
        Usuario guardado = captor.getValue();
        assertTrue(passwordService.verificar("secreto123", guardado.getPasswordHash()));
    }

    @Test
    void loginAceptaEmailYContrasenaCorrectos() {
        Usuario existente = Usuario.builder()
                .id("usuario-1")
                .nombre("Ana")
                .email("ana@example.com")
                .passwordHash(passwordService.generarHash("secreto123"))
                .build();

        when(usuarioRepository.findByEmail("ana@example.com")).thenReturn(Optional.of(existente));

        Usuario autenticado = usuarioService.login(" ANA@example.com ", "secreto123");

        assertEquals("usuario-1", autenticado.getId());
    }

    @Test
    void loginRechazaContrasenaIncorrecta() {
        Usuario existente = Usuario.builder()
                .id("usuario-1")
                .nombre("Ana")
                .email("ana@example.com")
                .passwordHash(passwordService.generarHash("secreto123"))
                .build();

        when(usuarioRepository.findByEmail("ana@example.com")).thenReturn(Optional.of(existente));

        assertThrows(CredencialesInvalidasException.class, () -> usuarioService.login("ana@example.com", "otra"));
    }

    @Test
    void actualizarPermiteCambiarContrasena() {
        Usuario existente = Usuario.builder()
                .id("usuario-1")
                .nombre("Ana")
                .email("ana@example.com")
                .passwordHash(passwordService.generarHash("secreto123"))
                .build();
        Usuario cambios = Usuario.builder()
                .id("usuario-1")
                .nombre("Ana Maria")
                .email("ana@example.com")
                .build();

        when(usuarioRepository.findById("usuario-1")).thenReturn(Optional.of(existente));
        when(usuarioRepository.findByEmail("ana@example.com")).thenReturn(Optional.of(existente));
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Usuario actualizado = usuarioService.actualizar(cambios, "nuevo123");

        assertTrue(passwordService.verificar("nuevo123", actualizado.getPasswordHash()));
    }

    @Test
    void actualizarRechazaEmailUsadoPorOtroUsuario() {
        Usuario actual = Usuario.builder()
                .id("usuario-1")
                .nombre("Ana")
                .email("ana@example.com")
                .build();
        Usuario otro = Usuario.builder()
                .id("usuario-2")
                .nombre("Bea")
                .email("bea@example.com")
                .build();

        when(usuarioRepository.findById("usuario-1")).thenReturn(Optional.of(actual));
        when(usuarioRepository.findByEmail("bea@example.com")).thenReturn(Optional.of(otro));

        actual.setEmail(" BEA@example.com ");

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> usuarioService.actualizar(actual));

        assertEquals("Ya existe un usuario registrado con el email: bea@example.com", ex.getMessage());
        verify(usuarioRepository, never()).save(any(Usuario.class));
    }
}
