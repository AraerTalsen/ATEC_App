const {remote, shell, ipcRenderer} = require('electron');
const path = require('path');
const fs = require('fs');
const {writeFile} = require('fs');
const { exec } = require('child_process');

let taskWhenStopped;
let selectedButton;
let unselectedColor = "rgb(230, 76, 76)";
let selectedColor = "rgb(163, 72, 90)";

let isPlaying = false;
let isFlipped = true;

let currentTask = 0;
let vidType = 0;
let vidArr;
let taskBtns = [];
let instructArr;

let mainDir;
let date;

let kidsSpecialFormat = [1, 6, 23, 30, 32, 34, 36, 38, 40];
let adultsSpecialFormat = [46];

let intro = document.getElementById('btnIntro');
let practice = document.getElementById('btnPrac');
let test = document.getElementById('btnTest');

let isATECKids = ipcRenderer.sendSync('recallExam');
let vidTxtFile = isATECKids ? '\\ATECVideos.txt' : '\\AdultATECVideos.txt';
let vidTxtFilePath = path.join(__dirname, vidTxtFile);
let instructTxtFile = isATECKids ? '\\KidsInstructions.txt' : '\\Instructions.txt';
let instructTxtFilePath = path.join(__dirname, instructTxtFile);

let firstSrc = isATECKids ? 'videos\\adults\\task0_introduction.mp4' 
: 'videos\\adults\\task0_introduction.mp4';

ipcRenderer.send('load', firstSrc);

fs.readFile(vidTxtFilePath, 'utf8' , (err, data) => 
{
    if (err) {
      console.error(err)
      return
    }
    vidArr = data.split(">");
    vidArr.pop();
    console.log(vidArr.length);

    for(let i = 0; i < vidArr.length; i++)
    {
        populateTasks(i);
    }
    activateVideoTypeButtons(0);
});

fs.readFile(instructTxtFilePath, 'utf8' , (err, data) => 
{
    if (err) {
      console.error(err)
      return
    }
    instructArr = data.split(">");
    instructArr.pop();
    loadRules(0);
    console.log(instructArr.length);
});

intro.addEventListener('click', (ev)=>
{
    if(intro != selectedButton)
    {
        stopVideo();
        ipcRenderer.send("load", getTaskSource(currentTask, 0));
        vidType = 0;
        if(selectedButton != null) selectedButton.style.backgroundColor = 'white';
        selectedButton = intro;
        selectedButton.style.backgroundColor = 'gray';

        startVideo();
    }
    
});

practice.addEventListener('click', (ev)=>
{
    if(practice != selectedButton)
    {
        stopVideo();
        ipcRenderer.send("load", getTaskSource(currentTask, 1));
        vidType = 1;
        if(selectedButton != null) selectedButton.style.backgroundColor = 'white';
        selectedButton = practice;
        selectedButton.style.backgroundColor = 'gray';

        startVideo();
    }
});

test.addEventListener('click', (ev)=>{
    if(test != selectedButton)
    {
        stopVideo();
        ipcRenderer.send("load", getTaskSource(currentTask, 2));
        vidType = 2;
        if(selectedButton != null) selectedButton.style.backgroundColor = 'white';
        selectedButton = test;
        selectedButton.style.backgroundColor = 'gray';

        startVideo();
    }
});

function makeMainDirectory()
{
    const homeDir = require('os').homedir();
    let d = new Date();
    date = (d.getMonth() + 1) + "_" + d.getDate() + "_" + d.getFullYear() + "_" + d.getHours();
    let examtype = isATECKids ? 'ATEC Kids\\' : 'ATEC Adults\\';
    mainDir = homeDir + '\\RecordedVideos\\' + examtype + date;

    if (!fs.existsSync(mainDir)){
        fs.mkdirSync(mainDir, { recursive: true });
    }
}
makeMainDirectory();

function loadRules(taskNum)
{
    let instructions = document.getElementById("instructions");
    instructions.textContent = instructArr[taskNum];
}

function activateVideoTypeButtons(taskNum)
{
    let task = vidArr[taskNum];
    let btnArrangement = 0;

    for(let i = 0; i < task.length; i++)
    {
        if(task[i] === "+") btnArrangement++;
    }

    intro.style.display = "none";
    practice.style.display = "none";
    test.style.display = "none";

    switch(btnArrangement)
    {
        case 2:
            {
                practice.style.display = "block";
            }
        case 1:
            {
                let taskId = getTaskID(currentTask);
                if( !isATECKids )
                {
                    !adultsSpecialFormat.includes(parseInt(taskId)) ? 
                    test.style.display = "block" : practice.style.display = "block";
                }
                else test.style.display = "block";
            }
        case 0:
            {
                let taskId = getTaskID(currentTask);
                if( isATECKids )
                {
                    !kidsSpecialFormat.includes(parseInt(taskId)) ? 
                    intro.style.display = "block" : test.style.display = "block";
                }
                else intro.style.display = "block";
                break;
            }
    }

    if(selectedButton != null)
    {
        selectedButton.style.backgroundColor = 'white';
        selectedButton = null;
    } 
}

function getIndexOfVidType(taskNum, type)
{
    let task = vidArr[taskNum];
    while(task.indexOf("+") > -1)
    {
        let s = task.substring(task.indexOf("e\": ") + 4);
        s = s.substring(0, s.indexOf(","));

        if(s != type) task = task.substring(task.indexOf("+") + 1);
        else 
        {
            return task;
        }
    }
    return task;
}

function getTaskSource(task, type)
{
    activateVideoTypeButtons(task);
    let trimmedTask = getIndexOfVidType(task, type);
    let s = trimmedTask.substring(trimmedTask.indexOf("h\": \"") + 5);
    s = s.substring(0, s.indexOf("\""));
    let examtype = isATECKids ? 'kids\\' : 'adults\\';
    console.log("videos\\" + examtype + s);
    return "videos\\" + examtype + s;
}

function getTaskID(taskNum)
{
    let task = vidArr[taskNum];
    let s = task.substring(task.indexOf("d\":") + 3);
    s = s.substring(0, s.indexOf("\","));
    s = s.substring(s.indexOf("\"") + 1);

    return s;
}

function getTaskName(num)
{
    let s = vidArr[num].substring(vidArr[num].indexOf("<") + 1);
    return s;
}

function populateTasks(num)
{
    let btn = document.createElement('button');
    if(num == 0) btn.style.backgroundColor = 'gray';
    btn.setAttribute('class', 'taskBtn');
    btn.innerText = getTaskName(num);
    btn.value = num;
    btn.addEventListener('click', ()=>
    {
        if(currentTask != btn.value)
        {
            stopVideo();
            taskButtonColor(btn.value);
            loadRules(currentTask);

            ipcRenderer.send("load", getTaskSource(currentTask, 0));
            vidType = 0;
        }
    });
    taskBtns.push(btn);
    document.getElementById("taskList").appendChild(btn);
}

function taskButtonColor(valChange)
{
    if(taskBtns[currentTask].style.backgroundColor === selectedColor || 
        test.style.display === 'none')
        taskBtns[currentTask].style.backgroundColor = unselectedColor;
    else
        taskBtns[currentTask].style.backgroundColor = 'white';

    currentTask = valChange;

    if(taskBtns[currentTask].style.backgroundColor === unselectedColor)
        taskBtns[currentTask].style.backgroundColor = selectedColor;
    else
        taskBtns[currentTask].style.backgroundColor = 'gray';
}

//Video constraints
let constraintObj = {
    audio: {
        echoCancellation:true
    }, 
    video: { 
        facingMode: "user", 
        width: { pref:1920 },
        height: { pref:1080 },
        frameRate:{exact: 30}
    } 
}; 
// // width: 1280, height: 720  -- preference only
// // facingMode: {exact: "user"}
// // facingMode: "environment"

// //handle older browsers that might implement getUserMedia in some way
if (navigator.mediaDevices === undefined) 
{
    navigator.mediaDevices = {};
    navigator.mediaDevices.getUserMedia = function(constraintObj) 
    {
        let getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
        if (!getUserMedia) 
        {
            return Promise.reject(new Error('getUserMedia is not implemented in this browser'));
        }
        return new Promise(function(resolve, reject) 
        {
            getUserMedia.call(navigator, constraintObj, resolve, reject);
        });
    }
}
else
{
    navigator.mediaDevices.enumerateDevices()
    .then(devices => 
    {
        devices.forEach(device=>
        {
        //console.log(device.kind.toUpperCase(), device.label);
        //, device.deviceId
        })
    })
    .catch(err=>{
        console.log(err.name, err.message);
    })
}

function startVideo()
{
    ipcRenderer.send('start');

    if(vidType == 2)
    {
        mediaRecorder.start();
        console.log(mediaRecorder.state);
    }
    isPlaying = true;
}

function stopVideo()
{
    if(isPlaying)
    {
        taskWhenStopped = currentTask;
        ipcRenderer.send('stop');

        if(vidType == 2)
        {
            mediaRecorder.stop();
            console.log(5);
            console.log(mediaRecorder.state);
        }
        isPlaying = false;
    }
}

ipcRenderer.on('vidEnded', ()=>
{
    taskWhenStopped = currentTask;
    isPlaying = false;
    if(vidType == 2)
    {
        mediaRecorder.stop();
        console.log(mediaRecorder.state);
    }
});

let mediaRecorder;
let chunks = [];

navigator.mediaDevices.getUserMedia(constraintObj, (err)=> {console.log(err); })
.then(function(mediaStreamObj) 
{
    let video = document.querySelector('video');

    //connect the media stream to the first video element
    
    if ("srcObject" in video) {
        video.srcObject = mediaStreamObj;
        video.muted = true;
    } else {
        //old version
        video.src = window.URL.createObjectURL(mediaStreamObj);
    }
    
    video.onloadedmetadata = function(ev) {
        //show in the video element what is being captured by the webcam
        video.play();
    };

    //add listeners for saving video/audio
    let stop = document.getElementById('btnStop');
    let next = document.getElementById('btnNext');
    let prev = document.getElementById('btnPrev');
    let find = document.getElementById('btnFinder');
    let flip = document.getElementById('btnFlip');
    let fDesc = document.getElementById('btnFlipDesc');
    let back = document.getElementById('btnBack');

    const options = { mimeType: 'video/webm; codecs=vp9' }
    mediaRecorder = new MediaRecorder(mediaStreamObj, options);

    stop.addEventListener('click', (ev)=>{

        stopVideo();
    });

    next.addEventListener('click', (ev) =>
    {
        if(currentTask < vidArr.length - 1)
        {
            stopVideo();
            taskButtonColor(parseInt(currentTask) + 1);
            loadRules(currentTask);
            ipcRenderer.send("load", getTaskSource(currentTask, 0));
        } 
    });

    prev.addEventListener('click', (ev) =>
    {
        if(currentTask > 0)
        {
            stopVideo();
            taskButtonColor(parseInt(currentTask) - 1);
            loadRules(currentTask);
            ipcRenderer.send("load", getTaskSource(currentTask, 0));
        } 
    });

    find.addEventListener('click', (ev) =>
    {
        shell.openPath(mainDir);
    });

    flip.addEventListener('click', (ev)=>
    {
        let currentScale = isFlipped ? -1 : 1;
        isFlipped = !isFlipped;
        video.style.transform = `scale(${currentScale * -1}, 1)`;
    });

    fDesc.addEventListener('click', (ev)=>
    {
        dialog.showMessageBox( 
        {
            title: 'What is the \'Flip\' button?',
            buttons: ['OK'],
            message: 'If the webcam is reversing your image, press \'Flip\' to reorient the video.',
        });
    });

    back.addEventListener('click', (ev)=>
    {
        ipcRenderer.send('toggleVidWindow');
        let currentWin = remote.getCurrentWindow();
        currentWin.loadFile(path.join(__dirname, 'chooseExam.html'));
    });

    mediaRecorder.ondataavailable = handleDataAvailable;
    mediaRecorder.onstop = handleStop;  
    console.log(3);      
})
.catch(function(err) 
{ 
    console.log(err.name, err.message); 
});

function handleDataAvailable(ev)
{
    chunks.push(ev.data);
}

const {dialog} = remote;

async function handleStop(ev)
{
    taskBtns[taskWhenStopped].style.backgroundColor = taskWhenStopped === currentTask ? selectedColor : unselectedColor;

    const blob = new Blob(chunks,
    {
        type: 'video/webm; codecs=vp9'
    });
    const buffer = Buffer.from(await blob.arrayBuffer());

    let i = -1;
    let fileName;
    do
    {
        i++;
        if(i === 0)
            fileName = `vid-${getTaskName(taskWhenStopped)}.mp4`;
        else 
            fileName = `vid-${getTaskName(taskWhenStopped) + i}.mp4`;
    }while(fs.existsSync(mainDir + '\\' + fileName))

    let filePath = mainDir + '\\' + fileName;
    console.log(filePath);

    writeFile(filePath, buffer, () => console.log('Video Saved'));

    if(isFlipped)
    {
        let cmd = `.\\src\\ffmpeg -i ${filePath} -vf "transpose=0,transpose=1" ${mainDir}\\${fileName}.mp4`;
        exec(cmd, (error, stdout, stderr) =>
        {
            if(error)
            {
                console.log(`error: ${error.message}`);
                return;
            }
            if(stderr)
            {
                console.log(`stderr: ${stderr}`);
                return;
            }
            try {
                fs.unlink(filePath, function()
                {
                    console.log(`File deleted: ${filePath}`);
                });
                //file removed
                } catch(err) {
                console.error(`An error ocurred ${err}`);
                }
            console.log(`stdout: ${stdout}`);
        });
    }
    
    chunks = [];
}

/*********************************
getUserMedia returns a Promise
resolve - returns a MediaStream Object
reject returns one of the following errors
AbortError - generic unknown cause
NotAllowedError (SecurityError) - user rejected permissions
NotFoundError - missing media track
NotReadableError - user permissions given but hardware/OS error
OverconstrainedError - constraint video settings preventing
TypeError - audio: false, video: false
*********************************/