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



window.onSpotifyWebPlaybackSDKReady = () => {
    token = getAccessToken()
    console.log(token)
    const player = new Spotify.Player({
      name: 'SpotiFire Webplayer',
      getOAuthToken: cb => { cb(token); }
    });
    // Ready
    player.addListener('ready', ({ device_id }) => {
        console.log('Ready with Device ID', device_id);
    });

    // Not Ready
    player.addListener('not_ready', ({ device_id }) => {
        console.log('Device ID has gone offline', device_id);
    });

    player.addListener('initialization_error', ({ message }) => {
        console.error(message);
    });

    player.addListener('authentication_error', ({ message }) => {
        console.error(message);
    });

    player.addListener('account_error', ({ message }) => {
        console.error(message);
    });

    player.connect();
}