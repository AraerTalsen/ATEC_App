const {ipcRenderer} = require('electron');

let video = document.querySelector('video');

video.addEventListener('ended', ()=>
{
    ipcRenderer.send('vidEnded');
});

let source = document.createElement('source');
source.setAttribute('src', 'videos\\adults\\1_2_3_Go.mp4');
video.appendChild(source);


ipcRenderer.on('load', (event, arg)=>
{
    video.pause();
    source.setAttribute('src', arg);
    console.log(arg);
    video.load();
});

ipcRenderer.on('start', ()=>
{
    video.play();
});

ipcRenderer.on('stop', ()=>
{
    video.pause();
});