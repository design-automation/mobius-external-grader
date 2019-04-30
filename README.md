# Lambda - Mobius External Grader

https://console.aws.amazon.com/lambda/home?region=us-east-1#/functions/Mobius_edx_Grader?tab=graph
ARN: arn:aws:lambda:us-east-1:114056409474:function:Mobius_edx_Grader

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

#### build the code
In a command prompt in the project folder, simply do `tsc`. A *dist* folder will be created with the built javascript code.

#### Deploy the code
1. Put the content of the **dist** folder into a .zip file. The name of the .zip file does not matter. Make sure that the .zip file structure is as follow (an example zip file can be found in zip_example folder):
    ```
    . zip_file.zip
    └── core
    |   └── ...
    |   └── ...
    └── libs
    |   └── ...
    |   └── ...
    └── model
    |   └── ...
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
2. upload the node_modules .zip file. the file must be in this specific structure (an example zip file can be found in zip_example folder):
    ```
    . zip_file.zip
    └── nodejs
        └── node_modules
            └── package1
            |   └── ...
            └── package2
            |   └── ...
            └── package3
            |   └── ...
            └── ...
    ```

More on this can be read here: https://medium.com/@anjanava.biswas/nodejs-runtime-environment-with-aws-lambda-layers-f3914613e20e
## AWS API Gateway

