package ZiplocSAS.domain.structures;

import ZiplocSAS.domain.model.Usuario;
import java.util.*;
/**
 * Custom hash table for fast user lookup.
 * 
 * ACADEMIC PURPOSE:
 * Demonstrates a custom hash table implementation using separate chaining
 * to handle collisions. Provides O(1) average-case lookup.
 * 
 * Data Structure: Hash Table with Separate Chaining
 * - Hash function: id.hashCode()
 * - Collision handling: Chaining (linked lists)
 * - Average operations: O(1)
 * - Worst case: O(n) if many collisions
 * 
 * Why this structure:
 * 1. Fast user lookup by ID without database queries
 * 2. Demonstrates classic hash table collision resolution
 * 3. Load factor management prevents excessive collisions
 * 4. More efficient than linear search through all users
 */

public class TablaUsuarios {
    private Entry[] table;
    private int size;
    private static final int INITIAL_CAPACITY = 16;
    private static final float LOAD_FACTOR = 0.75f;

    private static class Entry {
        String key;
        Usuario value;
        Entry next;

        Entry(String key, Usuario value) {
            this.key = key;
            this.value = value;
        }
    }

    public TablaUsuarios() {
        this.table = new Entry[INITIAL_CAPACITY];
        this.size = 0;
    }

    /**
     * Inserta o actualiza un usuario en la tabla
     */
    public void insertar(Usuario usuario) {
        if (size >= table.length * LOAD_FACTOR) {
            rehash();
        }

        int index = hash(usuario.getId());
        Entry entry = table[index];

        while (entry != null) {
            if (entry.key.equals(usuario.getId())) {
                entry.value = usuario;
                imprimir("actualizar usuario " + usuario.getId());
                return;
            }
            entry = entry.next;
        }

        // Insertar al inicio (O(1))
        Entry newEntry = new Entry(usuario.getId(), usuario);
        newEntry.next = table[index];
        table[index] = newEntry;
        size++;
        imprimir("insertar usuario " + usuario.getId());
    }

    /**
     * Busca un usuario por ID
     */
    public Usuario buscar(String usuarioId) {
        int index = hash(usuarioId);
        Entry entry = table[index];

        while (entry != null) {
            if (entry.key.equals(usuarioId)) {
                imprimir("buscar usuario " + usuarioId + " -> encontrado");
                return entry.value;
            }
            entry = entry.next;
        }
        imprimir("buscar usuario " + usuarioId + " -> no encontrado");
        return null;
    }

    public void eliminar(String usuarioId) {
        int index = hash(usuarioId);
        Entry entry = table[index];
        Entry prev = null;

        while (entry != null) {
            if (entry.key.equals(usuarioId)) {
                if (prev == null) {
                    table[index] = entry.next;
                } else {
                    prev.next = entry.next;
                }
                size--;
                imprimir("eliminar usuario " + usuarioId);
                return;
            }
            prev = entry;
            entry = entry.next;
        }
        imprimir("eliminar usuario " + usuarioId + " -> no encontrado");
    }

    public boolean contiene(String usuarioId) {
        return buscar(usuarioId) != null;
    }

    public List<Usuario> obtenerTodos() {
        List<Usuario> usuarios = new ArrayList<>();
        for (Entry entry : table) {
            while (entry != null) {
                usuarios.add(entry.value);
                entry = entry.next;
            }
        }
        imprimir("obtener todos los usuarios");
        return usuarios;
    }

    public int size() {
        return size;
    }

    private int hash(String id) {
        return (id.hashCode() & 0x7FFFFFFF) % table.length;
    }

    private void rehash() {
        Entry[] oldTable = table;
        table = new Entry[oldTable.length * 2];
        size = 0;

        for (Entry entry : oldTable) {
            while (entry != null) {
                insertar(entry.value);
                entry = entry.next;
            }
        }
        imprimir("rehash tabla usuarios");
    }

    private void imprimir(String accion) {
        StringBuilder estado = new StringBuilder();
        estado.append("Tipo: Tabla hash con encadenamiento separado").append(System.lineSeparator());
        estado.append("Tamano: ").append(size).append(System.lineSeparator());
        estado.append("Capacidad: ").append(table.length).append(System.lineSeparator());
        for (int i = 0; i < table.length; i++) {
            Entry entry = table[i];
            if (entry == null) {
                continue;
            }
            estado.append("bucket[").append(i).append("]");
            while (entry != null) {
                estado.append(" -> ")
                        .append(entry.key)
                        .append(" (")
                        .append(entry.value.getNombre())
                        .append(", ")
                        .append(entry.value.getEmail())
                        .append(")");
                entry = entry.next;
            }
            estado.append(System.lineSeparator());
        }
        EstructuraConsolePrinter.imprimir("TablaUsuarios", accion, estado.toString());
    }
}

