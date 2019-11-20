'use strict';

/**
 * This Lambda function is invoked during fulfillment period.
 *
 */

// Load the SDK for JavaScript
var AWS = require('aws-sdk');

// Set the region
AWS.config.update({region: 'us-east-1'});

// create an SQS service object
var sqs = new AWS.SQS({apiVersion: '2012-11-05'});

// Construct the response to Lex
function close(sessionAttributes, fulfillmentState, message) {
    return {
        sessionAttributes,
        dialogAction: {
            type: 'Close',
            fulfillmentState,
            message,
        },
    };
}


// --------------- Functions that control the bot's behavior -----------------------

/**
 * Performs fulfillment.
 */
function recommendalbum(intentRequest, callback) {

    const languages = intentRequest.currentIntent.slots.languages;
    const mood = intentRequest.currentIntent.slots.mood;
    const condition = intentRequest.currentIntent.slots.condition;
    const style = intentRequest.currentIntent.slots.style;
    const email = intentRequest.currentIntent.slots.email;
    
    var params = {
        DelaySeconds: 10,
        MessageAttributes: {
            "Languages": {
                DataType: "String",
                StringValue: languages
            },
            "Mood": {
                DataType: "String",
                StringValue: mood
            },
            "Condition":{
                DataType: "String",
                StringValue: condition
            },
            "Style":{
                DataType: "String",
                StringValue: style
            },
            "Email":{
                DataType: "String",
                StringValue: email
            }
        },
        MessageBody: "New Album",
    QueueUrl: "https://sqs.us-east-1.amazonaws.com/553196132859/queue"
    };
    
    console.log(params)

    // Send the message to SQS
    sqs.sendMessage(params, function(err, data){
        if (err){
            // Send confirmation message to the user
            callback(close(intentRequest.sessionAttributes, 'Fulfilled',
                { contentType: 'PlainText', content: 'Sorry, something is wrong. ' +
                    'Have a good day.'}));
            console.log("Error", err);
        }else{
            // Send confirmation message to the user
            callback(close(intentRequest.sessionAttributes, 'Fulfilled',
                { contentType: 'PlainText', content: 'Thanks, you are all set.' +
                'Please expect my recommendations shortly! Have a good day.'}));
            console.log(data)
            console.log("Success", data.MessageId);
            console.log("params",params)
        }
    });
}

function ThankYou(intentRequest, callback) {
    callback(close(intentRequest.sessionAttributes, 'Fulfilled',
        { contentType: 'PlainText', content: 'You’re welcome'}));
};



// --------------- Intents -----------------------

/**
 * Called when the user specifies an intent for this skill.
 */
function dispatch(intentRequest, callback) {
    console.log(`dispatch userId=${intentRequest.userId}, intentName=${intentRequest.currentIntent.name}`);

    const intentName = intentRequest.currentIntent.name;

    // Dispatch to intent handlers, just deal with Dining Suggestions Intent
    if (intentName === 'chat') {
        return recommendalbum(intentRequest, callback);
    }else if(intentName === 'thankyou') {
        return ThankYou(intentRequest, callback);
    }

    throw new Error(`Intent with name ${intentName} not supported`);
}


// --------------- Main handler -----------------------

exports.handler = (event, context, callback) => {
    try {
        // By default, treat the user request as coming from the America/New_York time zone.
        process.env.TZ = 'America/New_York';
        console.log(`event.bot.name=${event.bot.name}`);

        dispatch(event, (response) => callback(null, response));
    } catch (err) {
        callback(err);
    }
};