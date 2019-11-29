# Lambda - Mobius External Grader

https://console.aws.amazon.com/lambda/home?region=us-east-1#/functions/Mobius_edx_Grader?tab=graph
ARN: arn:aws:lambda:us-east-1:114056409474:function:Mobius_edx_Grader

## Answer file template
for the .mob file to be uploaded to s3, its description should have some extra parameters indicating how the answer files are
to be executed and graded. [see more here.](ANSWER_FILE_STRUCTURE.md)

## Installation

* Clone the project.
* `npm install` to install the required packages.
* If you do not have Typescript installed globally, do so with `npm install -g typescript`. This is required to build the project for uploading to Lambda.

## Code Structure

* **src/core** and **src/libs** folders are the modelling libraries in Mobius Parametric Modeller project.
* **src/model** folder is from the core shared models in Mobius Parametric Modeller project
* **src/grader.ts** is the main file to grade the student submission, with two grading functions: *gradeFile_URL* and *gradeFile*
  * *gradeFile_URL* takes in a json structure of `{"file": file_url}`
  * *gradeFile* takes in a json structure of `{"file": file_string}`

## Building the code and Deploying

Lambda requires the code to be in javascript. So the codes have to be built before deploying on to Lambda.

### Deploying using python script
The python file **upload_to_amazon.py** can be used to upload the project to amazon lambda.

#### Setting up
1. Make a copy of the **__AMAZON_KEY__.template.py** file and change its name to **__AMAZON_KEY__.py**. Fill in the 
file with your **aws_access_key_id** and **aws_secret_access_key** as well as your local mobius project directory (e.g. 
`C:\\Users\\UserName\\Documents\\mobius-parametric-modeller-dev`).
2. in **upload_to_amazon.py**, change *FUNC_NAME* variable to *MAIN_FUNCTION* or *DEV_FUNCTION* to indicate which lambda 
function for the project to be uploaded to.

#### Use the script
The script can be run with python (`python upload_to_amazon.py` or run with vs code)

### Deploying manually
If for any reason the python script does not work, the project can be compiled and uploaded to amazon manually as follow:

#### Update the code
The project relies on a number of code from mobius, namely **src/core** and **src/libs** which are copied from **src/assets/core** and **src/assets/libs** respectively from mobius project.

#### Build the code
In a command prompt in the project folder, simply do `tsc`. A *dist* folder will be created with the built javascript code.

#### Deploy the code
1. Put the content of the **dist** folder into a .zip file. The name of the .zip file does not matter. Make sure that the .zip file structure is as follow (an example zip file can be found in zip_example folder - dist.zip):
    ```
    . dist_zip_file.zip
    └── core
    |   └── ...
    └── libs
    |   └── ...
    └── model
    |   └── ...
    └── grader.js
    ```
2. Go to the lambda function **Configuration** page, **Function code** panel, in the **Code entry type** dropdown menu, select "Upload a .zip file". Upload the .zip file and press **Save** on the top right corner of the page


## External npm packages and deploying node_modules
External packages can be used in lambda. Just install them as per normal: `npm install <<package>>`

For the deployed lambda function to get access to these external packages, the node_modules folder must also be uploaded to lambda panel.
Since the project's node_modules folder is quite large, if we are to upload the node_modules along with the dist folder, AWS will disable us from seeing the source code due to the big size.
The way we're uploading node_modules onto AWS is through Lambda layers. It does not interfere with the main code. Also, we can use the same node_modules layer for multiple lambda functions if necessary. The process of uploading is as follow:
1. In the AWS lambda left side panel, choose layers. We can create a new layer or update an existing layer (create version).
2. upload the node_modules .zip file. the file must be in this specific structure (an example zip file can be found in zip_example folder - nodejs.zip):
    ```
    . node_module_zip_file.zip
    └── nodejs
        └── node_modules
            └── node package1
            |   └── ...
            └── node package2
            |   └── ...
            └── node package3
            |   └── ...
            └── ...
    ```
3. after uploading the file, go to the lambda function. In the **Configuration** page, **Designer** panel, select **Layers**. Add the newly uploaded layer and remove the old one.

More on this can be read here: https://medium.com/@anjanava.biswas/nodejs-runtime-environment-with-aws-lambda-layers-f3914613e20e

## AWS API Gateway
The communication between the EC2 python server and the lambda function is done through API Gateway (which is attached to the lambda function)
A basic tutorial for API Gateway can be found here https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-create-api-as-simple-proxy-for-lambda.html

For our lambda function, the only input required in the http request body is "file", which is a string of the submission file url (edx upload the file to their own database and provide us with a url for the file). This is set in the request body's model "MobiusFile".

