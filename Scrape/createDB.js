/**
 * This .js file creates a new table in DynamoDB.
 *
 */

/* Create a table in DynamoDB */
 var AWS = require("aws-sdk");

 AWS.config.update({
    region: "us-east-1",
    endpoint: "https://dynamodb.us-east-1.amazonaws.com"
});

 var dynamodb = new AWS.DynamoDB();

 var params = {
    TableName : "yelp-hospitals",   // Indicate table name
    KeySchema: [                      // Indicate primary keys here
        /* Each restaurant in the query result of Yelp has a unique id */
        { AttributeName: "id", KeyType: "HASH"},      // Partition key
        { AttributeName: "name", KeyType: "RANGE" }   // Sort key
    ],
    AttributeDefinitions: [ // Indicate the attributes within the table
        { AttributeName: "id", AttributeType: "S" },
        { AttributeName: "name", AttributeType: "S" }
    ],
    ProvisionedThroughput: {
        ReadCapacityUnits: 50,
        WriteCapacityUnits: 50
    }
};

 /* Call .createTable() to create a new Table in DynamoDB */
 dynamodb.createTable(params, function(err, data) {
    if (err) {
        console.error("Unable to create table. Error JSON:", JSON.stringify(err, null, 2));
    } else {
        console.log("Created table. Table description JSON:", JSON.stringify(data, null, 2));
    }
});