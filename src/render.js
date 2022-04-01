// JS file for direct control over render process (index.html) rather then direct app control (index.js)

const { ipcRenderer } = require("electron")
const ipc = ipcRenderer

// Close App 

closeBtn.addEventListener('click', ()=>{
    ipc.send('closeApp')
})

// Minimise App

minimiseBtn.addEventListener('click', ()=>{
    ipc.send('minimiseApp')
})

// Fullscreen App
maximiseBtn.addEventListener('click', ()=>{
    ipc.send('fullscreenApp')
})

showHideMenus.addEventListener('click', ()=>{
    ipc.send('showHideMenus')
})