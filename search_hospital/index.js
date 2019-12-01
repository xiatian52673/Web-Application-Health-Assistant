'use strict';


// Load the required packages
var AWS = require('aws-sdk');
var ElasticSearch = require('elasticsearch');

// The region you deploy on
AWS.config.update({
    region: "us-east-1"
});

// Create a SQS service object
var sqs = new AWS.SQS({apiVersion: '2012-11-05'});
var queueURL = "queueURL";
var paramsSQS = {
    AttributeNames: [
        "SentTimestamp"
    ],
    MaxNumberOfMessages: 1,
    MessageAttributeNames: [
        "All"
    ],
    QueueUrl: queueURL,
    VisibilityTimeout: 0,
    WaitTimeSeconds: 0
};

// Create a SNS service object
var sns = new AWS.SNS();

// Create a DynamoDB service object
var docClient = new AWS.DynamoDB.DocumentClient();

// Initialize elasticsearch object
var elasticsearch = new ElasticSearch.Client({
    host: 'host domain',
    log: 'trace'
});

// Parameter for querying DynamoDB
var params;

// Fields to form response
var zip_code,phone;
var ret_name = [];
var ret_addr = [];
var ret_contact = [];

// Function that form response message and send it back via SNS
var form_response = function(){

    console.log(ret_name);
    console.log(ret_addr);
    console.log(ret_contact);

    // Construct the SNS message
    const recommendation = `Sorry for waiting! Here are some hospitals I found nearby, you can go to have a more detailed diagnosis:\n1. ${ret_name[0]}, located at ${ret_addr[0]}, the contact number is ${ret_contact[0]}.\n` +
        `2. ${ret_name[1]}, located at ${ret_addr[1]}, the contact number is ${ret_contact[1]}.\n3. ${ret_name[2]}, located at ${ret_addr[2]}, the contact number is ${ret_contact[2]}.\nThanks for using our service.`;

    console.log(recommendation);

    var paramsSNS = {
        Message: recommendation,
        MessageStructure: 'string',
        PhoneNumber: `+1${phone}`
    };

    // Send the message to user's cell phone via SNS
    sns.publish(paramsSNS, function(err, data){
        if (err){
            console.log(err, err.stack);
        }
        else
            console.log(data);
    });
};


// The handler that will be called
exports.handler = (event, context, callback) => {
    try {
        sqs.receiveMessage(paramsSQS, function(err, data) {
            if (err) {
                console.log("Receive Error", err);
            } else if (data.Messages) {     // message received

                // Iterate through the messages we fetched, currently we only have one message
                for (const message of data.Messages){

                    const messageAttributes = message.MessageAttributes;
                    zip_code = messageAttributes.Location.StringValue;
                    zip_code = parseInt(zip_code);
                    phone = messageAttributes.Phone.StringValue;

                    // Search in elasticsearch
                    elasticsearch.search({
                        index: 'predictions',
                        type: 'Prediction',
                        body: {
                            query: {
                                bool: {
                                    should:[
                                    {match: { Zip_Code: String(zip_code+5) }},
                                    {match: { Zip_Code: String(zip_code+4) }},
                                    {match: { Zip_Code: String(zip_code+3) }},
                                    {match: { Zip_Code: String(zip_code+2) }},
                                    {match: { Zip_Code: String(zip_code+1) }},
                                    {match: { Zip_Code: String(zip_code-5) }},
                                    {match: { Zip_Code: String(zip_code-4) }},
                                    {match: { Zip_Code: String(zip_code-3) }},
                                    {match: { Zip_Code: String(zip_code-2) }},
                                    {match: { Zip_Code: String(zip_code-1) }},
                                    {match: { Zip_Code: String(zip_code) }}
                                    ]
                                }
                            }
                        }
                    }).then(function (resp) {

                        var results = resp.hits.hits;
                        var ids = [];
                        // Retrieve the id of three recommended restaurants
                        // We will use them to query DynamoDB
                            ids[0] = results[0]._source.id;
                            ids[1] = results[1]._source.id;
                            ids[2] = results[2]._source.id;

                        for (var counter = 0; counter < ids.length; counter++){

                            params = {
                                TableName : 'yelp-hospitals',
                                ProjectionExpression:"id, #na, #lo, #con",
                                ExpressionAttributeNames:{
                                    "#na": "name",
                                    "#lo": "location",
                                    "#con":"display_phone"
                                },
                                KeyConditionExpression: "id = :v1",
                                ExpressionAttributeValues: {
                                    ":v1": ids[counter]
                                }
                            };

                            docClient.query(params, function(err, data) {
                                if (err) {
                                    console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
                                } else {
                                    console.log("Query succeeded.");
                                    if (data.Items == null)
                                        console.log("Empty response");
                                    else{
                                        //console.log(data);
                                        data.Items.forEach(function(item) {   // will just return one item
                                            ret_name[ret_name.length] = item.name;
                                            ret_addr[ret_addr.length] = item.location;
                                            ret_contact[ret_contact.length] = item.display_phone;
                                            if (ret_name.length == 3)
                                                form_response();
                                        });
                                    }
                                }
                            });
                        }
                    }, function (err) {
                        console.trace(err.message);
                    });


                    // Delete the message in SQS
                    var deleteParams = {
                        QueueUrl: queueURL,
                        ReceiptHandle: message.ReceiptHandle
                    };
                    sqs.deleteMessage(deleteParams, function(err, data) {
                        if (err) {
                            console.log("Delete Error", err);
                        } else {
                            console.log("Message Deleted", data);
                        }
                    });
                }

            }
        });
    } catch (err) {
        callback(err);
    }
};