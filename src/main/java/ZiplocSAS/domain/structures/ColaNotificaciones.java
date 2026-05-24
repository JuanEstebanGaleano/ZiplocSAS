package ZiplocSAS.domain.structures;

import ZiplocSAS.domain.model.Alerta;
import java.util.*;
/**
 * Cola circular de alertas recientes por usuario.
 *
 * <p>Cuando alcanza su capacidad maxima descarta el elemento mas antiguo para
 * mantener una ventana acotada de notificaciones.</p>
 */

public class ColaNotificaciones {
    private Alerta[] cola;
    private int front;
    private int rear;
    private int size;
    private final int maxCapacity;

    /**
     * Crea una cola circular con capacidad fija.
     *
     * @param maxCapacity cantidad maxima de alertas retenidas.
     */
    public ColaNotificaciones(int maxCapacity) {
        this.maxCapacity = maxCapacity;
        this.cola = new Alerta[maxCapacity];
        this.front = 0;
        this.rear = -1;
        this.size = 0;
    }


    /**
     * Encola una alerta y desplaza la mas antigua si la cola esta llena.
     *
     * @param alerta alerta a registrar.
     */
    public void encolar(Alerta alerta) {
        if (size == maxCapacity) {
            front = (front + 1) % maxCapacity;
            size--;
        }

        rear = (rear + 1) % maxCapacity;
        cola[rear] = alerta;
        size++;
        imprimir("encolar alerta " + alerta.getId());
    }

    /**
     * Retira la alerta mas antigua disponible.
     *
     * @return alerta despachada o {@code null} si la cola esta vacia.
     */
    public Alerta despachar() {
        if (size == 0) {
            imprimir("despachar alerta -> cola vacia");
            return null;
        }

        Alerta alerta = cola[front];
        cola[front] = null;
        front = (front + 1) % maxCapacity;
        size--;
        imprimir("despachar alerta " + alerta.getId());
        return alerta;
    }


    /**
     * Devuelve una copia ordenada de las alertas aun presentes en la cola.
     *
     * @return historial reciente de alertas.
     */
    public List<Alerta> historialReciente() {
        List<Alerta> historial = new ArrayList<>();
        for (int i = 0; i < size; i++) {
            int index = (front + i) % maxCapacity;
            historial.add(cola[index]);
        }
        imprimir("consultar historial reciente");
        return historial;
    }

    public boolean estaVacia() {
        return size == 0;
    }

    public boolean estaLlena() {
        return size == maxCapacity;
    }

    public int size() {
        return size;
    }

    public int capacidadMaxima() {
        return maxCapacity;
    }

    private void imprimir(String accion) {
        StringBuilder estado = new StringBuilder();
        estado.append("Tipo: Cola circular").append(System.lineSeparator());
        estado.append("Tamano: ").append(size).append(System.lineSeparator());
        estado.append("Capacidad maxima: ").append(maxCapacity).append(System.lineSeparator());
        estado.append("Front: ").append(front).append(", Rear: ").append(rear).append(System.lineSeparator());
        for (int i = 0; i < size; i++) {
            int index = (front + i) % maxCapacity;
            Alerta alerta = cola[index];
            estado.append(i).append(". ")
                    .append(alerta == null ? "null" : alerta.toString())
                    .append(System.lineSeparator());
        }
        EstructuraConsolePrinter.imprimir("ColaNotificaciones", accion, estado.toString());
    }
}

