/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

var fs = require('fs');
var path = require('path');
var mime = require('mime');

function send404(res) {
    res.writeHead(404, {'Content-type':'text/plain;charset=UTF-8'});
    res.write('Błąd 404: plik nie został znaleziony');
    res.end();
}

function sendFile(res, filePath, fileContents) {
    res.writeHead(200, {'content-type':mime.lookup(path.basename(filePath))});
    res.end(fileContents);
}

function serveStatic(res, cache, absPath){
    if(cache[absPath]){
        sendFile(res, absPath, cache[absPath]);
    }else{
        fs.exists(absPath, function(exists){
            if(exists){
                fs.readFile(absPath, function(err, data){
                    if(err){
                        send404(res);
                    }else{
                        cache[absPath] = data;
                        sendFile(res, absPath, data);
                    }
                });
            }else{
                send404(res);
            }
        });
    }
}

// Functions which will be available to external callers
exports.serveStatic = serveStatic;
