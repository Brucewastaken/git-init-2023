const electron = require('electron');
const fs = require('fs');
const { exec } = require('child_process');
const createCsvParser = require('csv-parser');
const { Readable } = require('stream');
const { arrayBuffer } = require('stream/consumers');
const { app, BrowserWindow, ipcMain } = electron;


var hiddenArray;
var strictSystemArray;
var gameArray;


fs.readFile('hiddenArray.json', (error, data) => {
    if (error) {
        console.error(error);
    } else {
        systemArray = JSON.parse(data);
        console.log(hiddenArray); 
    }
});

fs.readFile('strictSystemArray.json', (error, data) => {
    if (error) {
        console.error(error);
    } else {
        strictSystemArray = JSON.parse(data);
        console.log(strictSystemArray); 
    }
});

fs.readFile('gameArray.json', (error, data) => {
    if (error) {
        console.error(error);
    } else {
        gameArray = JSON.parse(data);
        console.log(gameArray); 
    }
});

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
});

ipcMain.on('check-background-apps', (event, interval, timeCounter, maxTime) => {
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

        var hasGame = false;
        
        // Pipe the stream into the parser
        event.sender.send('clear-list');
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
        event.sender.send('current-stats', timeCounter);
        if (hasGame) {
            timeCounter = timeCounter + interval;
            if (timeCounter > maxTime) {
                event.sender.send('time-out');
                mainWindow.focus();
                mainWindow.show();
            }
        }
        console.log("scanned");

    });
});

