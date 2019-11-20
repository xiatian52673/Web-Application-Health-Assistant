exports.handler = (event, context, callback) =>  {
    console.log('value1 =', event.name);
    console.log('value2 =', event.email);
    console.log('value3 =', event.phone);
    console.log('value4 =', event.message);
    
    const message = `Here's the message from ${event.name},` +
    ` email: ${event.email}, phone: ${event.phone}.\nMessgae content: ${event.message}`;
    
    var AWS = require('aws-sdk');
    AWS.config.region = 'us-east-1';
    var sns = new AWS.SNS();
    
    var params = {
      Message: message,
      MessageStructure: 'string',
      PhoneNumber: '+19174981570'
    };
    
    sns.publish(params, function(err, data) {
      if (err) console.log(err, err.stack); // an error occurred
      else     console.log(data);           // successful response
    });
}