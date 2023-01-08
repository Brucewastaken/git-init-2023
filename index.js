const electron = require('electron');
const { exec } = require('child_process');
const createCsvParser = require('csv-parser');
const { Readable } = require('stream');
const { app, BrowserWindow, ipcMain, getFocusedWindow } = electron;

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

ipcMain.on('request-app-list', (event) => {
    const parser = createCsvParser({
        separator: ',',  // Specify the field separator
    });

    exec('tasklist /v /fo csv /fi "status eq running" | findstr /i /v "N/A"', (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            return;
        }
        
        // Create a readable stream from the CSV output
        const stream = new Readable();
        stream.push(stdout);
        stream.push(null);
        
        // Pipe the stream into the parser
        stream.pipe(parser).on('data', (data) => {
            // Get the process name and window title
            const name = data['Image Name'];
            const title = data['Window Title'];
            const PID = data["PID"];
    
            console.log(name, title, PID);
            event.sender.send('app-list', name, title, PID);
        });
    });
});

ipcMain.on('request-app-uptime', (event, appId) => {
    getProcessUptime(appId, (uptime) => {
        console.log(uptime);
        event.sender.send('app-uptime', uptime, appId);
      });
      console.log(getFocusedWindow());
});

  
function getProcessUptime(pid, callback) {
    exec(`wmic path Win32_PerfFormattedData_PerfProc_Process where IDProcess=${pid} get ElapsedTime`, (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            return;
        }
  
        const lines = stdout.split('\n');
        const uptime = lines[1];
        callback(uptime);
    });
}

