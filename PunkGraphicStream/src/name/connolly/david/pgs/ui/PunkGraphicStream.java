/*
 * PunkGraphicStream.java
 *
 * Copyright 2008 David Connolly. All rights reserved.
 *
 * This file is part of PunkGraphicStream.
 *
 * PunkGraphicStream is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA 02110-1301 USA
 */
package name.connolly.david.pgs.ui;

import java.awt.Component;
import java.awt.HeadlessException;
import java.io.IOException;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.swing.JDialog;
import javax.swing.JFileChooser;
import javax.swing.filechooser.FileNameExtensionFilter;
import name.connolly.david.pgs.FrameRate;
import name.connolly.david.pgs.concurrency.RenderRunnable;
import name.connolly.david.pgs.mac.ApplicationEvent;
import name.connolly.david.pgs.mac.ApplicationHandler;
import name.connolly.david.pgs.mac.Application;

public class PunkGraphicStream extends javax.swing.JFrame {

    private static final long serialVersionUID = 3301916545310764557L;
    private FrameRate frameRate = FrameRate.FILM;

    /** Creates new form PunkGraphicStream */
    public PunkGraphicStream() {
        final PunkGraphicStream parent = this;
        String lcOSName = System.getProperty("os.name").toLowerCase();
        boolean MAC_OS_X = lcOSName.startsWith("mac os x");

        initComponents();

        if (MAC_OS_X) {
            Application application = Application.INSTANCE;

            menuBar.setVisible(false);

            application.addListener(new ApplicationHandler("handleAbout") {

                @Override
                public void handle(ApplicationEvent event) {
                    event.setHandled(true);
                    new AboutDialog(parent, true).setVisible(true);
                }
            });

            application.addListener(new ApplicationHandler("handleQuit") {

                @Override
                public void handle(ApplicationEvent event) {
                    event.setHandled(true);
                    System.exit(0);
                }
            });
        }
    }

    /** This method is called from within the constructor to
     * initialize the form.
     * WARNING: Do NOT modify this code. The content of this method is
     * always regenerated by the Form Editor.
     */
    // <editor-fold defaultstate="collapsed" desc="Generated Code">//GEN-BEGIN:initComponents
    private void initComponents() {

        buttonGroupFrameRate = new javax.swing.ButtonGroup();
        jTextFieldSubtitleFile = new javax.swing.JTextField();
        jButtonBrowse = new javax.swing.JButton();
        jRadioButtonFilmNtsc = new javax.swing.JRadioButton();
        jRadioButtonFilm = new javax.swing.JRadioButton();
        jRadioButtonPal = new javax.swing.JRadioButton();
        jRadioButtonNtsc = new javax.swing.JRadioButton();
        jRadioButtonPalHd = new javax.swing.JRadioButton();
        jRadioButtonNtscHd = new javax.swing.JRadioButton();
        jButtonEncode = new javax.swing.JButton();
        jSeparator2 = new javax.swing.JSeparator();
        jLabelFrameRate = new javax.swing.JLabel();
        jLabelSubtitleFile = new javax.swing.JLabel();
        jCheckBoxAnimated = new javax.swing.JCheckBox();
        menuBar = new javax.swing.JMenuBar();
        fileMenu = new javax.swing.JMenu();
        exitMenuItem = new javax.swing.JMenuItem();
        helpMenu = new javax.swing.JMenu();
        aboutMenuItem = new javax.swing.JMenuItem();

        setDefaultCloseOperation(javax.swing.WindowConstants.EXIT_ON_CLOSE);
        setTitle("PunkGraphicStream");
        setLocationByPlatform(true);
        setResizable(false);

        jButtonBrowse.setText("Browse...");
        jButtonBrowse.setToolTipText("Select Subtitle File");
        jButtonBrowse.addActionListener(new java.awt.event.ActionListener() {
            public void actionPerformed(java.awt.event.ActionEvent evt) {
                jButtonBrowseActionPerformed(evt);
            }
        });

        buttonGroupFrameRate.add(jRadioButtonFilmNtsc);
        jRadioButtonFilmNtsc.setText("Film (NTSC) ");
        jRadioButtonFilmNtsc.setToolTipText("24 Frames Per Second");
        jRadioButtonFilmNtsc.addActionListener(new java.awt.event.ActionListener() {
            public void actionPerformed(java.awt.event.ActionEvent evt) {
                jRadioButtonFilmNtscActionPerformed(evt);
            }
        });

        buttonGroupFrameRate.add(jRadioButtonFilm);
        jRadioButtonFilm.setSelected(true);
        jRadioButtonFilm.setText("Film");
        jRadioButtonFilm.setToolTipText("23.976 Frames Per Second");
        jRadioButtonFilm.addActionListener(new java.awt.event.ActionListener() {
            public void actionPerformed(java.awt.event.ActionEvent evt) {
                jRadioButtonFilmActionPerformed(evt);
            }
        });

        buttonGroupFrameRate.add(jRadioButtonPal);
        jRadioButtonPal.setText("PAL");
        jRadioButtonPal.setToolTipText("25 Frames Per Second");
        jRadioButtonPal.addActionListener(new java.awt.event.ActionListener() {
            public void actionPerformed(java.awt.event.ActionEvent evt) {
                jRadioButtonPalActionPerformed(evt);
            }
        });

        buttonGroupFrameRate.add(jRadioButtonNtsc);
        jRadioButtonNtsc.setText("NTSC");
        jRadioButtonNtsc.setToolTipText("29.97 Frames Per Second");
        jRadioButtonNtsc.addActionListener(new java.awt.event.ActionListener() {
            public void actionPerformed(java.awt.event.ActionEvent evt) {
                jRadioButtonNtscActionPerformed(evt);
            }
        });

        buttonGroupFrameRate.add(jRadioButtonPalHd);
        jRadioButtonPalHd.setText("PAL HD");
        jRadioButtonPalHd.setToolTipText("50 Frames Per Second");
        jRadioButtonPalHd.addActionListener(new java.awt.event.ActionListener() {
            public void actionPerformed(java.awt.event.ActionEvent evt) {
                jRadioButtonPalHdActionPerformed(evt);
            }
        });

        buttonGroupFrameRate.add(jRadioButtonNtscHd);
        jRadioButtonNtscHd.setText("NTSC HD");
        jRadioButtonNtscHd.setToolTipText("59.94 Frames Per Second");
        jRadioButtonNtscHd.addActionListener(new java.awt.event.ActionListener() {
            public void actionPerformed(java.awt.event.ActionEvent evt) {
                jRadioButtonNtscHdActionPerformed(evt);
            }
        });

        jButtonEncode.setText("Encode");
        jButtonEncode.addActionListener(new java.awt.event.ActionListener() {
            public void actionPerformed(java.awt.event.ActionEvent evt) {
                jButtonEncodeActionPerformed(evt);
            }
        });

        jLabelFrameRate.setText("Options:");

        jLabelSubtitleFile.setText("Subtitle File:");

        jCheckBoxAnimated.setSelected(true);
        jCheckBoxAnimated.setText("Animated");

        fileMenu.setText("File");

        exitMenuItem.setText("Exit");
        exitMenuItem.addActionListener(new java.awt.event.ActionListener() {
            public void actionPerformed(java.awt.event.ActionEvent evt) {
                exitMenuItemActionPerformed(evt);
            }
        });
        fileMenu.add(exitMenuItem);

        menuBar.add(fileMenu);

        helpMenu.setText("Help");

        aboutMenuItem.setText("About");
        aboutMenuItem.addActionListener(new java.awt.event.ActionListener() {
            public void actionPerformed(java.awt.event.ActionEvent evt) {
                aboutMenuItemActionPerformed(evt);
            }
        });
        helpMenu.add(aboutMenuItem);

        menuBar.add(helpMenu);

        setJMenuBar(menuBar);

        javax.swing.GroupLayout layout = new javax.swing.GroupLayout(getContentPane());
        getContentPane().setLayout(layout);
        layout.setHorizontalGroup(
            layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
            .addGroup(layout.createSequentialGroup()
                .addContainerGap()
                .addComponent(jButtonBrowse)
                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                .addComponent(jButtonEncode)
                .addContainerGap(80, Short.MAX_VALUE))
            .addGroup(layout.createSequentialGroup()
                .addContainerGap()
                .addGroup(layout.createParallelGroup(javax.swing.GroupLayout.Alignment.TRAILING)
                    .addGroup(javax.swing.GroupLayout.Alignment.CENTER, layout.createSequentialGroup()
                        .addComponent(jRadioButtonFilmNtsc)
                        .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.UNRELATED)
                        .addComponent(jRadioButtonFilm))
                    .addGroup(javax.swing.GroupLayout.Alignment.CENTER, layout.createSequentialGroup()
                        .addComponent(jRadioButtonPal)
                        .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.UNRELATED)
                        .addComponent(jRadioButtonPalHd))
                    .addGroup(javax.swing.GroupLayout.Alignment.LEADING, layout.createSequentialGroup()
                        .addComponent(jRadioButtonNtsc)
                        .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.UNRELATED)
                        .addComponent(jRadioButtonNtscHd))))
            .addGroup(layout.createSequentialGroup()
                .addContainerGap()
                .addComponent(jLabelSubtitleFile)
                .addContainerGap(173, Short.MAX_VALUE))
            .addGroup(layout.createSequentialGroup()
                .addContainerGap()
                .addComponent(jLabelFrameRate)
                .addContainerGap(191, Short.MAX_VALUE))
            .addComponent(jSeparator2, javax.swing.GroupLayout.Alignment.TRAILING, javax.swing.GroupLayout.DEFAULT_SIZE, 242, Short.MAX_VALUE)
            .addGroup(layout.createSequentialGroup()
                .addContainerGap()
                .addComponent(jTextFieldSubtitleFile, javax.swing.GroupLayout.DEFAULT_SIZE, 222, Short.MAX_VALUE)
                .addContainerGap())
            .addGroup(layout.createSequentialGroup()
                .addContainerGap()
                .addComponent(jCheckBoxAnimated)
                .addContainerGap(165, Short.MAX_VALUE))
        );

        layout.linkSize(javax.swing.SwingConstants.HORIZONTAL, new java.awt.Component[] {jRadioButtonFilm, jRadioButtonFilmNtsc, jRadioButtonNtsc, jRadioButtonNtscHd, jRadioButtonPal, jRadioButtonPalHd});

        layout.setVerticalGroup(
            layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
            .addGroup(layout.createSequentialGroup()
                .addContainerGap()
                .addComponent(jLabelSubtitleFile)
                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                .addComponent(jTextFieldSubtitleFile, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE)
                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.UNRELATED)
                .addGroup(layout.createParallelGroup(javax.swing.GroupLayout.Alignment.BASELINE)
                    .addComponent(jButtonBrowse)
                    .addComponent(jButtonEncode))
                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                .addComponent(jSeparator2, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE)
                .addGap(6, 6, 6)
                .addComponent(jLabelFrameRate)
                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.UNRELATED)
                .addGroup(layout.createParallelGroup(javax.swing.GroupLayout.Alignment.BASELINE)
                    .addComponent(jRadioButtonFilmNtsc)
                    .addComponent(jRadioButtonFilm))
                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.UNRELATED)
                .addGroup(layout.createParallelGroup(javax.swing.GroupLayout.Alignment.BASELINE)
                    .addComponent(jRadioButtonPal)
                    .addComponent(jRadioButtonPalHd))
                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.UNRELATED)
                .addGroup(layout.createParallelGroup(javax.swing.GroupLayout.Alignment.BASELINE)
                    .addComponent(jRadioButtonNtsc)
                    .addComponent(jRadioButtonNtscHd))
                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.UNRELATED)
                .addComponent(jCheckBoxAnimated)
                .addContainerGap(javax.swing.GroupLayout.DEFAULT_SIZE, Short.MAX_VALUE))
        );

        jButtonBrowse.getAccessibleContext().setAccessibleName("jButtonBrowse");

        pack();
    }// </editor-fold>//GEN-END:initComponents

    private void exitMenuItemActionPerformed(java.awt.event.ActionEvent evt) {//GEN-FIRST:event_exitMenuItemActionPerformed
        System.exit(0);
    }//GEN-LAST:event_exitMenuItemActionPerformed

    private void jButtonEncodeActionPerformed(java.awt.event.ActionEvent evt) {//GEN-FIRST:event_jButtonEncodeActionPerformed
        String input = jTextFieldSubtitleFile.getText();
        String output = "default.ass";
        boolean animated = jCheckBoxAnimated.isSelected();
        EncodeDialog dialog = new EncodeDialog(this, true);
        RenderRunnable renderer;
        if (input.length() > 5) {
            output = input.substring(0,
                    input.length() - 4) + ".sup";
        }

        renderer = new RenderRunnable(input, output, frameRate, animated, dialog);

        new Thread(renderer).start();

        dialog.setVisible(true);

        if (dialog.getReturnStatus() == 0) {
            renderer.cancel();
        }
}//GEN-LAST:event_jButtonEncodeActionPerformed

    // TODO Native FileOpener on Mac.
    private void jButtonBrowseActionPerformed(java.awt.event.ActionEvent evt) {//GEN-FIRST:event_jButtonBrowseActionPerformed
        JFileChooser chooser = new JFileChooser(jTextFieldSubtitleFile.getText()) {
			private static final long serialVersionUID = 2849546445500725876L;

			@Override
            protected JDialog createDialog(Component parent) throws HeadlessException {
                JDialog jDialog = super.createDialog(parent);
                jDialog.setLocationByPlatform(true);
                return jDialog;
            }
        };

        FileNameExtensionFilter filter = new FileNameExtensionFilter(
                "Advanced Substation Alpha Subtitle Files (.ass)", "ass");
        chooser.setFileFilter(filter);

        int returnVal = chooser.showOpenDialog(this);

        if (returnVal == JFileChooser.APPROVE_OPTION) {
            try {
                jTextFieldSubtitleFile.setText(chooser.getSelectedFile().getCanonicalPath());
            } catch (IOException ex) {
                Logger.getLogger(PunkGraphicStream.class.getName()).log(Level.SEVERE, null, ex);
            }
        }
    }//GEN-LAST:event_jButtonBrowseActionPerformed

    private void jRadioButtonFilmNtscActionPerformed(java.awt.event.ActionEvent evt) {//GEN-FIRST:event_jRadioButtonFilmNtscActionPerformed
        frameRate = FrameRate.FILM_NTSC;
    }//GEN-LAST:event_jRadioButtonFilmNtscActionPerformed

    private void jRadioButtonFilmActionPerformed(java.awt.event.ActionEvent evt) {//GEN-FIRST:event_jRadioButtonFilmActionPerformed
        frameRate = FrameRate.FILM;
    }//GEN-LAST:event_jRadioButtonFilmActionPerformed

    private void jRadioButtonPalActionPerformed(java.awt.event.ActionEvent evt) {//GEN-FIRST:event_jRadioButtonPalActionPerformed
        frameRate = FrameRate.TV_PAL;
    }//GEN-LAST:event_jRadioButtonPalActionPerformed

    private void jRadioButtonPalHdActionPerformed(java.awt.event.ActionEvent evt) {//GEN-FIRST:event_jRadioButtonPalHdActionPerformed
        frameRate = FrameRate.HD_PAL;
    }//GEN-LAST:event_jRadioButtonPalHdActionPerformed

    private void jRadioButtonNtscActionPerformed(java.awt.event.ActionEvent evt) {//GEN-FIRST:event_jRadioButtonNtscActionPerformed
        frameRate = FrameRate.TV_NTSC;
    }//GEN-LAST:event_jRadioButtonNtscActionPerformed

    private void jRadioButtonNtscHdActionPerformed(java.awt.event.ActionEvent evt) {//GEN-FIRST:event_jRadioButtonNtscHdActionPerformed
        frameRate = FrameRate.HD_NTSC;
    }//GEN-LAST:event_jRadioButtonNtscHdActionPerformed

    private void aboutMenuItemActionPerformed(java.awt.event.ActionEvent evt) {//GEN-FIRST:event_aboutMenuItemActionPerformed
        new AboutDialog(this, true).setVisible(true);
    }//GEN-LAST:event_aboutMenuItemActionPerformed

    /**
     * @param args the command line arguments
     */
    public static void main(String args[]) {
        java.awt.EventQueue.invokeLater(new Runnable() {

            public void run() {
                new PunkGraphicStream().setVisible(true);
            }
        });
    }

    // Variables declaration - do not modify//GEN-BEGIN:variables
    private javax.swing.JMenuItem aboutMenuItem;
    private javax.swing.ButtonGroup buttonGroupFrameRate;
    private javax.swing.JMenuItem exitMenuItem;
    private javax.swing.JMenu fileMenu;
    private javax.swing.JMenu helpMenu;
    private javax.swing.JButton jButtonBrowse;
    private javax.swing.JButton jButtonEncode;
    private javax.swing.JCheckBox jCheckBoxAnimated;
    private javax.swing.JLabel jLabelFrameRate;
    private javax.swing.JLabel jLabelSubtitleFile;
    private javax.swing.JRadioButton jRadioButtonFilm;
    private javax.swing.JRadioButton jRadioButtonFilmNtsc;
    private javax.swing.JRadioButton jRadioButtonNtsc;
    private javax.swing.JRadioButton jRadioButtonNtscHd;
    private javax.swing.JRadioButton jRadioButtonPal;
    private javax.swing.JRadioButton jRadioButtonPalHd;
    private javax.swing.JSeparator jSeparator2;
    private javax.swing.JTextField jTextFieldSubtitleFile;
    private javax.swing.JMenuBar menuBar;
    // End of variables declaration//GEN-END:variables
}