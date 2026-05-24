package ZiplocSAS.domain.structures;

import ZiplocSAS.domain.model.OperacionProgramada;
import java.util.*;
/**
 * Cola de prioridad basada en heap binario para operaciones programadas.
 *
 * <p>Ordena primero por fecha de ejecucion y luego por prioridad numerica.</p>
 */

public class ColaProgramadas {
    private List<OperacionProgramada> heap;

    /**
     * Crea una cola de prioridad vacia.
     */
    public ColaProgramadas() {
        this.heap = new ArrayList<>();
    }


    /**
     * Inserta una operacion respetando el orden del heap.
     *
     * @param operacion operacion a encolar.
     */
    public void encolar(OperacionProgramada operacion) {
        heap.add(operacion);
        bubbleUp(heap.size() - 1);
        imprimir("encolar operacion programada " + operacion.getId());
    }


    /**
     * Extrae la operacion de mayor prioridad temporal.
     *
     * @return siguiente operacion o {@code null} si no hay pendientes.
     */
    public OperacionProgramada procesarSiguiente() {
        if (heap.isEmpty()) {
            imprimir("procesar siguiente -> cola vacia");
            return null;
        }
        OperacionProgramada root = heap.get(0);
        heap.set(0, heap.get(heap.size() - 1));
        heap.remove(heap.size() - 1);
        if (!heap.isEmpty()) {
            bubbleDown(0);
        }
        imprimir("procesar siguiente operacion " + root.getId());
        return root;
    }


    /**
     * Consulta la siguiente operacion sin retirarla de la cola.
     *
     * @return operacion en la raiz del heap o {@code null}.
     */
    public OperacionProgramada peek() {
        OperacionProgramada operacion = heap.isEmpty() ? null : heap.get(0);
        imprimir("consultar siguiente -> " + (operacion == null ? "null" : operacion.getId()));
        return operacion;
    }

    public boolean estaVacia() {
        return heap.isEmpty();
    }

    public int size() {
        return heap.size();
    }

    public List<OperacionProgramada> obtenerTodas() {
        List<OperacionProgramada> copia = new ArrayList<>(heap);
        copia.sort(this::comparar);
        imprimir("obtener todas las operaciones programadas");
        return copia;
    }

    private void bubbleUp(int index) {
        while (index > 0) {
            int parentIndex = (index - 1) / 2;
            if (comparar(heap.get(index), heap.get(parentIndex)) < 0) {
                Collections.swap(heap, index, parentIndex);
                index = parentIndex;
            } else {
                break;
            }
        }
    }

    private void bubbleDown(int index) {
        while (true) {
            int leftChild = 2 * index + 1;
            int rightChild = 2 * index + 2;
            int smallest = index;

            if (leftChild < heap.size() && comparar(heap.get(leftChild), heap.get(smallest)) < 0) {
                smallest = leftChild;
            }
            if (rightChild < heap.size() && comparar(heap.get(rightChild), heap.get(smallest)) < 0) {
                smallest = rightChild;
            }

            if (smallest != index) {
                Collections.swap(heap, index, smallest);
                index = smallest;
            } else {
                break;
            }
        }
    }


    private int comparar(OperacionProgramada a, OperacionProgramada b) {
        int dateComparison = a.getFechaEjecucion().compareTo(b.getFechaEjecucion());
        if (dateComparison != 0) {
            return dateComparison;
        }
        return Integer.compare(a.getPrioridad(), b.getPrioridad());
    }

    private void imprimir(String accion) {
        StringBuilder estado = new StringBuilder();
        estado.append("Tipo: Cola de prioridad implementada con heap minimo").append(System.lineSeparator());
        estado.append("Tamano: ").append(heap.size()).append(System.lineSeparator());
        for (int i = 0; i < heap.size(); i++) {
            estado.append("heap[").append(i).append("] -> ")
                    .append(heap.get(i))
                    .append(System.lineSeparator());
        }
        EstructuraConsolePrinter.imprimir("ColaProgramadas", accion, estado.toString());
    }
}

