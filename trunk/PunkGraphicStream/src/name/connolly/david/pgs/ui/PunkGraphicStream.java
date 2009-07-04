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
import javax.swing.UIManager;
import javax.swing.UnsupportedLookAndFeelException;
import javax.swing.filechooser.FileNameExtensionFilter;
import name.connolly.david.pgs.FrameRate;
import name.connolly.david.pgs.Resolution;
import name.connolly.david.pgs.concurrency.RenderRunnable;
import name.connolly.david.pgs.mac.ApplicationEvent;
import name.connolly.david.pgs.mac.ApplicationHandler;
import name.connolly.david.pgs.mac.Application;

public class PunkGraphicStream extends javax.swing.JFrame {

    private static final long serialVersionUID = 3301916545310764557L;
    private FrameRate frameRate = FrameRate.FILM;
    private Resolution resolution = Resolution.HD_1080;

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
        buttonGroupResolution = new javax.swing.ButtonGroup();
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
        jRadioButton480p = new javax.swing.JRadioButton();
        jLabel1 = new javax.swing.JLabel();
        jRadioButton576p = new javax.swing.JRadioButton();
        jRadioButton720p = new javax.swing.JRadioButton();
        jRadioButton1080p = new javax.swing.JRadioButton();
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

        jLabelFrameRate.setText("Frame Rate:");

        jLabelSubtitleFile.setText("Subtitle File:");

        buttonGroupResolution.add(jRadioButton480p);
        jRadioButton480p.setText("NTSC (480p)");
        jRadioButton480p.addActionListener(new java.awt.event.ActionListener() {
            public void actionPerformed(java.awt.event.ActionEvent evt) {
                jRadioButton480pActionPerformed(evt);
            }
        });

        jLabel1.setText("Resolution:");

        buttonGroupResolution.add(jRadioButton576p);
        jRadioButton576p.setText("PAL (576p)");
        jRadioButton576p.addActionListener(new java.awt.event.ActionListener() {
            public void actionPerformed(java.awt.event.ActionEvent evt) {
                jRadioButton576pActionPerformed(evt);
            }
        });

        buttonGroupResolution.add(jRadioButton720p);
        jRadioButton720p.setText("HD (720p)");
        jRadioButton720p.addActionListener(new java.awt.event.ActionListener() {
            public void actionPerformed(java.awt.event.ActionEvent evt) {
                jRadioButton720pActionPerformed(evt);
            }
        });

        buttonGroupResolution.add(jRadioButton1080p);
        jRadioButton1080p.setSelected(true);
        jRadioButton1080p.setText("HD (1080p)");
        jRadioButton1080p.addActionListener(new java.awt.event.ActionListener() {
            public void actionPerformed(java.awt.event.ActionEvent evt) {
                jRadioButton1080pActionPerformed(evt);
            }
        });

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
                .addContainerGap(39, Short.MAX_VALUE))
            .addGroup(layout.createSequentialGroup()
                .addContainerGap()
                .addGroup(layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
                    .addComponent(jRadioButtonFilmNtsc)
                    .addComponent(jRadioButtonPal)
                    .addComponent(jRadioButtonPalHd))
                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                .addGroup(layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
                    .addComponent(jRadioButtonFilm)
                    .addComponent(jRadioButtonNtsc)
                    .addComponent(jRadioButtonNtscHd))
                .addContainerGap(javax.swing.GroupLayout.DEFAULT_SIZE, Short.MAX_VALUE))
            .addGroup(layout.createSequentialGroup()
                .addContainerGap()
                .addComponent(jLabelSubtitleFile)
                .addContainerGap(153, Short.MAX_VALUE))
            .addGroup(layout.createSequentialGroup()
                .addContainerGap()
                .addComponent(jLabelFrameRate)
                .addContainerGap(158, Short.MAX_VALUE))
            .addComponent(jSeparator2, javax.swing.GroupLayout.Alignment.TRAILING, javax.swing.GroupLayout.DEFAULT_SIZE, 251, Short.MAX_VALUE)
            .addGroup(layout.createSequentialGroup()
                .addContainerGap()
                .addComponent(jTextFieldSubtitleFile, javax.swing.GroupLayout.DEFAULT_SIZE, 211, Short.MAX_VALUE)
                .addContainerGap())
            .addGroup(layout.createSequentialGroup()
                .addContainerGap()
                .addComponent(jLabel1)
                .addContainerGap(160, Short.MAX_VALUE))
            .addGroup(layout.createSequentialGroup()
                .addContainerGap()
                .addGroup(layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
                    .addComponent(jRadioButton480p)
                    .addComponent(jRadioButton720p))
                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                .addGroup(layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
                    .addComponent(jRadioButton576p)
                    .addComponent(jRadioButton1080p))
                .addContainerGap(20, Short.MAX_VALUE))
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
                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                .addGroup(layout.createParallelGroup(javax.swing.GroupLayout.Alignment.BASELINE)
                    .addComponent(jRadioButtonPal)
                    .addComponent(jRadioButtonNtsc))
                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                .addGroup(layout.createParallelGroup(javax.swing.GroupLayout.Alignment.BASELINE)
                    .addComponent(jRadioButtonPalHd)
                    .addComponent(jRadioButtonNtscHd))
                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.UNRELATED)
                .addComponent(jLabel1)
                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.UNRELATED)
                .addGroup(layout.createParallelGroup(javax.swing.GroupLayout.Alignment.BASELINE)
                    .addComponent(jRadioButton480p)
                    .addComponent(jRadioButton576p))
                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.UNRELATED)
                .addGroup(layout.createParallelGroup(javax.swing.GroupLayout.Alignment.BASELINE)
                    .addComponent(jRadioButton720p)
                    .addComponent(jRadioButton1080p))
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
        EncodeDialog dialog = new EncodeDialog(this, true);
        RenderRunnable renderer;

        // FIXME: Proper Regex Based Validation
        if (input.length() > 5) {
            output = input.substring(0,
                    input.length() - 4) + ".sup";
        } else {
            // TODO: Dialog Box
            return;
        }

        renderer = new RenderRunnable(input, output, frameRate, resolution, dialog);

        new Thread(renderer, "Renderer").start();

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

    private void jRadioButton480pActionPerformed(java.awt.event.ActionEvent evt) {//GEN-FIRST:event_jRadioButton480pActionPerformed
        resolution = Resolution.NTSC_480;
    }//GEN-LAST:event_jRadioButton480pActionPerformed

    private void jRadioButton576pActionPerformed(java.awt.event.ActionEvent evt) {//GEN-FIRST:event_jRadioButton576pActionPerformed
        resolution = Resolution.PAL_576;
    }//GEN-LAST:event_jRadioButton576pActionPerformed

    private void jRadioButton720pActionPerformed(java.awt.event.ActionEvent evt) {//GEN-FIRST:event_jRadioButton720pActionPerformed
        resolution = Resolution.HD_720;
    }//GEN-LAST:event_jRadioButton720pActionPerformed

    private void jRadioButton1080pActionPerformed(java.awt.event.ActionEvent evt) {//GEN-FIRST:event_jRadioButton1080pActionPerformed
        resolution = Resolution.HD_1080;
    }//GEN-LAST:event_jRadioButton1080pActionPerformed

    /**
     * @param args the command line arguments
     */
    public static void main(String args[]) {
        java.awt.EventQueue.invokeLater(new Runnable() {

            public void run() {
                try {
                    UIManager.setLookAndFeel(UIManager.getSystemLookAndFeelClassName());
                } catch (ClassNotFoundException ex) {
                    Logger.getLogger(PunkGraphicStream.class.getName()).log(Level.WARNING, null, ex);
                } catch (InstantiationException ex) {
                    Logger.getLogger(PunkGraphicStream.class.getName()).log(Level.WARNING, null, ex);
                } catch (IllegalAccessException ex) {
                    Logger.getLogger(PunkGraphicStream.class.getName()).log(Level.WARNING, null, ex);
                } catch (UnsupportedLookAndFeelException ex) {
                    Logger.getLogger(PunkGraphicStream.class.getName()).log(Level.WARNING, null, ex);
                }
                
                new PunkGraphicStream().setVisible(true);
            }
        });
    }

    // Variables declaration - do not modify//GEN-BEGIN:variables
    private javax.swing.JMenuItem aboutMenuItem;
    private javax.swing.ButtonGroup buttonGroupFrameRate;
    private javax.swing.ButtonGroup buttonGroupResolution;
    private javax.swing.JMenuItem exitMenuItem;
    private javax.swing.JMenu fileMenu;
    private javax.swing.JMenu helpMenu;
    private javax.swing.JButton jButtonBrowse;
    private javax.swing.JButton jButtonEncode;
    private javax.swing.JLabel jLabel1;
    private javax.swing.JLabel jLabelFrameRate;
    private javax.swing.JLabel jLabelSubtitleFile;
    private javax.swing.JRadioButton jRadioButton1080p;
    private javax.swing.JRadioButton jRadioButton480p;
    private javax.swing.JRadioButton jRadioButton576p;
    private javax.swing.JRadioButton jRadioButton720p;
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