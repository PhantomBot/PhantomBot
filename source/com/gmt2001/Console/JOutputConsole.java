/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package com.gmt2001.Console;

import java.io.IOException;
import java.io.OutputStream;
import javax.swing.JTextArea;

/**
 *
 * @author ScaniaTV
 * @see https://stackoverflow.com/questions/19834155/jtextarea-as-console
 */
public class JOutputConsole extends OutputStream {
    private final JTextArea console;
    
    /**
     * Class constructor.
     * 
     * @param console 
     */
    public JOutputConsole(JTextArea console) {
        this.console = console;
    }
    
    /**
     * Method that prints in the console.
     * 
     * @param c
     * @throws IOException 
     */
    public void write (int c) throws IOException {
        console.append(String.valueOf((char)c));
    }
}
