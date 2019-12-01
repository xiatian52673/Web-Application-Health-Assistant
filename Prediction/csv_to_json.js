var csv = require("csvtojson");
var fs = require('fs');

var stream = fs.createWriteStream("toES.json", {flags:'a'});

// Convert a csv file with csvtojson
csv()
    .fromFile('FILE_1.csv')
    .on("end_parsed",function(jsonArrayObj){ //when parse finished, result will be emitted here.
        stream.write(JSON.stringify(jsonArrayObj, null, 2));
    })