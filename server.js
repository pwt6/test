/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

var http = require('http');
var serverHelper = require('./lib/serverHelper');
var socketio = require('socket.io');
var po = require('./objects/purchaseOrder');

var cache = {};

var server = http.createServer(function (req, res) {
    var filePath = false;

    if(req.url == '/'){
        filePath = 'index.html';
    }else {
        filePath = req.url;
    }
    
    var absPath = './' + filePath;
    serverHelper.serveStatic(res, cache, absPath);
})

var io = socketio.listen(server);

function processFilter(filter) {
    
    var allFilterFunctions = [];
    
    function createExactFilter(field, key) {
        return function(item){
                console.log(field, key);
            return item[field] === filter[key];
        };
    }
    
    for ( var key in filter) {
        
        var field = key.toUpperCase();
        if (filter[key].length) {
            console.log(field);
            allFilterFunctions.push(createExactFilter(field, key));
        }
    }
    console.log(allFilterFunctions);
    return function(item) {
        for (var i = 0, filterCount = allFilterFunctions.length; i<filterCount; i++ ) {
            if (!allFilterFunctions[i](item)) {
                return false;
            }
        }
        return true;
    }
}

io.on('connection', function(socket){    
    
  socket.on('getLines', function(data){
      var reqOrder = [];
      var sums = {CURRENCY_VALUE: 0, FBUY_VALUE: 0};
      var filter = data.filter;
      var toRow = data.toRow;
      var fromRow = data.fromRow;
      
      var filterFn = processFilter(filter);
      
      for(var i=0;i<po.purchaseOrder.rows.length;i++){

          var row = po.purchaseOrder.rows[i].doc;
         
          if(filterFn(row)){
              for (var key in sums) {
                  sums[key] += row[key];
              }
              if (i >= fromRow && i < toRow) {
                  reqOrder.push(row);                  
              } else {
                  reqOrder.push({_stub: true, _id: row._id});
              }
          }
      }
      socket.emit('getLines',{
          rows: reqOrder.length,
          offset: 0,
          lines: reqOrder,
          sums: sums
      });
  });
  
  socket.on('disconnect', function(){console.log('disconnect');});
});

server.listen(3000, function(){
    console.log("Serwer nasłuchuje na porcie 3000");
});
        