
const grader = require('./dist/grader');
const handler_function = grader.runGenEvalController;

test = {
    "Records": [
        {
            "eventID": "6a2090321f55b6a683d4d50c009eb542",
            "eventName": "INSERT",
            "eventVersion": "1.1",
            "eventSource": "aws:dynamodb",
            "awsRegion": "us-east-1",
            "dynamodb": {
                "ApproximateCreationDateTime": 1589963162,
                "Keys": {
                    "id": {
                        "S": "x13adfda"
                    }
                },
                "NewImage": {
                    "id": {
                        "S": "x13adfda"
                    },
                    "genUrl": {
                        "S": "https://raw.githubusercontent.com/design-automation/mobius-parametric-modeller-dev/master/src/assets/testing/test_js_files/eaGen.js"
                    },
                    "evalUrl": {
                        "S": "https://raw.githubusercontent.com/design-automation/mobius-parametric-modeller-dev/master/src/assets/testing/test_js_files/eaEval1.js"
                    },
                    "maxDesigns": {
                        "N": "80"
                    }

                },
                "SequenceNumber": "123427500000000017920016270",
                "SizeBytes": 137,
                "StreamViewType": "NEW_AND_OLD_IMAGES"
            },
            "eventSourceARN": "arn:aws:dynamodb:us-east-1:114056409474:table/MobiusParamGenTable/stream/2020-04-24T09:32:45.619"
        }
    ]
}


handler_function(test, null, null).then (r => {
    console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!')
    console.log(r)

})
