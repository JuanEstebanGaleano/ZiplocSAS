package ZiplocSAS.domain.structures;

import ZiplocSAS.domain.model.Billetera;
import java.util.*;
/**
 * Custom hash table for fast wallet lookup by code/id.
 * 
 * ACADEMIC PURPOSE:
 * Similar to TablaUsuarios but optimized for wallet lookups.
 * Demonstrates hash table with linear probing (open addressing).
 * 
 * Data Structure: Hash Table with Linear Probing
 * - Collision handling: Open addressing (linear probing)
 * - Average operations: O(1)
 * - Worst case: O(n) with poor load factor
 * 
 * Why this structure:
 * 1. Cache-friendly compared to chaining (better locality)
 * 2. Demonstrates open addressing collision resolution
 * 3. Faster queries for frequently accessed wallets
 * 4. Shows different hash table implementation than TablaUsuarios
 */

public class TablaBilleteras {
    private Entry[] table;
    private int size;
    private static final int INITIAL_CAPACITY = 32;
    private static final float LOAD_FACTOR = 0.75f;
    private static final int DELETED = -1;

    private static class Entry {
        String key;
        Billetera value;
        int state; // 0 = empty, 1 = occupied, -1 = deleted

        Entry(String key, Billetera value) {
            this.key = key;
            this.value = value;
            this.state = 1;
        }
    }

    public TablaBilleteras() {
        this.table = new Entry[INITIAL_CAPACITY];
        this.size = 0;

        for (int i = 0; i < table.length; i++) {
            table[i] = new Entry(null, null);
            table[i].state = 0;
        }
    }

    /**
     * Inserta o actualiza una billetera
     */
    public void insertar(Billetera billetera) {
        if (size >= table.length * LOAD_FACTOR) {
            rehash();
        }

        int index = findIndex(billetera.getId(), true);
        boolean nueva = table[index].state != 1;
        if (table[index].state != 1) {
            size++;
        }
        table[index].key = billetera.getId();
        table[index].value = billetera;
        table[index].state = 1;
        imprimir((nueva ? "insertar" : "actualizar") + " billetera " + billetera.getId());
    }

    /**
     * Busca una billetera por cÃ³digo/ID
     */
    public Billetera buscarPorCodigo(String codigo) {
        int index = findIndex(codigo, false);
        if (index != -1 && table[index].state == 1) {
            imprimir("buscar billetera " + codigo + " -> encontrada");
            return table[index].value;
        }
        imprimir("buscar billetera " + codigo + " -> no encontrada");
        return null;
    }

    /**
     * Obtiene el saldo de una billetera
     */
    public double obtenerSaldo(String codigo) {
        Billetera billetera = buscarPorCodigo(codigo);
        imprimir("obtener saldo billetera " + codigo);
        return billetera != null ? billetera.getSaldo() : 0.0;
    }

    public List<Billetera> listarPorUsuario(String usuarioId) {
        List<Billetera> billeteras = new ArrayList<>();
        for (Entry entry : table) {
            if (entry.state == 1 && entry.value != null && Objects.equals(entry.value.getUsuarioId(), usuarioId)) {
                billeteras.add(entry.value);
            }
        }
        imprimir("listar billeteras por usuario " + usuarioId);
        return billeteras;
    }

    public List<Billetera> obtenerTodas() {
        List<Billetera> billeteras = new ArrayList<>();
        for (Entry entry : table) {
            if (entry.state == 1 && entry.value != null) {
                billeteras.add(entry.value);
            }
        }
        imprimir("obtener todas las billeteras");
        return billeteras;
    }

    /**
     * Elimina una billetera
     */
    public void eliminar(String codigo) {
        int index = findIndex(codigo, false);
        if (index != -1 && table[index].state == 1) {
            table[index].state = DELETED;
            size--;
            imprimir("eliminar billetera " + codigo);
            return;
        }
        imprimir("eliminar billetera " + codigo + " -> no encontrada");
    }

    public int size() {
        return size;
    }

    private int hash(String key) {
        return (key.hashCode() & 0x7FFFFFFF) % table.length;
    }

    private int findIndex(String key, boolean insert) {
        int index = hash(key);
        int i = 0;
        int firstDeleted = -1;

        while (i < table.length) {
            if (table[index].state == 0) {
                if (!insert) {
                    return -1;
                }
                return firstDeleted != -1 ? firstDeleted : index;
            }
            if (table[index].state == 1 && table[index].key.equals(key)) {
                return index;
            }
            if (table[index].state == DELETED && insert) {
                if (firstDeleted == -1) {
                    firstDeleted = index;
                }
            }

            index = (index + 1) % table.length;
            i++;
        }

        return insert ? firstDeleted : -1;
    }

    private void rehash() {
        Entry[] oldTable = table;
        table = new Entry[oldTable.length * 2];
        size = 0;

        for (int i = 0; i < table.length; i++) {
            table[i] = new Entry(null, null);
            table[i].state = 0;
        }

        for (Entry entry : oldTable) {
            if (entry.state == 1) {
                insertar(entry.value);
            }
        }
        imprimir("rehash tabla billeteras");
    }

    private void imprimir(String accion) {
        StringBuilder estado = new StringBuilder();
        estado.append("Tipo: Tabla hash con direccionamiento abierto y sondeo lineal").append(System.lineSeparator());
        estado.append("Tamano: ").append(size).append(System.lineSeparator());
        estado.append("Capacidad: ").append(table.length).append(System.lineSeparator());
        for (int i = 0; i < table.length; i++) {
            Entry entry = table[i];
            if (entry.state == 1 && entry.value != null) {
                estado.append("slot[").append(i).append("] -> ")
                        .append(entry.key)
                        .append(" (")
                        .append(entry.value.getNombre())
                        .append(", usuario=")
                        .append(entry.value.getUsuarioId())
                        .append(", saldo=")
                        .append(entry.value.getSaldo())
                        .append(")")
                        .append(System.lineSeparator());
            } else if (entry.state == DELETED) {
                estado.append("slot[").append(i).append("] -> DELETED").append(System.lineSeparator());
            }
        }
        EstructuraConsolePrinter.imprimir("TablaBilleteras", accion, estado.toString());
    }
}

