package ZiplocSAS.domain.structures;

import ZiplocSAS.domain.model.Transaccion;
import java.util.*;
/**
 * Gestor en memoria de transacciones con lista enlazada y pila de reversion.
 */

public class GestorTransacciones {
    private Node head;
    private int size;
    private Stack<Transaccion> pilaReversion;

    private static class Node {
        Transaccion data;
        Node next;

        Node(Transaccion data) {
            this.data = data;
            this.next = null;
        }
    }

    /**
     * Crea un historial vacio.
     */
    public GestorTransacciones() {
        this.head = null;
        this.size = 0;
        this.pilaReversion = new Stack<>();
    }

    /**
     * Agrega una transacciÃ³n al inicio de la lista (O(1))
     */
    public void agregar(Transaccion transaccion) {
        Node newNode = new Node(transaccion);
        newNode.next = head;
        head = newNode;
        size++;
        pilaReversion.push(transaccion);
        imprimir("agregar transaccion " + transaccion.getId());
    }

    /**
     * Revierte la Ãºltima transacciÃ³n desde la pila (O(1))
     */
    public Transaccion revertir() {
        if (pilaReversion.isEmpty()) {
            imprimir("revertir ultima -> pila vacia");
            return null;
        }
        Transaccion transaccion = pilaReversion.pop();
        imprimir("revertir ultima transaccion " + transaccion.getId());
        return transaccion;
    }

    /**
     * Devuelve el historial completo en memoria.
     *
     * @return transacciones registradas.
     */
    public List<Transaccion> obtenerHistorial() {
        List<Transaccion> lista = new ArrayList<>();
        Node current = head;
        while (current != null) {
            lista.add(current.data);
            current = current.next;
        }
        imprimir("obtener historial");
        return lista;
    }

    /**
     * Busca una transaccion por identificador.
     *
     * @param transaccionId identificador de la transaccion.
     * @return transaccion encontrada o {@code null}.
     */
    public Transaccion buscar(String transaccionId) {
        Node current = head;
        while (current != null) {
            if (current.data.getId().equals(transaccionId)) {
                imprimir("buscar transaccion " + transaccionId + " -> encontrada");
                return current.data;
            }
            current = current.next;
        }
        imprimir("buscar transaccion " + transaccionId + " -> no encontrada");
        return null;
    }

    public List<Transaccion> obtenerPorBilletera(String billeteraId) {
        List<Transaccion> lista = new ArrayList<>();
        Node current = head;
        while (current != null) {
            boolean origen = billeteraId.equals(current.data.getBilleteraOrigenId());
            boolean destino = billeteraId.equals(current.data.getBilleteraDestinoId());
            if (origen || destino) {
                lista.add(current.data);
            }
            current = current.next;
        }
        imprimir("obtener transacciones por billetera " + billeteraId);
        return lista;
    }

    public List<Transaccion> obtenerMayoresValores(int limite) {
        List<Transaccion> lista = obtenerHistorial();
        lista.sort(Comparator.comparingDouble(Transaccion::getValor).reversed());
        imprimir("obtener mayores valores limite " + limite);
        return lista.subList(0, Math.min(limite, lista.size()));
    }

    /**
     * Filtra transacciones por perÃ­odo de fechas
     */
    public List<Transaccion> filtrarPorPeriodo(java.time.LocalDateTime inicio, java.time.LocalDateTime fin) {
        List<Transaccion> filtradas = new ArrayList<>();
        Node current = head;
        while (current != null) {
            if (!current.data.getFecha().isBefore(inicio) && !current.data.getFecha().isAfter(fin)) {
                filtradas.add(current.data);
            }
            current = current.next;
        }
        imprimir("filtrar por periodo " + inicio + " - " + fin);
        return filtradas;
    }

    public int size() {
        return size;
    }

    public boolean isEmpty() {
        return size == 0;
    }

    private void imprimir(String accion) {
        StringBuilder estado = new StringBuilder();
        estado.append("Tipo: Lista enlazada simple + pila para reversion").append(System.lineSeparator());
        estado.append("Tamano lista: ").append(size).append(System.lineSeparator());
        estado.append("Tamano pila reversion: ").append(pilaReversion.size()).append(System.lineSeparator());
        Node current = head;
        int index = 0;
        while (current != null) {
            estado.append("lista[").append(index).append("] -> ")
                    .append(current.data)
                    .append(System.lineSeparator());
            current = current.next;
            index++;
        }
        estado.append("Pila reversion (tope al final):").append(System.lineSeparator());
        for (int i = 0; i < pilaReversion.size(); i++) {
            estado.append("pila[").append(i).append("] -> ")
                    .append(pilaReversion.get(i))
                    .append(System.lineSeparator());
        }
        EstructuraConsolePrinter.imprimir("GestorTransacciones", accion, estado.toString());
    }
}

