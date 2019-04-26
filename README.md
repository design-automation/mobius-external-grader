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
1. Put the content of the **dist** folder into a .zip file. The name of the .zip file does not matter. Make sure that the .zip file structure is as follow:
    zip_file.zip
    |---core
    |   |---...
    |---libs
    |   |---...
    |---model
    |   |---...
    |---grader.js
2. Go to the lambda function *Configuration* page, *Function code* panel, in the *Code entry type* dropdown menu, select "Upload a .zip file". Upload the .zip file and press **Save** on the top right corner of the page
