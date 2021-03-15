/**
 * This file will automatically be loaded by webpack and run in the "renderer" context.
 * To learn more about the differences between the "main" and the "renderer" context in
 * Electron, visit:
 *
 * https://electronjs.org/docs/tutorial/application-architecture#main-and-renderer-processes
 *
 * By default, Node.js integration in this file is disabled. When enabling Node.js integration
 * in a renderer process, please be aware of potential security implications. You can read
 * more about security risks here:
 *
 * https://electronjs.org/docs/tutorial/security
 *
 * To enable Node.js integration in this file, open up `main.js` and enable the `nodeIntegration`
 * flag:
 *
 * ```
 *  // Create the browser window.
 *  mainWindow = new BrowserWindow({
 *    width: 800,
 *    height: 600,
 *    webPreferences: {
 *      nodeIntegration: true
 *    }
 *  });
 * ```
 */

import './index.css';
import React from "react";
import ReactDOM from "react-dom";
import Index from "./Index";
import { createMuiTheme, ThemeProvider } from '@material-ui/core';
import { HashRouter, Route, Switch } from 'react-router-dom';
import Download from './Download';
import Viewer from './Viewer';

const theme = createMuiTheme({
  palette: {
    primary: {
      main: "rgb(255, 89, 150)"
    }
  }
});


const router = (
  <HashRouter>
    <Switch>
      <Route path="/" exact>
        <Index />
      </Route>
      <Route path="/download">
        <Download />
      </Route>
      <Route path="/viewer">
        <Viewer />
      </Route>
    </Switch>
  </HashRouter>
);


ReactDOM.render(<ThemeProvider theme={theme}>{router}</ThemeProvider>, document.getElementById("main"));