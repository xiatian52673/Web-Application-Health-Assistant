from __future__ import print_function
import json
import boto3
import logging
import decimal
from boto3.dynamodb.conditions import Key, Attr
from botocore.vendored import requests

def lambda_handler(event, context):
    #logger = logging.getLogger()
    #logger.setLevel(logging.INFO)
    # Rekognition resource
    rekognition = boto3.client('rekognition')
    
    # Get fileName and bucket from event
    #logger.info('got event{}'.format(event))
    fileName=event["key"]
    #print(fileName)
    bucket=event["bucket"]
    #print(bucket)
    # use rekognition detect labels
    response = rekognition.detect_labels(Image={'S3Object':{'Bucket':bucket,'Name':fileName}}, MaxLabels=10, MinConfidence=70)
    # print(response)
    # construct the index to store to elastic search
    print("Response:",response)
    labels = []
    for label in response['Labels']:
        # print (label['Name'] + ' : ' + str(label['Confidence']))
        labels.append(label['Name'])
    print("labels:",labels)

    results=[]
    for label in labels:
        endpoint = "https://search-musicsearch-vwozs5j2s4mvd6mvhtexv6dcvm.us-east-1.es.amazonaws.com"
        search_url = endpoint + "/covers/_search?q=" + label
        response = requests.get(search_url)
        response = response.json()
        print(json.dumps(response, indent=2))
        for hit in response["hits"]["hits"]:
            _source = hit["_source"]
            objectKey = _source["id"]
            name = _source["name"]
            bucket = _source["bucket"]
            labels = _source["labels"]
            result = {"url": "https://s3.amazonaws.com/" + bucket + "/" + name, "id":objectKey, "labels": labels}
            results.append(result)
    #return(keywords)
    # Search the keywords in ElasticSearch
    # results = search(keywords)
    #lenn = len(results)
    #print("len:",lenn)
    id=[]
    for i in range(10):
        print("result:",results[i]["url"])
        id.append(results[i]["url"])
        id.append(results[i]["id"])
    print("url:",id)    
    
    dynamodb = boto3.resource('dynamodb', region_name='us-east-1', endpoint_url="https://dynamodb.us-east-1.amazonaws.com")

    table = dynamodb.Table('music')

    print("Album searched")

    for i in range(len(id)):
        response = table.query(KeyConditionExpression=Key('id').eq(id[i]))
        for j in response['Items']:
              print(j['name'], ":", j['artist'])
              print("link:",j['url'])

    return {
        'statusCode': 200,
        'body': id
    }