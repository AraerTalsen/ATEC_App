const { ipcRenderer, remote } = require('electron');
const path = require('path');

let kids = document.getElementById("kidsEdition");
let adults = document.getElementById("adultsEdition");

kids.addEventListener('click', (ev)=>
{
    ipcRenderer.send('chosenExam', true);
    changeScene();
});

adults.addEventListener('click', (ev)=>
{
    ipcRenderer.send('chosenExam', false);
    changeScene();
});

function changeScene()
{
    ipcRenderer.send('toggleVidWindow');
    let currentWin = remote.getCurrentWindow();
    currentWin.loadFile(path.join(__dirname, 'controlWindow.html'));
}