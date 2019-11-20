import json
import boto3
from botocore.vendored import requests

def lambda_handler(event, context):
    q = event['q']
    
    client = boto3.client('lex-runtime')
    lex_response = client.post_text(
        botAlias='Prod',
        botName='MusicSearch',
        inputText=q,
        userId='search',
    )
    print("2:",json.dumps(lex_response, indent=2))

    # keywords = event['message'].split(" ")
    keywords = []
    keyWordOne = lex_response["slots"]["AlbumName"]
    keyWordTwo = lex_response["slots"]["SingerName"]
    if keyWordOne is not None:
        keywords.append(keyWordOne)
    if keyWordTwo is not None:
        keywords.append(keyWordTwo)
    results = []
    print("keywords:",keywords)

    for keyword in keywords:
        endpoint = "https://search-musicsearch1-2ulyszshyd4gyhnorxenyxzj44.us-east-1.es.amazonaws.com"
        search_url = endpoint + "/albums/_search?q=" + keyword
        response = requests.get(search_url)
        response = response.json()
        print(json.dumps(response, indent=2))
        for hit in response["hits"]["hits"]:
            _source = hit["_source"]
            id = _source["id"]
            name = _source["name"]
            singer = _source["singer"]
            result = {"url": "https://s3.amazonaws.com/coverstorage/" +id+".jpg", "id":id }
            results.append(result)
    #return(keywords)
    # Search the keywords in ElasticSearch
    # results = search(keywords)
    print("result:",results)
    #return {
    #    'statusCode': 200,
    #    'body': json.dumps({"results": results})
    #}
    
    length = len(results)
    print("len:",length)
    url = []
    for i in range(length):
        url.append(results[i]["url"])
        url.append(results[i]["id"])
    
    print("url:",url)
    return {
        'statusCode': 200,
        'body': url
        }
