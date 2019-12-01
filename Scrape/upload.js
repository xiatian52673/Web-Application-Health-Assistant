var AWS = require("aws-sdk");
var fs = require('fs');

AWS.config.update({
    region: "us-east-1",
    endpoint: "https://dynamodb.us-east-1.amazonaws.com"
});

var docClient = new AWS.DynamoDB.DocumentClient();

// A helper function that concatenates the addresses
function getAddress(result){
    var addr = result.location.address1;
    if (result.location.address2 === null || result.location.address2 === "")
        return addr;
    addr = addr + result.location.address2;
    if (result.location.address3 === null || result.location.address3 === "")
        return addr;
    return addr + result.location.address3;
}

console.log("Importing hospitals info into DynamoDB. Please wait.");

// Read data into program from local file
var allRestaurants = JSON.parse(fs.readFileSync('hospitals.json', 'utf8'));

// Iterate through each JSON object, upload to DynamoDB
allRestaurants.forEach(function(hospital) {

    var params = {
        TableName: "yelp-hospitals",
        Item: {
            // Extract two primary keys
            "id":  hospital.id.replace(/-|\//g, "_"),
            "name": hospital.name.replace(/-|\//g, "_"),
            "insertedAtTimestamp": new Date().toISOString()
        }
    };

    // The remaining keys are different form restaurant to restaurant
    // Therefore, we examine the attributes one by one
    // Be careful: An attributeValue may not contain an empty string
    if (hospital.alias && hospital.alias != "")
        params.Item.alias = hospital.alias;

    if (hospital.image_url && hospital.image_url != "")
        params.Item.image_url = hospital.image_url;

    params.Item.is_closed = hospital.is_closed;

    if (hospital.url && hospital.url != "")
        params.Item.url = hospital.url;

    if (hospital.review_count)
        params.Item.review_count = hospital.review_count;

    if (hospital.categories && hospital.categories.length != 0) {
        params.Item.categories = [];
        params.Item.categories = params.Item.categories.concat(hospital.categories);
    }

    if (hospital.rating)
        params.Item.rating = hospital.rating;

    if (hospital.coordinates)
        params.Item.coordinates = hospital.coordinates;

    if (hospital.location) {
        params.Item.location = getAddress(hospital);
        params.Item.zipcode = hospital.location.zip_code;
    }
    if (hospital.phone && hospital.phone != "")
        params.Item.phone = hospital.phone;

    if (hospital.display_phone && hospital.display_phone != "")
        params.Item.display_phone = hospital.display_phone;

    if (hospital.distance)
        params.Item.distance = hospital.distance;

    if (hospital.price && hospital.price != "")
        params.Item.price = hospital.price;

    if (hospital.transactions && hospital.transactions.length != 0) {
        params.Item.transactions = [];
        params.Item.transactions = params.Item.transactions.concat(hospital.transactions);
    }


    docClient.put(params, function(err, data) {
        if (err) {
            console.error("Unable to add hospital", hospital.name, ". Error JSON:", JSON.stringify(err, null, 2));
        } else {
            console.log("PutItem succeeded:", hospital.name);
        }
    });
});