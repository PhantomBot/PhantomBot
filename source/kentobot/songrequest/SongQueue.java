/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package kentobot.songrequest;

import java.util.Collection;
import java.util.Iterator;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Queue;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 *
 * @author Jason
 */
public class SongQueue implements Queue {

    private List<Object> queue = new CopyOnWriteArrayList<Object>();
    
    public boolean add(Object e) {
        if (e == null) {
            throw new NullPointerException("Specified element is null");
        }

        return queue.add(e);
    }

    public boolean offer(Object e) {
        if (e == null) {
            throw new NullPointerException("Specified element is null");
        }

        return queue.add(e);
    }

    public Object remove() {
        if (queue.isEmpty()) {
            throw new NoSuchElementException("The queue is empty");
        }
        Object obj = queue.get(0);
        queue.remove(obj);
        
        return obj;
    }

    public Object poll() {
       if (queue.isEmpty()) {
           return null;
       }
       
       Object obj = queue.get(0);
       queue.remove(obj);
       
       return obj;
    }

    public Object element() {
        if (queue.isEmpty()) {
            throw new NoSuchElementException("The queue is empty");
        }
        
        return queue.get(0);
    }

    public Object peek() {
        if (queue.isEmpty()) {
            return null;
        }
        
        return queue.get(0);
    }
    
    public int size() {
        return queue.size();
    }
    
    public Object[] toArray() {
        return queue.toArray();
    }
    
    public void clear() {
        queue.clear();
    }

    public boolean isEmpty() {
        return queue.isEmpty();
    }

    public boolean contains(Object o) {
        return queue.contains(o);
    }

    public Iterator iterator() {
        return queue.iterator();
    }

    public Object[] toArray(Object[] a) {
        return queue.toArray(a);
    }

    public boolean remove(Object o) {
        return queue.remove(o);
    }

    public boolean containsAll(Collection c) {
        return queue.containsAll(c);
    }

    public boolean addAll(Collection c) {
        return queue.addAll(c);
    }

    public boolean removeAll(Collection c) {
        return queue.removeAll(c);
    }

    public boolean retainAll(Collection c) {
        return queue.retainAll(c);
    }
    
    public void addAtPosition(Object e, int position) {
        if (e == null) {
            throw new NullPointerException("Specified element is null");
        }

        queue.add(position, e);
    }
    
    public void moveToFront(Object e) {
        addAtPosition(e, 0);
    }
}
