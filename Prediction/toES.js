/**
 * This .js file loads the predicted restaurants data and convert it to a file
 * that is in the form of a es indexing request.
 *
 * This output file is named es_request.json.
 *
 * To upload es_request.json to elastic search, use the following command:
 *  curl -XPOST your_endpoint/_bulk --data-binary @es_request.json -H 'Content-Type: application/json'
 *
 */

var fs = require('fs');
var stream = fs.createWriteStream("es_request.json", {flags:'a'});

// Read data into program from local file
var allHospitals = JSON.parse(fs.readFileSync('toES.json', 'utf8'));

// Iterate through each JSON object
allHospitals.forEach(function(hospital) {
    var message = '{ "index" : { "_index": "predictions", "_type" : "Prediction" } }' + '\n';
    message += '{"id": "' + hospital.HospitalID + '",' + '"Zip_Code": "' +
    hospital.Zip_Code + '",' +'"Contact": "' +
    hospital.Contact + '",'+ '"score": ' + hospital.Rating + '}';

    stream.write(message + "\n");
});