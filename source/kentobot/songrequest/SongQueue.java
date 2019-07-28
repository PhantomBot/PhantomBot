/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package kentobot.songrequest;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Iterator;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Queue;

/**
 *
 * @author Jason
 */
public class SongQueue implements Queue {

    private static List<Object> queue = new ArrayList<Object>();
    
    public synchronized boolean add(Object e) {
        if (e == null) {
            throw new NullPointerException("Specified element is null");
        }

        return queue.add(e);
    }

    public synchronized boolean offer(Object e) {
        if (e == null) {
            throw new NullPointerException("Specified element is null");
        }

        return queue.add(e);
    }

    public synchronized Object remove() {
        if (queue.isEmpty()) {
            throw new NoSuchElementException("The queue is empty");
        }
        Object obj = queue.get(0);
        queue.remove(obj);
        
        return obj;
    }

    public synchronized Object poll() {
       if (queue.isEmpty()) {
           return null;
       }
       
       Object obj = queue.get(0);
       queue.remove(obj);
       
       return obj;
    }

    public synchronized Object element() {
        if (queue.isEmpty()) {
            throw new NoSuchElementException("The queue is empty");
        }
        
        return queue.get(0);
    }

    public synchronized Object peek() {
        if (queue.isEmpty()) {
            return null;
        }
        
        return queue.get(0);
    }
    
    public synchronized int size() {
        return queue.size();
    }
    
    public synchronized Object[] toArray() {
        return queue.toArray();
    }
    
    public synchronized void clear() {
        queue.clear();
    }

    public synchronized boolean isEmpty() {
        return queue.isEmpty();
    }

    public synchronized boolean contains(Object o) {
        return queue.contains(o);
    }

    public synchronized Iterator iterator() {
        return queue.iterator();
    }

    public synchronized Object[] toArray(Object[] a) {
        return queue.toArray(a);
    }

    public synchronized boolean remove(Object o) {
        return queue.remove(o);
    }

    public synchronized boolean containsAll(Collection c) {
        return queue.containsAll(c);
    }

    public synchronized boolean addAll(Collection c) {
        return queue.addAll(c);
    }

    public synchronized boolean removeAll(Collection c) {
        return queue.removeAll(c);
    }

    public synchronized boolean retainAll(Collection c) {
        return queue.retainAll(c);
    }
    
    public synchronized void addAtPosition(Object e, int position) {
        if (e == null) {
            throw new NullPointerException("Specified element is null");
        }

        if (queue.contains(e)) {
            queue.remove(e);
        }
        queue.add(position, e);
    }
    
    public synchronized void moveToFront(Object e) {
        addAtPosition(e, 0);
    }
}
