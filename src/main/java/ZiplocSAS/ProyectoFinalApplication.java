package ZiplocSAS;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;
/**
 * Clase principal de la plataforma ziplocSAS.
 *
 * <p>Inicializa Spring Boot y habilita la ejecucion de tareas programadas para
 * procesar pagos diferidos y otros trabajos de infraestructura.</p>
 */

@SpringBootApplication
@EnableScheduling
public class ProyectoFinalApplication {

    /**
     * Arranca la aplicacion Spring Boot.
     *
     * @param args argumentos de linea de comandos recibidos por la JVM.
     */
    public static void main(String[] args) {
        SpringApplication.run(ProyectoFinalApplication.class, args);
    }

}
