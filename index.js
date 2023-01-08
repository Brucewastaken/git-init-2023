const electron = require('electron');
const fs = require('fs');
const { exec } = require('child_process');
const createCsvParser = require('csv-parser');
const { Readable } = require('stream');
const { arrayBuffer } = require('stream/consumers');
const { app, BrowserWindow, ipcMain } = electron;


var hiddenArray = ["window", "OleMainThreadWndName", "search", "start", "notification", "wacom", "App Usage Monitor"];
var strictSystemArray = ["SystemSettings.exe", "smartscreen.exe", "svchost.exe", "taskhostw.exe", "tabtip.exe", "startmenuexperiencehost.exe", "runtimebroker.exe", "searchapp.exe", "ShellExperienceHost.exe", "dllhost.exe", "TextInputHost.exe", "RtkAudUService64.exe", "WavesSvc64.exe", "ModuleCoreService.exe", "taskhostw.exe", "igfxEM.exe", "electron.exe", "ApplicationFrameHost.exe", "CalculatorApp.exe" ];
var gameArray = ["minecraft","valorant", "riot", "lunarclient", "war thunder", "fortnite", "genshin", "roblox", "gta", "counter-strike", "overwatch"];


// fs.readFile('hiddenArray.json', (error, data) => {
//     if (error) {
//         console.error(error);
//     } else {
//         hiddenArray = JSON.parse(data);
//         console.log(hiddenArray); 
//     }
// });

// fs.readFile('strictSystemArray.json', (error, data) => {
//     if (error) {
//         console.error(error);
//     } else { 
//         strictSystemArray = JSON.parse(data);
//         console.log(strictSystemArray); 
//     }
// });

// fs.readFile('gameArray.json', (error, data) => {
//     if (error) {
//         console.error(error);
//     } else {
//         gameArray = JSON.parse(data);
//         console.log(gameArray); 
//     }
// });

let mainWindow;

app.on('ready', () => {
  mainWindow = new BrowserWindow({
    webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
    },
    width: 800,
    height: 600,
  });

  mainWindow.loadURL(`file://${__dirname}/index.html`);
  mainWindow.maximize();
});

ipcMain.on('check-background-apps', (event) => {
    const parser = createCsvParser({
        separator: ',', 
    });

    exec('tasklist /v /fo csv /fi "status eq running" | findstr /i /v "N/A"', (error, stdout, stderr) => { // tasklist /fo csv /fi "windowtitle ne N/A" /fi "status eq running"
        if (error) {
            console.error(`exec error: ${error}`);
            return;
        }
        
        // Create a readable stream from the CSV output
        const stream = new Readable();
        stream.push(stdout);
        stream.push(null);

        // Pipe the stream into the parser
        event.sender.send('clear-list');
        event.sender.send('current-stats', false);
        stream.pipe(parser).on('data', (data) => {
            // Get the process name and window title
            const name = data['Image Name'];
            const title = data['Window Title'];
            const PID = data["PID"];
            var allowed = true;
            var log = true;

            hiddenArray.forEach(keyword => {
                if (title.toLowerCase().includes(keyword.toLowerCase())) {
                    log = false;
                }
            });

            gameArray.forEach(keyword => {
                if (title.toLowerCase().includes(keyword.toLowerCase())) {
                    hasGame = true;
                    event.sender.send('current-stats', true);
                    allowed = false;
                }
            })

            strictSystemArray.forEach(keyword => {
                if (name.toLowerCase() == keyword.toLowerCase()) {
                    log = false;
                }
            });

            if (log) {
                event.sender.send('app-list', [name, title, PID, allowed]);
            }
            
        });
        
        console.log("scanned");

    });
});

ipcMain.on('restart', (event) => {
    mainWindow.focus();
    mainWindow.show();
});





// ipcMain.on('check-background-apps', (event) => {
//     const parser = createCsvParser({
//         separator: ',', 
//     });

//     exec('tasklist /v /fo csv /fi "status eq running" | findstr /i /v "N/A"', (error, stdout, stderr) => { // tasklist /fo csv /fi "windowtitle ne N/A" /fi "status eq running"
//         if (error) {
//             console.error(`exec error: ${error}`);
//             return;
//         }
        
//         // Create a readable stream from the CSV output
//         const stream = new Readable();
//         stream.push(stdout);
//         stream.push(null);

//         // Pipe the stream into the parser
//         event.sender.send('clear-list');
//         event.sender.send('current-stats', false);
//         stream.pipe(parser).on('data', (data) => {
//             // Get the process name and window title
//             const name = data['Image Name'];
//             const title = data['Window Title'];
//             const PID = data["PID"];
//             var allowed = true;
//             var log = true;

//             hiddenArray.forEach(keyword => {
//                 if (title.toLowerCase().includes(keyword.toLowerCase())) {
//                     log = false;
//                 }
//             });

//             gameArray.forEach(keyword => {
//                 if (title.toLowerCase().includes(keyword.toLowerCase())) {
//                     hasGame = true;
//                     event.sender.send('current-stats', true);
//                     allowed = false;
//                 }
//             })

//             strictSystemArray.forEach(keyword => {
//                 if (name.toLowerCase() == keyword.toLowerCase()) {
//                     log = false;
//                 }
//             });

//             if (log) {
//                 event.sender.send('app-list', [name, title, PID, allowed]);
//             }
            
//         });
        
//         console.log("scanned");

//     });
// });




// exec('tasklist /fo csv /fi "status eq running"', (error, stdout, stderr) => { // tasklist /fo csv /fi "windowtitle ne N/A" /fi "status eq running"
//     if (error) {
//         console.error(`exec error: ${error}`);
//         return;
//     }
    
//     // Create a readable stream from the CSV output
//     const stream = new Readable();
//     stream.push(stdout);
//     stream.push(null);

//     // Pipe the stream into the parser
//     event.sender.send('clear-list');
//     event.sender.send('current-stats', false);

//     var searchArray = []
//     stream.pipe(parser).on('data', (data) => {
//         // Get the process name and window title
//         const name = data['Image Name'];
//         const PID = data["PID"];
//         strictSystemArray.forEach(keyword => {
//             if (name.toLowerCase() != keyword.toLowerCase()) {
//                 searchArray.push(PID);
//             }
//         });
        
//     });

//     stream.pipe(parser).on('finish', () => {
//         console.log(1);
//         searchArray.forEach((value) => {
//             console.log(2)
//             exec(`tasklist /fo csv /fi "PID eq ${value}"`, (error, stdout, stderr) => {
//                 if (error) {
//                     console.error(`exec error: ${error}`);
//                     return;
//                 }

//                 const stream1 = new Readable();
//                 stream1.push(stdout);
//                 stream1.push(null);

//                 stream1.pipe(parser).on('data', (data) => { 
//                     console.log(3)
//                     const title = data['Window Title'];
//                     if (title != 'N/A') {
//                         hiddenArray.forEach(keyword => {
//                             if (title.toLowerCase().includes(keyword.toLowerCase())) {
//                                 log = false;
//                             }
//                         });

//                         gameArray.forEach(keyword => {
//                             if (title.toLowerCase().includes(keyword.toLowerCase())) {
//                                 hasGame = true;
//                                 event.sender.send('current-stats', true);
//                                 allowed = false;
//                             }
//                         })
//                         if (log) {
//                             event.sender.send('app-list', [name, title, PID, allowed]);
//                         }
//                     }
//                 });
//             });
//         })
//       });
    
//     console.log("scanned");

// });




// ipcMain.on('check-background-apps', (event) => {
//     const parser = createCsvParser({
//         separator: ',', 
//     });

//     exec('tasklist /fo csv /fi "status eq running"', (error, stdout, stderr) => {
//         if (error) {
//             console.error(`exec error: ${error}`);
//             return;
//         }

//         const stream = new Readable();
//         stream.push(stdout);
//         stream.push(null);

//         var allPID = []
//         stream.pipe(parser).on('data', (data) => {
//             allPID.push(data["PID"]);
            
//         });

//         stream.pipe(parser).on('finish', () => {
//             if (allPID != processesCache) {
//                 var difference = allPID.filter((item) => array1.indexOf(item) === -1);
//             }
//         });

//     });

//     exec('tasklist /v /fo csv /fi "status eq running" | findstr /i /v "N/A"', (error, stdout, stderr) => { // tasklist /fo csv /fi "windowtitle ne N/A" /fi "status eq running"
//         if (error) {
//             console.error(`exec error: ${error}`);
//             return;
//         }
        
//         // Create a readable stream from the CSV output
//         const stream = new Readable();
//         stream.push(stdout);
//         stream.push(null);

//         // Pipe the stream into the parser
//         event.sender.send('clear-list');
//         event.sender.send('current-stats', false);
//         stream.pipe(parser).on('data', (data) => {
//             // Get the process name and window title
//             const name = data['Image Name'];
//             const title = data['Window Title'];
//             const PID = data["PID"];
//             var allowed = true;
//             var log = true;

//             hiddenArray.forEach(keyword => {
//                 if (title.toLowerCase().includes(keyword.toLowerCase())) {
//                     log = false;
//                 }
//             });

//             gameArray.forEach(keyword => {
//                 if (title.toLowerCase().includes(keyword.toLowerCase())) {
//                     hasGame = true;
//                     event.sender.send('current-stats', true);
//                     allowed = false;
//                 }
//             })

//             strictSystemArray.forEach(keyword => {
//                 if (name.toLowerCase() == keyword.toLowerCase()) {
//                     log = false;
//                 }
//             });

//             if (log) {
//                 event.sender.send('app-list', [name, title, PID, allowed]);
//             }
            
//         });
        
//         console.log("scanned");

//     });
// });