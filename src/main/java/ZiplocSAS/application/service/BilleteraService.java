package ZiplocSAS.application.service;

import ZiplocSAS.domain.enums.EstadoBilletera;
import ZiplocSAS.domain.enums.TipoAlerta;
import ZiplocSAS.domain.enums.TipoBilletera;
import ZiplocSAS.domain.model.Billetera;
import ZiplocSAS.domain.model.Transaccion;
import ZiplocSAS.domain.model.Usuario;
import ZiplocSAS.infrastructure.repository.BilleteraRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.UUID;
/**
 * Servicio de aplicacion para crear, actualizar y consultar billeteras.
 */

@Service
@RequiredArgsConstructor
public class BilleteraService {
    private static final double UMBRAL_SALDO_BAJO = 20_000.0;

    private final PlataformaContext context;
    private final UsuarioService usuarioService;
    private final NotificacionService notificacionService;
    private final BilleteraRepository billeteraRepository;

    /**
     * Crea una billetera para un usuario existente y la enlaza a su perfil.
     *
     * @param billetera datos de la billetera solicitada.
     * @return billetera persistida.
     */
    public synchronized Billetera crear(Billetera billetera) {
        if (billetera == null) {
            throw new IllegalArgumentException("La billetera es obligatoria");
        }
        Usuario usuario = usuarioService.obtenerObligatorio(billetera.getUsuarioId());
        if (billetera.getSaldo() < 0) {
            throw new IllegalArgumentException("El saldo inicial no puede ser negativo");
        }

        billetera.setId(UUID.randomUUID().toString());
        billetera.setTipo(billetera.getTipo() == null ? TipoBilletera.AHORRO : billetera.getTipo());
        billetera.setEstado(billetera.getEstado() == null ? EstadoBilletera.ACTIVA : billetera.getEstado());
        billetera.setHistorialTransacciones(new ArrayList<>());
        Billetera guardada = billeteraRepository.save(billetera);
        sincronizarBilletera(guardada);

        usuario.getWallets().add(guardada);
        usuarioService.actualizar(usuario);
        return guardada;
    }

    public Optional<Billetera> buscarPorId(String billeteraId) {
        Optional<Billetera> billetera = billeteraRepository.findById(billeteraId);
        billetera.ifPresent(this::sincronizarBilletera);
        return billetera.or(() -> Optional.ofNullable(context.getTablaBilleteras().buscarPorCodigo(billeteraId)));
    }

    /**
     * Lista todas las billeteras asociadas a un usuario.
     *
     * @param usuarioId identificador del propietario.
     * @return billeteras del usuario.
     */
    public List<Billetera> listarPorUsuario(String usuarioId) {
        usuarioService.obtenerObligatorio(usuarioId);
        List<Billetera> billeteras = new ArrayList<>(billeteraRepository.findByUsuarioId(usuarioId));
        if (billeteras.isEmpty()) {
            return context.getTablaBilleteras().listarPorUsuario(usuarioId);
        }
        billeteras.forEach(this::sincronizarBilletera);
        return billeteras;
    }

    public List<Billetera> listarTodas() {
        List<Billetera> billeteras = new ArrayList<>(billeteraRepository.findAll());
        if (billeteras.isEmpty()) {
            return context.getTablaBilleteras().obtenerTodas();
        }
        billeteras.forEach(this::sincronizarBilletera);
        return billeteras;
    }

    public synchronized Billetera actualizar(Billetera billetera) {
        Billetera existente = obtenerObligatoria(billetera.getId());
        billetera.setUsuarioId(existente.getUsuarioId());
        billetera.setSaldo(existente.getSaldo());
        billetera.setTipo(billetera.getTipo() == null ? existente.getTipo() : billetera.getTipo());
        billetera.setEstado(billetera.getEstado() == null ? existente.getEstado() : billetera.getEstado());
        billetera.setHistorialTransacciones(existente.getHistorialTransacciones());
        Billetera guardada = billeteraRepository.save(billetera);
        sincronizarBilletera(guardada);
        reemplazarEnUsuario(guardada);
        return guardada;
    }

    public synchronized void eliminar(String billeteraId) {
        Billetera billetera = obtenerObligatoria(billeteraId);
        Usuario usuario = usuarioService.obtenerObligatorio(billetera.getUsuarioId());
        if (billetera.getSaldo() != 0) {
            throw new IllegalArgumentException("Solo se pueden eliminar billeteras con saldo cero");
        }
        context.getTablaBilleteras().eliminar(billeteraId);
        billeteraRepository.deleteById(billeteraId);
        usuario.getWallets().removeIf(w -> w.getId().equals(billeteraId));
        usuarioService.actualizar(usuario);
    }

    /**
     * Obtiene el saldo actual de una billetera.
     *
     * @param billeteraId identificador de la billetera.
     * @return saldo disponible.
     */
    public double obtenerSaldo(String billeteraId) {
        return obtenerObligatoria(billeteraId).getSaldo();
    }

    synchronized Billetera ajustarSaldo(String billeteraId, double delta) {
        Billetera billetera = obtenerObligatoria(billeteraId);
        double nuevoSaldo = billetera.getSaldo() + delta;
        if (nuevoSaldo < 0) {
            throw new IllegalArgumentException("Saldo insuficiente en la billetera " + billeteraId);
        }
        billetera.setSaldo(nuevoSaldo);
        Billetera guardada = billeteraRepository.save(billetera);
        sincronizarBilletera(guardada);
        reemplazarEnUsuario(guardada);

        if (nuevoSaldo > 0 && nuevoSaldo < UMBRAL_SALDO_BAJO) {
            notificacionService.crear(
                    guardada.getUsuarioId(),
                    TipoAlerta.SALDO_BAJO,
                    "Saldo bajo en billetera " + guardada.getNombre()
            );
        }
        return guardada;
    }

    void agregarHistorial(String billeteraId, Transaccion transaccion) {
        Billetera billetera = obtenerObligatoria(billeteraId);
        if (billetera.getHistorialTransacciones() == null) {
            billetera.setHistorialTransacciones(new ArrayList<>());
        }
        billetera.getHistorialTransacciones().add(transaccion);
        Billetera guardada = billeteraRepository.save(billetera);
        sincronizarBilletera(guardada);
        reemplazarEnUsuario(guardada);
    }

    void validarOperable(String billeteraId) {
        Billetera billetera = obtenerObligatoria(billeteraId);
        if (billetera.getEstado() != EstadoBilletera.ACTIVA) {
            throw new IllegalArgumentException("La billetera " + billeteraId + " no esta activa");
        }
    }

    Billetera obtenerObligatoria(String billeteraId) {
        return buscarPorId(billeteraId)
                .orElseThrow(() -> new NoSuchElementException("Billetera no encontrada: " + billeteraId));
    }

    private void reemplazarEnUsuario(Billetera billetera) {
        Usuario usuario = usuarioService.obtenerObligatorio(billetera.getUsuarioId());
        usuario.getWallets().removeIf(w -> w.getId().equals(billetera.getId()));
        usuario.getWallets().add(billetera);
        usuarioService.actualizar(usuario);
    }

    private void sincronizarBilletera(Billetera billetera) {
        context.getTablaBilleteras().insertar(billetera);
    }
}
