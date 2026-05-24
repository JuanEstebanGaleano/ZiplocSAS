package ZiplocSAS.domain.structures;

import java.time.LocalDateTime;
/**
 * Utilidad interna para imprimir estados de estructuras de datos en consola.
 */

final class EstructuraConsolePrinter {
    private EstructuraConsolePrinter() {
    }

    static void imprimir(String estructura, String accion, String estado) {
        System.out.println();
        System.out.println("**************** ESTRUCTURA DE DATOS ****************");
        System.out.println("Fecha: " + LocalDateTime.now());
        System.out.println("Estructura: " + estructura);
        System.out.println("Accion: " + accion);
        System.out.println("Estado:");
        System.out.println(estado == null || estado.isBlank() ? "(vacia)" : estado);
        System.out.println("********************************");
        System.out.println();
    }
}
