//var albumBucketName = 'photos-yqxu';
var bucketRegion = 'us-east-1';
var IdentityPoolId = 'IdentityPoolId';

AWS.config.update({
  region: bucketRegion,
  credentials: new AWS.CognitoIdentityCredentials({
    IdentityPoolId: IdentityPoolId
  })
});


var lambda = new AWS.Lambda({region: bucketRegion, apiVersion: '2015-03-31'});
// create JSON object for parameters for invoking Lambda function
//var pullParams = {
 // FunctionName : 'search-photos',
 // InvocationType : 'RequestResponse',
 // LogType : 'None'
//};
// create variable to hold data returned by the Lambda function
var pullResults;

$(document).ready(function() {
	$("#send").click(() => {
        var name = $('#name').val();
        var email = $('#email').val();
        var phone = $('#phone').val();
        var message = $('#message').val();

        console.log(name);
        var query = {"name": name,
        "email":email,
        "phone":phone,
        "message":message
        }
        console.log(query);
        var test = JSON.stringify(query)
        console.log(test);

        var Params = {
            FunctionName : 'contact',
            //InvocationType : 'RequestResponse',
            //LogType : 'None',
            //InvocationType: 'Event',
            Payload : test,
            //Payload=json.dumps(event)
            //ClientContext : q
          };
                
        //iconsole.log(Params)
        
        lambda.invoke(Params, function(error, data) {
            if (error) {
               prompt(error);
            } else {
                alert('Message sent!')
                console.log(data)
                
                pullResults = JSON.parse(data.Payload);
                console.log(pullResults)
                
                

            }
          });
	});
});