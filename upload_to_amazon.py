# TO USE THIS FILE:
# _ do: pip install boto3
# _ rename __AMAZON_KEY__.template.py to __AMAZON_KEY__.py and add your own amazon access id and key to the file

import boto3
import os
import zipfile
import json
import __AMAZON_KEY__

aws_access_key_id = __AMAZON_KEY__.aws_access_key_id
aws_secret_access_key = __AMAZON_KEY__.aws_secret_access_key

DEV_FUNCTION  = 'arn:aws:lambda:us-east-1:114056409474:function:Mobius_edx_Grader_DEV'
MAIN_FUNCTION = 'arn:aws:lambda:us-east-1:114056409474:function:Mobius_edx_Grader'

FUNC_NAME = DEV_FUNCTION



def zipdir(path, ziph):
    # ziph is zipfile handle
    for root, dirs, files in os.walk(path):
        for file in files:
            ziph.write(os.path.join(root, file), os.path.join(root[5:], file))


def upload_to_amazon(zipfile):
    lambda_client = boto3.client('lambda', 
                    region_name='us-east-1',
                    aws_access_key_id = aws_access_key_id,
                    aws_secret_access_key = aws_secret_access_key)

    lambda_client.update_function_code(FunctionName= FUNC_NAME, ZipFile=zipfile)


if __name__ == '__main__':
    zipf = zipfile.ZipFile('zipped_file/zip_grader.zip', 'w', zipfile.ZIP_DEFLATED)
    zipdir('dist/', zipf)
    zipf.close()
    zippedFile = open('zipped_file/zip_grader.zip', 'rb').read()

    upload_to_amazon(zipfile)
    

