'use strict';


// Load the required packages
var AWS = require('aws-sdk');
var ElasticSearch = require('elasticsearch');

// The region you deploy on
AWS.config.update({
	region: "us-east-1",
	// accessKeyId default can be used while using the downloadable version of DynamoDB. 
	// For security reasons, do not store AWS Credentials in your files. Use Amazon Cognito instead.
	accessKeyId: "",
	// secretAccessKey default can be used while using the downloadable version of DynamoDB. 
	// For security reasons, do not store AWS Credentials in your files. Use Amazon Cognito instead.
	secretAccessKey: ""
	});

// Create a SQS service object
var sqs = new AWS.SQS({apiVersion: '2012-11-05'});
var queueURL = "https://sqs.us-east-1.amazonaws.com/553196132859/queue";
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
//var sns = new AWS.SNS();

// Initialize elasticsearch object
var elasticsearch = new ElasticSearch.Client({
    host: 'https://search-gedan-oxqxsz3s6e7vjqnyhmzbdldx4i.us-east-1.es.amazonaws.com',
    log: 'trace'
});



// Fields to form response
var languages, mood, condition, style, email;



// The handler that will be called
exports.handler = (event, context, callback) => {
    try {
        sqs.receiveMessage(paramsSQS, function(err, data) {
            if (err) {
                console.log("Receive Error", err);
            } else if (data.Messages) {     // message received
                console.log('here');
                console.log(data.Messages);
                // Iterate through the messages we fetched, currently we only have one message
                for (const message of data.Messages){
                    const messageAttributes = message.MessageAttributes;
                    languages = messageAttributes.Languages.StringValue;
                    mood = messageAttributes.Mood.StringValue;
                    condition = messageAttributes.Condition.StringValue;
                    style = messageAttributes.Style.StringValue;
                    email = messageAttributes.Email.StringValue;

                    console.log('message', message)
                    // Search in elasticsearch
                    elasticsearch.search({
                        index: 'playlist',
                        type: 'list',
                        body: {
                            query: {
                                match: {
                                    name: languages+" "+mood+" "+condition+" "+style
                                }
                            }
                        }
                    }).then(function (resp) {

                        var results = resp.hits.hits;
                        var ids = [];
                        // Retrieve the id of three recommended restaurants
                        // We will use them to query DynamoDB
                        ids[0] = results[0]._source.id;
                        const recommendation = `Hello! Here are my music list suggestions` +
                        ` for ${languages} ${style} songs, for ${mood} ${condition}:\n link: https://y.qq.com/n/yqq/playlist/${ids[0]}.html.\n` +
                        `Thanks for using our service.`;
                
                        console.log(recommendation);
                
                        var params = {
                            Destination: { /* required */
                              //CcAddresses: [
                               // 'EMAIL_ADDRESS',
                                /* more items */
                              //],
                              ToAddresses: [
                                email
                              ]
                            },
                            Message: { /* required */
                              Body: { /* required */
                                
                                Text: {
                                 Charset: "UTF-8",
                                 Data: recommendation
                                }
                               },
                               Subject: {
                                Charset: 'UTF-8',
                                Data: 'Music List Recommendation From FocusMusic'
                               }
                              },
                            Source: 'nefer1156@gmail.com', /* required */
                            ReplyToAddresses: [
                                'nefer1156@gmail.com',
                              /* more items */
                            ],
                          };    
                        var sendPromise = new AWS.SES({apiVersion: '2010-12-01'}).sendEmail(params).promise();
                        // Send the message to user's cell phone via SNS
                        sendPromise.then(
                            function(data) {
                              console.log(data.MessageId);
                            }).catch(
                              function(err) {
                              console.error(err, err.stack);
                            });



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
