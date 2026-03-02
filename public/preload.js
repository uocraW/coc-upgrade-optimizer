/**
 * Electron Preload Script
 * Exposes safe IPC APIs to React renderer process
 * Implements context isolation for security
 */

const { contextBridge, ipcRenderer } = require('electron');

/**
 * Expose safe API object to React
 * window.electronAPI will be available to renderer process
 */
contextBridge.exposeInMainWorld('electronAPI', {
  /**
   * Invoke IPC handler in main process
   * @param {string} channel - Handler name
   * @param {...args} args - Arguments to pass to handler
   * @returns {Promise} Result from handler
   */
  invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),

  /**
   * Listen for IPC events from main process
   * @param {string} channel - Event name
   * @param {function} callback - Handler function
   * @returns {function} Function to remove listener
   */
  on: (channel, callback) => {
    const listener = (event, ...args) => callback(...args);
    ipcRenderer.on(channel, listener);
    // Return function to remove listener
    return () => ipcRenderer.removeListener(channel, listener);
  },

  /**
   * Remove IPC event listener
   * @param {string} channel - Event name
   * @param {function} callback - Handler to remove
   */
  off: (channel, callback) => {
    ipcRenderer.removeListener(channel, callback);
  },
});
