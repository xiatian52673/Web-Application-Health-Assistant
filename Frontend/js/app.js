var albumBucketName = 'photos-yqxu';
var bucketRegion = 'us-east-1';
var IdentityPoolId = 'us-east-1:52535369-b56b-4012-8184-0f36f4e418ff';

AWS.config.update({
  region: bucketRegion,
  credentials: new AWS.CognitoIdentityCredentials({
    IdentityPoolId: IdentityPoolId
  })
});

var s3 = new AWS.S3({
  apiVersion: '2006-03-01',
  params: {Bucket: albumBucketName}
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
    $('#upload_button').on("click",addPhoto);
    
    function addPhoto(albumName) {
        console.log('here');
        var files = document.getElementById('file_input').files;
        if (!files.length) {
        return alert('Please choose a file to upload first.');
        }
        var file = $('#file_input').prop('files')[0];
        var fileName = file.name;
        // var albumPhotosKey = encodeURIComponent(albumName) + '//';
        console.log(file);
        var photoKey = fileName;
        s3.upload({
        Key: photoKey,
        Body: file,
        ACL: 'public-read'
        }, function(err, data) {
        if (err) {
            return alert('There was an error uploading your photo: ', err.message);
        }
        alert('Successfully uploaded photo.');
        // viewAlbum(albumName);
        });
    }
	$("#search_button").click(() => {
        var qq = $('#search_query').val();
        //console.log(qq);
        var query = {"q": qq}
        //console.log(query);
        var test = JSON.stringify(query)
        //console.log(test);

        var Params = {
            FunctionName : 'search-photos',
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
                console.log(data)
                
                pullResults = JSON.parse(data.Payload);
                console.log(pullResults)
                console.log(pullResults.body)
                $("ul").empty(); 
                console.log(pullResults.body.length);
                var i;
                for (i = 0; i < pullResults.body.length; i++) { 
                    var img = "<li><img src=\"" + pullResults.body[i] + "\"></li>";
                    $("ul").append(img);
                  }
                
                  
                
            }
          });
	});
});