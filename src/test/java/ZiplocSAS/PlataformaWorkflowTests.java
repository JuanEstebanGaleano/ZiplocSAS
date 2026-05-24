package ZiplocSAS;

import ZiplocSAS.application.service.BilleteraService;
import ZiplocSAS.application.service.OperacionProgramadaService;
import ZiplocSAS.application.service.ServicioAnalitica;
import ZiplocSAS.application.service.TransaccionService;
import ZiplocSAS.application.service.UsuarioService;
import ZiplocSAS.domain.enums.EstadoTransaccion;
import ZiplocSAS.domain.enums.NivelRiesgo;
import ZiplocSAS.domain.enums.TipoTransaccion;
import ZiplocSAS.domain.model.Billetera;
import ZiplocSAS.domain.model.OperacionProgramada;
import ZiplocSAS.domain.model.Transaccion;
import ZiplocSAS.domain.model.Usuario;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest(properties = "app.programadas.procesador.enabled=false")
class PlataformaWorkflowTests {

    @Autowired
    private UsuarioService usuarioService;

    @Autowired
    private BilleteraService billeteraService;

    @Autowired
    private TransaccionService transaccionService;

    @Autowired
    private OperacionProgramadaService operacionProgramadaService;

    @Autowired
    private ServicioAnalitica servicioAnalitica;

    @Test
    void transferenciaAcumulaPuntosYPuedeRevertirse() {
        Usuario origen = crearUsuario("Origen Flujo");
        Usuario destino = crearUsuario("Destino Flujo");
        Billetera walletOrigen = crearBilletera(origen, 10_000);
        Billetera walletDestino = crearBilletera(destino, 0);

        Transaccion transferencia = transaccionService.crear(Transaccion.builder()
                .tipo(TipoTransaccion.TRANSFERENCIA)
                .valor(3_000)
                .billeteraOrigenId(walletOrigen.getId())
                .billeteraDestinoId(walletDestino.getId())
                .build());

        assertEquals(EstadoTransaccion.COMPLETADA, transferencia.getEstado());
        assertEquals(7_000, billeteraService.obtenerSaldo(walletOrigen.getId()));
        assertEquals(3_000, billeteraService.obtenerSaldo(walletDestino.getId()));
        assertEquals(90, usuarioService.buscarPorId(origen.getId()).orElseThrow().getPuntosAcumulados());

        assertTrue(transaccionService.revertir(transferencia.getId()));
        assertEquals(EstadoTransaccion.REVERTIDA, transferencia.getEstado());
        assertEquals(10_000, billeteraService.obtenerSaldo(walletOrigen.getId()));
        assertEquals(0, billeteraService.obtenerSaldo(walletDestino.getId()));
        assertEquals(0, usuarioService.buscarPorId(origen.getId()).orElseThrow().getPuntosAcumulados());
    }

    @Test
    void operacionesProgramadasSeProcesanPorFecha() {
        Usuario origen = crearUsuario("Origen Programada");
        Usuario destino = crearUsuario("Destino Programada");
        Billetera walletOrigen = crearBilletera(origen, 20_000);
        Billetera walletDestino = crearBilletera(destino, 0);

        operacionProgramadaService.programar(OperacionProgramada.builder()
                .fechaEjecucion(LocalDateTime.now().minusMinutes(1))
                .tipo(TipoTransaccion.PAGO_PROGRAMADO)
                .valor(1_000)
                .billeteraOrigenId(walletOrigen.getId())
                .billeteraDestinoId(walletDestino.getId())
                .prioridad(1)
                .build());
        operacionProgramadaService.programar(OperacionProgramada.builder()
                .fechaEjecucion(LocalDateTime.now().plusDays(1))
                .tipo(TipoTransaccion.PAGO_PROGRAMADO)
                .valor(1_000)
                .billeteraOrigenId(walletOrigen.getId())
                .billeteraDestinoId(walletDestino.getId())
                .prioridad(1)
                .build());

        List<OperacionProgramada> procesadas = operacionProgramadaService.procesarPendientes(LocalDateTime.now());

        assertEquals(1, procesadas.size());
        assertTrue(procesadas.getFirst().isEjecutada());
        assertFalse(operacionProgramadaService.listarPendientes().isEmpty());
        assertEquals(19_000, billeteraService.obtenerSaldo(walletOrigen.getId()));
    }

    @Test
    void transaccionCriticaGeneraEventoDeAuditoria() {
        Usuario origen = crearUsuario("Origen Riesgo");
        Usuario destino = crearUsuario("Destino Riesgo");
        Billetera walletOrigen = crearBilletera(origen, 7_000_000);
        Billetera walletDestino = crearBilletera(destino, 0);

        Transaccion transferencia = transaccionService.crear(Transaccion.builder()
                .tipo(TipoTransaccion.TRANSFERENCIA)
                .valor(5_500_000)
                .billeteraOrigenId(walletOrigen.getId())
                .billeteraDestinoId(walletDestino.getId())
                .build());

        Map<String, Object> auditoria = servicioAnalitica.consultarAuditoria(origen.getId());

        assertEquals(NivelRiesgo.CRITICO, transferencia.getNivelRiesgo());
        assertTrue((Integer) auditoria.get("totalEventos") > 0);
    }

    private Usuario crearUsuario(String nombre) {
        return usuarioService.crear(Usuario.builder()
                .nombre(nombre)
                .email(nombre.toLowerCase().replace(" ", ".") + "-" + UUID.randomUUID() + "@example.com")
                .telefono("3000000000")
                .build(), "secreto123");
    }

    private Billetera crearBilletera(Usuario usuario, double saldo) {
        return billeteraService.crear(Billetera.builder()
                .nombre("Wallet " + usuario.getNombre())
                .saldo(saldo)
                .usuarioId(usuario.getId())
                .build());
    }
}
